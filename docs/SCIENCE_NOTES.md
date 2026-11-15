# MoonFix — Model definition and boundaries

## Observation schema

`data/mission_samples.json` contains ten geographic sites. Each site includes its latitude, east-positive longitude, slope P95, local relief, mean elevation, an image preview, and 72 time-stamped arrays.

Each sample has the form:

`[epoch_tdb, sun_elevation, sun_azimuth, sun_terrain_skyline, earth_elevation, earth_azimuth, earth_terrain_skyline]`

All angles are in degrees. Times are **TDB** epochs as supplied in the reference input. They are not local New York, Rome, or browser times and are not file creation times. Each site contains an identical sample-epoch grid, from `2026-11-14T00:00:00` to `2026-11-16T23:00:00` TDB.

The data is derived from a participant-supplied reference combining NASA/JPL Horizons DE441 geometry and NASA LOLA local terrain analysis. MoonFix **does not** use current satellite telemetry, a live Horizons API, or freshly computed LOLA terrain horizons. Detailed original numerical preprocessing is not part of this clean app repository; replicating the original scientific inputs requires the corresponding raw ephemerides and DEM files.

## Visibility check

At an epoch with safety angle `m`:

```
Sun clearance   = Sun elevation   - Sun local terrain skyline   - m
Earth clearance = Earth elevation - Earth local terrain skyline - m

Joint passing sample = (Sun clearance >= 0) AND (Earth clearance >= 0)
```

The skyline angle varies with the direction to each body; the single site slope statistic is an independent local-terrain screening quantity.

## Between-hour approximation

For each one-hour pair of samples, the app linearly interpolates *both* clearances independently over the interval. It solves the inequalities `Sun clearance >= 0` and `Earth clearance >= 0` and intersects the intervals. Overlapping positive-duration intervals are joined into modeled windows. A window that reaches a selected analysis-range boundary has an *analysis-boundary truncation*, not a verified astronomical rise/set event.

A 24-row daily preset therefore contains **23 modeled one-hour gaps**, not 24 confirmed hours of continuous coverage.

## Ranking rule

A site is eligible if: (a) it contains at least one joint passing **sample**, (b) its longest modeled uninterrupted window reaches the user-selected minimum, and (c) its slope P95 meets the upper threshold. Candidates are sorted by eligibility first, then modeled total joint hours, sampled count, slope, site ID. The rule is an analytical filter, not an operational safety score.

## Limits

- 72 one-hour samples span 71 one-hour gaps. The interpolation output is a model, not a verified continuous-time trajectory.
- No solar panel power or lunar thermal model is included.
- Earth skyline visibility is not equivalent to a radio link budget; no Earth station availability is modeled.
- LOLA local relief cannot certify boulder-level touchdown safety.
- All images and maps are schematic or reference terrain previews, not a geo-registered mission GIS.
- This prototype does not extrapolate to dates not represented in the reference dataset.
- Nothing in the UI should be treated as NASA operational advice or flight certification.

## Public source references

- https://ssd.jpl.nasa.gov/horizons/
- https://pds-geosciences.wustl.edu/missions/lro/lola.htm
