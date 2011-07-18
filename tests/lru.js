/*global dojo ok equal getModOpts module test stop start*/
dojo.provide('uow.audio.tests.lru');

(function() {
    module('lru', {
        setup: function() {
             this.cache = uow.audio.LRUCache({maxSize : 5});
        }
    });

    test('push up to max', 10, function () {
        var rv;
        for(var i=0; i < this.cache.maxSize; i++) {
            rv = this.cache.push(i, i);
            equal(rv, null);
            equal(this.cache.size, i+1);
        }
    });

    test('push repeat', 20, function () {
        var rv;
        for(var i=0; i < this.cache.maxSize*2; i++) {
            rv = this.cache.push(1, i);
            equal(rv, null);
            equal(this.cache.size, 1);
        }
    });

    test('push overflow', 25, function() {
        var rv;
        for(var i=0; i < this.cache.maxSize*2; i++) {
            rv = this.cache.push(i, i);
            if(i < 5) {
                equal(rv, null);
                equal(this.cache.size, i+1);
            } else {
                equal(rv.key, i - 5);
                equal(rv.value, i - 5);
                equal(this.cache.size, this.cache.maxSize);
            }
        }
    });

    test('push reorder', 16, function() {
        var rv;
        for(var i=0; i < this.cache.maxSize; i++) {
            rv = this.cache.push(i, i);
            equal(rv, null);
        }
        rv = this.cache.push(0, 100);
        equal(rv, null);
        for(var i=5; i < this.cache.maxSize*2 - 1; i++) {
            rv = this.cache.push(i, i);
            equal(rv.key, i-4);
            equal(rv.value, i-4);
        }
        rv = this.cache.push(100, 100);
        equal(rv.key, 0);
        equal(rv.value, 100);
    });

    test('to array', 10, function() {
        var i;
        for(i=0; i < this.cache.maxSize; i++) {
            this.cache.push(i, i+10);
        }
        var arr = this.cache.toArray();
        for(i=0; i < this.cache.maxSize; i++) {
            var node = arr[i];
            equal(node[0], i);
            equal(node[1], i+10);
        }
    });

    test('from array', 11, function() {
        var arr = [[0,10], [1,11], [2,12], [3,13], [4,14], [5,15], [6,16]];
        this.cache.fromArray(arr);
        equal(this.cache.size, this.cache.maxSize);
        var carr = this.cache.toArray();
        for(var i=0; i<this.cache.maxSize; i++) {
            equal(carr[i].key, arr[i+2].key);
            equal(carr[i].value, arr[i+2].value);
        }
    });
}());