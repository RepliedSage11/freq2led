const audioElements = document.getElementsByClassName('audio');

function getTones(frequencyData) {
    var bins = [];
    var count = 0;
    var total = 0;
    var sum = 0;
    var cutoff = 20;//redundant with decibels?
    var nPtr = 0; //notePointer
    for (var i = 0; i < buflen; i++) {
        var fdat = frequencyData[i];
        var freq = i * hertzBinSize;//freq in hertz for this sample
        var curNote = notes[nPtr];
        var nextNote = notes[nPtr + 1];
        //cut off halfway into the next note
        var hzLimit = curNote.h + ((nextNote.h - curNote.h) / 2);
        if (freq < hzLimit) {
            if (fdat > cutoff) {
                sum += i;//bin numbers
                count++;
                total += fdat;
            }
        } else {
            if (count > 0) {
                var binNum = sum / count;
                var bin = {};
                //round up
                var power = frequencyData[Math.ceil(binNum)];
                if (binNum > 0) {
                    //round down
                    power = (power + frequencyData[Math.floor(binNum)]) / 2;
                }
                //notes[nPtr].power = power;
                //seems like it rounds the values too much?
                notes[nPtr].power = total / count;
                sum = 0;
                count = 0;
                total = 0;
            } else {
                notes[nPtr].power = 0;
            }
            //next note
            if (nPtr < notes.length - 2) {
                nPtr++;
            }
        }
    }
    if (bins.length > 0) {
        freqAry = bins;
    }
    // drawNotes();
    // setTimeout(function () { requestAnimationFrame(getTones) }, 50);
}
// const findFundamentalFreq = (buffer, sampleRate) => {
//     // We use Autocorrelation to find the fundamental frequency.
//     console.log(buffer)
//     // In order to correlate the signal with itself (hence the name of the algorithm), we will check two points 'k' frames away. 
//     // The autocorrelation index will be the average of these products. At the same time, we normalize the values.
//     // Source: http://www.phy.mty.edu/~suits/autocorrelation.html
//     // Assuming the sample rate is 48000Hz, a 'k' equal to 1000 would correspond to a 48Hz signal (48000/1000 = 48), 
//     // while a 'k' equal to 8 would correspond to a 6000Hz one, which is enough to cover most (if not all) 
//     // the notes we have in the notes.json file.
//     var n = 1024, bestR = 0, bestK = -1;
//     for (var k = 8; k <= 1000; k++) {
//         var sum = 0;

//         for (var i = 0; i < n; i++) {
//             sum += ((buffer[i] - 128) / 128) * ((buffer[i + k] - 128) / 128);
//         }

//         var r = sum / (n + k);

//         if (r > bestR) {
//             bestR = r;
//             bestK = k;
//         }

//         if (r > 0.9) {
//             // Let's assume that this is good enough and stop right here
//             break;
//         }
//     }

//     if (bestR > 0.0025) {
//         // The period (in frames) of the fundamental frequency is 'bestK'. Getting the frequency from there is trivial.
//         var fundamentalFreq = sampleRate / bestK;
//         return fundamentalFreq;
//     } else {
//         // We haven't found a good correlation
//         return -1;
//     }
// };


// const detectPitch = (buffer, audioContext) => {
//     // var buffer = new Uint8Array(analyserAudioNode.fftSize);
//     // // See initializations in the AudioContent and AnalyserNode sections of the demo.
//     // analyserAudioNode.getByteTimeDomainData(buffer);
//     var fundalmentalFreq = findFundamentalFreq(buffer, audioContext.sampleRate);
//     if (fundalmentalFreq !== -1) {
//         var note = findClosestNote(fundalmentalFreq, notesArray); // See the 'Finding the right note' section.
//         // var cents = findCentsOffPitch(fundalmentalFreq, note.frequency); // See the 'Calculating the cents off pitch' section.
//         // updateNote(note.note); // Function that updates the note on the page (see demo source code).
//         return note.note;
//         // updateCents(cents); // Function that updates the cents on the page and the gauge control (see demo source code).
//     }
//     //  else {
//     //     updateNote('--');
//     //     updateCents(-50);
//     // }
// };

// 'notes' is an array of objects like { note: 'A4', frequency: 440 }.
// See initialization in the source code of the demo
const findClosestNote = (freq) => {
    // Use binary search to find the closest note
    var low = -1, high = notes.length;
    while (high - low > 1) {
        var pivot = Math.round((low + high) / 2);
        if (notes[pivot].frequency <= freq) {
            low = pivot;
        } else {
            high = pivot;
        }
    }

    if (Math.abs(notes[high].frequency - freq) <= Math.abs(notes[low].frequency - freq)) {
        // notes[high] is closer to the frequency we found
        return notes[high];
    }

    return notes[low];
};

for (const el of audioElements) {
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

        analyser.getByteTimeDomainData(dataArray);
        if (audioElement.id === 'bass') {
            const pitch = detectPitch(dataArray, audioCtx);
        }

        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.font = '30px Arial';
        canvasCtx.fillStyle = "rgb(0, 0, 200)";
        canvasCtx.fillText(audioElement.id, 30, 30);
        // canvasCtx.fillText(note, 150, 150);
    };


    draw();
}


const notes = [
    {
        "note": "C0",
        "frequency": 16.35
    },
    {
        "note": "C#0",
        "frequency": 17.32
    },
    {
        "note": "D0",
        "frequency": 18.35
    },
    {
        "note": "D#0",
        "frequency": 19.45
    },
    {
        "note": "E0",
        "frequency": 20.6
    },
    {
        "note": "F0",
        "frequency": 21.83
    },
    {
        "note": "F#0",
        "frequency": 23.12
    },
    {
        "note": "G0",
        "frequency": 24.5
    },
    {
        "note": "G#0",
        "frequency": 25.96
    },
    {
        "note": "A0",
        "frequency": 27.5
    },
    {
        "note": "A#0",
        "frequency": 29.14
    },
    {
        "note": "B0",
        "frequency": 30.87
    },
    {
        "note": "C1",
        "frequency": 32.7
    },
    {
        "note": "C#1",
        "frequency": 34.65
    },
    {
        "note": "D1",
        "frequency": 36.71
    },
    {
        "note": "D#1",
        "frequency": 38.89
    },
    {
        "note": "E1",
        "frequency": 41.2
    },
    {
        "note": "F1",
        "frequency": 43.65
    },
    {
        "note": "F#1",
        "frequency": 46.25
    },
    {
        "note": "G1",
        "frequency": 49
    },
    {
        "note": "G#1",
        "frequency": 51.91
    },
    {
        "note": "A1",
        "frequency": 55
    },
    {
        "note": "A#1",
        "frequency": 58.27
    },
    {
        "note": "B1",
        "frequency": 61.74
    },
    {
        "note": "C2",
        "frequency": 65.41
    },
    {
        "note": "C#2",
        "frequency": 69.3
    },
    {
        "note": "D2",
        "frequency": 73.42
    },
    {
        "note": "D#2",
        "frequency": 77.78
    },
    {
        "note": "E2",
        "frequency": 82.41
    },
    {
        "note": "F2",
        "frequency": 87.31
    },
    {
        "note": "F#2",
        "frequency": 92.5
    },
    {
        "note": "G2",
        "frequency": 98
    },
    {
        "note": "G#2",
        "frequency": 103.83
    },
    {
        "note": "A2",
        "frequency": 110
    },
    {
        "note": "A#2",
        "frequency": 116.54
    },
    {
        "note": "B2",
        "frequency": 123.47
    },
    {
        "note": "C3",
        "frequency": 130.81
    },
    {
        "note": "C#3",
        "frequency": 138.59
    },
    {
        "note": "D3",
        "frequency": 146.83
    },
    {
        "note": "D#3",
        "frequency": 155.56
    },
    {
        "note": "E3",
        "frequency": 164.81
    },
    {
        "note": "F3",
        "frequency": 174.61
    },
    {
        "note": "F#3",
        "frequency": 185
    },
    {
        "note": "G3",
        "frequency": 196
    },
    {
        "note": "G#3",
        "frequency": 207.65
    },
    {
        "note": "A3",
        "frequency": 220
    },
    {
        "note": "A#3",
        "frequency": 233.08
    },
    {
        "note": "B3",
        "frequency": 246.94
    },
    {
        "note": "C4",
        "frequency": 261.63
    },
    {
        "note": "C#4",
        "frequency": 277.18
    },
    {
        "note": "D4",
        "frequency": 293.66
    },
    {
        "note": "D#4",
        "frequency": 311.13
    },
    {
        "note": "E4",
        "frequency": 329.63
    },
    {
        "note": "F4",
        "frequency": 349.23
    },
    {
        "note": "F#4",
        "frequency": 369.99
    },
    {
        "note": "G4",
        "frequency": 392
    },
    {
        "note": "G#4",
        "frequency": 415.3
    },
    {
        "note": "A4",
        "frequency": 440
    },
    {
        "note": "A#4",
        "frequency": 466.16
    },
    {
        "note": "B4",
        "frequency": 493.88
    },
    {
        "note": "C5",
        "frequency": 523.25
    },
    {
        "note": "C#5",
        "frequency": 554.37
    },
    {
        "note": "D5",
        "frequency": 587.33
    },
    {
        "note": "D#5",
        "frequency": 622.25
    },
    {
        "note": "E5",
        "frequency": 659.25
    },
    {
        "note": "F5",
        "frequency": 698.46
    },
    {
        "note": "F#5",
        "frequency": 739.99
    },
    {
        "note": "G5",
        "frequency": 783.99
    },
    {
        "note": "G#5",
        "frequency": 830.61
    },
    {
        "note": "A5",
        "frequency": 880
    },
    {
        "note": "A#5",
        "frequency": 932.33
    },
    {
        "note": "B5",
        "frequency": 987.77
    },
    {
        "note": "C6",
        "frequency": 1046.5
    },
    {
        "note": "C#6",
        "frequency": 1108.73
    },
    {
        "note": "D6",
        "frequency": 1174.66
    },
    {
        "note": "D#6",
        "frequency": 1244.51
    },
    {
        "note": "E6",
        "frequency": 1318.51
    },
    {
        "note": "F6",
        "frequency": 1396.91
    },
    {
        "note": "F#6",
        "frequency": 1479.98
    },
    {
        "note": "G6",
        "frequency": 1567.98
    },
    {
        "note": "G#6",
        "frequency": 1661.22
    },
    {
        "note": "A6",
        "frequency": 1760
    },
    {
        "note": "A#6",
        "frequency": 1864.66
    },
    {
        "note": "B6",
        "frequency": 1975.53
    },
    {
        "note": "C7",
        "frequency": 2093
    },
    {
        "note": "C#7",
        "frequency": 2217.46
    },
    {
        "note": "D7",
        "frequency": 2349.32
    },
    {
        "note": "D#7",
        "frequency": 2489.02
    },
    {
        "note": "E7",
        "frequency": 2637.02
    },
    {
        "note": "F7",
        "frequency": 2793.83
    },
    {
        "note": "F#7",
        "frequency": 2959.96
    },
    {
        "note": "G7",
        "frequency": 3135.96
    },
    {
        "note": "G#7",
        "frequency": 3322.44
    },
    {
        "note": "A7",
        "frequency": 3520
    },
    {
        "note": "A#7",
        "frequency": 3729.31
    },
    {
        "note": "B7",
        "frequency": 3951.07
    },
    {
        "note": "C8",
        "frequency": 4186.01
    },
    {
        "note": "C#8",
        "frequency": 4434.92
    },
    {
        "note": "D8",
        "frequency": 4698.63
    },
    {
        "note": "D#8",
        "frequency": 4978.03
    },
    {
        "note": "E8",
        "frequency": 5274.04
    },
    {
        "note": "F8",
        "frequency": 5587.65
    },
    {
        "note": "F#8",
        "frequency": 5919.91
    },
    {
        "note": "G8",
        "frequency": 6271.93
    },
    {
        "note": "G#8",
        "frequency": 6644.88
    },
    {
        "note": "A8",
        "frequency": 7040
    },
    {
        "note": "A#8",
        "frequency": 7458.62
    },
    {
        "note": "B8",
        "frequency": 7902.13
    }
];
