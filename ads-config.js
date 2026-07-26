/**
 * HelloInsights - 广告配置中心 (ads-config.js)
 * 
 * 所有广告 ID 集中管理，修改此文件即可全局生效
 * 三个页面自动加载，JS 控制渲染和显隐
 * 
 * 使用方法：
 *   1. 替换 ADSENSE_CLIENT 为你的发布商 ID
 *   2. 替换各 SLOT 为对应的广告单元 ID
 *   3. MGID 填入 widget URL，留空则不加载
 */
(function() {
    'use strict';

    // ========================================
    //  📢 广告配置 - 只改这里
    // ========================================
    var ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';

    var SLOTS = {
        'zone-top':               'XXXXXXXXXX',
        'zone-mid':               'XXXXXXXXXX',
        'zone-bottom':            'XXXXXXXXXX',
        'index-banner-bottom':    'XXXXXXXXXX',
        'index-anchor':           'XXXXXXXXXX',
        'article-banner':         'XXXXXXXXXX',
        'article-mgid-widget':    'XXXXXXXXXX',
        'cat-top':                'XXXXXXXXXX',
        'cat-mid':                'XXXXXXXXXX',
        'cat-bottom':             'XXXXXXXXXX'
    };

    // MGID Widget URLs（留空 = 不加载）
    var MGID = {
        'zone-mid':           '',
        'zone-bottom':        '',
        'article-mgid':       '',
        'article-interstitial': '',
        'cat-mid':            ''
    };

    // ========================================
    //  自动初始化
    // ========================================

    // 加载 AdSense SDK
    var sdk = document.createElement('script');
    sdk.async = true;
    sdk.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    sdk.crossOrigin = 'anonymous';
    document.head.appendChild(sdk);

    // DOM 就绪后开始
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        renderAll();
        // 多轮检测：广告 SDK 加载有延迟
        setTimeout(checkFill, 1500);
        setTimeout(checkFill, 4000);
        setTimeout(checkFill, 8000);
    }

    // 渲染所有广告位
    function renderAll() {
        renderAdSense();
        renderMGID();
    }

    function renderAdSense() {
        var containers = document.querySelectorAll('[data-ad-slot]');
        for (var i = 0; i < containers.length; i++) {
            var el = containers[i];
            var slotKey = el.getAttribute('data-ad-slot');
            var slotId = SLOTS[slotKey];
            if (!slotId) {
                // 没有配置 slot，隐藏
                el.style.display = 'none';
                continue;
            }

            var ins = document.createElement('ins');
            ins.className = 'adsbygoogle';
            ins.style.cssText = 'display:block';
            ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
            ins.setAttribute('data-ad-slot', slotId);
            ins.setAttribute('data-ad-format', 'auto');
            ins.setAttribute('data-full-width-responsive', 'true');
            el.appendChild(ins);

            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {}
        }
    }

    function renderMGID() {
        for (var id in MGID) {
            if (!MGID.hasOwnProperty(id) || !MGID[id]) continue;
            var el = document.querySelector('[data-ad-slot="' + id + '"]') || document.getElementById(id);
            if (!el) continue;

            var s = document.createElement('script');
            s.src = MGID[id];
            s.async = true;
            el.appendChild(s);
        }
    }

    // ========================================
    //  填充检测：未填充 → 隐藏，已填充 → 显示
    // ========================================
    function checkFill() {
        var containers = document.querySelectorAll('[data-ad-slot]');
        for (var i = 0; i < containers.length; i++) {
            var el = containers[i];

            // 检查是否有 iframe（广告 SDK 渲染成功的标志）
            var iframe = el.querySelector('iframe');
            // 检查 ins 标签实际尺寸
            var ins = el.querySelector('ins.adsbygoogle');
            var hasSize = false;
            if (ins) {
                var rect = ins.getBoundingClientRect();
                hasSize = rect.height > 10;
            }
            // 检查 MGID script 注入
            var hasMGID = el.querySelector('script[src*="mgid"]');

            if (iframe || hasSize || hasMGID) {
                // 广告已填充 → 显示
                el.classList.add('ad-visible');
                el.classList.remove('ad-hidden');
                el.style.display = '';  // 清除内联，让 CSS class 生效
            } else {
                // 广告未填充 → 隐藏
                el.style.display = 'none';
                el.classList.add('ad-hidden');
                el.classList.remove('ad-visible');
            }
        }
    }
})();
