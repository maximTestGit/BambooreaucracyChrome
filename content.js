function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

const my_guid = generateGuid();

function printLogContent(level, message) {
    console.log(`Bambooreaucracy(${level}): ${message}`);
    //const msg = `[${my_guid}] ${message}`
    // @ts-ignore
    chrome.runtime.sendMessage({ command: 'logC2B', logLevel: level, message: message },
        function (response) {
            // @ts-ignore
            if (chrome.runtime.lastError) {
                // @ts-ignore
                console.log(`Bambooreaucracy(error: logC2B: ${chrome.runtime.lastError.message}`);
            }
        }
    );
}


printLogContent('info',
    `Content started. Current URL: ${window.location.href}`
);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    printLogContent('info', `message recieved: ${request.command}`);
    // Check if the received message is the one we're interested in
    if (request.command === "loadDayDataB2C") {
        // Process the message
        printLogContent('info', `Received "loadDayDataB2C" message with content: "${request.content}"`);
        var div = document.querySelector('.AddEditEntry__addEntryLink');
        if (div) {
            printLogContent('info', "Div with class 'AddEditEntry__addEntryLink' found.");
            // Find the a tag within the div and click it
            var link = div.querySelector('a');
            if (link) {
                printLogContent('info', "Link '+ Add Entry' found within the div.");
                link.click();
            } else {
                // Log if the a element is not found within the div
                printLogContent('info', "Link '+ Add Entry' not found within the div.");
            }
        } else {
            // Log if the div is not found
            printLogContent('info', "Div with class 'AddEditEntry__addEntryLink' not found.");
        }
        sendResponse({ status: "success", message: "Message processed by content.js" });
        const clockField1 = document.getElementById('clockField1')
        if (clockField1) {
            clockField1.focus()
        }
    }
    // Return true to indicate you wish to send a response asynchronously
    return true;
});
