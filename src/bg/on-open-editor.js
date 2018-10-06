'use strict';
(function() {


const GREASYHOST_ID = 'greasyhost@geckoid.com';


async function receiveFromGreasyHost(scriptUuid, scriptContent) {
  const userScript = UserScriptRegistry.scriptByUuid(scriptUuid);

  const downloader = new UserScriptDownloader();
  downloader.setKnownUuid(scriptUuid);
  downloader.setScriptUrl(userScript.downloadUrl);
  downloader.setScriptContent(scriptContent);
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

async function sendToGreasyHost(scriptUuid) {
  const userScript = UserScriptRegistry.scriptByUuid(scriptUuid);
  const response = await browser.runtime.sendMessage(GREASYHOST_ID, {
    uuid: userScript.uuid,
    content: userScript.content
  });
  if (response && response.error) {
    return Promise.reject(response.error);
  }
}

async function onMessageExternal(message, sender) {
  if (sender.id !== GREASYHOST_ID) {
    throw new Error(`Sender not recognized ${sender.id}`);
  }

  await receiveFromGreasyHost(message.uuid, message.content);
}
browser.runtime.onMessageExternal.addListener(onMessageExternal);


function onOpenEditor(message, sender, sendResponse) {
  sendResponse();
  sendToGreasyHost(message.uuid)
    .catch(error => {
      console.warn('onOpenEditor() rejected', error);
      openUserScriptEditor(message.uuid);
    });
}
window.onOpenEditor = onOpenEditor;

})();
