#!/usr/bin/env node

/**
 * 云褍实用工具 v3 - 开发环境启动脚本
 * 
 * 功能：
 * 1. 启动 Python 后端服务
 * 2. 启动 Vite 前端开发服务器
 * 3. 等待两者就绪后启动 Electron
 * 4. 优雅处理进程退出
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.dim}[DEBUG]${colors.reset} ${msg}`),
}

// 进程管理
const processes = new Map()
let isShuttingDown = false

// 检查端口是否可用
function checkPort(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const check = () => {
      const req = http.get(`http://${host}:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true)
        } else {
          retry()
        }
      })
      
      req.on('error', () => {
        retry()
      })
      
      req.setTimeout(1000, () => {
        req.destroy()
        retry()
      })
    }
    
    const retry = () => {
      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }
      setTimeout(check, 500)
    }
    
    check()
  })
}

// 检查前端服务器
function checkFrontend(host, port, timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const check = () => {
      const req = http.get(`http://${host}:${port}`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve(true)
        } else {
          retry()
        }
      })
      
      req.on('error', () => {
        retry()
      })
      
      req.setTimeout(1000, () => {
        req.destroy()
        retry()
      })
    }
    
    const retry = () => {
      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }
      setTimeout(check, 500)
    }
    
    check()
  })
}

// 启动进程
function startProcess(name, command, args, options = {}) {
  log.info(`Starting ${name}...`)
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    ...options,
  })
  
  processes.set(name, proc)
  
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.dim}[${name}]${colors.reset} ${line}`)
      }
    })
  })
  
  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.yellow}[${name}]${colors.reset} ${line}`)
      }
    })
  })
  
  proc.on('close', (code) => {
    log.warn(`${name} exited with code ${code}`)
    processes.delete(name)
    
    if (!isShuttingDown && code !== 0 && code !== null) {
      log.error(`${name} crashed unexpectedly`)
      shutdown(1)
    }
  })
  
  proc.on('error', (err) => {
    log.error(`Failed to start ${name}: ${err.message}`)
    shutdown(1)
  })
  
  return proc
}

// 停止进程
function stopProcess(name) {
  const proc = processes.get(name)
  if (proc) {
    log.info(`Stopping ${name}...`)
    
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t'])
    } else {
      proc.kill('SIGTERM')
      
      // 给进程一些时间优雅关闭
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL')
        }
      }, 3000)
    }
    
    processes.delete(name)
  }
}

// 关闭所有进程
function shutdown(code = 0) {
  if (isShuttingDown) return
  isShuttingDown = true
  
  log.info('Shutting down...')
  
  // 停止所有进程
  for (const [name] of processes) {
    stopProcess(name)
  }
  
  // 等待进程退出
  setTimeout(() => {
    log.success('All processes stopped')
    process.exit(code)
  }, 1000)
}

// 主函数
async function main() {
  log.info('=================================')
  log.info('  云褍实用工具 v3 - 开发环境')
  log.info('=================================')
  
  // 检查必要文件
  const backendPath = path.join(__dirname, '..', 'backend')
  const frontendPath = path.join(__dirname, '..', 'frontend')
  const mainPyPath = path.join(backendPath, 'main.py')
  
  if (!fs.existsSync(mainPyPath)) {
    log.error(`backend/main.py not found at ${mainPyPath}`)
    process.exit(1)
  }
  
  if (!fs.existsSync(frontendPath)) {
    log.error(`frontend directory not found at ${frontendPath}`)
    process.exit(1)
  }
  
  // 检测 Python 命令
  let pythonCommand = 'python3'
  try {
    require('child_process').execSync('which python3', { stdio: 'ignore' })
  } catch {
    try {
      require('child_process').execSync('which python', { stdio: 'ignore' })
      pythonCommand = 'python'
    } catch {
      log.error('Python not found. Please install Python 3.8+')
      process.exit(1)
    }
  }
  
  log.info(`Using Python command: ${pythonCommand}`)
  
  // 设置环境变量
  process.env.NODE_ENV = 'development'
  
  // 启动后端
  const backendProc = startProcess(
    'backend',
    pythonCommand,
    ['-m', 'uvicorn', 'main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
    { cwd: backendPath, env: { ...process.env, PYTHONPATH: backendPath } }
  )
  
  // 等待后端就绪
  log.info('Waiting for backend to be ready...')
  const backendReady = await checkPort('127.0.0.1', 8000, 30000)
  if (!backendReady) {
    log.error('Backend failed to start within timeout')
    shutdown(1)
    return
  }
  log.success('Backend is ready!')
  
  // 启动前端
  const frontendProc = startProcess(
    'frontend',
    'npm',
    ['run', 'dev'],
    { cwd: frontendPath }
  )
  
  // 等待前端就绪
  log.info('Waiting for frontend to be ready...')
  const frontendReady = await checkFrontend('localhost', 5173, 60000)
  if (!frontendReady) {
    log.error('Frontend failed to start within timeout')
    shutdown(1)
    return
  }
  log.success('Frontend is ready!')
  
  // 启动 Electron
  log.info('Starting Electron...')
  const electronProc = startProcess(
    'electron',
    'electron',
    ['.'],
    { 
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        VITE_DEV_SERVER_URL: 'http://localhost:5173'
      }
    }
  )
  
  log.success('All services started successfully!')
  log.info('Press Ctrl+C to stop all services')
  
  // 处理信号
  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
  process.on('exit', () => shutdown(0))
  
  // 处理异常
  process.on('uncaughtException', (err) => {
    log.error('Uncaught exception:', err)
    shutdown(1)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason)
    shutdown(1)
  })
}

// 运行主函数
main().catch(err => {
  log.error('Failed to start:', err)
  shutdown(1)
})
