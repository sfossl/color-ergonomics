(function(exports) {
  var M1 = [
    [1.0000000000, +0.3963377774, +0.2158037573],
    [1.0000000000, -0.1055613458, -0.0638541728],
    [1.0000000000, -0.0894841775, -1.2914855480]
  ];

  var M2 = [
    [+4.0767416621, -3.3077115913, +0.2309699292],
    [-1.2684380046, +2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, +1.7076147010]
  ];

  var P_PROTAN = [
    [0.152286,  1.052583, -0.204868],
    [0.114503,  0.786281,  0.099216],
    [-0.003882, -0.048116,  1.051998]
  ];

  var P_DEUTAN = [
    [0.367322,  0.860646, -0.227968],
    [0.280085,  0.672501,  0.047413],
    [-0.011820,  0.042940,  0.968881]
  ];

  var P_TRITAN = [
    [1.255528, -0.076749, -0.178779],
    [-0.078411,  0.930809,  0.147602],
    [0.004733,  0.691367,  0.303900]
  ];

  function clamp(v) {
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  }

  function oklchToLinear(L, C, hDeg) {
    var theta = (hDeg * Math.PI) / 180;
    var a = C * Math.cos(theta);
    var b = C * Math.sin(theta);

    var lP = L + M1[0][1] * a + M1[0][2] * b;
    var mP = L + M1[1][1] * a + M1[1][2] * b;
    var sP = L + M1[2][1] * a + M1[2][2] * b;

    var l = Math.max(0, lP) ** 3;
    var m = Math.max(0, mP) ** 3;
    var s = Math.max(0, sP) ** 3;

    var r = M2[0][0] * l + M2[0][1] * m + M2[0][2] * s;
    var g = M2[1][0] * l + M2[1][1] * m + M2[1][2] * s;
    var bVal = M2[2][0] * l + M2[2][1] * m + M2[2][2] * s;

    return [clamp(r), clamp(g), clamp(bVal)];
  }

  function linearToByte(c) {
    var v = c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055;
    return Math.round(clamp(v) * 255);
  }

  function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  function applyCvd(M, r, g, b) {
    return [
      clamp(M[0][0] * r + M[0][1] * g + M[0][2] * b),
      clamp(M[1][0] * r + M[1][1] * g + M[1][2] * b),
      clamp(M[2][0] * r + M[2][1] * g + M[2][2] * b)
    ];
  }

  function relativeLuminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function wcagContrast(y1, y2) {
    var lighter = Math.max(y1, y2);
    var darker = Math.min(y1, y2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function apcaContrast(yTxt, yBg) {
    if (yBg > yTxt) {
      return (Math.pow(yBg, 0.56) - Math.pow(yTxt, 0.57)) * 1.14 * 100;
    }
    return (Math.pow(yBg, 0.65) - Math.pow(yTxt, 0.62)) * 1.14 * 100;
  }

  function resolveColor(L, C, h, mode) {
    var lin = oklchToLinear(L, C, h);
    if (mode === 'protan') lin = applyCvd(P_PROTAN, lin[0], lin[1], lin[2]);
    else if (mode === 'deutan') lin = applyCvd(P_DEUTAN, lin[0], lin[1], lin[2]);
    else if (mode === 'tritan') lin = applyCvd(P_TRITAN, lin[0], lin[1], lin[2]);
    else if (mode === 'achroma') {
      var y = relativeLuminance(lin[0], lin[1], lin[2]);
      lin = [y, y, y];
    }
    var R = linearToByte(lin[0]);
    var G = linearToByte(lin[1]);
    var B = linearToByte(lin[2]);
    var hex = rgbToHex(R, G, B);
    var lum = relativeLuminance(lin[0], lin[1], lin[2]);
    return { r: R, g: G, b: B, hex: hex, y: lum, lin: lin };
  }

  exports.SIM_MATH = {
    oklchToLinear: oklchToLinear,
    linearToByte: linearToByte,
    rgbToHex: rgbToHex,
    relativeLuminance: relativeLuminance,
    wcagContrast: wcagContrast,
    apcaContrast: apcaContrast,
    resolveColor: resolveColor
  };
})(window);

