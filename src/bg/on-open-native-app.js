'use strict';
/*
A handler for an extension message named 'OpenNativeApp'.

TODO native app should cleanup garbage files following a user script uninstall.
TODO reconnect to native app if it disconnects due to error.
*/

(function() {


let nativeApp = greasyhost.connect()

nativeApp.onMessage(function(message) {
  if (message.error) {
    console.warn('native app:', message.error)
  } else if (message.file && !message.deleted) {
    fileChanged(message.file)
      .catch(e => console.error('native app:', e))
  }
})

nativeApp.onDisconnect(function() {
  nativeApp = null
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
  const { appConfig } = await browser.storage.local.get('appConfig')
  if (!appConfig.enabled || !appConfig.process || !appConfig.args)
    throw new Error('external editor not configured.')

  nativeApp.postMessage({
    fileName: userScript.uuid + '.js',
    content: userScript.content,
    processName: appConfig.process,
    processArgs: appConfig.args
  })
}

function onOpenNativeApp(message, sender, sendResponse) {
  return handleExtensionMessage(message.uuid)
    .catch(e => {
      console.warn('native app:', e)
      return window.openUserScriptEditor(message.uuid)
    })
}
window.onOpenNativeApp = onOpenNativeApp;

})();
