'''
Speech synthesizer implementations for JSonic.

:var SYNTHS: Names paired with available ISynthesizer implementations
:type SYNTHS: dict

:requires: Python 2.6, iterpipes 0.3, espeak 1.36.02
:copyright: Peter Parente 2010
:license: BSD
'''
import iterpipes
import hashlib
import itertools
import os

class SynthesizerError(Exception): 
    '''
    Exception to throw for any synthesis error, including a human readable
    description of what went wrong.
    '''
    pass

class ISynthesizer(object):
    '''
    All synthesizers must implement this instance and class interface.
    '''
    def __init__(self, path, properties):
        '''
        Constructor.
        
        :param path: Path to where synthesized files are stored
        :type path: str
        :param properties: Speech properties for any synthesis performed using
            this instance of the synthesizer. The supported properties are 
            dictated by the synthesizer implementation as returned by the
            get_info class method.
        :param properties: dict 
        '''
        raise NotImplementedError
    
    def write_wav(self, utterance):
        '''
        Synthesizes an utterance to a WAV file on disk in the cache folder. 
        The name of the file must be in the following format:

        <sha1 hash of utterance>-<sha1 hash of engine + synth properties>.wav
        
        :param utterance: Unicode text to synthesize as speech
        :type utterance: unicode
        :return: Root name of the WAV file on disk, sans extension
        :rtype: str
        '''
        raise NotImplementedError
    
    @classmethod
    def get_info(cls):
        '''
        Gets information about the speech properties supported by this 
        synthesizer. Caches this information whenever possible to speed future
        queries.
        
        :return: A dictionary describing the properties supported by this
            synthesizer. The common properties are defined as follows:
            
            {
                'rate' : { // always in words per minute
                    'minimum' : <number>,
                    'maximum' : <number>,
                    'default' : <number>
                },
                'pitch' : {
                    'minimum' : <number>,
                    'maximum' : <number>,
                    'default' : <number>
                },
                'voices' : {
                    'values' : [<str>, <str>, ...],
                    'default' : <str>
                }
            }
            
            If any of these properties are not supported, they should be left
            out of the dictionary. If additional properties are supported they 
            can be included in dictionary in a similar format.
        :rtype: dict
        :raises: RuntimeError if the engine is not available on the server
        '''
        raise NotImplementedError

class EspeakSynth(ISynthesizer):
    '''
    Synthesizes speech using espeak from the command line.
    
    :ivar _path: Output cache path
    :ivar _opts: Command line options for `speak`
    :ivar _optHash: Hash of command line options for `speak`
    :cvar MIN_PITCH: Minimum pitch supported
    :cvar MAX_PITCH: Maximum pitch supported
    :cvar MIN_RATE: Minimum rate supported in WPM
    :cvar MAX_RATE: Maximum rate supported in WPM
    :cvar INFO: Dictionary of all supported engine properties cached for 
        fast responses to queries
    '''
    MIN_PITCH = 0
    MAX_PITCH = 99
    MIN_RATE = 80
    MAX_RATE = 390
    INFO = None

    def __init__(self, path, properties):
        '''Implements ISynthesizer constructor.'''
        # path where to write the file
        self._path = path
        # construct command line options for this synth instance
        self._opts = []
        try:
            rate = int(properties['rate'])
            rate = min(max(rate, self.MIN_RATE), self.MAX_RATE)
            self._opts.append(str(rate))
        except TypeError:
            raise SynthesizerError('invalid rate')
        except KeyError:
            self._opts.append('200')

        try:
            pitch = int(properties['pitch'] * 100)
            pitch = min(max(pitch, self.MIN_PITCH), self.MAX_PITCH)
            self._opts.append(str(pitch))
        except TypeError:
            raise SynthesizerError('invalid pitch')
        except KeyError:
            self._opts.append('50')

        try:
            voice = str(properties['voice'])
            assert voice in EspeakSynth.get_info()['voices']['values']
            self._opts.append(voice)
        except AssertionError:
            raise SynthesizerError('invalid voice')
        except KeyError:
            self._opts.append('default')

        # store property portion of filename
        self._optHash = hashlib.sha1('espeak' + str(self._opts)).hexdigest()

    def write_wav(self, utterance):
        '''Implements ISynthesizer.write_wav.'''
        utf8Utterance = utterance.encode('utf-8')
        utterHash = hashlib.sha1(utf8Utterance).hexdigest()
        hashFn = '%s-%s' % (utterHash, self._optHash)
        # write wave file into path
        wav = os.path.join(self._path, hashFn+'.wav')
        if not os.path.isfile(wav):
            args = self._opts + [wav]
            c = iterpipes.cmd('speak -s{} -p{} -v{} -w{}', *args, 
                encoding='utf-8')
            ret = iterpipes.call(c, utterance)
        return hashFn

    @classmethod
    def get_info(cls):
        '''Implements ISynthesizer.get_info.'''
        if cls.INFO is None:
            out = iterpipes.run(iterpipes.linecmd('speak --voices'))
            # get voices from fixed width columns
            voices = [ln[40:52].strip() for i, ln in enumerate(out) if i > 0]
            # generate all variants for voices
            variants = ['', '+f1', '+f2', '+f3', '+f4', '+m1', '+m2', '+m3', 
                '+m4', '+m5', '+m6', '+whisper', '+croak']
            voices = itertools.chain(*[
                [voice+variant for voice in voices] 
                for variant in variants
            ])
            cls.INFO = {
                'rate' : {
                    'minimum' : cls.MIN_RATE, 
                    'maximum' : cls.MAX_RATE,
                    'default' : 200
                },
                'pitch' : {
                    'minimum' : 0.0, 
                    'maximum' : 1.0,
                    'default' : 0.5
                }, 
                'voices' : {
                    'values' : list(voices),
                    'default' : 'default'
                }
            }
        return cls.INFO

# global list of available synth implementations
# @todo: add these dynamically if the synths actually work on the platform
SYNTHS = {'espeak' : EspeakSynth}

def get_class(name):
    '''
    Gets the synthesizer class associated with the given synth engine name.
    
    :param name: Name of the synthesizer
    :type name: str
    :return: ISynthesizer class or None if the name is unknown
    :rtype: cls
    '''
    return SYNTHS.get(name, None)