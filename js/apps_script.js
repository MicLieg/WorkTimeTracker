function doPost(e) {
  const SPREADSHEET_ID = 'YOUR_GOOGLE_SPREADSHEET_ID';
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  const data = JSON.parse(e.postData.contents);
  // Extract config from data or use default values (as required by German labor law)
  const config = data.config || {
    plannedWorkDayHours: 8,
    firstBreakThresholdHours: 6,
    firstBreakMinutes: 30,
    secondBreakThresholdHours: 9,
    secondBreakMinutes: 15,
    sheetName: "Time Tracker"
  };

  if (config.sheetName === "CURRENT_YEAR") {
    config.sheetName = new Date().getFullYear().toString();
  }

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (data.startTime) {
    // Insert a new row with the provided date and startTime
    const newRow = sheet.appendRow([data.date, data.startTime, '']);

    // Insert formulas into columns D to G for the new row
    const lastRow = sheet.getLastRow();

    // Gross working time (D)
    sheet.getRange(lastRow, 4).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); C' + lastRow + ' - B' + lastRow + '; "")');

    // Break time (E) - Dynamic based on config
    const breakFormula = '=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); ' +
      'IF(D' + lastRow + ' > TIME(' + config.firstBreakThresholdHours + '; 0; 0); TIME(0; ' + config.firstBreakMinutes + '; 0); 0) + ' +
      'IF(D' + lastRow + ' > TIME(' + config.secondBreakThresholdHours + '; 0; 0); TIME(0; ' + config.secondBreakMinutes + '; 0); 0); "")';
    sheet.getRange(lastRow, 5).setFormula(breakFormula);

    // Net working time (F)
    sheet.getRange(lastRow, 6).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); D' + lastRow + ' - E' + lastRow + '; "")');

    // Time balance (G) - Dynamic based on planned work day hours
    sheet.getRange(lastRow, 7).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); F' + lastRow + ' - TIME(' + config.plannedWorkDayHours + '; 0; 0); "")');
  }

  if (data.stopTime) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3).setValue(data.stopTime);
  }

  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'data': data })).setMimeType(ContentService.MimeType.JSON);
}