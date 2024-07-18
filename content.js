function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/*
  {
    "Date": "2024-07-01T00:00:00",
    "Items": [
      {
        "Date": "2024-07-01T10:00:00",
        "Category": {
          "IsDefault": false,
          "Project": "SM9.2.1",
          "Task": "OHD - Daily, Planning, Sprint review, Retrospective",
          "KeyWords": [
            "Daily",
            "Planning",
            "Sprint",
            "Retrospective",
            "Weekly refinement"
          ]
        },
        "TotalDuration": 90.0,
        "Count": 2
      },
      {
        "Date": "2024-07-01T11:30:00",
        "Category": {
          "IsDefault": true,
          "Project": "SM9.2.1",
          "Task": "BLD - Design, Code, QA, Documentation",
          "KeyWords": null
        },
        "TotalDuration": 450.0,
        "Count": 1
      }
    ],
    "TotalDuration": 540.0,
    "Count": 2
  },

*/
async function processDayDataRequest(requestDayData) {
    printLogContent('info', `processDayDataRequest: ${requestDayData.content}`);
    await sleep(1000);
    var dayData = JSON.parse(requestDayData.content);
    var div = document.querySelector('.AddEditEntry__addEntryLink');
    // create Entries by dayData.Items.length - 1
    if (div) {
        var linkAddEntry;
        printLogContent('info', "Div with class 'AddEditEntry__addEntryLink' found.");
        // Find the a tag within the div and click it
        linkAddEntry = div.querySelector('a');
        if (linkAddEntry) {
            printLogContent('info', "Link '+ Add Entry' found within the div.");
            for (let i = 0; i < dayData.Items.length - 1; i++) {
                linkAddEntry.click();
            }
        } else {
            // Log if the a element is not found within the div
            printLogContent('info', "Link '+ Add Entry' not found within the div.");
        }
    } else {
        // Log if the div is not found
        printLogContent('info', "Div with class 'AddEditEntry__addEntryLink' not found.");
    }

    const fieldRows = document.querySelectorAll('.fieldRow');
    var clockField1;

    for (let i = 0; i < dayData.Items.length; i++) {
        let item = dayData.Items[i];

        var dateStart = new Date(item.Date);
        var timePair = convertToH12Format(dateStart);
        var timeStart = timePair.time;
        var ampmStart = timePair.ampm;
        var duration = item.TotalDuration;
        var dateEnd = new Date(dateStart.getTime() + duration * 60000);
        timePair = convertToH12Format(dateEnd);
        var timeEnd = timePair.time;
        var ampmEnd = timePair.ampm;

        var project = item.Category.Project;
        var task = item.Category.Task;
        var saveTimeTo = `${project} » ${task}`;
        var count = item.Count;

        let fieldRow = fieldRows[i];
        const clockFields = Array.from(
            fieldRow.querySelectorAll(".ClockField__formInput.fab-TextInput.fab-TextInput--width2"))
                .sort((a, b) => a.id.localeCompare(extractNumberFromString(b.id)));
        const clockFieldStart = clockFields[0];
        const clockFieldEnd = clockFields[1];
        if (i==0) {
            clockField1 = clockFieldStart;
        }

        setClockField(clockFieldStart, timeStart);
        setClockField(clockFieldEnd, timeEnd);

        var jssY61 = fieldRow.querySelector('.jss-y61');
        var fabSelectElement = jssY61.querySelector('.fab-Select');
        
        transformHtmlElement(fabSelectElement, 'SM9.2.1 » BLD - Design, Code, QA, Documentation', '32-105');

        let spanNotes = jssY61.querySelector('.AddEditEntry__noteIconWrapper');
        let spanBaloon = spanNotes.firstChild;
        if (spanBaloon) {
            spanBaloon.setAttribute('balloon-position', 'top');
          }
    }
    if (clockField1) {
        clockField1.focus();
    }
}

function transformHtmlElement(element, textContent, optionValue) {
    // Get the first div inside the element
    let firstDiv = element.querySelector('div:first-child');

    // Get the fab-SelectToggle div
    let fabSelectToggle = firstDiv.querySelector('.fab-SelectToggle');

    // Add the 'fab-SelectToggle--clearable' class
    fabSelectToggle.classList.add('fab-SelectToggle--clearable');

    // Change the 'data-menu-id' attribute
    fabSelectToggle.setAttribute('data-menu-id', 'fab-menu68');

    // Change the 'aria-label' attribute
    fabSelectToggle.setAttribute('aria-label', textContent);

    // Get the fab-SelectToggle__placeholder div
    let guts = fabSelectToggle.querySelector('.fab-SelectToggle__guts');
    let placeholder = guts.querySelector('.fab-SelectToggle__placeholder');

    let content = document.createElement('div');
    content.classList.add('fab-SelectToggle__content');
    content.textContent = textContent;

    // Replace the placeholder div with the new content div in the guts div
    guts.replaceChild(content, placeholder);
    

    // Get the select element
    let select = element.querySelector('select');

    // Change the value of the option
    select.options[0].value = optionValue;

    return element;
}


function transformHtmlElement1(fabSelectElement, textContent, optionValue) {

    // Get the fab-SelectToggle div
    let fabSelectToggle = fabSelectElement.querySelector('.fab-SelectToggle');

    // Add the 'fab-SelectToggle--clearable' class
    fabSelectToggle.classList.add('fab-SelectToggle--clearable');

    // Change the 'data-menu-id' attribute
    fabSelectToggle.setAttribute('data-menu-id', 'fab-menu68');

    // Change the 'aria-label' attribute
    fabSelectToggle.setAttribute('aria-label', textContent);

    // Get the fab-SelectToggle__placeholder div
    //let saveTimeToElement = findElementByText(fieldRow, '--Select Project/Task--');
    let saveTimeToElement = fabSelectToggle.querySelector('.fab-SelectToggle__placeholder');
    saveTimeToElement.classList.replace('fab-SelectToggle__placeholder', 'fab-SelectToggle__content');
    saveTimeToElement.textContent = textContent;

    // Add the new div to the fab-SelectToggle__guts div
    fabSelectToggle.querySelector('.fab-SelectToggle__guts').appendChild(content);

    // Get the select element
    let select = fabSelectElement.querySelector('select');

    // Change the value of the option
    select.options[0].value = optionValue;

    return fabSelectElement;
}


function findElementByText(element, text) {
    if (element.textContent.includes(text)) {
        return element;
    }

    for (let child of element.children) {
        let result = findElementByText(child, text);
        if (result) {
            return result;
        }
    }

    return null;
}

function setClockField(clockField, time) {
    //printLogContent('info', `Setting clockField ${clockField.id} to ${time}`);
    clockField.focus();
    clockField.value = time;
    printLogContent('info', `Set clockField ${clockField.id} to ${time}, value:${clockField.value}`);
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function convertToH12Format(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    var timeStartH12 = hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
    return { time: timeStartH12, ampm: ampm };
}

function extractNumberFromString(str) {
    const match = str.match(/\d+$/); // Match one or more digits at the end of the string
    return match ? parseInt(match[0], 10) : null; // Convert the matched digits to an integer, or return null if no match
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
        if (request.command === "loadDayDataB2C") {
            printLogContent('info', `Received "loadDayDataB2C" message`);
            processDayDataRequest(request);
            printLogContent('info', `Processed "loadDayDataB2C" message`);
            sendResponse({ status: "success", message: "Message processed by content.js" });
        }
        return true;
    }
}
);

function findFieldRowByClockField(clockFieldId) {
    const fieldRows = document.querySelectorAll(".fieldRow");
    for (const fieldRow of fieldRows) {
        const clockFields = document.querySelectorAll('.ClockField')
        for (const clockField of clockFields) {
            const fieldDivs = clockField.querySelectorAll(".fieldDiv");
            for (const fieldDiv of fieldDivs) {
                // Find the input element inside the clockField
                const input = fieldDiv.querySelector("input[id='" + clockFieldId + "']");

                // Check if the input ID matches the provided clockFieldId
                if (input && input.id === clockFieldId) {
                    // If found, return the clockField element
                    return clockField;
                }
            }
        }
    }

    // If not found, return null
    return null;
}

