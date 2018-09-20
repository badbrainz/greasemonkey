'use strict';
/*
TODO reconnect fileWatchPort if it disconnects unexpectedly.
*/

(function() {


let fileWatchPort = chrome.runtime.connectNative('io.greasyhost.watch');

fileWatchPort.onMessage.addListener(function(message) {
  if (message.error) {
    console.warn('Native application non-fatal error', message.error);
  } else if (message.file && !message.deleted) {
    fileChanged(message.file)
      .catch(error => {
        console.error('Native application failed to update script:', error);
      });
  }
});

fileWatchPort.onDisconnect.addListener(function() {
  fileWatchPort = null;
});

async function fileChanged(fileName) {
  const uuidFromName = fileName.split('.')[0];
  const userScript = UserScriptRegistry.scriptByUuid(uuidFromName);

  const downloader = new UserScriptDownloader();
  downloader.setKnownUuid(uuidFromName);
  downloader.setScriptUrl(userScript.downloadUrl);
  downloader.setScriptContent(GreasyHosts.read(fileName));
  await downloader.start();

  const [userScriptDetails, downloaderDetails] = await Promise.all([
    downloader.scriptDetails,
    downloader.details()
  ]);

  await onUserScriptInstall({
    userScript: userScriptDetails,
    downloader: downloaderDetails
  });
}

async function openNativeApplication(scriptUuid) {
  const { appConfig } = await browser.storage.local.get('appConfig');
  if (!appConfig.enabled) {
    return Promise.reject();
  }

  if (!fileWatchPort) {
    throw new Error('Native application not connected');
  }

  const userScript = UserScriptRegistry.scriptByUuid(scriptUuid);
  const fileName = userScript.uuid + '.js';

  await GreasyHosts.write(fileName, userScript.content);
  fileWatchPort.postMessage({ file: fileName });
  await GreasyHosts.spawn(fileName, appConfig.cmd, appConfig.args);
}
window.openNativeApplication = openNativeApplication;

})();
