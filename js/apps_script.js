function doPost(e) {
  const SPREADSHEET_ID = 'GOOGLE_SPREADSHEET_ID';
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const currentYear = new Date().getFullYear();
  const sheetName = currentYear.toString();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  const data = JSON.parse(e.postData.contents);

  if (data.startTime && !data.stopTime) {
    // Insert a new row with the provided date and startTime
    const newRow = sheet.appendRow([data.date, data.startTime, '']);

    // Insert formulas into columns D to G for the new row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); C' + lastRow + ' - B' + lastRow + '; "")');
    sheet.getRange(lastRow, 5).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); IF(D' + lastRow + ' > TIME(6; 0; 0); TIME(0; 30; 0); 0) + IF(D' + lastRow + ' > TIME(9; 0; 0); TIME(0; 15; 0); 0); "")');
    sheet.getRange(lastRow, 6).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); D' + lastRow + ' - E' + lastRow + '; "")');
    sheet.getRange(lastRow, 7).setFormula('=IF(AND(B' + lastRow + '<>""; C' + lastRow + '<>""); F' + lastRow + ' - TIME(8; 0; 0); "")');
  } else if (data.stopTime) {
    // Find the last non-empty row for the stopTime to be added
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3).setValue(data.stopTime); // Update the third column with stopTime
  }

  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'data': data })).setMimeType(ContentService.MimeType.JSON);
}
