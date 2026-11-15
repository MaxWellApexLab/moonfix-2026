# MoonFix — Data provenance, third-party references, reproducibility

## Scientific references

1. **NASA/JPL Solar System Dynamics, Horizons System:** https://ssd.jpl.nasa.gov/horizons/ . Horizons produces observer ephemerides including Sun/Earth direction, time-dependent azimuth and elevation. Reference manual: https://ssd.jpl.nasa.gov/horizons/manual.html .
2. **NASA Lunar Reconnaissance Orbiter, Lunar Orbiter Laser Altimeter (LOLA):** https://pds-geosciences.wustl.edu/missions/lro/lola.htm . LOLA measures lunar topography and supports slope, elevation and local horizon studies. NASA instrument description: https://science.nasa.gov/mission/lro/spacecraft-and-instruments/ .
3. **NASA Space Apps 2026 Lunar Landing Site Navigator challenge:** https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ .

## Exactly what this build includes

- Ten candidate lunar south-pole coordinates and 720 prepared hourly reference records from the participant-supplied sample file, spanning 14–16 November 2026 in the **TDB** timescale.
- Each record contains sample epoch, Sun apparent elevation/azimuth and local terrain skyline angle, Earth apparent elevation/azimuth and local terrain skyline angle, plus derived site-level slope/relief/elevation metrics and previews.
- These records were normalized from the supplied reference research; their original raw Horizons requests, output files, LOLA DEM tiles, input terrain-processing settings, error budgets and a fully repeatable data-preprocessing pipeline are **not included**. This is a traceability limitation, **not a claim of independently verified NASA products**.
- The offline JavaScript engine computes Sun/Earth clearance versus the supplied terrain skyline and margin. Between hourly epochs it uses linear interpolation to approximate positive clearance intervals. 72 samples provide at most 71 modeled one-hour intervals, not 72 verified continuous hours.

## Formula and scope

```
Sun clearance = supplied Sun elevation - supplied Sun skyline - user margin
Earth clearance = supplied Earth elevation - supplied Earth skyline - user margin
Joint passing epoch = Sun clearance >= 0 AND Earth clearance >= 0
```

It is a *screening and education tool* and does not certify power generation, communication signal strength, boulder-scale landing hazards or lander safety. It cannot analyze dates outside the supplied 72 epochs. A positive result is not a recommended operational landing site.

## Third-party visuals/code

The interactive site map is a deliberately schematic visualization of the ten coordinates, not a registered GIS layer. Embedded terrain previews are part of the participant-supplied research reference and cannot be represented as original NASA photos. The deployed website requires no third-party JavaScript, trackers, APIs or image CDN; all application resources are embedded in the HTML.
