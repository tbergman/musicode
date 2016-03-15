// keyboard rocks \m/

(function () {
    // Tuning: Guitar & Ukulele
    var guitar = {1: 'E4', q: 'B3', a: 'G3', z: 'D3'};
    var ukulele = {1: 'A4', q: 'E4', a: 'C4', z: 'G4'};

    // Keyboard string mapping
    var strings = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
    ];

    var Keyboard = function (opts) {
        opts = opts || {};

        this.id = opts.id || 'keyboard';
        this.width = opts.width || 1000;
        this.height = opts.height || 150;
        this.startNote = opts.startNote || 'C3';
        this.stopNote = opts.stopNote || 'C6';
        this.whiteKeyColor = opts.whiteKeyColor || 'white';
        this.blackKeyColor = opts.blackKeyColor || 'black';
        this.whiteKeyDownColor = opts.whiteKeyDownColor || '#eee';
        this.blackKeyDownColor = opts.blackKeyDownColor || '#555';
        this.borderColor = opts.borderColor || '#000';
        this.blackKeyWidthScale = opts.blackKeyWidthScale || 0.6;
        this.blackKeyHeightScale = opts.blackKeyHeightScale || 0.6;
        this.whiteKeyBorderRadius = opts.whiteKeyBorderRadius || 5;
        this.blackKeyBorderRadius = opts.blackKeyBorderRadius || 5;
        this.tuning = opts.tuning || guitar || ukulele;
        this.capo = opts.capo || 0;

        this.mouseDown = false;
        this.keysDown = {};
        this.keyboard = opts.keyboard || document.getElementById(this.id);

        initKeyMap.call(this);
        initProperty.call(this);
    };

    /**
     * Draw the keyboard
     */
    Keyboard.prototype.draw = function () {
        setContainerStyle.call(this);

        var whiteKeyNum = 0;
        var startIndex = Synth.getNoteIndex(this.startNote);
        var stopIndex = Synth.getNoteIndex(this.stopNote);

        for (var i = startIndex; i <= stopIndex; i++) {
            var note = Synth.getIndexNote(i);

            if (Keyboard.isWhiteKey(note)) {
                this.keyboard.appendChild(createWhiteKey.call(this, note));
                whiteKeyNum++;
            } else {
                this.keyboard.appendChild(
                    createBlackKey.call(this, note, whiteKeyNum)
                );
            }
        }

        addListener.call(this);
    };

    /**
     * Set capo
     *
     * @param {int|string} val
     */
    Keyboard.prototype.setCapo = function (val) {
        this.capo = parseInt(val);
        initKeyMap.call(this);
    };

    /**
     * Set key down style
     *
     * @param {string} id
     */
    Keyboard.prototype.setKeyDownStyle = function (id) {
        var key = document.getElementById(id);

        if (key) {
            if (Keyboard.isWhiteKey(key.title)) {
                key.style.background = this.whiteKeyDownColor;
            } else {
                key.style.background = this.blackKeyDownColor;
            }
        }
    };

    /**
     * Set key up style
     *
     * @param {string} id
     */
    Keyboard.prototype.setKeyUpStyle = function (id) {
        var key = document.getElementById(id);

        if (key) {
            if (Keyboard.isWhiteKey(key.title)) {
                key.style.background = this.whiteKeyColor;
            } else {
                key.style.background = this.blackKeyColor;
            }
        }
    };

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
    Keyboard.isWhiteKey = function (note) {
        if (isNaN(note)) {
            return note.length == 2
                || note.indexOf('B#') != -1 || note.indexOf('Cb') != -1
                || note.indexOf('E#') != -1 || note.indexOf('Fb') != -1;
        } else {
            return Keyboard.isWhiteKey(Synth.getIndexNote(note));
        }
    };

    /**
     * Init key mapping
     */
    function initKeyMap() {
        this.keyMap = {};

        for (var i = 0; i < strings.length; i++) {
            var frets = strings[i];
            var base = Synth.getNoteIndex(this.tuning[frets[0]]) + this.capo;

            for(var j = 0; j < frets.length; j++) {
                this.keyMap[frets[j]] = Synth.getIndexNote(base + j);
            }
        }
    }

    /**
     * Init property
     */
    function initProperty() {
        var whiteKeyNum = 0;
        var blackKeyNum = 0;
        var startIndex = Synth.getNoteIndex(this.startNote);
        var stopIndex = Synth.getNoteIndex(this.stopNote);

        for (var i = startIndex; i <= stopIndex; i++) {
            if (Keyboard.isWhiteKey(i)) {
                whiteKeyNum++;
            } else {
                blackKeyNum++;
            }
        }

        this.whiteKeyWidth = (this.width - whiteKeyNum - 1) / whiteKeyNum;
        this.blackKeyWidth = this.whiteKeyWidth * this.blackKeyWidthScale;
        this.blackKeyHeight = this.height * this.blackKeyHeightScale;

        var lastNoteIndex = Synth.getNoteIndex(this.stopNote) - 1;

        if (Keyboard.isWhiteKey(this.stopNote)) {
            this.lastWhiteNote = this.stopNote;
        } else {
            this.lastWhiteNote = Synth.getIndexNote(lastNoteIndex)
        }
    }

    /**
     * Set container style
     */
    function setContainerStyle() {
        this.keyboard.style.width = this.width + 'px';
        this.keyboard.style.height = this.height + 'px';
        this.keyboard.style.position = 'relative';
    }

    /**
     * Check modifier key
     *
     * @param key
     * @returns {boolean}
     */
    function isModifierKey(key) {
        return key.ctrlKey ||  key.metaKey || key.altKey;
    }

    /**
     * Get char from char code
     *
     * @param charCode
     * @returns {*|string}
     */
    function getCharFromCode(charCode) {
        var dict = {
            189: '-', 187: '=', 219: '[', 221: ']',
            186: ';', 222: "'", 188: ',', 190: '.', 191: '/'
        };

        return dict[charCode] || String.fromCharCode(charCode).toLowerCase();
    }

    /**
     * Check if body active
     *
     * @returns {boolean}
     */
    function bodyActive() {
        return document.activeElement.tagName.toLowerCase() == 'body';
    }

    /**
     * Add listener
     */
    function addListener() {
        var self = this;

        window.addEventListener('keydown', function (key) {
            var c = getCharFromCode(key.keyCode);

            if (bodyActive() && !isModifierKey(key) &&
                c in self.keyMap && !self.keysDown[c]) {
                var note = self.keyMap[c];
                self.setKeyDownStyle(note);
                self.keysDown[c] = true;
                self.keyDownCallback(note);
            }
        });

        window.addEventListener('keyup', function (key) {
            var c = getCharFromCode(key.keyCode);

            if (bodyActive() && !isModifierKey(key) && c in self.keyMap) {
                var note = self.keyMap[c];
                self.setKeyUpStyle(note);
                self.keyUpCallback(note);
                delete self.keysDown[c];
            }
        });

        this.keyboard.addEventListener('mousedown', function (event) {
            self.mouseDown = true;
            self.setKeyDownStyle(event.target.title);
            self.keyDownCallback(event.target.title);
        });

        this.keyboard.addEventListener('mouseup', function (event) {
            self.mouseDown = false;
            self.setKeyUpStyle(event.target.title);
            self.keyUpCallback(event.target.title);
        });

        this.keyboard.addEventListener('mouseover', function (event) {
            if (self.mouseDown) {
                self.setKeyDownStyle(event.target.title);
                self.keyDownCallback(event.target.title);
            }
        });

        this.keyboard.addEventListener('mouseout', function (event) {
            if (self.mouseDown) {
                self.setKeyUpStyle(event.target.title);
                self.keyUpCallback(event.target.title);
            }
        });
    }

    /**
     * Create white key
     *
     * @param {string} note
     * @returns {Element}
     */
    function createWhiteKey(note) {
        var key = document.createElement('div');

        key.id = note;
        key.title = note;

        setWhiteKeyStyle.call(this, key);

        return key;
    }

    /**
     * Create black key
     *
     * @param {string} note
     * @param {int} whiteKeyNum
     * @returns {Element}
     */
    function createBlackKey(note, whiteKeyNum) {
        var key = document.createElement('div');

        key.id = note;
        key.title = note;

        setBlackKeyStyle.call(this, key, whiteKeyNum);

        return key;
    }

    /**
     * Set white key style
     *
     * @param {Element} key
     */
    function setWhiteKeyStyle(key) {
        var radius = this.whiteKeyBorderRadius;

        key.style.width = this.whiteKeyWidth + 'px';
        key.style.height = this.height + 'px';
        key.style.background = this.whiteKeyColor;
        key.style.float = 'left';
        key.style.border = '1px solid ' + this.borderColor;
        key.style.borderRadius = '0 0 ' + radius + 'px ' + radius + 'px';

        // overwrite bootstrap box-sizing
        key.style.boxSizing = 'content-box';

        key.style['-webkit-user-select'] = 'none';

        if (key.title != this.lastWhiteNote) {
            key.style.borderRight = 'none';
        }
    }

    /**
     * Set black key style
     *
     * @param {Element} key
     * @param {int} whiteKeyNum
     */
    function setBlackKeyStyle(key, whiteKeyNum) {
        var radius = this.blackKeyBorderRadius;

        if (key.title == this.startNote) {
            key.style.width = this.blackKeyWidth / 2 + 'px';
            key.style.borderRadius = '0 0 ' + radius + 'px 0';
        } else if (key.title == this.stopNote) {
            key.style.width = this.blackKeyWidth / 2 + 'px';
            key.style.borderRadius = '0 0 0 ' + radius + 'px';
        } else {
            key.style.width = this.blackKeyWidth + 'px';
            key.style.borderRadius = '0 0 ' + radius + 'px ' + radius + 'px';
        }

        key.style['-webkit-user-select'] = 'none';
        key.style.height = this.blackKeyHeight + 'px';
        key.style.background = this.blackKeyColor;

        key.style.position = 'absolute';
        var wkn = whiteKeyNum;
        var wkw = this.whiteKeyWidth;
        var bkw = this.blackKeyWidth;

        if (key.title != this.startNote) {
            key.style.left = wkn * wkw - (bkw / 2) + wkn + 'px';
        }
    }

    Keyboard.guitar = guitar;
    Keyboard.ukulele = ukulele;

    this.Keyboard = Keyboard;
})();
