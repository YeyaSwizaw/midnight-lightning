<?php

$domain = $_POST['domain'];

$lat = "";
$lon = "";

$servername = "localhost";
$username = "root";
$password = trim(file_get_contents("/var/www/html/info/db_password"));
$dbname = "lightning";

$conn = mysqli_connect($servername, $username, $password, $dbname);

$key = trim(file_get_contents("/var/www/html/info/majestic"));

if($conn->connect_error) {
        die("Couldn't connect to database: " . $conn->connect_error);
}

$sql = "SELECT lat, lon "
     . "FROM DomainLocations "
     . "WHERE domain=\"" . $domain . "\"";

$result = $conn->query($sql);

if($result->num_rows == 0) {
    $response = file_get_contents("http://api.majestic.com/api/json?app_api_key=" . $key . "&cmd=GetRefDomainInfo&items=1&datasource=fresh&item0=" . $domain);
    $json = json_decode($response, true);
    $results = $json['DataTables']['DomainsInfo']['Data'];

    $lat = $results[0]['Latitude'];
    $lon = $results[0]['Longitude'];

    $sql = "INSERT INTO DomainLocations "
         . "VALUES ('" . $domain . "', " . $lat . ", " . $lon . ")";

    if(!($conn->query($sql) === TRUE)) {
        die("Couldn't insert to database: " . $conn->error);
    }
} else {
    $row = $result->fetch_assoc();
    $lat = $row["lat"];
    $lon = $row["lon"];
}

$conn->close();

echo $lat . '
' . $lon;

?>
