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
dojo.require("dojox.encoding.digests.MD5");

dojo.declare('info.mindtrove.JSonic', dijit._Widget, {
    sayURI: dojo.moduleUrl('', ''),
    postMixInProperties: function() {
        // created audio channels
        this._channels = {};
        // cache of sounds and speech
        this._cache = new info.mindtrove.JSonicCache({sayURI : this.sayURI});
    },
    
    postCreate: function() {
        console.log(this.id)
        
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
                cache : this._cache
            });
            this._channels[id] = ch;
        }
        return ch;
    }
});

dojo.declare('info.mindtrove.JSonicCache', dijit._Widget, {
    sayURI: null,
    postMixInProperties: function() {
        // cache of speech utterances
        this._speechCache = {};
        // cache of speech filenames
        this._speechFiles = {};
        // cache of sound utterances
        this._soundCache = {};
        // cache of requests for speech rendering in progress
        this._speechRenderings = {};
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
    
    _getSpeechCacheKey: function(text, props) {
        return text + '.' + props.voice + '.' + props.rate;
    },
    
    getSpeech: function(args, props) {
        var key = this._getSpeechCacheKey(args.text, props);
        var audioNode = this._speechCache[key];
        if(audioNode) {
            // clone existing audio node in cache
            return {name : 'audio', value : dojo.clone(audioNode)};
        }
        var def = this._speechRenderings[key];
        if(def) {
            // return deferred result for synth already in progress on server
            return {name : 'deferred', value : def};
        }
        var response = this._speechFiles[key];
        if(response) {
            // build a new audio node for a known speech file url
            audioNode = this._onSpeechSynthed(args.text, props, response);
            return {name : 'audio', value : audioNode};
        }
        // synth on server
        var speechParams = {
            format : this._ext,
            utterances : {text : args.text},
            wpm: props.rate,
            voice: props.voice
        };
        // @todo: don't hard code say.php
        var request = {
            url : this.sayURI.uri+'say.php',
            handleAs: 'json',
            postData : dojo.toJson(speechParams)
        };
        def = dojo.xhrPost(request);
        this._speechRenderings[key] = def;
        def.addCallback(dojo.hitch(this, '_onSpeechSynthed', args, 
            dojo.clone(props)));
        def.addCallback(function() { console.debug('funky'); });
        return {name : 'deferred', value : def};
    },

    _onSpeechSynthed: function(args, props, response) {
        var key = this._getSpeechCacheKey(args.text, props);
        delete this._speechRenderings[key];
        var node = dojo.create('audio');
        node.autobuffer = true;
        node.src = this.sayURI.uri+response.files.text;
        if(args.cache) {
            // cache the audio node
            this._speechCache[key] = node;
        } else {
            // cache the speech file url
            this._speechFiles[key] = response;
        }
        return node;
    }
});

dojo.declare('info.mindtrove.JSonicChannel', dijit._Widget, {
    cache: null,
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
            // pre-synth speech with any props ahead in the queue
            var props = dojo.clone(this._properties);
            var changes = dojo.forEach(this._queue, function(args) {
                if(args.method == '_setProperty') {
                    props[args.name] = args.value;
                }
            });
            args.audio = this.cache.getSpeech(args, props);
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
        this._busy = true;
        this._kind = 'say';
        var obj = (args.audio) ? args.audio : this.cache.getSpeech(args);
        if(obj.name == 'audio') {
            this._playAudioNode(obj.value);
        } else if(obj.name == 'deferred') {
            obj.value.addCallback(dojo.hitch(this, '_playAudioNode'));
        }
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
