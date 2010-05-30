Changelog
=========

Version 0.3
-----------

* Corrected :meth:`info.mindtrove.JSonicDeferred.callBefore` and :meth:`info.mindtrove.JSonicDeferred.callAfter` method names and examples.
* Added better enforcement of singleton nature of :class:`info.mindtrove.JSonic`.
* Invoking the :meth:`dijit._Widget.destroyRecursive` method on the JSonic singleton is now possible. Enables destruction of the singleton to make way for the creation of a new singleton with different options.
* Various JavaScript bug fixes for all browsers.

Version 0.2
-----------

* Changed :class:`info.mindtrove.JSonic` to a singleton.
* Added :func:`info.mindtrove.initJSonic` to create or get the singleton.

Version 0.1
-----------

First release.