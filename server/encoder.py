'''
Audio encoder implementations for JSonic.

:var ENCODERS: Names paired with available IEncoder implementations
:type ENCODERS: dict

:requires: Python 2.6, iterpipes 0.3, lame 3.98.2, oggenc 1.2.0
:copyright: Peter Parente 2010
:license: BSD
'''
import iterpipes
import os

class EncoderError(Exception):
    '''
    Exception to throw for any encoding error, including a human readable
    description of what went wrong.
    '''
    pass

class IEncoder(object):
    '''
    All synthesizers must implement this instance interface.
    '''
    def __init__(self, path):
        '''
        Constructor.
        
        :param path: Path to where synthesized files are stored
        :type path: str
        :raises: EncoderError
        '''
        raise NotImplementedError
    
    def encode_wav(self, hashFn):
        '''
        Encodes an utterance WAV to a file in the cache folder. The root name 
        of the file must match the root of the original WAV file as defined by
        ISythesizer.write_wave. The file extension should be typical of files
        of the encoded mimetype.
        
        :param hashFn: Root name of the WAV file on disk, sans extension
        :type hashFn: str
        :raises: EncoderError
        '''
        raise NotImplementedError

class OggEncoder(IEncoder):
    '''
    Encodes audio using Ogg Vorbis from the command line.
    '''
    def __init__(self, path):
        '''Implements IEncoder constructor.'''
        self._path = path

    def encode_wav(self, hashFn):
        '''Implements IEncoder.encode_wav.'''
        wav = os.path.join(self._path, hashFn+'.wav')
        ogg = os.path.join(self._path, hashFn+'.ogg')
        if not os.path.isfile(ogg):
            c = iterpipes.cmd('oggenc --quiet {} -o {}', wav, ogg)
            ret = iterpipes.call(c)

class Mp3Encoder(IEncoder):
    '''
    Encodes audio as MP3 using LAME from the command line.
    '''
    def __init__(self, path):
        '''Implements IEncoder constructor.'''
        self._path = path

    def encode_wav(self, hashFn):
        '''Implements IEncoder.encode_wav.'''
        wav = os.path.join(self._path, hashFn+'.wav')
        mp3 = os.path.join(self._path, hashFn+'.mp3')
        if not os.path.isfile(mp3):
            c = iterpipes.cmd('lame --quiet {}  {}', wav, mp3)
            ret = iterpipes.call(c)

# global list of available synth implementations
# @todo: add these dynamically if the synths actually work on the platform
ENCODERS = {'.ogg' : OggEncoder, '.mp3' : Mp3Encoder}

def get_class(format):
    '''
    Gets the encoder class associated with the format extension.
    
    :param format: Extension with the prefix `.`
    :type format: str
    :return: IEncoder class or None if the name is unknown
    :rtype: cls
    '''
    return ENCODERS.get(format, None)