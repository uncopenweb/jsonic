'''
Speech server implementation for JSonic using Tornado web server and Mongo 
database.

:requires: Python 2.6, Tornado 0.2, PyMongo 1.4, iterpipes
:copyright: Peter Parente 2010
:license: BSD
'''
import synthesizer
import encoder
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.escape import json_encode, json_decode
import pymongo
import multiprocessing
import email.utils
import mimetypes
import datetime
import time
import os
import stat

# path containing speech files
CACHE_PATH = os.path.join(os.path.dirname(__file__), 'files')
try:
    os.mkdir(CACHE_PATH)
except OSError:
    pass

def synthesize(engineCls, encoderCls, utterances, properties):
    response = {'success' : False}
    try:
        engine = engineCls(CACHE_PATH, properties)
    except synthesize.SynthesizerError, e:
        response['description'] = str(e)
        return response
    try:
        enc = encoderCls(CACHE_PATH)
    except encoder.EncoderError, e:
        response['description'] = str(e)
        return response
    response['success'] = True
    response['files'] = {}
    for key, text in utterances.items():
        hashFn = engine.write_wav(text)
        enc.encode_wav(hashFn)
        response['files'][key] = hashFn
    return response

class SynthHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def post(self):
        args = json_decode(self.request.body)
        pool = self.application.settings['pool']
        engine = synthesizer.getClass(args.get('engine', 'espeak'))
        if engine is None:
            self.send_json_error({'description' : 'unknown speech engine'})
            return
        enc = encoder.getClass(args.get('format', '.ogg'))
        if enc is None:
            self.send_json_error({'description' : 'unknown encoder format'})
            return
        params = (engine, enc, args['utterances'], args['properties'])
        pool.apply_async(synthesize, params, callback=self.on_synth_complete)
    
    def on_synth_complete(self, response):
        if response['success']:
            self.set_header('Content-Type', 'application/json')
            self.write(json_encode(response))
            self.finish()
        else:
            self.send_json_error(response)
    
    def send_json_error(self, response):
        self.clear()
        self.set_status(500)
        self.set_header('Content-Type', 'application/json')
        response['success'] = False
        message = self.write(json_encode(response))
        self.finish(message)

class FilesHandler(tornado.web.StaticFileHandler):
    def get(self, path, include_body=True):
        abspath = os.path.abspath(os.path.join(self.root, path))
        if not abspath.startswith(self.root):
            raise HTTPError(403, "%s is not in root static directory", path)
        if not os.path.exists(abspath):
            raise HTTPError(404)
        if not os.path.isfile(abspath):
            raise HTTPError(403, "%s is not a file", path)
 
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
            file = open(abspath, "rb")
        try:
            file.seek(start)
            self.write(file.read(size))
        finally:
            file.close()

class CacheHandler(tornado.web.RequestHandler):
    def get(self, id):
        pass

def run_server(debug=False):
    kwargs = {}
    kwargs['pool'] = pool = multiprocessing.Pool(processes=4)
    if debug:
        # serve static files for debugging purposes
        kwargs['static_path'] = os.path.join(os.path.dirname(__file__), "../")
    application = tornado.web.Application([
        (r'/synth', SynthHandler),
        (r'/files/([a-f0-9]+-[a-f0-9]+\..*)', FilesHandler, {'path' : './files'}),
        (r'/cache/([a-z0-9]+)', CacheHandler)
    ], debug=debug, **kwargs)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    ioloop = tornado.ioloop.IOLoop.instance()
    ioloop.start()

if __name__ == '__main__':
    run_server(debug=True)