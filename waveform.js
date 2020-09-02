const audioElements = document.getElementsByClassName('audio');

for (const el of audioElements) {
    console.log(el);
    console.log(el.id)
    createSpectrum(el);
}

function createSpectrum(audioElement) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();

    // load some sound

    const track = audioCtx.createMediaElementSource(audioElement);

    const gainNode = audioCtx.createGain();
    track.connect(gainNode);

    if (audioElement.id === 'original') {
        gainNode.connect(audioCtx.destination);
    }
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    track.connect(analyser)

    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Get a canvas defined with ID "oscilloscope"
    var canvas = document.getElementById(audioElement.id + '-canvas');
    var canvasCtx = canvas.getContext("2d");

    // draw an oscilloscope of the current audio source
    // One-liner to resume playback when user interacted with the page.
    document.addEventListener('click', function () {
        audioCtx.resume().then(() => {
            console.log('Playback resumed successfully');
            audioElement.play()
        });

    }, { once: true });
    canvasCtx.font = '30px Arial';
    
    function draw() {

        requestAnimationFrame(draw);
      
        analyser.getByteTimeDomainData(dataArray);
        // if(audioElement.id === 'drums'){
        //     console.log(dataArray[0]);
        // }
        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      
        canvasCtx.beginPath();
      
        var sliceWidth = canvas.width * 1.0 / bufferLength;
        var x = 0;
      
        for (var i = 0; i < bufferLength; i++) {
      
          var v = dataArray[i] / 128.0;
          var y = v * canvas.height / 2;
      
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
      
          x += sliceWidth;
        }
      
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        
      }
      
      canvasCtx.fillStyle = "rgb(0,0,255)";
      canvasCtx.fillText(audioElement.id, 30, 30);

    draw();
}

