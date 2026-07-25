// HelloInsights — Unified Config & Ad Manager v3
// Supports: MGID content widgets + Google AdSense banners
// All ad positions/sizes controlled by config.json — no HTML code changes needed

var siteConfig = null;

// ==========================================
// 1. Site Config (logo / nav / footer / seo)
// ==========================================
function applyConfig(config) {
  siteConfig = config;
  document.documentElement.style.setProperty('--accent-color', config.accentColor);
  // Logo
  var logoEl = document.querySelector('.logo');
  if (logoEl) {
    while (logoEl.firstChild) logoEl.removeChild(logoEl.firstChild);
    var src = config.logoImage || '';
    if (src) {
      var img = document.createElement('img');
      img.src = src; img.alt = config.siteName; img.className = 'logo-img';
      logoEl.appendChild(img);
    } else {
      logoEl.innerHTML = '<span class="logo-text">' + config.siteName + '</span>';
    }
  }
  // Navigation
  var navUl = document.querySelector('ul.nav');
  if (navUl) {
    var first = navUl.querySelector('li:first-child a');
    var html = '<li><a href="index.html"' + (first && first.classList.contains('active') ? ' class="active"' : '') + '>All</a></li>';
    for (var i = 0; i < config.categories.length; i++)
      html += '<li><a href="category.html?cat=' + config.categories[i].id + '">' + config.categories[i].name + '</a></li>';
    navUl.innerHTML = html;
  }
  // Footer
  var sections = document.querySelectorAll('.footer-section');
  if (sections.length >= 2) {
    var h4 = sections[0].querySelector('h4'), p = sections[0].querySelector('p');
    if (h4) h4.textContent = 'About ' + config.siteName;
    if (p) p.textContent = config.footer.about;
    var ul = sections[1].querySelector('ul');
    if (ul) {
      var links = '<li><a href="index.html">Home</a></li>';
      for (var i = 0; i < config.categories.length; i++)
        links += '<li><a href="category.html?cat=' + config.categories[i].id + '">' + config.categories[i].name + '</a></li>';
      ul.innerHTML = links;
    }
    var bottom = document.querySelector('.footer-bottom p');
    if (bottom) bottom.innerHTML = '&copy; <script>document.write(new Date().getFullYear())</script> ' + config.siteName + '. All rights reserved.';
  }
  // Title & Meta
  if (document.title.indexOf('HelloInsights') !== -1)
    document.title = document.title.replace(/HelloInsights/g, config.siteName);
  var meta = document.querySelector('meta[name="description"]');
  if (meta && config.seo && config.seo.description) meta.setAttribute('content', config.seo.description);
}

function loadSiteConfig(callback) {
  // 改成：
fetch('config.json?v=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(c) { applyConfig(c); if (callback) callback(c); })
    .catch(function(e) { console.warn('Config load failed:', e); if (callback) callback(null); });
}

// ==========================================
// 2. MGID Manager — Content Widgets
// ==========================================
var _mgidLoaded = false;

function loadMGID(config) {
  var mgid = config.mgid;
  if (!mgid || !mgid.enabled) return;

  var page = location.pathname.split('/').pop() || 'index.html';
  var widgets = (mgid.widgets && mgid.widgets[page]) || [];
  if (!widgets.length) return;

  // Load MGID base script once
  if (!_mgidLoaded && !document.querySelector('script[src*="jsc.mgid.com"]')) {
    var s = document.createElement('script');
    s.src = 'https://jsc.mgid.com/site/' + mgid.siteId + '.js';
    s.async = true;
    document.head.appendChild(s);
    _mgidLoaded = true;
  }

  // Place widget divs at anchor positions
  var placed = [];
  for (var i = 0; i < widgets.length; i++) {
    var w = widgets[i];
    var anchor = document.querySelector('[data-ad-slot="' + w.slot + '"]');
    if (!anchor) continue;

    // Apply size & spacing from config
    if (w.height) anchor.style.minHeight = w.height;
    if (w.marginTop !== undefined) anchor.style.marginTop = w.marginTop;
    if (w.marginBottom !== undefined) anchor.style.marginBottom = w.marginBottom;
    anchor.className = 'ad-container';

    var div = document.createElement('div');
    div.setAttribute('data-type', '_mgwidget');
    div.setAttribute('data-widget-id', w.widgetId);
    anchor.appendChild(div);
    placed.push(div);
  }

  // Trigger MGID load after widgets are placed
  if (placed.length > 0) {
    try {
      (window._mgq = window._mgq || []).push(["_mgc.load"]);
    } catch(e) { console.warn('MGID trigger error:', e); }
  }
}

// ==========================================
// 3. AdSense Manager — Lazy Load
// ==========================================
function loadAdSense(config) {
  if (!config.adsense || !config.adsense.enabled) return;

  var clientId = config.adsense.clientId;
  if (!clientId || clientId.indexOf('XXXX') !== -1) return; // Skip placeholders

  var slots = config.adsense.slots || {};
  var pageAds = config.adsense.pageAds || {};
  var page = location.pathname.split('/').pop() || 'index.html';
  var adSlots = pageAds[page];
  if (!adSlots || !adSlots.length) return;

  // Inject AdSense script
  if (!document.querySelector('script[src*="adsbygoogle"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + clientId;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  // Collect slots with valid anchors
  var pendingSlots = [];
  for (var i = 0; i < adSlots.length; i++) {
    var key = adSlots[i];
    var def = slots[key];
    if (!def) continue;
    var anchor = document.querySelector('[data-ad-slot="' + key + '"]');
    if (!anchor) continue;
    // Apply size from config
    if (def.height) anchor.style.minHeight = def.height;
    if (def.marginTop !== undefined) anchor.style.marginTop = def.marginTop;
    if (def.marginBottom !== undefined) anchor.style.marginBottom = def.marginBottom;
    anchor.className = 'ad-container';
    pendingSlots.push({ anchor: anchor, def: def });
  }

  if (pendingSlots.length === 0) return;

  // Lazy load via IntersectionObserver
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      var triggered = false;
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          var item = entries[j].target._adData;
          createAdIns(item.anchor, item.def, clientId);
          observer.unobserve(entries[j].target);
          triggered = true;
        }
      }
      if (triggered) scheduleUnfilledCheck();
    }, { rootMargin: '200px 0px' });
    for (var k = 0; k < pendingSlots.length; k++) {
      pendingSlots[k].anchor._adData = pendingSlots[k];
      observer.observe(pendingSlots[k].anchor);
    }
  } else {
    for (var k = 0; k < pendingSlots.length; k++)
      createAdIns(pendingSlots[k].anchor, pendingSlots[k].def, clientId);
    scheduleUnfilledCheck();
  }
}

function createAdIns(anchor, def, clientId) {
  if (anchor._adCreated) return;
  anchor._adCreated = true;
  var ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.setAttribute('data-ad-client', clientId);
  ins.setAttribute('data-ad-slot', def.id);
  ins.setAttribute('data-ad-format', def.format || 'auto');
  ins.setAttribute('data-full-width-responsive', 'true');
  if (def.layoutKey) ins.setAttribute('data-ad-layout-key', def.layoutKey);
  anchor.appendChild(ins);
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
}

var _unfilledTimer = null;
function scheduleUnfilledCheck() {
  if (_unfilledTimer) return;
  _unfilledTimer = setTimeout(function() {
    hideUnfilledAds();
    setTimeout(hideUnfilledAds, 5000);
  }, 4000);
}

function hideUnfilledAds() {
  var allIns = document.querySelectorAll('ins.adsbygoogle');
  for (var i = 0; i < allIns.length; i++) {
    if (allIns[i].getAttribute('data-ad-status') === 'unfilled') {
      var container = allIns[i].closest('.ad-container');
      if (container) container.style.display = 'none';
    }
  }
}

// ==========================================
// 4. Utilities
// ==========================================
function toggleMenu() {
  var nav = document.getElementById('navContainer');
  if (nav) nav.classList.toggle('active');
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', function() {
  var btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.pageYOffset > 300);
});

// ==========================================
// 5. Auto Init
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  loadSiteConfig(function(config) {
    if (config) {
      loadMGID(config);
      loadAdSense(config);
    }
  });
});
