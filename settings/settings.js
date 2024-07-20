document.addEventListener('DOMContentLoaded', function() {
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
});