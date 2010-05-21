dojo.provide('info.mindtrove.tests.simple');

module('simple', MODOPTS);
test('say', function () {
    stop(TO);
    var def = this.js.say({text : UT1});
    def.callBefore(function() {
        ok(true, 'before deferred invoked');
    }).callAfter(function(completed) {
        ok(completed, 'after deferred invoked on complete');
        start();
    });
});
test('stop say', function () {
    stop(TO);
    var def = this.js.say({text : UT1});
    var js = this.js;
    def.callBefore(function() {
        ok(true, 'before deferred invoked');
        setTimeout(dojo.hitch(js, js.stop), 50);
    }).callAfter(function(completed) {
        ok(!completed, 'after deferred invoked on interrupt');
        start();
    });
});
test('loop say', 4, function() {
    stop(TO*2);
    var js = this.js;
    var def1 = this.js.setProperty({name: 'loop', value: true});
    def1.callBefore(function(value) {
        ok(!value, 'looping off before');
    }).callAfter(function(value) {
        ok(value, 'looping on after');
    });
    var def2 = this.js.say({text : UT1});
    def2.callBefore(function() {
        ok(true, 'before say deferred invoked');
        setTimeout(dojo.hitch(js, js.stop), 3000);
    }).callAfter(function(completed) {
        ok(!completed, 'after say deferred invoked on interrupt');
        start();
    });
});
test('say volume', 2, function() {
    stop(TO*2);
    var js = this.js;
    var def1 = this.js.setProperty({name: 'volume', value: 0.1});
    def1.callBefore(function(value) {
        ok(value == 1.0, 'volume 1.0 before');
    }).callAfter(function(value) {
        ok(value == 0.1, 'volume 0.1 after');
    });
    var def2 = this.js.say({text : UT2});
    def2.callAfter(function() { start(); });
});
test('say rate', 1, function() { });
test('say voice', 1, function() { });
test('play', function () {
    stop(TO);
    var def = this.js.play({url : SND1});
    def.callBefore(function() {
        ok(true, 'before deferred invoked');
    }).callAfter(function(completed) {
        ok(completed, 'after deferred invoked on complete');
        start();
    });
});
test('loop play', 4, function() { 
    stop(TO*2);
    var js = this.js;
    var def1 = this.js.setProperty({name: 'loop', value: true});
    def1.callBefore(function(value) {
        ok(!value, 'looping off before');
    }).callAfter(function(value) {
        ok(value, 'looping on after');
    });
    var def2 = this.js.play({url : SND1});
    def2.callBefore(function() {
        ok(true, 'before play deferred invoked');
        setTimeout(dojo.hitch(js, js.stop), 3000);
    }).callAfter(function(completed) {
        ok(!completed, 'after play deferred invoked on interrupt');
        start();
    });
});
test('play volume', 2, function() { 
    stop(TO*2);
    var js = this.js;
    var def1 = this.js.setProperty({name: 'volume', value: 0.1});
    def1.callBefore(function(value) {
        ok(value == 1.0, 'volume 1.0 before');
    }).callAfter(function(value) {
        ok(value == 0.1, 'volume 0.1 after');
    });
    var def2 = this.js.play({url : SND2});
    def2.callAfter(function() { start(); });
});
test('play error', function() {
    stop(TO);
    var def = this.js.play({url : SND1+'foobar'});
    def.callBefore(function() {
        ok(true, 'before deferred invoked');
    }).errAfter(function(err) {
        ok(err.name == 'Error', 'after deferred invoked on error');
        start();
    });        
});
test('stop play', 2, function() {
    stop(TO);
    var def = this.js.play({url : SND1});
    var js = this.js;
    def.callBefore(function() {
        ok(true, 'before deferred invoked');
        setTimeout(dojo.hitch(js, js.stop), 50);
    }).callAfter(function(completed) {
        ok(!completed, 'after deferred invoked on interrupt');
        start();
    });
});
