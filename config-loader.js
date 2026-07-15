// HelloInsights Site Config Loader
// All pages include this script to load site configuration
var siteConfig = null;

function applyConfig(config) {
  siteConfig = config;

  // Apply accent color
  document.documentElement.style.setProperty('--accent-color', config.accentColor);

  // Apply site name and logo
  var logoEl = document.querySelector('.logo');
  if (logoEl) {
    var iconEl = logoEl.querySelector('.logo-icon');
    var nameEl = logoEl.querySelector('span');
    if (iconEl) iconEl.textContent = config.logoLetter;
    // Split siteName: last 3 chars in <span>, rest before
    if (nameEl && config.siteName.length > 3) {
      logoEl.innerHTML = '<div class="logo-icon">' + config.logoLetter + '</div>' +
        config.siteName.slice(0, -3) + '<span>' + config.siteName.slice(-3) + '</span>';
    } else if (nameEl) {
      logoEl.innerHTML = '<div class="logo-icon">' + config.logoLetter + '</div>' +
        config.siteName;
    }
  }

  // Build category navigation
  var navUl = document.querySelector('ul.nav');
  if (navUl) {
    var isActive = navUl.querySelector('a.active');
    var currentPath = window.location.pathname;
    var firstLi = navUl.querySelector('li:first-child a');
    var homeHtml = firstLi ? '<li><a href="index.html"' + (firstLi.classList.contains('active') ? ' class="active"' : '') + '>All</a></li>' : '<li><a href="index.html">All</a></li>';
    var catHtml = '';
    for (var i = 0; i < config.categories.length; i++) {
      var cat = config.categories[i];
      catHtml += '<li><a href="category.html?cat=' + cat.id + '">' + cat.name + '</a></li>';
    }
    navUl.innerHTML = homeHtml + catHtml;
  }

  // Build footer quick links
  var footerSections = document.querySelectorAll('.footer-section');
  if (footerSections.length >= 2) {
    // About section
    var aboutH4 = footerSections[0].querySelector('h4');
    var aboutP = footerSections[0].querySelector('p');
    if (aboutH4) aboutH4.textContent = 'About ' + config.siteName;
    if (aboutP) aboutP.textContent = config.footer.about;

    // Quick links section
    var quickLinksUl = footerSections[1].querySelector('ul');
    if (quickLinksUl) {
      var linksHtml = '<li><a href="index.html">Home</a></li>';
      for (var i = 0; i < config.categories.length; i++) {
        var cat = config.categories[i];
        linksHtml += '<li><a href="category.html?cat=' + cat.id + '">' + cat.name + '</a></li>';
      }
      quickLinksUl.innerHTML = linksHtml;
    }

    // Footer bottom
    var footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
      footerBottom.innerHTML = '© <script>document.write(new Date().getFullYear())<\/script> ' + config.siteName + '. All rights reserved.';
    }
  }

  // Update page title
  var titleSuffix = config.siteName;
  var currentTitle = document.title;
  if (currentTitle.indexOf('HelloInsights') !== -1) {
    document.title = currentTitle.replace(/HelloInsights/g, titleSuffix);
  }

  // Update meta description
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && config.seo && config.seo.description) {
    metaDesc.setAttribute('content', config.seo.description);
  }
}

function loadSiteConfig(callback) {
  fetch('config.json')
    .then(function(res) { return res.json(); })
    .then(function(config) {
      applyConfig(config);
      if (callback) callback(config);
    })
    .catch(function(err) {
      console.warn('Failed to load config.json:', err);
      if (callback) callback(null);
    });
}
// HelloInsights — Site Config Loader & Ad Manager
var siteConfig = null;

function applyConfig(config) {
  siteConfig = config;
  document.documentElement.style.setProperty('--accent-color', config.accentColor);

  // Logo
  var logoEl = document.querySelector('.logo');
  if (logoEl) {
    var src = config.logoImage || '';
    logoEl.innerHTML = src
      ? '<img src="' + src + '" alt="' + config.siteName + '" class="logo-img">'
      : '<span class="logo-text">' + config.siteName + '</span>';
  }

  // Navigation
  var navUl = document.querySelector('ul.nav');
  if (navUl) {
    var first = navUl.querySelector('li:first-child a');
    var html = '<li><a href="index.html"' + (first && first.classList.contains('active') ? ' class="active"' : '') + '>All</a></li>';
    for (var i = 0; i < config.categories.length; i++) {
      html += '<li><a href="category.html?cat=' + config.categories[i].id + '">' + config.categories[i].name + '</a></li>';
    }
    navUl.innerHTML = html;
  }

  // Footer
  var sections = document.querySelectorAll('.footer-section');
  if (sections.length >= 2) {
    var h4 = sections[0].querySelector('h4');
    var p = sections[0].querySelector('p');
    if (h4) h4.textContent = 'About ' + config.siteName;
    if (p) p.textContent = config.footer.about;
    var ul = sections[1].querySelector('ul');
    if (ul) {
      var links = '<li><a href="index.html">Home</a></li>';
      for (var i = 0; i < config.categories.length; i++) {
        links += '<li><a href="category.html?cat=' + config.categories[i].id + '">' + config.categories[i].name + '</a></li>';
      }
      ul.innerHTML = links;
    }
    var bottom = document.querySelector('.footer-bottom p');
    if (bottom) bottom.innerHTML = '&copy; <script>document.write(new Date().getFullYear())<\/script> ' + config.siteName + '. All rights reserved.';
  }

  // Title & Meta
  if (document.title.indexOf('HelloInsights') !== -1) {
    document.title = document.title.replace(/HelloInsights/g, config.siteName);
  }
  var meta = document.querySelector('meta[name="description"]');
  if (meta && config.seo && config.seo.description) meta.setAttribute('content', config.seo.description);
}

function loadSiteConfig(callback) {
  fetch('config.json')
    .then(function(r) { return r.json(); })
    .then(function(c) { applyConfig(c); if (callback) callback(c); })
    .catch(function(e) { console.warn('Config load failed:', e); if (callback) callback(null); });
}

// ==========================================
// 广告统一管理
// 读 config.adsense → 注入脚本 + 生成广告位
// ==========================================
function loadAdSense(config) {
  if (!config || !config.adsense || !config.adsense.enabled) return;
  var clientId = config.adsense.clientId;
  var slots = config.adsense.slots;
  var pageAds = config.adsense.pageAds || {};
  var page = location.pathname.split('/').pop() || 'index.html';
  var adSlots = pageAds[page];
  if (!adSlots || !adSlots.length) return;

  // 注入 AdSense 脚本
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + clientId;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);

  // 按 pageAds 配置自动创建广告容器并注入 <ins>
  function buildAds() {
    for (var i = 0; i < adSlots.length; i++) {
      var key = adSlots[i];
      var def = slots[key];
      if (!def) continue;

      var anchor = document.getElementById('ad-' + key);
      if (!anchor) continue;

      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', clientId);
      ins.setAttribute('data-ad-slot', def.id);
      ins.setAttribute('data-ad-format', def.format || 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      if (def.layoutKey) ins.setAttribute('data-ad-layout-key', def.layoutKey);
      anchor.appendChild(ins);
    }

    try {
      var ads = document.querySelectorAll('.adsbygoogle');
      for (var j = 0; j < ads.length; j++) { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildAds);
  } else {
    buildAds();
  }
}

// ==========================================
// 通用工具函数
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

// 统一入口
function initSite() {
  loadSiteConfig(function(config) {
    if (config) loadAdSense(config);
  });
}
document.addEventListener('DOMContentLoaded', initSite);
var logoEl = document.querySelector('.logo');
if (logoEl) {
  while (logoEl.firstChild) logoEl.removeChild(logoEl.firstChild);
  var img = document.createElement('img');
  img.src = config.logoImage;
  img.alt = config.siteName;
  img.className = 'logo-img';
  logoEl.appendChild(img);
}
