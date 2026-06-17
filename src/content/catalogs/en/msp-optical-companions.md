---
title: "Optical Companions to Millisecond Pulsars in Globular Clusters"
description: "A catalog of optical counterparts to millisecond pulsars (MSPs) identified in Galactic globular clusters, including photometric and orbital parameters."
version: "1.0"
rows: 30
dataFile: "/catalogs/msp-optical-companions-catalog.json"
columns:
  - { key: "id", label: "ID", type: "string" }
  - { key: "cluster", label: "Cluster", type: "string" }
  - { key: "pulsar", label: "Pulsar", type: "string" }
  - { key: "ra", label: "RA (J2000)", type: "ra" }
  - { key: "dec", label: "Dec (J2000)", type: "dec" }
  - { key: "companion_mag", label: "V mag", type: "number" }
  - { key: "orbital_period", label: "P_orb (d)", type: "number" }
  - { key: "companion_type", label: "Comp. Type", type: "string" }
citation: "Placeholder et al. (2025), ApJ, submitted"
doi: "10.3847/1538-4357/xxxx"
---

## Description

This catalog compiles optical counterparts to millisecond pulsars (MSPs) in Galactic globular clusters. Millisecond pulsars are rapidly rotating neutron stars that have been spun up through mass transfer from a companion star in a binary system. Identifying and characterizing the optical companions to these MSPs provides crucial constraints on binary evolution models, the formation channels of MSPs in dense stellar environments, and the physics of compact binary systems.

The observations were carried out using deep optical imaging and multi-object spectroscopy on 8-meter class telescopes, supplemented by archival Hubble Space Telescope data for clusters with high stellar densities. Companion identification relies on positional coincidence with radio timing positions, optical variability at the pulsar orbital period, and spectral energy distribution fitting.

## Data Access

The full catalog is available for download in JSON format. The interactive table below allows you to search, sort, and filter the data.

The data columns include:
- **ID**: Unique identifier for each source
- **Cluster**: Host globular cluster designation
- **Pulsar**: Millisecond pulsar designation within the cluster
- **RA / Dec**: J2000 equatorial coordinates in sexagesimal format
- **V mag**: Apparent V-band magnitude of the optical companion
- **P_orb (d)**: Orbital period of the binary system in days
- **Comp. Type**: Spectral classification of the companion (e.g., He WD, CO WD, MS, ultra-low mass)

## Citation

If you use this catalog in your research, please cite:

> Placeholder et al. (2025), "Optical Companions to Millisecond Pulsars in Galactic Globular Clusters", *The Astrophysical Journal*, submitted. DOI: [10.3847/1538-4357/xxxx](https://doi.org/10.3847/1538-4357/xxxx)

## Version History

- **v1.0** (2025-06-15): Initial release with 30 sources across 12 globular clusters.
