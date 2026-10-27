/**
 * Universal Digital Product Passport (PS10)
 * Unified Runner Script - Starts both Backend & Frontend in 1 Click
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('🚀 Universal DPP for Smart Traceability (PS10)');
console.log('   Starting Unified Fullstack Environment...');
console.log('================================================================');

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Verify dependencies are installed
if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
  console.log('\n📦 Installing server dependencies...');
  execSync(`${npmCmd} install`, { cwd: serverDir, stdio: 'inherit' });
}

if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
  console.log('\n📦 Installing client dependencies...');
  execSync(`${npmCmd} install`, { cwd: clientDir, stdio: 'inherit' });
}

// 2. Start Backend API Server
console.log('\n▶ Starting Backend Server on port 5001...');
const serverProc = spawn('node', ['index.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5001' },
});

// 3. Start Frontend Vite Server (exposed on 0.0.0.0 for phone/LAN access)
console.log('▶ Starting Frontend Web Application on port 5173...');
const clientProc = spawn(npmCmd, ['run', 'dev', '--', '--host', '0.0.0.0'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true,
});

// Detect reachable Wi-Fi / LAN IP
const os = require('os');
const ifaces = os.networkInterfaces();
let lanIp = '10.1.0.173';
for (const name of Object.keys(ifaces)) {
  for (const net of ifaces[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      if (!lanIp || name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
        lanIp = net.address;
      }
    }
  }
}

console.log('\n================================================================');
console.log('📱 MOBILE & LAN ACCESS (Same Wi-Fi Network):');
console.log(`   🌐 Dashboard URL : http://${lanIp}:5001/dashboard`);
console.log(`   📱 Phone QR Link : http://${lanIp}:5001/dashboard`);
console.log('----------------------------------------------------------------');
console.log('💻 THIS COMPUTER (Localhost):');
console.log('   🌐 Dashboard URL : http://localhost:5001/dashboard');
console.log('   ⚡ Vite Dev UI   : http://localhost:5173');
console.log('   🔌 Backend API   : http://localhost:5001');
console.log('================================================================\n');

function shutdown() {
  console.log('\n🛑 Stopping servers...');
  try {
    serverProc.kill('SIGINT');
    clientProc.kill('SIGINT');
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
