dojo.provide('info.mindtrove.tests.interrupt');

(function() {
    var mods = [
        {n : 'interrupt', args : {defaultCaching : false}},
        {n : 'interrupt+cache', args : {defaultCaching : true}}
    ];
    dojo.forEach(mods, function(mod) {
        module(mod.n, getModOpts(mod.args));
        test('stop say', function () {
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
        test('stop play', 2, function() {
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
                    console.log('** calling stop');
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
    });
})();