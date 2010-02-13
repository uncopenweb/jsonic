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
dojo.require('info.mindtrove.JSonic');
var buttonHandlers = {
    singleSay: function(js) {
        js.say({text : 'Hello world!'});
    },

    singleSound: function(js) {
        js.play({url : 'sounds/9081__tigersound__disappear', cache : true});
    },

    sequentialSound: function(js) {
        js.play({url : 'sounds/9081__tigersound__disappear', cache : true});
        js.play({url : 'sounds/18382__inferno__hvylas', cache : true});
    },
    
    simultaneousSound: function(js) {
        js.play({url : 'sounds/9081__tigersound__disappear', cache : true});
        js.play({url : 'sounds/18382__inferno__hvylas', cache : true, channel : 'second'});
    },
    
    propertiesSound: function(js) {
        js.setProperty({name : 'volume', value : 0.1});
        js.play({url : 'sounds/9081__tigersound__disappear', cache : true});
        js.setProperty({name : 'volume', value : 1.0});
        js.play({url : 'sounds/18382__inferno__hvylas', cache : true});
        js.reset();
    }
};

function onStart(notice) {
    console.log(notice.action);
    console.log(notice);
}

function onEnd(notice) {
    console.log(notice.action);
    console.log(notice);
}

dojo.ready(function() {
    var js = new info.mindtrove.JSonic();
    js.addObserver(onStart)
    dojo.query('button').forEach(function(node) {
        dojo.connect(node, 'onclick', dojo.partial(buttonHandlers[node.id], js));
    });
});