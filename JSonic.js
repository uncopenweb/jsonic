/*
 * Copyright (c) 2010 Peter Parente based on Outfox
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
**/
dojo.provide('info.mindtrove.JSonic');
dojo.require('dijit._Widget');

dojo.declare('info.mindtrove.JSonic', dijit._Widget, {
    sayURI: dojo.moduleUrl('', ''),
    postMixInProperties: function() {
        // created audio channels
        this._channels = {};
        // cache of sounds and speech
        this._cache = new info.mindtrove.JSonicCache();
    },
    
    postCreate: function() {
        
    },
    
    /**
     * text, channel, name, cache
     */
    say: function(args) {
        args.method = '_say';
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * url, channel, name, cache
     */
    play: function(args) {
        args.method = '_play';
        this._getChannel(args.channel).push(args);
    },
    
    stop: function() {
        var args = {method: '_stop'};
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * name, value, channel, now
     */
    setProperty: function(args) {
        args.method = '_setProperty';
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * name, channel, now
     */
    getProperty: function(args) {
        args.method = '_getProperty';
        args.deferred = new dojo.Deferred();
        this._getChannel(args.channel).push(args);
        return args.deferred;
    },
    
    /**
     * channel
     */
    reset: function(args) {
        args = args || {};
        args.method = '_reset';
        this._getChannel(args.channel).push(args);
    },
    
    cacheSpeech: function(args) {
        
    },
    
    cacheSound: function(args) {
        
    },
    
    addObserver: function(func, channel, actions) {
        var ob = this._getChannel(channel).addObserver(func, actions);
        return [ob, channel];
    },
    
    removeObserver: function(token) {
        this._getChannel(token[1]).removeObserver(token[0]);
    },

    _getChannel: function(id) {
        id = id || 'default';
        var ch = this._channels[id];
        if(ch === undefined) {
            ch = new info.mindtrove.JSonicChannel({
                id : id, 
                sayURI: this.sayURI,
                cache : this._cache
            });
            this._channels[id] = ch;
        }
        return ch;
    }
});

dojo.declare('info.mindtrove.JSonicCache', dijit._Widget, {
    postMixInProperties: function() {
        // cache of speech utterances
        this._speechCache = {};
        // cache of sound utterances
        this._soundCache = {};
        // determine extension to use
        var node = dojo.create('audio');
        if(node.canPlayType('audio/ogg')) {
            this._ext = '.ogg';
        } else if(node.canPlayType('audio/mpeg')) {
            this._ext = '.mp3';
        } else if(node.canPlayType('audio/aac')) {
            this._ext = '.m4a';
        } else if(node.canPlayType('audio/wav')) {
            this._ext = '.wav';
        } else {
            throw new Error('no known media supported');
        }
    },
    
    getSound: function(args) {
        var audioNode = this._soundCache[args.url];
        if(audioNode) {
            return dojo.clone(audioNode);
        } else {
            var node = dojo.create('audio');
            node.autobuffer = true;
            node.src = args.url+this._ext;
            if(args.cache) {
                this._soundCache[args.url] = node;
            }
            return node;
        }
    },
    
    getSpeech: function(args, props) {
        
    }
});

dojo.declare('info.mindtrove.JSonicChannel', dijit._Widget, {
    cache: null,
    sayURI: null,
    postMixInProperties: function() {
        // current output, sound or speech
        this._kind = null;
        // optional name associated with current output
        this._name = null;
        // queue of commands to process
        this._queue = [];
        // busy processing a command or not
        this._busy = false;
        // observers of callbacks on this channel
        this._observers = [];
        // current channel properties
        this._properties = null;
        // current audio node using the channel
        this._audioNode = null;
        // callback tokens for the current audio node
        this._connects = [];
        // set default properties
        this._reset();
    },
    
    push: function(args) {
        if(args.method == '_play') {
            // pre-load sound
            args.audio = this.cache.getSound(args);
        } else if(args.method == '_say') {
            // pre-synth speech
            args.audio = this.cache.getSpeech(args);
        }
        this._queue.push(args);
        this._pump();
    },

    addObserver: function(func, actions) {
        var ob = {func : func, actions : actions};
        this._observers.push(ob);
        return ob;
    },

    removeObserver: function(ob) {
        var obs = this._observers;
        for(var i=0; i < obs.length; i++) {
            if(obs[i] == ob) {
                this._observers = obs.slice(0, i).concat(obs.slice(i+1));
                break;
            }
        }
    },
    
    _pump: function() {
        while(!this._busy && this._queue.length) {
            var args = this._queue.shift();
            this._name = args.name;
            this[args.method](args);
        }
    },
    
    _playAudioNode: function(node) {
        this._audioNode = node;
        this._audioNode.volume = this._properties.volume;
        this._audioNode.loop = this._properties.loop;
        this._connects[0] = dojo.connect(node, 'play', this, '_onStart');
        this._connects[1] = dojo.connect(node, 'ended', this, '_onEnd');
        this._audioNode.play();
    },
    
    _stopAudioNode: function() {
        this._audioNode.pause();
        dojo.forEach(this._connects, dojo.disconnect);
        this._connects = [];
        this._audioNode.loop = false;
        this._audioNode = null;
    },

    _say: function(args) {
        /*this._busy = true;
        this._kind = 'say';
        // @todo: need to base caching on other props too
        var response = this._utterances[args.utterance];
        if(response) {
            this._onSaySynth(args.utterance, response);
        } else {
            var request = {
                format : this._ext,
                utterances : {text : args.utterance},
                wpm: this._properties.rate,
                voice: this._properties.voice
            };
            // @todo: don't hard code say.php
            var args = {
                url : this.sayURI.uri+'say.php',
                handleAs: 'json',
                postData : dojo.toJson(request)
            };
            var def = dojo.xhrPost(args);
            def.addCallback(dojo.hitch(this, '_onSaySynth', args.utterance));
        }*/
    },
    
    _onSaySynth: function(utterance, response) {
        this._utterances[utterance] = response;
        this._audioNode.src = this.sayURI.uri+response.files.text;
        this._audioNode.load();
        this._audioNode.play();
    },
    
    _play: function(args) {
        this._busy = true;
        this._kind = 'play';
        var node = (args.audio) ? args.audio : this.cache.getSound(args);
        this._playAudioNode(node);
    },
    
    _stop: function(args) {
        this._stopAudioNode();
        this._queue = [];
        this._kind = null;
        this._name = null;
        this._busy = false;
    },
    
    _setProperty: function(args) {
        if(args.name == 'volume') {
            this._properties.volume = args.value;
        } else if(args.name == 'rate') {
            this._properties.rate = args.value;
        } else if(args.name == 'loop') {
            this._properties.loop = args.value;
        } else if(args.name == 'voice') {
            this._properties.voice = args.value;
        }
    },

    _getProperty: function(args) {
        var value = this._properties[args.name];
        args.deferred.callback(value);
    },
    
    _reset: function(args) {
        this._properties = {
            rate: 200,
            volume: 1.0,
            loop: false,
            voice: 'espeak.en-us'
        };
    },

    _notify: function(notice) {
        var obs = this._observers;
        for(var i=0; i < obs.length; i++) {
            var ob = obs[i];
            if(!ob.actions || dojo.indexOf(ob.actions, notice.action)) {
                try {
                    ob.func(notice);
                } catch(e) {
                    console.error(e.message);
                }
                
            }
        }
    },

    _onEnd: function(event) {
        var notice = {
            url : event.target.src,
            action : 'finished-'+this._kind, 
            channel : this.id,
            name : this._name
        };
        this._stopAudioNode();
        this._notify(notice);
        this._busy = false;
        this._name = null;
        this._pump();
    },
    
    _onStart: function(event) {
        var notice = {
            url : event.target.src,
            action : 'started-'+this._kind, 
            channel : this.id,
            name : this._name
        };
        this._notify(notice);
    }
});
