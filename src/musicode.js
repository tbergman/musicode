// musicode rocks \m/

(function () {
    // tie & rest notation
    var tie = '~';
    var rest = '0';

    // Global audio context
    var audioContext = getAudioContext();

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback){
                return window.setTimeout(callback, 1000 / 60);
            };
    })();

    var Musicode = function (opts) {
        opts = opts || {};

        this.music = opts.music || '';
        this.notes = opts.notes || Musicode.getNotes(this.music);

        // Tempo (in beats per minute)
        this.tempo = opts.tempo || 120;
        this.volume = opts.volume || 0.5;

        // Guitar rocks \m/
        this.capo = parseInt(opts.capo) || 0;

        // How frequently to call scheduling function
        this.interval = opts.interval || 25.0;

        // How far ahead to schedule audio (sec)
        this.lookAhead = opts.lookAhead || 0.1;

        // Play delay time
        this.playDelay = opts.playDelay || 0.3;

        // Extra duration for every note
        this.noteSustain = opts.noteSustain || 0.5;

        // Keyboard binding
        this.keyboard = opts.keyboard || null;

        // How far ahead to let the key up
        this.keyUpAhead = opts.keyUpAhead || 0.1;

        // Audio buffers
        this.audioBuffers = opts.audioBuffers || getAudioBuffers();

        // Current play index
        this.playIndex = 0;

        // Current scheduled index
        this.scheduledIndex = 0;

        // Scheduled notes
        this.notesQueue = [];

        // Current draw index
        this.drawIndex = 0;
        this.animationId = 0;

        initTimer.call(this);
    };

    /**
     * Music play
     */
    Musicode.prototype.play = function () {
        this.lastNoteStopTime = audioContext.currentTime + this.playDelay;
        this.timer.postMessage('start');
        playKeyboard.call(this);
        this.playCallback();
    };

    /**
     * Music stop
     */
    Musicode.prototype.pause = function () {
        this.timer.postMessage('stop');
        for (var i = 0; i < this.notesQueue.length; i++) {
            this.notesQueue[i].stop(0);
        }
        this.scheduledIndex = this.playIndex;
        this.pauseCallback();
    };

    /**
     * Music stop
     */
    Musicode.prototype.stop = function () {
        this.timer.postMessage('stop');
        stopKeyboard.call(this);
        for (var i = 0; i < this.notesQueue.length; i++) {
            this.notesQueue[i].stop(0);
        }
        this.playIndex = 0;
        this.scheduledIndex = 0;
        this.notesQueue = [];
        this.stopCallback();
    };

    /**
     * Set tempo
     *
     * @param {int|string} tempo
     */
    Musicode.prototype.setTempo = function (tempo) {
        this.tempo = parseInt(tempo);
    };

    /**
     * Set volume
     *
     * @param {number|string} volume
     */
    Musicode.prototype.setVolume = function (volume) {
        this.volume = parseFloat(volume);
    };

    /**
     * Set Capo
     *
     * @param {int|string} capo
     */
    Musicode.prototype.setCapo = function (capo) {
        this.capo = parseInt(capo);
    };

    /**
     * Play call back
     */
    Musicode.prototype.playCallback = function () {};

    /**
     * Pause call back
     */
    Musicode.prototype.pauseCallback = function () {};

    /**
     * Stop call back
     */
    Musicode.prototype.stopCallback = function () {};

    /**
     * Check standard notation
     *
     * @param {string} music
     * @returns {boolean}
     */
    Musicode.isStandardNotation = function (music) {
        return /[CDEFGAB]+/.test(music);
    };

    /**
     * Change notation
     *
     * @param {string} music
     * @param callback
     * @returns {string}
     */
    Musicode.changeNotation = function (music, callback) {
        var rows = music.split('\n');
        var ignore = false;

        for (var i = 0; i < rows.length; i++) {
            if (rows[i].trim()) {
                if (!ignore) {
                    var cols = rows[i].split(' ');

                    for (var j = 0; j < cols.length; j++) {
                        if (isNote(cols[j])) {
                            cols[j] = callback(cols[j]);
                        }
                    }

                    rows[i] = cols.join(' ');
                }
                ignore = !ignore;
            }
        }

        return rows.join('\n');
    };

    /**
     * Standard Notation to Numbered notation
     *
     * @param {string} music
     */
    Musicode.toNumberedNotation = function (music) {
        return Musicode.changeNotation(music, toNumberedNote);
    };

    /**
     * Numbered notation to Standard Notation
     *
     * @param {string} music
     */
    Musicode.toStandardNotation = function (music) {
        return Musicode.changeNotation(music, toStandardNote);
    };

    /**
     * Get note objects from music
     *
     * @param {string} music
     * @returns {Array}
     */
    Musicode.getNotes = function (music) {
        if (!Musicode.isStandardNotation(music)) {
            music = Musicode.toStandardNotation(music);
        }

        var notes = [];
        var rows = music.trim().split('\n');

        for (var i = 0; i < rows.length; i++) {
            if (rows[i].trim()) {
                var values = rows[i].trim().split(/[\s,]+/);
                while (rows[++i].trim() == '') {}
                var durations = rows[i].trim().split(/[\s,]+/);

                for (var j = 0; j < values.length; j++) {
                    var val = values[j];
                    var dur = durations[j];

                    while (j + 1 < values.length && values[j + 1] == tie) {
                        dur += ',' + durations[++j];
                    }

                    notes.push({val: val, dur: dur})
                }
            }
        }

        return notes;
    };

    /**
     * Format notation to the following style
     *
     * Standard Notation:
     *     C4 E4 G5
     *     4  4  4
     *
     * Numbered Notation:
     *     1 ..1 1.. .1#
     *     4   4 4    4
     *
     * @param {string} music
     * @param {string} separator
     * @returns {string}
     */
    Musicode.format = function (music, separator) {
        if (!separator) {
            separator = ' ';
        }

        var rows = getMusicRows(music);
        var sentences = [];

        for (var i = 0; i < rows.length; i+=2) {
            for (var j = 0; j < rows[i].length; j++) {
                var result = colAlign(rows[i][j], rows[i + 1][j]);

                rows[i][j] = result[0];
                rows[i + 1][j] = result[1];
            }

            // join and trim right
            rows[i] = rows[i].join(separator).replace(/\s+$/, '');
            rows[i + 1] = rows[i + 1].join(separator).replace(/\s+$/, '');

            sentences.push(rows[i] + '\n' + rows[i + 1]);
        }

        return sentences.join('\n\n');
    };

    /**
     * Update play index when playing the music
     */
    function updatePlayIndex() {
        if (this.playIndex < this.notesQueue.length) {
            var currentNote = this.notesQueue[this.playIndex];
            if (currentNote.startTime >= audioContext.currentTime) {
                this.playIndex++;
            }
        }
    }

    /**
     * Schedule note: http://www.html5rocks.com/en/tutorials/audio/scheduling/
     */
    function schedule() {
        while (this.scheduledIndex < this.notes.length) {
            var note = this.notes[this.scheduledIndex];
            var startTime = this.lastNoteStopTime;
            var stopTime = startTime + getDurSeconds.call(this, note.dur);

            if (audioContext.currentTime + this.lookAhead >= startTime) {
                addNote.call(this, note, startTime, stopTime);
                this.lastNoteStopTime = stopTime;
                this.scheduledIndex++;
            } else {
                break;
            }
        }

        if (this.scheduledIndex >= this.notes.length) {
            var endTime = this.lastNoteStopTime + this.noteSustain;
            if (audioContext.currentTime >= endTime) {
                this.stop();
            }
        }
    }

    /**
     * Add note
     *
     * @param note
     * @param startTime
     * @param stopTime
     */
    function addNote(note, startTime, stopTime) {
        var gainNote = audioContext.createGain();
        var volume = note.val == rest ? 0 : this.volume;

        gainNote.connect(audioContext.destination);
        gainNote.gain.linearRampToValueAtTime(volume, startTime);
        gainNote.gain.linearRampToValueAtTime(0, stopTime + this.noteSustain);

        var source = audioContext.createBufferSource();

        if (note.val != rest) {
            var index = Synth.getNoteIndex(note.val) + this.capo;
            source.buffer = this.audioBuffers[Synth.getIndexNote(index)];
        }

        source.connect(gainNote);
        source.start(startTime);
        source.stop(stopTime + this.noteSustain);

        source.noteVal = note.val;
        source.startTime = startTime;
        source.stopTime = stopTime;

        this.notesQueue.push(source);
    }

    /**
     * Get duration seconds
     *
     * @param dur
     * @returns {number}
     */
    function getDurSeconds(dur) {
        if (isNaN(dur)) {
            var total = 0;
            var durArr = dur.split(',');
            for (var i = 0; i < durArr.length; i++) {
                total += getDurSeconds.call(this, durArr[i]);
            }
            return total;
        } else {
            return 4 / dur * 60.0 / this.tempo;
        }
    }

    /**
     * Play keyboard
     */
    function playKeyboard() {
        if (this.keyboard) {
            var self = this;
            requestAnimFrame(function () { draw.call(self); });
        }
    }

    /**
     * Stop keyboard
     */
    function stopKeyboard() {
        if (this.keyboard) {
            cancelAnimationFrame(this.animationId);
            for (var i = 0; i < this.notesQueue.length; i++) {
                this.keyboard.setKeyUpStyle(this.notesQueue[i].noteVal);
            }
        }
    }

    /**
     * Draw key up and key down
     */
    function draw() {
        var currentTime = audioContext.currentTime;

        if (this.drawIndex < this.notesQueue.length) {
            var curNote = this.notesQueue[this.drawIndex];

            if (curNote.startTime < currentTime + this.keyUpAhead) {
                if (this.drawIndex > 0) {
                    var lastNote = this.notesQueue[this.drawIndex - 1];
                    this.keyboard.setKeyUpStyle(lastNote.noteVal);
                }
            }

            if (curNote.startTime < currentTime) {
                this.keyboard.setKeyDownStyle(curNote.noteVal);
                this.drawIndex++;
            }
        }

        // set up to draw again
        var self = this;
        this.animationId = requestAnimFrame(function () { draw.call(self); });
    }

    /**
     * Set timer worker
     */
    function initTimer() {
        var self = this;
        this.timer = new Worker('src/timer.js');
        this.timer.postMessage({interval: this.interval});
        this.timer.onmessage = function (e) {
            if (e.data == 'tick') {
                schedule.call(self);
                updatePlayIndex.call(self);
            } else {
                console.log("message: " + e.data);
            }
        }
    }

    /**
     * Check note
     *
     * @param note
     * @returns {boolean}
     */
    function isNote(note) {
        note = note.trim();
        return note && note != rest && note != tie;
    }

    /**
     * Numbered note to standard note: (1 => C4) (1. => C5) (.1 => C3)
     *
     * @param note
     * @returns {string}
     */
    function toStandardNote(note) {
        note = note.toString().trim();

        var dotLen = 0;
        var num = note.replace(/[^\d]/g, '');
        var middle = note.replace(/[^#b]/g, '');

        if (note.charAt(0) == '.') {
            dotLen = -(note.split('.').length - 1);
        } else if (note.charAt(note.length - 1) == '.') {
            dotLen = note.split('.').length - 1;
        }

        var table = {1: 'C', 2: 'D', 3: 'E', 4: 'F', 5: 'G', 6: 'A', 7: 'B'};

        return table[num] + middle + (4 + dotLen);
    }

    /**
     * Standard note to numbered note: (C4 => 1) (C5 => 1.) (C3 => .1)
     *
     * @param note
     * @returns {string}
     */
    function toNumberedNote(note) {
        note = note.trim();

        var letter = note.slice(0, 1);
        var octave = parseInt(note.slice(-1));
        var middle = note.length > 2 ? note.slice(1, -1) : '';

        var dotLen = octave - 4;
        var dotStr = new Array(Math.abs(dotLen) + 1).join('.');
        var num = {C: 1, D: 2, E: 3, F: 4, G: 5, A: 6, B: 7}[letter];

        return dotLen < 0 ? dotStr + num + middle : num + middle + dotStr;
    }

    /**
     * Get rows from music (remove blank line)
     *
     * @param music
     * @returns {Array}
     */
    function getMusicRows(music) {
        var rows = [];
        music.trim().split('\n').forEach(function (row) {
            row = row.trim();
            if (row) {
                rows.push(row.split(/[\s,]+/));
            }
        });
        return rows;
    }

    /**
     * Col align
     *
     * @param a
     * @param b
     * @returns {*[]}
     */
    function colAlign(a, b) {
        var difLen = Math.abs(a.length - b.length);
        var spaces = new Array(difLen + 1).join(' ');

        if (a.length > b.length) {
            if (a.charAt(0) == '.') {
                if (b.length == 1 && /[#b]/.test(a)) {
                    b = spaces.slice(0, -1) + b + ' ';
                } else {
                    b = spaces + b;
                }
            } else {
                b = b + spaces;
            }
        } else if (a.length < b.length) {
            a = a + spaces
        }

        return [a, b];
    }

    this.Musicode = Musicode;
})();
