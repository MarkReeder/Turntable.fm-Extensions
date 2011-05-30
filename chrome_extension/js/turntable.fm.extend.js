TFMEX = {};

/*!
 * Based on:
 * Modernizr v1.7
 * http://www.modernizr.com
 *
 * Developed by: 
 * - Faruk Ates  http://farukat.es/
 * - Paul Irish  http://paulirish.com/
 *
 * Copyright (c) 2009-2011
 * Dual-licensed under the BSD or MIT licenses.
 * http://www.modernizr.com/license/
 */
TFMEX.localStorageSupport = function() {
    try {
        return !!localStorage.getItem;
    } catch(e) {
        return false;
    }
}();

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
    "messageTimeout": 10000
};
TFMEX.votelog = [];
$(document).ready(function() {
    try {
    // $("script[href$='turntable.fm.extend.dev.js']").remove();

    $("#tfmExtended").remove();
    TFMEX.$body.append('<div id="tfmExtended"><div class="settings"><div class="gear"></div><div class="preferences hidden"></div></div></div>');
    $("#tfmExtended .gear").click(function(){
        if($("#tfmExtended .preferences").hasClass("hidden")) {
            showPrefs();
        } else {
            hidePrefs();
        }
    });

    if(window.webkitNotifications && window.webkitNotifications.checkPermission() != 0){
        TFMEX.$body.bind('click.jwNotify', function() {
            desktopAlert({
                title: "",
                image: "",
                body: "Desktop notifications enabled.",
                timeout: 1
            });
            TFMEX.$body.unbind('click.jwNotify')
        });
    }
    var lastSongMetadata = {},
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
	attachListeners = function() {
        var intervalID = window.setInterval(function() {
            if(window.turntable.eventListeners.message.length) {
                window.turntable.addEventListener("message", extensionEventListener);
                window.turntable.addEventListener("soundstart", extensionEventListener);
                window.clearInterval(intervalID);
            }
        }, 250);
	},
	cleanUp = function() {
        window.turntable.eventListeners.message = [];
        window.turntable.eventListeners.soundstart = [];
	},
    showPrefs = function() {
        var preferencesContent = "",
            preferenceSettings = {},
            currentVote = null;

        preferencesContent += '<dl>';
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
        preferencesContent += '</dl>';
        
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
                    preferencesContent += window.turntable.topViewController.users[currentVote[0]].name + " voted: " + voteMap[currentVote[1]];
                } catch(e) {};
                preferencesContent += "</li>";
            }
        }
        preferencesContent += '</ul>';
        $("#tfmExtended .preferences").html(preferencesContent);
        $("#tfmExtended .preferences").removeClass("hidden");
        if(TFMEX.localStorageSupport) {
            preferenceSettings = localStorage.getItem("TFMEX");
            if(preferenceSettings) {
                preferenceSettings = JSON.parse(preferenceSettings);
                $.extend(TFMEX.prefs, preferenceSettings);
                preferenceSettings = TFMEX.prefs;
            } else {
                preferenceSettings = TFMEX.prefs;
            }
        } else { preferenceSettings = TFMEX.prefs; }
        
        for (prefName in preferenceSettings) {
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
    },
    hidePrefs = function() {
        $("#tfmExtended .preferences").addClass("hidden");
    },
    desktopAlert = function(notificationObj) {
        var notification = webkitNotifications.createNotification(
          notificationObj.image?notificationObj.image:"",  // icon url - can be relative
          notificationObj.title?notificationObj.title:"",  // notification title
          notificationObj.body?notificationObj.body:""  // notification body text
        );
        notification.show();
        setTimeout(function(){
            notification.cancel();
        }, notificationObj.timeout);
        
    },
    extensionEventListener = function(m){
    
        var songMetadata = null,
            currentDJ = "",
            currentDJName = "";
        
        if(m.hasOwnProperty("msgid")){
            try {
                songMetadata = window.turntable.topViewController.currentSong.metadata;
                if(songMetadata.song !== lastSongMetadata.song && songMetadata.artist !== lastSongMetadata.artist) {
                    lastSongMetadata = songMetadata;
                } else {
                    return;
                }
            } catch(e) {}
        }
        if(typeof(m.command) !== "undefined") {
            switch(m.command) {
                case "newsong":
                    TFMEX.votelog = [];
                    try {
                        if(TFMEX.prefs.autoAwesome) {
                            ROOMMANAGER.callback("upvote");
                        }
                        songMetadata = m.room.metadata.current_song.metadata;
                        lastSongMetadata = songMetadata;
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
                    try {
                        if(TFMEX.prefs.showVote) {
                            desktopAlert({
                                title: window.turntable.topViewController.users[currentVote[0]].name + " voted: ",
                                image: "",
                                body: voteMap[currentVote[1]],
                                timeout: TFMEX.prefs.messageTimeout
                            });
                        }
                    } catch(e) { console.log(e.message); }
                case "update_user":
                case "new_moderator":
                default:
            }
        } else {
            // console.log("Command Undefined");
        }
        
        if(songMetadata) {
            if(TFMEX.prefs.showSong) {
                var title = window.turntable.topViewController.users[window.turntable.topViewController.roomManager.current_dj[0]].name + " is spinning:",
                    coverArt = songMetadata.coverart?songMetadata.coverart:"",
                    body = songMetadata.artist + " - " + songMetadata.song;
                desktopAlert({
                    title: title,
                    image: coverArt,
                    body: body,
                    timeout: TFMEX.prefs.messageTimeout
                });
            }
        }
    }
    $(window).bind("popstate", function (b) {
        cleanUp();
        attachListeners();
    });
    $(window).bind("pushstate", function (b) {
        cleanUp();
        attachListeners();
    });
} catch(e) { console.error(e); }
});
