const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const log = require('electron-log')

// 配置日志
log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow
let pythonProcess = null
let pythonReady = false

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 获取Backend可执行文件路径
function getBackendExecutablePath() {
  if (isDev) {
    // 开发环境：使用 Python 运行 main.py
    return null // 返回 null 表示使用 Python 脚本模式
  }
  
  // 生产环境：使用打包后的可执行文件
  const resourcesPath = process.resourcesPath
  const backendDir = path.join(resourcesPath, 'backend')
  
  // 根据平台选择可执行文件
  const executableName = process.platform === 'win32' ? 'backend.exe' : 'backend'
  const executablePath = path.join(backendDir, executableName)
  
  if (fs.existsSync(executablePath)) {
    log.info(`Using bundled backend executable: ${executablePath}`)
    return executablePath
  }
  
  log.warn('Bundled backend executable not found, falling back to Python script mode')
  return null
}

// 获取Python可执行文件路径（仅用于开发环境或回退）
function getPythonPath() {
  if (isDev) {
    // 开发环境：尝试使用 python3 或 python
    const pythonCommands = ['python3', 'python']
    for (const cmd of pythonCommands) {
      try {
        const result = require('child_process').execSync(`which ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        if (result.trim()) {
          log.info(`Found Python at: ${result.trim()}`)
          return cmd
        }
      } catch (e) {
        // 继续尝试下一个
      }
    }
    log.warn('Could not find python3 or python, defaulting to "python"')
    return 'python'
  }
  
  // 生产环境：回退到系统 Python
  log.warn('Using system Python as fallback')
  return 'python3'
}

// 获取backend目录路径
function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'backend')
  }
  return path.join(process.resourcesPath, 'backend')
}

// 检查Python后端是否就绪
async function checkPythonHealth(maxRetries = 30, interval = 1000) {
  const fetch = (await import('node-fetch')).default
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/health', { timeout: 2000 })
      if (response.ok) {
        const data = await response.json()
        log.info('Python backend is ready:', data)
        return true
      }
    } catch (error) {
      log.debug(`Health check attempt ${i + 1}/${maxRetries} failed`)
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  return false
}

// 启动Python后端服务
async function startPythonBackend() {
  const backendPath = getBackendPath()
  const executablePath = getBackendExecutablePath()
  
  log.info('Starting Python backend...')
  log.info('Backend path:', backendPath)
  
  let pyProcess
  
  if (executablePath) {
    // 使用打包后的可执行文件
    log.info('Using bundled executable:', executablePath)
    
    const env = {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    }
    
    pyProcess = spawn(executablePath, [], {
      cwd: backendPath,
      env: env,
      stdio: 'pipe'
    })
  } else {
    // 使用 Python 脚本模式（开发环境或回退）
    const mainPyPath = path.join(backendPath, 'main.py')
    
    // 检查main.py是否存在
    if (!fs.existsSync(mainPyPath)) {
      log.error('main.py not found:', mainPyPath)
      throw new Error(`main.py not found at ${mainPyPath}`)
    }
    
    const pythonPath = getPythonPath()
    log.info('Using Python script mode:', pythonPath)
    
    const env = {
      ...process.env,
      PYTHONPATH: backendPath,
      PYTHONUNBUFFERED: '1',
    }
    
    pyProcess = spawn(pythonPath, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: backendPath,
      env: env,
      stdio: 'pipe'
    })
  }
  
  pyProcess.stdout.on('data', (data) => {
    const message = data.toString().trim()
    log.info(`[Python] ${message}`)
    // 检测Uvicorn启动成功
    if (message.includes('Uvicorn running') || message.includes('Application startup complete')) {
      pythonReady = true
    }
  })
  
  pyProcess.stderr.on('data', (data) => {
    const message = data.toString().trim()
    log.error(`[Python Error] ${message}`)
  })
  
  pyProcess.on('close', (code) => {
    log.warn(`Python process exited with code ${code}`)
    pythonReady = false
    pythonProcess = null
  })
  
  pyProcess.on('error', (err) => {
    log.error('Failed to start Python process:', err)
    throw err
  })
  
  // 等待后端就绪
  log.info('Waiting for Python backend to be ready...')
  const isReady = await checkPythonHealth(30, 1000)
  if (!isReady) {
    log.error('Python backend failed to start within timeout')
    throw new Error('Python backend failed to start')
  }
  
  pythonReady = true
  log.info('Python backend started successfully')
  return pyProcess
}

// 停止Python后端服务
function stopPythonBackend() {
  if (pythonProcess) {
    log.info('Stopping Python backend...')
    try {
      // 尝试优雅关闭
      if (process.platform === 'win32') {
        pythonProcess.kill('SIGTERM')
      } else {
        pythonProcess.kill('SIGTERM')
        // 给进程一些时间优雅关闭
        setTimeout(() => {
          if (pythonProcess && !pythonProcess.killed) {
            log.warn('Force killing Python process')
            pythonProcess.kill('SIGKILL')
          }
        }, 3000)
      }
    } catch (err) {
      log.error('Error stopping Python process:', err)
    }
    pythonProcess = null
    pythonReady = false
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false, // 先不显示，等加载完成后再显示
    backgroundColor: '#ffffff'
  })
  
  // 加载页面
  if (isDev) {
    // 开发环境：加载Vite开发服务器
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    log.info('Loading dev URL:', devUrl)
    mainWindow.loadURL(devUrl)
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：加载打包后的文件
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
    log.info('Loading production file:', indexPath)
    if (!fs.existsSync(indexPath)) {
      log.error('index.html not found:', indexPath)
      // 尝试替代路径
      const altPath = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html')
      log.info('Trying alternative path:', altPath)
      mainWindow.loadFile(altPath)
    } else {
      mainWindow.loadFile(indexPath)
    }
  }
  
  // 窗口加载完成后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })
  
  // 处理加载失败
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription)
    if (isDev) {
      // 开发环境重试
      setTimeout(() => {
        mainWindow.loadURL(devUrl)
      }, 1000)
    }
  })
  
  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Electron应用就绪
app.whenReady().then(async () => {
  try {
    // 启动Python后端
    pythonProcess = await startPythonBackend()
    
    // 创建窗口
    createWindow()
    
    // macOS: 点击dock图标时重新创建窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    log.error('Failed to start application:', error)
    // 显示错误对话框
    const { dialog } = require('electron')
    dialog.showErrorBox('启动错误', `无法启动应用程序: ${error.message}`)
    app.quit()
  }
})

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 停止Python后端
  stopPythonBackend()
  
  // macOS上通常不退出应用
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前的处理
app.on('before-quit', () => {
  stopPythonBackend()
})

// IPC通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-platform', () => {
  return process.platform
})

// 健康检查
ipcMain.handle('check-health', async () => {
  try {
    const fetch = (await import('node-fetch')).default
    const response = await fetch('http://127.0.0.1:8000/api/health')
    return await response.json()
  } catch (error) {
    log.error('Health check failed:', error)
    return { status: 'error', message: error.message }
  }
})

// 获取Python后端状态
ipcMain.handle('get-backend-status', () => {
  return {
    ready: pythonReady,
    pid: pythonProcess ? pythonProcess.pid : null
  }
})
