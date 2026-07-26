/* ads.js - Shared ad initialization for HelloInsights
   - Injects CSS to hide empty ad slots (zero height, no overflow)
   - MutationObserver auto-expands slot when iframe is inserted
   - Auto-pushes all <ins class="adsbygoogle"> elements (no inline push needed)
   Usage: include <script src="ads.js" defer></script> in <head> after AdSense library
*/
(function(){
    var style=document.createElement('style');
    style.textContent='div[data-ad-slot]{height:0;overflow:hidden;transition:height .3s ease}';
    document.head.appendChild(style);
    function initAds(){
        document.querySelectorAll('div[data-ad-slot]').forEach(function(s){
            if(s.dataset.adInit)return;
            s.dataset.adInit='1';
            new MutationObserver(function(){
                if(s.querySelector('iframe')){
                    s.style.height='auto';
                    s.style.overflow='visible';
                }
            }).observe(s,{childList:true,subtree:true});
        });
        document.querySelectorAll('ins.adsbygoogle:not([data-pushed])').forEach(function(ins){
            ins.setAttribute('data-pushed','1');
            (adsbygoogle=window.adsbygoogle||[]).push({});
        });
    }
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',initAds);
    }else{
        initAds();
    }
})();
