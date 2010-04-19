About caching
=============

The JSonic client makes use of various levels of caching to lower the time delay between a call to :meth:`info.mindtrove.JSonic.say` and actual audio output.

URL caching
-----------

The JSonic client caches string URLs of synthesized speech files in memory the first time they are spoken. If the user's browser supports HTML5 local storage, it also stores the utterance text and its file URL in the local store to reduce the number of server requests for speech files by one the next time the application loads.

As of version |version|, the client does not attempt to flush cached URLs from memory or local storage. A future version of JSonic will support a configurable maximum URL cache size and invalidation algorithm.

Node caching
------------

The JSonic client caches HTML5 audio elements for synthesized speech and sound playback in memory the first time they are output. JSonic clones these elements when the speech utterances or sounds are output again in the same application instance.

As of version |version|, the client does not attempt to flush audio nodes from memory. A future version of JSonic will support a configurable maximum node cache size and invalidation algorithm.

Browser caching
---------------

Most web browsers cache audio data retrieved by audio elements on disk or in memory for faster playback in the future. JSonic does not impede these actions, but performance of audio caching varies between current browser implementations of HTML5.