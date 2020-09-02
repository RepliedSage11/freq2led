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

    analyser.fftSize = 1024;
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

    function draw() {

        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        var barWidth = (canvas.width / bufferLength) * 2.5;
        var barHeight;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {

            if (dataArray[i] > 210) { // pink
                r = 250
                g = 0
                b = 255
            } else if (dataArray[i] > 200) { // yellow
                r = 250
                g = 255
                b = 0
            } else if (dataArray[i] > 190) { // yellow/green
                r = 204
                g = 255
                b = 0
            } else if (dataArray[i] > 180) { // blue/green
                r = 0
                g = 219
                b = 131
            } else { // light blue
                r = 0
                g = 199
                b = 255
            }


            canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
            barHeight = dataArray[i] / 0.5;

            // canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

            x += barWidth + 1;
        }
        canvasCtx.font = '30px Arial';
        canvasCtx.fillText(audioElement.id, 30, 30);
    };


    draw();
}

