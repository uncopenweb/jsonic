======
JSonic
======

:Author: Peter Parente
:Description: JavaScript API for speech and sound using HTML5 audio.

Status
======

My focus is currently on implementing the client-side API using Dojo and HTML5 audio. I will then concentrate on a server-side speech synthesis REST API using Tornado and Mongo.

License
=======

Copyright (c) 2010, Peter Parente
All rights reserved.

http://creativecommons.org/licenses/BSD/

Todo
====

* better error handling
   * start with no audio in safari?
   * error loading audio?
   * error during synth, server and client
* callback for property change
* get available engines from server
* get supported engine/props from server
* everything deferred?
* switch to using pyttsx for synth?