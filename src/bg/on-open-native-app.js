'use strict';
/*
A handler for an extension message named 'OpenNativeApp'.

TODO native app should cleanup garbage files following a user script uninstall.
TODO reconnect to native app if it disconnects due to error.
*/

(function() {


let fileWatcher = chrome.runtime.connectNative('io.greasyhost.watch')

fileWatcher.onMessage.addListener(function(message) {
  if (message.error)
    return
  if (message.file && !message.deleted) {
    fileChanged(message.file)
      .catch(e => console.error('native app:', e))
  }
})

fileWatcher.onDisconnect.addListener(function() {
  fileWatcher = null
})


async function fileChanged(fileName) {
  const uuidFromName = fileName.split('.')[0]
  const userScript = UserScriptRegistry.scriptByUuid(uuidFromName)

  const downloader = new UserScriptDownloader()
  downloader.setKnownUuid(uuidFromName)
  downloader.setScriptUrl(userScript.downloadUrl)
  downloader.setScriptContent(greasyhost.read(fileName))
  await downloader.start()

  const [userScriptDetails, downloaderDetails] = await Promise.all([
    downloader.scriptDetails,
    downloader.details()
  ])

  await window.onUserScriptInstall({
    userScript: userScriptDetails,
    downloader: downloaderDetails
  })
}

async function handleExtensionMessage(scriptUuid) {
  const userScript = UserScriptRegistry.scriptByUuid(scriptUuid)
  const fileName = userScript.uuid + '.js'

  const { appConfig } = await browser.storage.local.get('appConfig')
  if (!appConfig.enabled || !appConfig.cmd || !appConfig.args)
    throw new Error('external editor not configured.')

  if (!fileWatcher)
    throw new Error('file watcher not connected')

  await greasyhost.write(fileName, userScript.content)
  fileWatcher.postMessage({ file: fileName })
  await greasyhost.spawn(fileName, appConfig.cmd, appConfig.args)
}

function onOpenNativeApp(message, sender, sendResponse) {
  sendResponse()
  handleExtensionMessage(message.uuid)
    .catch(e => {
      console.warn('native app:', e)
      window.openUserScriptEditor(message.uuid)
    })
}
window.onOpenNativeApp = onOpenNativeApp;

})();
