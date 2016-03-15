// synth rocks \m/

var Synth = {};

(function (Synth) {
    "use strict";

    // Global audio context
    var audioContext = getAudioContext();

    // letter => index
    var letterIndex = {
        'C': 1, 'D': 3, 'E': 5, 'F': 6, 'G': 8, 'A': 10, 'B': 12,
        'Cb': 0, 'Db': 2, 'Eb': 4, 'Fb': 5, 'Gb': 7, 'Ab': 9, 'Bb': 11,
        'C#': 2, 'D#': 4, 'E#': 6, 'F#': 7, 'G#': 9, 'A#': 11, 'B#': 13
    };

    // index => letters
    var indexLetter = {
        0: {'w': 'B', 'b': 'Cb'},
        1: {'w': 'C', '#': 'B#'},
        2: {'#': 'C#', 'b': 'Db'},
        3: {'w': 'D'},
        4: {'#': 'D#', 'b': 'Eb'},
        5: {'w': 'E', 'b': 'Fb'},
        6: {'w': 'F', '#': 'E#'},
        7: {'#': 'F#', 'b': 'Gb'},
        8: {'w': 'G'},
        9: {'#': 'G#', 'b': 'Ab'},
        10: {'w': 'A'},
        11: {'#': 'A#', 'b': 'Bb'}
    };

    /**
     * Get piano key index from note: A0 is 1, A4 is 49
     *
     * @param {string} note
     * @returns {int}
     */
    Synth.getNoteIndex = function (note) {
        // start from 1(A0)
        return 12 * note.slice(-1) + letterIndex[note.slice(0, -1)] - 9;
    };

    /**
     * Get note from piano key index: 1 is A, 40 is C4 or B#3
     *
     * @param {int|string} index
     * @param k
     * @returns {string}
     */
    Synth.getIndexNote = function (index, k) {
        index = parseInt(index);
        k = k || 'w';

        var i = (index + 9) % 12;
        var octave = Math.floor((index + 8) / 12);

        if (i == 1 && k == '#') {
            octave--;
        } else if (i == 0 && k == 'b') {
            octave++;
        } else if (!indexLetter[i][k]) {
            k = indexLetter[i]['w'] ? 'w' : indexLetter[i]['#'] ? '#' : 'b';
        }

        return indexLetter[i][k] + octave;
    };

    /**
     * Get note/index frequency
     *
     * @param {string|int} note
     * @returns {number}
     */
    Synth.getNoteFreq = function (note) {
        var index = isNaN(note) ? Synth.getNoteIndex(note) : note;
        var indexA4 = Synth.getNoteIndex('A4');
        return 440 * Math.pow(2, (index - indexA4) / 12);
    };

    /**
     * Get audio buffer (Karplus-Strong Algorithm)
     *
     * @param {object} opts
     * @returns {*}
     */
    Synth.getAudioBuffer = function (opts) {
        opts = opts || {};

        var note = opts.note || 'C4';
        var frequency = opts.frequency || Synth.getNoteFreq(note);
        var duration = opts.duration || 2;
        var channels = opts.channels || 1;
        var sampleRate = opts.sampleRate || audioContext.sampleRate;
        var smoothingFactor = opts.smoothingFactor || 0.5;

        var period = 1 / frequency;
        var periodSamples = Math.floor(period * sampleRate);

        var allSamples = duration * sampleRate;
        var buffer = audioContext.createBuffer(channels, allSamples, sampleRate);

        var curInput = 0;
        var curOutput = 0;
        var lastOutput = 0;
        var data = buffer.getChannelData(0);

        var whiteNoise = [];
        for (var i = 0; i < periodSamples; i++) {
            whiteNoise[i] = -1 + 2 * Math.random();
        }

        for (i = 0; i < data.length; i++) {
            if (i < periodSamples) {
                // first period: white noise
                data[i] = whiteNoise[i];
                continue;
            }

            // subsequent periods: low-pass filtered version of previous period

            // take sample from previous period
            curInput = data[i - periodSamples];
            // apply low-pass filter
            //lastOutput = curOutput; // I am not sure about this :(
            lastOutput = data[i - periodSamples + 1];
            curOutput = smoothingFactor * curInput + (1 - smoothingFactor) * lastOutput;
            data[i] = curOutput;
        }

        // fade tail to make end less abrupt
        var tailStart = Math.round(0.9 * data.length);
        var tailLen = data.length - tailStart + 1;

        for (i = data.length; i > tailStart; i--) {
            data[i] *= (data.length - i) / tailLen;
        }

        return buffer;
    };

    /**
     * Get audio buffers
     *
     * @param {boolean} returnList
     * @returns {*}
     */
    Synth.getAudioBuffers = function (returnList) {
        // start from 1
        var buffers = [0];

        for (var i = 1; i <= 88; i++) {
            buffers.push(Synth.getAudioBuffer({'note': i}));
        }

        returnList = returnList || false;

        return returnList ? buffers : Synth.setPianoKeys(buffers);
    };

    /**
     * Set piano keys to buffers
     *
     * @param buffers
     * @returns {{}}
     */
    Synth.setPianoKeys = function (buffers) {
        var piano = {};

        piano['A0'] = buffers[1];
        piano['A#0'] = buffers[2];
        piano['Bb0'] = buffers[2];
        piano['B0'] = buffers[3];
        piano['B#0'] = buffers[4];

        ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach(function (letter) {
            for (var i = 1; i < 8; i++) {
                ['', '#', 'b'].forEach(function (k) {
                    var note = letter + k + i;
                    piano[note] = buffers[Synth.getNoteIndex(note)];
                })
            }
        });

        piano['Cb8'] = buffers[87];
        piano['C8'] = buffers[88];

        return piano;
    };

})(Synth);

/**
 * Global audio buffers
 *
 * @returns {*}
 */
function getAudioBuffers() {
    if (!('localAudioBuffers' in window)) {
        window.localAudioBuffers = Synth.getAudioBuffers();
    }
    return window.localAudioBuffers;
}
