dojo.provide('uow.audio.tests.bugs');

module('bugs', getModOpts({defaultCaching : true}));
test('fast start/stop freeze', function() {
    var i = 0;
    var self = this;
    var cb = function() {
        if(i < 200) {
            self.js.stop();
            self.js.say({text : 'saying '+i});
            var wait = 50*Math.random();
            setTimeout(cb, wait);
        } else {
            setTimeout(start, 3000);
        }
        i++;
    };
    stop();
    cb();
});