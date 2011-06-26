TFMEX = {};

/*
  turntable.fm extend
  
  Developed by:
    Mark Reeder http://twitter.com/Mark_Reeder
*/


TFMEX.$body = $("body");
TFMEX.prefs = {
    "showChat": true,
    "showSong": true,
    "showVote": true,
    "showDJChanges": false,
    "showListenerChanges": false,
    "autoAwesome": false,
    "messageTimeout": 10000,
    "autoKick": false,
    "autoKickUsers": {}
};
TFMEX.clearNotifications = function() {
	// Should work but doesn't at the moment due to this bug: https://code.google.com/p/chromium/issues/detail?id=40262
	var notifciation = null;
	while(TFMEX.notificationQueue.length) {
		notification = TFMEX.notificationQueue.pop();
		// console.log(notification);
		notification.cancel();
	}
}

TFMEX.votelog = [];
TFMEX.notificationQueue = [];
$(document).ready(function() {
    try {
    // $("script[href$='turntable.fm.extend.dev.js']").remove();
	// $(window).bind('beforeunload', TFMEX.clearNotifications);
    $("#tfmExtended").remove();
    TFMEX.$body.append('<div id="tfmExtended"><div class="settings"><div class="gear"></div><div class="preferences hidden"></div></div></div>');
    $("#tfmExtended .gear").click(function(){
        if($("#tfmExtended .preferences").hasClass("hidden")) {
            showPrefs();
        } else {
            hidePrefs();
        }
    });
	function enableDesktopNotifications() {
	    if(window.webkitNotifications && window.webkitNotifications.checkPermission() != 0){
	        TFMEX.$body.bind('click.enableDesktopNotify', function() {
				window.webkitNotifications.requestPermission(function() {
	            	desktopAlert({
		                title: "",
		                image: "",
		                body: "Desktop notifications enabled.",
		                timeout: 1
	            	});
	            	TFMEX.$body.unbind('click.enableDesktopNotify')
				});
	        });
	    }
	}
    setupLive();
	enableDesktopNotifications();
    var songMetadata = {},
		lastSongMetadata = {},
		lastRoomUrl = "",
        songVotes = [],
        voteMap = {
            "up": "Awesome",
            "down": "Lame"
        },
	listenerChangeMap = {
	    "deregistered": "left",
	    "registered": "entered"
	},
	djChangeMap = {
	    "add_dj": "just stepped up to",
	    "rem_dj": "just stepped down from"
	},
	highlightMatchingTracks = function(songToMatch, $songQueue) {
		var normalizeText = function(incomingText) {
			var parsedText, alphaNumericText;
			
			parsedText = incomingText.toLowerCase();
			alphaNumericText = parsedText.replace(/[^a-zA-Z 0-9]+/g,'');
			if(alphaNumericText === "") {
				return parsedText;
			} else {
				return alphaNumericText;
			}
		}
		for(j in turntable.playlist.files) {
			playlistSong = turntable.playlist.files[j];
			if(songToMatch._id === playlistSong.fileId ||
				(normalizeText(songToMatch.metadata.artist) === normalizeText(playlistSong.metadata.artist)
				 && normalizeText(songToMatch.metadata.song) === normalizeText(playlistSong.metadata.song))) {
				$($songQueue[j]).addClass("matchesRecentlyPlayedExactly");
			} else if(normalizeText(songToMatch.metadata.artist) === normalizeText(playlistSong.metadata.artist)) {
				$($songQueue[j]).addClass("matchesRecentlyPlayedArtist");
			} else if(normalizeText(songToMatch.metadata.song) === normalizeText(playlistSong.metadata.song)) {
				$($songQueue[j]).addClass("matchesRecentlyPlayedSongTitle");
			}
		}
	},
	getRoomInfo = function() {
		// console.log("in getRoomInfo()");
	    var messageFunctionName = turntable.randomRoom.toString().match(/(turntable\.)([^(]+)(\(\{api:)/)[2]
	    var messageFunc = eval("turntable." + messageFunctionName)	
		
		messageFunc({
			api: "room.info",
			roomid: turntable.topViewController.roomId
		}, function(info){
			var i, j, song, playlistSong, startTime, songQueue;
			$songQueue = $("#right-panel .songlist .song");
			$songQueue.removeClass("matchesRecentlyPlayedExactly");
			$songQueue.removeClass("matchesRecentlyPlayedArtist");
			$songQueue.removeClass("matchesRecentlyPlayedSongTitle");
			for(i in info.room.metadata.songlog) {
				song = info.room.metadata.songlog[i];
				highlightMatchingTracks(song, $songQueue);
				/* Log these into a local indexedDB
				startTime = song.starttime;
				delete song.starttime;
				*/
				// console.log(startTime, song);
			}		    
		});		
	},
	attachListeners = function() {
		// console.log("in attachListeners");
        var intervalID = window.setInterval(function() {
			// console.log("window.turntable.eventListeners.message.length", window.turntable.eventListeners.message.length);
            if(window.turntable.eventListeners.message.length) {
				// console.log("attaching listeners");
				getRoomInfo();
                window.turntable.addEventListener("message", extensionEventListener);
                window.turntable.addEventListener("soundstart", extensionEventListener);
                window.clearInterval(intervalID);
				setInterval(checkForChange,1000);
            }
        }, 250);
	},
	checkForChange = function() {
		var tempSongMetadata = null;
		try {
			lastSongMetadata = songMetadata;
			if(lastRoomUrl !== window.location.href) {
				if(lastRoomUrl !== "") {
					getRoomInfo();
				}
				lastRoomUrl = window.location.href;
			}
			if(window.turntable.topViewController.currentSong) {
				songMetadata = window.turntable.topViewController.currentSong.metadata;
			    if(songMetadata.song !== lastSongMetadata.song && songMetadata.artist !== lastSongMetadata.artist) {
					// console.log("Found a change!");
					lastSongMetadata = songMetadata;
					updateNowPlaying(songMetadata);
			    } else {
			        return;
			    }
			}
		} catch(e) { }
	},
	cleanUp = function() {
		for(var eventListener in window.turntable.eventListeners.message) {
			// console.log("eventListener: ", window.turntable.eventListeners.message[eventListener]);
		}
		// window.turntable.eventListeners.message = [];
        // window.turntable.eventListeners.soundstart = [];
	},
    showPrefs = function() {
        var preferencesContent = "",
            preferenceSettings = {},
            currentVote = null;

	    preferencesContent += '<div class="flR"><h3>Current Users:</h3><ul class="currentUserList"></ul></div>';
	
		if($("body").data('scrobbling-disabled')) {
			preferencesContent += '<a href="#" class="setEnableScrobbling">Click here to enable last.fm scrobbling.</a>';
		}
        preferencesContent += '<dl class="flL">';
        preferencesContent += '<dt>Show Chat Messages?<br />(Note: Disable the chat ding for this to work)</dt>';
        preferencesContent += '<dd><input type="checkbox" id="showChat" data-tfmex-pref="showChat" value="1" /></dd>';
        preferencesContent += '<dt>Show Song Messages?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="showSong" data-tfmex-pref="showSong" value="1" /></dd>';
        preferencesContent += '<dt>Show Vote Messages?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="showVote" data-tfmex-pref="showVote" value="1" /></dd>';
        preferencesContent += '<dt>Show DJ Changes?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="showDJChanges" data-tfmex-pref="showDJChanges" value="1" /></dd>';
        preferencesContent += '<dt>Show Listener Changes?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="showListenerChanges" data-tfmex-pref="showListenerChanges" value="1" /></dd>';
        preferencesContent += '<dt>Auto Awesome?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="autoAwesome" data-tfmex-pref="autoAwesome" value="1" /></dd>';
        preferencesContent += '<dt>Auto-Kick?</dt>';
        preferencesContent += '<dd><input type="checkbox" id="autoKick" data-tfmex-pref="autoKick" value="0" /></dd>';
        preferencesContent += '</dl>';
        preferencesContent += '<div class="clL" id="modifyAutoKick">Modify Auto-Kick List</div>';
        
        if(TFMEX.votelog.length === 0 && typeof(window.turntable.topViewController.upvoters) !== "undefined" && window.turntable.topViewController.upvoters.length > 0) {
            for (var upvoter in window.turntable.topViewController.upvoters) {
                if (window.turntable.topViewController.upvoters.hasOwnProperty(upvoter)) {
                    TFMEX.votelog.push([window.turntable.topViewController.upvoters[upvoter], "up"]);
                }
            }
        }
        preferencesContent += '<ul class="currentSongVotes clL">';
        for (var vote in TFMEX.votelog) {
            if (TFMEX.votelog.hasOwnProperty(vote)) {
                currentVote = TFMEX.votelog[vote];
                preferencesContent += "<li>";
                try {
                    preferencesContent += window.turntable.topViewController.users[currentVote[0]].name;
                } catch(e) {
					preferencesContent += "[]";
				};
                preferencesContent += " voted: " + voteMap[currentVote[1]];
                preferencesContent += "</li>";
            }
        }
        preferencesContent += '</ul>';
        preferencesContent += '<div class="clB">&nbsp;</div>';
        $("#tfmExtended .preferences").html(preferencesContent);
        $('#modifyAutoKick').click(setupAutoKickPrefs);
        $("#tfmExtended .preferences").removeClass("hidden");
		preferenceSettings = localStorage.getItem("TFMEX");
		if(preferenceSettings) {
		    preferenceSettings = JSON.parse(preferenceSettings);
		    $.extend(TFMEX.prefs, preferenceSettings);
		    preferenceSettings = TFMEX.prefs;
		} else {
		    preferenceSettings = TFMEX.prefs;
		}
        
        for (var prefName in preferenceSettings) {
            if (preferenceSettings.hasOwnProperty(prefName)) {
                $('#tfmExtended input[data-tfmex-pref=' + prefName + ']')
                    .attr('checked', preferenceSettings[prefName])
                    .change(function() {
                        var $this = $(this);
                        if($this.attr('checked')) {
                            TFMEX.prefs[$this.attr('data-tfmex-pref')] = true;
                        } else {
                            TFMEX.prefs[$this.attr('data-tfmex-pref')] = false;
                        }
                        localStorage.setItem("TFMEX", JSON.stringify(TFMEX.prefs));
                    });
            }
        }
        TFMEX.prefs = preferenceSettings;
		updateUserList();
    },
    hidePrefs = function() {
        $("#tfmExtended .preferences").addClass("hidden");
    },
    desktopAlert = function(notificationObj) {
	    if(window.webkitNotifications && window.webkitNotifications.checkPermission() == 0){
			// console.log("Have permissions, setting up desktop alert.");
		    var notification = webkitNotifications.createNotification(
			      notificationObj.image?notificationObj.image:"",  // icon url - can be relative
			      notificationObj.title?notificationObj.title:"",  // notification title
			      notificationObj.body?notificationObj.body:""  // notification body text
			    );
			// TFMEX.notificationQueue.push(notification);
		    notification.show();
		    setTimeout(function(){
				// var lastNotification = TFMEX.notificationQueue.pop();
		        notification.cancel();
		    }, notificationObj.timeout);
		} else {
			// console.log("Discarded desktop alert, don't have proper permission.")
		}
    },
    updateNowPlaying = function(songObj) {
        var lfmSessionToken = $("body").attr("data-lastfm-session-token"),
			songToMatch = {};
		songToMatch.metadata = songObj;
		// console.log("updateNowPlaying: ", songObj);
		
        TFMEX.votelog = [];
		
		try {
    		highlightMatchingTracks(songToMatch, $("#right-panel .songlist .song"));
            if(TFMEX.prefs.showSong) {
    			// console.log("About to show song: ", songObj);
    			setTimeout(function() {
    				// console.log("Show Song: ", songMetadata);
    				var title = window.turntable.topViewController.users[window.turntable.topViewController.currentDj].name + " is spinning:",
                        coverArt = songMetadata.coverart?songMetadata.coverart:"",
                        body = songMetadata.artist + " - " + songMetadata.song;
                    desktopAlert({
                        title: title,
                        image: coverArt,
                        body: body,
                        timeout: TFMEX.prefs.messageTimeout
                    });
    			}, 500);
            } else {
    			// console.log("Not displaying song change notification: ", TFMEX.prefs);
    		}
		
    		if(TFMEX.prefs.autoAwesome) {
    			// console.log("About to auto awesome the current track.");
    			setTimeout(function() {
    				// console.log("AWESOME!");
    				ROOMMANAGER.callback('upvote');
    			}, 1000);
    		} else {
    			// console.log("Auto awesome is disabled.");
    		}
    	} catch(e) { 
    	    console.error("updateNowPlaying error: " + e.message);
    	}
        
        if(lfmSessionToken) {
            try {
                // console.log("songMetadata", songObj);
                // console.log("lfm token:", lfmSessionToken);
                // console.log("sendRequest- nowPlaying", songObj, lfmSessionToken);
                $("body").attr("data-current-song-obj", JSON.stringify(songObj));
                // chrome.extension.sendRequest({method: "nowPlaying",trackObj: songObj, session_token: lfmSessionToken});
            } catch(e) { console.error(e.message); }
        }/* else {
            console.log("no lfm session, retry");
            window.setTimeout(function() { updateNowPlaying(songObj); }, 250);
        }*/
    },
	updateUserList = function() {
		var userList = "",
			currentUser = {};
        for (var user in window.turntable.topViewController.users) {
            if (window.turntable.topViewController.users.hasOwnProperty(user)) {
				currentUser = window.turntable.topViewController.users[user];
				userList += '<li><a href="http://facebook.com/profile.php?id=' + currentUser['fbid'] + '" target="_blank">' + currentUser['name'] + "</a>";
            }
        }	
		$('#tfmExtended .preferences .currentUserList').html(userList);
	},
    extensionEventListener = function(m){
    
        var songMetadata = null,
            currentDJ = "",
            currentDJName = "";
        
		
		
		// if(m.hasOwnProperty("msgid")){ }
		
		// console.log("m.command", m.command);
        if(typeof(m.command) !== "undefined") {
			// console.log("m.command: ", m.command, TFMEX.prefs);
            switch(m.command) {
                case "newsong":
                    try {
                        if(TFMEX.prefs.autoAwesome) {
							/*
							setTimeout(function() {
								$("#btn_upvote").click();
							}, 1000);
							*/
                            // ROOMMANAGER.callback("upvote");
                        }
						/*
                        songMetadata = m.room.metadata.current_song.metadata;
                        lastSongMetadata = songMetadata;
						*/
                        // console.log(songMetadata);
                        // currentDJ = m.room.metadata.current_dj;
                        // currentDJName = Room.users[currentDJ].name;
                        // console.log(currentDJName, songMetadata.coverart, songMetadata.song + " by " + songMetadata.artist + " on " + songMetadata.album);

                    } catch(e) {
                        // console.error(e.message);
                        return;
                    }
                    break;
                case "speak":
                    if(TFMEX.prefs.showChat) {
                        desktopAlert({
                            title: "",
                            image: "",
                            body: m.name + ": " + m.text,
                            timeout: TFMEX.prefs.messageTimeout
                        });
                    }
                    break;
                case "registered":
                    for (var userIndex in m.user){
                        var user = m.user[userIndex];
                        if(user.userid in TFMEX.prefs.autoKickUsers && TFMEX.prefs.autoKick) {
                            ROOMMANAGER.callback('boot_user',user.userid);
                        }
                    }
                    break;
                case "deregistered":
                    if(TFMEX.prefs.showListenerChanges) {
                        // console.log("showListenerChanges", m);
                        desktopAlert({
                            title: m.user[0].name + " just " + listenerChangeMap[m.command] + " the room.",
                            image: "",
                            body: "",
                            timeout: TFMEX.prefs.messageTimeout
                        });
		            }
                    break;
                case "add_dj":
                case "rem_dj":
                    if(TFMEX.prefs.showDJChanges) {
                        // console.log("showDJChanges", m);
                        desktopAlert({
                            title: m.user[0].name + " " + djChangeMap[m.command] + " the decks.",
                            image: "",
                            body: "",
                            timeout: TFMEX.prefs.messageTimeout
                        });
                    }
                    break;
                case "update_votes":
                    TFMEX.votelog = m.room.metadata.votelog;
                    var currentVote = TFMEX.votelog[TFMEX.votelog.length - 1];
					if(currentVote[0] === window.turntable.topViewController.roomManager.myuserid) {
						if(currentVote[1] == "down") {
							$("body").attr("data-cancel-scrobble", true);
						} else {
							$("body").attr("data-cancel-scrobble", false);
						}
					}
                    try {
                        if(TFMEX.prefs.showVote) {
                            desktopAlert({
                                title: window.turntable.topViewController.users[currentVote[0]].name + " voted: ",
                                image: "",
                                body: voteMap[currentVote[1]],
                                timeout: TFMEX.prefs.messageTimeout
                            });
                        }
                    } catch(e) { console.error(e.message); }
                case "update_user":
                case "new_moderator":
                default:
            }
        } else {
            // console.log("Command Undefined");
        }
    }
} catch(e) { console.error(e); }

try {
	attachListeners();
    $(window).bind("popstate", function (b) {
		/*
		console.log("popstate: ", b);
		*/
        cleanUp();
        attachListeners();
    });
    $(window).bind("pushstate", function (b) {
		/*
		console.log("pushstate: ", b);
		*/
        cleanUp();
        attachListeners();
    });
} catch(e) { console.error(e.message); }
});
function setupAutoKickPrefs(){
    autoKickPrefs = '';
    autoKickPrefs += '<div class="modal" id="autoKickUserPrefs">';
    autoKickPrefs += '<div class="close-x" />';
    autoKickPrefs += '<label for="addAutoKickUser" >Add User</label>';
    autoKickPrefs += '<input id="addAutoKickUser" type="text" />';
    autoKickPrefs += '<div id="addAutoKickUserButton">+</div>';
    autoKickPrefs += '<div id="autoKickUserList">';
    autoKickPrefs += '<ul>';
    for (var userId in TFMEX.prefs.autoKickUsers){
        var user = TFMEX.prefs.autoKickUsers[userId];
        autoKickPrefs += generateAutoKickLi(user.name, userId);
    }
    autoKickPrefs += '</ul>';
    autoKickPrefs += '</div>';
    autoKickPrefs += '</div>';
    // console.log(autoKickPrefs);
    $('#overlay').html(autoKickPrefs);
    $('#overlay').show();
    $('.close-x').click(function(){
        $('#overlay').html('');
        $('#overlay').hide();
    });
    $('#addAutoKickUserButton').click(function(){
        var username = $('#addAutoKickUser').val();
        var users = turntable.topViewController.users;
        var foundUser = false;
        for (var userId in users){
            if (users[userId].name == username){
                // console.log('found user!');
                var user = users[userId],
                    shitlist = TFMEX.prefs.autoKickUsers,
                    newlyAdded = true;
                for (var cmpUserId in shitlist){
					/*
                    console.log('---------------');
                    console.log(userId);
                    console.log(cmpUserId);
                    console.log('===============');
					*/
                    if (userId === cmpUserId){
                        newlyAdded = false;
                    }
                }
                if (newlyAdded){
                    var li = generateAutoKickLi(username, userId);
                    $('#autoKickUserList').children('ul').append(li);
                    TFMEX.prefs.autoKickUsers[userId] = {notes:""}
                }
                $.extend(TFMEX.prefs.autoKickUsers[userId],
                         {name: username});
                localStorage.setItem("TFMEX", JSON.stringify(TFMEX.prefs));
                var newlyAdded = true;
                foundUser = true;
                break;
            }
        }
        if (! foundUser){
            alert('couldnt find em, sorry bro');
        }
    });

};
function generateAutoKickLi(username, userId){
    var autoKickPrefs = '';
    autoKickPrefs += '<li data-userid="'+userId+'">';
    autoKickPrefs += '<span>'+username+'</span>';
    autoKickPrefs += '<a class="viewNotesAutoKickUser marginfive" href="#">Notes</a>';
    autoKickPrefs += '<a class="removeAutoKickUser marginfive" href="#">Remove</a>';
    autoKickPrefs += '</li>';
    return autoKickPrefs;
}
function setupLive(){
    // console.log('setup');
    $('.viewNotesAutoKickUser').live('click', function(evt){
        evt.preventDefault();
    });
    $('.removeAutoKickUser').live('click', function(evt){
        evt.preventDefault();
        // console.log(evt);
        // console.log(evt.currentTarget);
        var parent = $(evt.currentTarget).parent(),
            userId = parent.data('userid');
        parent.slideUp('fast', parent.remove);
        delete TFMEX.prefs.autoKickUsers[userId];
    });
	$('.setEnableScrobbling').live('click', function(evt) {
		// console.log(evt);
		evt.preventDefault();
		TFMEX.$body.attr("data-enable-scrobbling", true);
	});
}
