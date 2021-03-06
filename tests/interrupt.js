/*global dojo TO UT1 UT2 ok equal getModOpts module test stop start SND1 SND2*/
dojo.provide('uow.audio.tests.interrupt');

(function() {
    var mods = [
        {n : 'interrupt', args : {defaultCaching : false}},
        {n : 'interrupt+cache', args : {defaultCaching : true}}
    ];
    dojo.forEach(mods, function(mod) {
        module(mod.n, getModOpts(mod.args));
        test('stop while say', 2, function () {
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
        test('stop then say', 2, function () {
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
        test('stop, say, stop', 2, function () {
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
                        ok(after === 1 && before === 2 && completed, 'second utterance finished second');
                        start();
                    });
                }, 50);
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
                        ok(after === 1 && before === 2 && completed, 'second utterance finished second');
                        start();
                    });
                }, 50);
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
                        ok(after === 1 && before === 2 && completed, 'sound finished second');
                        start();
                    });
                }, 50);
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
                        ok(after === 1 && before === 2 && completed, 'utterance finished second');
                        start();
                    });
                }, 50);
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
                        ok(after === 1 && before === 2 && completed, 'second sound finished second');
                        start();
                    });
                }, 50);
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
                        ok(after === 1 && before === 2 && completed, 'second sound finished second');
                        start();
                    });
                }, 50);
            }).callAfter(function(completed) {
                ok(after === 0 && !completed, 'first sound finished first');
                after += 1;
            });
        });        
        test('stop while wait', 2, function () {
            stop(TO);
            var js = this.js;
            var def = this.js.wait({duration : 1000});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('stop then wait', 2, function () {
            stop(TO);
            var js = this.js;
            this.js.stop();
            var def = this.js.wait({duration : 1000});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
            }).callAfter(function(completed) {
                ok(completed, 'after deferred invoked w/o interrupt');
                start();
            });
        });
        test('stop, wait, stop', 2, function () {
            stop(TO);
            var js = this.js;
            this.js.stop();
            var def = this.js.wait({duration : 1000});
            def.callBefore(function() {
                ok(true, 'before deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after deferred invoked on interrupt');
                start();
            });
        });
        test('wait, stop, wait', 4, function () {
            stop(TO);
            var js = this.js;
            var def = this.js.wait({duration : 1000});
            var def2;
            def.callBefore(function() {
                ok(true, 'before first deferred invoked');
                setTimeout(function() {js.stop();}, 10);
            }).callAfter(function(completed) {
                ok(!completed, 'after first deferred invoked on interrupt');
                def2 = js.wait({duration: 1000});
                def2.callBefore(function() {
                    ok(true, 'before second deferred invoked');
                }).callAfter(function(completed) {
                    ok(completed, 'before second deferred invoked w/o interrupt');
                    start();
                });
            });
        });
        test('say, say, pause, unpause', 6, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.say({text : UT1});
            var def2 = this.js.say({text : UT2});
            var def3 = this.js.pause();
            setTimeout(function() {js.unpause();}, 1000);
            def1.callBefore(function() {
                ok(before === 0, 'first utterance started first');
                before = 1;
            }).callAfter(function(completed) {
                ok(after === 0 && completed, 'first utterance finished first');
                after = 1;
            });
            def2.callBefore(function() {
                ok(before === 1, 'second utterance started second');
            }).callAfter(function(completed) {
                ok(after === 1 && completed, 'second utterance finished second');
                start();
            });
            def3.callBefore(function() {
                ok(true, 'before pause');
            }).callAfter(function(completed) {
                ok(true, 'after pause');
            });            
        });
        test('say, pause, say, unpause', 6, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def1 = this.js.say({text : UT1});
            var def3 = this.js.pause();
            var def2 = this.js.say({text : UT2});
            setTimeout(function() {js.unpause();}, 1000);
            def1.callBefore(function() {
                ok(before === 0, 'first utterance started first');
                before = 1;
            }).callAfter(function(completed) {
                ok(after === 0 && completed, 'first utterance finished first');
                after = 1;
            });
            def2.callBefore(function() {
                ok(before === 1, 'second utterance started second');
            }).callAfter(function(completed) {
                ok(after === 1 && completed, 'second utterance finished second');
                start();
            });
            def3.callBefore(function() {
                ok(true, 'before pause');
            }).callAfter(function(completed) {
                ok(true, 'after pause');
            });            
        });
        test('pause, say, say, unpause', 6, function() {
            stop(TO*2);
            var js = this.js;
            var before = 0;
            var after = 0;
            var def3 = this.js.pause();
            var def1 = this.js.say({text : UT1});
            var def2 = this.js.say({text : UT2});
            setTimeout(function() {js.unpause();}, 1000);
            def1.callBefore(function() {
                ok(before === 0, 'first utterance started first');
                before = 1;
            }).callAfter(function(completed) {
                ok(after === 0 && completed, 'first utterance finished first');
                after = 1;
            });
            def2.callBefore(function() {
                ok(before === 1, 'second utterance started second');
            }).callAfter(function(completed) {
                ok(after === 1 && completed, 'second utterance finished second');
                start();
            });
            def3.callBefore(function() {
                ok(true, 'before pause');
            }).callAfter(function(completed) {
                ok(true, 'after pause');
            });            
        });        
        test('say, pause, stop, unpause, say', 13, function() {
            stop(TO*2);
            var js = this.js;
            var seq = [
                'say1_before', 
                'pause_before', 
                'pause_after', 
                'stop_before',
                'stop_after',
                'unpause_before',
                'unpause_after',
                'say1_after',
                'say2_before',
                'say2_after'
            ];
            js.say({text : UT1}).callBefore(function() {
                equal(seq.shift(), 'say1_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'say1_after');
                ok(!completed, 'say1 interrupted');
            });
            setTimeout(function() {
                js.pause().callBefore(function() {
                    equal(seq.shift(), 'pause_before');
                }).callAfter(function(completed) {
                    equal(seq.shift(), 'pause_after');
                });  
                setTimeout(function() {
                    js.stop().callBefore(function() {
                        equal(seq.shift(), 'stop_before');
                    }).callAfter(function() {
                        equal(seq.shift(), 'stop_after');
                    });
                    js.unpause().callBefore(function() {
                        equal(seq.shift(), 'unpause_before');
                    }).callAfter(function(success) {
                        equal(seq.shift(), 'unpause_after');
                        ok(!success, 'unpause disallowed');
                    });
                    js.say({text : UT2}).callBefore(function() {
                        equal(seq.shift(), 'say2_before');
                    }).callAfter(function(completed) {
                        equal(seq.shift(), 'say2_after');
                        ok(completed, 'say2 completed');
                        start();
                    });
                }, 1000);
            }, 1000);
        });
        test('wait, wait, pause, unpause', 10, function() {
            stop(TO*2);
            var js = this.js;
            var seq = [
                'pause_before', 
                'pause_after', 
                'unpause_before',
                'unpause_after',
                'wait1_before', 
                'wait1_after',
                'wait2_before',
                'wait2_after'
            ];
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait1_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait1_after');
                ok(completed, 'say1 completed');
            });
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait2_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait2_after');
                ok(completed, 'wait2 completed');
                start();
            });
            this.js.pause().callBefore(function() {
                equal(seq.shift(), 'pause_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'pause_after');
            });  
            setTimeout(function() {
                js.unpause().callBefore(function() {
                    equal(seq.shift(), 'unpause_before');
                }).callAfter(function() {
                    equal(seq.shift(), 'unpause_after');
                });
            }, 1000);
        });
        test('wait, pause, wait, unpause', 10, function() {
            stop(TO*2);
            var js = this.js;
            var seq = [
                'pause_before', 
                'pause_after', 
                'unpause_before',
                'unpause_after',
                'wait1_before',
                'wait1_after',
                'wait2_before',
                'wait2_after'
            ];
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait1_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait1_after');
                ok(completed, 'say1 completed');
            });
            this.js.pause().callBefore(function() {
                equal(seq.shift(), 'pause_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'pause_after');
            });  
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait2_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait2_after');
                ok(completed, 'wait2 completed');
                start();
            });
            setTimeout(function() {
                js.unpause().callBefore(function() {
                    equal(seq.shift(), 'unpause_before');
                }).callAfter(function() {
                    equal(seq.shift(), 'unpause_after');
                });
            }, 1000);
        });
        test('pause, wait, wait, unpause', 10, function() {
            stop(TO*2);
            var js = this.js;
            var seq = [
                'pause_before', 
                'pause_after', 
                'unpause_before',
                'unpause_after',
                'wait1_before', 
                'wait1_after',
                'wait2_before',
                'wait2_after'
            ];
            this.js.pause().callBefore(function() {
                equal(seq.shift(), 'pause_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'pause_after');
            });  
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait1_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait1_after');
                ok(completed, 'say1 completed');
            });
            this.js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait2_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait2_after');
                ok(completed, 'wait2 completed');
                start();
            });
            setTimeout(function() {
                js.unpause().callBefore(function() {
                    equal(seq.shift(), 'unpause_before');
                }).callAfter(function() {
                    equal(seq.shift(), 'unpause_after');
                });
            }, 1000);            
        });
        test('wait, pause, stop, unpause, wait', 13, function() {
            stop(TO*2);
            var js = this.js;
            var seq = [
                'wait1_before',
                'pause_before', 
                'pause_after', 
                'stop_before',
                'stop_after',
                'unpause_before',
                'unpause_after',
                'wait1_after',
                'wait2_before',
                'wait2_after'
            ];
            js.wait({duration : 1000}).callBefore(function() {
                equal(seq.shift(), 'wait1_before');
            }).callAfter(function(completed) {
                equal(seq.shift(), 'wait1_after');
                ok(!completed, 'wait1 interrupted');
            });
            setTimeout(function() {
                js.pause().callBefore(function() {
                    equal(seq.shift(), 'pause_before');
                }).callAfter(function(completed) {
                    equal(seq.shift(), 'pause_after');
                });  
                setTimeout(function() {
                    js.stop().callBefore(function() {
                        equal(seq.shift(), 'stop_before');
                    }).callAfter(function() {
                        equal(seq.shift(), 'stop_after');
                    });
                    js.unpause().callBefore(function() {
                        equal(seq.shift(), 'unpause_before');
                    }).callAfter(function(success) {
                        equal(seq.shift(), 'unpause_after');
                        ok(!success, 'unpause disallowed');
                    });
                    js.wait({duration : 1000}).callBefore(function() {
                        equal(seq.shift(), 'wait2_before');
                    }).callAfter(function(completed) {
                        equal(seq.shift(), 'wait2_after');
                        ok(completed, 'wait2 completed');
                        start();
                    });
                }, 1000);
            }, 500);       
        });
    });
}());