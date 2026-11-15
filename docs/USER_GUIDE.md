# Quick operating guide

1. Open `index.html` locally in a browser.
2. In **Mission parameters**, set the start/end sample epochs. These times are *TDB*, not your computer's local clock. Use the three day-presets or the full 72-sample span.
3. Change the angular terrain-clearance margin from 0 to 3 degrees.
4. Apply a longest-model-window requirement and a slope P95 limit. The ranking immediately marks candidates that satisfy all conditions.
5. Choose a primary site with the dropdown, polar-map pin, or ranking table.
6. Inspect the Sun/Earth clearance chart, move the hour scrubber or click a modeled window.
7. Choose a comparison site to read the two-site timeline heatmaps (both, Sun only, Earth only, neither).
8. Click **Export ranking** or **Export windows** to download CSV results. On a hosted page use **Share view** to encode the selected settings into the URL.

### Interpreting the numbers

- `45 / 72` means 45 of the 72 *sampled epochs* pass the required conditions; it is not proof of 45 uninterrupted hours.
- `44.03 h` is an estimated duration under the linear between-hour model.
- A result that reaches the sample endpoint is truncated by the reference range. Its actual future endpoint is unknown.
- A slope P95 reading summarizes a local DEM neighborhood, not a touchdown safety guarantee.

### Publishing notes

`index.html` contains its data and styling. Upload only that one file to a static host for a working demonstration, or upload the entire package for source transparency. Document any additional upstream data transformations separately. Do not treat scientific input dates as developer commit or file timestamps.
