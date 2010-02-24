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
import time
import os

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
            response = {'success' : False, 'description' : 'invalid speech engine'}
            self.write(json_encode(response))
            self.finish()
            return
        enc = encoder.getClass(args.get('format', '.ogg'))
        if enc is None:
            response = {'success' : False, 'description' : 'invalid speech format'}
            self.write(json_encode(response))
            self.finish()
            return
        params = (engine, enc, args['utterances'], args['properties'])
        pool.apply_async(synthesize, params, callback=self.on_synth_complete)
    
    def on_synth_complete(self, response):
        self.write(json_encode(response))
        self.finish()

class FilesHandler(tornado.web.RequestHandler):
    def get(self, id):
        pass

class CacheHandler(tornado.web.RequestHandler):
    def get(self, id):
        pass

class DebugHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, value):
        pool = self.application.settings['pool']
        pool.apply_async(worker, (int(value),), callback=self.on_work_complete)
        self.write('running async')
    
    def on_work_complete(self, result):
        self.write(str(result))
        self.finish()

def run_server(debug=False):
    kwargs = {}
    kwargs['pool'] = pool = multiprocessing.Pool(processes=4)
    if debug:
        # serve static files for debugging purposes
        kwargs['static_path'] = os.path.join(os.path.dirname(__file__), "../")
    application = tornado.web.Application([
        (r'/synth', SynthHandler),
        (r'/files/([a-f0-9]+-[a-f0-9]+)', FilesHandler),
        (r'/cache/([a-z0-9]+)', CacheHandler)
    ], debug=debug, **kwargs)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    ioloop = tornado.ioloop.IOLoop.instance()
    ioloop.start()

if __name__ == '__main__':
    run_server(debug=True)