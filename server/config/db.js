const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let dbState = {
  isConnected: false,
  mode: 'disconnected', // 'mongodb' | 'file_persistent' | 'disconnected'
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dpp_traceability',
  dataPath: path.join(__dirname, '..', 'data', 'persistent_db.json'),
  error: null,
};

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Persistent File Store Engine (Ensures app works persistently even without local MongoDB installed)
class FilePersistentStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      materialbatches: [],
      components: [],
      assemblies: [],
      products: [],
      shipments: [],
      manufacturingevents: [],
      defects: [],
      auditrecords: [],
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        if (content.trim()) {
          this.data = { ...this.data, ...JSON.parse(content) };
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('[Storage] Notice loading persistent store file, initializing fresh:', err.message);
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Error saving persistent store file:', err.message);
    }
  }

  getCollection(name) {
    const key = name.toLowerCase().replace(/[^a-z]/g, '');
    if (!this.data[key]) {
      this.data[key] = [];
    }
    return this.data[key];
  }
}

const fileStore = new FilePersistentStore(dbState.dataPath);

const net = require('net');

function isPortOpen(host, port, timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.once('timeout', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.once('error', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dpp_traceability';
  dbState.uri = uri;

  // If pointing to localhost/127.0.0.1, quickly check if port 27017 is listening
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    const portOpen = await isPortOpen('127.0.0.1', 27017, 300);
    if (!portOpen) {
      dbState.isConnected = true;
      dbState.mode = 'file_persistent';
      console.log(`[Database] Local MongoDB port 27017 not active. Instant fallback to Persistent File Store at ${dbState.dataPath}`);
      console.log(`[Database] Real-time persistence enabled. All data survives restarts.`);
      return { isConnected: true, mode: 'file_persistent' };
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    dbState.isConnected = true;
    dbState.mode = 'mongodb';
    console.log(`[Database] MongoDB Connected Successfully: ${uri}`);
    return { isConnected: true, mode: 'mongodb' };
  } catch (err) {
    dbState.isConnected = true;
    dbState.mode = 'file_persistent';
    dbState.error = err.message;
    console.log(`[Database] MongoDB not detected at ${uri}.`);
    console.log(`[Database] Switched to Persistent File Store at ${dbState.dataPath}`);
    console.log(`[Database] Real-time persistence enabled. All data survives restarts.`);
    return { isConnected: true, mode: 'file_persistent' };
  }
}

function getDbState() {
  return dbState;
}

module.exports = {
  connectDB,
  getDbState,
  fileStore,
  mongoose,
};
