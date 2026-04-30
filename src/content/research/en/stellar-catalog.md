---
title: "Multi-band Stellar Catalog Construction"
status: "ongoing"
description: "Building a comprehensive multi-band photometric catalog by cross-matching data from ground and space observatories."
cover: "/images/research/placeholder-research-3.svg"
tags: ["catalog", "photometry", "cross-match"]
order: 3
---

## Background

Modern astronomical surveys observe the sky across a wide range of wavelengths, from the ultraviolet to the mid-infrared. Each survey provides complementary information about stellar properties: ultraviolet fluxes constrain hot stellar populations and chromospheric activity, optical bands provide the bulk of stellar classification data, and infrared observations penetrate dust-obscured regions and are sensitive to cool stellar atmospheres. However, merging data from heterogeneous surveys into a single, self-consistent catalog remains a technically demanding task due to differences in spatial resolution, photometric systems, astrometric precision, and survey depth.

## Methodology

We employ a probabilistic cross-matching algorithm based on Bayesian inference that accounts for positional uncertainties, proper motions, and the expected distribution of sources on the sky. Our pipeline ingests data from Gaia DR3, 2MASS, WISE, Pan-STARRS, and GALEX, performing iterative astrometric alignment and photometric zero-point calibration. We apply quality flags to identify blended sources, artifacts, and unreliable photometry. The resulting catalog includes homogenized magnitudes, colors, and associated uncertainties, along with cross-identification tables linking entries across input surveys.

## Current Progress

The current version of the catalog contains photometric measurements for approximately 500 million unique sources across 12 photometric bands spanning 0.15–22 micrometers. We have validated the catalog against spectroscopic benchmarks from APOGEE and GALAH, confirming photometric accuracy to within 0.02 mag in most bands. A web-based query interface and bulk download service are under development. We plan to incorporate data from upcoming surveys including CSST and Euclid in future releases.

## Related Publications

- Placeholder Author et al. (2025), *AJ*, in prep — "A Multi-band Photometric Catalog of 500 Million Stars"
- Placeholder Author et al. (2024), *PASP*, 136, 044501 — "Probabilistic Cross-Matching of Large Astronomical Catalogs"
