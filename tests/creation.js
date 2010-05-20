dojo.provide('info.mindtrove.tests.creation');

module('creation');
test('factory', function() {
    var js1 = info.mindtrove.initJSonic();
    ok(js1, 'factory created singleton');
    var js2 = info.mindtrove.initJSonic();
    ok(js2 === js1, 'factory returned singleton');
    var js3 = info.mindtrove.initJSonic({defaultCaching : true});
    ok(js3 === js2, 'factory returned singleton, ignored params');
    js1.destroyRecursive();
    var js4 = info.mindtrove.initJSonic();
    ok(js1 !== js4, 'factory created new singleton');
    js4.destroyRecursive();
});
test('constructor', function() {
    var js1 = new info.mindtrove.JSonic();
    ok(js1, 'constructor w/ no args');
    var x;
    try {
        var js2 = new info.mindtrove.JSonic({defaultCaching : true});
    } catch(e) {
        x = e
    }
    ok(x, 'constructor threw exception for dupe');
});