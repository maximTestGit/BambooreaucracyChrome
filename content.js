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
-----------
{
  "entries": [
    {
      "id": null,
      "trackingId": 1,
      "employeeId": 300,
      "date": "2024-07-01",
      "start": "10:00",
      "end": "11:30",
      "note": "",
      "projectId": 32,
      "taskId": 105
    }
  ]
}
----------------
Project: 32, "SM9.2.1"
Task: 105, "BLD - Design, Code, QA, Documentation"
Task: 107, "OHD - Daily, Planning, Sprint review, Retrospective"


*/
async function processDayDataRequest(requestDayData) {
    const scripts = document.querySelectorAll('script');
    const scriptWithSessionUser = Array.from(scripts)
        .find(script => script.textContent.includes('var SESSION_USER'));
    const sessionUserString = scriptWithSessionUser.textContent.match(/var\s+SESSION_USER\s*=\s*({.+?});/s)[1];
    const SESSION_USER = JSON.parse(sessionUserString);
    //printLogContent('info', `SESSION_USER: ${SESSION_USER}`);
    const employeeId = SESSION_USER.employeeId;
    printLogContent('info', `employeeId: ${employeeId}`);

    const scriptWithCSRFToken = Array.from(scripts)
        .find(script => script.textContent.includes('var CSRF_TOKEN'));
    const CSRF_TOKEN = scriptWithCSRFToken.textContent.match(/var CSRF_TOKEN = "([^"]+)"/)[1];
    printLogContent('info', `CSRF_TOKEN: ${CSRF_TOKEN}`);


    for (let dayDataNo = 0; dayDataNo < requestDayData.length; dayDataNo++) {
        const dayData = requestDayData[dayDataNo];
        printLogContent('info', `Processing day data: ${dayDataNo + 1} of ${requestDayData.length}`);

        for (let itemNo = 0; itemNo < dayData.Items.length; itemNo++) {
            const item = dayData.Items[itemNo];

            const dateStartFull = new Date(item.Date);
            const year = dateStartFull.getFullYear();
            const month = dateStartFull.getMonth() + 1; // Months are zero-indexed (January = 0)
            const day = dateStartFull.getDate();

            const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            printLogContent('info', `date: ${date}`);

            var hours = dateStartFull.getHours();
            var minutes = dateStartFull.getMinutes();

            const start = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            printLogContent('info', `start: ${start}`);

            var duration = item.TotalDuration;
            printLogContent('info', `duration: ${duration}`);

            var endTime = new Date(dateStartFull.getTime() + duration * 60 * 1000);
            hours = endTime.getHours();
            minutes = endTime.getMinutes();

            const end = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            printLogContent('info', `end: ${end}`);

            const project = item.TaskData.ProjectId;
            const task = item.TaskData.TaskId;

            const requestData = {
                "entries": [
                    {
                        "id": null,
                        "trackingId": itemNo,
                        "employeeId": employeeId,
                        "date": date,
                        "start": start,
                        "end": end,
                        "note": "",
                        "projectId": project,
                        "taskId": task
                    }
                ]
            };

            const body = JSON.stringify(requestData);
            printLogContent('info', `requestData: ${JSON.stringify(requestData)}`);

            await submitTimesheetEntry(CSRF_TOKEN, employeeId, body);
        }
    }
}

async function submitTimesheetEntry(csrf_token, employeeId, body) {
    try {
        const response = await fetch("https://qognify.bamboohr.com/timesheet/clock/entries", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,he;q=0.8,ru;q=0.7",
                "content-type": "application/json;charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "\"Android\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-csrf-token": csrf_token,
                "Referer": `https://qognify.bamboohr.com/employees/timesheet/?id=${employeeId}`,
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            body: body,
        });

        if (!response.ok) {
            throw new Error(`Error submitting timesheet entry: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Timesheet entry submitted successfully:", data);
    } catch (error) {
        console.error("Error submitting timesheet entry:", error);
    }
}



async function processDayDataRequest2(requestDayData) {
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
        if (i == 0) {
            clockField1 = clockFieldStart;
        }

        setClockField(clockFieldStart, timeStart);
        setClockField(clockFieldEnd, timeEnd);

        var jssY61 = fieldRow.querySelector('.jss-y61');
        var fabSelectElement = jssY61.querySelector('.fab-Select');

        transformHtmlElement(fabSelectElement, 'SM9.2.1 » BLD - Design, Code, QA, Documentation', '32-105');

        // let spanNotes = jssY61.querySelector('.AddEditEntry__noteIconWrapper');
        // let spanBaloon = spanNotes.firstChild;
        // if (spanBaloon) {
        //     spanBaloon.setAttribute('balloon-position', 'top');
        //   }
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
    let selectElement = element.querySelector('select');
    selectElement.removeAttribute('data-has-default-value');
    // Change the value of the option
    selectElement.options[0].value = optionValue;

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
            const reqObject = JSON.parse(request.content);
            processDayDataRequest(reqObject);
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

