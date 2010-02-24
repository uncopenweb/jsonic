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
        if not os.path.isfile(ogg):
            c = iterpipes.cmd('oggenc {} -o {}', wav, ogg)
            ret = iterpipes.call(c)

class Mp3Encoder(object):
    def __init__(self, path):
        self._path = path

    def encode_wav(self, hashFn):
        wav = os.path.join(self._path, hashFn+'.wav')
        mp3 = os.path.join(self._path, hashFn+'.mp3')
        if not os.path.isfile(mp3):
            c = iterpipes.cmd('lame {}  {}', wav, mp3)
            ret = iterpipes.call(c)

def getClass(format):
    if format == '.ogg':
        return OggEncoder
    elif format == '.mp3':
        return Mp3Encoder
    else:
        return None