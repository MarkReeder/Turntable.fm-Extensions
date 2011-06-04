var title_string;
var artist_string;
var chat_message;
var existing_track_message;
var lastfm_token;
var session_token;
var current_song;

var api_key = "62be1c8445c92c28e5b36f548c069f69";
var api_secret = "371780d53d282c42b3e50229df3df313";

// console.log('TurntableScrobbler loaded.');

check_for_authentication();

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

function checkForChange() {
    var previous_song = current_song;
    current_song = $("body").attr("data-current-song-obj");
	if($("body").attr("data-cancel-scrobble")) {
		setCancelScrobble(true);
	} else {
		setCancelScrobble(false);
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

	javascript:window.open(url);
}


function check_for_authentication() {
	chrome.extension.sendRequest({method: "getSession"}, function(token) {
		localStorage["lastfm-session-token"] = token;
		// console.log("SETTING TOKEN:", token);
		$("body").attr("data-lastfm-session-token", token);
		// window.localStorage.setItem("lastfm-session-token", token);
		// console.log("Reieved session: "+token);
		// console.log("token: ", $("body").attr("data-lastfm-session-token"));
	});
	
	//console.log(token);
	
	if (!localStorage["lastfm-session-token"]) {
		window.localStorage.removeItem("lastfm-session-token");
		window.localStorage.removeItem("lastfm_token");
		
		get_authenticated();
		// console.log("No authentication token.  Resolving that.");
	} else {
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
    chrome.extension.sendRequest({method: "setCancelScrobble", shouldCancel: shouldCancel});
}






