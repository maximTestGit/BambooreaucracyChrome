const cancelledItemKeys = ["Canceled:", "Abgesagt:", "Monday Pizza", "Open door policy", "Bamboo"];

const tasksConfig =
  [
    {
      "isDefault": true,
      "project": "SM9.2.1",
      "task": "BLD - Design, Code, QA, Documentation",
      //"keyWords": [ "Bug", "Technical", "Knowledge", "Pull Request", "Code review", "PR:", "Design", "Code", "QA", "Documentation" ]
      "projectId": 32,
      "taskId": 105
    },
    {
      "IsDefault": false,
      "project": "SM9.2.1",
      "task": "OHD - Daily, Planning, Sprint review, Retrospective",
      "keyWords": ["Daily", "Planning", "Sprint", "Retrospective", "Weekly refinement"],
      "projectId": 32,
      "taskId": 107
    }
  ];
const WeekdayHours =
  [
    {
      // Sunday
      "DOW": 0,
      "Start": "10:00:00+00:00",
      "End": "18:00:00+00:00"
    },
    {
      // Monday
      "DOW": 1,
      "Start": "10:00:00+00:00",
      "End": "19:00:00+00:00"
    },
    {
      // Tuesday
      "DOW": 2,
      "Start": "10:00:00+00:00",
      "End": "19:00:00+00:00"
    },
    {
      // Wednesday
      "DOW": 3,
      "Start": "10:00:00+00:00",
      "End": "19:00:00+00:00"
    },
    {
      // Thursday
      "DOW": 4,
      "Start": "10:00:00+00:00",
      "End": "19:00:00+00:00"
    }
    //{
    //  // Friday
    //  "DOW": 5,
    //  "Start": "10:00:00+00:00",
    //  "End": "19:00:00+00:00"
    //},
    //{
    //  // Saturday
    //  "DOW": 6,
    //  "Start": "10:00:00+00:00",
    //  "End": "19:00:00+00:00"
    //}
  ]
const lines = [];

var sessionData = null;
var calendarItemList = null;

document.addEventListener('DOMContentLoaded', function () {
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth() + 1; // Step 1
  var yearSelect = document.getElementById('year');
  var monthSelect = document.getElementById('month'); // Step 2

  for (var i = 0; i < yearSelect.options.length; i++) {
    if (yearSelect.options[i].value == currentYear.toString()) {
      yearSelect.options[i].selected = true;
      break;
    }
  }

  for (var j = 0; j < monthSelect.options.length; j++) { // Step 3
    if (monthSelect.options[j].value == currentMonth.toString()) { // Step 4
      monthSelect.options[j].selected = true; // Step 5
      break;
    }
  }

  var loadButton = document.getElementById('loadButton');
  loadButton.addEventListener('click', function () { // Step 2
    var calendarItems = processLines(lines);
    const yearSelect = document.getElementById('year');
    const year = yearSelect.value;
    const monthSelect = document.getElementById('month');
    const month = monthSelect.value;
    calendarItemList = [];
    for (let i = 0; i < calendarItems.length; i++) {
      const item = calendarItems[i];
      const itemDate = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
      if (itemDate.getFullYear() === parseInt(year) && itemDate.getMonth() + 1 === parseInt(month)) {
        calendarItemList.push(item);
      }
    }

    let dailyGrouppedReport = generateDailyGrouppedReport(calendarItemList);
    dailyGrouppedReport = dailyGrouppedReport.sort((a, b) => a.date.getDate() - b.date.getDate());

    const serializedCalendarItems = JSON.stringify(dailyGrouppedReport, null, 2); // Pretty print the JSON
    const textareaElement = document.getElementById("calendarItemsArea");
    textareaElement.value = serializedCalendarItems;

    alert('Calendar loaded');
  });

  var mergeButton = document.getElementById('mergeButton');
  mergeButton.addEventListener('click', function () {
    var dailyDetails = sessionData.timesheet.dailyDetails;
    calendarItemList = mergeCalendarData(dailyDetails, calendarItemList);

    const serializedCalendarItems = JSON.stringify(calendarItemList, null, 2); // Pretty print the JSON
    const textareaElement = document.getElementById("calendarItemsArea");
    textareaElement.value = serializedCalendarItems;

    alert('Calendar merged');
  });

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

  document.getElementById('fileInput').addEventListener('change', function (event) {
    // Check if a file was selected
    if (this.files && this.files.length > 0) {
      const file = this.files[0]; // Get the first file
      const reader = new FileReader(); // Create a FileReader

      reader.onload = function (event) {
        // This event is triggered when the file is read successfully
        const fileContent = event.target.result;
        lines.push(...fileContent.split(/\r?\n/));
        //printLogSettings(fileContent); // Do something with the content
        const serializedCalendarItems = JSON.stringify(lines, null, 2); // Pretty print the JSON
        const textareaElement = document.getElementById("calendarItemsArea");
        textareaElement.value = serializedCalendarItems;
      };

      reader.readAsText(file); // Read the file as text
    }
  });

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

});

function mergeCalendarData(dailyDetails, calendarItemList) {
  for (const dateKey in dailyDetails) {
    const dailyData = dailyDetails[dateKey];
    const date = dailyData.date;
    const clockEntries = dailyData.clockEntries;

    if (clockEntries.length) {
      const calendarItem = calendarItemList.find((item) => item.Date === date);

      if (calendarItem) {
        const firstItem = calendarItem.Items[0];
        const lastItem = calendarItem.Items[calendarItem.Items.length - 1];

        // Correct start time of first item based on clock entry start
        firstItem.Date = clockEntries[0].start;

        // Check if clock entry end time extends beyond calendar item duration
        const lastItemEndDate = new Date(lastItem.Date);
        lastItemEndDate.setMinutes(lastItemEndDate.getMinutes() + lastItem.TotalDuration);
        if (new Date(clockEntries[0].end) > lastItemEndDate) {
          const extendedDuration = new Date(clockEntries[0].end) - lastItemEndDate;
          lastItem.TotalDuration += Math.ceil(extendedDuration / (1000 * 60)); // Convert milliseconds to minutes (rounded up)
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

function processLines(lines) {
  const DEF_SUMMARY_PREFIX = "SUMMARY:";
  const DEF_START_PREFIX = "DTSTART;TZID=";
  const DEF_END_PREFIX = "DTEND;TZID=";
  const DEF_ALL_DAY_EVENT = "DTSTART;VALUE=DATE:";

  const calendarItems = [];
  let calendarItem = null;

  for (const origLine of lines) {
    const line = origLine.replace("\r", "");

    if (line.startsWith(DEF_SUMMARY_PREFIX)) {
      if (calendarItem && calendarItem.date > new Date(0)) {
        // Assuming IsCalendarItemSelected is already implemented in JS
        calendarItem.isSelected = isCalendarItemSelected(calendarItem);
        calendarItems.push(calendarItem);
        calendarItem = null;
      }
      calendarItem = {}; // Create a new object for each calendar item
      calendarItem.title = line.substring(DEF_SUMMARY_PREFIX.length);
      // Assuming SetCalendarItemTask is already implemented in JS
      setCalendarItemTask(calendarItem);
    } else if (line.startsWith(DEF_START_PREFIX) && calendarItem) {
      const date = extractDateTime(line);
      calendarItem.date = date;
    } else if (line.startsWith(DEF_END_PREFIX) && calendarItem) {
      const endDate = extractDateTime(line);
      calendarItem.duration = endDate - calendarItem.date;
    } else if (line.startsWith(DEF_ALL_DAY_EVENT) && calendarItem) {
      const date = extractDate(line);
      calendarItem.date = date;
      calendarItem.duration = 0; // Assuming duration is represented by milliseconds
    }
  }

  // Check for the last item (if summary line exists)
  if (calendarItem && calendarItem.date > new Date(0)) {
    calendarItem.isSelected = isCalendarItemSelected(calendarItem);
    calendarItems.push(calendarItem);
  }

  return calendarItems;
}

function generateDailyGrouppedReport(calendarItems) {
  const groupedReport = [];

  // Group calendar items by date
  const groupedByDate = calendarItems
    .filter(item => item.isSelected) // Use filter instead of Where
    .reduce((acc, item) => {
      const theDate = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
      const key = theDate;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

  for (const key in groupedByDate) {
    const group = groupedByDate[key];
    const reportLine = {
      date: new Date(key),
      items: [],
    };

    // Group items within each date by task
    const groupedByTask = group.reduce((acc, item) => {
      const taskKey = item.taskData;
      acc[taskKey] = acc[taskKey] || [];
      acc[taskKey].push(item);
      return acc;
    }, {});

    for (const taskKey in groupedByTask) {
      const taskGroup = groupedByTask[taskKey];
      const reportItem = {
        date: reportLine.date, // Same date for all items in the report line
        taskData: taskKey,
        totalDuration: taskGroup.reduce((sum, item) => sum + item.duration / (1000 * 60), 0),
        count: taskGroup.length,
      };

      reportLine.items.push(reportItem);
    }

    reportLine.totalDuration = reportLine.items.reduce((sum, item) => sum + item.totalDuration, 0);
    reportLine.count = reportLine.items.reduce((sum, item) => sum + item.count, 0);

    groupedReport.push(reportLine);
  }

  return groupedReport;
}


function adjustReportToWeekdays(dailyGrouppedReport, weekdayHours, defaultTask) {
  // Get the first item in the dailyGrouppedReport list
  const firstReportDay = dailyGrouppedReport.find(item => item);

  if (firstReportDay) {
    const month = firstReportDay.date.getMonth() + 1; // Months are 0-indexed in JS
    const year = firstReportDay.date.getFullYear();

    // Get the total number of days in the month
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Loop through each day of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      // Create a new Date object for the current day
      const currentDate = new Date(year, month - 1, day);

      const weekdayConfig = weekdayHours.find(w => w.DOW === currentDate.getDay());

      if (weekdayConfig) {
        const reportLine = dailyGrouppedReport.find(x => x.date.getDate() === currentDate.getDate());

        if (!reportLine) {
          reportLine = {
            date: currentDate,
            items: [],
          };
          dailyGrouppedReport.push(reportLine);
        }

        // Sort items by date
        reportLine.items = reportLine.items.sort((a, b) => a.date - b.date);

        // Adjust the items
        let currentStart = new Date(
          reportLine.date.getFullYear(),
          reportLine.date.getMonth(),
          reportLine.date.getDate(),
          weekdayConfig.start.hour,
          weekdayConfig.start.minute,
          weekdayConfig.start.second,
          weekdayConfig.start.offset
        );

        for (const item of reportLine.items) {
          const duration = TimeSpan.fromMinutes(item.totalDuration);
          item.date = currentStart;
          currentStart = currentStart.add(duration);
        }

        // Add new item that ends at WeekdayHoursConfig.End
        const remainingDuration = weekdayConfig.end.getTimeOfDay() - currentStart.getTimeOfDay();
        if (remainingDuration > 0) {
          reportLine.items.push({
            date: currentStart,
            taskData: defaultTask,
            totalDuration: remainingDuration / (1000 * 60), // Convert milliseconds to minutes
            count: 1,
          });
        }

        // Update TotalDuration and Count of the report line
        reportLine.totalDuration = reportLine.items.reduce((sum, item) => sum + item.totalDuration, 0);
        reportLine.count = reportLine.items.length;
      }
    }
  }

  return dailyGrouppedReport.sort((a, b) => a.date - b.date);
}


function setCalendarItemTask(calendarItem) {
  let result = null;

  for (const t of tasksConfig.filter(x => !x.isDefault)) {
    if (t.keyWords.some(k => calendarItem.title.includes(k))) {
      result = t; // {t.project}/{t.task} (assuming project and task properties exist)
      break;
    }
  }

  calendarItem.taskData = result || tasksConfig.find(x => x.isDefault);
}

function extractDate(line) {
  const datetimeStr = line.slice(-8); // Use slice for substring extraction
  const format = "yyyyMMdd";
  const dateTime = new Date(datetimeStr.replace(/\D/g, "")); // Parse as integer
  return dateTime;
}

function extractDateTime(line) {
  const datetimeStr = line.slice(-15);
  const dateTime = convertStringToDate(datetimeStr.replace(/\D/g, ""));
  return dateTime;
}

function convertStringToDate(str) {
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  const hours = str.slice(8, 10);
  const minutes = str.slice(10, 12);
  const seconds = str.slice(12);

  const date = new Date(year, month - 1, day, hours, minutes, seconds); // Month is 0-indexed
  return date;
}
function convertStringToDateParts(str) {
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  const hours = str.slice(8, 10);
  const minutes = str.slice(10, 12);
  const seconds = str.slice(12);

  return {year: year, month: month, day: day, hours: hours, minutes: minutes, seconds: seconds};
}

function isCalendarItemSelected(calendarItem) {
  const hasDuration = calendarItem.duration && calendarItem.duration > 0; // Check for positive duration
  const notCancelled = !cancelledItemKeys
    .some(key => calendarItem.title.includes(key)); // Case-sensitive keyword check

  return hasDuration && notCancelled;
}

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
