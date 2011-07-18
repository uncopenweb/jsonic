/*global TO UT1 UT2 localStorage dojo ok equal getModOpts module test stop start uow*/
dojo.provide('uow.audio.tests.persist');

(function() {
    module('persist', {
         setup: function() {
             this.js = uow.audio.initJSonic({defaultCaching : true});
         },
         teardown: function() {
             if(this.js) {
                 this.js.destroyRecursive();
             }
             delete localStorage['jsonic.cache'];
         }
    });
    test('persist cache', 4, function () {
        stop(TO);
        var self = this;
        this.js.say({text : UT1}).callAfter(function() {
            self.js.say({text : UT1}).callAfter(function() {
                // destroy instance to force persistence of cache
                self.js.destroy();
                // verify cache created and its length
                var arr = dojo.fromJson(localStorage['jsonic.cache']);
                equal(arr.length, 2);
                equal(arr[0][0].slice(0, UT2.length), UT2);
                equal(arr[1][0].slice(0, UT1.length), UT1);
                // build a new instance to read the cache
                self.js = uow.audio.initJSonic({defaultCaching : true});
                // whitebox: look at cache contents
                equal(self.js._cache._speechCache.size, 2);
                start();                
            });
        });
        this.js.say({text : UT2});
    });
}());