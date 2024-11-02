# WorkTimeTracker

WorkTimeTracker is a lightweight vanilla JS web application for tracking working hours with automatic Google Sheets integration.

## 📷 Screenshots

| Start Page                         | Running Timer                              |
| ---------------------------------- | ------------------------------------------ |
| ![start view](./screenshots/1.png) | ![timer running view](./screenshots/2.png) |

| Work time reached                           | Overtime counter                         |
| ------------------------------------------- | ---------------------------------------- |
| ![work time fulfilled](./screenshots/3.png) | ![overtime tracker](./screenshots/4.png) |

## 🌟 Features

- Simple start & stop time tracking
- Automatic break time calculations compliant with [German labor law](https://www.gesetze-im-internet.de/arbzg/__4.html)
- Real-time countdown to work day completion
- Overtime tracking
- Automatic data storage in Google Sheets
- Local storage backup
- Mobile-first interface

## 📊 Time Tracking Features

- Configurable work day duration
- Automatic (configurable) break deductions:
  - First break (30 minutes) after 6 hours
  - Second break (15 minutes) after 9 hours
- Real-time display of:
  - Start and estimated Stop time
  - Remaining work time
  - Total worked time
  - Overtime duration

## 🔧 Technical Details

- Pure vanilla JavaScript, HTML, and CSS
- No external dependencies
- Google Apps Script integration

## 📝 Google Sheets Integration

Automatically logs:

- Date
- Start time
- End time
- Gross working time
- Break time
- Net working time
- Daily time balance

## 🚀 Getting Started

To set up the project, follow these steps:

1. Clone the repository.
2. Copy `./js/config.template.js` to `./js/config.js`
3. Create a new Google Sheet.
4. Insert the following headers in the first row: `Date`, `Start time`, `End time`, `Gross working time`, `Break time`, `Net working time`, `Difference target / actual`.
5. In cell `H:1`, insert the calculation of your time credit: `=SUM(G:G;G1)`.
6. Delete all empty rows.
7. In Google Sheet, go to `Extensions` -> `Apps Script`.
8. Paste the contents of `./js/apps_script.js` into the editor.
9. In the Apps Script Editor, update the `SPREADSHEET_ID` variable with the ID of your Google Sheet (part of the URL).
10. Deploy the script as a web app by clicking the `Deploy` button and selecting `New deployment`.
11. Copy the URL of the web application and update the `APPS_SCRIPT_URL` in `./js/config.js` with your URL.
12. (Optional) Customize the `PLANNED_WORK_DAY_HOURS`, `FIRST_BREAK_THRESHOLD_HOURS`, `FIRST_BREAK_MINUTES`, `SECOND_BREAK_THRESHOLD_HOURS` and `SECOND_BREAK_MINUTES` variables in `./js/config.js` to fit your needs.
13. (Optional) Copy the files (except `./screenshots/` and `README.md`) to a (static) web server of your choice.
14. Visit the web server's URL in your browser OR open the `index.html` file directly in your browser.
15. Start tracking your working hours by clicking the `Start` button. A new row will be added to your Google Sheet with the current date and time.
16. Click the `Stop` button to stop tracking your working hours. The end time will be added to the row in your Google Sheet.
