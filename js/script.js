/**
 * URL for the Google Apps Script endpoint
 * @constant {string}
 */
const APPS_SCRIPT_URL = 'APPS_SCRIPT_URL';

/**
 * Number of hours in a planned work day
 * @constant {number}
 */
const PLANNED_WORK_DAY_HOURS = 8;

/**
 * Hour threshold when first break becomes mandatory
 * @constant {number}
 */
const FIRST_BREAK_THRESHOLD_HOURS = 6;

/**
 * Duration of first mandatory break in minutes
 * @constant {number}
 */
const FIRST_BREAK_MINUTES = 30;

/**
 * Hour threshold when second break becomes mandatory
 * @constant {number}
 */
const SECOND_BREAK_THRESHOLD_HOURS = 9;

/**
 * Duration of second mandatory break in minutes
 * @constant {number}
 */
const SECOND_BREAK_MINUTES = 15;

/**
 * State variables for tracking time and intervals
 * @type {Date} startTime - Work start timestamp
 * @type {Date} stopTime - Work stop timestamp
 * @type {number} countdownInterval - Interval ID for countdown timer
 * @type {number} overtimeInterval - Interval ID for overtime timer
 */
let startTime, stopTime, countdownInterval, overtimeInterval;

/**
 * Initialize app when DOM content is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    loadStoredTimes();
    addEventListeners();
});

/**
 * Load and process stored start/stop times from localStorage
 */
function loadStoredTimes() {
    let storedStartTime = localStorage.getItem('startTime');
    let storedStopTime = localStorage.getItem('stopTime');

    if (storedStartTime) {
        storedStartTime = new Date(storedStartTime);
        updateElementText('startTime', formatGermanTime(storedStartTime));

        if (storedStopTime) {
            // If stop time is stored, display the worked time
            storedStopTime = new Date(storedStopTime);
            updateElementText('stopTime', formatGermanTime(storedStopTime));

            let workedTime = getWorkedTime(storedStartTime, storedStopTime);
            calculateAndShowDuration(workedTime);

            displayLabel('workedTimeLabel');
            startTime = null; // Reset startTime to allow new start
        } else {
            // If no stop time is stored, display the countdown
            let plannedStopTime = calculatePlannedStopTime(storedStartTime);
            updateElementText('stopTime', formatGermanTime(plannedStopTime));
            startWorkTimeTimer(plannedStopTime);
            startTime = storedStartTime; // Set startTime to prevent new start
        }
    }
}

/**
 * Add click event listeners to start/stop buttons
 */
function addEventListeners() {
    document.getElementById('startButton').addEventListener('click', handleStart);
    document.getElementById('stopButton').addEventListener('click', handleStop);
}

/**
 * Handle start button click - begins work timer
 */
function handleStart() {
    if (startTime) {
        alert('Press stop first!');
        return;
    }

    // Clear any existing intervals
    clearInterval(countdownInterval);
    clearInterval(overtimeInterval);

    startTime = new Date();
    writeTimeToSheet('startTime', formatDate(startTime), formatGermanTime(startTime, true));
    console.log('startTime', formatDate(startTime), formatGermanTime(startTime, true));
    updateElementText('startTime', formatGermanTime(startTime));
    // Store start time in local storage
    localStorage.setItem('startTime', startTime);

    // Remove potentially stored stop time
    localStorage.removeItem('stopTime');

    let plannedStopTime = calculatePlannedStopTime(startTime);
    startWorkTimeTimer(plannedStopTime);
    updateElementText('countdown', formatTimeDifference(getWorkTimeLeft(plannedStopTime)));
    displayLabel('countdownLabel');
    updateElementText('stopTime', formatGermanTime(plannedStopTime));
}

/**
 * Handle stop button click - ends work timer
 */
function handleStop() {
    if (!startTime) {
        alert('Press start first!');
        return;
    }
    stopTime = new Date();
    writeTimeToSheet('stopTime', formatDate(stopTime), formatGermanTime(stopTime, true));
    console.log('stopTime', formatDate(stopTime), formatGermanTime(stopTime, true));

    // Store stop time in local storage
    localStorage.setItem('stopTime', stopTime);

    updateElementText('stopTime', formatGermanTime(stopTime));
    const workedTime = getWorkedTime(startTime, stopTime);
    calculateAndShowDuration(workedTime);
    displayLabel('workedTimeLabel');

    const [workedHours, workedMinutes] = splitTime(workedTime);
    alert(`Time Worked: ${padNumber(workedHours)} hours and ${padNumber(workedMinutes)} minutes.`);

    // Reset time variables after stopping
    startTime = null;
    stopTime = null;
}

/**
 * Start countdown timer to planned stop time
 * @param {Date} plannedStopTime - Calculated work end time
 */
function startWorkTimeTimer(plannedStopTime) {
    clearInterval(countdownInterval);

    // Update immediately first
    const workTimeLeft = getWorkTimeLeft(plannedStopTime);
    updateElementText('countdown', formatTimeDifference(workTimeLeft));

    // Then start interval for subsequent updates
    countdownInterval = setInterval(() => {
        const workTimeLeft = getWorkTimeLeft(plannedStopTime);
        if (workTimeLeft <= 0) {
            startOvertimeTimer(plannedStopTime);
            displayLabel('overtimeLabel');
            alert('Work is over! Time to go home!');
        } else {
            updateElementText('countdown', formatTimeDifference(workTimeLeft));
        }
    }, 1000);
}

/**
 * Start overtime timer after planned stop time
 * @param {Date} stopTime - Planned stop timestamp
 */
function startOvertimeTimer(stopTime) {
    clearInterval(overtimeInterval);

    // Update immediately first
    const overtime = new Date() - stopTime;
    updateElementText('overtime', formatTimeDifference(overtime));

    // Then start interval for subsequent updates
    overtimeInterval = setInterval(() => {
        const overtime = new Date() - stopTime;
        updateElementText('overtime', formatTimeDifference(overtime));
    }, 1000);
}

/**
 * Calculate planned stop time based on start time and break rules
 * @param {Date} startTime - Work start timestamp
 * @returns {Date} Planned stop time including mandatory breaks
 */
function calculatePlannedStopTime(startTime) {
    if (PLANNED_WORK_DAY_HOURS > SECOND_BREAK_THRESHOLD_HOURS) {
        // Add PLANNED_WORK_DAY_HOURS hours, 30 minutes (first required break) and 15 minutes (second required break)
        return new Date(startTime.getTime() +
            (PLANNED_WORK_DAY_HOURS * 60 * 60 * 1000) +
            (FIRST_BREAK_MINUTES * 60 * 1000) +
            (SECOND_BREAK_MINUTES * 60 * 1000));
    } else if (PLANNED_WORK_DAY_HOURS > FIRST_BREAK_THRESHOLD_HOURS) {
        // Add PLANNED_WORK_DAY_HOURS hours and 30 minutes (first required break)
        return new Date(startTime.getTime() +
            (PLANNED_WORK_DAY_HOURS * 60 * 60 * 1000) +
            (FIRST_BREAK_MINUTES * 60 * 1000));
    } else {
        // Add PLANNED_WORK_DAY_HOURS hours without breaks
        return new Date(startTime.getTime() + (PLANNED_WORK_DAY_HOURS * 60 * 60 * 1000));
    }
}

/**
 * Calculate and display duration between start and stop times
 * @param {Date} startTime - Work start timestamp
 * @param {Date} stopTime - Work end timestamp
 * @param {boolean} showAlert - Whether to show alert with worked time
 */
function calculateAndShowDuration(workedTime) {
    let [workedHours, workedMinutes, workedSeconds] = splitTime(workedTime);

    // If worked hours are greater than the first break threshold, deduct the first break
    if (workedHours > FIRST_BREAK_THRESHOLD_HOURS ||
        (workedHours === FIRST_BREAK_THRESHOLD_HOURS && workedMinutes > 0)) {
        [workedHours, workedMinutes] = deductBreakTime(workedHours, workedMinutes, FIRST_BREAK_MINUTES);
    }

    // If worked hours are also greater than the second break threshold, also deduct the second break
    if (workedHours > SECOND_BREAK_THRESHOLD_HOURS ||
        (workedHours === SECOND_BREAK_THRESHOLD_HOURS && workedMinutes > 0)) {
        [workedHours, workedMinutes] = deductBreakTime(workedHours, workedMinutes, SECOND_BREAK_MINUTES);
    }

    const formattedTime = `${padNumber(workedHours)}:${padNumber(workedMinutes)}:${padNumber(workedSeconds)}`;
    updateElementText('workedTime', formattedTime);
}

/**
 * Write time entry to Google Sheet
 * @param {string} type - Either 'startTime' or 'stopTime'
 * @param {string} date - Formatted date string
 * @param {string} time - Formatted time string
 */
function writeTimeToSheet(type, date, time) {
    const data = {
        date,
        startTime: type === 'startTime' ? time : '',
        stopTime: type === 'stopTime' ? time : ''
    };

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => console.log(`${type} '${date}' sent to Google Sheets:`, response))
        .catch(error => {
            console.error(`Error writing ${type}: '${date}' to Google Sheets:`, error);
            alert(`Error writing ${type} '${date}' to Google Sheets.`);
        });
}

/**
 * Deduct break time from worked hours/minutes
 * @param {number} hours - Worked hours
 * @param {number} minutes - Worked minutes
 * @param {number} breakMinutes - Break duration in minutes
 * @returns {[number, number]} Updated hours and minutes
 */
function deductBreakTime(hours, minutes, breakMinutes) {
    minutes -= breakMinutes;
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }
    return [hours, minutes];
}

/**
 * Calculate remaining work time
 * @param {Date} stopTime - Target stop time
 * @returns {number} Milliseconds until stop time
 */
function getWorkTimeLeft(stopTime) {
    return stopTime - new Date();
}

/**
 * Calculate worked time between start and stop times
 * @param {Date} startTime - Work start timestamp
 * @param {Date} stopTime - Work end timestamp
 * @returns {number} Milliseconds of worked time
 */
function getWorkedTime(startTime, stopTime) {
    return stopTime - startTime;
}

/**
 * Format time to German format
 * @param {Date} date - Date object to format
 * @param {boolean} [withSeconds=false] - Include seconds in output
 * @returns {string} Formatted time string
 */
function formatGermanTime(date, withSeconds = false) {
    const [hours, minutes, seconds] = [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ].map(padNumber);

    return withSeconds ?
        `${hours}:${minutes}:${seconds}` :
        `${hours}:${minutes} Uhr`;
}

/**
 * Format date to German format
 * @param {Date} date - Date to format
 * @returns {string} Date formatted as DD.MM.YYYY
 */
function formatDate(date) {
    return [
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear()
    ].map(padNumber).join('.');
}

/**
 * Format millisecond duration to HH:MM:SS
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatTimeDifference(duration) {
    const [hours, minutes, seconds] = splitTime(duration);
    return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

/**
 * Split millisecond duration into hours, minutes, seconds
 * @param {number} duration - Duration in milliseconds
 * @returns {[number, number, number]} Array of [hours, minutes, seconds]
 */
function splitTime(duration) {
    return [
        Math.floor(duration / (1000 * 60 * 60)),
        Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
        Math.floor((duration % (1000 * 60)) / 1000)
    ];
}

/**
 * Pad single digit numbers with leading zero
 * @param {number|string} value - Number to pad
 * @returns {string} Padded number string
 */
function padNumber(value) {
    return value.toString().padStart(2, '0');
}

/**
 * Update text content of DOM element
 * @param {string} elementId - ID of target element
 * @param {string} text - New text content
 */
function updateElementText(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

/**
 * Show specified label and hide others
 * @param {string} showId - ID of label to show
 */
function displayLabel(showId) {
    let elementIDs = ['countdownLabel', 'workedTimeLabel', 'overtimeLabel'];

    elementIDs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === showId ? 'block' : 'none';
        } else {
            console.error(`Element with id '${id}' not found`);
        }
    });
}
