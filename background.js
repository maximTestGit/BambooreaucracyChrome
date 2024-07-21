importScripts('./utils/logger.js');
importScripts('background-utils.js')

var sessionData = null;

printInfo('Background', "This prints to the console of the service worker (background script)")

// Importing and using functionality from external files is also possible.

// Listen for messages sent to the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  self.printInfo('Background', `message recieved: ${request.command}`);
  // Check if the received message is the one we're interested in
  if (request.command === "loadDayDataP2B") {
    sendResponse({ result: 'loadDayDataP2B' });
    const requestB2C = {
      command: "loadDayDataB2C",
      content: request.content
    };
    self.printInfo('Background', `message sent: ${requestB2C.command} content: ${requestB2C.content}`);
    // Find the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, requestB2C, function (response) {
        self.printInfo('Background', `background: processed: `, requestB2C);
      });
    });
  }
  else if (request.command === "contentInitializedC2B") {
    sendResponse({ result: 'contentInitializedC2B' });
    sessionData = request.sessionData;
    self.printInfo('Background', `csrfToken: ${request.sessionData.csrfToken} `);
  }
  else if (request.command === "settingsInitializedS2B") {
    sendResponse({ result: 'settingsInitializedS2B', sessionData: sessionData });
  }
  // #region logMessages
  else if (request.command === "logP2B") {
    sendResponse({ result: 'logP2B' });
    // @ts-ignore
    switch (request.logLevel) {
      // @ts-ignore
      case "debug": self.printDebug('Popup', request.message); break;
      // @ts-ignore
      case "info": self.printInfo('Popup', request.message); break;
      // @ts-ignore
      case "warn": self.printWarn('Popup', request.message); break;
      // @ts-ignore
      case "error": self.printError('Popup', request.message); break;
    }
  }
  else if (request.command === "logC2B") {
    sendResponse({ result: 'logC2B' });
    // @ts-ignore
    switch (request.logLevel) {
      // @ts-ignore
      case "debug": self.printDebug('Content', request.message); break;
      // @ts-ignore
      case "info": self.printInfo('Content', request.message); break;
      // @ts-ignore
      case "warn": self.printWarn('Content', request.message); break;
      // @ts-ignore
      case "error": self.printError('Content', request.message); break;
    }
  }
  else if (request.command === "logS2B") {
    sendResponse({ result: 'logS2B' });
    // @ts-ignore
    switch (request.logLevel) {
      // @ts-ignore
      case "debug": self.printDebug('Settings', request.message); break;
      // @ts-ignore
      case "info": self.printInfo('Settings', request.message); break;
      // @ts-ignore
      case "warn": self.printWarn('Settings', request.message); break;
      // @ts-ignore
      case "error": self.printError('Settings', request.message); break;
    }
  }
  // #endregion logMessages

});

