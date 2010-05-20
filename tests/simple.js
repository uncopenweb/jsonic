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
test('loop say', 1, function() { });
test('say volume', 1, function() { });
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
test('loop play', 1, function() { });
test('play volume', 1, function() { });
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
