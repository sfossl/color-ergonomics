(function() {
  window.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  var C = window.SIM_CONTENT;
  var M = window.SIM_MATH;

  var activeMode = 'normal';
  var currentTheme = 'light';
  var state = { h: 145, c: 0.035, l: 0.890 };

  var headerTitle = document.getElementById('headerTitle');
  if (headerTitle) headerTitle.textContent = C.header.title;

  var labelHue = document.getElementById('labelHue');
  if (labelHue) labelHue.textContent = C.controls.hueLabel;

  var labelChroma = document.getElementById('labelChroma');
  if (labelChroma) labelChroma.textContent = C.controls.chromaLabel;

  var labelLightness = document.getElementById('labelLightness');
  if (labelLightness) labelLightness.textContent = C.controls.lightnessLabel;

  document.getElementById('labelLum').textContent        = C.diagnostics.luminanceLabel;
  document.getElementById('labelWcag').textContent       = C.diagnostics.wcagLabel;
  document.getElementById('labelApca').textContent       = C.diagnostics.apcaLabel;
  document.getElementById('labelChromaRule').textContent = C.diagnostics.chromaRuleLabel;

  document.getElementById('paperTitle').textContent     = C.paper.title;
  document.getElementById('paperSubtitle').textContent  = C.paper.subtitle;

  document.getElementById('paperIntro').innerHTML     = C.paper.intro;
  document.getElementById('paperHue').innerHTML       = C.paper.hueBlock;
  document.getElementById('paperChroma').innerHTML    = C.paper.chromaBlock;
  document.getElementById('paperLightness').innerHTML = C.paper.lightnessBlock;
  document.getElementById('paperCallout').textContent = C.paper.callout;

  document.getElementById('btnReset').textContent  = C.paper.buttonReset;
  document.getElementById('btnRandom').textContent = C.paper.buttonRandom;

  var btnInvert = document.getElementById('btnInvert');

  var footerPreprintLink = document.getElementById('footerPreprintLink');
  if (footerPreprintLink && C.footer.preprintLinkText) {
    footerPreprintLink.textContent = C.footer.preprintLinkText;
    footerPreprintLink.href        = C.footer.preprintLinkUrl;
  }
  var footerPaperLink = document.getElementById('footerPaperLink');
  if (footerPaperLink) {
    footerPaperLink.textContent = C.footer.paperLinkText;
    footerPaperLink.href        = C.footer.paperLinkUrl;
  }
  var footerGithubLink = document.getElementById('footerGithubLink');
  if (footerGithubLink) {
    footerGithubLink.textContent = C.footer.githubLinkText;
    footerGithubLink.href        = C.footer.githubLinkUrl;
  }
  document.getElementById('footerCopy').textContent = C.footer.copyright;

  var paperSheet = document.querySelector('.paper-sheet');

  function applyTheme(theme) {
    currentTheme = theme;
    if (paperSheet) {
      if (theme === 'dark') {
        paperSheet.classList.add('sheet-inverted');
      } else {
        paperSheet.classList.remove('sheet-inverted');
      }
    }
    if (btnInvert) {
      btnInvert.textContent = C.paper.buttonInvert || 'Invert';
      btnInvert.classList.toggle('active', theme === 'dark');
    }
  }

  if (btnInvert) {
    btnInvert.onclick = function() {
      applyTheme(currentTheme === 'light' ? 'dark' : 'light');
      render();
    };
  }
  applyTheme(currentTheme);

  var visionContainer = document.getElementById('visionModesGroup');
  var modeButtons = [];
  C.controls.visionModes.forEach(function(m, idx) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn' + (idx === 0 ? ' active' : '');
    btn.innerHTML = '<span>' + m.label + '</span><span class="mode-sub">' + m.sub + '</span>';
    btn.onclick = function() {
      modeButtons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeMode = m.id;
      render();
    };
    visionContainer.appendChild(btn);
    modeButtons.push(btn);
  });

  var inputH = document.getElementById('inputH');
  var inputC = document.getElementById('inputC');
  var inputL = document.getElementById('inputL');
  var valH   = document.getElementById('valH');
  var valC   = document.getElementById('valC');
  var valL   = document.getElementById('valL');

  inputH.value = 145;
  inputC.value = 0.035;
  inputL.value = 0.890;

  var spectrumContainer = document.getElementById('spectrumRow');
  var spectrumButtons = [];
  C.paper.spectralHues.forEach(function(item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'spectrum-btn';
    btn.textContent = item.name;
    btn.onclick = function() {
      inputH.value = item.hue;
      render();
    };
    spectrumContainer.appendChild(btn);
    spectrumButtons.push({ element: btn, hue: item.hue });
  });

  document.getElementById('btnReset').onclick = function() {
    inputH.value = 145;
    inputC.value = 0.035;
    inputL.value = 0.890;
    activeMode = 'normal';
    modeButtons.forEach(function(b, idx) {
      b.classList.toggle('active', idx === 0);
    });
    render();
  };

  document.getElementById('btnRandom').onclick = function() {
    var randH = Math.floor(Math.random() * 360);
    inputH.value = randH;
    render();
  };

  var tooltipPopover = document.getElementById('tooltipPopover');
  var tooltipTitle   = document.getElementById('tooltipTitle');
  var tooltipDesc    = document.getElementById('tooltipDesc');
  var activeTermElem = null;

  function hideTooltip() {
    if (!tooltipPopover) return;
    tooltipPopover.classList.remove('visible');
    tooltipPopover.setAttribute('aria-hidden', 'true');
    if (activeTermElem) {
      activeTermElem.classList.remove('term-active');
      activeTermElem = null;
    }
  }

  function showTooltip(elem, key) {
    var entry = C.glossary && C.glossary[key];
    if (!entry || !tooltipPopover) return;

    if (activeTermElem) activeTermElem.classList.remove('term-active');
    activeTermElem = elem;
    activeTermElem.classList.add('term-active');

    tooltipTitle.textContent = entry.title;
    tooltipDesc.textContent  = entry.desc;

    tooltipPopover.classList.add('visible');
    tooltipPopover.setAttribute('aria-hidden', 'false');

    var rect = elem.getBoundingClientRect();
    var popoverWidth = Math.min(380, window.innerWidth - 32);
    var left = rect.left + (rect.width / 2) - (popoverWidth / 2);
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }

    var top = rect.bottom + 8;
    if (top + 150 > window.innerHeight) {
      top = rect.top - 150 - 8;
    }

    tooltipPopover.style.left  = Math.round(left) + 'px';
    tooltipPopover.style.top   = Math.round(top) + 'px';
    tooltipPopover.style.width = Math.round(popoverWidth) + 'px';
  }

  document.querySelectorAll('.term').forEach(function(termElem) {
    var key = termElem.getAttribute('data-key');
    termElem.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeTermElem === termElem) {
        hideTooltip();
      } else {
        showTooltip(termElem, key);
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (tooltipPopover && !tooltipPopover.contains(e.target)) {
      hideTooltip();
    }
  });

  window.addEventListener('resize', hideTooltip);
  window.addEventListener('scroll', hideTooltip, true);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideTooltip();
  });

  function render() {
    state.h = parseFloat(inputH.value);
    state.c = parseFloat(inputC.value);
    state.l = parseFloat(inputL.value);

    valH.textContent = Math.round(state.h) + '\u00b0';
    valC.textContent = state.c.toFixed(3);
    valL.textContent = state.l.toFixed(3);

    var isDark = (currentTheme === 'dark');

    var accent, ink, canvas;
    if (!isDark) {
      accent = M.resolveColor(state.l, state.c, state.h, activeMode);
      ink    = M.resolveColor(0.320, 0.050, state.h, activeMode);
      canvas = M.resolveColor(0.985, 0.004, state.h, activeMode);
    } else {
      accent = M.resolveColor(0.320, Math.min(0.035, state.c), state.h, activeMode);
      ink    = M.resolveColor(state.l, state.c, state.h, activeMode);
      canvas = M.resolveColor(0.240, 0.000, 0, activeMode);
    }

    spectrumButtons.forEach(function(item) {
      var sBg, sInk;
      if (!isDark) {
        sBg  = M.resolveColor(state.l, state.c, item.hue, activeMode);
        sInk = M.resolveColor(0.320, 0.050, item.hue, activeMode);
      } else {
        sBg  = M.resolveColor(0.320, Math.min(0.035, state.c), item.hue, activeMode);
        sInk = M.resolveColor(state.l, state.c, item.hue, activeMode);
      }
      item.element.style.backgroundColor = sBg.hex;
      item.element.style.color           = sInk.hex;

      var diff = Math.abs(state.h - item.hue);
      var isActive = (diff < 15 || diff > 345);
      item.element.classList.toggle('active', isActive);
    });

    var cr   = M.wcagContrast(accent.y, ink.y);
    var apca = M.apcaContrast(ink.y, accent.y);

    var displayY = !isDark ? accent.y : ink.y;
    document.getElementById('diagY').textContent    = displayY.toFixed(4);
    document.getElementById('diagWcag').textContent = cr.toFixed(2) + ' : 1';
    document.getElementById('diagApca').textContent = 'Lc ' + Math.abs(apca).toFixed(1);

    var badgeChroma = document.getElementById('badgeChroma');
    if (state.c <= 0.065) {
      badgeChroma.className   = 'mono metric-val';
      badgeChroma.textContent = C.diagnostics.chromaPassText;
    } else {
      badgeChroma.className   = 'mono metric-val status-warn';
      badgeChroma.textContent = C.diagnostics.chromaWarnText;
    }

    if (paperSheet) {
      paperSheet.style.setProperty('--sim-canvas',     canvas.hex);
      paperSheet.style.setProperty('--sim-accent-bg',  accent.hex);
      paperSheet.style.setProperty('--sim-accent-ink', ink.hex);
    }
    var root = document.documentElement;
    root.style.setProperty('--sim-canvas',     canvas.hex);
    root.style.setProperty('--sim-accent-bg',  accent.hex);
    root.style.setProperty('--sim-accent-ink', ink.hex);
  }

  inputH.addEventListener('input', render);
  inputC.addEventListener('input', render);
  inputL.addEventListener('input', render);

  render();
})();
