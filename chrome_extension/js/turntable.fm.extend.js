TFMEX = {};
console.log('TFMEX')

/*
  turntable.fm extend
  
  Developed by:
    Mark Reeder http://twitter.com/Mark_Reeder, http://github.com/MarkReeder
    Adam Creeger http://twitter.com/Creeger, http://github.com/acreeger
*/

TFMEX.$body = $("body");
TFMEX.prefs = {
    "showChat": false,
    "filteredChat": false,
    "chatFilters": [],
    "showSong": true,
    "showVote": true,
    "showDJChanges": false,
    "showListenerChanges": false,
	"enableScrobbling":false,
    "messageTimeout": 10000,
    "eventDistance": 50
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

TFMEX.performMigrations = function() {
	var manifestVersion = $('body').attr('tt-ext-manifest-version') //populated by contentscript
	var lastRunVersion = localStorage.lastRunVersion

	if (typeof(lastRunVersion) === "undefined" || lastRunVersion == null) {
		//either first time install or first time since we started doing migrations
		console.log("Running First Migration")

		var tree = ["div.tt-ext-welcome-message", ["h2","Thanks for installing Turntable Extended!"],["p","Be sure to play around with the new options in the settings menu, as well as the song suggestions link above your DJ Queue."]]
		turntable.showAlert(tree)

		if (localStorage['lastfm-session-token']) {
			//if lastfm is configured, enable scrobbling by default
			console.log("performMigrations: enabling scrobbling")
			try {
                var prefs = JSON.parse(localStorage.TFMEX)
                prefs.enableScrobbling = true
                localStorage.TFMEX = JSON.stringify(prefs)
            } catch (ex) {console.warn("Error occurred whilst enabling scrobbling.",ex.stack)}
		}
	}
	
	localStorage.lastRunVersion = manifestVersion
}

TFMEX.votelog = [];
TFMEX.heartlog = [];
TFMEX.notificationQueue = [];
TFMEX.songTags = {};
TFMEX.tagSongs = {};
TFMEX.autoTagsInitialized = false;
TFMEX.bitrateSongs = {};
TFMEX.genreSongs = {};
TFMEX.lastUserAction = {};
TFMEX.djSongCount = {};

TFMEX.showOverlay = function (tree){
	turntable.showAlert(tree);
}

TFMEX.suggestionsOverlayView = function() {
	return [
		"div.suggestionsOverlay.tt-ext-ui",
		{
			style: {
				width:"590px",
				"padding-left":0,
				"padding-right":0,
				"padding-bottom":0			 
			}
		},
		[
			"h2",
			"Some Suggestions For You"
		],
		[
			"p",
			"Similar to..."
		],
		[
			"div#tt-ext-suggestion-tabs",
			[ "ul",["li",["a",{href:"#tt-ext-suggestion-tabs-0"},"...the current track"]],["li",["a",{href:"#tt-ext-suggestion-tabs-1"},"...this room's most popular tracks"]]],
			[
				"div#tt-ext-suggestion-tabs-0##similarToCurrentSong.tt-ext-suggested-songs"
			],
			[
				"div#tt-ext-suggestion-tabs-1##similarToSongLog.tt-ext-suggested-songs"
			]
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
				"Search for this artist"
			]
		]
	]	 
}

TFMEX.settingsItemView = function (itemLabel,clickHandler,elementId) {	
	return $("#" + elementId).length > 0 ? null : [
		"li#" + elementId + ".option",
		{
			event: {
				click: clickHandler
			}
		},
		itemLabel
	];
}

TFMEX.preferencesView = function(cancelEvent,saveEvent) {
	return [
		"div.tt-ext-preferences",
		{
			
		},
		[
			"h2",
			"Extension Settings"
		],
		[
			"div.tt-ext-pref-section",
			["h3.tt-ext-pref-header","Notifications"],
			[
				"dl.tt-ext-pref-body",
				[
					"dt","Chat Messages?",["br"]
				],
				[
					"dd",["input#showChat",{type:"checkbox","data-tfmex-pref":"showChat",value:1}]
				],
				[
					"dt","Filter Chat Messages?",["br"]
				],
				[
					"dd",["input#filteredChat",{type:"checkbox","data-tfmex-pref":"filteredChat",value:1}]
				],
				[
					"div",["input#chatFiltersValue",{type:"text","data-tfmex-pref":"chatFilters",value:""}]
				],
				[
					"dt","Song Messages?"
				],
				[
					"dd",["input#showSong",{type:"checkbox","data-tfmex-pref":"showSong",value:1}]
				],
				[
					"dt","Vote Messages?"
				],
				[
					"dd",["input#showVote",{type:"checkbox","data-tfmex-pref":"showVote",value:1}]
				],			
				[
					"dt","DJ Changes?"
				],
				[
					"dd",["input#showDJChanges",{type:"checkbox","data-tfmex-pref":"showDJChanges",value:1}]
				],			
				[
					"dt","Listener Changes?"
				],
				[
					"dd",["input#showListenerChanges",{type:"checkbox","data-tfmex-pref":"showListenerChanges",value:1}]
				]			
			]			
		],["div.clB"],
		[
			"div.tt-ext-pref-section",
				["h3.tt-ext-pref-header","Last.fm"],["dl.tt-ext-pref-body",
					[
						"dt","Enable scrobbling?"
					],
					[
						"dd",["input#tt-ext-enable-scrobbling",{type:"checkbox","data-tfmex-pref":"enableScrobbling",value:1}]
					]
				]
		],["div.clB"],
		[
			"div.tt-ext-pref-section",
				["button.save-changes.centered-button",{event:{click:saveEvent}},"Save Preferences"]
		]
	]
}



TFMEX.exportView = function(cancelEvent) {
	return [
		"div.tt-ext-export",
		{
			
		},
		[
			"h2",
			"Export XSPF"
		],
		[
			"div.tt-ext-export-section",
			[
			    "a",{id:"tt-ex-export-queue"},"Export your song queue"
			],
			["br"],
			[
			    "a",{id:"tt-ex-export-recent"},"Export songs recently played in this room"
			],
    		["br"],
			[
			    "textarea",{id:"tt-ex-export"}
			],
			["br"],
			[
			    "input",{type:"text",id:"tt-ex-export-filename",value:"turntable_songs.xspf"}
			],
			[
			    "input",{type:"button",id:"tt-ex-export-save",value:"SAVE"}
			]
		]
	]
}

TFMEX.roomUsersView = function() {
	return [
		"div.roomUsersOverlay",
		{
			style: {
				width:"600px",
				"padding-left":0,
				"padding-right":0,
				"padding-bottom":0			 
			}
		},
		[
			"h2",
			"In the room, we have..."
		],
		[
			"div.tt-ext-room-users",["div##users"]
		]
	]
}

TFMEX.roomUserView = function(user) {
	var userLink = null,
		userVote = [],
		userVoteText = "",
		returnObj = null,
		userIsSelf = user.userid === TFMEX.user.id,
	    userIsMod = false,
	    userIsCreator = user.userid === TFMEX.roomInfo.creatorId,
	    userIsSuper = user.acl === 1,
	    userIsOnDeckPosition = jQuery.inArray(user.userid, TFMEX.room.djIds),
	    fanOf = user.fanof,
	    divTag = "div.tt-ext-room-user",
	    userNameSpan = [],
	    auxSpan = [],
	    memberSince = "Member since: ",
	    now = new Date(),
	    newDate = new Date(),
	    idleMessage = "",
	    songCountMessage = "",
	    playCount = 0;
	userIsMod = jQuery.inArray(user.userid, TFMEX.roommanager.roomData.metadata.moderator_id) > -1;
	if (userIsMod || userIsCreator) divTag += ".tt-ext-room-mod";    
	if (userIsSuper) divTag += ".tt-ext-super-user";
	returnObj = [
		divTag
	];
    newDate.setTime( user.created * 1000 );
    dateString = newDate.toDateString();
    memberSince += dateString;
	userNameSpan = ["span.tt-ext-user-name.tt-ext-cell",["a",{href:"javascript:TFMEX.showUserProfile('" + user.userid + "')",title:memberSince},user.name]];
	
	if(TFMEX.userVotes[user.userid]) {
	    if(TFMEX.userVotes[user.userid] === "up") {
    	    userNameSpan.push(["span.vote.upVote"]);
	    } else {
    	    userNameSpan.push(["span.vote.downVote"]);
	    }
	}

	if(TFMEX.heartlog.indexOf(user.userid) > -1) {
	    userNameSpan.push(["span.heart"]);
	}

	if (userIsCreator) {
	    userNameSpan.push("(Creator)");
	} else if (userIsMod) {
		userNameSpan.push("(Mod)");
	}
	if(userIsSuper) {
	    userNameSpan.push("(Super)");
	}
	var secondsToHms = function(d) {
    	d = Number(d);
    	var h = Math.floor(d / 3600);
    	var m = Math.floor(d % 3600 / 60);
    	var s = Math.floor(d % 3600 % 60);
    	return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
    };
	if(userIsOnDeckPosition > -1) {
        try {
            // idleMessage = " - idle: " + secondsToHms(((now.getTime() - TFMEX.lastUserAction[user.userid].getTime()) / 1000).toFixed(0));
        } catch(e) { console.log(e.message) }
        try {
            if(TFMEX.djSongCount[user.userid]) {
                playCount = TFMEX.djSongCount[user.userid];
            }
            songCountMessage = " - played " + playCount;
        } catch(e) { console.log(e.message) }
	    userNameSpan.push("(DJ" + songCountMessage + idleMessage +")");
	}
	auxSpan = ["span.tt-ext-cell.tt-ext-aux-links",["a.icon.ttDashboard",{href:'http://ttstats.info/user/' + user.userid,target: "_blank",title:'on TTStats'},""]];
	if(!userIsSelf) {
    	if(fanOf) {
    	    auxSpan.push(["a.icon.fan.evtToggleFan",{title:"Unfan",'data-userid':user.userid,href:"javascript:"},""]);
    	} else {
        	auxSpan.push(["a.icon.fan.notFan.evtToggleFan",{title:"Become a Fan",'data-userid':user.userid,href:"javascript:"},""]);
    	}
    	if(TFMEX.room.isMod(TFMEX.roomInfo.selfId)) {
        	auxSpan.push(["a.icon.evtBootUser.bootUser",{'data-userid':user.userid,href:"javascript:",title:'Boot User'},""]);
    	}
	}
	returnObj.push(userNameSpan);
    returnObj.push(auxSpan);
	return returnObj;
}

TFMEX.bootUser = function(element) {
    var $element = $(element);
    TFMEX.roommanager.callback('boot_user', $element.data("userid"));
    $element.closest('.tt-ext-room-user').hide('slow', function(evt) {
        $(evt.target).remove();
    });
}

TFMEX.toggleFan = function(element) {
    var $element = $(element);
    if($element.hasClass("notFan")) {
        TFMEX.roommanager.callback('become_fan', $element.data("userid"));
        $element.removeClass("notFan");
        $element.attr('title','Unfan');
    } else {
        TFMEX.roommanager.callback('remove_fan', $element.data("userid"));
        $element.addClass("notFan");
        $element.attr('title','Become a Fan');
    }
}

TFMEX.addSong = function(songId, songMetadata) {
    // songId = TFMEX.songlog[0]._id
    // metadata = TFMEX.songlog[0].metadata
    turntable.playlist.addSong({
        fileId: songId,
        metadata: songMetadata
    });
}

TFMEX.metadataDisplay = function(song) {
    var metadata = song.metadata,
        displayLength = function(length) {
            var mm = Math.floor(length/60),
                ss = length%60;
            if(ss < 10) {
                ss = '0' + ss;
            }
            return mm + ':' + ss;
        }
	return [
		"div.tt-ext-song-tag.tt-ext-new-song-tag",
		{
		},
		[
			"div.input-box.song-metadata",
			{
			    "data-file-id":song.fileId
			},
			[
			    "span.label",
			    {},
			    "Artist:"
			],
			[
				"span#song-metadata-artist-value.value",
				{},
				metadata.artist
			],
			[
			    "span.label",
			    {},
			    "Song:"
			],
			[
    			"span#song-metadata-song-value.value",
    			{},
    			metadata.song
			],
			[
			    "span.label",
			    {},
			    "Album:"
			],
			[
    			"span#song-metadata-album-value.value",
    			{},
    			metadata.album
			],
			[
			    "span.label",
			    {},
			    "Genre:"
			],
			[
    			"span#song-metadata-genre-value.value",
    			{},
    			metadata.genre
			],
			[
			    "span.label",
			    {},
			    "Bitrate:"
			],
			[
    			"span#song-metadata-bitrate-value.value",
    			{},
    			metadata.bitrate
			],
			[
			    "span.label",
			    {},
			    "Length:"
			],
			[
    			"span#song-metadata-length-value.value",
    			{},
    			displayLength(metadata.length)
			],
			[
			    "br"
			]
		]
	]
}

TFMEX.showUserProfile = function(userId) {
	TFMEX.roommanager.callback('profile',userId);
	turntable.hideOverlay();
}

TFMEX.getXSPF = function(songArray, playlistTitle) {
    var XSPF = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    XSPF += '<playlist version="1" xmlns="http://xspf.org/ns/0/">\n';
    XSPF += '<title>Exported from Turntable.fm</title>\n';
    
    XSPF += '<trackList>\n';
    $.each(songArray, function(index, value) {
        XSPF += '<track>';
        XSPF += '<creator>' + $('<div/>').text(this.metadata.artist).html() + '</creator>';
        XSPF += '<title>' + $('<div/>').text(this.metadata.song).html() + '</title>';
        if(this.metadata.album) {
            XSPF += '<album>' + $('<div/>').text(this.metadata.album).html() + '</album>';
        }
        if(this.metadata.coverart) {
            XSPF += '<image>' + this.metadata.coverart + '</image>';
            
        }
        XSPF += '<duration>' + this.metadata.length * 1000 + '</duration>';
        XSPF += '</track>\n';
    });
    XSPF += '</trackList>\n';
    
    XSPF += '</playlist>';
    
    return XSPF;
}

TFMEX.turnAway = function(layers) {
    // console.log("turnAway", layers);
    $(layers.headback).css('display', 'none');
    $(layers.headfront).css('display', 'block');
    $(layers.headfront).css('top', 0);
}

TFMEX.turnToward = function(layers) {
    // console.log("turnToward", layers);
    $(layers.headback).css('display', 'block');
    $(layers.headfront).css('display', 'none');
    $(layers.headfront).css('top', 0);
}

$(document).ready(function() {
	var tKeysLength = Object.keys(turntable).length,
		lastPlayedSong = {},
		tagIconsAdded = false;
	TFMEX.room = null;
	TFMEX.user = null;
	TFMEX.roommanager = null;
	TFMEX.geo = {};
	var getTurntableObjects = function(){
		TFMEX.room = null;
		TFMEX.user = null;
		TFMEX.roommanager = null;
	    var dfd = $.Deferred(),
			resolveWhenReady = function() {
			if(window.location.pathname !== "/") {
				// console.log("attempting to resolve");
				// console.log(Object.keys(turntable).length, tKeysLength);
				// console.dir(turntable);
				TFMEX.user = turntable.user;
				for(var o in turntable) {
					if(turntable[o] !== null) {
						for(var o2 in turntable[o]) {
							if(turntable[o][o2] !== null) {
								if(o2 == 'roomInfoHandler') {
									// console.log("currentDj found in: ", o);
									TFMEX.room = turntable[o];
									break;
								}
							}
						}
					}
				}

				if(TFMEX.room && TFMEX.user) {
					TFMEX.roommanager = window.ROOMMANAGER;
					if(TFMEX.roommanager) {
					    dfd.resolve();
					} else {
    					setTimeout(function(){
    						resolveWhenReady();
    					}, 250);
					}
				} else {
					setTimeout(function(){
						resolveWhenReady();
					}, 250);
				}
			} else {
				setTimeout(function(){
					resolveWhenReady();
				}, 250);
			}
		};	
		resolveWhenReady();

	    return dfd.promise();
	}
	var whenTurntableObjectsReady = function(fromRoomChange) {
		localStorage.removeItem("disableTFMEX");
		var now = new Date();
		/*
		console.log("success!");
		console.log(TFMEX.room);
		console.log(TFMEX.user);
		console.log("TFMEX.roommanager", TFMEX.roommanager);
		*/
		
		try {
	    // $("script[href$='turntable.fm.extend.dev.js']").remove();
		// $(window).bind('beforeunload', TFMEX.clearNotifications);
	    
        if (!fromRoomChange) {
			TFMEX.performMigrations()
			$("#tfmExtendedWrap").remove();
			TFMEX.$body.append('<div id="tfmExtendedWrap"><div id="tfmExtended"><div class="settings"><div class="preferences hidden"></div></div></div></div>');

			var customMenuItems = [
				// { name:"Room users", callback: function(){ showRoomUsers() }, elementId:"tt-ext-room-users-menu-item"},
				{ name:"Extension settings", callback: function(){ showPrefs() }, elementId:"tt-ext-settings-menu-item"},
				{ name:"Export XSPF", callback: function(){ showExport() }, elementId:"tt-ext-export-menu-item"}
			]

			$.each(customMenuItems,function (i,menuItem) {
				var pos = $('#settings .dropdown .option.link').length - 1;
				// console.log(pos);
				var tree = TFMEX.settingsItemView(menuItem.name,menuItem.callback,menuItem.elementId);
				if (tree) {
					// console.log("Creating menu item",menuItem.name,"with tree",tree)
					$("#settings .dropdown .option:eq(" + pos + ")").before(util.buildTree(tree))
				}
			});
			
			$('#tt-ext-mpd')[0].addEventListener('tt-ext-process-similar-songs',function () {
				/*
				//var similarSongs = $('body').data('similarSongs')
				var allSimilarSongs = JSON.parse($('body').attr('tt-ext-similar-songs'))
				//console.debug("allSimilarSongs:",allSimilarSongs)
				var similarToCurrentSong = allSimilarSongs.similarToCurrentSong
				var similarToSongLog = allSimilarSongs.similarToSongLog
				$('#tt-ext-suggestions-link').fadeIn(500)
				if (similarToSongLog.length > 0 || similarToCurrentSong.length > 0) {
					// console.log("Found",similarToCurrentSong.length,"similar songs.")
					$('#tt-ext-suggestions-link').removeClass("tt-ext-link-disabled")
					$('#tt-ext-suggestions-link').attr("title","View suggestions from last.fm")
				} else {
					// console.log("No related songs available for",songMetadata.artist,". Disabling suggestions link.")
					$('#tt-ext-suggestions-link').addClass("tt-ext-link-disabled")
					$('#tt-ext-suggestions-link').attr("title","Sorry, no suggestions are available.")
				}
			 	*/
			});
			$('#tt-ext-mpd')[0].addEventListener('tt-ext-process-remote-song-tags', function() {
			    console.log('remote tags', $('#tt-ext-mpd').first().attr('data-song-tags-remote'));
			});
			$('#tt-ext-suggestions-link').live('click', function() {
					//$('#tt-ext-suggestions-box').dialog()
				var allSimilarSongs = JSON.parse($('body').attr('tt-ext-similar-songs'))
				var similarToCurrentSong = allSimilarSongs.similarToCurrentSong
				var similarToSongLog = allSimilarSongs.similarToSongLog
//				var arrayToUse = similarToSongLog, source = "based on this room's most popular tracks"
//				if (!similarToSongLog || similarToSongLog.length == 0) {
//					arrayToUse = similarToCurrentSong;
//					source = "based on the current song"
//				}
				if (similarToSongLog.length > 0 || similarToCurrentSong.length > 0) {
					var containers = {}
					var suggestionsMarkup = util.buildTree(TFMEX.suggestionsOverlayView(),containers)

					var arraysToUse = [{containerName: "similarToCurrentSong",contents: similarToCurrentSong},
									   {containerName: "similarToSongLog",contents: similarToSongLog}]

					$.each(arraysToUse,function() {
						var songContainer = containers[this.containerName];
						$.each(this.contents,function() {
							var tree = TFMEX.suggestedSongView(this)
							var songMarkup = util.buildTree(tree)
							$(songContainer).append(songMarkup)
						});
					});

					var tabOptions = { disabled: [] }
					//TODO: This order is specific, and is too tightly bound to the TFMEX.suggestionsOverlayView() function.
					$.each([similarToCurrentSong,similarToSongLog], function(i) {
						if (this.length == 0) tabOptions.disabled.push(i)
					});

					//we select the tab with the largest number of entries so that the layout is correct.
					var indexOfLongestTab = similarToCurrentSong.length >= similarToSongLog.length ? 0 : 1
					tabOptions.selected = indexOfLongestTab
					var $tabs = $(suggestionsMarkup).find("#tt-ext-suggestion-tabs").tabs(tabOptions)

					//then show the overlay, which does the layout calculations
					TFMEX.showOverlay(suggestionsMarkup)

					//then we flip back to the first tab, unless its disabled.
					var firstTabDisabled = tabOptions.disabled.indexOf(0) != -1
					if (!firstTabDisabled) {
						$tabs.tabs("select",0)
					}
				}
			});
			$('.tt-ext-suggested-song .tt-ext-search-link').live('click', function(evt) {
					var $searchBox = $('form.input.songSearch input')
					if ($searchBox.length == 0) {
						console.warn("Couldn't find search box")
					}
					else {
						$searchBox.val($(evt.target).data('query'))
						$('form.input.songSearch').trigger('submit')
						turntable.hideOverlay()
					}

			});
			$('.evtToggleFan').live('click', function(evt) {
			   TFMEX.toggleFan($(evt.target)) ;
			});
   			$('.evtBootUser').live('click', function(evt) {
   			   TFMEX.bootUser($(evt.target)) ;
   			});
		}
		
		TFMEX.lastUserAction = {};
        $.each(TFMEX.room.users, function(userId, value) {
            TFMEX.lastUserAction[userId] = now;
        });
        
		$("*").undelegate(".TFMEX")
		
		
		$('#songs').on('hover', '.song', function() {
		    
	    });

		$('document').keypress(function(evt) {
			if (evt.keyCode === 27) {
				evt.preventDefault();
				$('#overlay .close-x').click();
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
		if (!fromRoomChange) {
			untrickify(window.turntable);
			enableDesktopNotifications();
		}
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
		// highlightMatchingTracks = function(songToMatch, $songQueue) {
		// 	var normalizeText = function(incomingText) {
		// 		var parsedText, alphaNumericText;
		//
		// 		parsedText = incomingText.toLowerCase();
		// 		alphaNumericText = parsedText.replace(/[^a-zA-Z 0-9]+/g,'');
		// 		if(alphaNumericText === "") {
		// 			return parsedText;
		// 		} else {
		// 			return alphaNumericText;
		// 		}
		// 	}
		// 	try {
		// 		for(j in turntable.playlist.songsByFid) {
		// 			playlistSong = turntable.playlist.songsByFid[j];
		// 			if(songToMatch._id === playlistSong.fileId ||
		// 				(normalizeText(songToMatch.metadata.artist) === normalizeText(playlistSong.metadata.artist)
		// 				 && normalizeText(songToMatch.metadata.song) === normalizeText(playlistSong.metadata.song))) {
		// 				$($songQueue[j]).addClass("matchesRecentlyPlayedExactly");
		// 			} else if(normalizeText(songToMatch.metadata.artist) === normalizeText(playlistSong.metadata.artist)) {
		// 				$($songQueue[j]).addClass("matchesRecentlyPlayedArtist");
		// 			} else if(normalizeText(songToMatch.metadata.song) === normalizeText(playlistSong.metadata.song)) {
		// 				$($songQueue[j]).addClass("matchesRecentlyPlayedSongTitle");
		// 			}
		// 		}
		// 	} catch(e) { console.error("error highlighting tracks", e.stack); }
		// },
		getSongTagsFromLastFm = function() {
			var i = 0,
				song = {};
			$('#tfmExtended .tag-list').html("Loading tags from last.fm, please be patient...");
			for(i in turntable.playlist.songsByFid) {
				try {
					song = turntable.playlist.songsByFid[i];
					// console.log("TFMEX.songTags[song.fileId]", TFMEX.songTags[song.fileId]);
					if(typeof(TFMEX.songTags[song.fileId]) === "undefined") {
						$("body").attr("data-temp-song-obj", JSON.stringify(song));
						dispatchEventToContentScript('tt-ext-get-song-tags');
					}
				} catch(e) {console.error("error getting song tags", e.stack);}
			}
		},
		getRoomInfo = function() {
			// console.log("in getRoomInfo()");
			var messageFunc = getSendMessageFunction()
			try {
				// console.log("messageFunctionName", messageFunctionName);

				messageFunc({
					api: "room.info",
					roomid: TFMEX.room.roomId
				}, function(info){
					//console.debug("Got room.info with songlog",info.room.metadata.songlog)
					var song, $songQueue;
					$songQueue = $("#right-panel .songlist .song");
					$songQueue.removeClass("matchesRecentlyPlayedExactly");
					$songQueue.removeClass("matchesRecentlyPlayedArtist");
					$songQueue.removeClass("matchesRecentlyPlayedSongTitle");
					TFMEX.songlog = info.room.metadata.songlog;
					for(var i in info.room.metadata.songlog) {
						song = info.room.metadata.songlog[i];
						// highlightMatchingTracks(song, $songQueue);
						/* Log these into a local indexedDB
						startTime = song.starttime;
						delete song.starttime;
						*/
						// console.log(startTime, song);
					}    
					if (TFMEX.songlog) {
						//console.debug("Setting data-current-song-log to",TFMEX.songlog,new Error().stack)
						TFMEX.$body.attr("data-current-song-log",JSON.stringify(TFMEX.songlog))
					} else {
						TFMEX.$body.attr("data-current-song-log","[]")
					}
					raiseNewRoomInfoEvent();
					TFMEX.$body.trigger("ttfm-got-room-info")
				});
			} catch(e) {console.error("Exception occured in getRoomInfo",e.stack)}
		},
		attachListeners = function() {
			var numMessageListeners = 0;
			// numSoundstartListeners = 0;
			// console.error("in attachListeners");
			updatePrefs();
	        var intervalID = window.setInterval(function() {
				// console.log("window.turntable.eventListeners.message.length", window.turntable.eventListeners.message.length);
	            if(window.turntable.eventListeners.message.length) {
					// console.log("attaching listeners");
					getRoomInfo();
					
					for(var eventListener in window.turntable.eventListeners.message) {
						if(window.turntable.eventListeners.message[eventListener] && window.turntable.eventListeners.message[eventListener].toString() !== undefined) {
							console.log(window.turntable.eventListeners.message[eventListener].toString())
							numMessageListeners += 1;
						}
					}
					/*
					for(var eventListener in window.turntable.eventListeners.soundstart) {
						if(window.turntable.eventListeners.soundstart[eventListener] && window.turntable.eventListeners.soundstart[eventListener].toString() !== undefined) {
							numSoundstartListeners += 1;
						}
					}
					*/
					window.turntable.addEventListener("message", extensionEventListener);
					/*
					if(!numSoundstartListeners) {
	                	window.turntable.addEventListener("soundstart", extensionEventListener);
					}
					*/
	                window.clearInterval(intervalID);
					if (!TFMEX.checkForChangeIntervalID) {
						TFMEX.checkForChangeIntervalID = setInterval(checkForChange,1000);
					}
	            }
	        }, 250);
		},
		checkForChange = function() {
			var tempSongMetadata = null,
				i = 0;
				// $songTags = $('#tfmExtended .tags div');
			try {
				lastSongMetadata = songMetadata;

				var updateCurrentSongAndDispatchEvents;
				var boundHandler = function() {updateCurrentSongAndDispatchEvents(true)};
				var needToUpdateCurrentSongAndDispatchEvents = true

				// the new song gets picked up before the room change!
				updateCurrentSongAndDispatchEvents = function(fromRoomChange) {
					//console.debug("In updateCurrentSongAndDispatchEvents. fromRoomChange:",fromRoomChange)
					if (fromRoomChange) {
						TFMEX.$body.unbind("ttfm-got-room-info",boundHandler)
						// console.debug("Unbound the ttfm-got-room-info handler")
					}
					if(TFMEX.room && TFMEX.room.currentSong) {
						songMetadata = TFMEX.room.currentSong.metadata;
						if((songMetadata.song !== lastSongMetadata.song && songMetadata.artist !== lastSongMetadata.artist)) {
							// console.log("Found a change!");
							lastSongMetadata = songMetadata;
							TFMEX.$body.attr("data-current-song-obj", JSON.stringify(songMetadata));
							$('#tt-ext-suggestions-link').fadeOut(250)
							updateNowPlaying(songMetadata);
							// TFMEX.youtubePlayer.initialize()
							raiseNewSongEvent();
						}
					}
				};

				if(lastRoomUrl !== window.location.href) {
					if(lastRoomUrl !== "") {
						TFMEX.$body.bind("ttfm-got-room-info", boundHandler)
						//console.debug("setting needToUpdateCurrentSongAndDispatchEvents to false")
						needToUpdateCurrentSongAndDispatchEvents = false
						$.when(getTurntableObjects()).then(function() {whenTurntableObjectsReady(true)});
					}
					lastRoomUrl = window.location.href;
				}
				if (needToUpdateCurrentSongAndDispatchEvents) {
					// If needToXXXX is false, this will be fired in the event handler assigned above.
					updateCurrentSongAndDispatchEvents(false)
				}
			} catch(e) {
				console.warn("Got an error whilst checking for changes",e.stack)
			}
		},
		updatePrefs = function() {
			// console.log("TFMEX.prefs", TFMEX.prefs);
			var preferenceSettings = localStorage.getItem("TFMEX");
			if(preferenceSettings) {
			    preferenceSettings = JSON.parse(preferenceSettings);
			    $.extend(TFMEX.prefs, preferenceSettings);
			    preferenceSettings = TFMEX.prefs;
			} else {
			    preferenceSettings = TFMEX.prefs;
			}
			
			var lastFmToken = localStorage["lastfm-session-token"]
			if(!lastFmToken || lastFmToken === 'null') {
				TFMEX.prefs.enableScrobbling = false //this happens if the user cancels the auth
			}
			//save them back - this way any new defaults are saved
			localStorage.TFMEX = JSON.stringify(TFMEX.prefs);
		},
		showRoomUsers = function() {
			var containers = {},
			    markup = util.buildTree(TFMEX.roomUsersView(),containers),
			    $usersContainer = $(containers.users),
			    sortedUsers = [];
			TFMEX.userVotes = {};
			
			$.each(TFMEX.votelog, function(index, user) {
    			TFMEX.userVotes[this[0]] = this[1];
			});
			$.each(TFMEX.room.users, function(index, user) {
			    sortedUsers.push(user);
			});
			
			sortedUsers.sort(function(a,b) {
				var al=a.name.toLowerCase(),bl=b.name.toLowerCase();
			 	return al==bl?(a==b?0:a<b?-1:1):al<bl?-1:1;
			});
			$.each(sortedUsers,function(index, user) {
				var tree = TFMEX.roomUserView(user)
				var userMarkup = util.buildTree(tree)
				$usersContainer.append(userMarkup)
			})
			
			TFMEX.showOverlay(markup)
		}
		showExport = function() {
            var markup = util.buildTree(TFMEX.exportView(turntable.hideOverlay));

    		$("*").undelegate(".TFMEX_EXPORT")
            TFMEX.showOverlay(markup)
			$('#tt-ex-export-queue').on('click.TFMEX_EXPORT', function(evt) {
    			evt.preventDefault();
    			var xspfText = TFMEX.getXSPF(turntable.playlist.songsByFid);
    			$('#tt-ex-export').val(xspfText).select();
			});
			$('#tt-ex-export-recent').on('click.TFMEX_EXPORT', function(evt) {
			    evt.preventDefault();
    			$('#tt-ex-export').val(TFMEX.getXSPF(TFMEX.songlog)).select();
			});
			$('#tt-ex-export-save').on('click.TFMEX_EXPORT', function(evt) {
    			evt.preventDefault();
    			var blob = new Blob([$('#tt-ex-export').val()], {"type":"application/xspf+xml;charset=UTF-8"});
                saveAs(blob, $("#tt-ex-export-filename").val());
			});
		},
		showPrefs = function() {
			var markup = util.buildTree(TFMEX.preferencesView(turntable.hideOverlay,this.savePrefs))
			console.log({markup})
			var $markup = $(markup)
			
			updatePrefs();
						
			for (var prefName in TFMEX.prefs) {
	            if (TFMEX.prefs.hasOwnProperty(prefName)) {
	                $markup.find('input[data-tfmex-pref=' + prefName + ']')
	                    .prop('checked', TFMEX.prefs[prefName])
	            }
	        }
	        
	        $markup.find('#chatFiltersValue').val(TFMEX.prefs.chatFilters.join(","));
	        $markup.find('#tt-ext-event-distance').val(TFMEX.prefs.eventDistance);
			
			if (TFMEX.prefs["enableScrobbling"]) {
				$markup.find('#tt-ext-enable-scrobbling').prop("checked",true)
			}
			
			TFMEX.showOverlay(markup, this.savePrefs)
		},
		savePrefs = function() {
			console.log('savePrefs')
			var oldEnableScrobblingValue = TFMEX.prefs["enableScrobbling"]
			
			var prefsToSave = ["showChat","filteredChat","showSong","showVote","showDJChanges","showListenerChanges"],
			    prefValsToSave = ["chatFilters"],
			    prefSelectValsToSave = ["eventDistance"];
			for (var i in prefsToSave) {
				var prefName = prefsToSave[i]
	            if (TFMEX.prefs.hasOwnProperty(prefName)) {
					// console.debug("Processing pref",prefName)
					var chkBox = $('input[data-tfmex-pref=' + prefName + ']')
					var val = chkBox.is(':checked')
					// console.debug("Setting pref",prefName,"to",val)
					TFMEX.prefs[prefName] = val;
				}
	        }    
			for (var i in prefValsToSave) {
				var prefVal = prefValsToSave[i];
				//console.debug("prefVal:",prefVal);
	            if (TFMEX.prefs.hasOwnProperty(prefVal)) {
					var txtBox = $('input[data-tfmex-pref=' + prefVal + ']');
					    filters = [];
					if(txtBox) {
					    filters = txtBox.val().split(",");
					    $.each(filters, function(index, value) {
					        filters[index] = $.trim(value);
					    });
					}
					// console.debug("Setting pref",prefVal,"to",filters)
					TFMEX.prefs[prefVal] = filters;
				}
	        }
	        $.each(prefSelectValsToSave, function(i) {
	            var prefName = prefSelectValsToSave[i],
	                selectBox = $('select[data-tfmex-pref=' + prefName + ']');
	            TFMEX.prefs[prefName] = selectBox.val();
	        });
		
			var enableScrobbling = $('#tt-ext-enable-scrobbling').prop('checked')			
			$('.modal .buttons .submit').click();

			// console.log({oldEnableScrobblingValue, enableScrobbling})
			if (!oldEnableScrobblingValue && enableScrobbling) {
				turntable.showAlert("In order to enable last.fm scrobbling, you will now be taken to last.fm to authorize Turntable Extended to scrobble tracks on your behalf.", function() {
					//console.debug("savePrefs: User has selected to enable scrobbling, dispatching last.fm auth event")
					dispatchEventToContentScript('tt-ext-need-lastfm-auth');
				})
			}

			//console.debug("savePrefs: setting enable-scrobbling to:",enableScrobbling)
			TFMEX.prefs["enableScrobbling"] = enableScrobbling //gets into local storage
			
			localStorage.setItem("TFMEX", JSON.stringify(TFMEX.prefs));	
					
		},
	    showPrefsOld = function() {
	        var preferencesContent = "",
	            preferenceSettings = {},
	            currentVote = null;

		    preferencesContent += '<div class="flR">';
			preferencesContent += '<h3>Current Users:</h3>';
			preferencesContent += '<ul class="currentUserList"></ul></div>';

			if($("body").data('scrobbling-disabled')) {
				preferencesContent += '<a class="setEnableScrobbling">Click here to enable last.fm scrobbling.</a>';
			}
	        preferencesContent += '<dl class="flL">';
	        preferencesContent += '<dt>Show Chat Messages?<br />(Note: Disable the chat ding for this to work)</dt>';
	        preferencesContent += '<dd><input type="checkbox" id="showChat" data-tfmex-pref="showChat" value="1" /></dd>';
	        preferencesContent += '<dt>Show Song Change Messages?</dt>';
	        preferencesContent += '<dd><input type="checkbox" id="showSong" data-tfmex-pref="showSong" value="1" /></dd>';
	        preferencesContent += '<dt>Show Vote Messages?</dt>';
	        preferencesContent += '<dd><input type="checkbox" id="showVote" data-tfmex-pref="showVote" value="1" /></dd>';
	        preferencesContent += '<dt>Show DJ Changes?</dt>';
	        preferencesContent += '<dd><input type="checkbox" id="showDJChanges" data-tfmex-pref="showDJChanges" value="1" /></dd>';
	        preferencesContent += '<dt>Show Listener Changes?</dt>';
	        preferencesContent += '<dd><input type="checkbox" id="showListenerChanges" data-tfmex-pref="showListenerChanges" value="1" /></dd>';
	        preferencesContent += '</dl>';

	        if(TFMEX.votelog.length === 0 && typeof(TFMEX.room.upvoters) !== "undefined" && TFMEX.room.upvoters.length > 0) {
	            for (var upvoter in TFMEX.room.upvoters) {
	                if (TFMEX.room.upvoters.hasOwnProperty(upvoter)) {
	                    TFMEX.votelog.push([TFMEX.room.upvoters[upvoter], "up"]);
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
	                    currentVoteUserName = TFMEX.room.users[currentVote[0]].attributes.name;
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
	    desktopAlert = function(notificationObj) {
			console.log("desktopAlert", notificationObj.title + " | " + notificationObj.body);
			$('#tt-ext-mpd').first().attr('data-desktop-alert', JSON.stringify(notificationObj));
			dispatchEventToContentScript('tt-new-desktop-alert');
	    },
	    updateNowPlaying = function(songObj) {
			var	songToMatch = {};
			if(songObj.artist !== lastPlayedSong.artist && songObj.song !== lastPlayedSong.song) {
				lastPlayedSong = songObj;
				songToMatch.metadata = songObj;
				// console.log("updateNowPlaying: ", songObj);
				if(lastRoomUrl === window.location.href) {
				    /*
                    $.each(TFMEX.votelog, function() {
                        var layers = {};
                        // Reset turned away down voters
                        if(TFMEX.roommanager.listeners[this[0]] && TFMEX.roommanager.listeners[this[0]].layers) {
                            layers = TFMEX.roommanager.listeners[this[0]].layers;
                            if(this[1] == "down") {
                                TFMEX.turnToward(layers);
                            }
                        }
                    });
                    */
                }
		        TFMEX.votelog = [];
		        TFMEX.heartlog = [];

				try {
		    		// highlightMatchingTracks(songToMatch, $("#right-panel .songlist .song"));
		    		setTimeout(function() {
                        if(typeof(TFMEX.djSongCount[TFMEX.room.users[TFMEX.roommanager.roomData.metadata.currentDj].attributes.userid]) === "undefined") {
                            TFMEX.djSongCount[TFMEX.room.users[TFMEX.roommanager.roomData.metadata.currentDj].attributes.userid] = 0;
                        }
                        TFMEX.djSongCount[TFMEX.room.users[TFMEX.roommanager.roomData.metadata.currentDj].attributes.userid] += 1;
		    		}, 500);
		            if(TFMEX.prefs.showSong) {
		    			// console.log("About to show song: ", songObj);
		    			setTimeout(function() {
		    				// console.log("Show Song: ", songMetadata);
		    				var title = TFMEX.room.users[TFMEX.roommanager.roomData.metadata.currentDj].attributes.name + " is spinning:",
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
		    	    console.error("updateNowPlaying error: " + e.stack);
		    	}
			}
	    },
		dispatchEventToContentScript = function(eventType) {
			var customEvent = document.createEvent('Event');
			customEvent.initEvent(eventType, true, true);
			document.getElementById('tt-ext-mpd').dispatchEvent(customEvent)			
		},
		raiseNewSongEvent = function() { //sends it to the content script
			dispatchEventToContentScript('tt-ext-new-song-event');
		},
		raiseNewRoomInfoEvent = function() {
			dispatchEventToContentScript('tt-ext-new-room-info')
		},
		raiseNewSongTagsEvent = function() {
		    $('#tt-ext-mpd').first().attr('data-user-id', TFMEX.user.id);
		    $('#tt-ext-mpd').first().attr('data-song-tags', localStorage.TFMEXsongTags);
			dispatchEventToContentScript('tt-ext-new-song-tags');
		},
		getSendMessageFunction = function() {
			var messageFunctionName = $('body').data('tt-ext-messageFunctionName')
			if (!messageFunctionName) {
				messageFunctionName = 'sendMessage';
				$('body').data('tt-ext-messageFunctionName',messageFunctionName)
			}
		    var messageFunc = eval("turntable." + messageFunctionName)
			if (!messageFunc) {
				console.warn("Unable to determine sendMessage function.")
			}
			return messageFunc
		},
	    extensionEventListener = function(m){

	        var songMetadata = null,
	            currentDJ = "",
	            currentDJName = "",
	            showChat = true,
	            now = new Date();



			// if(m.hasOwnProperty("msgid")){ }

	        if(typeof(m.command) !== "undefined") {
				console.log("m.command: ", m.command);
	            switch(m.command) {
	                case "newsong":
                        // console.debug("Got newsong message")
                        var roomInfo = m.room.metadata
                        var newSong = (roomInfo ? roomInfo.current_song : null);
                        if (newSong) {
                            if (TFMEX.songlog) {
                                var currentSong = TFMEX.room.currentSong
                                if (currentSong.starttime != newSong.starttime) {
                                    TFMEX.songlog.push(newSong)
                                    //console.debug("Adding new song",newSong,"to songLog",TFMEX.songlog)
                                } else {
                                    //console.debug("Not adding newSong",newSong,"to songlog as the starttime was the same as on the old song",currentSong)
                                }
                            } else {
                                //console.debug("Not adding newSong",newSong,"to songlog as TFMEX.songlog was",TFMEX.songlog)
                            }
                        } else {
                            //console.debug("Not processing newsong message as newSong was",newSong)
                        }
	                    break;
	                case "speak":
                        TFMEX.lastUserAction[TFMEX.room.userIdFromName(m.name)] = now;
	                    if(TFMEX.prefs.filteredChat) {
	                        if(TFMEX.prefs.chatFilters.length) {
    	                        showChat = false;
    	                        $.each(TFMEX.prefs.chatFilters, function() {
    	                            if(m.text.toLowerCase().indexOf(this.toLowerCase()) > -1)  {
                                       showChat = true;
                                       return false;
                                    }
    	                        });
	                        }
	                    }
	                    if(TFMEX.prefs.showChat && showChat) {
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
	                        TFMEX.lastUserAction[user.userid] = now;
	                    }
	                    break;
	                case "deregistered":
	                    if(TFMEX.prefs.showListenerChanges) {
	                        // console.log("showListenerChanges", m);
	                        desktopAlert({
	                            title: m.user[0].attributes.name + " just " + listenerChangeMap[m.command] + " the room.",
	                            image: "",
	                            body: "",
	                            timeout: TFMEX.prefs.messageTimeout
	                        });
			            }
	                    break;
	                case "add_dj":
	                case "rem_dj":
                        TFMEX.lastUserAction[m.user[0].userid] = now;
                        if(m.command === "add_dj") {
	                        TFMEX.djSongCount[m.user[0].userid] = 0;
                        }
	                    if(TFMEX.prefs.showDJChanges) {
	                        console.log("showDJChanges", m);
	                        desktopAlert({
	                            title: m.user[0].name + " " + djChangeMap[m.command] + " the decks.",
	                            image: "",
	                            body: "",
	                            timeout: TFMEX.prefs.messageTimeout
	                        });
	                    }
	                    break;
	                case "snagged":
	                    TFMEX.heartlog.push(m.userid);
	                    break;
	                case "update_votes":
	                    //update vote in song log
                        var roomInfo = m.room.metadata,
                            score = (roomInfo.upvotes - roomInfo.downvotes + roomInfo.listeners) / (2 * roomInfo.listeners),
                            currentVote = [],
                            currentUserLayers = {};
                        if (score) {
                            if (TFMEX.songlog) {
                                var latestSong = TFMEX.songlog[TFMEX.songlog.length - 1]
                                if (latestSong) latestSong.score = score
                            }
                        }
                        // console.log(m.room.metadata.votelog);
                        $.each(m.room.metadata.votelog, function() {
                            TFMEX.votelog.push(this);
                        });
	                    currentVote = TFMEX.votelog[TFMEX.votelog.length - 1];
                        TFMEX.lastUserAction[currentVote[0]] = now;
						if(currentVote[0] === TFMEX.user.id) {
							if(currentVote[1] == "down") {
								$("body").attr("data-cancel-scrobble", true);
							} else {
								$("body").attr("data-cancel-scrobble", false);
							}
						}
						/*
	                    currentUserLayers = TFMEX.roommanager.listeners[currentVote[0]].layers;
						if(currentVote[1] == "down") {
						    if(currentUserLayers) {
						        TFMEX.turnAway(currentUserLayers);
						    } else {
						        // Deal with DJs on deck
						    }
						} else {
						    TFMEX.turnToward(currentUserLayers);
						}
						*/
	                    try {
	                        if(TFMEX.prefs.showVote && TFMEX.room.users[currentVote[0]]) {
	                            desktopAlert({
	                                title: TFMEX.room.users[currentVote[0]].attributes.name + " voted: ",
	                                image: "",
	                                body: voteMap[currentVote[1]],
	                                timeout: TFMEX.prefs.messageTimeout
	                            });
	                        }
	                    } catch(e) { console.error("Exception occurred during showVote",e.stack); }
	                case "update_user":
	                case "new_moderator":
	                default:
	            }
	        } else {
	            // console.log("Command Undefined");
	        }
	    }
		extensionEventListener.prototype.TFMEXListener = true;
	} catch(e) { console.error("Exception during initialization:",e.stack); }

	try {
		attachListeners();
	} catch(e) { console.error("Exception during attachListeners",e.stack); }
	};
	$.when(getTurntableObjects()).then(function() {whenTurntableObjectsReady(false)});
});

/*! @source http://purl.eligrey.com/github/canvas-toBlob.js/blob/master/canvas-toBlob.js */
(function(a){"use strict";var b=a.Uint8Array,c=a.HTMLCanvasElement,d=/\s*;\s*base64\s*(?:;|$)/i,f,e=function(n){var o=n.length,k=new b(o/4*3|0),m=0,q=0,r=[0,0],g=0,p=0,l,h,j;while(o--){h=n.charCodeAt(m++);l=f[h-43];if(l!==255&&l!==j){r[1]=r[0];r[0]=h;p=(p<<6)|l;g++;if(g===4){k[q++]=p>>>16;if(r[1]!==61){k[q++]=p>>>8}if(r[0]!==61){k[q++]=p}g=0}}}return k.buffer};if(b){f=new b([62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,0,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51])}if(c&&!c.prototype.toBlob){c.prototype.toBlob=function(p,m){if(!m){m="image/png"}var l=Array.prototype.slice.call(arguments,1),h=this.toDataURL.apply(this,l),n=h.indexOf(","),i=h.substring(n+1),o=d.test(h.substring(0,n)),j=a.BlobBuilder||a.WebKitBlobBuilder||a.MozBlobBuilder,k=new j,g;if(j.fake){g=k.getBlob(m);if(o){g.encoding="base64"}else{g.encoding="URI"}g.data=i;g.size=i.length}else{if(b){if(o){k.append(e(i))}else{k.append(decodeURIComponent(i))}g=k.getBlob(m)}}p(g)}}}(self));
/*! @source http://purl.eligrey.com/github/BlobBuilder.js/blob/master/BlobBuilder.js */
var BlobBuilder=BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||(function(j){"use strict";var c=function(v){return Object.prototype.toString.call(v).match(/^\[object\s(.*)\]$/)[1]},u=function(){this.data=[]},t=function(x,v,w){this.data=x;this.size=x.length;this.type=v;this.encoding=w},k=u.prototype,s=t.prototype,n=j.FileReaderSync,a=function(v){this.code=this[this.name=v]},l=("NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR").split(" "),r=l.length,o=j.URL||j.webkitURL||j,p=o.createObjectURL,b=o.revokeObjectURL,e=o,i=j.btoa,f=j.atob,m=false,h=function(v){m=!v},d=j.ArrayBuffer,g=j.Uint8Array;u.fake=s.fake=true;while(r--){a.prototype[l[r]]=r+1}try{if(g){h.apply(0,new g(1))}}catch(q){}if(!o.createObjectURL){e=j.URL={}}e.createObjectURL=function(w){var x=w.type,v;if(x===null){x="application/octet-stream"}if(w instanceof t){v="data:"+x;if(w.encoding==="base64"){return v+";base64,"+w.data}else{if(w.encoding==="URI"){return v+","+decodeURIComponent(w.data)}}if(i){return v+";base64,"+i(w.data)}else{return v+","+encodeURIComponent(w.data)}}else{if(real_create_object_url){return real_create_object_url.call(o,w)}}};e.revokeObjectURL=function(v){if(v.substring(0,5)!=="data:"&&real_revoke_object_url){real_revoke_object_url.call(o,v)}};k.append=function(z){var B=this.data;if(g&&z instanceof d){if(m){B.push(String.fromCharCode.apply(String,new g(z)))}else{var A="",w=new g(z),x=0,y=w.length;for(;x<y;x++){A+=String.fromCharCode(w[x])}}}else{if(c(z)==="Blob"||c(z)==="File"){if(n){var v=new n;B.push(v.readAsBinaryString(z))}else{throw new a("NOT_READABLE_ERR")}}else{if(z instanceof t){if(z.encoding==="base64"&&f){B.push(f(z.data))}else{if(z.encoding==="URI"){B.push(decodeURIComponent(z.data))}else{if(z.encoding==="raw"){B.push(z.data)}}}}else{if(typeof z!=="string"){z+=""}B.push(unescape(encodeURIComponent(z)))}}}};k.getBlob=function(v){if(!arguments.length){v=null}return new t(this.data.join(""),v,"raw")};k.toString=function(){return"[object BlobBuilder]"};s.slice=function(y,v,x){var w=arguments.length;if(w<3){x=null}return new t(this.data.slice(y,w>1?v:this.data.length),x,this.encoding)};s.toString=function(){return"[object Blob]"};return u}(self));
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||(function(h){"use strict";var r=h.document,l=function(){return h.URL||h.webkitURL||h},e=h.URL||h.webkitURL||h,n=r.createElementNS("http://www.w3.org/1999/xhtml","a"),g="download" in n,j=function(t){var s=r.createEvent("MouseEvents");s.initMouseEvent("click",true,false,h,0,0,0,0,0,false,false,false,false,0,null);return t.dispatchEvent(s)},o=h.webkitRequestFileSystem,p=h.requestFileSystem||o||h.mozRequestFileSystem,m=function(s){(h.setImmediate||h.setTimeout)(function(){throw s},0)},c="application/octet-stream",k=0,b=[],i=function(){var t=b.length;while(t--){var s=b[t];if(typeof s==="string"){e.revokeObjectURL(s)}else{s.remove()}}b.length=0},q=function(t,s,w){s=[].concat(s);var v=s.length;while(v--){var x=t["on"+s[v]];if(typeof x==="function"){try{x.call(t,w||t)}catch(u){m(u)}}}},f=function(t,u){var v=this,B=t.type,E=false,x,w,s=function(){var F=l().createObjectURL(t);b.push(F);return F},A=function(){q(v,"writestart progress write writeend".split(" "))},D=function(){if(E||!x){x=s(t)}w.location.href=x;v.readyState=v.DONE;A()},z=function(F){return function(){if(v.readyState!==v.DONE){return F.apply(this,arguments)}}},y={create:true,exclusive:false},C;v.readyState=v.INIT;if(!u){u="download"}if(g){x=s(t);n.href=x;n.download=u;if(j(n)){v.readyState=v.DONE;A();return}}if(h.chrome&&B&&B!==c){C=t.slice||t.webkitSlice;t=C.call(t,0,t.size,c);E=true}if(o&&u!=="download"){u+=".download"}if(B===c||o){w=h}else{w=h.open()}if(!p){D();return}k+=t.size;p(h.TEMPORARY,k,z(function(F){F.root.getDirectory("saved",y,z(function(G){var H=function(){G.getFile(u,y,z(function(I){I.createWriter(z(function(J){J.onwriteend=function(K){w.location.href=I.toURL();b.push(I);v.readyState=v.DONE;q(v,"writeend",K)};J.onerror=function(){var K=J.error;if(K.code!==K.ABORT_ERR){D()}};"writestart progress write abort".split(" ").forEach(function(K){J["on"+K]=v["on"+K]});J.write(t);v.abort=function(){J.abort();v.readyState=v.DONE};v.readyState=v.WRITING}),D)}),D)};G.getFile(u,{create:false},z(function(I){I.remove();H()}),z(function(I){if(I.code===I.NOT_FOUND_ERR){H()}else{D()}}))}),D)}),D)},d=f.prototype,a=function(s,t){return new f(s,t)};d.abort=function(){var s=this;s.readyState=s.DONE;q(s,"abort")};d.readyState=d.INIT=0;d.WRITING=1;d.DONE=2;d.error=d.onwritestart=d.onprogress=d.onwrite=d.onabort=d.onerror=d.onwriteend=null;h.addEventListener("unload",i,false);return a}(self));