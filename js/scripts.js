var api_key = "AIzaSyB6N7-9Y1x9Zpt6KECf1AFpAbRSGfX8mK0",
  spherical = google.maps.geometry.spherical;

function initMap() {

  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;

  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: {lat: 19.129809, lng: 72.877417}
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
				var distance = $("#distance").val();
				var waypts = calcWayPoints(origin, distance, 3)
				
				calculateAndDisplayRoute(directionsService, directionsDisplay, origin, waypts, distance, map)

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

  var destination = spherical.computeOffset(
    origin,
    distance * 1000,
    heading
  );

  return destination;

	// return origin.destinationPoint(angle, distance);
}

function showPanel(){
  $("#floating-panel input").val("");
  $("#floating-panel").show();
  $("#try-again").hide();
}

function showMap(){
  $("#floating-panel").hide();    
  $("#go").removeClass("active").addClass("inactive");
  $("#try-again").show();
}

function getAddressValue(){
	return $("#address").val();
}

var wp = 2;

function calculateAndDisplayRoute(directionsService, directionsDisplay, origin, waypts, distance, map) {

  directionsService.route({
    origin: origin,
    destination: origin,
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: "WALKING"
  }, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK || status == google.maps.DirectionsStatus.ZERO_RESULTS) {
      var path = result.routes.length > 0 ? result.routes[0].overview_path : [];
      console.log('Target Distance:', distance * 1000, 'Actual Distance:', spherical.computeLength(path));

      directionsDisplay.setDirections(result);
      // Draw a polyline of our path
      // new google.maps.Polyline({
      //     strokeColor: 'blue',
      //     strokeOpacity: 1,
      //     strokeWeight: 5,
      //     path: path,
      //     map: map
      // });

      // // Center the map on our starting point
      // map.panTo(origin);

      showMap();
    } else {
      console.log(wp);
     	// do it with 2 waypoints...
     	calculateAndDisplayRoute(directionsService, directionsDisplay, origin, calcWayPoints(origin, distance, wp--));

      // window.alert("Directions request failed due to " + status);
    }
  });
}

initMap();