<?php

$url = $_POST['url'];
$url = filter_var($url, FILTER_SANITIZE_URL);

if(!filter_var($url, FILTER_VALIDATE_URL) === false) {
    $ip = gethostbyname($url);
    
    if(!($ip === $url)) {
        echo $ip;
    }
}

?>
