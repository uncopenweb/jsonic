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
   
      :param func: Callback function
      :type func: function(notice)
      :param channel: Name of the channel to observe. Defaults to :const:`default` if not defined.
      :type channel: string
      :param actions: List of string :ref:`action <action>` names to observe. Defaults to all actions if not defined.
      :type actions: array
      :return: Token to use to unregister the callback later using :meth:`removeObserver`
      :rtype: object
      
   .. method:: getClientVersion()
   
      :rtype: string
   
   .. method:: getEngines()
   
      :rtype: :class:`dojo.Deferred`
   
   .. method:: getEngineInfo(id)
   
      :param id: 
      :type id: string
      :rtype: :class:`dojo.Deferred`

   .. method:: getProperty(args)
   
      :param args: Object with the following properties:
         
         name (required)
            String name of the :ref:`property <property>` to get 

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
         
      :type args: object
      :rtype: :class:`dojo.Deferred`
   
   .. method:: getServerVersion()
   
      :rtype: :class:`dojo.Deferred`
      
   .. method:: play(args)

      :param args: Object with the following properties:

         url (required)
            String URL of the sound to play. Either :const:`.ogg` or :const:`.mp3` will be appeneded to the end of the URL depending on which format the browser supports.
         
         cache (optional)
            Boolean true to cache the sound audio node in memory for faster playback in the future, false to avoid caching. Defaults to false if not specified.
      
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :rtype: :class:`info.mindtrove.JSonicDeferred`
   
   .. method:: removeObserver(token)

      :param token: Token returned when registering the observer with :meth:`addObserver`
      :type token: object
      :rtype: :const:`undefined`

   .. method:: reset(args)

      :param args: Object with the following properties:
      
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :rtype: :class:`info.mindtrove.JSonicDeferred`
   
   .. method:: say(args)
   
      :param args: Object with the following properties:
      
         text (required)
            String text to speak.
         
         cache (optional)
            Boolean true to cache the sound audio node in memory and the utterance file URL in localStorage for faster playback in the future, false to avoid caching. Defaults to false if not specified.

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :rtype: :class:`info.mindtrove.JSonicDeferred`

   .. method:: setProperty(args)

      :param args: Object with the following properties:
         
         name (required)
            String name of the :ref:`property <property>` to set
            
         value (required)
            Value to set for the :ref:`property <property>` where the type is dependent on the property name
            
         immediate (optional)
            Boolean true to execute the change immediately instead of queuing the command, false to queue the property change like all other commands. Defaults to false if not specified.

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
         
      :type args: object
      :rtype: :class:`dojo.Deferred`
   
   .. method:: stop(args)

      :param args: Object with the following properties:

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.

      :type args: object
      :rtype: :class:`info.mindtrove.JSonicDeferred`

.. class:: JSonicDeferred
   
   .. method:: addAfter(func)
   
   .. method:: addBefore(func)
   
   .. method:: anyAfter(func)
   
   .. method:: anyBefore(func)
   
   .. method:: errAfter(func)
   
   .. method:: errBefore(func)

.. _action:

Callback actions
----------------

.. describe:: action : started-speech

   :param channel:
   :param url:
   :param name:

.. describe:: action : finished-speech

   :param channel:
   :param url:
   :param name:
   :param completed:

.. describe:: action : started-say

   :param channel:
   :param url:
   :param name:

.. describe:: action : finished-say

   :param channel:
   :param url:
   :param name:
   :param completed:

.. describe:: action : error

   :param channel:
   :param name:
   :param description:

.. _property:

Supported properties
--------------------

pitch
   todo

rate
   todo
   
voice
   todo

volume
   todo

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