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

document.addEventListener('DOMContentLoaded', function () {
    // Select the button and input area by their IDs or classes
    const button = document.getElementById('loadButton');
    // Add an event listener to the button for the click event
    button.addEventListener('click', function () {
        const inputArea = document.getElementById('inputArea');
        //alert(inputArea.value);
        const requestLoadData = {
            command: "loadDayDataP2B",
            content: inputArea.value
        };
        chrome.runtime.sendMessage(requestLoadData);
        window.close();
        printLogPopup('info', `Sent message LoadDayDataP2B content: "${requestLoadData.content}"`);
    });
});

async function tryDownloadIcsFile(webcalUrl) {
    if (!webcalUrl || webcalUrl.trim() === "") {
        throw new Error("URL cannot be null or whitespace.");
    }

    const httpUrl = webcalUrl.replace("webcal://", "https://");
    const lines = [];

    try {
        const response = await fetch(httpUrl);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText}`);
        }

        const content = await response.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        const icsData = decoder.decode(content);

        lines.push(...icsData.split(/\r?\n/));

    } catch (error) {
        console.error("Error downloading ICS file:", error);
    }

    return lines;
}

