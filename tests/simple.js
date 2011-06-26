dojo.provide('uow.audio.tests.simple');

(function() {
    var mods = [
        {n : 'simple', args : {defaultCaching : false}},
        {n : 'simple+cache', args : {defaultCaching : true}}
    ];
    dojo.forEach(mods, function(mod) {
        module(mod.n, getModOpts(mod.args));
        test('say', 2, function () {
            stop(TO);
            var def = this.js.say({text : UT1});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
            }).callAfter(function(completed) {
                ok(completed, 'after deferred invoked on complete');
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
                setTimeout(function() {js.stop();}, 3000);
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
        test('say rate', 3, function() {
            stop(TO*2);
            var tok;
            var js = this.js;
            var def1 = this.js.setProperty({name: 'rate', value: 800});
            def1.callBefore(function(value) {
                ok(value == 200, 'rate 200 wpm before');
            }).callAfter(function(value) {
                ok(value == 800, 'rate 800 wpm after');
            });
            var def2 = this.js.say({text : UT1});
            def2.callBefore(function() {
                tok = setTimeout(function() {js.stop();}, 1000);
            }).callAfter(function(completed) {
                clearTimeout(tok);
                ok(completed, 'fast say completed before stop');
                start();
            });
        });
        test('say voice', 2, function() {
            stop(TO*2);
            var js = this.js;
            var def1 = this.js.setProperty({name: 'voice', value: 'default+f2'});
            def1.callBefore(function(value) {
                ok(value == 'default', 'voice default before');
            }).callAfter(function(value) {
                ok(value == 'default+f2', 'voice default+f2 after');
            });
            var def2 = this.js.say({text : UT2});
            def2.callAfter(function() { start(); });
        });
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
                setTimeout(function() {js.stop();}, 3000);
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
                ok(err.action == 'error', 'after deferred invoked on error');
                start();
            });        
        });
        test('wait', 3, function () {
            stop(TO);
            var def = this.js.wait({duration : 4000});
            var fired = false;
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {
                    ok(!fired, '3s interval fired before wait deferred');
                    fired = true;
                }, 3000);
            }).callAfter(function(completed) {
                ok(completed && fired, 'after deferred invoked on complete');
                start();
            });
        });
    });
})();

