(function() {
    var js, css;
    js = document.createElement('script');
    js.src = chrome.extension.getURL("js/turntable.fm.extend.js?v=0.6_" + new Date().getTime());
    document.body.appendChild(js);
    
    css = document.createElement('link');
    css.rel = "stylesheet";
    css.type = "text/css";
    css.href=chrome.extension.getURL("css/turntable.fm.extend.css?v=0.6_" + new Date().getTime());
    document.body.appendChild(css);
})();