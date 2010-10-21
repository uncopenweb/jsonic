Changelog
=========

Version 0.4
-----------

* Migrated to uow.audio namespace.
* Added the :meth:`uow.audio.JSonic.resetAll` method.
* Made the :attr:`uow.audio.JSonic.defaultCaching` attribute settable.

Version 0.3
-----------

* Corrected :meth:`uow.audio.JSonicDeferred.callBefore` and :meth:`uow.audio.JSonicDeferred.callAfter` method names and examples.
* Added better enforcement of singleton nature of :class:`uow.audio.JSonic`.
* Invoking the :meth:`dijit._Widget.destroyRecursive` method on the JSonic singleton is now possible. Enables destruction of the singleton to make way for the creation of a new singleton with different options.
* Various JavaScript bug fixes for all browsers.

Version 0.2
-----------

* Changed :class:`uow.audio.JSonic` to a singleton.
* Added :func:`uow.audio.initJSonic` to create or get the singleton.

Version 0.1
-----------

First release.