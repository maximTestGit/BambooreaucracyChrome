document.addEventListener('DOMContentLoaded', function() {
    // Select the button and input area by their IDs or classes
    const button = document.getElementById('loadButton');
    // Add an event listener to the button for the click event
    button.addEventListener('click', function() {
        const inputArea = document.getElementById('inputArea'); 
        //alert(inputArea.value);
        chrome.runtime.sendMessage({action: "loadDayData", content: inputArea.value});
    });
});