# SafeWalk – Western Province

Leaflet web map with GeoJSON layers, current-location reporting, Google Form prefill, and optional Google Sheets complaint display.

## Files
- `index.html`
- `css/style.css`
- `js/script.js`
- `data/*.geojson`

## Google Form location prefill
The script uses the two entry IDs taken from the supplied Google Form screenshot:
- Longitude: `entry.756715849`
- Latitude: `entry.1288249379`

The values are sent as DMS strings such as `79°51'40.0"E` and `6°47'40.0"N`.

## Google Sheets complaint layer
1. Link the Google Form to a response Google Sheet.
2. In Google Sheets use File → Share → Publish to web and publish the response sheet/tab.
3. Copy the spreadsheet ID from the sheet URL.
4. Copy the response tab's `gid` from its URL.
5. In `js/script.js`, replace:
   `PASTE_YOUR_RESPONSE_SHEET_ID_HERE`
   and set `GOOGLE_SHEET_GID` to the response tab gid.
6. Commit the change and reload GitHub Pages.

The map expects columns containing Latitude and Longitude. It also detects common names for Issue Type, Severity Level, Description, Date Observed, and Evidence.

## GitHub Pages
Repository Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
