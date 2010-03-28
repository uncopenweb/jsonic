Getting Started
===============

JSonic consists of a server implementing a REST API for synthesizing speech utterances to web accessible files and client JavaScript that caches and plays speech and sound on demand. The current version implements the server using `Tornado`_ and the client using `Dojo`_.

Obtaining the source code
-------------------------

#. Install `git`_.
#. Clone the git repository:

   .. sourcecode:: bash
   
      git clone git://github.com/parente/jsonic.git

Running the Tornado server
--------------------------

#. Install the prerequisites listed on the `Tornado`_ website.
#. Install the `Tornado`_ web server. (tested with v 0.2)
#. Install the `iterpipes`_ module. (tested with v 0.3)
#. Install the `espeak`_ text-to-speech engine. (tested with v 1.36.02)
#. Install `LAME`_ for MP3 encoding support. (tested with v 3.98.2)
#. Install the oggenc utility from `Vorbis tools`_ for OGG encoding support. (tested with v 1.2.0)
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
#. Include `Dojo`_ (tested with 1.4.2) in your web application.
#. Inform Dojo of the location of the `info.mindtrove` namespace on disk.
#. Use :func:`dojo.require` to load the JSonic module.

See the HTML files in the :file:`examples/` folder for complete applications satisfying these requirements.

Speaking "Hello world!"
-----------------------

#. Create a configuration object for JSonic.

   .. sourcecode:: javascript
   
      var args = {jsonicURI : '/jsonic', defaultCaching : true};

#. Create an instance of the JSonic class

   .. sourcecode:: javascript
   
      var js = new info.mindtrove.JSonic(args);

#. Invoke the :meth:`JSonic.say` method.

   .. sourcecode:: javascript
   
      js.say({text : 'Hello world!'})

.. _git: http://git-scm.com/
.. _Dojo: http://dojotoolkit.org/
.. _Tornado: http://www.tornadoweb.org/
.. _iterpipes: http://pypi.python.org/pypi/iterpipes
.. _espeak: http://espeak.sourceforge.net/
.. _LAME: http://lame.sourceforge.net/
.. _Vorbis tools: http://www.xiph.org/downloads/