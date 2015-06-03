var SAMPLES_PER_SECOND = 60; // Number to samples per second for processing

var sampled;
var peak = 1;
var audioCtx, audio, source;

init();
getData('03_Ikram_Choudhury_-_Dance_World_Pineapple_Zone.mp3', onLoaded);

function init() {
	 audioCtx = new AudioContext();
	// var source = audioCtx.createBufferSource();

	audio = document.createElement( 'audio' );
	audio.controls = true;
	audio.style.position = 'absolute';
	audio.style.left = 'calc(50% - 150px)';
	audio.style.bottom = '25px';
	audio.style.transition = 'opacity 1s';
	audio.play();
	document.body.appendChild( audio );

	source = audioCtx.createMediaElementSource(audio);

	document.addEventListener('keydown', function(e) {
		var pressed = true;

		switch(e.keyCode) {
			case 32: 
				if (audio.paused) {
					audio.play()
				} else {
					audio.pause();
				}
				break;
			case 37:
				audio.currentTime -= 0.5;
				break;
			case 39:
				audio.currentTime += 0.5;
				break;
			default:
				pressed = false;
		}

		if (pressed) e.preventDefault();
	});
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.

	var reader = new FileReader();

	reader.onload = function(event) {
		
		loadAudioBuffer(event.target.result);
	};

	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		console.log(
			f.name, 'type: ', f.type || 'n/a', ') - ',
				f.size, ' bytes, last modified: ',
				f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a'
			 );

		audio.src = URL.createObjectURL(f);
		reader.readAsArrayBuffer(f);

	}
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function getData(url) {
	var request = new XMLHttpRequest();
 
	request.open('GET', url, true);
 
	request.responseType = 'arraybuffer';
 
	request.onload = function() {
		var audioData = request.response;
		loadAudioBuffer(audioData);
		audio.src = url;
	}
 
	request.send();
}

function loadAudioBuffer(audioData) {
	audioCtx.decodeAudioData(audioData, function(buffer) {
		source.buffer = buffer;
		source.connect(audioCtx.destination);
		onLoaded(buffer.getChannelData(0), buffer.getChannelData(1), buffer.sampleRate);
	});
}

function onLoaded(data, dataR, rate) {
	var SAMPLES_PER_PICK = rate / SAMPLES_PER_SECOND;
	sampled = new Float32Array(data.length / SAMPLES_PER_PICK | 0);  

	//// Finding peak for normalization
	// peak = -Infinity;
	// for (var i = 0; i < sampled.length; i++) {
	//   var abs = sampled[i];
	//   if (abs > peak) peak = abs;
	// }
	
	// Make Sample Data
	for (var i = 0; i < sampled.length; i++) {
		var max = -Infinity;
		var min = Infinity;
		var avg = 0;
		var squaredSum = 0;

		for (var j =0; j < SAMPLES_PER_PICK; j++ ) {
			var s = Math.max(Math.abs(data[i * SAMPLES_PER_PICK + j]), Math.abs(data[i * SAMPLES_PER_PICK + j]));
			max = Math.max(max, s);
			min = Math.min(min, s);
			avg += s;
			squaredSum += s * s;
		}

		avg /= SAMPLES_PER_PICK;
		// sampled[i] = avg;
		// sampled[i] = max;
		// sampled[i] = (max + min) / 2;
		// sampled[i] = s;
		sampled[i] = Math.sqrt(squaredSum / SAMPLES_PER_PICK);
	}
}
