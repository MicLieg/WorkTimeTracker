let startTime, stopTime, countdownInterval, overtimeInterval;
const APPS_SCRIPT_URL = 'APPS_SCRIPT_URL';

document.addEventListener('DOMContentLoaded', () => {
    loadStoredTimes();
    addEventListeners();
});

function loadStoredTimes() {
    const storedStartTime = localStorage.getItem('startTime');
    const storedStopTime = localStorage.getItem('stopTime');

    if (storedStartTime) {
        startTime = new Date(storedStartTime);
        updateElementText('startTime', formatGermanTime(startTime));
        if (storedStopTime) {
            stopTime = new Date(storedStopTime);
            displayWorkedTime();
        } else {
            const initialEndTime = calculateEndTime(startTime);
            displayCountdown(initialEndTime);
        }
    }
}

function addEventListeners() {
    document.getElementById('startButton').addEventListener('click', handleStart);
    document.getElementById('stopButton').addEventListener('click', handleStop);
}

function handleStart() {
    startTime = new Date();
    localStorage.setItem('startTime', startTime);
    resetIntervals();
    updateElementText('startTime', formatGermanTime(startTime));

    const endTime = calculateEndTime(startTime);
    displayCountdown(endTime);
    writeTimeToSheet('startTime', formatDate(new Date()), formatGermanTime(startTime, true));
    localStorage.removeItem('stopTime');
}

function handleStop() {
    stopTime = new Date();
    localStorage.setItem('stopTime', stopTime);
    resetIntervals();
    updateElementText('endTime', formatGermanTime(stopTime));

    displayWorkedTime();
    writeTimeToSheet('stopTime', formatDate(new Date()), formatGermanTime(stopTime, true));
    calculateAndShowDuration(true);
}

function calculateEndTime(start) {
    return new Date(start.getTime() + (8 * 60 * 60 * 1000) + (30 * 60 * 1000));
}

function displayCountdown(endTime) {
    updateElementText('endTime', formatGermanTime(endTime));
    startCountdown(endTime);
    toggleVisibility('countdownLabel', true, 'workedTimeLabel', 'overtimeLabel');
}

function displayWorkedTime() {
    updateElementText('endTime', formatGermanTime(stopTime));
    calculateAndShowDuration(false);
    toggleVisibility('workedTimeLabel', true, 'countdownLabel', 'overtimeLabel');
}

function displayOvertime(initialEndTime) {
    resetIntervals();
    startOvertimeStopwatch(initialEndTime);
    toggleVisibility('overtimeLabel', true, 'countdownLabel', 'workedTimeLabel');
}

function startCountdown(endTime) {
    countdownInterval = setInterval(() => {
        const timeDiff = endTime - new Date();
        if (timeDiff <= 0) {
            clearInterval(countdownInterval);
            updateElementText('countdown', '00:00:00');
            alert('Work is over! Time to go home!');
            displayOvertime(endTime);
        } else {
            updateElementText('countdown', formatTimeDiff(timeDiff));
        }
    }, 1000);
}

function startOvertimeStopwatch(endTime) {
    overtimeInterval = setInterval(() => {
        const timeDiff = new Date() - endTime;
        updateElementText('overtime', formatTimeDiff(timeDiff));
    }, 1000);
}

function formatTimeDiff(timeDiff) {
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function calculateAndShowDuration(showAlert) {
    if (!startTime) {
        alert('Press start first!');
        return;
    }

    const duration = stopTime - startTime;
    let [workedHours, workedMinutes, workedSeconds] = [
        Math.floor(duration / (1000 * 60 * 60)),
        Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60)),
        Math.floor((duration % (1000 * 60)) / 1000),
    ];

    if (workedHours > 6 || (workedHours === 6 && workedMinutes > 0)) {
        workedMinutes -= 30;
        if (workedMinutes < 0) {
            workedHours -= 1;
            workedMinutes += 60;
        }
    }

    updateElementText('workedTime', `${pad(workedHours)}:${pad(workedMinutes)}:${pad(workedSeconds)}`);
    if (showAlert) alert(`Time Worked: ${pad(workedHours)} hours and ${pad(workedMinutes)} minutes.`);
}

function writeTimeToSheet(type, date, time) {
    const data = {
        date,
        startTime: type === 'startTime' ? time : '',
        stopTime: type === 'stopTime' ? time : '',
    };

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        .then(response => console.log(`${type} sent to Google Sheets:`, response))
        .catch(error => console.error(`Error writing ${type} to Google Sheets:`, error));
}

function formatGermanTime(date, includeSeconds = false) {
    const [hours, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()].map(pad);
    return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes} Uhr`;
}

function formatDate(date) {
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map(pad).join('.');
}

function pad(value) {
    return value.toString().padStart(2, '0');
}

function updateElementText(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

function toggleVisibility(showId, show, ...hideIds) {
    document.getElementById(showId).style.display = show ? 'block' : 'none';
    hideIds.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function resetIntervals() {
    clearInterval(countdownInterval);
    clearInterval(overtimeInterval);
}
