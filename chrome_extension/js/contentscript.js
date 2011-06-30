var title_string,
	artist_string,
	chat_message,
	existing_track_message,
	lastfm_token,
	session_token,
	current_song,
	api_key = "62be1c8445c92c28e5b36f548c069f69",
	api_secret = "371780d53d282c42b3e50229df3df313",
	cancelScrobble = false;

// console.log('TurntableScrobbler loaded.');

var messagePassingContainer = $("<div/>").attr("id","tt-ext-mpd").appendTo("body")
messagePassingContainer[0].addEventListener('tt-ext-new-song-event', function() {
    processNewSong(JSON.parse($("body").attr("data-current-song-obj")));
});

check_for_authentication();

$("body").bind("enableScrobbling", function() {
	
});

function processNewSong(songMetadata) {
    populateSimilarSongs(songMetadata)
    //get events for this artist?
}

function createSuggestedSongsMarkup() {
    if ( $('#tt-ext-suggestions-link').length == 0) {
        $("<div>Suggestions</div>").attr("id","tt-ext-suggestions-link").appendTo("#playlist > .black-right-header");
    }
	if ( $('#tt-ext-suggestions-box').length == 0) {
		$("<div />").attr("id","tt-ext-suggestions-box").appendTo('body')
	}
}

function populateSimilarSongs(songMetadata) {
    createSuggestedSongsMarkup();
    console.log("In populateSimilarSongs with artist:",songMetadata.artist)
	var suggestionsBox = $('#tt-ext-suggestions-box').empty()
    chrome.extension.sendRequest({method: "findSimilarSongs", "songMetadata" : songMetadata}, function(response) {
		//send songs to injected script
		$('body').attr('tt-ext-similar-songs',response)
		var customEvent = document.createEvent('Event');
		customEvent.initEvent('tt-ext-process-similar-songs', true, true);
		$('#tt-ext-mpd')[0].dispatchEvent(customEvent)
    });
}

function checkForChangeOld() {
	//Uses the " started playing "Ayo For Yayo" by Andre Nickatina" string
	
	chat_messages = document.getElementsByClassName("message");
	
	//Make sure there's crap in the chat box first
	if (chat_messages.length > 0) {
		chat_message = chat_messages[chat_messages.length -1].childNodes[1].innerHTML;
		
		//console.log("Existing is: "+existing_track_message + " New is: "+chat_message);
		
		if (chat_message != existing_track_message && chat_message.indexOf("started playing") == 1) {
			existing_track_message = chat_message;
			
			//Figure out the artist and track
			track_string_begins = chat_message.indexOf('"');
			track_string_ends = chat_message.indexOf('"',track_string_begins + 1);
			track_string = chat_message.substr(track_string_begins+1,track_string_ends - track_string_begins-1);
			artist_string = chat_message.substr(track_string_ends+5);

			//Figure out the track length
			//length_raw_string = document.getElementById('songboard_title').innerHTML;
			//track_length = length_raw_string.substr(length_raw_string.indexOf(" - ") + 3);
			
		
			// console.log("Now Playing: " + artist_string + " - " + track_string);
			
			nowPlaying(artist_string,track_string,localStorage["lastfm-session-token"]);
			
		}
	}
}

function checkForScrobblingChange() {
	// console.log($("body").attr("data-enable-scrobbling"));
	if($("body").attr("data-enable-scrobbling") === "true") {
		$("body").attr("data-enable-scrobbling", "false");
		get_authenticated();
	}
}

function checkForChange() {
    var previous_song = current_song;
    current_song = $("body").attr("data-current-song-obj");
	if($("body").attr("data-cancel-scrobble") === "true") {
		if(!cancelScrobble) {
			cancelScrobble = true;
			setCancelScrobble(true);
		}
	} else {
		if(cancelScrobble) {
			cancelScrobble = false;
			setCancelScrobble(false);
		}
	}
    if(current_song !== previous_song) {
        // console.log(current_song);
        $("body").attr("data-cancel-scrobble", false);
        nowPlaying(JSON.parse(current_song),localStorage["lastfm-session-token"]);
    }
}

function get_authenticated() {
	var method = 'POST';
	var callback = chrome.extension.getURL("authenticate.html");
  	var url = 'http://www.last.fm/api/auth/?api_key='+api_key+"&cb="+callback;

	window.localStorage.removeItem("lastfm-session-token");
	window.localStorage.removeItem("lastfm_token");
	
	javascript:window.open(url);
}


function check_for_authentication() {
	chrome.extension.sendRequest({method: "getSession"}, function(token) {
		if(!token || token === 'null') {
			$("body").attr("data-scrobbling-disabled", true);
			setInterval("checkForScrobblingChange()", 1000);
		}
		localStorage["lastfm-session-token"] = token;
		// console.log("SETTING TOKEN:", token);
		$("body").attr("data-lastfm-session-token", token);
		// window.localStorage.setItem("lastfm-session-token", token);
		// console.log("Reieved session: "+token);
		// console.log("token: ", $("body").attr("data-lastfm-session-token"));
	});
	
	
	if (localStorage["lastfm-session-token"]) {
		
		// console.log("Found authentication token.  Moving on.");
				
		setInterval("checkForChange()",1000);
		lastfm_token = localStorage["lastfm_token"];
		lastfm_session_token = localStorage["lastfm-session-token"];
		
	}
}

function nowPlaying(songObj,session) {
	// console.log("Sending now playing request", songObj);

	chrome.extension.sendRequest({method: "nowPlaying",songObj: songObj, session_token: session});

}

function scrobble(songObj,session) {
	// console.log("Sending scrobble request");
	
	chrome.extension.sendRequest({method: "scrobbleTrack",songObj: songObj, session_token: session});

}

function setCancelScrobble(shouldCancel) {
	// console.log("setCancelScrobble", shouldCancel);
    chrome.extension.sendRequest({method: "setCancelScrobble", shouldCancel: shouldCancel});
}






