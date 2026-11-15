# MoonFix — Data Sources, AI Use, Licensing and Limitations

## NASA and other reference sources

- NASA/JPL Solar System Dynamics — Horizons: https://ssd.jpl.nasa.gov/horizons/
- NASA LRO / Lunar Orbiter Laser Altimeter (LOLA), Planetary Data System: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- NASA LOLA overview: https://science.nasa.gov/mission/lro/lola/
- NASA Space Apps Lunar Landing Site Navigator challenge: https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/

## How the app uses the sources

The packaged input table consists of 720 participant-supplied hourly records, grouped into ten lunar south-pole site candidates. Its supplied provenance describes celestial geometry derived from NASA/JPL Horizons (DE441) and direction-specific terrain skyline and slope summaries from NASA LRO/LOLA material. The released MoonFix viewer consumes those derived values. It does not independently acquire or recompute the source ephemerides or high-resolution terrain products. The raw numerical generation pipeline and complete source DEM / Horizons responses are not packaged. Reference source dates and TDB ephemeris epochs are scientific data, not software creation times.

The app uses the equations `Sun elevation - terrain skyline - clearance margin` and `Earth elevation - terrain skyline - clearance margin` on each sample. Modeled continuous-looking windows are produced by *linear interpolation between adjacent samples*, not by a physics or ray-tracing simulation that validates every instant.

Reference thumbnails embedded in the input dataset were provided with that dataset; their original generation/rights were not independently verified in this packaging step. The participant must confirm permission to publish all included inputs and images.

## What we do not claim

- No NASA endorsement, affiliation, operational approval or certification.
- No independently audited input geometry or raw terrain preprocessing.
- No visibility outside the three-day reference period.
- No communication link-budget, power, thermal, collision, landing hazard or spacecraft trajectory analysis.

## AI / SI disclosure

OpenAI ChatGPT assisted with implementation and refactoring of the interface and analysis code, automated test creation, explanatory copy, a slide deck and a short demonstration video. Visible AI-assistance labels are present in the demo slides and video. The input science table came from participant-supplied references; its original production history is not independently attested by this software release. The participant must add any other AI tools used, including if AI was used to create or process the reference data.

## Licensing

The original MoonFix program files in the accompanying software package declare the MIT license for the program code. Reference science inputs, images and data carry their own origins and do not become MIT-licensed simply by inclusion in the repository. Check data and image rights before publishing. The NASA Space Apps terms require appropriate attribution and publication rights: https://www.spaceappschallenge.org/legal/.
