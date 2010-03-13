/*
 * Simple examples of JSonic. Click buttons to hear speech and sound.
 *
 * :requires: Dojo 1.4, JSonic REST API on server
 * :copyright: Peter Parente 2010
 * :license: BSD
**/
dojo.require('info.mindtrove.JSonic');
var buttonHandlers = {
    stop: function(js) {
        js.stop({channel : 'default'});
        js.stop({channel : 'second'});
        js.reset({channel : 'default'});
        js.reset({channel : 'second'});
    },
    singleSay: function(js) {
        js.say({text : 'The rain in Spain falls mainly on the plain.', cache: true});
    },
    sequentialSay: function(js) {
        js.say({text : 'The rain in Spain falls mainly on the plain.', cache: true});
        js.say({text : 'The quick brown fox jumps over the lazy dog.', cache: true});
    },
    simultaneousSay: function(js) {
        js.say({text : 'The rain in Spain falls mainly on the plain.', cache : true});
        js.setProperty({name : 'voice', value : 'default+f1', channel : 'second'});
        js.say({text : 'The quick brown fox jumps over the lazy dog.', cache : true, channel : 'second'});
        js.reset({channel : 'second'});
    },
    propertiesSay: function(js) {
        js.setProperty({name : 'rate', value : 350});
        js.say({text : 'The rain in Spain falls mainly on the plain.', cache : true});
        js.setProperty({name : 'rate', value : 150});
        js.say({text : 'The quick brown fox jumps over the lazy dog.', cache : true});
        js.reset();
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
    },
    loopingSound: function(js) {
        js.setProperty({name : 'loop', value : true});
        js.play({url : 'sounds/9081__tigersound__disappear', cache : true});
        js.reset();
    },
    engineInfo: function(js) {
        console.log('fetching engines')
        js.getEngines().addCallback(function(response) {
            console.log('fetched engines');
            console.log(response.result);
            dojo.forEach(response.result, function(name) {
                js.getEngineInfo(name).addCallback(function(response) {
                    console.log('fetched engine info for ' + name);
                    console.log(response.result);
                });
            });
        }).addErrback(function(err) {
            console.error('error fetching engines');
        });
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