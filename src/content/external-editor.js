'use strict';

let application = 'com.greasyhost'
let nativePort = chrome.runtime.connectNative(application)

let receiver = null

// outgoing chunk size
let maxChunkSize = 64 * 1024

// stores incoming data
let incomingChunks = []

// rebuild modified file and notify the listener
nativePort.onMessage.addListener((data) => {
  if (data.chunk) {
    incomingChunks.push(data.content)
  }
  else if (data.end) {
    receiver(incomingChunks.join(''))
    incomingChunks = []
  }
})

nativePort.onDisconnect.addListener(() => {
  console.error(chrome.runtime.lastError)
})

window.externalEditor = {
  onMessage(cb) {
    receiver = cb
  },

  postMessage(text, options) {
    nativePort.postMessage({ options })

    // split the file
    let nBlocks = Math.max(1, Math.ceil(text.length / maxChunkSize))
    for (let i = 0, offset = 0; i < nBlocks; ++i, offset += maxChunkSize) {
      let content = text.substr(offset, maxChunkSize)
      nativePort.postMessage({ chunk: true, content })
    }

    nativePort.postMessage({ end: true })
  }
}
