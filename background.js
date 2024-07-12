importScripts('./utils/logger.js');
importScripts('background-utils.js')

printInfo('Background', "This prints to the console of the service worker (background script)")

// Importing and using functionality from external files is also possible.

// Listen for messages sent to the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    self.printInfo('Background', `message recieved: `, request);
	// Check if the received message is the one we're interested in
	if (request.action === "loadDayData") {
		// Find the active tab
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
                self.printInfo('Background', `background: processed: `, request);
			});
		});
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
          case "debug": self.printDebug('content', request.message); break;
          // @ts-ignore
          case "info": self.printInfo('content', request.message); break;
          // @ts-ignore
          case "warn": self.printWarn('content', request.message); break;
          // @ts-ignore
          case "error": self.printError('content', request.message); break;
        }
      }
      else if (request.command === "logO2B") {
        sendResponse({ result: 'logO2B' });
        // @ts-ignore
        switch (request.logLevel) {
          // @ts-ignore
          case "debug": self.printDebug('options', request.message); break;
          // @ts-ignore
          case "info": self.printInfo('options', request.message); break;
          // @ts-ignore
          case "warn": self.printWarn('options', request.message); break;
          // @ts-ignore
          case "error": self.printError('options', request.message); break;
        }
      }
      // #endregion logMessages
  
  });

