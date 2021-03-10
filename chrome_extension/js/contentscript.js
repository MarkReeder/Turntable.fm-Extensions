console.log('CONTENT SCRIPT')
var title_string,
	artist_string,
	chat_message,
	existing_track_message,
	session_token,
	current_song,
	cancelScrobble = false;

// console.log('TurntableScrobbler loaded.');

var messagePassingContainer = $("<div/>").attr("id","tt-ext-mpd").appendTo("body")
messagePassingContainer[0].addEventListener('tt-ext-new-song-event', function() {
    processNewSong(JSON.parse($("body").attr("data-current-song-obj")));
});
messagePassingContainer[0].addEventListener('tt-ext-new-room-info', function() {
    // console.log("New room info");
    if($("body").attr("data-current-song-obj")) { // Only processNewRoomInfo if we also have a current-song-obj
        processNewRoomInfo(JSON.parse($("body").attr("data-current-song-obj")));
    }
});
messagePassingContainer[0].addEventListener('tt-ext-need-lastfm-auth', function() {
	console.log('GET LAST.FM AUTHENTICATED');
    get_authenticated();
});
messagePassingContainer[0].addEventListener('tt-new-desktop-alert', function () {
	const alert = JSON.parse($('#tt-ext-mpd').first().attr('data-desktop-alert'));
	chrome.runtime.sendMessage({method:"showNotification", notification: alert}, console.log);
})

setInterval("check_for_authentication()",1000);

function processNewRoomInfo(songMetadata) {
    var songLogSource = $('body').attr("data-current-song-log");
    var songLog = songLogSource ? JSON.parse(songLogSource) : [];
    //console.debug("Content:processNewSong: Got sending songlog to background:",songLog)
    populateSimilarSongs(songMetadata,songLog);
}

function processNewSong(songMetadata) {
    var songLogSource = $('body').attr("data-current-song-log");
	var songLog = songLogSource ? JSON.parse(songLogSource) : [];
	console.debug("Content:processNewSong: Got songMetadata, sending songlog to background:",songLog)
	populateSimilarSongs(songMetadata,songLog);
	if (localStorage["lastfm-session-token"]) {	
		sendDataToLastFM(songMetadata);
	}
    //get events for this artist?
}

function createSuggestedSongsMarkup() {
    if ( $('#tt-ext-suggestions-link').length == 0) {
        $("<div>Suggestions</div>").attr("id","tt-ext-suggestions-link").appendTo("#playlist > .black-right-header");
    }
}

function sendDataToLastFM(songMetadata) {
	//console.debug("contentScript::sendDataToLastFM: Setting data-cancel-scrobble to false and calling nowPlaying()")
	$("body").attr("data-cancel-scrobble", false);
	nowPlaying(songMetadata,localStorage["lastfm-session-token"]);
}

function populateSimilarSongs(currentSong,songLog) {
    createSuggestedSongsMarkup();
	$('body').attr('tt-ext-similar-songs','');
	$('#tt-ext-suggestions-box').empty()
	var requestData = {
		method: "findSimilarSongs",
		songInformation: {
			currentSong : currentSong,
			songLog : songLog
		}
	}    
	// console.log("requestData", requestData);

    chrome.runtime.sendMessage(requestData, function(response) {
		//send songs to injected script
		$('body').attr('tt-ext-similar-songs',response);
		var customEvent = document.createEvent('Event');
		customEvent.initEvent('tt-ext-process-similar-songs', true, true);
		$('#tt-ext-mpd')[0].dispatchEvent(customEvent)
    });
}

function checkForCancelScrobbleChanges() {
	if($("body").attr("data-cancel-scrobble") === "true") {
		if(!cancelScrobble) {
			//console.debug("contentScript::checkForChange: data-cancel-scrobble was true and cancelScrobble was false, setting cancel scrobble to true")
			cancelScrobble = true;
			setCancelScrobble(true); 
		}
	} else {
		if(cancelScrobble) {
			//console.debug("contentScript::checkForChange: data-cancel-scrobble was false and cancelScrobble was true, setting cancel scrobble to false")
			cancelScrobble = false;
			setCancelScrobble(false);
		}
	}    
}

function get_authenticated() {

	chrome.runtime.sendMessage({method:"authLastFM"}, function() {
		window.localStorage.removeItem("lastfm-session-token");
	});	
	
	//console.debug("In get_authenticated, cleared out local storage, opening last.fm auth window with url:",url)
	// javascript:window.open(url);
}


function check_for_authentication() {
	chrome.runtime.sendMessage({method: "getSession"}, function(token) {
		// console.debug("In response for check_for_authentication: token:",token)
		if(token && token !== 'null' && token !== 'undefined') {
			localStorage["lastfm-session-token"] = token; //shared between the content script and the injected script
			// console.debug("check_for_authentication: token was not null, checking for cancelScrobble changes.", {token})
			checkForCancelScrobbleChanges();
		}
	});	
}

function nowPlaying(songObj,session) {
	// console.log("Sending now playing request", songObj);
	var scrobbleEnabled = JSON.parse(localStorage["TFMEX"]).enableScrobbling
	//console.debug("contentScript::nowPlaying: scrobbleEnabled is",scrobbleEnabled)
	chrome.runtime.sendMessage({method: "nowPlaying",songObj: songObj, session_token: session,scrobbleEnabled:scrobbleEnabled});
}

function setCancelScrobble(shouldCancel) {
	// console.log("setCancelScrobble", shouldCancel);
    chrome.runtime.sendMessage({method: "setCancelScrobble", shouldCancel: shouldCancel});
}

function saveManifestVersionToDOM() {
	chrome.runtime.sendMessage({method: "getManifestVersion"}, function(response) {
		$('body').attr('tt-ext-manifest-version',response)
    });	
}
saveManifestVersionToDOM()




