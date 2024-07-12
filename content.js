importScripts('./utils/logger.js');

function printLogContent(level, message) {
    console.log(`Bambooreaucracy(${level}): ${message}`);
    // @ts-ignore
    chrome.runtime.sendMessage({ command: 'logC2B', logLevel: level, message: message }, function (response) {
        // @ts-ignore
        if (chrome.runtime.lastError) {
            // @ts-ignore
            console.log(`Bambooreaucracy(error: logC2B: ${chrome.runtime.lastError.message}`);
        }
    });
}


printInfo('content', "This prints to the console of the page (injected only if the page url matched)")

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the received message is the one we're interested in
    if (request.action === "loadDayData") {
        // Process the message
        printInfo('content', "Received 'loadDayData' message with content:", request.content);
        var div = document.querySelector('.AddEditEntry__addEntryLink');
        if (div) {
            printInfo('content', "Div with class 'AddEditEntry__addEntryLink' found.");
            // Find the a tag within the div and click it
            var link = div.querySelector('a');
            if (link) {
                printInfo('content', "Link '+ Add Entry' found within the div.");
                link.click();
            } else {
                // Log if the a element is not found within the div
                printInfo('content', "Link '+ Add Entry' not found within the div.");
            }
        } else {
            // Log if the div is not found
            printInfo('content', "Div with class 'AddEditEntry__addEntryLink' not found.");
        }
        sendResponse({ status: "success", message: "Message processed by content.js" });
    }
    // Return true to indicate you wish to send a response asynchronously
    return true;
});
