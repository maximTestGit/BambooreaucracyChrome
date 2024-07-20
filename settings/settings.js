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
    const calendarItemsSorted = calendarItems.sort((a, b) => a.date - b.date);
  
    // Step 1: Serialize calendarItemsSorted into a JSON string
    const serializedCalendarItems = JSON.stringify(calendarItemsSorted, null, 2); // Pretty print the JSON
  
    // Step 2: Find the textarea element by its ID
    const textareaElement = document.getElementById("calendarItemsArea");
  
    // Step 3: Set the value of the textarea to the serialized JSON string
    textareaElement.value = serializedCalendarItems;
  
    alert('Button clicked!');
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
        console.log(fileContent); // Do something with the content
      };

      reader.readAsText(file); // Read the file as text
    }
  });
});

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

function isCalendarItemSelected(calendarItem) {
  const hasDuration = calendarItem.duration && calendarItem.duration > 0; // Check for positive duration
  const notCancelled = !cancelledItemKeys
    .some(key => calendarItem.title.includes(key)); // Case-sensitive keyword check

  return hasDuration && notCancelled;
}
