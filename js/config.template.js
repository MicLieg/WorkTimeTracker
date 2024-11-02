/**
 * URL for the Google Apps Script endpoint
 * @constant {string}
 */
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';

/**
 * Name of the sheet to store the data in
 * If set to "CURRENT_YEAR" the current year is used as sheet name and a new sheet is created for each new year
 * @constant {string}
 */
const SHEET_NAME = "Time Tracker";

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
