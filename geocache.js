"use strict";

/**
* CSCV 337 Project
* Wesley Folz
* geocache.js
*/

//global variables
var map;
var circle;
var metersToMiles = 1609;
var markers = [];
var cacheTypes = ["Traditional", "Mystery/Puzzle", "Multi-Cache"];
var lastRowSelected;
var lastMarkerSelected;
var idArray = {};
var tableVisible = true;

//initialize map and location
function initialize() 
{       
    var mapDiv = document.getElementById('map-canvas');
    var mapOptions = {
    center: { lat: -34.397, lng: 150.644},
    zoom: 11
    };
    map = new google.maps.Map( mapDiv,
          mapOptions);
    
    geoFindMe();
    //initMapControls();
}

//find user location
function geoFindMe() 
{
    var output = document.getElementById("out");

    if (!navigator.geolocation)
    {
        alert("Geolocation is not supported by your browser");
        return;
    }

    function success(position) 
    {
        var latitude  = position.coords.latitude;
        var longitude = position.coords.longitude;

        map.panTo(new google.maps.LatLng(latitude, longitude));
        drawCircle();
        initMapControls();


        //document.getElementById('latitudeInput').value = latitude;
        //document.getElementById('longitudeInput').value = longitude;

        //findGeocaches();
        //flickrRequest();

    }

    function error() 
    {
        alert("Unable to retrieve your location");
    }

    navigator.geolocation.getCurrentPosition(success, error);
}

//get bounds of circle
function getCircleBounds()
{
    return encodeURIComponent(circle.getBounds().getSouthWest().lng() + "," + circle.getBounds().getSouthWest().lat() +
     ", " + circle.getBounds().getNorthEast().lng() + "," + circle.getBounds().getNorthEast().lat());
}

//draw circle on map
function drawCircle()
{
    var circleOptions = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: map.getCenter(),
        radius: 10*metersToMiles
    };
    circle = new google.maps.Circle(circleOptions);
}

//initialize map controls (dropdown lists, text boxes, buttons)
function initMapControls()
{
    var controlDiv = document.createElement("div");
    var goButton = document.createElement('button');
    var radiusSelect = document.createElement('select');
    var radiusOption = document.createElement('option');
    var typeSelect = document.createElement('select');
    var typeOption = document.createElement('option');
    var difficultySelect = document.createElement('select');
    var difficultyOption = document.createElement('option');
    var latitudeInput = document.createElement('input');
    var longitudeInput = document.createElement('input');
    latitudeInput.type = "text";
    longitudeInput.type = "text";
    latitudeInput.value = map.getCenter().lat();

    if(map.getCenter().lng() > 180)
    {
        longitudeInput.value = map.getCenter().lng() - 360;
    }
    else
    {
        longitudeInput.value = map.getCenter().lng(); 
    }

    latitudeInput.setAttribute('id', 'latitudeInput');
    longitudeInput.setAttribute('id', 'longitudeInput');    

    radiusOption.value = "0";
    radiusOption.text = "Radius:";
    radiusSelect.add(radiusOption);
    typeOption.value = "-1";
    typeOption.text = "Cache Type:";
    typeSelect.add(typeOption);

    difficultyOption.value = "-1";
    difficultyOption.text = "Difficulty:";
    difficultySelect.add(difficultyOption);

    for(var i=5; i<=200; i+=5)
    {
        var option = document.createElement('option');
        option.value = i;
        option.text = i + " miles";
        radiusSelect.add(option);
    }

    for(var i=0; i<=2; i++)
    {
        var option = document.createElement('option');
        option.value = i;
        option.text = cacheTypes[i];
        typeSelect.add(option);
    }    
    
    for(var i=1; i<=10; i++)
    {
        var option = document.createElement('option');
        option.value = i;
        option.text = "Level " + i;
        difficultySelect.add(option);
    }

    //radiusSelect.addEventListener("change", function(){changeRadius(radiusSelect);});
    goButton.appendChild(document.createTextNode("Find Geocaches!"));
    goButton.addEventListener("click", 
        function(){findGeocaches(radiusSelect.value, difficultySelect.value, typeSelect.value);});

    controlDiv.appendChild(goButton);
    controlDiv.appendChild(radiusSelect);
    controlDiv.appendChild(typeSelect);
    controlDiv.appendChild(difficultySelect);
    controlDiv.appendChild(latitudeInput);
    controlDiv.appendChild(longitudeInput);
    controlDiv.setAttribute('id', 'controls');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

    var photoDiv = document.createElement('div');
    photoDiv.setAttribute("id", "photoArea");
    map.controls[google.maps.ControlPosition.BOTTOM].push(photoDiv);
    createGeocacheTable();
}

//change circle radius or center
function modifyCircle(radius)
{
    if(radius > 0)
    {
        circle.setRadius(radius*metersToMiles);
    }
    circle.setCenter(map.getCenter());
}

//invoke flickr to get photos
function flickrRequest(position)
{
    map.panTo(position);
    //var bounds = getCircleBounds();
    //alert(position.lng());

    var params = new FormData();
    var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=a46cf1a87551483bc7aad9c5779b369e'/*&bbox='+ bounds*/ +
    '&lat=' + position.lat() + '&lon=' + position.lng() + '&format=json&nojsoncallback=1';
    console.log(url);
    params.append("flickrURL", url);
    var ajax = new XMLHttpRequest();
    ajax.onload = displayPhotos;
    ajax.open("POST", "photos.php", true);
    ajax.send(params);
}

//show flickr photos
function displayPhotos()
{
    var urls = JSON.parse(this.responseText);

    var photoDiv = document.getElementById('photoArea');

    removeAllChildren(photoDiv);

    for(var i=0; i<urls.length; i++)
    {
        (function () 
        {
            var img = document.createElement("img");
            img.src = urls[i];
            img.alt = "no Image available";
            img.setAttribute("id", "thumbnails");

            var index = i;
            img.addEventListener("click", function(){ showPopupPhoto(urls, index);});

            photoDiv.appendChild(img);
        }());
    }
}

//show popup window with photo in it
function showPopupPhoto(urls, i)
{
    //alert(urls[i]);
    window.open(urls[i], '', "status=yes, height=500; width=500; resizeable=no");
}

//find all geocaches based on filters
function findGeocaches(radius, difficulty, cacheType)
{
    var latitudeValue = document.getElementById('latitudeInput').value;
    var longitudeValue= document.getElementById('longitudeInput').value;
    if(latitudeValue <= 90 && latitudeValue >= -90 &&
        longitudeValue <= 180 && longitudeValue >= -180)
    {
        map.panTo(new google.maps.LatLng(latitudeValue, longitudeValue));
    }
    modifyCircle(radius);
    //flickrRequest();
    var bounds = circle.getBounds();
    var minLat = bounds.getSouthWest().lat();
    var minLon = bounds.getSouthWest().lng();
    var maxLat = bounds.getNorthEast().lat();
    var maxLon = bounds.getNorthEast().lng();

    var query = "SELECT * FROM test_data WHERE latitude >= " +
        minLat + " AND latitude <= " + maxLat + " AND longitude >= " + minLon +
         " AND longitude <= " + maxLon;

    if(difficulty > 0)
    {
        query += " AND difficulty_rating = " + difficulty;
    }
    if(cacheType >= 0)
    {
        query += " AND cache_type_id = " + cacheType;
    }

    query += ";";
    console.log(query);
    var params = new FormData();
    params.append("query", query);
    var ajax = new XMLHttpRequest();
    ajax.onload = displayGeocaches;
    ajax.open("POST", "geocache.php", true);
    ajax.send(params);
}

//show geocaches on map
function displayGeocaches()
{
    var geocaches = JSON.parse(this.responseText);
 
    deleteMarkers();
    var table = document.getElementById('geoTable');
    removeAllChildren(table);
    createTableHeaders(table);

    idArray = {};

    for(var i=0; i<geocaches.length; i+=5)
    {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(geocaches[i+1], geocaches[i+2]),
            map: map,
            id: geocaches[i]
        });

        google.maps.event.addListener(marker, 'click', function() {
            selectRow(idArray[this.id][1]);
            animateMarker(this);
            flickrRequest(this.position);
        });
        markers.push(marker);

        geocaches[i+3] = cacheTypes[geocaches[i+3]];

        var row = document.createElement('tr');
        for(var j=0; j<5; j++)
        {
            var data = document.createElement('td');
            data.innerHTML = geocaches[i+j];
            row.appendChild(data);
        }



        row.addEventListener("click", 
            function(){

                selectRow(this);
                animateMarker(idArray[this.cells.item(0).innerHTML][0]);
                flickrRequest(new google.maps.LatLng(this.cells.item(1).innerHTML, this.cells.item(2).innerHTML));});

        idArray[geocaches[i]] = [marker, row];

        table.appendChild(row);
    }   
}

//selects a row from the table
function selectRow(row)
{
    row.setAttribute('id', 'selectedRow');
    if(lastRowSelected)
    {
        lastRowSelected.setAttribute('id', 'unselectedRow');
        console.log("something");
    }
    lastRowSelected = document.getElementById('selectedRow');
}

//bounces geocache marker
function animateMarker(marker)
{
    if(lastMarkerSelected)
    {
        lastMarkerSelected.setAnimation(null);
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
    lastMarkerSelected = marker;
}

//deletes all markers
function deleteMarkers()
 {
    for(var i=0; i<markers.length; i++)
    {
        markers[i].setMap(null);
    }
    markers = [];
}

//remove all children from a parent node
function removeAllChildren(parentNode)
{
    while (parentNode.firstChild) 
    {
        parentNode.removeChild(parentNode.firstChild);
    }
}

//initially create geocache table
function createGeocacheTable()
{
    var tableDiv = document.createElement('div');
    var table = document.createElement('table');
    tableDiv.setAttribute('id', 'tableDiv');
    table.setAttribute('id', 'geoTable');

    var showHideButton = document.createElement('img');
    showHideButton.src = 'arrowHide.png';
    showHideButton.setAttribute('id', 'showHideButton');
    showHideButton.addEventListener('click', 
        function(){showHideTable(table, this);});

    createTableHeaders(table);

    tableDiv.appendChild(showHideButton);
    tableDiv.appendChild(table);

    map.controls[google.maps.ControlPosition.RIGHT].push(tableDiv);
}

//show or hide the table depending on the state
function showHideTable(table, button)
{
    if(tableVisible)
    {
        button.src = 'arrowShow.png';
        table.style.display = "none";
        tableVisible = false;
    }
    else
    {
        button.src = 'arrowHide.png';
        table.style.display = "block";
        tableVisible = true;
    }
}

//add table headers to the table
function createTableHeaders(table)
{
    var tableHeaders = ["ID", "Lat", "Lon", "Type", "Difficulty"];  
    var row = document.createElement('tr');
    for(var i=0; i<5; i++)
    {
        var header = document.createElement('th');
        header.appendChild(document.createTextNode(tableHeaders[i]));
        row.appendChild(header);
    }
    table.appendChild(row);
}

//initialize on window load
window.onload = initialize;
