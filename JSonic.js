/*
 * JSonic client-side API implemented using Dojo.
 *
 * :requires: Dojo 1.4.x, JSonic REST API on server
 * :copyright: Peter Parente 2010
 * :license: BSD
**/
dojo.provide('uow.audio.JSonic');
dojo.require('dijit._Widget');

// client api version
uow.audio._jsonicVersion = '0.4';
// singleton instance
uow.audio._jsonicInstance = null;

// factory to build a JSonic instance
uow.audio.initJSonic = function(args) {
    if(!uow.audio._jsonicInstance) {
        return new uow.audio.JSonic(args);
    }
    return uow.audio._jsonicInstance;
};

/**
 * JSonic widget for application use.
 */
dojo.declare('uow.audio.JSonic', dijit._Widget, {
    // root of the JSonic server REST API, defaults to / (read-only)
    jsonicURI: '/',
    // cache speech / sounds by default or not? defaults to false for privacy
    defaultCaching: false,
    constructor: function() {
        if(uow.audio._jsonicInstance) {
            throw new Error('JSonic instance already exists');
        }
        uow.audio._jsonicInstance = this;
    },

    postMixInProperties: function() {
        // created audio channels
        this._channels = {};
        // channel-shared cache of sounds and speech
        this._cache = new uow.audio.JSonicCache({
            jsonicURI : this.jsonicURI
        });
    },
    
    /**
     * Cleanup all resources on a destroy() call.
     */
    uninitialize: function() {
        for(var ch in this._channels) {
            this._channels[ch].destroy();
        }
        this._cache.destroy();
        uow.audio._jsonicInstance = null;
    },
    
    _setDefaultCachingAttr: function(value) {
        this.defaultCaching = value;
    },

    /**
     * Gets the version of the JSonic server API.
     *
     * :return: Deferred with a callback to get the version info
     * :rtype: dojo.Deferred
     */
    getServerVersion: function() {
        var request = {
            url : this.jsonicURI+'version',
            handleAs: 'json'
        };
        return dojo.xhrGet(request);
    },

    /**
     * Gets the version of the JSonic client API.
     *
     * :return: Version
     * :rtype: string
     */
    getClientVersion: function() {
        return uow.audio._jsonicVersion;
    },
    
    /**
     * Queues speech on a channel. The args parameter supports the following
     * name / value pairs.
     *
     * :param text: Text to speak.
     * :type text: string
     * :param channel: Channel name on which to queue the speech. Defaults to
     *   'default'.
     * :type channel: string
     * :param name: Name to associate with the utterance. Included in any
     *   callbacks. Defaults to null.
     * :type name: string
     * :param cache: True to cache the utterance locally and track its 
     *   frequency. False to avoid caching for privacy or other reasons.
     *   Defaults to the instance variable defaultCaching.
     * :type cache: boolean
     * :return: Object with 'before' and 'after' deferreds invoked just before
     *   speech starts and when it finishes (parameter: true) or is stopped 
     *   (parameter: false).
     * :rtype: object
     */
    say: function(args) {
        if(!args || !args.text) throw new Error('args.text required');
        args.cache = (args.cache == undefined) ? this.defaultCaching : args.cache;
        args.method = '_say';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },
    
    /**
     * Queues speech on a channel. The args parameter supports the following
     * name / value pairs.
     *
     * :param url: URL of the sound to play minus the extension. The extension
     *   is added properly based on the media type supported by the browser.
     *   (currently: .ogg or .mp3)
     * :type url: string
     * :param channel: Channel name on which to queue the sound. Defaults to
     *   'default'.
     * :type channel: string
     * :param name: Name to associate with the sound. Included in any
     *   callbacks. Defaults to null.
     * :type name: string
     * :param cache: True to cache the utterance locally and track its 
     *   frequency. False to avoid caching for privacy or other reasons.
     *   Defaults to the instance variable defaultCaching.
     * :type cache: boolean
     * :return: Object with 'before' and 'after' deferreds invoked just before
     *   sound starts and when it finishes (parameter: true) or is stopped 
     *   (parameter: false).
     * :rtype: object
     */
    play: function(args) {
        if(!args || !args.url) throw new Error('args.url required');
        args.cache = (args.cache == undefined) ? this.defaultCaching : args.cache;
        args.method = '_play';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },
    
    /**
     * Immediately stops output on a channel and clears the channel queue.
     * The args parameter supports the following name / value pairs.
     *
     * :param channel: Channel name to stop. Defaults to 'default.
     * :type channel: string
     * :return: Object with 'before' and 'after' deferreds invoked just before
     *   audio stops and right after.
     * :rtype: object
     */
    stop: function(args) {
        args = args || {};
        args.method = '_stop';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },
    
    /**
     * Executes or queues a change in channel property that affects all speech 
     * and sound output following it. All channels support the following
     * properties:
     *
     * :rate: Speech rate in words per minute (default: 200)
     * :pitch: Speech pitch between [0.0, 1.0] (default: 0.5)
     * :volume: Speech and sound volume beteween [0.0, 1.0] (default: 1.0)
     * :loop: Audio looping (default: false)
     * :engine: Speech engine to use (default: espeak)
     * :voice: Speech engine voice to use (default: default)
     *
     * A channel may support additional speech properties if they are named
     * in the response from getEngineInfo.
     *
     * The args parameter supports the following name / value pairs.
     *
     * :param name: Name of the property to change.
     * :type name: string
     * :param value: Value to set for the property
     * :type value: any
     * :param immediate: Set properties immediately or when processed in the
     *   channel queue. (default: false)
     * :type immediate: bool
     * :param channel: Channel name on which to queue the change. Defaults to
     *   'default'.
     * :type channel: string
     * :return: Object with 'before' and 'after' deferreds invoked just before
     *   speech the property is set (parameter: old property value) and right 
     *   after (parameter: new property value).
     * :rtype: object
     */
    setProperty: function(args) {
        if(!args || !args.name) throw new Error('args.name required');
        args.method = '_setProperty';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },

    /**
     * Queues a request for the value of a channel property. If the property is
     * unknown, undefined is returned.
     *
     * The args parameter supports the following name / value pairs.
     *
     * :param name: Name of the property value to fetch.
     * :type name: string
     * :param channel: Channel name on which to queue the fetch. Defaults to
     *   'default'.
     * :type channel: string
     * :return: Object with 'before' and 'after' deferreds invoked immediately
     *   when the request is queued (parameter: current value) and after the
     *   request is processed (parameter: current value).
     * :rtype: object
     */
    getProperty: function(args) {
        if(!args || !args.name) throw new Error('args.name required');
        args.method = '_getProperty';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },
    
    /**
     * Queues a reset of all channel property values to their default values.
     * The args parameter supports the following name / value pairs.
     *
     * :param channel: Channel name on which to queue the reset. Defaults to
     *   'default'.
     * :type channel: string
     * :return: Object with 'before' and 'after' deferreds invoked just before
     *   the property reset (parameter: all old properties) and after the reset
     *   (parameter: reset property values).
     * :rtype: object
     */
    reset: function(args) {
        args = args || {};
        args.method = '_reset';
        args = this._getChannel(args.channel).push(args);
        return args.defs;
    },
    
    /**
     * Queues a reset of all channel properties to their defaults on all
     * channels.
     *
     * :return: Objects with 'before' and 'after' deferreds invoked just 
     *   before the property reset (parameter: all old properties) and after 
     *   the reset (parameter: reset property values) on each channel.
     * :rtype: array of object
     */
    resetAll: function() {
        var rv = [];
        for(var channel in this._channels) {
            var args = {method : '_reset'};
            this._channels[channel].push(args);
            rv.push(args.defs);
        }
        return rv;
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
     * :param func: Callback function to invoke on channel events.
     * :type func: function
     * :param channel: Channel name to observe. Defaults to 'default'.
     * :type channel: string
     * :param actions: Event names to observe. Defaults to all events if
     *   undefined.
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
     * :param token: Token returned when registering the observer
     * :type token: object
     */
    removeObserver: function(token) {
        this._getChannel(token[1]).removeObserver(token[0]);
    },

    _getChannel: function(id) {
        id = id || 'default';
        var ch = this._channels[id];
        if(ch === undefined) {
            ch = new uow.audio.JSonicChannel({
                id : 'jsonic.'+id, 
                cache : this._cache
            });
            this._channels[id] = ch;
        }
        return ch;
    }
});

/**
 * Helper class. Contains two dojo.Deferreds for callbacks and errbacks before 
 * and after a command is processed. Instances returned by many methods in 
 * uow.audio.JSonic.
 */
dojo.declare('uow.audio.JSonicDeferred', null, {
    constructor: function() {
        this.before = new dojo.Deferred();
        this.after = new dojo.Deferred();
    },
    
    /**
     * Shortcut for this.before.addCallback.
     *
     * :return: This instance for call chaining.
     */
    callBefore: function(callback) {
        this.before.addCallback(callback);
        return this;
    },

    /**
     * Shortcut for this.after.addCallback.
     *
     * :return: This instance for call chaining.
     */    
    callAfter: function(callback) {
        this.after.addCallback(callback);
        return this;
    },
    
    /**
     * Shortcut for this.before.addErrback.
     *
     * :return: This instance for call chaining.
     */
    errBefore: function(callback) {
        this.before.addErrback(callback);
        return this;
    },
    
    /**
     * Shortcut for this.after.addErrback.
     *
     * :return: This instance for call chaining.
     */
    errAfter: function(callback) {
        this.after.addErrback(callback);
        return this;
    },
    
    /**
     * Shortcut for this.before.addBoth.
     *
     * :return: This instance for call chaining.
     */
    anyBefore: function(callback) {
        this.before.addBoth(callback);
        return this;
    },
    
    /**
     * Shortcut for this.after.addBoth.
     *
     * :return: This instance for call chaining.
     */
    anyAfter: function(callback) {
        this.after.addBoth(callback);
        return this;
    }
});

/**
 * Private. Shared cache implementation for JSonic. The cache maintains three 
 * pieces of information to reduce speech/sound output latency:
 *
 * 1. <audio> nodes pointing to speech/sound URLs cloned for reuse by channels 
 * 2. Filenames of speech utterances already synthesized on the server
 * 3. Utterance / sound frequency tracking for cache warming
 */
dojo.declare('uow.audio.JSonicCache', dijit._Widget, {
    jsonicURI: null,
    postMixInProperties: function() {
        // speech engines and their details
        this._engineCache = null;
        // cache of speech utterances
        this._speechCache = {};
        // cache of speech filenames
        if(localStorage) {
            // clear the cache if versions don't match
            if(localStorage['jsonic.version'] != uow.audio._jsonicVersion) {
                // reset the cache
                this.resetCache();
            }
            // warm the cache from localStorage
            try {
                this._speechFiles = dojo.fromJson(localStorage['jsonic.cache']) || {};
            } catch(e) {
                this._speechFiles = {};
            }
            // register to persist on page unload
            dojo.addOnUnload(this, '_persist');
        } else {
            this._speechFiles = {};
        }
        // cache of sound files
        this._soundCache = {};
        // cache of requests for speech rendering in progress
        this._speechRenderings = {};
        // determine extension to use
        var node = dojo.create('audio');
        if(node.canPlayType('audio/ogg') && node.canPlayType('audio/ogg') != 'no') {
            this._ext = '.ogg';
        } else if(node.canPlayType('audio/mpeg') && node.canPlayType('audio/mpeg') != 'no') {
            this._ext = '.mp3';
        } else {
            throw new Error('no known media supported');
        }
    },
    
    _persist: function() {
        localStorage['jsonic.cache'] = dojo.toJson(this._speechFiles);
    },

    resetCache: function(args) {
        if(localStorage) {
            // clear out the cache
            delete localStorage['jsonic.cache'];
            // update the version number
            localStorage['jsonic.version'] = uow.audio._jsonicVersion;
        }
        this._speechFiles = {};
        if(args) {
            delete this._speechCache[args.key];
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
            request = {
                url : this.jsonicURI+'engine',
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
            request = {
                url : this.jsonicURI+'engine/'+name,
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
        var resultDef = new dojo.Deferred();
        var node = this._soundCache[args.url];
        if(node) {
            resultDef.callback(node);
            return resultDef;
        } else {
            node = {}; //dojo.create('audio');
            node.autobuffer = true;
            node.src = args.url+this._ext;
            if(args.cache) {
                this._soundCache[args.url] = node;
            }
            resultDef.callback(node);
            return resultDef;
        }
    },

    _getSpeechCacheKey: function(text, props) {
        var key = text;
        var names = [];
        // @todo: would be nice not to recompute every time, but how to
        //  store if we prefetch speech and are peeking into the queue?
        for(var name in props) {
            if(name == 'volume' || name == 'loop') continue;
            names.push(name);
        } 
        names.sort();
        dojo.forEach(names, function(name) {
            key += '.'+props[name];
        });
        return key;
    },
    
    getSpeech: function(args, props) {
        // get the client cache key
        var key = this._getSpeechCacheKey(args.text, props);
        args.key = key;
        var resultDef;
        
        var audioNode = this._speechCache[key];
        if(audioNode) {
            resultDef = new dojo.Deferred();
            resultDef.callback(audioNode);
            return resultDef;
        }
        resultDef = this._speechRenderings[key];
        if(resultDef) {
            // return deferred result for synth already in progress on server
            return resultDef;
        }
        var response = this._speechFiles[key];
        if(response) {
            response = dojo.fromJson(response);
            // build a new audio node for a known speech file url
            audioNode = this._onSpeechSynthed(null, args, response);
            resultDef = new dojo.Deferred();
            resultDef.callback(audioNode);
            return resultDef;
        }
        // synth on server
        var speechParams = {
            format : this._ext,
            utterances : {text : args.text},
            properties: props
        };
        resultDef = new dojo.Deferred();
        var request = {
            url : this.jsonicURI+'synth',
            handleAs: 'json',
            postData : dojo.toJson(speechParams),
            load: dojo.hitch(this, '_onSpeechSynthed', resultDef, args),
            error: dojo.hitch(this, '_onSynthError', resultDef, args)
        };
        dojo.xhrPost(request);
        this._speechRenderings[key] = resultDef;
        return resultDef;
    },
    
    _onSynthError: function(resultDef, args, err, ioargs) {
        // clear request deferred
        delete this._speechRenderings[args.key];
        // get additional error info if possible
        var desc;
        try {
            desc = dojo.fromJson(ioargs.xhr.responseText).description;
        } catch(e) {
            desc = '';
        }
        if(resultDef) resultDef.errback(desc);
        return err;
    },

    _onSpeechSynthed: function(resultDef, args, response) {
        delete this._speechRenderings[args.key];
        var node = {}; //dojo.create('audio');
        node.autobuffer = true;
        node.preload = 'auto';
        node.src = this.jsonicURI+'files/'+response.result.text+this._ext;
        // @todo: don't let caches grow unbounded
        // @todo: distinguish levels of caching
        if(args.cache) {
            // cache the audio node
            this._speechCache[args.key] = node;
            // cache the speech file url and properties for server caching
            this._speechFiles[args.key] = dojo.toJson(response);
        }
        if(resultDef) resultDef.callback(node);
        return node;
    }
});

/**
 * Private. Independent speech / sound channel implementation for JSonic.
 */
dojo.declare('uow.audio.JSonicChannel', dijit._Widget, {
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
        // arguments for the current audio
        this._args = null;
        // observers of callbacks on this channel
        this._observers = [];
        // current channel properties
        this._properties = null;
        // audio node in use by the channel
        this._audioNode = null;
        // audio node buffering data for playback
        this._bufferNode = this._createNode();
        // set default properties
        this._reset();
    },
    
    uninitialize: function() {
        this._args = null;
        if(this._audioNode && !this._audioNode.paused) {
            this._audioNode.pause();
        }
        dojo.forEach(this._aconnects, dojo.disconnect);
    },
    
    _createNode: function() {
        var node = dojo.create('audio');
        // callback tokens for the current audio node
        this._aconnects = [];
        this._aconnects[0] = dojo.connect(node, 'play', this, '_onStart');
        this._aconnects[1] = dojo.connect(node, 'pause', this, '_onPause');
        this._aconnects[2] = dojo.connect(node, 'ended', this, '_onEnd');
        this._aconnects[3] = dojo.connect(node, 'error', this, '_onMediaError');
        return node;
    },
    
    push: function(args) {
        // copy the args to avoid problems with reuse
        args = dojo.clone(args);
        // create deferred responses in the copy
        args.defs = new uow.audio.JSonicDeferred();
        if(args.method == '_setProperty' && args.immediate) {
            // set property now
            this._setProperty(args);
            return args;
        } else if(args.method == '_stop') {
            // stop immediately
            this._stop(args);
            return args;
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
        } else if(args.method == '_getProperty') {
            args.defs.before.callback(this._properties[args.name]);
        }
        this._queue.push(args);
        this._pump();
        return args;
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

    _playAudioNode: function(args, nodeProps) {
        // don't play if we've stopped in the meantime
        if(this._args != args) return;
        // set the properties on the node
        var node = this._bufferNode;
        dojo.mixin(node, nodeProps);
        this._audioNode = node;
        this._args.origSrc = node.src;
        // set volume immediately, but not on chrome
        if(!dojo.isChrome) {
            this._audioNode.volume = this._properties.volume;
        }
        // @todo: not yet supported well in browsers, do our own
        //this._audioNode.loop = this._properties.loop;
        // need to force a load call in FF
        this._audioNode.load();
        // start playing it
        this._audioNode.play();
    },
    
    _say: function(args) {
        this._busy = true;
        this._kind = 'say';
        this._args = args;
        if(!args.audio) {
            args.audio = this.cache.getSpeech(args);
        }
        args.audio.addCallback(dojo.hitch(this, '_playAudioNode', this._args));
        args.audio.addErrback(dojo.hitch(this, '_onSynthError', this._args));
    },

    _play: function(args) {
        this._busy = true;
        this._kind = 'play';
        this._args = args;
        if(!args.audio) {
            args.audio = this.cache.getSound(args);
        }
        args.audio.addCallback(dojo.hitch(this, '_playAudioNode', this._args));
    },
    
    _stop: function(args) {
        args.defs.before.callback();
        var didPause = false;
        if(this._audioNode) {
            didPause = true;
            this._audioNode.pause();
        }
        this._queue = [];
        args.defs.after.callback();
        if(!didPause) {
            // never playing, simulate the pause event
            this._onPause();
        }
    },
    
    _setProperty: function(args) {
        args.defs.before.callback(this._properties[args.name]);
        this._properties[args.name] = args.value;
        // set local properties now
        if(this._audioNode && args.name == 'volume') {
            this._audioNode.volume = args.value;
        }
        args.defs.after.callback(args.value);
    },

    _getProperty: function(args) {
        var value = this._properties[args.name];
        args.defs.after.callback(value);
    },
    
    _reset: function(args) {
        if(args) args.defs.before.callback(this._properties);
        this._properties = {
            pitch : 0.5,
            rate: 200,
            volume: 1.0,
            loop: false,
            engine : 'espeak',
            voice: 'default'
        };
        if(args) args.defs.after.callback(this._properties);
    },

    _notify: function(notice) {
        var obs = this._observers;
        for(var i=0; i < obs.length; i++) {
            var ob = obs[i];
            if(!ob.actions || dojo.indexOf(ob.actions, notice.action) != -1) {
                try {
                    ob.func(notice);
                } catch(e) {
                    console.error(e.message);
                }
                
            }
        }
    },
    
    _onMediaError: function(event) {
        // ignore late events
        if(!this._args || event.target.src != this._args.origSrc) { 
            return; 
        }

        var notice = {
            action : 'error',
            url : event.target.src,
            channel : this.id,
            name : this._name,
            description: event.target.error
        };
        if(this._kind == 'say') {
            // if speech, dump the entire local cache assuming we need a
            // resynth of everything
            this.cache.resetCache(this._args);
        }
        // clear everything before the callback
        var cargs = this._args;
        this._args = null;
        this._busy = false;
        this._name = null;
        cargs.defs.after.errback();
        this._notify(notice);
        this._pump();        
    },
    
    _onSynthError: function(args, error) {
        var notice = {
            action : 'error',
            channel : this.id,
            name : this._name,
            description: error.message
        };
        // clear everything before after callback
        this._args = null;
        this._busy = false;
        this._name = null;
        args.defs.before.errback();
        args.defs.after.errback();
        this._notify(notice);
        this._pump();
    },
    
    _onPause: function(event) {
        // ignore late events
        if(!this._args || event.target.src != this._args.origSrc) { 
            return; 
        }

        var cargs = this._args;
        var cname = this._name;
        var ckind = this._kind;
        // on chrome, audio continues to play sometimes even after the pause
        // set volume to zero to avoid any actual output
        if(this._audioNode) {
            this._audioNode.volume = 0;
        }
        // clear everything before giving the after callbacks
        this._args = null;
        this._kind = null;
        this._name = null;
        this._busy = false;
        if(cargs && cargs.started) {
            // notify of end if currently playing
            var notice = {
                url : cargs.url,
                action : 'finished-'+ckind, 
                completed: false,
                channel : this.id,
                name : cname
            };
            cargs.defs.after.callback(false);
            this._notify(notice);
        }
        this._pump();
    },

    _onEnd: function(event) {
        // ignore late events
        if(!this._args || event.target.src != this._args.origSrc) { 
            return; 
        }
        var notice = {
            url : event.target.src,
            action : 'finished-'+this._kind, 
            channel : this.id,
            name : this._name,
            completed: true
        };
        if(this._properties.loop) {
            // start playing again, loop attr not implemented well in browsers
            if(dojo.isOpera) {
                setTimeout(dojo.hitch(this, function() {
                    this._audioNode.currentTime = 0;
                    this._audioNode.play();
                }), 0);
            } else {
                this._audioNode.load();
                this._audioNode.play();
            }
            // don't listen to start events anymore for this sound
            this._args.inloop = true
            return;
        }
        this._audioNode = null;
        // clear everything before after callback
        var cargs = this._args;
        this._args = null;
        this._busy = false;
        this._name = null;
        cargs.defs.after.callback(true);
        this._notify(notice);
        this._pump();
    },
    
    _onStart: function(event) {
        // ignore late events or looping restart events
        if(!this._args || event.target.src != this._args.origSrc ||
           this._args.inloop) { 
            return; 
        }

        var notice = {
            url : event.target.src,
            action : 'started-'+this._kind, 
            channel : this.id,
            name : this._name
        };
        if(dojo.isChrome) {
            // workaround for chrome bug; can't set vol until started
            event.target.volume = this._properties.volume;
        }
        this._args.started = true;
        this._args.defs.before.callback();
        this._notify(notice);
    }
});