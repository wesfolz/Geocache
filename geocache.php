
<?php
    /*
    * CSCV 337 Project
    * Wesley Folz
    * geocache.php
    */
    queryDataBase();

    //sets up mysql database connection and performs query that is taken from POST array
    //returns json object containing results from query
    function queryDatabase()
    {
        $db = new PDO("mysql:host=150.135.53.5;dbname=wesfolz", "wesfolz", "1qaz2wsx!QAZ@WSX");
        $rows = $db->query($_POST['query']);
        //$rows = $db->query('SELECT latitude, longitude FROM test_data WHERE latitude >= 32.11179757078518 AND latitude <= 32.40087542921484 AND longitude >= -111.13048418187634 AND longitude <= -110.78865061812365;');
        //echo json_encode($rows);
        
        //print json_encode($rows);
        $geocaches = array();
        foreach($rows as $row)
        {
            $geocaches[] = $row['cache_id']; 
            $geocaches[] = $row['latitude'];
            $geocaches[] = $row['longitude']; 
            $geocaches[] = $row['cache_type_id'];  
            $geocaches[] = $row['difficulty_rating'];
        }
        echo json_encode($geocaches);
    }
?>