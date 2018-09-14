'use strict'

const greasyhost = {}

greasyhost.read = async function(fileName) {
  const port = chrome.runtime.connectNative('io.greasyhost.read')

  const chunks = await new Promise(function(resolve, reject) {
    const incomingChunks = []

    port.onMessage.addListener(function(message) {
      if (message.text == null) {
        port.disconnect()
        if (message.error)
          return reject(message.error)
        resolve(incomingChunks)
      } else {
        incomingChunks.push(message.text)
      }
    })

    port.onDisconnect.addListener(function() {
      reject(chrome.runtime.lastError)
    })

    port.postMessage(fileName)
  })

  return chunks.join('')
}

greasyhost.write = async function(fileName, content, chunkSize = 65536) {
  const port = chrome.runtime.connectNative('io.greasyhost.write')

  function* chop(text) {
    const blocks = Math.max(1, Math.ceil(text.length / chunkSize))
    for (let i = 0, offset = 0; i < blocks; ++i, offset += chunkSize)
      yield text.substr(offset, chunkSize)
  }

  await new Promise(function(resolve, reject) {
    port.onMessage.addListener(function(message) {
      port.disconnect()
      if (message.error)
        return reject(message.error)
      resolve()
    })

    port.onDisconnect.addListener(function() {
      reject(chrome.runtime.lastError)
    })

    port.postMessage(fileName)

    for (const text of chop(content))
      port.postMessage({ text })

    port.postMessage({ text: null })
  })
}

greasyhost.connect = function() {
  const spawnPort = chrome.runtime.connectNative('io.greasyhost.spawn')
  const watchPort = chrome.runtime.connectNative('io.greasyhost.watch')
  let connected = true

  async function postMessage(message) {
    if (!connected)
      throw new Error('greasyhost.connect: not connected')
    await greasyhost.write(message.fileName, message.content)
    spawnPort.postMessage({
      file: message.fileName,
      process: message.processName,
      args: message.processArgs
    })
    watchPort.postMessage({
      file: message.fileName
    })
  }

  function onMessage(callback) {
    spawnPort.onMessage.addListener(callback)
    watchPort.onMessage.addListener(callback)
  }

  function onDisconnect(callback) {
    spawnPort.onDisconnect.addListener(finished)
    watchPort.onDisconnect.addListener(finished)
    function finished() {
      if (connected) {
        disconnect()
        callback()
      }
    }
  }

  function disconnect() {
    spawnPort.disconnect()
    watchPort.disconnect()
    connected = false
  }

  return {
    postMessage,
    onMessage,
    onDisconnect,
    disconnect
  }
}
