function printLogPopup(level, message) {
    console.log(`Bambooreaucracy(${level}): ${message}`);
    // @ts-ignore
    chrome.runtime.sendMessage({ command: 'logP2B', logLevel: level, message: message }, function (response) {
        // @ts-ignore
        if (chrome.runtime.lastError) {
            // @ts-ignore
            console.log(`Bambooreaucracy(error): logP2B: ${chrome.runtime.lastError.message}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Select the button and input area by their IDs or classes
    const button = document.getElementById('loadButton');
    // Add an event listener to the button for the click event
    button.addEventListener('click', function() {
        const inputArea = document.getElementById('inputArea'); 
        //alert(inputArea.value);
        chrome.runtime.sendMessage({action: "loadDayData", content: inputArea.value});
        printLogPopup('info', "Sent message LoadDayData to background.js");
    });
});