---
title: "Data-Driven Methods for Stellar Parameter Estimation"
status: "completed"
description: "Developing machine learning approaches for estimating stellar atmospheric parameters from low-resolution spectra."
cover: "/images/research/placeholder-research-2.svg"
tags: ["machine-learning", "stellar-parameters", "data-driven"]
order: 2
---

## Background

Traditional methods for determining stellar atmospheric parameters—effective temperature, surface gravity, and metallicity—rely heavily on physically motivated spectral models and manual analysis. While highly accurate, these approaches scale poorly to the millions of spectra being produced by modern surveys such as LAMOST, SDSS, and DESI. Data-driven methods, which learn the mapping between spectra and stellar labels from well-characterized training sets, offer a promising alternative that can match or exceed the precision of classical techniques at a fraction of the computational cost.

## Methodology

We developed a neural-network-based framework called StarNet-v2 that predicts stellar atmospheric parameters directly from flux-calibrated spectra. The model architecture consists of a series of one-dimensional convolutional layers followed by fully connected layers, trained on a curated set of benchmark stars with parameters determined from high-resolution spectroscopic analysis. We implemented domain-adaptation techniques to handle systematic differences between training and target surveys, and incorporated uncertainty quantification using Monte Carlo dropout. Extensive cross-validation was performed using data from APOGEE, GALAH, and LAMOST.

## Results

StarNet-v2 achieves internal precisions of approximately 50 K in effective temperature, 0.1 dex in surface gravity, and 0.05 dex in metallicity when applied to LAMOST low-resolution spectra. We demonstrated that the model generalizes well across different surveys and wavelength ranges, and that the predicted uncertainties are well-calibrated. A public Python package and pre-trained model weights have been released to the community. The method has since been adopted by several survey teams for their data processing pipelines.

## Related Publications

- Placeholder Author et al. (2024), *ApJS*, 268, 45 — "StarNet-v2: Data-Driven Stellar Parameters at Scale"
- Placeholder Author et al. (2023), *A&A*, 672, A12 — "Domain Adaptation for Cross-Survey Stellar Spectroscopy"
