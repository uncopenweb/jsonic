<?php
define('BIN', '/home/parente/usr/bin/');
define('CACHE', 'cache/');

$tmp = array();
function writeWav($utterance, $out) {
    $rv = 0;
    $temp_file = tempnam(sys_get_temp_dir(), 'tts');
    file_put_contents($temp_file, $utterance);
    exec(BIN."speak -w $out -f $temp_file", $tmp, $rv);
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
    exec(BIN."lame $wav $out", $tmp, $rv);
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

// pull out request params
$json = $_POST['json'];
// decode json
$request = json_decode(file_get_contents('php://input'));
// determine format function from format request
if($request->format == 'ogg') {
    $formatFunc = 'writeOgg';
    $ext = '.ogg';
} else if($request->format == 'mp3') {
    $formatFunc = 'writeMp3';
    $ext = '.ogg';
} else {
    // respond with error
    $response['success'] = false;
    $response['reason'] = "unknown audio file format";
    respond($response);
    exit;
}

// iterate utterances
foreach($request->utterances as $utterance) {
    $hash = sha1($utterance);
    $root = CACHE.$hash;
    $out = "${root}${ext}";
    $success = true;
    if(!is_file($out)) {
        $wav = "$root.wav";
        if(!is_file($wav)) {
            // synth new speech
            $success = (writeWav($utterance, $wav) == 0);
        }
        if($success) {
            // encode to format
            $success = ($formatFunc($wav, $out) == 0);
        }
    }
    if($success) {
        $response[$utterance] = $out;
    } else {
        $response[$utterance] = NULL;
    }
}

$response['success'] = true;
respond($response);
exit;
?>