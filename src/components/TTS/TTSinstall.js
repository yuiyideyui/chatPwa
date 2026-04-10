let audioCtx = null;

let ttsWorker = null;

let Module = {
  setStatus: function (status, loaded, total,ttsDownloadingProgress) {
    console.info(`TTS Status: ${status} (${loaded}/${total})`);
    if(loaded && total){
      ttsDownloadingProgress.value = Math.round((loaded / total) * 100);
    }
  }
}
const initTTSWorker = (resolve,ttsDownloadingProgress) => {
  const worker = new Worker(new URL("@/worker/sherpa-onnx-tts.worker.js", import.meta.url));
  ttsWorker = worker;

  let ttsInstanceInfo = {
    numSpeakers: 0,
    isReady: false,
  };

  worker.onmessage = (e) => {
    const { type, status, numSpeakers, samples, sampleRate, loaded, total } = e.data;
    if (type === "sherpa-onnx-tts-progress") {
      Module.setStatus(status, loaded, total,ttsDownloadingProgress);
    }

    if (type === "sherpa-onnx-tts-ready") {
      ttsInstanceInfo.numSpeakers = numSpeakers;
      ttsInstanceInfo.isReady = true;
      console.log("TTS Engine Ready");
      resolve();
    }

    if (type === "sherpa-onnx-tts-result") {
      // 收到音频数据，立即播放
      playAudioBuffer(samples, sampleRate);
      // 同时生成可下载或引用的 Blob
      createAudioTag({ samples, sampleRate });
    }
  };
}
/**
 * 初始化 TTS
 */
export const installTTS = async (ttsDownloadingProgress) => {
  if(!ttsWorker) {
    await new Promise((resolve) => {
      initTTSWorker(resolve,ttsDownloadingProgress);
    })
  }
  return {
    /**
     * @param {string} text 要播放的文字
     * @param {number} speakerId 说话人 ID (默认为 0)
     * @param {number} speed 语速 (默认为 1.0)
     */
    speak: (text, speakerId = 0, speed = 1.0) => {
      if (!ttsWorker) return console.error("Worker not initialized");
      
      // 发送消息给 Worker 开始推理
      ttsWorker.postMessage({
        type: "generate",
        text: text,
        speakerId: speakerId,
        speed: speed
      });
    }
  };
}

/**
 * 播放音频采样数据
 */
function playAudioBuffer(samples, sampleRate) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
  }

  // 如果音频上下文处于挂起状态（浏览器安全策略），尝试恢复
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

/**
 * 生成 WAV Blob (保留你原有的逻辑)
 */
function createAudioTag(generateAudio) {
  const blob = toWav(generateAudio.samples, generateAudio.sampleRate);
  // 这里可以根据需要处理 blob，比如生成 URL
  // const url = URL.createObjectURL(blob);
  return blob;
}

// this function is copied/modified from
// https://gist.github.com/meziantou/edb7217fddfbb70e899e
function toWav(floatSamples, sampleRate) {
  let samples = new Int16Array(floatSamples.length);
  for (let i = 0; i < samples.length; ++i) {
    let s = floatSamples[i];
    if (s >= 1)
      s = 1;
    else if (s <= -1)
      s = -1;

    samples[i] = s * 32767;
  }

  let buf = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buf);

  // http://soundfile.sapp.org/doc/WaveFormat/
  //                   F F I R
  view.setUint32(0, 0x46464952, true);               // chunkID
  view.setUint32(4, 36 + samples.length * 2, true);  // chunkSize
  //                   E V A W
  view.setUint32(8, 0x45564157, true);  // format
  //
  //                      t m f
  view.setUint32(12, 0x20746d66, true);          // subchunk1ID
  view.setUint32(16, 16, true);                  // subchunk1Size, 16 for PCM
  view.setUint32(20, 1, true);                   // audioFormat, 1 for PCM
  view.setUint16(22, 1, true);                   // numChannels: 1 channel
  view.setUint32(24, sampleRate, true);          // sampleRate
  view.setUint32(28, sampleRate * 2, true);      // byteRate
  view.setUint16(32, 2, true);                   // blockAlign
  view.setUint16(34, 16, true);                  // bitsPerSample
  view.setUint32(36, 0x61746164, true);          // Subchunk2ID
  view.setUint32(40, samples.length * 2, true);  // subchunk2Size

  let offset = 44;
  for (let i = 0; i < samples.length; ++i) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}
