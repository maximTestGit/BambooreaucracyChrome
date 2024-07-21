const my_guid = generateGuid();
var employeeId;
var CSRF_TOKEN;
var sessionData;

//document.addEventListener("DOMContentLoaded", function (event) {
const scripts = document.querySelectorAll('script');

// #region employeeId
const scriptWithSessionUser = Array.from(scripts)
    .find(script => script.textContent.includes('var SESSION_USER'));
const sessionUserString = scriptWithSessionUser.textContent.match(/var\s+SESSION_USER\s*=\s*({.+?});/s)[1];
const SESSION_USER = JSON.parse(sessionUserString);
//printLogContent('info', `SESSION_USER: ${SESSION_USER}`);
employeeId = SESSION_USER.employeeId;
printLogContent('info', `employeeId: ${employeeId}`);
// #endregion employeeId

// #region CSRF_TOKEN
const scriptWithCSRFToken = Array.from(scripts)
    .find(script => script.textContent.includes('var CSRF_TOKEN'));
CSRF_TOKEN = scriptWithCSRFToken.textContent.match(/var CSRF_TOKEN = "([^"]+)"/)[1];
printLogContent('info', `CSRF_TOKEN: ${CSRF_TOKEN}`);
// #endregion CSRF_TOKEN

// #region timesheetData
const timesheetDataJson = document.getElementById('js-timesheet-data');
sessionData = JSON.parse(timesheetDataJson.textContent);
printLogContent('info', `timesheetData: ${sessionData}`);

// #endregion timesheetData

sessionData.csrfToken = CSRF_TOKEN;

printLogContent('info', `Content started. Current URL(${my_guid}): ${window.location.href}`);

chrome.runtime.sendMessage({ command: 'contentInitializedC2B', sessionData: sessionData },
    function (response) {
        // @ts-ignore
        if (chrome.runtime.lastError) {
            // @ts-ignore
            console.log(`Bambooreaucracy(error: logC2B: ${chrome.runtime.lastError.message}`);
        }
    }
);

//});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    printLogContent('info', `message recieved: ${request.command}`);
    // Check if the received message is the one we're interested in
    if (request.command === "loadDayDataB2C") {
        printLogContent('info', `Received "loadDayDataB2C" message with content: "${request.content}"`);

        try {
            const reqObject = JSON.parse(request.content);
            //processDayDataRequest(reqObject);
            printLogContent('info', `Processed "loadDayDataB2C" message`);
            sendResponse({ status: "success", message: "Message processed by content.js" });
        } catch (error) {
            printLogContent('info', `EDrror processing "loadDayDataB2C" message ${error}`);
            sendResponse({ status: "error", message: `Message processed by content.js with error: ${error}` });
        }
        return true;
    }
}
);


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
                        "trackingId": itemNo + 1,
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

// #region utils
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

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

function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// #endregion utils