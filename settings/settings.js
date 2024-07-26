var sessionData = null;
var calendarEntryList = null;

document.addEventListener('DOMContentLoaded', function () {

  // #region fileInput
  document.getElementById('fileInput').addEventListener('change', function (event) {
    // Check if a file was selected
    if (this.files && this.files.length > 0) {
      const file = this.files[0]; // Get the first file
      const reader = new FileReader(); // Create a FileReader

      reader.onload = function (event) {
        const fileContent = event.target.result;
        calendarEntryList = JSON.parse(fileContent);
        const serializedCalendarLineList = JSON.stringify(calendarEntryList, null, 2);
        const textareaElement = document.getElementById("calendarItemsArea");
        textareaElement.textContent = serializedCalendarLineList;
      };

      reader.readAsText(file); // Read the file as text
    }
  });

  // #endregion fileInput

  // #region mergeButton
  var mergeButton = document.getElementById('mergeButton');
  mergeButton.addEventListener('click', function () {
    calendarEntryList = JSON.parse(document.getElementById("calendarItemsArea").value);
    mergeCalendarData();

    const serializedCalendarItems = JSON.stringify(calendarEntryList, null, 2);
    const textareaElement = document.getElementById("calendarItemsArea");
    textareaElement.value = serializedCalendarItems;

    alert('Calendar merged');
  });

  // #endregion mergeButton

  // #region sendButton
  var sendButton = document.getElementById('sendButton');
  sendButton.addEventListener('click', async function () {
    calendarEntryList = JSON.parse(document.getElementById("calendarItemsArea").value);
    let bambooentryList = extractAllBambooEntries(calendarEntryList);
    let clockEntries = extractAllClockEntries(calendarEntryList);
    for (let i = 0; i < clockEntries.length; i++) {
      await removeTimesheetEntry(sessionData.csrfToken, sessionData.employeeId, clockEntries[i].id);
    }
    for (let i = 0; i < bambooentryList.length; i++) {
      const bambooEntry = bambooentryList[i];
      await sendEntry(i, bambooEntry);
    }
    alert('Timesheet updae sent');
  }
  );

  // #endregion sendButton

  // #region send Messages
  chrome.runtime.sendMessage({ command: 'settingsInitializedS2B' },
    function (response) {
      // @ts-ignore
      if (chrome.runtime.lastError) {
        // @ts-ignore
        printLogSettings("Info", `Bambooreaucracy(error): logS2B: ${chrome.runtime.lastError.message}`);
      } else {
        sessionData = response.sessionData;
        printLogSettings('info', `csrfToken: ${sessionData.csrfToken} `);
      }
    });
  // #endregion send Messages

});

/*const requestData = {
  "entries": [
    {
      "id": null,
      "trackingId": 1,
      "employeeId": sessionData.employeeId,
      "date": '2024-07-01',
      "start": '10:00',
      "end": '11:30',
      "note": "",
      "projectId": 32,
      "taskId": 105
    }
  ]
};*/
async function sendEntry(i, calendarEntry) {
  const requestData = {
    "entries": [
      {
        "id": null,
        "trackingId": i + 1,
        "employeeId": sessionData.employeeId,
        "date": extractDateFromISOString(calendarEntry.Date),
        "start": extractTimeFromISOString(calendarEntry.Date),
        "end": extractTimeFromISOString(
          calculateEntryEnd(
            calendarEntry.Date,
            calendarEntry.Duration)),
        "note": "",
        "projectId": calendarEntry.ProjectId,
        "taskId": calendarEntry.TaskId
      }
    ]
  };
  const body = JSON.stringify(requestData);
  printLogSettings('info', `requestData: ${JSON.stringify(requestData)}`);

  await submitTimesheetEntry(sessionData.csrfToken, sessionData.employeeId, body);
}

function extractTimeFromISOString(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateToISO8601(date) {
  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() + 3);
  return adjustedDate.toISOString().slice(0, -1) + '+03:00';
}

function mergeCalendarData() {
  var dailyDetails = sessionData.timesheet.dailyDetails;
  for (const dateKey in dailyDetails) {
    const dailyData = dailyDetails[dateKey];
    const date = stringToDate(dailyData.date);
    const calendarEntry = calendarEntryList
      .find((entry) => compareDates(stringToDate(entry.Date), date));

    if (calendarEntry) {
      if (checkDayOff(dailyData)) {
        calendarEntry.TimeOff = true;
      } else {
        const clockEntries = dailyData.clockEntries;

        if (clockEntries.length) {
          if (calendarEntry) {
            calendarEntry.clockEntries = clockEntries;
            const clockEntriesTotalDuration =
              (clockEntries
                .reduce((total, entry) => total + entry.hours, 0)) * 60;

            const calendarItemTotalDuration =
              calendarEntry
                .Items
                .reduce((total, item) => total + item.Duration, 0);

            let durationDiff = 0;
            if (clockEntriesTotalDuration > calendarItemTotalDuration) {
              durationDiff = (clockEntriesTotalDuration - calendarItemTotalDuration) * 60 * 1000;
            }

            let clockEntryFirstStart = new Date(Math.min(...clockEntries.map(entry => new Date(entry.start))));
            let calendarEntryFirstStart = new Date(Math.min(...calendarEntry.Items.map(item => new Date(item.Date))));
            let startWorkDiff = calendarEntryFirstStart - clockEntryFirstStart;
            if (startWorkDiff > 0 || durationDiff > 0) {
              let itemDurationDiff = 0;
              for (let i = 0; i < calendarEntry.Items.length; i++) {
                const correctedDate = new Date(new Date(calendarEntry.Items[i].Date)
                  - startWorkDiff
                  + itemDurationDiff);
                const correctedDateString = formatDateToISO8601(correctedDate);
                calendarEntry.Items[i].Date = correctedDateString;
                if (itemDurationDiff === 0 && calendarEntry.Items[i].IsDefault) {
                  itemDurationDiff = durationDiff;
                  calendarEntry.Items[i].Duration += itemDurationDiff / (60 * 1000);
                  // from now will move items followin deault later on itemDurationDiff
                  // because default latem's duration is changed
                }
              }
            }
          }
        }
      }

    }
  }
}

function checkDayOff(dailyData) {
  return dailyData.timeOffHours > 0
    ||
    dailyData.holidayHours > 0;
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
      "body": body
    });

    if (!response.ok) {
      throw new Error(`Error submitting timesheet entry: ${response.statusText}`);
    }

    const data = await response.json();
    printLogSettings("Info", "Timesheet entry submitted successfully:", data);
  } catch (error) {
    //console.error("Error submitting timesheet entry:", error);
    printLogSettings("Error", `Error submitting timesheet entry: ${error}`);
  }
}

async function removeTimesheetEntry(csrf_token, employeeId, entityId) {
  let body =
  {
    "entries": [entityId]
  };
  let bodyString = JSON.stringify(body);
  try {
    const response = await fetch("https://qognify.bamboohr.com/timesheet/clock/entries", {
      "method": "DELETE",
      "headers": {
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
        "x-csrf-token": csrf_token
      },
      "Referer": `https://qognify.bamboohr.com/employees/timesheet/?id=${employeeId}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "body": bodyString
    });

    if (!response.ok) {
      throw new Error(`Error submitting timesheet entry: ${response.statusText}`);
    }

    printLogSettings("Info", `Timesheet entry deleted successfully: ${response}`);
  } catch (error) {
    printLogSettings("Error", `Error submitting timesheet entry: ${error}`);
  }
}

// #region helpers

function extractAllBambooEntries(data) {
  const allItems = [];
  data.forEach(entry => {
    if (!entry.TimeOff) {
      allItems.push(...entry.Items);
    }
  });
  return allItems;
}
function extractAllClockEntries(data) {
  const allItems = [];
  data.forEach(entry => {
    if (entry.clockEntries) {
      allItems.push(...entry.clockEntries);
    }
  });
  return allItems;
}

function calculateEntryEnd(startTimeString, durationInMinutes) {
  const startTime = new Date(startTimeString);
  const endTimeMilliseconds = startTime.getTime() + (durationInMinutes * 60 * 1000);
  const endTime = new Date(endTimeMilliseconds);
  const endString = endTime.toISOString();
  return endString;
}


function stringToDate(dateString) {
  const dateParts = dateString.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Months are zero-indexed
  const day = parseInt(dateParts[2], 10);

  return new Date(year, month, day);
}

function compareDates(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function extractDateFromISOString(isoString) {
  const dateParts = isoString.split('T')[0];
  return dateParts;
}

// #endregion helpers

// #region Log
function printLogSettings(level, message) {
  console.log(`Bambooreaucracy(${level}): ${message}`);
  // @ts-ignore
  chrome.runtime.sendMessage({ command: 'logS2B', logLevel: level, message: message },
    function (response) {
      // @ts-ignore
      if (chrome.runtime.lastError) {
        // @ts-ignore
        console.log(`Bambooreaucracy(error): logS2B: ${chrome.runtime.lastError.message}`);
      }
    });
}

// #endregion Log