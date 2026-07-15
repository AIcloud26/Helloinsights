// HelloInsights — Site Config Loader & Ad Manager
var siteConfig = null;

function applyConfig(config) {
  siteConfig = config;
  document.documentElement.style.setProperty('--accent-color', config.accentColor);

  // Logo — clear everything, keep only image
  var logoEl = document.querySelector('.logo');
  if (logoEl) {
    while (logoEl.firstChild) logoEl.removeChild(logoEl.firstChild);
    var src = config.logoImage || '';
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = config.siteName;
      img.className = 'logo-img';
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
    if (bottom) bottom.innerHTML = '&copy; <script>document.write(new Date().getFullYear())</script> ' + config.siteName + '. All rights reserved.';
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
// AdSense Manager — inject ads, hide unfilled
// ==========================================
function loadAdSense(config) {
  if (!config || !config.adsense || !config.adsense.enabled) return;
  var clientId = config.adsense.clientId;
  var slots = config.adsense.slots;
  var pageAds = config.adsense.pageAds || {};
  var page = location.pathname.split('/').pop() || 'index.html';
  var adSlots = pageAds[page];
  if (!adSlots || !adSlots.length) return;

  // 注入 AdSense 脚本（延迟执行）
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + clientId;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);

  // 构建广告容器（不立即填充）
  var containers = [];
  for (var i = 0; i < adSlots.length; i++) {
    var key = adSlots[i];
    var def = slots[key];
    if (!def) continue;
    var anchor = document.getElementById('ad-' + key);
    if (!anchor) continue;
    anchor.className = 'ad-container';
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', clientId);
    ins.setAttribute('data-ad-slot', def.id);
    ins.setAttribute('data-ad-format', def.format || 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    if (def.layoutKey) ins.setAttribute('data-ad-layout-key', def.layoutKey);
    anchor.appendChild(ins);
    containers.push({ el: anchor, ins: ins, isFirst: i === 0 });
  }

  // 懒加载：用 IntersectionObserver，广告滚入视口时才请求
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      for (var e = 0; e < entries.length; e++) {
        if (entries[e].isIntersecting) {
          var target = entries[e].target;
          var item = containers.filter(function(c) { return c.el === target; })[0];
          if (item && !item.loaded) {
            item.loaded = true;
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(ex) {}
          }
          observer.unobserve(target);
        }
      }
    }, { rootMargin: '200px 0px' }); // 提前 200px 开始加载

    for (var i = 0; i < containers.length; i++) {
      // 首屏广告立即加载（banner 通常在顶部）
      if (containers[i].isFirst) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(ex) {}
        containers[i].loaded = true;
      } else {
        observer.observe(containers[i].el);
      }
    }
  } else {
    // 降级：不支持 Observer 就全部立即加载
    try {
      var ads = document.querySelectorAll('.adsbygoogle');
      for (var j = 0; j < ads.length; j++) { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    } catch(e) {}
  }

  // 隐藏未填充广告
  setTimeout(hideUnfilledAds, 3000);
  setTimeout(hideUnfilledAds, 8000);
}

function hideUnfilledAds() {
  var allIns = document.querySelectorAll('ins.adsbygoogle');
  for (var i = 0; i < allIns.length; i++) {
    var status = allIns[i].getAttribute('data-ad-status');
    if (status === 'unfilled') {
      var container = allIns[i].closest('.ad-container');
      if (container) container.style.display = 'none';
    }
  }
}
// ==========================================
// Utilities
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

// Entry
function initSite() {
  loadSiteConfig(function(config) {
    if (config) loadAdSense(config);
  });
}
document.addEventListener('DOMContentLoaded', initSite);
