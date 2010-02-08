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
        this._channels = {};
    },
    
    postCreate: function() {
        
    },
    
    say: function(utterance, channel, name) {
        var cmd = {};
        cmd.method = '_say';
        cmd.utterance = utterance;
        cmd.name = name;
        this._getChannel(channel).push(cmd);
    },
    
    play: function(url, channel, name) {
        var cmd = {};
        cmd.method = '_play';
        cmd.url = url;
        cmd.name = name;
        this._getChannel(channel).push(cmd);
    },
    
    stop: function(channel) {
        var cmd = {};
        cmd.method = '_stop';
        this._getChannel(channel).push(cmd);
    },
    
    setProperty: function(name, value, channel) {
        var cmd = {};
        cmd.method = '_setProperty';
        cmd.name = name;
        cmd.value = value;
        this._getChannel(channel).push(cmd);
    },
    
    getProperty: function(name, channel) {
        var cmd = {};
        cmd.method = '_getProperty';
        cmd.name = name;
        cmd.deferred = new dojo.Deferred();
        this._getChannel(channel).push(cmd);
        return cmd.deferred;
    },
    
    reset: function(channel) {
        var cmd = {};
        cmd.method = '_reset';
        this._getChannel(channel).push(cmd);
    },
    
    cacheSpeech: function(text) {
        
    },
    
    cacheSound: function(url) {
        
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
            ch = new info.mindtrove.JSonicChannel({id : id, sayURI: this.sayURI});
            this._channels[id] = ch;
        }
        return ch;
    }
});

dojo.declare('info.mindtrove.JSonicChannel', dijit._Widget, {
    sayURI: null,
    postMixInProperties: function() {
        this._kind = null;
        this._name = null;
        this._queue = [];
        this._busy = false;
        this._observers = [];
        this._properties = null;
        this._ext = '';
        this._utterances = {};
        // set default properties
        this._reset();
        foobar = this;
    },
    
    postCreate: function() {
        this._audioNode = dojo.create('audio');
        if(this._audioNode.canPlayType('audio/ogg')) {
            this._ext = '.ogg';
        } else if(this._audioNode.canPlayType('audio/mpeg')) {
            this._ext = '.mp3';
        } else if(this._audioNode.canPlayType('audio/aac')) {
            this._ext = '.m4a';
        } else if(this._audioNode.canPlayType('audio/wav')) {
            this._ext = '.wav';
        }
        this._audioNode.autobuffer = true;
        this._audioNode.loop = this._properties.loop;
        this._audioNode.volume = this._properties.volume;
        this.connect(this._audioNode, 'play', '_onStart');
        this.connect(this._audioNode, 'ended', '_onEnd');
        this.domNode.appendChild(this._audioNode);
    },
    
    push: function(cmd) {
        this._queue.push(cmd);
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
            var cmd = this._queue.shift();
            this._name = cmd.name;
            this[cmd.method](cmd);
        }
    },

    _say: function(cmd) {
        this._busy = true;
        this._kind = 'say';
        // @todo: need to base caching on other props too
        var response = this._utterances[cmd.utterance];
        if(response) {
            this._onSaySynth(cmd.utterance, response);
        } else {
            var request = {
                format : this._ext,
                utterances : {text : cmd.utterance},
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
            def.addCallback(dojo.hitch(this, '_onSaySynth', cmd.utterance));
        }
    },
    
    _onSaySynth: function(utterance, response) {
        this._utterances[utterance] = response;
        this._audioNode.src = this.sayURI.uri+response.files.text;
        this._audioNode.load();
        this._audioNode.play();
    },
    
    _play: function(cmd) {
        this._busy = true;
        this._kind = 'play';
        this._audioNode.src = cmd.url+this._ext;
        this._audioNode.load();
        this._audioNode.play();
    },
    
    _stop: function(cmd) {
        this._audioNode.pause();
        this._queue = [];
        this._kind = null;
        this._name = null;
        this._busy = false;
    },
    
    _setProperty: function(cmd) {
        if(cmd.name == 'volume') {
            this._properties.volume = cmd.value;
            this._audioNode.volume = cmd.value;
        } else if(cmd.name == 'rate') {
            this._properties.rate = cmd.value;
        } else if(cmd.name == 'loop') {
            this._properties.loop = cmd.value;
            this._audioNode.loop = true;
        } else if(cmd.name == 'voice') {
            this._properties.voice = cmd.value;
        }
    },
    
    _getProperty: function(cmd) {
        var value = this._properties[cmd.name];
        cmd.deferred.callback(value);
    },
    
    _reset: function(cmd) {
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
        this._audioNode.pause();
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
