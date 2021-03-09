chrome.tabs.getSelected(null,function(tab) {
	var tablink = tab.url;
	token = tablink.substr(tablink.indexOf('=')+1);
	console.debug("Authentication complete. Received last.fm token:",token)
	localStorage["lastfm-token"] = token;
});

console.debug("Calling createSession");
chrome.runtime.sendMessage({method: "createSession"}, function(session_token) {
	console.debug("Storing last.fm session:", session_token);
	localStorage["lastfm-session-token"] = session_token;	
	setInterval("checkForChange()",1000);
});