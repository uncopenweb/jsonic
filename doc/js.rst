.. module:: info.mindtrove
   :synopsis: Namespace for the JSonic client.

The JavaScript API
==================

The client implements a JavaScript interface allowing web applications to speak text, play sounds, change playback properties, queue commands, manage independent audio channels, and cache results for low-latency playback.

The JSonic interface
--------------------

.. class:: JSonic

   .. method:: constructor(args)
   
      :param args: 
      :type args: object
   
   .. method:: addObserver(func, channel, actions)
   
      :param func: 
      :type func: function
      :param channel: 
      :type channel: string
      :param actions: 
      :type actions: array
      :return:
      :rtype: object
   
   .. method:: getEngines()
   
      :rtype:
   
   .. method:: getEngineInfo(id)
   
      :param id: 
      :type id: string
      :rtype:

   .. method:: getProperty(args)
   
      :param args: 
      :type args: object
      :rtype:
      
   .. method:: play(args)

      :param args: 
      :type args: object
      :rtype:
   
   .. method:: removeObserver(token)

      :param token: 
      :type token: object
      :rtype:

   .. method:: reset(args)

      :param args: 
      :type args: object
      :rtype:
   
   .. method:: say(args)
   
      :param args: 
      :type args: object
      :rtype:

   .. method:: setProperty(args)

      :param args: 
      :type args: object
      :rtype:
   
   .. method:: stop(args)

      :param args: 
      :type args: object
      :rtype:

.. class:: JSonicDeferred
   
   .. method:: addAfter(func)
   
   .. method:: addBefore(func)
   
   .. method:: anyAfter(func)
   
   .. method:: anyBefore(func)
   
   .. method:: errAfter(func)
   
   .. method:: errBefore(func)

Example code
------------

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

To query the :const:`espeak` engine for its available voices, do the following:

.. sourcecode:: javascript

   js.getEngineInfo('espeak').addAfter(function(response) {
      var voices = response.voices.values;
   });

To set the voice for all following speech commands on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   js.setProperty({name : 'voice', value : 'it'});

Changing speech rate
~~~~~~~~~~~~~~~~~~~~

To query the :const:`espeak` engine for its range of speech rates, do the following:

.. sourcecode:: javascript

   js.getEngineInfo('espeak').addAfter(function(response) {
      var min = response.rate.minimum;
      var max = response.rate.maximum;
   });

To set the rate for all following speech commands on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   js.setProperty({name : 'rate', value : 250});

Changing volume
~~~~~~~~~~~~~~~

To set the volume for all following audio output on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   js.setProperty({name : 'volume', value : 0.5});

To set the volume for the current audio output and all following commands on the :const:`custom` channel, do the following:

.. sourcecode:: javascript

   js.setProperty({name : 'volume', value : 0.25, immediate : true});

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

Say you have the :func:`onEvent` function described above. You want it to execute in response to certain commands.

To execute the callback as the :const:`default` channel finishes speaking an utterance completely, do the following:

.. sourcecode:: javascript

   js.say({text : 'I am a banana.'}).addAfter(onEvent);

To execute the callback as the :const:`default` channel starts speaking an utterance and either finishes speaking or encounters an error speaking, do the following:

.. sourcecode:: javascript

   js.say({text : 'I am a banana.'}).addBefore(onEvent).anyAfter(onEvent);


To execute the callback with the voice configured on the :const:`default` channel immediately and when the command is processed by the channel, do the following:

.. sourcecode:: javascript

   js.getProperty({name : 'voice'}).addBefore(onEvent).addAfter(onEvent);