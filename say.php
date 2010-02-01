<?php
include 'langs.php';

define('BIN', '/home/parente/usr/bin/');
define('CACHE', 'cache/');
define('MIN_PITCH', 0);
define('MAX_PITCH', 99);
define('MIN_WPM', 80);
define('MAX_WPM', 390);

$tmp = array();
function buildSpeakOptions($request) {
    global $LANGS;
    $opts = "";
    if($request->pitch !== NULL) {
        $val = (int)$request->pitch;
        $val = min(max($val, MIN_PITCH), MAX_PITCH);
        $opts .= " -p$val";
    }
    if($request->wpm !== NULL) {
        $val = (int)$request->wpm;
        $val = min(max($val, MIN_WPM), MAX_WPM);
        $opts .= " -s$val";
    }
    if($request->lang !== NULL) {
        $val = $LANGS[$request->lang];
        if($val !== NULL) {
            $opts .= " -v$val";
        }
    }
    return $opts;
}

function buildHash($utterance, $opt) {
    return sha1($utterance) . '-' . sha1($opt);
}

function writeWav($utterance, $out, $opts) {
    $rv = 0;
    $temp_file = tempnam(sys_get_temp_dir(), 'tts');
    file_put_contents($temp_file, $utterance);
    exec(BIN."speak $opts -w $out -f $temp_file", $tmp, $rv);
    unlink($temp_file);
    return $rv;
}

function writeOgg($wav, $out) {
    $rv = 0;
    exec(BIN."oggenc $wav -o $out", $tmp, $rv);
    return $rv;
}

function writeMp3($wav, $out) {
    $rv = 0;
    exec(BIN."lame $wav $out", &$tmp, $rv);
    return $rv;
}

function respond($res) {
    echo json_encode($res);
}

$response = array();
// make sure cache dir exists
if(!is_dir(CACHE)) {
    $response['success'] = false;
    $response['reason'] = "speech cache missing";
    respond($response);
    exit;    
}

// get request
$json = $_POST['json'];
$request = json_decode(file_get_contents('php://input'));
// build options
$opts = buildSpeakOptions($request);

// determine format function from format request
if($request->format == 'ogg') {
    $formatFunc = 'writeOgg';
    $ext = '.ogg';
} else if($request->format == 'mp3') {
    $formatFunc = 'writeMp3';
    $ext = '.mp3';
} else {
    // respond with error
    $response['success'] = false;
    $response['reason'] = "unknown audio file format";
    respond($response);
    exit;
}

// iterate utterances
$files = array();
foreach($request->utterances as $id => $utterance) {
    $hash = buildHash($utterance, $opts);
    $root = CACHE.$hash;
    $out = "${root}${ext}";
    $success = true;
    if(!is_file($out)) {
        $wav = "$root.wav";
        if(!is_file($wav)) {
            // synth new speech
            $success = (writeWav($utterance, $wav, $opts) == 0);
        }
        if($success) {
            // encode to format
            $success = ($formatFunc($wav, $out) == 0);
        }
    }
    if($success) {
        $files[$id] = $out;
    } else {
        $files[$id] = NULL;
    }
}

$response['opts'] = $opts;
$response['files'] = $files;
$response['success'] = true;
respond($response);
exit;
?>