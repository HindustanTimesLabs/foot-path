var api_key = "AIzaSyB6N7-9Y1x9Zpt6KECf1AFpAbRSGfX8mK0",
  spherical = google.maps.geometry.spherical,
  markers = [],
  lines = [],
  windows = [];

function initMap() {

  $("#address").focus();

  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;

  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: {lat: 19.129809, lng: 72.877417},
    styles: gray_style
  });

  directionsDisplay.setMap(map);

  $("#floating-panel input").keyup(function(){

  	var isActive = checkIsActive();
  	if (isActive) {
  		$("#go").addClass("active").removeClass("inactive");
  	} else {
  		$("#go").addClass("inactive").removeClass("active");
  	}

  	function checkIsActive(){
  		var activeArray = [];	
  		$("#floating-panel input").each(function(){
  			activeArray.push($(this).val() == "" ? "no" : "yes");
  		});
  		return activeArray[0] == "yes" && activeArray[1] == "yes" ? true : false;
  	}  	
  	
  });

	$(document).on("click", "#go.active", function(){

    $("#go").removeClass("active").addClass("inactive").html("<i class='fa fa-spinner fa-pulse fa-fw'></i> Loading your run… <span class='sr-only'>Loading...</span>");

		getCoordsFromAddress(getAddressValue(), api_key);
	});

	$("#try-again").click(showPanel);

	function getCoordsFromAddress(address, api_key){
	
		var request = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "&key=" + api_key;
		$.getJSON(request, function(data, status){
			if (status == "success"){

				var coords = data.results[0].geometry.location;
				
				// get new points
				var origin = new google.maps.LatLng(coords.lat, coords.lng);
				var distance = $("#distance").val() / 3;
        var destination = calcPoint(origin, 0, distance);
				
				calculateAndDisplayRoute(directionsService, directionsDisplay, origin, distance, destination, map)

			}
		});

	}

}


function calcPoint(origin, heading, distance){

  return spherical.computeOffset(origin, distance * 1000, heading);

}

function showPanel(){
  $("#go").html("Find your run!");
  $("#floating-panel input").val("");
  $("#floating-panel").show();
  $("#address").focus();
  $(".map-show").hide();
}

function showMap(){
  $("#floating-panel").hide();    
  $("#go").removeClass("active").addClass("inactive");
  $(".map-show").show();
}

function getAddressValue(){
	return $("#address").val();
}

// var wp = 2;

function calculateAndDisplayRoute(directionsService, directionsDisplay, origin, distance, destination, map) {

  var waypoints = [];

  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: "WALKING",
    region: "in"
  }, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK || status == google.maps.DirectionsStatus.ZERO_RESULTS) {
      
      // calculate the correct distance
      var pathA = result.routes.length > 0 ? result.routes[0].overview_path : [];   
      var pointB = calcWalkPoint(pathA, origin, destination);
      var origin2 = pointB.point;
      waypoints.push({
        location: origin2,
        stopover: true
      });
      
      var destination2 = calcPoint(origin2, 120, distance);

      directionsService.route({
        origin: origin2,
        destination: destination2,
        travelMode: "WALKING"
      }, function(result, status){

        if (status == google.maps.DirectionsStatus.OK || status == google.maps.DirectionsStatus.ZERO_RESULTS) {

          // calculate the correct distance
          var pathB = result.routes.length > 0 ? result.routes[0].overview_path : [];
          var pointC = calcWalkPoint(pathB, origin2, destination2);
          var origin3 = pointC.point;
          waypoints.push({
            location: origin3,
            stopover: true
          });

          directionsService.route({
            origin: origin,
            destination: origin,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: "WALKING"
          }, function(result, status){

            if (status == google.maps.DirectionsStatus.OK || status == google.maps.DirectionsStatus.ZERO_RESULTS) {

              deleteMarkers();

              var pathD = result.routes.length > 0 ? result.routes[0].overview_path : [];
              console.log('Target Distance:', distance * 3000, 'Actual Distance:', spherical.computeLength(pathD));

              $("#summary").html("You asked for a <b>" + jz.str.numberLakhs((distance * 3).toFixed(2)) + "</b> km run, and we found you a <b>" + jz.str.numberLakhs((spherical.computeLength(pathD) / 1000).toFixed(2)) + "</b> km run.");
              // $(".actual-distance span").html();

              map.fitBounds(result.routes[0].bounds)   

              var legs = result.routes[0].legs;

              addInfoWindow(origin, "<b>Start</b> and <b>finish</b> at:<div style='margin-top:5px; font-size:.9em'>" + legs[0].start_address + "</div>");
              waypoints.forEach(function(d, i){
                var first_stop = "Your <b>first stop</b> is:<div style='margin-top:5px; font-size:.9em'>" + legs[1].start_address + "</div>",
                  second_stop = "Your <b>second stop</b> is:<div style='margin-top:5px; font-size:.9em'>" + legs[2].start_address + "</div>";

                addInfoWindow(d.location, i == 0 ? first_stop : second_stop);
              });

              addLine("#1abc9c", pathD, map, .6, 10);

              showMap();


            }

          });


        }

      });

      
    } else {
      // console.log(wp);
     	// do it with 2 waypoints...
     	// calculateAndDisplayRoute(directionsService, directionsDisplay, origin, calcWayPoints(origin, distance, wp--));

      // window.alert("Directions request failed due to " + status);
    }
  });

  function addInfoWindow(location, html){
    var win = new google.maps.InfoWindow({
      content: html,
      maxWidth: 200
    });
    var marker = addMarker(location)
    win.open(map, marker);
    marker.addListener("click", function() {
      win.open(map, marker);
    });
    markers.push(marker);
    windows.push(win);
  }

  // Adds a marker to the map and push to the array.
  function addMarker(location, label) {
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      animation: google.maps.Animation.DROP,
      label: label,
      icon: "img/marker-gray-01.png"
    });
    return marker; // in case you need it
    markers.push(marker);
  }

  // Sets the map on all markers in the array.
  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

  // Shows any markers currently in the array.
  function showMarkers() {
    setMapOnAll(map);
  }

  // Deletes all markers in the array by removing references to them.
  function deleteMarkers() {
    clearMarkers();
    markers = [];
    lines = [];
    windows = [];
  }

  function addLine(color, path, map, opacity, weight){
    // Draw a polyline of our path
    var line = new google.maps.Polyline({
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: weight,
      path: path,
      map: map
    });
    lines.push(line);
  }

  // Not the bird distance, the walk distance
  function calcWalkPoint(path, origin, destination){

    // console.log(path);
    // console.log(origin);
    // console.log(destination);

    // unit conversion
    var d = distance * 1000;

    // Guarantee the path is at least as long as your distance.
    path.unshift(origin); // this guarantees that the path starts at your current location
    path.push(destination); // this guarantees that the path ends at your destination

    // initialize variables
    var totalLength = 0;
    var segmentLength = 0;

    // we can start at index of 1 because there will always be at least two elements
    for (var i = 1; i < path.length; i++) {

      segmentLength = spherical.computeDistanceBetween(path[i - 1], path[i]);

      if ((totalLength + segmentLength) >= d) {

        var difference = (totalLength + segmentLength) - d;

        var heading = spherical.computeHeading(path[i - 1], path[i]);
        var newEndpoint = spherical.computeOffset(path[i - 1], segmentLength - difference, heading);

        path = path.slice(0, i); // removes everything after the current point
        path.push(newEndpoint); // replaces what we removed with our new, correct-length endpoint

        return {
          path: path,
          point: newEndpoint
        };

        break;
      }

      totalLength += segmentLength;
    }
  }
}

// https://developers.google.com/maps/documentation/javascript/directions#DirectionsRegionBiasing
// A DirectionsRenderer not only handles display of the polyline and any associated markers,
// but also can handle the textual display of directions as a series of steps.
// To do so, simply call setPanel() on your DirectionsRenderer,
// passing it the <div> in which to display this information.
// Doing so also ensures that you display the appropriate copyright information,
// and any warnings which may be associated with the result.

initMap();