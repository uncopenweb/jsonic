Getting Started
===============

JSonic consists of a server implementing a REST API for synthesizing speech utterances to web accessible files and client JavaScript that caches and plays speech and sound on demand. The current version implements the server using `Tornado`_ and the client using `Dojo`_.

Requirements
------------

The following lists show all of the minimum requirements for both the server and client. You do not have to download all of these up-front; the remaining sections walk you through how to .

The server Python code has been tested with these minimum versions:

1. `Python`_ 2.6
2. `Tornado`_ 0.2
3. `iterpipes`_ 0.3
4. `espeak`_ 1.36.02
5. `lame`_ 3.98.2
6. `oggenc`_ 1.2.0
7. `daemon`_ 1.0 (optional)

The client JS code requires:

1. `Dojo`_ 1.4.2 (from a CDN is fine)
2. A browser supporting the HTML5 <audio> node
3. A browser supporting HTML5 localStorage (optional)

Obtaining the JSonic source code
--------------------------------

To get the latest stable release of JSonic:

#. Visit http://github.com/uncopenweb/jsonic/downloads.
#. Download the latest version.

To get the latest development code:

#. Install `git`_.
#. Clone the JSonic git repository:

   .. sourcecode:: bash
   
      git clone git://github.com/uncopenweb/jsonic.git

Running the Tornado server
--------------------------

#. Install the prerequisites listed on the `Tornado`_ website.
#. Install the `Tornado`_ web server.
#. Install the `iterpipes`_ module.
#. Install the `espeak`_ text-to-speech engine.
#. Install `LAME`_ for MP3 encoding support.
#. Install the oggenc utility from `Vorbis tools`_ for OGG encoding support.
#. Start the JSonic server on port 8888 with 4 worker processes using the following command.

   .. sourcecode:: bash
   
      cd jsonic/server
      python jsonic.py

To get a list of command line options, run the following command.

   .. sourcecode:: bash
   
      python jsonic.py --help

Loading the JSonic Dojo module
------------------------------

#. Place the :file:`JSonic.js` file in a web accessible location.
#. Include `Dojo`_ in your web application.
#. Inform Dojo of the location of the :mod:`uow.audio` namespace on disk.
#. Use :func:`dojo.require` to load the JSonic module.

See the HTML files in the :file:`examples/` folder for complete applications satisfying these requirements. You can run the examples by visiting the :file:`http://yourdomain:8888/static/examples/` URL of the JSonic server if you start the server with the `--static` parameter.

Speaking "Hello world!"
-----------------------

#. Create a configuration object for JSonic.

   .. sourcecode:: javascript
   
      var args = {jsonicURI : '/jsonic', defaultCaching : true};

#. Create an instance of the JSonic class

   .. sourcecode:: javascript
   
      var js = new uow.audio.JSonic(args);

#. Invoke the :meth:`JSonic.say` method.

   .. sourcecode:: javascript
   
      js.say({text : 'Hello world!'})

.. _Python: http://www.python.org
.. _git: http://git-scm.com/
.. _Dojo: http://dojotoolkit.org/
.. _Tornado: http://www.tornadoweb.org/
.. _iterpipes: http://pypi.python.org/pypi/iterpipes
.. _espeak: http://espeak.sourceforge.net/
.. _LAME: http://lame.sourceforge.net/
.. _Vorbis tools: http://www.xiph.org/downloads/
.. _oggenc: http://www.xiph.org/downloads/
.. _daemon: http://pypi.python.org/pypi/daemon/1.0