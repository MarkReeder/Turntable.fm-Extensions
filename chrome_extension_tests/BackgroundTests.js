$(document).ready(function() {

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
		var log = [1,2,3,4,5,6,7,8,9,10] // the last will get lopped off and 9 < the threshold of 10
		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(log)

		verifyEmptyArray(result)
	});

	test("prepareSongLogForSimilarSongSearch: results are sorted in descending score order", function() {
		var songLog = [];

		for (var i = 89; i <= 100;i++) { //it will chop off the last one
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

		for (var i = 49; i <= 60;i++) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")
		equals(result.length,5,"Wrong number of results")
		equals(result[result.length-1].score,0.55,"The lowest entry should have been 0.55")
	});

	test("prepareSongLogForSimilarSongSearch: a log with all < 55% results in an empty array", function() {
		var songLog = [];

		for (var i = 10; i < 55;i = i + 2) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		verifyEmptyArray(result)
	});

	test("Only the ten most recent songs are kept", function() {
		var songLog = [];

		for (var i = 90; i >= 59; i--) {
			songLog.push({score:i/100});
		}

		var result = TTExBGUtils.prepareSongLogForSimilarSongSearch(songLog)

		ok(result,"result should have been not null")
		equals(result.length,10,"Wrong number of results")
		equals(result[0].score,0.69)
		equals(result[result.length-1].score,0.60)
	});


});
