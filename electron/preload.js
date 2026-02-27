const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 获取平台信息
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // 健康检查
  checkHealth: () => ipcRenderer.invoke('check-health'),
  
  // 平台判断
  isWindows: () => process.platform === 'win32',
  isMac: () => process.platform === 'darwin',
  isLinux: () => process.platform === 'linux',
})

// 添加DOM加载完成事件监听
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded')
})
