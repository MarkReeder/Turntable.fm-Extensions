TFMEX = {};
TFMEX.BASE_HOSTNAME = ''

/*
 jquery.webkit-notification plugin v 0.1
 Developed by Arjun Raj
 email: arjun@athousandnodes.com
 site: http://www.athousandnodes.com

 Licences: MIT, GPL
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
*/
var jwNotify={};jwNotify.status=false;if(window.webkitNotifications){jwNotify.status=true;}
function requestingPopupPermission(callback){if((jwNotify.status)&&(jwNotify.options)&&(jwNotify.type))
window.webkitNotifications.requestPermission(callback);else
console.log('Error');}
function showNotification(){if(window.webkitNotifications.checkPermission()!=0){requestingPopupPermission(showNotification);}
else{if(jwNotify.type=='html'){if(jwNotify.options.url){var popup=window.webkitNotifications.createHTMLNotification(jwNotify.options.url);if(jwNotify.options.onclick)
popup.onclick=jwNotify.options.onclick;if(jwNotify.options.onshow)
popup.onshow=jwNotify.options.onshow;if(jwNotify.options.onclose)
popup.onclose=jwNotify.options.onclose;if(jwNotify.options.onerror)
popup.onerror=jwNotify.options.onerror;if(jwNotify.options.id)
popup.replaceId=jwNotify.options.id;popup.show();}}
else{if(jwNotify.options.image||jwNotify.options.title||jwNotify.options.body){var popup=window.webkitNotifications.createNotification(jwNotify.options.image,jwNotify.options.title,jwNotify.options.body);if(jwNotify.options.dir)
popup.dir=jwNotify.options.dir;if(jwNotify.options.onclick)
popup.onclick=jwNotify.options.onclick;if(jwNotify.options.onshow)
popup.onshow=jwNotify.options.onshow;if(jwNotify.options.onclose)
popup.onclose=jwNotify.options.onclose;if(jwNotify.options.onerror)
popup.onerror=jwNotify.options.onerror;if(jwNotify.options.id)
popup.replaceId=jwNotify.options.id;popup.show();}
else
console.log('not enough parameters');}
if(popup&&(jwNotify.options.timeout>0)){setTimeout(function(){popup.cancel();},jwNotify.options.timeout);jwNotify.options=null;jwNotify.type=null;}}}
jQuery.extend({jwNotify:function(options){var settings={image:null,title:null,body:null,timeout:5000,dir:null,onclick:null,onshow:null,onerror:null,onclose:null,id:null};if(options)
$.extend(settings,options);jwNotify.options=settings;jwNotify.type='normal';showNotification();},jwNotifyHTML:function(options){var settings={url:null,timeout:5000,onclick:null,onshow:null,onerror:null,onclose:null,id:null};if(options)
$.extend(settings,options);jwNotify.options=settings;jwNotify.type='html';showNotification();}});

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
    "autoDj": true,
    "autoKick": false
    "autoKickUsers": []
    "messageTimeout": 10000,
};
TFMEX.votelog = [];
(function() {
    $("script[href$='turntable.fm.extend.dev.js']").remove();
    $("link[href$='turntable.fm.extend.css']").remove();
    $(document.createElement('link')).attr({
    href: TFMEX.BASE_HOSTNAME+'/css/turntable.fm.extend.css?v='+new Date().getTime(),
    media: 'screen',
    type: 'text/css',
    rel: 'stylesheet'
    }).appendTo('head');

    $("#tfmExtended").remove();
    TFMEX.$body.append('<div id="tfmExtended"><div class="settings"><div class="gear"></div><div class="preferences hidden"></div></div></div>');
    $("#tfmExtended .gear").click(function(){
        if($("#tfmExtended .preferences").hasClass("hidden")) {
            showPrefs();
        } else {
            hidePrefs();
        }
    });
    // hide the window if anything besides the preference window is clicked
    $("body").click(function() {
        if ($(e.target).hasClass('preferences') && !$("#tfmExtended .preferences").hasClass("hidden")) {
            hidePrefs();
        }
    });


    if(window.webkitNotifications && window.webkitNotifications.checkPermission() != 0){
        TFMEX.$body.bind('click.jwNotify', function() {
            $.jwNotify({
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
        showPrefs = function() {
            var preferencesContent = "",
                preferenceSettings = {},
                currentVote = null;
            preferencesContent += '<dl>';
            preferencesContent += '<dt>Show Chat Messages?</dt>';
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
            preferencesContent += '<dt>Auto DJ?</dt>';
            preferencesContent += '<dd><input type="checkbox" id="autoDj" data-tfmex-pref="autoDj" value="1" /></dd>';
            preferencesContent += '<dt>Auto kick?</dt>';
            preferencesContent += '<dd><input type="text" id="autoKick" data-tfmex-pref="autoKick" value="0" /></dd>';
            preferencesContent += '</dl>';
            if(TFMEX.votelog.length === 0 && turntable.topViewController.upvoters.length > 0) {
                for (var upvoter in turntable.topViewController.upvoters) {
                    if (turntable.topViewController.upvoters.hasOwnProperty(upvoter)) {
                        TFMEX.votelog.push([turntable.topViewController.upvoters[upvoter], "up"]);
                    }
                }
            }
            preferencesContent += '<ul class="currentSongVotes clL">';
            for (var vote in TFMEX.votelog) {
                if (TFMEX.votelog.hasOwnProperty(vote)) {
                    currentVote = TFMEX.votelog[vote];
                    preferencesContent += "<li>";
                    preferencesContent += turntable.topViewController.users[currentVote[0]].name + " voted: " + voteMap[currentVote[1]];
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
        modifyTurntableObjects = function() {
            blackswan.add_source_animation = function (c, b) {
                    if (!this.data.animations) {
                        this.data.animations = {};
                    }
                    for (var d in b) {
                        this.data.animations[d] = b[d];
                    }
                };  
        },
        extensionEventListener = function(m){
            // console.log("New Message:", m);
        
            var songMetadata = null,
                currentDJ = "",
                currentDJName = "";
            
            if(m.hasOwnProperty("msgid")){
                songMetadata = turntable.topViewController.currentSong.metadata;
                if(songMetadata.song !== lastSongMetadata.song && songMetadata.artist !== lastSongMetadata.artist) {
                    lastSongMetadata = songMetadata;
                } else {
                    return;
                }
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
                            $.jwNotify({
                                title: "",
                                image: "",
                                body: m.name + ": " + m.text,
                                timeout: TFMEX.prefs.messageTimeout
                            });
                        }
                        break;
                    case "registered":
                        if(m.user[0].name in TFMEX.prefs.autoKickUsers && TFMEX.prefs.autoKick) {
                            ROOMMANAGER.callback('boot_user',m.user[0].id);
                        }
                        break;
                    case "deregistered":
                        if(TFMEX.prefs.showListenerChanges) {
                            // console.log("showListenerChanges", m);
                            $.jwNotify({
                                title: "",
                                image: "",
                                body: m.user[0].name + " just " + listenerChangeMap[m.command] + " the room.",
                                timeout: TFMEX.prefs.messageTimeout
                            });
                        }
                        break;
                    case "add_dj":
                    case "rem_dj":
                        if (m.command === "rem_dj" && TFMEX.prefs.autoDj) {
                            $('.become_dj').click();
                        }
                        if(TFMEX.prefs.showDJChanges) {
                            // console.log("showDJChanges", m);
                            $.jwNotify({
                                title: "",
                                image: "",
                                body: m.user[0].name + " " + djChangeMap[m.command] + " the decks.",
                                timeout: TFMEX.prefs.messageTimeout
                            });
                        }
                        break;
                    case "update_votes":
                        TFMEX.votelog = m.room.metadata.votelog;
                        var currentVote = TFMEX.votelog[TFMEX.votelog.length - 1];
                        try {
                            if(currentVote[1] === "up") {
                                // turntable.topViewController.roomManager.add_animation_to(turntable.topViewController.users[currentVote[0]], "rock");
                            }
                            if(TFMEX.prefs.showVote) {
                                $.jwNotify({
                                    title: "",
                                    image: "",
                                    body: turntable.topViewController.users[currentVote[0]].name + " voted: " + voteMap[currentVote[1]],
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
                var title = turntable.topViewController.users[turntable.topViewController.roomManager.current_dj[0]].name + " is spinning:",
                    coverArt = songMetadata.coverart?songMetadata.coverart:"",
                    body = songMetadata.artist + " - " + songMetadata.song;
                $.jwNotify({
                    title: title,
                    image: coverArt,
                    body: body,
                    timeout: TFMEX.prefs.messageTimeout
                });
            }
        }
    }
    modifyTurntableObjects();
    try {
        turntable.removeEventListener("message", extensionEventListener);
        turntable.removeEventListener("soundstart", extensionEventListener);
    } catch(e) {}
    turntable.addEventListener("message", extensionEventListener);
    turntable.addEventListener("soundstart", extensionEventListener);
})();
