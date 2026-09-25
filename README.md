# Invariant Color Ergonomics

A color architecture using OKLCH to keep text and surface contrast predictable across the entire hue circle.

Most digital interfaces select colors in sRGB or HSL. Because the human eye is naturally much more sensitive to green and yellow than to blue, switching an interface element from blue to red or yellow changes perceived brightness and contrast unpredictably. Calculating surface and ink coordinates in OKLCH keeps perceived lightness independent from hue angle, so readability remains steady across themes.

Surfaces in this system use modest saturation to keep the focal difference between wavelengths within the eye's natural depth of focus. Every coordinate layer is bounded to stay inside the sRGB gamut envelope without clipping, and pairings are calibrated to maintain clear contrast across standard vision and common color vision deficiencies.

## Simulator

The simulation scripts in `code/simulator/` evaluate luminance invariance, test gamut closure, and project tokens through color vision deficiency models using only the Python standard library.

```bash
python3 code/simulator/simulator.py --benchmarks
python3 code/simulator/simulator.py --theorem1
python3 code/simulator/simulator.py --gamut
python3 code/simulator/simulator.py --calc 0.890 0.035 145
python3 code/simulator/simulator.py --css
```

## Visualizer

The companion interface in `code/web/` runs directly in a browser without build tools.

```bash
python3 -m http.server 8000 --directory code/web
```

## References

Calculations in this project build upon Björn Ottosson's [Oklab specification](https://bottosson.github.io/posts/oklab/), the physiological color vision deficiency simulation models of [Machado, Oliveira, and Fernandes (2009)](https://doi.org/10.1109/TVCG.2009.113), the [chromatic eye model](https://doi.org/10.1364/AO.31.003594) by Thibos et al. (1992), and the [Accessible Perceptual Contrast Algorithm (APCA)](https://github.com/Myndex/SAPC-APCA). Interface typography uses [IBM Plex Sans](https://github.com/IBM/plex) by Mike Abbink and Bold Monday under the [SIL Open Font License](https://openfontlicense.org).

## License

MIT
