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
    "messageTimeout": 10000
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

TFMEX.suggestionsOverlayView = function() {
	return [
		"div.modal.suggestionsOverlay",
		{
			style: {
				width:"590px",
				"padding-left":0,
				"padding-right":0,
				"padding-bottom":0			 
			}
		},
		[
			"div.close-x",
			{
				event: {
					click: turntable.hideOverlay
				}
			} 
		],
		[
			"h2",
			"Some suggestions"
		],
		[
			"p",
			"These are based on the current song."
		],
		[
			"div##songs.tt-ext-suggested-songs"					
		]
	]
}

TFMEX.suggestedSongView = function(song) {
	var a = {}
	a.artist = song.artist.name
	a.song = song.name
	
	return [
		"div.tt-ext-suggested-song",
		{
			
		},
		[
			"div",
			[
				"span.title",
				{title:a.song},		
				a.song
			],
			[
				"span.tt-ext-search-link",
				{
					data: {
						query: a.song + " " + a.artist
					}						
				},
				"Search for this track"
			]
		],
		[
			"div",
			[
				"span.artist",
				{},		
				a.artist
			],
			[
				"span.tt-ext-search-link",
				{
					data: {
						query: a.artist
					}						
				},
				"More by this artist"
			]
		]
	]
	 
}

$(document).ready(function() {
	var tKeysLength = Object.keys(turntable).length,
		lastPlayedSong = {};
	TFMEX.roomInfo = null;
	TFMEX.userInfo = null;
	TFMEX.roommanager = null;
	var getTurntableObjects = function(){
		TFMEX.roomInfo = null;
		TFMEX.userInfo = null;
		TFMEX.roommanager = null;
	    var dfd = $.Deferred(),
			resolveWhenReady = function() {
			// console.log("attempting to resolve");
			// console.log(Object.keys(turntable).length, tKeysLength);
			// console.dir(turntable);

			for(var o in turntable) {
				if(turntable[o] !== null) {
					for(var o2 in turntable[o]) {
						if(turntable[o][o2] !== null) {
							if(o2 == 'currentDj') {
								// console.log("currentDj found in: ", o);
								TFMEX.roomInfo = turntable[o];
								break;
							}
							if(o2 == 'displayName') {
								// console.log("displayName found in: ", o);
								TFMEX.userInfo = turntable[o];
								break;
							}
						}
					}
				}
			}
			
			if(TFMEX.roomInfo && TFMEX.userInfo) {
				for(o in TFMEX.roomInfo) {
					if(TFMEX.roomInfo[o] !== null) {
						for(o2 in TFMEX.roomInfo[o]) {
							if(o2 == 'myuserid') {
								TFMEX.roommanager = TFMEX.roomInfo[o]
							}
						}
					}
				}
				dfd.resolve();
			} else {
				setTimeout(function(){
					resolveWhenReady();
				}, 250);
			}
		};	
		resolveWhenReady();

	    return dfd.promise();
	}
	var whenTurntableObjectsReady = function() {
		
		/*
		console.log("success!");
		console.log(TFMEX.roomInfo);
		console.log(TFMEX.userInfo);
		console.log("TFMEX.roommanager", TFMEX.roommanager);
		*/
		
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
		$('#tt-ext-mpd')[0].addEventListener('tt-ext-process-similar-songs',function () {
			//var similarSongs = $('body').data('similarSongs')
			var songs = JSON.parse($('body').attr('tt-ext-similar-songs'))
			if (songs.length > 0) {
				console.log("Found",songs.length,"similar songs.")
				$('#tt-ext-suggestions-link').fadeIn(500)				
			} else {
				console.log("No related songs available for",songMetadata.artist,". Hiding suggestions link.")
				$('#tt-ext-suggestions-link').fadeOut(500)
			}
		});
		$('#tt-ext-suggestions-link').live('click', function() {
				//$('#tt-ext-suggestions-box').dialog()
				var containers = {}
				var suggestionsMarkup = util.buildTree(TFMEX.suggestionsOverlayView(),containers)
				var songContainer = containers.songs
				
				var songs = JSON.parse($('body').attr('tt-ext-similar-songs'))
				$.each(songs,function(index, song) {
					var tree = TFMEX.suggestedSongView(song)
					var songMarkup = util.buildTree(tree)
					$(songContainer).append(songMarkup)
				})
				
				turntable.showOverlay(suggestionsMarkup)				
		});
		$('.tt-ext-suggested-song .tt-ext-search-link').live('click', function(evt) {
				var searchBox = $('form.input.songSearch input')
				if (searchBox.length == 0) {
					console.warn("Couldn't find search box")
					//TODO: showalert
				}
				else {
					searchBox.val($(evt.target).data('query'))
					$('form.input.songSearch').trigger('submit')
					turntable.hideOverlay()
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
		function untrickify (b) {
			if (b) {
				 var c = function(){}
			     for (var a in b) {
			          if (typeof b[a] == "function") {
						b[a].toString = c.toString;
			         }
			     }
			 }
		}
		untrickify(window.turntable);
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
			var messageFunc = getSendMessageFunction()
			try {
				// console.log("messageFunctionName", messageFunctionName);

				messageFunc({
					api: "room.info",
					roomid: TFMEX.roomInfo.roomId
				}, function(info){
					// console.log("messageFunc", info);
					var i, j, song, playlistSong, startTime, songQueue;
					$songQueue = $("#right-panel .songlist .song");
					$songQueue.removeClass("matchesRecentlyPlayedExactly");
					$songQueue.removeClass("matchesRecentlyPlayedArtist");
					$songQueue.removeClass("matchesRecentlyPlayedSongTitle");
					TFMEX.songlog = info.room.metadata.songlog;
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
			} catch(e) {}
		},
		attachListeners = function() {
			var numMessageListeners = 0,
				numSoundstartListeners = 0;
			// console.log("in attachListeners");
			cleanUp();
	        var intervalID = window.setInterval(function() {
				// console.log("window.turntable.eventListeners.message.length", window.turntable.eventListeners.message.length);
	            if(window.turntable.eventListeners.message.length) {
					// console.log("attaching listeners");
					getRoomInfo();
					
					for(var eventListener in window.turntable.eventListeners.message) {
						if(window.turntable.eventListeners.message[eventListener] && window.turntable.eventListeners.message[eventListener].toString() !== undefined) {
							numMessageListeners += 1;
						}
					}
					for(var eventListener in window.turntable.eventListeners.soundstart) {
						if(window.turntable.eventListeners.soundstart[eventListener] && window.turntable.eventListeners.soundstart[eventListener].toString() !== undefined) {
							numSoundstartListeners += 1;
						}
					}
					if(!numMessageListeners) {
	                	window.turntable.addEventListener("message", extensionEventListener);
					}
					if(!numSoundstartListeners) {
	                	window.turntable.addEventListener("soundstart", extensionEventListener);
					}
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
						cleanUp();
						$.when(getTurntableObjects()).then(whenTurntableObjectsReady);
					}
					lastRoomUrl = window.location.href;
				}
				if(TFMEX.roomInfo.currentSong) {
					songMetadata = TFMEX.roomInfo.currentSong.metadata;
				    if(songMetadata.song !== lastSongMetadata.song && songMetadata.artist !== lastSongMetadata.artist) {
						// console.log("Found a change!");
						lastSongMetadata = songMetadata;
						$("body").attr("data-current-song-obj", JSON.stringify(songMetadata));
						updateNowPlaying(songMetadata);
						populateSimilarSongs(songMetadata);
				    } else {
				        return;
				    }
				}
			} catch(e) {
				console.warn("Got an error whilst checking for changes: " + e)
			}
		},
		cleanUp = function() {
			// console.log(window.turntable.eventListeners);
			
			// Moved this logic to the attachListeners function
			/*
			for(var eventListener in window.turntable.eventListeners.message) {
				if(window.turntable.eventListeners.message[eventListener] && window.turntable.eventListeners.message[eventListener].toString() !== undefined) {
					// console.log("REMOVING:", window.turntable.eventListeners.message[eventListener]);
					window.turntable.eventListeners.message.splice(eventListener, 1);
				}
			}
			for(var eventListener in window.turntable.eventListeners.soundstart) {
				if(window.turntable.eventListeners.soundstart[eventListener] && window.turntable.eventListeners.soundstart[eventListener].toString() !== undefined) {
					// console.log("REMOVING:", window.turntable.eventListeners.soundstart[eventListener]);
					window.turntable.eventListeners.soundstart.splice(eventListener, 1);
				}
			}
			*/
			// console.log(window.turntable.eventListeners);
			updatePrefs();
		},
		updatePrefs = function() {
			// console.log("TFMEX.prefs", TFMEX.prefs);
			preferenceSettings = localStorage.getItem("TFMEX");
			if(preferenceSettings) {
			    preferenceSettings = JSON.parse(preferenceSettings);
			    $.extend(TFMEX.prefs, preferenceSettings);
			    preferenceSettings = TFMEX.prefs;
			} else {
			    preferenceSettings = TFMEX.prefs;
			}
		    // TFMEX.prefs = preferenceSettings;
			// console.log(TFMEX.prefs);
		},
	    showPrefs = function() {
	        var preferencesContent = "",
	            preferenceSettings = {},
	            currentVote = null;

		    preferencesContent += '<div class="flR">';
			preferencesContent += '<h3>Current Users:</h3>';
			preferencesContent += '<ul class="currentUserList"></ul></div>';

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
	        preferencesContent += '</dl>';

	        if(TFMEX.votelog.length === 0 && typeof(TFMEX.roomInfo.upvoters) !== "undefined" && TFMEX.roomInfo.upvoters.length > 0) {
	            for (var upvoter in TFMEX.roomInfo.upvoters) {
	                if (TFMEX.roomInfo.upvoters.hasOwnProperty(upvoter)) {
	                    TFMEX.votelog.push([TFMEX.roomInfo.upvoters[upvoter], "up"]);
	                }
	            }
	        }
	        preferencesContent += '<ul class="currentSongVotes clL">';
			var currentVoteUserName = null;
	        for (var vote in TFMEX.votelog) {
				currentVoteUserName = "";
	            if (TFMEX.votelog.hasOwnProperty(vote)) {
	                currentVote = TFMEX.votelog[vote];
	                try {
	                    currentVoteUserName = TFMEX.roomInfo.users[currentVote[0]].name;
	                } catch(e) { };
					if(currentVoteUserName !== "") {
			            preferencesContent += "<li>";
						preferencesContent += currentVoteUserName;
		                preferencesContent += " voted: " + voteMap[currentVote[1]];
		                preferencesContent += "</li>";
					}
	            }
	        }
	        preferencesContent += '</ul>';
	        preferencesContent += '<div class="clB">&nbsp;</div>';
	        $("#tfmExtended .preferences").html(preferencesContent);
	        $("#tfmExtended .preferences").removeClass("hidden");
	
			updatePrefs();

	        for (var prefName in TFMEX.prefs) {
	            if (TFMEX.prefs.hasOwnProperty(prefName)) {
	                $('#tfmExtended input[data-tfmex-pref=' + prefName + ']')
	                    .attr('checked', TFMEX.prefs[prefName])
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
			updateUserList();
	    },
	    hidePrefs = function() {
	        $("#tfmExtended .preferences").addClass("hidden");
	    },
	    desktopAlert = function(notificationObj) {
			// console.log("desktopAlert", notificationObj.title + " | " + notificationObj.body);
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
			if(songObj.artist !== lastPlayedSong.artist && songObj.song !== lastPlayedSong.song) {
				lastPlayedSong = songObj;
				songToMatch.metadata = songObj;
				// console.log("updateNowPlaying: ", songObj);

		        TFMEX.votelog = [];

				try {
		    		highlightMatchingTracks(songToMatch, $("#right-panel .songlist .song"));
		            if(TFMEX.prefs.showSong) {
		    			// console.log("About to show song: ", songObj);
		    			setTimeout(function() {
		    				// console.log("Show Song: ", songMetadata);
		    				var title = TFMEX.roomInfo.users[TFMEX.roomInfo.currentDj].name + " is spinning:",
		                        coverArt = songObj.coverart?songObj.coverart:"",
		                        body = songObj.artist + " - " + songObj.song;
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

		    	} catch(e) { 
		    	    console.error("updateNowPlaying error: " + e.message);
		    	}

		        if(lfmSessionToken) {
		            try {
		                // console.log("songMetadata", songObj);
		                // console.log("lfm token:", lfmSessionToken);
		                // console.log("sendRequest- nowPlaying", songObj, lfmSessionToken);

		                // chrome.extension.sendRequest({method: "nowPlaying",trackObj: songObj, session_token: lfmSessionToken});
		            } catch(e) { console.error(e.message); }
		        }/* else {
		            console.log("no lfm session, retry");
		            window.setTimeout(function() { updateNowPlaying(songObj); }, 250);
		        }*/
			}
	    },
		updateUserList = function() {
			var userList = "",
				currentUser = {};
	        for (var user in TFMEX.roomInfo.users) {
	            if (TFMEX.roomInfo.users.hasOwnProperty(user)) {
					currentUser = TFMEX.roomInfo.users[user];
					userList += '<li><a href="http://facebook.com/profile.php?id=' + currentUser['fbid'] + '" target="_blank">' + currentUser['name'] + "</a>";
	            }
	        }	
			$('#tfmExtended .preferences .currentUserList').html(userList);
		},
		populateSimilarSongs = function(songMetadata) {
		    var title = songMetadata.song
		    var artist = songMetadata.artist
			var customEvent = document.createEvent('Event');
			customEvent.initEvent('tt-ext-new-song-event', true, true);
			document.getElementById('tt-ext-mpd').dispatchEvent(customEvent)
		},
		getSendMessageFunction = function() {
			var messageFunctionName = $('body').data('tt-ext-messageFunctionName')
			if (!messageFunctionName) {
				messageFunctionName = turntable.randomRoom.toString().match(/(turntable\.)([^(]+)(\(\{api:)/)[2];
				$('body').data('tt-ext-messageFunctionName',messageFunctionName)
			}
		    var messageFunc = eval("turntable." + messageFunctionName)
			return messageFunc
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
						if(currentVote[0] === TFMEX.roommanager.myuserid) {
							if(currentVote[1] == "down") {
								$("body").attr("data-cancel-scrobble", true);
							} else {
								$("body").attr("data-cancel-scrobble", false);
							}
						}
	                    try {
	                        if(TFMEX.prefs.showVote) {
	                            desktopAlert({
	                                title: TFMEX.roomInfo.users[currentVote[0]].name + " voted: ",
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
		extensionEventListener.prototype.TFMEXListener = true;
	} catch(e) { console.error(e); }

	try {
		attachListeners();
		/*
	    $(window).bind("popstate", function (b) {
	        cleanUp();
	        attachListeners();
	    });
	    $(window).bind("pushstate", function (b) {
	        cleanUp();
	        attachListeners();
	    });
		*/
	} catch(e) { console.error(e.message); }
	};
	$.when(getTurntableObjects()).then(whenTurntableObjectsReady);
});
function setupLive(){
    // console.log('setup');
	$('.setEnableScrobbling').live('click', function(evt) {
		// console.log(evt);
		evt.preventDefault();
		TFMEX.$body.attr("data-enable-scrobbling", true);
	});
}
