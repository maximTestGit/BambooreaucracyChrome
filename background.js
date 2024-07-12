// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

console.log("This prints to the console of the service worker (background script)")

// Importing and using functionality from external files is also possible.
importScripts('background-utils.js')

// Listen for messages sent to the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(`background: recieved: `, request);
	// Check if the received message is the one we're interested in
	if (request.action === "loadDayData") {
		// Find the active tab
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
                console.log(`background: processed: `, request);
			});
		});
	}
});

