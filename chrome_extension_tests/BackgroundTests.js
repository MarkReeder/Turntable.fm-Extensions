$(document).ready(function() {

	var numMostRecentSongsToConsider = 20
	var minLength = 10
	var threshold = 55

	module("Background_utils.js tests");

	function verifyEmptyArray(array) {
		ok(array,"array should have been not null")
		equals(array.length,0,"Array should have been empty")
	}
	
	test("prepareSongLogForSimilarSongSearch: empty log", function() {
		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch([])

		verifyEmptyArray(result)
	});

	test("prepareSongLogForSimilarSongSearch: short log", function() {
		var log = [/*1,2,3,4,5,6,7,8,9,10*/] // the last will get lopped off and 9 < the threshold of 10
		for (var i = 1; i <= minLength; i++ ) log.push(i)
		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(log)

		verifyEmptyArray(result)
	});

	test("prepareSongLogForSimilarSongSearch: results are sorted in descending score order", function() {
		var songLog = [];

		var start = 100 - minLength - 1

		for (var i = start; i <= 100;i++) { //it will chop off the last one
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")

		var maxScore = 0
		var minScore = 1.1
	    $.each(result, function(index,val) {
			maxScore = Math.max(maxScore,val.score)
			minScore = Math.min(minScore,val.score)
		})
		equals(result[0].score,maxScore,"first entry should have had highest score ("+maxScore+")");
		equals(result[result.length - 1].score,minScore,"last entry should have had lowest score("+minScore+")");
	});

	test("prepareSongLogForSimilarSongSearch: only results above or equal 55% are included", function() {
		var songLog = [];

		var expectedLength = 5

		var end = threshold + 5
		var start = end - minLength - 1
		for (var i = start; i <= end;i++) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")
		equals(result.length,expectedLength,"Wrong number of results")
		equals(result[result.length-1].score,0.55,"The lowest entry should have been 0.55")
	});

	test("prepareSongLogForSimilarSongSearch: a log with all < 55% results in an empty array", function() {
		var songLog = [];

		var end = threshold - 1
		for (var i = 10; i <= threshold;i = i + 2) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		verifyEmptyArray(result)
	});

	test("Only the ten most recent songs are kept, when 10 recent are lowest scoring", function() {
		var songLog = [];

		var high = 90
		var low = 59
		for (var i = high; i >= low; i--) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")
		equals(result.length,numMostRecentSongsToConsider,"Wrong number of results")
		equals(result[0].score, (low + numMostRecentSongsToConsider) / 100)
		equals(result[result.length-1].score,(low + 1)/100)
	});

	test("Only the ten most recent songs are kept, when 10 recent are highest scoring", function() {
		var songLog = [];

		var high = 90
		var low = 59
		for (var i = low; i <= high; i++) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")
		equals(result.length,numMostRecentSongsToConsider,"Wrong number of results")
		equals(result[0].score,(high - 1)/100)
		equals(result[result.length-1].score, (high - numMostRecentSongsToConsider) /100)
	});


});
