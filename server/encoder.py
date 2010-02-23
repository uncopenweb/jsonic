'''
Audio encoder implementations for JSonic.

:requires: Python 2.6, iterpipes
:copyright: Peter Parente 2010
:license: BSD
'''
import iterpipes
import os

class EncoderError(Exception): pass

class OggEncoder(object):
    def __init__(self, path):
        self._path = path

    def encode_wav(self, hashFn):
        wav = os.path.join(self._path, hashFn+'.wav')
        ogg = os.path.join(self._path, hashFn+'.ogg')
        c = iterpipes.cmd('oggenc {} -o {}', wav, ogg)
        ret = iterpipes.call(c)
        print 'encoder', ret

class Mp3Encoder(object):
    def __init__(self, path):
        self._path = path

    def encode_wav(self, hashFn):
        print 'encode wav'
        wav = os.path.join(self._path, hashFn+'.wav')
        mp3 = os.path.join(self._path, hashFn+'.mp3')
        print wav
        print mp3
        c = iterpipes.cmd('lame {}  {}', wav, mp3)
        print c
        ret = iterpipes.call(c)
        print 'encoder', ret

def getClass(format):
    if format == '.ogg':
        return OggEncoder
    elif format == '.mp3':
        return Mp3Encoder
    else:
        return None