const http = require('http')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const distDir = path.join(__dirname, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('500 Internal Server Error')
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  })
}

if (!fs.existsSync(distDir)) {
  console.error('未找到 dist 目录，请先执行 npm run build')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  const safePath = path.normalize(urlPath).replace(/^([.][.][/\\])+/, '')
  let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath)

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    fs.access(filePath, fs.constants.F_OK, (accessErr) => {
      if (!accessErr) {
        sendFile(res, filePath)
        return
      }

      sendFile(res, path.join(distDir, 'index.html'))
    })
  })
})

server.listen(0, '127.0.0.1', () => {
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 4173
  const url = `http://127.0.0.1:${port}`

  console.log(`Gantt Graph 已启动: ${url}`)
  console.log('关闭窗口或按 Ctrl+C 退出')

  exec(`start "" "${url}"`, { shell: true })
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
