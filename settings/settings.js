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
    mergeCalendarData();

    const serializedCalendarItems = JSON.stringify(calendarEntryList, null, 2); 
    const textareaElement = document.getElementById("calendarItemsArea");
    textareaElement.value = serializedCalendarItems;

    alert('Calendar merged');
  });

  // #endregion mergeButton

  // #region sendButton
  var sendButton = document.getElementById('sendButton');
  sendButton.addEventListener('click', async function () { // Step 2
    const requestData = {
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
    };

    const body = JSON.stringify(requestData);
    printLogSettings('info', `requestData: ${JSON.stringify(requestData)}`);

    await submitTimesheetEntry(sessionData.csrfToken, sessionData.employeeId, body);


    alert('Timesheet updae sent');
  });

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

function mergeCalendarData() {
  var dailyDetails = sessionData.timesheet.dailyDetails;
  for (const dateKey in dailyDetails) {
    const dailyData = dailyDetails[dateKey];
    const date = stringToDate(dailyData.date);
    const clockEntries = dailyData.clockEntries;

    if (clockEntries.length) {
      const calendarEntry = calendarEntryList
          .find((entry) => compareDates(stringToDate(entry.Date), date));
      if (calendarEntry) {
        const clockEntriesTotalDuration = 
          (clockEntries
            .reduce((total, entry) => total + entry.hours, 0))*60;

        const calendarItemTotalDuration = 
          calendarEntry
            .Items
            .reduce((total, item) => total + item.Duration, 0);

        if (clockEntriesTotalDuration > calendarItemTotalDuration) {
          let defaultItem = calendarEntry.Items.find((item) => item.IsDefault);
          if (defaultItem) {
            defaultItem.Duration += clockEntriesTotalDuration - calendarItemTotalDuration;
          }
        }
      }
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
    printLogSettings("Info", "Timesheet entry submitted successfully:", data);
  } catch (error) {
    //console.error("Error submitting timesheet entry:", error);
    printLogSettings("Error", `Error submitting timesheet entry: ${error}`);
  }
}

// #region helpers

function addHoursToDate(baseDate, hours) {
  const milliseconds = hours * 60 * 60 * 1000; // Convert hours to milliseconds
  return new Date(baseDate.getTime() + milliseconds);
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