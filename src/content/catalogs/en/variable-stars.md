---
title: "Variable Stars Catalog in the Galactic Bulge"
description: "A catalog of variable stars identified from multi-epoch spectroscopic observations toward the Galactic bulge region."
version: "1.0"
rows: 50
dataFile: "/catalogs/variable-stars-catalog.json"
columns:
  - { key: "id", label: "ID", type: "string" }
  - { key: "name", label: "Name", type: "string" }
  - { key: "ra", label: "RA (J2000)", type: "ra" }
  - { key: "dec", label: "Dec (J2000)", type: "dec" }
  - { key: "magnitude", label: "V mag", type: "number" }
  - { key: "period", label: "Period (d)", type: "number" }
  - { key: "type", label: "Var. Type", type: "string" }
  - { key: "metallicity", label: "[Fe/H]", type: "number" }
  - { key: "distance_kpc", label: "Dist (kpc)", type: "number" }
citation: "Placeholder et al. (2024), ApJ, 965, 112"
doi: "10.3847/1538-4357/xxxx"
---

## Description

This catalog presents a comprehensive collection of variable stars identified in the Galactic bulge region through multi-epoch spectroscopic observations. The survey was conducted using high-resolution spectrographs on 4-meter class telescopes, covering a field of approximately 10 square degrees centered on the Galactic center. The observations span a baseline of over three years, enabling the detection of periodic variability across a wide range of timescales.

The catalog includes two major classes of pulsating variable stars: RR Lyrae stars, which are radially pulsating horizontal-branch stars with periods typically less than one day, and classical Cepheids, which are more luminous pulsating supergiants with longer periods. Both types serve as critical distance indicators in stellar astrophysics and are fundamental to calibrating the cosmic distance ladder.

Each star in the catalog has been classified based on its light curve morphology, period, and spectroscopic properties. The photometric data were obtained in the V-band, while metallicities ([Fe/H]) were derived from equivalent width measurements of iron lines in the high-resolution spectra. Distances were estimated using period-luminosity relations appropriate for each variable type, with corrections applied for interstellar extinction using three-dimensional dust maps.

The catalog is designed to support studies of the structure and stellar populations of the Galactic bulge, including investigations of the metallicity distribution function, the distance distribution along different lines of sight, and the kinematic properties of old and intermediate-age stellar populations in this region.

## Data Access

The full catalog is available for download in JSON format from this page. The interactive table below allows you to search, sort, and filter the data. You can also download the complete dataset for offline analysis.

The data columns include:
- **ID**: Unique identifier for each source
- **Name**: Variable star designation following IAU conventions
- **RA / Dec**: J2000 equatorial coordinates in sexagesimal format
- **V mag**: Mean V-band apparent magnitude
- **Period**: Pulsation period in days
- **Var. Type**: Variability classification (RR Lyrae or Cepheid)
- **[Fe/H]**: Spectroscopic metallicity on the standard scale
- **Dist (kpc)**: Heliocentric distance in kiloparsecs

## Citation

If you use this catalog in your research, please cite:

> Placeholder et al. (2024), "Variable Stars in the Galactic Bulge from Multi-Epoch Spectroscopy", *The Astrophysical Journal*, 965, 112. DOI: [10.3847/1538-4357/xxxx](https://doi.org/10.3847/1538-4357/xxxx)

## Version History

- **v1.0** (2024-01-15): Initial release with 50 sources.
