var gray_style=[{elementType:"geometry",stylers:[{color:"#f5f5f5"}]},{elementType:"labels.icon",stylers:[{visibility:"off"}]},{elementType:"labels.text.fill",stylers:[{color:"#616161"}]},{elementType:"labels.text.stroke",stylers:[{color:"#f5f5f5"}]},{featureType:"administrative.land_parcel",elementType:"labels.text.fill",stylers:[{color:"#bdbdbd"}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#eeeeee"}]},{featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#757575"}]},{featureType:"poi.park",elementType:"geometry",stylers:[{color:"#e5e5e5"}]},{featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#9e9e9e"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#ffffff"}]},{featureType:"road.arterial",elementType:"labels.text.fill",stylers:[{color:"#757575"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{color:"#dadada"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#616161"}]},{featureType:"road.local",elementType:"labels.text.fill",stylers:[{color:"#9e9e9e"}]},{featureType:"transit.line",elementType:"geometry",stylers:[{color:"#e5e5e5"}]},{featureType:"transit.station",elementType:"geometry",stylers:[{color:"#eeeeee"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#d2eef7"}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#7997a1"}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{color:"#45565c"}]}];

var api_key = "AIzaSyB6N7-9Y1x9Zpt6KECf1AFpAbRSGfX8mK0",
  spherical = google.maps.geometry.spherical,
  markers = [];

function initMap() {

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

    $("#go").html("<i class='fa fa-spinner fa-pulse fa-fw'></i> Loading your run… <span class='sr-only'>Loading...</span>");

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
				// var waypts = calcWayPoints(origin, distance, 3)
				
				calculateAndDisplayRoute(directionsService, directionsDisplay, origin, distance, destination, map)

			}
		});

	}

}

function calcWayPoints(origin, distance, waypoints){
	var wp = [];

	for (var i = 0; i < waypoints; i++){
		var obj = {};
		obj.location = calcPoint(i == 0 ? origin : wp[i - 1].location, 180 / waypoints * (i + 1), (distance / 2) / (waypoints + 1))
		obj.stopover = true;
		wp.push(obj);
	}

	return wp
}

function calcPoint(origin, heading, distance){

	//TODO Calculate actual walking distance...
  // find a point {distance} north of our origin

  return spherical.computeOffset(
    origin,
    distance * 1000,
    heading
  );

	// return origin.destinationPoint(angle, distance);
}

function showPanel(){
  $("#go").html("Find your run!");
  $("#floating-panel input").val("");
  $("#floating-panel").show();
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
    travelMode: "WALKING"
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

              var pathD = result.routes.length > 0 ? result.routes[0].overview_path : [];
              console.log('Target Distance:', distance * 3000, 'Actual Distance:', spherical.computeLength(pathD));

              $(".target-distance span").html(jz.str.numberLakhs(distance * 3000) + " meters");
              $(".actual-distance span").html(jz.str.numberLakhs((spherical.computeLength(pathD)).toFixed(2)) + " meters");

              directionsDisplay.setDirections(result);
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

  // Adds a marker to the map and push to the array.
  function addMarker(location) {
    var marker = new google.maps.Marker({
      position: location,
      map: map
    });
    markers.push(marker);
  }

  // Sets the map on all markers in the array.
  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
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
  }

  function addLine(color, path, map){
    // Draw a polyline of our path
    return new google.maps.Polyline({
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 5,
        path: path,
        map: map
    });
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

initMap();