<?php

$__domain = "";
$__user = "";
$__password = "";
$__db = "";
$__table = "";

$q = $_POST["q"];

$con=mysqli_connect($__domain, $__user, $__password, $__db);

if (mysqli_connect_errno()) {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
}
$query = "select * from $__table where symbol like '$q%';";

$result = mysqli_query($con, $query);

while($row = mysqli_fetch_array($result)) {
    $array[] = array(
        'name' => $row['name']
        );
}

echo json_encode(array_unique($array));

mysqli_close($con);
?>