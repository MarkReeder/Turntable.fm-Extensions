(function() {
    var js, css;
    
    js = document.createElement('script');
    js.src = chrome.extension.getURL("js/turntable.fm.extend.keys.js?v=" + new Date().getTime());
    document.body.appendChild(js);
    
    js = document.createElement('script');
    js.src = chrome.extension.getURL("js/turntable.fm.extend.js?v=" + new Date().getTime());
    document.body.appendChild(js);
    
    css = document.createElement('link');
    css.rel = "stylesheet";
    css.type = "text/css";
    css.href=chrome.extension.getURL("css/turntable.fm.extend.css?v=" + new Date().getTime());
    document.body.appendChild(css);

	var themeCSS = document.createElement('link');
	themeCSS.rel = "stylesheet";
	themeCSS.type = "text/css";
	themeCSS.href=chrome.extension.getURL("css/tt-ext-ui-theme/jquery-ui-1.8.14.custom.css?v=" + new Date().getTime());
	document.body.appendChild(themeCSS);

})();