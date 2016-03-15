Musicode
========

Music notation rock by Web Audio API.
[http://musicode.rocks](http://musicode.rocks) \m/

Preface
-------

We are not going to invent another music notation.
We can't.
But if you want to play a simple melody or a simple bass,
we are here for you.
All you need to do is pick a browser which supports Web Audio API.

Music Notation
--------------

C4 is middle C, ~ is tie, 0 is rest, 4 is quarter note.

```
E4 D4 C4 B3 
4  4  4  4  

A3 G3 A3 B3 C4 ~ 0
4  4  4  4  2  2 2
```

We also support numbered notation. (1=C4, 1.=C5, .1=C3)

```
3 2 1 .7
4 4 4  4  

.6 .5 .6 .7 1 ~ 0
 4  4  4  4 2 2 2
```

Sharp & Flat

```
C#4 Cb4 1# 1b
```

That's all, no more no less and even no quick start here.

Rock Start
----------

Add a keyboard. (optional)

```html
<div id="keyboard"></div>
```

Include dependencies.

```js
<script src="webaudio.js"></script>
<script src="synth.js"></script>
<script src="keyboard.js"></script>
<script src="musicode.js"></script>
```

New a melody and bind it to the keyboard.

```js
var audioContext = getAudioContext();
var audioBuffers = getAudioBuffers();

var keyboard = new Keyboard();

keyboard.draw();

keyboard.keyDownCallback = function (note) {
    console.log('key down: ' + note);
    
    var gainNote = audioContext.createGain();
    gainNote.connect(audioContext.destination);
    
    // fade out
    gainNote.gain.linearRampToValueAtTime(1.0, audioContext.currentTime);
    gainNote.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
    
    var source = audioContext.createBufferSource();
    
    source.buffer = audioBuffers[note];
    source.connect(gainNote);
    
    source.start(audioContext.currentTime);
    source.stop(audioContext.currentTime + 1);
};

keyboard.keyUpCallback = function (note) {
    console.log('key up: ' + note);
};

// Canon in C
var music = [
    'G4 E4 F4 G4',
    '4  8  8  4',
    'E4 F4 G4 G3 A3 B3 C4 D4 E4 F4 E4 C4 D4 E4',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'E3 F3 G3 A3 G3 F3 G3 E3 F3 G3 F3 A3 G3 F3',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'E3 D3 E3 D3 C3 D3 E3 F3 G3 A3 F3 A3 G3 A3',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'B3 C4 B3 A3 B3 C4 D4 E4 F4 G4 G4 E4 F4 G4',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'E4 F4 G4 B3 C4 D4 E4 D4 E4 F4 E4 C4 D4 E4',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'E3 F3 G3 A3 G3 F3 G3 C4 B3 C4 A3 C4 B3 A3',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'G3 F3 G3 F3 E3 F3 G3 C4 B3 C4 A3 C4 B3 C4',
    '8  8  8  8  8  8  8  8  8  8  4  8  8  4',
    'B3 C4 B3 A3 B3 C4 D4 C4 A3 B3 C4',
    '8  8  8  8  8  8  8  8  8  8  2'
].join('\n');

var melody = new Musicode({
    music: music,
    tempo: 120,
    volume: 1,
    keyboard: keyboard
});

melody.play();
```

synth.js
--------

Public methods.

```js
/**
* Get piano key index from note: A0 is 1, A4 is 49
*
* @param {string} note
* @returns {int}
*/
Synth.getNoteIndex = function (note) {}

/**
* Get note from piano key index: 1 is A, 40 is C4 or B#3
*
* @param {int|string} index
* @param k
* @returns {string}
*/
Synth.getIndexNote = function (index, k) {}

/**
* Get note/index frequency
*
* @param {string|int} note
* @returns {number}
*/
Synth.getNoteFreq = function (note) {}

/**
* Get audio buffer (Karplus-Strong Algorithm)
*
* @param {object} opts
* @returns {*}
*/
Synth.getAudioBuffer = function (opts) {}

/**
* Get audio buffers
*
* @param {boolean} returnList
* @returns {*}
*/
Synth.getAudioBuffers = function (returnList) {}

/**
* Set piano keys to buffers
*
* @param buffers
* @returns {{}}
*/
Synth.setPianoKeys = function (buffers) {}
```

Here, we also provide a global method to reuse the Audio Buffers.

```js
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
```

keyboard.js
-----------

Full options and default values.

```js
var keyboard = new Keyboard({
    id: 'keyboard',
    width: 1000,
    height: 150,
    startNote: 'C3',
    stopNote: 'C6',
    whiteKeyColor: 'white',
    blackKeyColor: 'black',
    whiteKeyDownColor: '#eee',
    blackKeyDownColor: '#555',
    borderColor: '#000',
    blackKeyWidthScale: 0.6,
    blackKeyHeightScale: 0.6,
    whiteKeyBorderRadius: 5,
    blackKeyBorderRadius: 5,
    tuning: {1: 'E4', q: 'B3', a: 'G3', z: 'D3'},
    capo: 0
});
```

Tuning & key mapping. (Guitar or Ukulele)

```js
var keyboard1 = new Keyboard({tuning: Keyboard.guitar, capo: 0});
var keyboard2 = new Keyboard({tuning: Keyboard.ukulele, capo: 0});
```

Public methods.

```js
/**
* Draw the keyboard
*/
Keyboard.prototype.draw = function () {}

/**
* Set capo
*
* @param {int|string} val
*/
Keyboard.prototype.setCapo = function (val) {};

/**
* Set key down style
*
* @param {string} id
*/
Keyboard.prototype.setKeyDownStyle = function (id) {}

/**
* Set key up style
*
* @param {string} id
*/
Keyboard.prototype.setKeyUpStyle = function (id) {}

/**
* Key down call back
*
* @param {string} note
*/
Keyboard.prototype.keyDownCallback = function (note) {};

/**
 * Key up call back
 *
 * @param {string} note
 */
Keyboard.prototype.keyUpCallback = function (note) {};

/**
* Check white key
*
* @param {string|int} note
* @returns {boolean}
*/
Keyboard.isWhiteKey = function (note) {}
```

musicode.js
-----------

Full options and default values.

```js
var melody = new Musicode({
    music: '',
    tempo: 120,
    volume: 0.5,
    capo: 0,
    interval: 25.0,
    lookAhead: 0.1,
    playDelay: 0.3,
    noteSustain: 0.5,
    keyboard: null,
    keyUpAhead: 0.1,
    audioBuffers: getAudioBuffers()
});

```

Public methods.

```js
/**
* Music play
*/
Musicode.prototype.play = function () {}

/**
* Music stop
*/
Musicode.prototype.pause = function () {}

/**
* Music stop
*/
Musicode.prototype.stop = function () {}

/**
* Set tempo
*
* @param {int|string} tempo
*/
Musicode.prototype.setTempo = function (tempo) {}

/**
* Set volume
*
* @param {number|string} volume
*/
Musicode.prototype.setVolume = function (volume) {}

/**
* Set Capo
*
* @param {int|string} capo
*/
Musicode.prototype.setCapo = function (capo) {}

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
Musicode.isStandardNotation = function (music) {}

/**
* Standard Notation to Numbered notation
*
* @param {string} music
*/
Musicode.toNumberedNotation = function (music) {}

/**
* Numbered notation to Standard Notation
*
* @param {string} music
*/
Musicode.toStandardNotation = function (music) {}

/**
* Get note objects from music
*
* @param {string} music
* @returns {Array}
*/
Musicode.getNotes = function (music) {}

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
Musicode.format = function (music, separator) {}
```

See Also
--------

Many codes and ideas come from these awesome articles and projects.

1. [http://amid.fish/karplus-strong/](http://amid.fish/karplus-strong/) (You can't miss it!)
2. [https://github.com/mrahtz/javascript-karplus-strong](https://github.com/mrahtz/javascript-karplus-strong)
3. [http://music.columbia.edu/cmc/MusicAndComputers/chapter4/04_09.php](http://music.columbia.edu/cmc/MusicAndComputers/chapter4/04_09.php)
4. [http://www.html5rocks.com/en/tutorials/audio/scheduling/](http://www.html5rocks.com/en/tutorials/audio/scheduling/)
5. [https://github.com/cwilso/metronome](https://github.com/cwilso/metronome)
6. [https://github.com/stuartmemo/qwerty-hancock](https://github.com/stuartmemo/qwerty-hancock)
7. [http://www.earslap.com/article/the-browser-sound-engine-behind-touch-pianist.html](http://www.earslap.com/article/the-browser-sound-engine-behind-touch-pianist.html)

The code is extremely readable, feel free to break anything. \m/
