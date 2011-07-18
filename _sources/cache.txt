About caching
=============

Speech URL caching
------------------

The JSonic client caches string URLs of synthesized speech files in memory the first time they are spoken by an application instance. If the user's browser supports HTML5 local storage, JSonic also stores the utterance text and its file URL in the persistent store to eliminate the synthesis request to the server the next time the application loads.

As of version 0.5, the client flushes the least-recently used information from the cache whenever it grows beyond the configured maximum size. See :meth:`uow.audio.initJsonic` for info about this setting.

Node caching
------------

As of version 0.5, the client no longer caches audio nodes as it causes audio output failures over time in certain browsers and OSes.

Browser caching
---------------

Most web browsers cache audio data retrieved by audio elements on disk or in memory for faster playback in the future. JSonic does not impede these actions, but performance of audio caching varies among current browser implementations of HTML5.