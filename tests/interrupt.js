dojo.provide('info.mindtrove.tests.interrupt');

(function() {
    var mods = [
        {n : 'interrupt', args : {defaultCaching : false}},
        {n : 'interrupt+cache', args : {defaultCaching : true}}
    ];
    dojo.forEach(mods, function(mod) {
        module(mod.n, getModOpts(mod.args));
        test('stop while say', function () {
            stop(TO);
            var js = this.js;
            var def = this.js.say({text : UT1});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop then say', function () {
            stop(TO);
            var js = this.js;
            this.js.stop();
            var def = this.js.say({text : UT1});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                //setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop, say, stop', function () {
            stop(TO);
            var js = this.js;
            this.js.stop();
            var def = this.js.say({text : UT1});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop while play', 2, function() {
            stop(TO);
            var def = this.js.play({url : SND1});
            var js = this.js;
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop then play', 2, function() {
            stop(TO);
            var js = this.js;
            this.js.stop();
            var def = this.js.play({url : SND1});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
            }).callAfter(function(completed) {
                ok(completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop, play, stop', 2, function() {
            stop(TO);
            var def = this.js.play({url : SND1});
            var js = this.js;
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });        
        test('say 1, stop, say 1 again', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.say({text : UT1});
            def1.callBefore(function() {
                ok(before === 0, 'first utterance started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.say({text : UT1});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'second utterance started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'second utterance finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'first utterance finished first');
                after += 1;
            });
        });
        test('say 1, stop, say 2', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.say({text : UT1});
            def1.callBefore(function() {
                ok(before === 0, 'first utterance started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.say({text : UT2});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'second utterance started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'second utterance finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'first utterance finished first');
                after += 1;
            });
        });
        test('say, stop, play', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.say({text : UT1});
            def1.callBefore(function() {
                ok(before === 0, 'utterance started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.play({url : SND1});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'sound started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'sound finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'utterance finished first');
                after += 1;
            });
        });
        test('play, stop, say', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.play({url : SND2});
            def1.callBefore(function() {
                ok(before === 0, 'sound started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.say({text : UT2});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'utterance started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'utterance finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'sound finished first');
                after += 1;
            });
        });
        test('play 1, stop, play 1 again', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.play({url : SND1});
            def1.callBefore(function() {
                ok(before === 0, 'first sound started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.play({url : SND1});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'second sound started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'second sound finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'first sound finished first');
                after += 1;
            });
        });
        test('play 1, stop, play 2', 4, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.play({url : SND1});
            def1.callBefore(function() {
                ok(before === 0, 'first sound started first');
                before += 1;
                setTimeout(function() {
                    js.stop();
                    var def2 = js.play({url : SND2});
                    def2.callBefore(function() {
                        ok(before === 1 && after === 1, 'second sound started second');
                        before += 1;
                    }).callAfter(function(completed) {
                        ok(after === 1 && before == 2 && completed, 'second sound finished second');
                        start();
                    });
                }, 50)
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'first sound finished first');
                after += 1;
            });
        });
    });
})();