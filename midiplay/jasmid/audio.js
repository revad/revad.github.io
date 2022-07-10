var sampleRate = 44100; /* hard-coded in Flash player */

function AudioPlayer(generator, opts) {
	if (!opts) opts = {};
	var latency = opts.latency || 1;
	var checkInterval = latency * 100 /* in ms */
	
	var audioElement = new Audio();
	var webkitAudio = window.AudioContext || window.webkitAudioContext;
	var requestStop = false;
	
	if (audioElement.mozSetup) {
		audioElement.mozSetup(2, sampleRate); /* channels, sample rate */
		
		var buffer = []; /* data generated but not yet written */
		var minBufferLength = latency * 2 * sampleRate; /* refill buffer when there are only this many elements remaining */
		var bufferFillLength = Math.floor(latency * sampleRate);
		
		function checkBuffer() {
			if (buffer.length) {
				var written = audioElement.mozWriteAudio(buffer);
				buffer = buffer.slice(written);
			}
			if (buffer.length < minBufferLength && !generator.finished) {
				buffer = buffer.concat(generator.generate(bufferFillLength));
			}
			if (!requestStop && (!generator.finished || buffer.length)) {
				setTimeout(checkBuffer, checkInterval);
			}
		}
		checkBuffer();
		
		return {
			'type': 'Firefox Audio',
			'stop': function() {
				requestStop = true;
			}
		}
	} else if (webkitAudio) {
		// Uses Webkit Web Audio API if available
		var context = new webkitAudio();
		sampleRate = context.sampleRate;
		
		var channelCount = 2;
		var bufferSize = 4096*4; // Higher for less gitches, lower for less latency
		
		var node = context.createScriptProcessor(bufferSize, 0, channelCount);
		
		node.onaudioprocess = function(e) { process(e) };

		function process(e) {
			if (generator.finished) {
				node.disconnect();
				return;
			}
			
			var dataLeft = e.outputBuffer.getChannelData(0);
			var dataRight = e.outputBuffer.getChannelData(1);

			var generate = generator.generate(bufferSize);

			for (var i = 0; i < bufferSize; ++i) {
				dataLeft[i] = generate[i*2];
				dataRight[i] = generate[i*2+1];
			}
		}
		
		// start
		node.connect(context.destination);
		
		return {
			'stop': function() {
				// pause
				node.disconnect();
				requestStop = true;
			},
			'type': 'Webkit Audio'
		}

	} else {
// Flash part removed by DaveRo
console.log("Audio API didn't work")
	}
}
