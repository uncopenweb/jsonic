/*
 * JSonic client-side API implemented using Dojo.
 *
 * :requires: Dojo 1.4, JSonic REST API on server
 * :copyright: Peter Parente 2010
 * :license: BSD
**/
dojo.provide('info.mindtrove.JSonic');
dojo.require('dijit._Widget');
dojo.require("dojox.encoding.digests.MD5");

/**
 * JSonic widget for application use.
 */
dojo.declare('info.mindtrove.JSonic', dijit._Widget, {
    // root of the JSonic server REST API, defaults to the current uri 
    jsonicURI: dojo.moduleUrl('', '../'),
    postMixInProperties: function() {
        // created audio channels
        this._channels = {};
        // channel-shared cache of sounds and speech
        this._cache = new info.mindtrove.JSonicCache({
            jsonicURI : this.jsonicURI
        });
    },
    
    /**
     * Queues speech on a channel. The args parameter supports the following
     * name / value pairs.
     *
     * :param text: 
     * :type text: string
     * :param channel:
     * :type channel: string
     * :param name:
     * :type name: string
     * :param cache:
     * :type cache: boolean
     */
    say: function(args) {
        args.method = '_say';
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * Queues speech on a channel. The args parameter supports the following
     * name / value pairs.
     *
     * :param url: 
     * :type url: string
     * :param channel:
     * :type channel: string
     * :param name:
     * :type name: string
     * :param cache:
     * :type cache: boolean
     */
    play: function(args) {
        args.method = '_play';
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * Immediately stops output on a channel and clears the channel queue.
     * The args parameter supports the following name / value pairs.
     *
     * :param channel:
     * :type channel: string
     */
    stop: function(args) {
        var args = {method: '_stop'};
        this._getChannel(args.channel).push(args);
    },
    
    /**
     * Queues a change in channel property that affects all speech and sound
     * output following it in the queue. All channels support the following
     * properties:
     *
     * :rate: Speech rate in words per minute (default: 200)
     * :volume: Speech and sound volume beteween [0.0, 1.0] (default: 1.0)
     * :loop: Audio looping (default: false)
     * :engine: Speech engine to use (default: espeak)
     * :voice: Speech engine voice to use (default: en/en-r+f1)
     *
     * A channel may support additional speech properties if they are named
     * in the response from getEngineInfo.
     *
     * The args parameter supports the following name / value pairs.
     *
     * :param name:
     * :type name: string
     * :param value:
     * :type value: any
     * :param channel:
     * :type channel: string
     */
    setProperty: function(args) {
        args.method = '_setProperty';
        this._getChannel(args.channel).push(args);
    },

    /**
     * Queues a request for the value of a channel property. If the property is
     * unknown, undefined is returned.
     *
     * The args parameter supports the following name / value pairs.
     *
     * :param name:
     * :type name: string
     * :param channel:
     * :type channel: string
     * :return: Deferred with a callback to get the property value
     * :rtype: dojo.Deferred
     */
    getProperty: function(args) {
        args.method = '_getProperty';
        args.deferred = new dojo.Deferred();
        this._getChannel(args.channel).push(args);
        return args.deferred;
    },
    
    /**
     * Queues a reset of all channel property values to their default values.
     * The args parameter supports the following name / value pairs.
     *
     * :param channel:
     * :type channel: string
     */
    reset: function(args) {
        args = args || {};
        args.method = '_reset';
        this._getChannel(args.channel).push(args);
    },

    /**
     * Gets the list of speech engine names available on the server.
     *
     * :return: Deferred with a callback to get the engine list
     * :rtype: dojo.Deferred
     */
    getEngines: function() {
        return this._cache.getEngines();
    },
    
    /**
     * Gets a description of the properties supported by a single speech engine
     * available on the server.
     *
     * :return: Deferred with a callback to get the engine properties
     * :rtype: dojo.Deferred
     */
    getEngineInfo: function(name) {
        return this._cache.getEngineInfo(name);
    },
    
    /**
     * Adds an observer for channel events.
     *
     * :param func:
     * :type func: function
     * :param channel: 
     * :type channel: string
     * :param actions:
     * :type actions: array
     * :return: Token to use when removing the observer
     * :rtype: object
     */
    addObserver: function(func, channel, actions) {
        var ob = this._getChannel(channel).addObserver(func, actions);
        return [ob, channel];
    },
    
    /**
     * Removes an observer of channel events.
     *
     * :param token:
     * :type token: object
     */
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
    jsonicURI: null,
    postMixInProperties: function() {
        // speech engines and their details
        this._engineCache = null;
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
    
    getEngines: function() {
        var request, def;
        if(this._engineCache) {
            def = new dojo.Deferred();
            var names = [];
            for(var key in this._engineCache) {
                names.push(key);
            }
            def.callback(names);
        } else {
            var request = {
                url : this.jsonicURI.uri+'engine',
                handleAs: 'json',
                load: dojo.hitch(this, function(response) {
                    this._engineCache = {};
                    dojo.forEach(response.result, 'this._engineCache[item] = null;', this);
                })
            };
            def = dojo.xhrGet(request);
        }
        return def;
    },
    
    getEngineInfo: function(name) {
        var request, def;
        if(this._engineCache[name]) {
            def = new dojo.Deferred();
            def.callback(this._engineCache[name]);
        } else {
            var request = {
                url : this.jsonicURI.uri+'engine/'+name,
                handleAs: 'json',
                load: dojo.hitch(this, function(response) {
                    this._engineCache[name] = response.result;
                })
            };
            def = dojo.xhrGet(request);
        }
        return def;
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
        var resultDef = this._speechRenderings[key];
        if(resultDef) {
            // return deferred result for synth already in progress on server
            return {name : 'deferred', value : resultDef};
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
            properties: props
        };
        resultDef = new dojo.Deferred();
        var request = {
            url : this.jsonicURI.uri+'synth',
            handleAs: 'json',
            postData : dojo.toJson(speechParams),
            load: dojo.hitch(this, '_onSpeechSynthed', resultDef, args, 
                dojo.clone(props)),
            error: dojo.hitch(this, '_onSynthError', resultDef)
        };
        var xhrDef = dojo.xhrPost(request);
        this._speechRenderings[key] = resultDef;
        return {name : 'deferred', value : resultDef};
    },
    
    _onSynthError: function(resultDef, err, ioargs) {
        // clear request deferred
        var key = this._getSpeechCacheKey(args.text, props);
        delete this._speechRenderings[key];
        
        var response = dojo.fromJson(ioargs.xhr.responseText);
        resultDef.errback(response.description);
    },
    
    _onSpeechSynthed: function(resultDef, args, props, response) {
        var key = this._getSpeechCacheKey(args.text, props);
        delete this._speechRenderings[key];
        var node = dojo.create('audio');
        node.autobuffer = true;
        node.src = this.jsonicURI.uri+'files/'+response.result.text+this._ext;
        if(args.cache) {
            // cache the audio node
            this._speechCache[key] = node;
        } else {
            // cache the speech file url
            this._speechFiles[key] = response;
        }
        resultDef.callback(node);
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
        if(args.method == '_stop') {
            // stop immediately
            this._stop();
            return;
        } else if(args.method == '_play') {
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
        this._connects[2] = dojo.connect(node, 'error', this, '_onMediaError');
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
            obj.value.addErrback(dojo.hitch(this, '_onSynthError'));
        }
    },
    
    _play: function(args) {
        this._busy = true;
        this._kind = 'play';
        var node = (args.audio) ? args.audio : this.cache.getSound(args);
        this._playAudioNode(node);
    },
    
    _stop: function() {
        this._stopAudioNode();
        this._queue = [];
        this._kind = null;
        this._name = null;
        this._busy = false;
    },
    
    _setProperty: function(args) {
        this._properties[args.name] = args.value;
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
            engine : 'espeak',
            voice: 'en/en-r+f1'
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
    
    _onMediaError: function(event) {
        var notice = {
            action : 'error',
            channel : this.id,
            name : this._name,
            description: event.target.error
        };
        this._notify(notice);
        this._busy = false;
        this._name = null;
        this._pump();        
    },
    
    _onSynthError: function(error) {
        var notice = {
            action : 'error',
            channel : this.id,
            name : this._name,
            description: error.message
        };
        this._notify(notice);
        this._busy = false;
        this._name = null;
        this._pump();
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
