======
JSonic
======

:Author: Peter Parente
:Description: JavaScript API for speech and sound using HTML5 audio.

Requirements
============

The client JS code requires:

1. Dojo 1.4.1 (from a CDN is fine)
2. A browser supporting the HTML5 <audio> node
3. JSonic.js

The server Python code requires these minimum versions:

1. Twisted 0.2
2. iterpipes 0.3
3. espeak 1.36.02
4. lame lame 3.98.2
5. oggenc 1.2.0
6. Mongo 1.2.4 (optional)
7. PyMongo 1.4 (optional)

Execute `python jsonic.py` to start the server. The see the demos under `examples/` for how to use the JS API.

License
=======

Copyright (c) 2010, Peter Parente
All rights reserved.

http://creativecommons.org/licenses/BSD/

Todo
====

Not necessarily in this order:

* sphinx doc
* server tracking of app utterances
* cache warming on app start
* callback for property change
* everything deferred?