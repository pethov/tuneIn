#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

const backendDir = path.resolve(__dirname, '..', '..', 'backend')
const frontendDir = path.resolve(__dirname, '..')

function spawnProcess(cmd, args, cwd) {
  const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
  p.on('exit', (code, sig) => {
    if (code !== null) process.exit(code)
    if (sig) process.kill(process.pid, sig)
  })
  return p
}

const backend = spawnProcess('npm', ['run', 'dev'], backendDir)
// Force Vite to use port 5173 so Playwright's webServer port matches the launched dev server.
// npm's "--" passes subsequent args to the script; Vite accepts --port.
const frontend = spawnProcess('npm', ['run', 'dev', '--', '--port', '5173'], frontendDir)

function shutdown() {
  try {
    backend.kill('SIGTERM')
  } catch (e) {}
  try {
    frontend.kill('SIGTERM')
  } catch (e) {}
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// keep the process alive
process.stdin.resume()
