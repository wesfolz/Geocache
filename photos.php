<?php
	/*
	* CSCV 337 Project
	* Wesley Folz
	* photos.php
	*/
	flickrRequest();

	//gets flickr url from post, makes curl request and saves results as a json object
	function flickrRequest()
	{
		$curl = curl_init();
		curl_setopt_array($curl, array(
			CURLOPT_RETURNTRANSFER => 1,
			CURLOPT_URL => $_POST['flickrURL']
		));
		$result = curl_exec($curl);
		curl_close($curl);

		$json = json_decode($result, true);

		constructFlickrURLS($json);

		//echo $json["photos"]["photo"][0]['farm'];;
	}

	//constructs flickr urls from json object and returns a new json object
	function constructFlickrURLS($photoData)
	{
		$urls = array();
		foreach ($photoData['photos']['photo'] as $photo) 
		{
			$urls[] = "http://farm" . $photo['farm'] .".staticflickr.com/" . $photo['server']
				. "/" . $photo['id'] . '_' . $photo['secret'] . ".jpg";
		}
		echo json_encode($urls);
	}

?>