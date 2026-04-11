
const STORE_NAME = "tts";

/**
 * 打开数据库
 */
function openDB(DB_NAME, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject("DB_OPEN_ERROR");

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // 使用 keyPath 或默认
      }
    };
  });
}

/**
 * 保存语音包数据
 * @param key 语音包的标识（通常用 packageName URL）
 * @param data 下载得到的 ArrayBuffer
 */
async function savePackage(key, data) {
  const db = await openDB(STORE_NAME)
  return new Promise((resolve, reject) => {
    // 基础校验：如果数据长度为 0，说明 buffer 已被转移或下载失败
    if (!data || data.byteLength === 0) {
      console.error("尝试保存空的语音包数据");
      return reject("EMPTY_DATA");
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // 明确克隆一份数据进行存储，防止引用冲突
    const request = store.put(data.slice(0), key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject("SAVE_ERROR");
  });
}
/**
 * 获取缓存的语音包
 */
async function getPackage(key) {
  const db = await openDB(STORE_NAME)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("GET_ERROR");
  });
}

/**
 * 全部删除（清空整个 tts 仓库）
 */
async function clearAllPackages() {
  try {
    const db = await openDB(DB_NAME); // 确保 DB_NAME 一致
    const transaction = db.transaction([STORE_NAME], "readwrite");
    transaction.objectStore(STORE_NAME).clear();

    await new Promise((resolve) => {
      transaction.oncomplete = () => {
        db.close(); // 彻底释放句柄
        resolve();
      };
    });

    self.postMessage({ type: "sherpa-onnx-tts-clear-success" });
    
    // 关键：清理完后让 Worker 线程自己停止，释放所有隔离资源
    setTimeout(() => self.close(), 100); 
  } catch (e) {
    self.postMessage({ type: "sherpa-onnx-tts-clear-failed" });
  }
}
let tts = null;
self.Module = {
  // https://emscripten.org/docs/api_reference/module.html#Module.locateFile
  locateFile: function (path, scriptDirectory = "") {
    scriptDirectory = "/sherpa-onnx/";
    return scriptDirectory + path;
  },

  cache: {
    getDb: getPackage,
    setDb: savePackage,
  },

  // https://emscripten.org/docs/api_reference/module.html#Module.locateFile
  setStatus: function (status, type, loaded, total) {
    self.postMessage({ type: "sherpa-onnx-tts-progress", status, loaded, total });
  },
  onRuntimeInitialized: function () {
    console.log("Model files downloaded!");
    console.log("Initializing tts ......");
    try {
      tts = createOfflineTts(self.Module);
      self.postMessage({
        type: "sherpa-onnx-tts-ready",
        numSpeakers: tts.numSpeakers,
      });
    } catch (e) {
      self.postMessage({
        type: "error",
        message: "TTS Initialization failed: " + e.message,
      });
    }
  },
};


var typeMap = {
  'generate': (data) => {
    const { type, text, sid, speed } = data;
    if (!tts) {
      return;
    }
    try {
      const audio = tts.generate({
        text: text,
        sid: sid || 0,
        speed: speed || 1.0,
      });
      const samples = audio.samples;
      const sampleRate = tts.sampleRate;
      self.postMessage(
        {
          type: "sherpa-onnx-tts-result",
          samples: samples,
          sampleRate: sampleRate,
        },
        [samples.buffer],
      );
    } catch (err) {
      self.postMessage({
        type: "error",
        message: "Generation failed: " + err.message,
      });
    }
  },
  'deletePackage': (data) => {
    clearAllPackages()
      .then(() => {
        self.postMessage({ type: "sherpa-onnx-tts-clear-success" });
      })
      .catch((error) => {
        self.postMessage({
          type: "sherpa-onnx-tts-clear-failed",
          error: error,
        });
      });
  }
}
importScripts("/sherpa-onnx/sherpa-onnx-wasm-main-tts.js");
importScripts("/sherpa-onnx/sherpa-onnx-tts.js");
self.onmessage = async (e) => {
  console.log('ttsWorker',e.data);
  const { type, text, sid, speed } = e.data;
  typeMap[type]?.(e.data);
};