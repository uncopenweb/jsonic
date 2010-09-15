dojo.provide('uow.audio.tests.concurrent');

(function() {
    var mods = [
        {n : 'concurrent', args : {defaultCaching : false}},
        {n : 'concurrent+cache', args : {defaultCaching : true}}
    ];
    dojo.forEach(mods, function(mod) {
        module(mod.n, getModOpts(mod.args));
        test('say 1 while say 1', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.say({text : UT1});
            var def2 = this.js.say({text : UT1, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'utterance started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'utterance finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'utterance started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'utterance finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });

        test('say 1 while say 2', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.say({text : UT1});
            var def2 = this.js.say({text : UT2, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'utterance 1 started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'utterance 1 finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'utterance 2 started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'utterance 2 finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });

        test('say while play', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.say({text : UT1});
            var def2 = this.js.play({url : SND1, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'utterance started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'utterance finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'sound started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'sound finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });

        test('play while say', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.play({url : SND1});
            var def2 = this.js.say({text : UT1, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'sound started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'sound finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'utterance started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'utterance finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });

        test('play 1 while play 1', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.play({url : SND1});
            var def2 = this.js.play({url : SND1, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'sound started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'sound finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'sound started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'sound finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });

        test('play 1 while play 2', 4, function() {
            stop(TO);
            var ch1 = [0,0];
            var ch2 = [0,0];
            var def1 = this.js.play({url : SND1});
            var def2 = this.js.play({url : SND2, channel : 'other'});
            def1.callBefore(function() {
                ok(!ch1[0] && !ch1[1], 'sound 1 started on default channel');
                ch1[0]++;
            }).callAfter(function(completed) {
                ok(ch1[0] && !ch1[1] && completed, 'sound 1 finished on default channel');
                ch1[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
            def2.callBefore(function() {
                ok(!ch2[0] && !ch2[1], 'sound 2 started on other channel');
                ch2[0]++;
            }).callAfter(function(completed) {
                ok(ch2[0] && !ch2[1] && completed, 'sound 2 finished on other channel');
                ch2[1]++
                if(ch1[1] && ch2[1]) {start();}
            });
        });
    });
})();