'''
Speech synthesizer implementations for JSonic.

:requires: Python 2.6, iterpipes
:copyright: Peter Parente 2010
:license: BSD
'''
import iterpipes
import hashlib
import os

class SynthesizerError(Exception): pass

class EspeakSynth(object):
    MIN_PITCH = 0
    MAX_PITCH = 99
    MIN_RATE = 80
    MAX_RATE = 390

    def __init__(self, path, properties):
        # path where to write the file
        self._path = path
        # construct command line options for this synth instance
        self._opts = []
        try:
            rate = int(properties['rate'])
            rate = min(max(rate, self.MIN_RATE), self.MAX_RATE)
            self._opts.append('-s%d' % rate)
        except TypeError:
            raise SynthesizerError('invalid rate')
        except KeyError:
            pass
        
        try:
            pitch = int(properties['pitch'])
            pitch = min(max(pitch, self.MIN_PITCH), self.MAX_PITCH)
            self._opts.append('-p%d' % pitch)
        except TypeError:
            raise SynthesizerError('invalid pitch')
        except KeyError:
            pass

        try:
            lang = str(properties['language'])
            # @todo: confirm valid else going to grow cache for no reason
            self._opts.append('-v%s' % lang)
        except KeyError:
            pass

        # store property portion of filename
        self._optHash = hashlib.sha1(' '.join(self._opts)).hexdigest()

    def write_wav(self, utterance):
        utterHash = hashlib.sha1(utterance).hexdigest()
        hashFn = '%s-%s' % (utterHash, self._optHash)
        # write wave file into path
        wav = os.path.join(self._path, hashFn+'.wav')
        c = iterpipes.cmd('speak {} -w {}', ' '.join(self._opts), wav)
        ret = iterpipes.call(c, utterance)
        print 'synth', ret
        return hashFn

def getClass(engine):
    if engine == 'espeak':
        return EspeakSynth
    else:
        return None