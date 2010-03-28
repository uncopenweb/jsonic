The JavaScript API
==================

The client implements a JavaScript interface allowing web applications to query 

The JSonic interface
--------------------

Examples
--------

The following examples assume an :class:`info.mindtrove.JSonic` instance with caching disabled by default exists in local variable `js`.

Speaking text
~~~~~~~~~~~~~

To say an utterance on the :const:`default` channel and not cache the result, do the following:

.. sourcecode:: javascript

   js.say({text : "This is some text to speak."});

To say an utterance on the same channel and cache the result for lower latency, do the following:

.. sourcecode:: javascript

   js.say({text : "This is some text to speak.", cache : true});

To queue two sequential utterances on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   js.say({text : "This is some text to speak."});
   js.say({text : "I wait my turn."});   

To say two utterances simultaneously, one of the :const:`default` channel and the other on the :const:`custom` channel, do the following:

.. sourcecode:: javascript

   js.say({text : "This is some text to speak."});
   js.say({text : "Ha! I like to interrupt.", channel : 'custom'});

Playing a sound
~~~~~~~~~~~~~~~

To play a sound, letting JSonic choose the proper format (OGG or MP3) based on the browser capabilities, do the following:

.. sourcecode:: javascript

   js.play({url : 'http://somewhere.com/sounds/sound_effect'});

where a file named :file:`sound_effect.mp3` and/or :file:`sound_effect.ogg` exists at the given URL.

Interrupting
~~~~~~~~~~~~

To cease output on the :const:`default` channel and clear its queued commands, do the following:

.. sourcecode:: javascript

   js.stop()

Changing voices
~~~~~~~~~~~~~~~

Changing speech rate
~~~~~~~~~~~~~~~~~~~~

Changing volume
~~~~~~~~~~~~~~~


Listening for events
~~~~~~~~~~~~~~~~~~~~

Say you have a JSonic event callback named :func:`onEvent` implemented as follows:

.. sourcecode:: javascript

   function onEvent(event) {
      console.log(event);
   }

To register the callback for all events on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   var tok1 = js.addObserver(onEvent);

To register the callback only for sound start and error events on the :const:`custom` channel, do the following:

.. sourcecode:: javascript

   var tok2 = js.addObserver(onEvent, 'custom', ['start-play', 'error']);

To unregister the callback on the default channel only, do the following:

.. sourcecode:: javascript

   js.removeObserver(tok1);

Taking action before / after a command
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~