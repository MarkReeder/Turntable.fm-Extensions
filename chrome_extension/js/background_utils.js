/*

Please do not add any dependencies to the Chrome Extension API in here
Doing so will prevent the unit tests from running

*/

var TTExBGUtils = TTExBGUtils || {}

TTExBGUtils.prepareSongLogForSimilarSongSearch = function(songLog) {
	var numMostRecentSongsToConsider = 10
	var minScore = 55

	if (!songLog || songLog.length == 0) return [];

	//chop off the last song, as it is currently playing
	songLog.splice(songLog.length - 1,1);

	if (songLog.length < numMostRecentSongsToConsider) return	[]

	//only keep the newest 10
	if (songLog.length > numMostRecentSongsToConsider) {
		songLog = songLog.slice(songLog.length - numMostRecentSongsToConsider)
	}

	var sortedSongLog = songLog.sort(function(a,b) {
		if (a.score < b.score) return 1;
		if (a.score > b.score) return -1;
		else return 0;
	});

	var filteredSongLog = $.grep(sortedSongLog,function(element,index) {
		return Math.round(element.score * 100) >= minScore
	});
	
	return filteredSongLog
}
