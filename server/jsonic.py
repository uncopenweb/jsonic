'''
Speech server implementation for JSonic using Tornado web server and Mongo 
database.

:requires: Python 2.6, Tornado 0.2
:copyright: Peter Parente 2010
:license: BSD
'''
import synthesizer
import encoder
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.escape import json_encode, json_decode
import multiprocessing
import email.utils
import mimetypes
import datetime
import time
import os
import stat
import optparse

# current server api version
VERSION = '0.1'
# path containing synthed and encoded speech files
CACHE_PATH = os.path.join(os.path.dirname(__file__), 'files')
try:
    os.mkdir(CACHE_PATH)
except OSError:
    pass

def synthesize(engineCls, encoderCls, utterances, properties):
    '''
    Executes speech synthesis and encoding in a separate process in the worker 
    pool to avoid blocking the Tornado server.
    
    :param engineCls: ISynthesizer implementation to use for synth
    :type engineCls: class
    :param encoderCls: IEncoder implementation to use for encoding
    :type encoderCls: class
    :param utterances: Dictionary of utterance IDs (keys) paired with unicode
        utterance strings to synthesize (values)
    :type utterances: dict
    :param properties: Dictionary of properties to use when synthesizing. 
        The properties supported are determined by the engineCls implementation
        of ISynthesizer.get_info.
    :type properties: dict
    :return: A dictionary describing the results of worker in the following
        format on success:
        
        {
            'success' : True,
            'result' : {
                'id1' : 'utterance filname1',
                'id2' : 'utterance filname2',
                ...
            }
        }
        
        where the IDs matches those paired with the text utterances passed
        to the function.
        
        On error, the result is in the following format:
        
        {
            'success' : False,
            'description' : <str>
        }
        
        where the description is a developer-readable explanation of why
        synthesis failed.
    :rtype: dict
    '''
    response = {'success' : False}
    try:
        engine = engineCls(CACHE_PATH, properties)
    except synthesizer.SynthesizerError, e:
        response['description'] = str(e)
        return response
    try:
        enc = encoderCls(CACHE_PATH)
    except encoder.EncoderError, e:
        response['description'] = str(e)
        return response
    response['success'] = True
    response['result'] = {}
    for key, text in utterances.items():
        hashFn = engine.write_wav(text)
        enc.encode_wav(hashFn)
        response['result'][key] = hashFn
    return response

class JSonicHandler(tornado.web.RequestHandler):
    '''
    Base class for all handlers.
    '''
    def send_json_error(self, response):
        '''
        Sends a HTTP 500 error with a JSON body containing more information
        about the error. Finishes the HTTP response to prevent further output.
        
        :param response: Response from a handler implementation to be 
            serialized as JSON. Contains at least a boolean `success` field 
            that is alway set to false to indicate an error.
        :type response: dict
        '''
        self.clear()
        self.set_status(500)
        #self.set_header('Content-Type', 'application/json')
        response['success'] = False
        message = self.write(response)
        self.finish(message)

class SynthHandler(JSonicHandler):
    '''
    Synthesizes speech to an encoded file for a later fetch from a static file 
    URL.
    '''
    @tornado.web.asynchronous
    def post(self):
        '''
        Performs speech synthesis of the utterances posted in the following
        JSON format:
        
        {
            "format" : <unicode>,
            "utterances" : {
                "id1" : <unicode>,
                "id2" : <unicode>,
                ...
            },
            "properties" : {
                "property1" : <any>,
                "property2" : <any>,
                ...
            }
        }
        
        where the format dicates the encoding for the resulting speech files,
        the utterance values are the text to synthesize as speech,
        and the property names and values are those supported by the selected
        engine (also one of the properties).
        
        Responds with information about the synthesized utterances in the
        following JSON format on success:
        
        {
            "success" : true,
            "result" : {
                "id1" : <unicode>,
                "id2"" : <unicode>,
                ...
            }
        }
        
        where the utterance keys match those in the request and the values are 
        the filenames of the synthesized files accessible using the 
        FilesHandler. 

        Responds with the following JSON error if synthesis fails:
        
        {
            "success" : false,
            "description" : <unicode>
        }
        '''
        args = json_decode(self.request.body)
        pool = self.application.settings['pool']
        engine = synthesizer.get_class(args.get('engine', 'espeak'))
        if engine is None:
            self.send_json_error({'description' : 'unknown speech engine'})
            return
        enc = encoder.get_class(args.get('format', '.ogg'))
        if enc is None:
            self.send_json_error({'description' : 'unknown encoder format'})
            return
        params = (engine, enc, args['utterances'], args['properties'])
        pool.apply_async(synthesize, params, callback=self.on_synth_complete)
        #self.on_synth_complete(synthesize(*params))
    
    def on_synth_complete(self, response):
        # protect against IOErrors bubbling up to worker pool
        try:
            if response['success']:
                #self.set_header('Content-Type', 'application/json')
                self.write(response)
                self.finish()
            else:
                self.send_json_error(response)
        except IOError:
            # doesn't look like we should do any cleanup, but who knows
            pass

class VersionHandler(tornado.web.RequestHandler):
    '''
    Retrieves information about the server version.
    '''
    def get(self):
        '''
        Responds with the version number of the current server API in the
        following JSON format:
        
        {
            "version" : <unicode>
        }
        '''
        self.write({version : VERSION})

class EngineHandler(JSonicHandler):
    '''
    Retrieves information about available speech synthesis engines.
    '''
    def get(self, name=None):
        '''
        Responds with a list of all engines if name is None in the following 
        JSON format:
        
        {
            "success" : true,
            "result" : [<unicode>, <unicode>, ...]
        }

        Responds with the properties supported by a single engine in the 
        following JSON format if name is a valid engine name. The exact fields 
        available are dependent on the ISynthesizer.get_info implementation for
        the engine.
        
        {
            "success" : true,
            "result" {
                "range_property" {
                    "minimum" : <number>,
                    "maximum" : <number>,
                    "default" : <number>
                },
                "enumeration_property" : {
                    "values" : [<unicode>, <unicode>, ...],
                    "default" : <unicode>
                },
                ...
            }
        }
        
        Responds with the following JSON error if information about the named
        engine is unavailable:
        
        {
            "success" : false,
            "description" : <unicode>
        }
        
        :param name: Name of the engine to query for details or None to get
            a list of all supported engines. Defaults to None.
        :param name: str
        '''
        if name is None:
            names = synthesizer.SYNTHS.keys()
            ret = {'success' : True, 'result' : names}
            self.write(json_encode(ret))
        else:
            cls = synthesizer.get_class(name)
            if cls is None:
                self.send_json_error({'description' : 'invalid engine'})
            else:
                info = cls.get_info()
                ret = {'success' : True, 'result' : info}
                self.write(ret)

class FilesHandler(tornado.web.StaticFileHandler):
    '''
    Retrieves cached speech files. Overrides the base class implementation to
    support partial content requests. 
    
    This handler should not be used if your deployment places the Tornado
    web server behind a proxy such as nginx which is much better at serving
    up static files. It is provided to make JSonic an all-in-one package if
    so desired.
    '''
    def get(self, path, include_body=True):
        '''
        Gets bytes from a synthesized, encoded speech file.
        
        :param path: Path to the file
        :type path: str
        :param include_body: Include the body of the file if modified?
        :type include_body: bool
        '''
        abspath = os.path.abspath(os.path.join(self.root, path))
        if not abspath.startswith(self.root):
            raise tornado.web.HTTPError(403, "%s is not in root static directory", path)
        if not os.path.exists(abspath):
            raise tornado.web.HTTPError(404)
        if not os.path.isfile(abspath):
            raise tornado.web.HTTPError(403, "%s is not a file", path)

        stat_result = os.stat(abspath)
        modified = datetime.datetime.fromtimestamp(stat_result[stat.ST_MTIME])
 
        self.set_header("Last-Modified", modified)
        if "v" in self.request.arguments:
            self.set_header("Expires", datetime.datetime.utcnow() + \
                                       datetime.timedelta(days=365*10))
            self.set_header("Cache-Control", "max-age=" + str(86400*365*10))
        else:
            self.set_header("Cache-Control", "public")
        mime_type, encoding = mimetypes.guess_type(abspath)
        if mime_type:
            self.set_header("Content-Type", mime_type)
 
        # Check the If-Modified-Since, and don't send the result if the
        # content has not been modified
        ims_value = self.request.headers.get("If-Modified-Since")
        if ims_value is not None:
            date_tuple = email.utils.parsedate(ims_value)
            if_since = datetime.datetime.fromtimestamp(time.mktime(date_tuple))
            if if_since >= modified:
                self.set_status(304)
                return
 
        if not include_body:
            return
        
        # check if there's a range request
        rng = self.request.headers.get('Range')
        if rng is None:
            # send the whole file
            start = 0
            size = stat_result[stat.ST_SIZE]
            self.set_header("Content-Length", str(size))
        else:
            self.set_status(206)
            # send just the requested bytes
            kind, rng = rng.split('=')
            start, end = rng.split('-')
            if not end: end = stat_result[stat.ST_SIZE]-1
            start = int(start)
            end = int(end)
            size = end - start + 1
            self.set_header("Content-Length", str(size))
            self.set_header("Content-Range", 'bytes %d-%d/%d' %
                (start, end, stat_result[stat.ST_SIZE]))
        fh = open(abspath, "rb")
        try:
            fh.seek(start)
            self.write(fh.read(size))
        finally:
            fh.close()

def run(port=8888, processes=4, debug=False, static=False, pid=None):
    '''
    Runs an instance of the JSonic server.
    
    :param port: Server port
    :type port: int
    :param processes: Number of worker processes for synthesis and caching
        operations. Defaults to 4.
    :type processes: int
    :param debug: True to enable automatic server reloading for debugging.
        Defaults to False.
    :type debug: bool
    :param static: True to serve ../ as static files to allow running of the
        example code and downloading of the JS directly from this server. 
        False to disable static file sharing when this server should handle the
        JSonic REST API only.
    :type static: bool
    :param pid: Name of a pid file to write if launching as a daemon or None
        to run in the foreground
    :type pid: string
    '''
    if pid is not None:
        # launch as a daemon and write the pid file
        import daemon
        daemon.daemonize(pid)
    kwargs = {}
    kwargs['pool'] = pool = multiprocessing.Pool(processes=processes)
    if static:
        # serve static files for debugging purposes
        kwargs['static_path'] = os.path.join(os.path.dirname(__file__), "../")
    application = tornado.web.Application([
        (r'/engine', EngineHandler),
        (r'/engine/([a-zA-Z0-9]+)', EngineHandler),
        (r'/synth', SynthHandler),
        (r'/files/([a-f0-9]+-[a-f0-9]+\..*)', FilesHandler, {'path' : './files'}),
        (r'/version', VersionHandler)
    ], debug=debug, **kwargs)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(port)
    ioloop = tornado.ioloop.IOLoop.instance()
    ioloop.start()

def run_from_args():
    '''
    Runs an instance of the JSonic server with options pulled from the command
    line.
    '''
    parser = optparse.OptionParser()
    parser.add_option("-p", "--port", dest="port", default=8888,
        help="server port number", type="int")
    parser.add_option("-w", "--workers", dest="workers", default=4,
        help="size of the worker pool", type="int")
    parser.add_option("--debug", dest="debug", action="store_true", 
        default=False, help="enable Tornado debug mode w/ automatic loading (default=false)")
    parser.add_option("--static", dest="static", action="store_true", 
        default=False, help="enable Tornado sharing of the jsonic root folder (default=false)")
    parser.add_option("--pid", dest="pid", default=None, type="str",
        help="launch as a daemon and write to the given pid file (default=None)")
    (options, args) = parser.parse_args()
    # run the server
    run(options.port, options.workers, options.debug, options.static, options.pid)
    
if __name__ == '__main__':
    run_from_args()