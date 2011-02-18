dojo.provide('uow.audio.tests.bugs');

module('bugs', getModOpts({defaultCaching : true}));
test('fast start/stop freeze', function() {
    var i = 0;
    var self = this;
    var cb = function() {
        if(i < 50) {
            self.js.stop();
            self.js.say({text : 'saying '+i});
            setTimeout(cb, 100);
        } else {
            setTimeout(start, 1000);
        }
        i++;
    };
    stop();
    cb();
});