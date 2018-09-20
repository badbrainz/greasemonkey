'use strict';
function onOpenEditor(message, sender, sendResponse) {
  sendResponse();
  openNativeApplication(message.uuid)
    .catch(error => {
      if (error) {
        console.warn('Failed to start native application %s', error);
      }
      openUserScriptEditor(message.uuid);
    });
}
