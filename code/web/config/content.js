window.SIM_CONTENT = {
  header: {
    title: "Invariant Color Ergonomics"
  },

  controls: {
    hueLabel: "Hue Angle",
    chromaLabel: "Chroma",
    lightnessLabel: "Lightness",
    visionModes: [
      { id: "normal",  label: "Normal Vision", sub: "Standard Trichromat" },
      { id: "deutan",  label: "Deuteranopia",  sub: "Green-Blind" },
      { id: "protan",  label: "Protanopia",    sub: "Red-Blind" },
      { id: "tritan",  label: "Tritanopia",    sub: "Blue-Blind" },
      { id: "achroma", label: "Monochrome",    sub: "Pure Luminance" }
    ]
  },

  diagnostics: {
    luminanceLabel: "Luminance (Y)",
    wcagLabel: "WCAG Contrast",
    apcaLabel: "APCA Score",
    chromaRuleLabel: "Accommodative Risk",
    chromaPassText: "Optimal",
    chromaWarnText: "Elevated"
  },

  paper: {
    title: "Invariant Color Ergonomics",
    subtitle: "A perceptually uniform, gamut-closed OKLCH architecture for interface contrast and visual stability",

    intro: "Most digital interfaces choose colors using <span class=\"term\" data-key=\"RGB\">RGB</span> coordinates, which measure how much light display subpixels emit rather than how human eyes perceive brightness. Because our eyes are naturally much more sensitive to green and yellow wavelengths than to blue, colors with identical digital brightness values can look very uneven in practice. Changing an interface element from blue to yellow or red often shifts the perceived contrast without the designer realizing it.",

    hueBlock: "To address this, the colors here are calculated in <span class=\"term\" data-key=\"OKLCH\">OKLCH</span>, a color space designed to closely align with human lightness perception. In this coordinate system, perceived lightness is separated from hue angle. As you move the Hue Angle slider or tap any of the color swatches below, the color family shifts while the measured contrast ratios remain steady, making readability more predictable across different themes.",

    chromaBlock: "You will notice that the surfaces here use gentle pastel tones rather than vivid, saturated shades. The human eye is not an achromatic optical system: different wavelengths of light bend at slightly different angles as they pass through the ocular lens, an effect known as <span class=\"term\" data-key=\"Chromatic Aberration\">chromatic aberration</span>. When colors are highly saturated, this focal difference can become noticeable, requiring subtle focus adjustments between colors. Keeping surface saturation modest helps keep the chromatic difference within the eye's natural <span class=\"term\" data-key=\"Depth of Focus\">depth of focus</span>, allowing focus to settle primarily on the text.",

    lightnessBlock: "Color vision deficiency is relatively common, affecting roughly 8 percent of men and 0.5 percent of women. In red-green color deficiency, the difference between red and green tones is reduced, and both shift toward warm tans. Selecting <span class=\"term\" data-key=\"Deuteranopia\">Deuteranopia</span> or <span class=\"term\" data-key=\"Protanopia\">Protanopia</span> simulates this shift using published physiological models. Because text legibility relies on a steady <span class=\"term\" data-key=\"Luminance Contrast\">luminance contrast</span> rather than color alone, the text remains legible even when the chromatic distinction fades.",

    callout: "The text, surfaces, and buttons on this page update in real time using the color coordinates from the sliders. This visualizer serves as a direct way to inspect how these coordinates behave across different vision profiles in a standard browser.",

    spectralHues: [
      { key: "V", name: "Violet", hue: 320 },
      { key: "I", name: "Indigo", hue: 260 },
      { key: "B", name: "Blue",   hue: 220 },
      { key: "G", name: "Green",  hue: 145 },
      { key: "Y", name: "Yellow", hue: 85 },
      { key: "O", name: "Orange", hue: 45 },
      { key: "R", name: "Red",    hue: 25 }
    ],
    buttonReset: "Reset",
    buttonRandom: "Random Hue",
    buttonInvert: "Invert"
  },

  glossary: {
    "RGB": {
      title: "RGB Color Model",
      desc: "A color model that specifies colors by the intensity of Red, Green, and Blue subpixel light emitted by displays."
    },
    "OKLCH": {
      title: "OKLCH Coordinate Space",
      desc: "A modern color space aligned with human vision where perceived Lightness, Chroma (saturation), and Hue angle can be adjusted independently."
    },
    "Chromatic Aberration": {
      title: "Chromatic Aberration",
      desc: "A natural optical effect where different wavelengths of light bend at slightly different angles through the ocular lens, focusing at slightly different depths."
    },
    "Depth of Focus": {
      title: "Depth of Focus",
      desc: "The small range of optical distances over which an image appears sharp on the retina without requiring muscular accommodation."
    },
    "Deuteranopia": {
      title: "Deuteranopia",
      desc: "A common form of color vision deficiency where medium-wavelength cone photopigments are absent, causing reds and greens to appear as warm tans."
    },
    "Protanopia": {
      title: "Protanopia",
      desc: "A color vision deficiency where long-wavelength cone photopigments are absent, causing long-wavelength reds to darken and shift toward tan."
    },
    "Luminance Contrast": {
      title: "Luminance Contrast",
      desc: "The relative difference in perceived light intensity between text and its background, which is the primary physical driver of readability."
    },
    "WCAG": {
      title: "WCAG Guidelines",
      desc: "Web Content Accessibility Guidelines, the international standard defining minimum contrast ratios for readable digital text."
    }
  },

  footer: {
    preprintLinkText: "Preprint",
    preprintLinkUrl: "https://doi.org/10.5281/zenodo.22967239",
    paperLinkText: "Documentation",
    paperLinkUrl: "https://github.com/sfossl/color-ergonomics#readme",
    githubLinkText: "GitHub",
    githubLinkUrl: "https://github.com/sfossl/color-ergonomics",
    copyright: "Akash Sharma"
  }
};
