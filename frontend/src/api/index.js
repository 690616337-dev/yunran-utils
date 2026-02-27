import axios from 'axios'

// 获取API基础URL
const getBaseURL = () => {
  // 开发环境使用本地后端
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api'
  }
  // 生产环境 - Electron中通过IPC通信，不需要直接访问后端
  // 但在开发模式下仍然需要
  return 'http://127.0.0.1:8000/api'
}

// 创建 axios 实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 120000, // 120秒超时（处理大文件）
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    // 统一错误处理
    let errorMessage = '请求失败'
    
    if (error.response) {
      // 服务器返回错误
      const { status, data } = error.response
      console.error(`[API Error] ${status}:`, data)
      
      switch (status) {
        case 400:
          errorMessage = data?.detail || '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          break
        case 403:
          errorMessage = '禁止访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 413:
          errorMessage = '文件太大'
          break
        case 500:
          errorMessage = data?.detail || '服务器内部错误'
          break
        case 501:
          errorMessage = data?.detail || '功能尚未实现'
          break
        case 503:
          errorMessage = data?.detail || '服务暂时不可用'
          break
        default:
          errorMessage = data?.detail || `服务器错误 (${status})`
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('[API Network Error]', error.request)
      if (error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请检查网络连接或稍后重试'
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = '无法连接到服务器，请确保后端服务已启动'
      } else {
        errorMessage = '网络错误，请检查网络连接'
      }
    } else {
      // 请求配置出错
      console.error('[API Config Error]', error.message)
      errorMessage = `请求配置错误: ${error.message}`
    }
    
    // 将错误信息附加到error对象上
    error.userMessage = errorMessage
    return Promise.reject(error)
  }
)

// ==================== 身份证工具 API ====================

/**
 * 验证身份证号码
 * @param {string} idCard - 身份证号码
 * @returns {Promise} 验证结果
 */
export const validateIdCard = (idCard) => {
  if (!idCard || !idCard.trim()) {
    return Promise.reject(new Error('身份证号码不能为空'))
  }
  const formData = new FormData()
  formData.append('id_card', idCard.trim())
  return api.post('/idcard/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 生成身份证号码
 * @param {Object} params - 生成参数
 * @param {string} params.areaCode - 地区代码
 * @param {string} params.birthDate - 出生日期
 * @param {string} params.gender - 性别
 * @param {number} params.count - 生成数量
 * @returns {Promise} 生成的身份证号码列表
 */
export const generateIdCard = (params = {}) => {
  const formData = new FormData()
  if (params.areaCode) formData.append('area_code', params.areaCode)
  if (params.birthDate) formData.append('birth_date', params.birthDate)
  if (params.gender) formData.append('gender', params.gender)
  if (params.count) {
    const count = Math.min(Math.max(1, parseInt(params.count) || 1), 50)
    formData.append('count', count)
  }
  return api.post('/idcard/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 获取地区列表
 * @returns {Promise} 地区列表
 */
export const getAreas = () => {
  return api.get('/idcard/areas')
}

// ==================== PDF 合并 API ====================

/**
 * 合并 PDF 文件
 * @param {File[]} files - PDF文件数组
 * @param {Function} onProgress - 进度回调函数 (progress: number) => void
 * @returns {Promise} 合并后的 PDF 文件
 */
export const mergePdf = (files, onProgress) => {
  if (!files || files.length === 0) {
    return Promise.reject(new Error('请选择至少一个PDF文件'))
  }
  
  const formData = new FormData()
  files.forEach((file, index) => {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`文件 ${file.name} 超过50MB限制`)
    }
    formData.append('files', file)
  })
  
  return api.post('/pdf/merge', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })
}

// ==================== 照片抠图 API ====================

/**
 * 移除图片背景
 * @param {File} file - 图片文件
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise} 处理后的图片
 */
export const removeBackground = (file, onProgress) => {
  if (!file) {
    return Promise.reject(new Error('请选择图片文件'))
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return Promise.reject(new Error('不支持的文件格式，请上传 JPG、PNG、BMP 或 WebP 格式的图片'))
  }
  
  if (file.size > 20 * 1024 * 1024) {
    return Promise.reject(new Error('文件大小超过20MB限制'))
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/photo/remove-bg', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })
}

/**
 * 更换证件照背景色
 * @param {File} file - 图片文件
 * @param {string} color - 背景色 (hex格式，如 #ffffff)
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise} 处理后的图片
 */
export const changeBackground = (file, color = '#ffffff', onProgress) => {
  if (!file) {
    return Promise.reject(new Error('请选择图片文件'))
  }
  
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return Promise.reject(new Error('不支持的文件格式，请上传 JPG、PNG、BMP 或 WebP 格式的图片'))
  }
  
  if (file.size > 20 * 1024 * 1024) {
    return Promise.reject(new Error('文件大小超过20MB限制'))
  }
  
  // 验证颜色格式
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  if (!colorRegex.test(color)) {
    return Promise.reject(new Error('无效的颜色格式，请使用hex格式如 #ffffff'))
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('color', color)
  
  return api.post('/photo/change-bg', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })
}

// ==================== 音频转换 API ====================

/**
 * 转换音频格式
 * @param {File} file - 音频文件
 * @param {string} format - 目标格式 (mp3, wav, aac, flac, ogg)
 * @param {string} bitrate - 比特率 (如 192k)
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise} 转换后的音频文件
 */
export const convertAudio = (file, format = 'mp3', bitrate = '192k', onProgress) => {
  if (!file) {
    return Promise.reject(new Error('请选择音频文件'))
  }
  
  if (file.size > 100 * 1024 * 1024) {
    return Promise.reject(new Error('文件大小超过100MB限制'))
  }
  
  const allowedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma']
  if (!allowedFormats.includes(format.toLowerCase())) {
    return Promise.reject(new Error(`不支持的格式: ${format}，支持的格式: ${allowedFormats.join(', ')}`))
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format', format)
  formData.append('bitrate', bitrate)
  
  return api.post('/audio/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    timeout: 300000, // 音频转换可能需要更长时间
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  })
}

// ==================== 视频转换 API（预留）====================

/**
 * 转换视频格式（预留）
 * @param {File} file - 视频文件
 * @param {string} format - 目标格式
 * @param {string} resolution - 分辨率
 * @returns {Promise} 转换后的视频文件
 */
export const convertVideo = (file, format = 'mp4', resolution = 'original') => {
  if (!file) {
    return Promise.reject(new Error('请选择视频文件'))
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format', format)
  formData.append('resolution', resolution)
  
  return api.post('/video/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })
}

/**
 * 获取视频转换功能状态
 * @returns {Promise} 功能状态
 */
export const getVideoStatus = () => {
  return api.get('/video/status')
}

// ==================== 健康检查 API ====================

/**
 * 健康检查
 * @returns {Promise} 服务状态
 */
export const healthCheck = () => {
  return api.get('/health')
}

/**
 * 获取服务状态
 * @returns {Promise} 详细服务状态
 */
export const getStatus = () => {
  return api.get('/status')
}

/**
 * 手动触发临时文件清理
 * @returns {Promise} 清理结果
 */
export const cleanupTempFiles = () => {
  return api.post('/cleanup')
}

// ==================== 工具函数 ====================

/**
 * 下载Blob文件
 * @param {Blob} blob - 文件Blob
 * @param {string} filename - 文件名
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default api
