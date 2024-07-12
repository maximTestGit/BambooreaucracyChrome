// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).
// Several foreground scripts can be declared
// and injected into the same or different pages.

console.log("This prints to the console of the page (injected only if the page url matched)")

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the received message is the one we're interested in
    if (request.action === "loadDayData") {
        // Process the message
        console.log("Received 'loadDayData' message with content:", request.content);
        var div = document.querySelector('.AddEditEntry__addEntryLink');
        if (div) {
            console.log("Div with class 'AddEditEntry__addEntryLink' found.");
            // Find the a tag within the div and click it
            var link = div.querySelector('a');
            if (link) {
                console.log("Link '+ Add Entry' found within the div.");
                link.click();
            } else {
                // Log if the a element is not found within the div
                console.log("Link '+ Add Entry' not found within the div.");
            }
        } else {
            // Log if the div is not found
            console.log("Div with class 'AddEditEntry__addEntryLink' not found.");
        }
        sendResponse({ status: "success", message: "Message processed by content.js" });
    }
    // Return true to indicate you wish to send a response asynchronously
    return true;
});
