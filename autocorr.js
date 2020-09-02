var preNormalize = true;
var postNormalize = true;
var doCenterClip = false;
var centerClipThreshold = 0.0;

function autoCorrelate(timeDomainBuffer) {

    var nSamples = timeDomainBuffer.length;

    // pre-normalize the input buffer
    if (preNormalize) {
        timeDomainBuffer = normalize(timeDomainBuffer);
    }

    // zero out any values below the centerClipThreshold
    if (doCenterClip) {
        timeDomainBuffer = centerClip(timeDomainBuffer);
    }

    var autoCorrBuffer = [];
    for (var lag = 0; lag < nSamples; lag++) {
        var sum = 0;
        for (var index = 0; index < nSamples; index++) {
            var indexLagged = index + lag;
            if (indexLagged < nSamples) {
                var sound1 = timeDomainBuffer[index];
                var sound2 = timeDomainBuffer[indexLagged];
                var product = sound1 * sound2;
                sum += product;
            }
        }

        // average to a value between -1 and 1
        autoCorrBuffer[lag] = sum / nSamples;
    }

    // normalize the output buffer
    if (postNormalize) {
        autoCorrBuffer = normalize(autoCorrBuffer);
    }

    return autoCorrBuffer;
}


// Find the biggest value in a buffer, set that value to 1.0,
// and scale every other value by the same amount.
function normalize(buffer) {
    var biggestVal = 0;
    var nSamples = buffer.length;
    for (var index = 0; index < nSamples; index++) {
        if (Math.abs(buffer[index]) > biggestVal) {
            biggestVal = Math.abs(buffer[index]);
        }
    }
    for (var index = 0; index < nSamples; index++) {

        // divide each sample of the buffer by the biggest val
        buffer[index] /= biggestVal;
    }
    return buffer;
}

// Accepts a buffer of samples, and sets any samples whose
// amplitude is below the centerClipThreshold to zero.
// This factors them out of the autocorrelation.
function centerClip(buffer) {
    var nSamples = buffer.length;

    // center clip removes any samples whose abs is less than centerClipThreshold
    centerClipThreshold = map(mouseY, 0, height, 0, 1);

    if (centerClipThreshold > 0.0) {
        for (var i = 0; i < nSamples; i++) {
            var val = buffer[i];
            buffer[i] = (Math.abs(val) > centerClipThreshold) ? val : 0;
        }
    }
    return buffer;
}

// Calculate the fundamental frequency of a buffer
// by finding the peaks, and counting the distance
// between peaks in samples, and converting that
// number of samples to a frequency value.
function findFrequency(autocorr, audioContext) {

    var nSamples = autocorr.length;
    var valOfLargestPeakSoFar = 0;
    var indexOfLargestPeakSoFar = -1;

    for (var index = 1; index < nSamples; index++) {
        var valL = autocorr[index - 1];
        var valC = autocorr[index];
        var valR = autocorr[index + 1];

        var bIsPeak = ((valL < valC) && (valR < valC));
        if (bIsPeak) {
            if (valC > valOfLargestPeakSoFar) {
                valOfLargestPeakSoFar = valC;
                indexOfLargestPeakSoFar = index;
            }
        }
    }

    var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

    // convert sample count to frequency
    var fundamentalFrequency = audioContext.sampleRate / distanceToNextLargestPeak;
    return fundamentalFrequency;
}


const audioElements = document.getElementsByClassName('audio');
for (const el of audioElements) {
    console.log(el);
    console.log(el.id)
    createSpectrum(el);
}

function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
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

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    track.connect(analyser)

    analyser.fftSize = 512;
    var bufferLength = analyser.fftSize;
    var dataArray = new Float32Array(analyser.fftSize); // Float32Array needs to be the same length as the fftSize 
    analyser.getFloatTimeDomainData(dataArray);


    // Get a canvas defined with ID "oscilloscope"
    var canvas = document.getElementById(audioElement.id + '-canvas');
    var canvasCtx = canvas.getContext("2d");

    // draw an oscilloscope of the current audio source
    // One-liner to resume playback when user interacted with the page.
    document.addEventListener('click', function () {
        audioCtx.resume().then(() => {
            console.log('Playback resumed successfully');



            audioElement.play();

        });

    }, { once: true });


    canvasCtx.font = '30px Arial'
    function draw() {

        requestAnimationFrame(draw);

        analyser.getFloatTimeDomainData(dataArray);

        autoCorr = autoCorrelate(dataArray);
        const freq = findFrequency(autoCorr, audioCtx);

        const red = 255 * Math.trunc(freq) / 24000;

        // get the average, bincount is fftsize / 2
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)
        if (audioElement.id === 'bass') {
            average *= 4;
        }
        average *= 2;
        let color;
        if (freq < 40) {
            color = `255, 0, 0`;
        } else if (freq >= 40 && freq <= 77) {

            const b = (freq - 40) * (255 / 37.0000);
            color = `255, 0, ${b}`;
        } else if (freq > 77 && freq <= 205) {

            const r = 255 - ((freq - 78) * 2);
            color = `${r}, 0, 0`;

        } else if (freq >= 206 && freq <= 238) {

            const g = (freq - 206) * (255 / 32.0000);
            color = `0, ${g}, 0`;
        } else if (freq <= 239 && freq <= 250) {

            const r = (freq - 239) * (255 / 11.0000);
            color = `${r}, 255, 255`;
        } else if (freq >= 251 && freq <= 270) {
            color = '255, 255, 255';
        } else if (freq >= 271 && freq <= 398) {

            const rb = 255 - ((freq - 271) * 2);
            color = `${rb}, 255, ${rb}`;
        } else if (freq >= 398 && freq <= 653) {

            color = `255, ${255 - (freq - 398)}, ${(freq - 398)}`;
        } else {
            color = '0, 0, 0';
        }





        canvasCtx.fillStyle = `rgb(${average},${average},${average})`;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = "rgb(0,0,255)";
        canvasCtx.fillText(audioElement.id, 30, 30);
        canvasCtx.fillText(freq, 200, 200);
        // canvasCtx.fillText(findClosestNote(freq), 200, 400);
    }

    draw();


}

