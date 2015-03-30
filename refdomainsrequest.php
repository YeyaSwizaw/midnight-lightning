<?php

$domain = $_POST['domain'];

$servername = "localhost";
$username = "root";
$password = trim(file_get_contents("/var/www/html/info/db_password"));
$dbname = "lightning";

$conn = mysqli_connect($servername, $username, $password, $dbname);

$key = trim(file_get_contents("/var/www/html/info/majestic"));

if($conn->connect_error) {
    die("Couldn't connect to database: " . $conn->connect_error);
}

$sql = "SELECT refdomain, ip "
     . "FROM RefDomains "
     . "WHERE domain=\"" . $domain . "\"";

$result = $conn->query($sql);

if($result->num_rows == 0) {
    // Lookup w/ majestic and add to DB
    $response = file_get_contents("http://developer.majestic.com/api/json?app_api_key=" . $key . "&cmd=GetRefDomains&Count=20&OrderBy1=0&OrderDir1=1&OrderBy2=1&OrderDir2=0&item0=" . $domain);
    $json = json_decode($response, true);
    $results = $json['DataTables']['Results']['Data'];
    echo count($results);
    foreach($results as $result) {
        $refDomain = $result["Domain"];
        $ip = $result["IP"];
        $sql = "INSERT INTO RefDomains "
             . "VALUES ('" . $domain . "', '" . $refDomain . "', '" . $ip . "')";
        if(!($conn->query($sql) === TRUE)) {
            die("Couldn't insert to database: " . $conn->error);
        }
        echo '
';
        echo $refDomain;
        echo '
';
        echo $ip;
    }
} else {
    echo $result->num_rows;
    while($row = $result->fetch_assoc()) {
        echo '
';
        echo $row["refdomain"];
        echo '
';
        echo $row["ip"];
    }
}

$conn->close();

?>
