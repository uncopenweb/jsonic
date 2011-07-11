.. module:: uow.audio
   :synopsis: Namespace for the JSonic client.

The JavaScript API
==================

The client implements a JavaScript interface allowing web applications to speak text, play sounds, change playback properties, queue commands, manage independent audio channels, and cache results for low-latency playback.

Client concepts
---------------

The client consists of a set of named :term:`channels` that maintain independent :term:`queues` of :term:`commands`. A channel processes its queue sequentially in first in, first out order, though some commands are processed immediately (e.g., stop). Multiple channels can process commands at the same time, however. For example, the `default` channel might have one speech utterance queued while it is speaking another. At the same time, the `secondary` channel might process a volume change command followed by a command to play a sound.

Channels send :term:`notifications` of important events as they occur in two manners. First, channels invoke callback functions registered by an application for one or more kinds of notifications. Second, the channels return deferred results for each command before and after it is processed. The former technique is useful for listeners that need information across many commands. The latter is useful when an application wants information about particular commands.

The JSonic factory
------------------

.. function:: initJSonic

   Initializes the client API.
   
   :param args: Object with the following properties:
   
      defaultCaching (optional)

         True to enable all levels of caching as the default for calls to :meth:`say` and :meth:`play`. False to disable all caching except browser caching as the default for those methods. Defaults to false.

      jsonicURI (optional)
      
         String URI pointing to the root of the JSonic REST API. Defaults to `/`.     
 
   :type args: object   

The JSonic interface
--------------------

.. class:: JSonic

   The :class:`JSonic` class implements the entire client API. Only one instance is allowed per page and should be constructed using the :func:`initJSonic` factory function.

   .. attribute:: defaultCaching
   
      True if caching is enabled by default for all to :meth:`say` and :meth:`play` calls. False if caching is disabled by default.
      
      .. versionchanged:: 0.4
      
   .. attribute:: jsonicURI
   
      Read-only. The root of the JSonic REST API.
   
   .. method:: addObserver(func, channel, actions)
   
      Adds a listener for :ref:`notifications <notification>`.
   
      :param func: Callback function
      :type func: :func:`function(notice)`
      :param channel: Name of the channel to observe. Defaults to :const:`default` if not defined.
      :type channel: string
      :param actions: List of string :ref:`notification <notification>` actions to observe. Defaults to all actions if not defined.
      :type actions: array
      :return: Token to use to unregister the callback later using :meth:`removeObserver`
      :rtype: object
      
   .. method:: getClientVersion()
   
      Gets the version number of the client API implemented by this instance.
   
      :rtype: string
   
   .. method:: getEngines()
   
      Gets the names of the text to speech engines installed on the server.
   
      :return: A deferred callback with an object matching the :ref:`/engine schema <engine-schema>` or an errback with an :class:`Error` object
      :rtype: `dojo.Deferred`_
   
   .. method:: getEngineInfo(id)
   
      Gets detailed information about a particular text to speech engine.
   
      :param id: Identifier associated with the engine as returned by :meth:`getEngines`.
      :type id: string
      :return: A deferred callback with an object matching the :ref:`/engine/[id] schema <engine-info-schema>` or an errback with an :class:`Error` object
      :rtype: `dojo.Deferred`_

   .. method:: getProperty(args)
   
      Gets the current value of one of the supported :ref:`audio properties <property>`, immediately and at the time this command is processed in the queue.
   
      :param args: Object with the following properties:
         
         name (required)
            String name of the :ref:`property <property>` to get 

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
         
      :type args: object
      :return: A deferred callback with the property value at the time this command is received (before) and when the command is processed in the queue (after)
      :rtype: :class:`JSonicDeferred`
   
   .. method:: getServerVersion()
   
      Gets the version number of the server API currently in use by this instance.
   
      :return: A deferred callback with an object matching the :ref:`/version schema <version-schema>` or an errback with an :class:`Error` object
      :rtype: `dojo.Deferred`_

   .. method:: pause(args)
   
      Immediately pauses all output and commands on a channel. Fails when the channel is already paused.

      :param args: Object with the following properties:
         
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :return: A deferred callback with a invoked with no parameters when the pause command is processed (before) and invoked with a complete flag when the pause is processed successfully (true) or not (false)
      :rtype: :class:`JSonicDeferred`
      
      .. versionadded:: 0.5

   .. method:: pauseAll()
   
      Immediately pauses all output and commands on all channels.

      :return: An array of deferred callbacks with no parameters invoked before the pause is processed (before) and after the pause is processed (after)
      :rtype: array of :class:`JSonicDeferred`
      
      .. versionadded:: 0.5
      
   .. method:: play(args)
   
      Plays a sound. 

      :param args: Object with the following properties:

         url (required)
            String URL of the sound to play. Either :const:`.ogg` or :const:`.mp3` will be appended to the end of the URL depending on which format the browser supports.
         
         cache (optional)
            Boolean true to cache the sound audio node in memory for faster playback in the future, false to avoid caching. Defaults to :attr:`defaultCaching` if not specified.
      
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :return: A deferred callback with a invoked with no parameters when the play command is processed (before) and invoked with a completion flag (after) when the sound finishes playing (true) or is interrupted (false)
      :rtype: :class:`JSonicDeferred`
   
   .. method:: removeObserver(token)
   
      Removes a listener for speech and sound :ref:`notifications <notification>`.

      :param token: Token returned when registering the observer with :meth:`addObserver`
      :type token: object
      :rtype: :const:`undefined`

   .. method:: reset(args)
   
      Resets all channel :ref:`audio properties <property>` to their defaults.

      :param args: Object with the following properties:
      
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :rtype: :class:`JSonicDeferred`
   
   .. method:: resetAll()
   
      Resets all channel :ref:`audio properties <property>` of all channels to their defaults.
      
      :rtype: array of :class:`JSonicDeferred`
      
      .. versionadded:: 0.4
   
   .. method:: say(args)
   
      Speaks an utterance.
   
      :param args: Object with the following properties:
      
         text (required)
            String text to speak.
         
         cache (optional)
            Boolean true to cache the sound audio node in memory and the utterance file URL in localStorage for faster playback in the future, false to avoid caching. Defaults to :attr:`defaultCaching` if not specified.

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :return: A deferred callback with a invoked with no parameters when the say command is processed (before) and invoked with a completion flag (after) when the utterance finishes playing (true) or is interrupted (false)
      :rtype: :class:`JSonicDeferred`

   .. method:: setProperty(args)
   
      Sets the current value of one of the supported :ref:`audio properties <property>` either immediately or when the command is processed in the queue.

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
      :return: A deferred callback with the value of the property before it is processed (before) and the value of the property after the change is made (after)
      :rtype: :class:`JSonicDeferred`
   
   .. method:: stop(args)
   
      Immediately stops all output from a channel and clears all queued commands for that channel.

      :param args: Object with the following properties:

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.

      :type args: object
      :return: A deferred callback with no parameters invoked before the stop is processed (before) and after the stop is processed (after)
      :rtype: :class:`JSonicDeferred`

   .. method:: stopAll()
   
      Immediately stops all output on all channels and clear all queued commands on all channels.

      :return: An array of deferred callbacks with no parameters invoked before the stop is processed (before) and after the stop is processed (after)
      :rtype: array of :class:`JSonicDeferred`
      
      .. versionadded:: 0.5

   .. method:: synth(args)

      Immediately synthesizes an utterance on the server and caches its URL for later playback. The utterance adopts the properties of the channel as if it was queued behind all other commands on the channel. The synthesis startsimmediately and does not block the next command queued on the channel. The resulting speech is not queued on the channel but is always cached.

      :param args: Object with the following properties:
      
         text (required)
            String text to speak.
         
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :return: A deferred callback with a invoked with no parameters when the synth command is processed (before) and when it completes (after)
      :rtype: :class:`JSonicDeferred`

      .. versionadded:: 0.5

   .. method:: unpause(args)
   
      Immediately unpauses all output and commands on a channel. Fails when the channel is not paused.

      :param args: Object with the following properties:
         
         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.
      
      :type args: object
      :return: A deferred callback with a invoked with no parameters when the unpause command is processed (before) and invoked with a completion flag when the unpause is processed successfully (true) or not (false)
      :rtype: :class:`JSonicDeferred`
      
      .. versionadded:: 0.5

   .. method:: unpauseAll()
   
      Immediately unpauses all output and commands on all channels.

      :return: An array of deferred callbacks with no parameters invoked before the unpause is processed (before) and after the unpause is processed (after)
      :rtype: array of :class:`JSonicDeferred`
      
      .. versionadded:: 0.5

   .. method:: wait(args)
   
      Queues silence on a channel.

      :param args: Object with the following properties:

         duration (required)
            Integer duration of the silence in milliseconds

         channel (optional)
            String name of the channel. Defaults to :const:`default` if not specified.

      :type args: object
      :return: A deferred callback invoked with no parameters when the wait command is processed (before) and invoked with a completion flag (after) when the wait duration elapses (true) or is interrupted (false)
      :rtype: :class:`JSonicDeferred`
      
      .. versionadded:: 0.5
      
Before and after deferred notification
--------------------------------------

.. class:: JSonicDeferred

   The :class:`JSonicDeferred` class wraps two `dojo.Deferred`_ instances. A channel invokes the :meth:`callback` or :meth:`errback` method on the `before` deferred before a command is processed in the channel queue. A channel invokes the :meth:`callback` or :meth:`errback` method on the `after` deferred after the channel has finished processing the command.
   
   .. method:: callAfter(func)
   
      Adds a function to be called once after a command is processed successfully.
      
      :param func: Callback function
      :type func: :func:`function(notice)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`
   
   .. method:: callBefore(func)

      Adds a function to be called once before a command is processed successfully.

      :param func: Callback function
      :type func: :func:`function(notice)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`
   
   .. method:: anyAfter(func)
   
      Adds a function to be called once after a command is processed successfully or if an error occurs.
   
      :param func: Callback function
      :type func: :func:`function(noticeOrError)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`
   
   .. method:: anyBefore(func)

      Adds a function to be called once before a command is processed successfully or if an error occurs.
   
      :param func: Callback function
      :type func: :func:`function(noticeOrError)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`
   
   .. method:: errAfter(func)
   
      Adds a function to be called once after a command is processed but an error occurs.
   
      :param func: Callback function
      :type func: :func:`function(error)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`
   
   .. method:: errBefore(func)

      Adds a function to be called once before a command is processed but an error occurs.
   
      :param func: Callback function
      :type func: :func:`function(error)`
      :return: This instance for call chaining
      :rtype: :class:`JSonicDeferred`

.. _notification:

Channel notifications
---------------------

The type of a channel notification is determined by the value of its `action` property. The following notifications are supported, listed by their actions. 

.. _started-say-notice:

.. describe:: action : started-say

   Occurs when a channel starts processing a :meth:`JSonic.say` command (i.e., when it starts synthesizing the utterance).

   :param channel: Name of the channel
   :type channel: string
   :param url: URL of the synthesized speech file
   :type url: string
   :param name: Application name assigned to the utterance
   :type name: string

.. _finished-say-notice:

.. describe:: action : finished-say

   Occurs when a channel finishes processing a :meth:`JSonic.say` command (i.e., when it finishes speaking the utterance).

   :param channel: Name of the channel
   :type channel: string
   :param url: URL of the synthesized speech file
   :type url: string
   :param name: Application name assigned to the utterance
   :type name: string
   :param completed: True if the speech finished in its entirety, false if it was interrupted before it could finish
   :type completed: boolean

.. _started-play-notice:

.. describe:: action : started-play

   Occurs when a channel starts processing a :meth:`JSonic.play` command (i.e., when it starts streaming the sound).

   :param channel: Name of the channel
   :type channel: string
   :param url: URL of the sound file
   :type url: string
   :param name: Application name assigned to the sound
   :type name: string

.. _finished-play-notice:

.. describe:: action : finished-play

   Occurs when a channel finishes processing a :meth:`JSonic.play` command (i.e., when it finishes playing the sound).

   :param channel: Name of the channel
   :type channel: string
   :param url: URL of the sound file
   :type url: string
   :param name: Application name assigned to the sound
   :type name: string
   :param completed: True if the sound finished in its entirety, false if it was interrupted before it could finish
   :type completed: boolean

.. describe:: action : started-wait

   Occurs when a channel starts processing a :meth:`JSonic.wait` command.

   :param channel: Name of the channel
   :type channel: string
   :param name: Application name assigned to the sound
   :type name: string
   
   .. versionadded:: 0.5

.. describe:: action : finished-play

   Occurs when a channel finishes processing a :meth:`JSonic.wait` command (i.e., when the wait duration elapses).

   :param channel: Name of the channel
   :type channel: string
   :param name: Application name assigned to the sound
   :type name: string
   :param completed: True if the wait finished in its entirety, false if it was interrupted before it could finish
   :type completed: boolean

   .. versionadded:: 0.5

.. _error-notice:

.. describe:: action : error

   Occurs when a channel encounters an error processing a command.

   :param channel: Name of the channel
   :type channel: string
   :param name: Application name assigned to the command that caused the error
   :type name: string
   :param description: English description of the problem that occurred
   :type description: string

.. _property:

Channel properties
------------------

engine
   Text to speech engine used to synthesize speech on the channel. A string matching one of the engine names listed by :meth:`JSonic.getEngines`.
   
loop
   Flag controlling if speech or sound output on the channel loops indefinitely or not. A boolean.

pitch
   Baseline pitch of speech synthesized and output on the channel. A floating point number in the inclusive range [0.0, 1.0].

rate
   Rate of speech synthesized and output on the channel. An integer words per minute greater than zero.
   
voice
   Voice used to synthesize speech on the channel. A string matching one of the voice identifiers supported by an engine indicated by :meth:`JSonic.getEngineInfo`.

volume
   Volume of speech and sound output on the channel. A floating point number in the inclusive range [0.0, 1.0].

Example code
------------

The following examples assume an :class:`uow.audio.JSonic` instance with caching disabled by default exists in local variable `js`. The following code creates such an instance.

.. sourcecode:: javascript

   var js = uow.audio.JSonic();

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

To set an Italian voice for all following speech commands on the :const:`default` channel, do the following:

.. sourcecode:: javascript

   js.setProperty({name : 'voice', value : 'it'});

Changing speech rate
~~~~~~~~~~~~~~~~~~~~

To query the :const:`espeak` engine for its range of speech rates, do the following:

.. sourcecode:: javascript

   js.getEngineInfo('espeak').addCallback(function(response) {
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

Say you have the :func:`onEvent` function described above. You want it to execute in response to certain commands without monitoring all commands.

To execute the callback as the :const:`default` channel finishes speaking an utterance completely, do the following:

.. sourcecode:: javascript

   js.say({text : 'I am a banana.'}).addAfter(onEvent);

To execute the callback as the :const:`default` channel starts speaking an utterance and either finishes speaking or encounters an error speaking, do the following:

.. sourcecode:: javascript

   js.say({text : 'I am a banana.'}).callBefore(onEvent).anyAfter(onEvent);

To execute the callback with the voice configured on the :const:`default` channel immediately and when the command is processed by the channel, do the following:

.. sourcecode:: javascript

   js.getProperty({name : 'voice'}).callBefore(onEvent).addAfter(onEvent);

.. _dojo.Deferred: http://dojotoolkit.org/reference-guide/dojo/Deferred.html#dojo-deferred