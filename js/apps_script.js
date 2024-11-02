function doPost(e) {
  try {
    Logger.log('Processing request:', e);

    const SPREADSHEET_ID = 'YOUR_GOOGLE_SPREADSHEET_ID';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    const data = JSON.parse(e.postData.contents);
    Logger.log('PostData:', data);

    // Extract config from data or use default values (as required by German labor law)
    const config = data.config || {
      plannedWorkDayHours: 8,
      firstBreakThresholdHours: 6,
      firstBreakMinutes: 30,
      secondBreakThresholdHours: 9,
      secondBreakMinutes: 15,
      sheetName: "Time Tracker"
    };
    Logger.log('Config:', config);

    if (config.sheetName === "CURRENT_YEAR") {
      Logger.log('Setting sheet name to current year');
      config.sheetName = new Date().getFullYear().toString();
    } else {
      Logger.log('Using sheet name:', config.sheetName);
    }

    let sheet = spreadsheet.getSheetByName(config.sheetName);

    if (!sheet) {
      Logger.log('Sheet not found, creating new sheet:', config.sheetName);
      sheet = spreadsheet.insertSheet(config.sheetName);
    } else {
      Logger.log('Sheet found:', sheet);
    }

    if (data.startTime) {
      Logger.log('Inserting new row with date, startTime, formulas');
      // Insert a new row with the provided date and startTime
      const newRow = sheet.appendRow([data.date, data.startTime]);

      // Insert formulas into columns D to G for the new row
      const lastRow = sheet.getLastRow();
      Logger.log('Added row:', lastRow);

      // Gross working time (D)

      sheet.getRange(lastRow, 4).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); C' + lastRow + ' - B' + lastRow + '; "")');

      // Break time (E) - Dynamic based on config
      Logger.log('Inserting break formula');
      const breakFormula = '=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); ' +
        'IF(D' + lastRow + ' > TIME(' + config.firstBreakThresholdHours + '; 0; 0); TIME(0; ' + config.firstBreakMinutes + '; 0); 0) + ' +
        'IF(D' + lastRow + ' > TIME(' + config.secondBreakThresholdHours + '; 0; 0); TIME(0; ' + config.secondBreakMinutes + '; 0); 0); "")';
      sheet.getRange(lastRow, 5).setFormula(breakFormula);

      // Net working time (F)
      Logger.log('Inserting net working time formula');
      sheet.getRange(lastRow, 6).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); D' + lastRow + ' - E' + lastRow + '; "")');

      // Time balance (G) - Dynamic based on planned work day hours
      Logger.log('Inserting time balance formula');
      sheet.getRange(lastRow, 7).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); F' + lastRow + ' - TIME(' + config.plannedWorkDayHours + '; 0; 0); "")');

      Logger.log('Done');
    }

    if (data.stopTime) {
      Logger.log('Inserting stopTime into last row');
      const lastRow = sheet.getLastRow();
      Logger.log('Last row:', lastRow);

      // Set stopTime in column C
      Logger.log('Setting stopTime in last row');
      sheet.getRange(lastRow, 3).setValue(data.stopTime);

      Logger.log('Done');
    }

    Logger.log('Returning success');
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'data': data })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.error('Error in doPost:', error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}