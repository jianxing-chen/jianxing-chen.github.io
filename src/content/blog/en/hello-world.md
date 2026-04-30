---
title: "Exploring the Cosmos: An Introduction to Modern Spectroscopy"
date: 2024-06-15
tags: ["spectroscopy", "tutorial", "astrophysics"]
description: "A brief introduction to modern spectroscopic techniques used in astronomical research."
lang: en
---

## What is Spectroscopy?

Spectroscopy is the study of the interaction between matter and electromagnetic radiation as a function of the wavelength or frequency of the radiation. In astronomy, spectroscopy allows us to determine the chemical composition, temperature, density, and velocity of celestial objects by analyzing their emitted or absorbed light.

The fundamental relationship governing stellar luminosity is the Stefan-Boltzmann law:

$$
L = 4\pi R^2 \sigma T^4
$$

where $L$ is the luminosity, $R$ is the stellar radius, $\sigma$ is the Stefan-Boltzmann constant, and $T$ is the effective temperature. This equation forms the backbone of stellar astrophysics and connects observable quantities to the intrinsic properties of stars.

## Types of Spectra

There are three primary types of spectra observed in astrophysics:

1. **Continuous Spectrum** — A smooth, unbroken band of colors produced by a hot, dense source such as the interior of a star or a heated filament.
2. **Emission Spectrum** — Bright lines at specific wavelengths produced when electrons in atoms transition from higher to lower energy levels, commonly seen in nebulae and hot gas clouds.
3. **Absorption Spectrum** — Dark lines superimposed on a continuous spectrum, caused when cooler gas between the source and observer absorbs specific wavelengths.

## A Simple Python Example

Below is a basic example of how you might load and visualize a spectrum using Python:

```python
import numpy as np
import matplotlib.pyplot as plt

# Generate synthetic spectrum data
wavelength = np.linspace(3800, 7200, 1000)  # Angstroms
flux = np.exp(-0.5 * ((wavelength - 5500) / 800) ** 2)
flux += 0.1 * np.random.randn(len(wavelength))

# Add absorption line
flux -= 0.3 * np.exp(-0.5 * ((wavelength - 4861) / 5) ** 2)  # H-beta

plt.figure(figsize=(10, 4))
plt.plot(wavelength, flux, 'k-', linewidth=0.5)
plt.xlabel('Wavelength (Å)')
plt.ylabel('Normalized Flux')
plt.title('Synthetic Stellar Spectrum')
plt.show()
```

## Looking Forward

Modern spectroscopic surveys such as SDSS, LAMOST, and the upcoming 4MOST are generating millions of spectra, enabling statistical studies of stellar populations across the Milky Way and beyond. The combination of high-resolution spectroscopy with machine learning techniques is opening new frontiers in our understanding of galactic archaeology and stellar physics.

The radial velocity of a star can be measured via the Doppler shift: $v_r = c \cdot \Delta\lambda / \lambda_0$, which provides crucial information about stellar kinematics and the detection of exoplanets through the radial velocity method.
