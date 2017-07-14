var api_key = "AIzaSyB6N7-9Y1x9Zpt6KECf1AFpAbRSGfX8mK0"

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
				var pointA = new google.maps.LatLng(coords.lat, coords.lng);
				var distance = $("#distance").val();
				var waypts = calcWayPoints(pointA, distance, 3)
				
				calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, waypts, distance)

			}
		});

	}

}

function calcWayPoints(starting_point, distance, waypoints){
	var wp = [];

	for (var i = 0; i < waypoints; i++){
		var obj = {};
		obj.location = calcPoint(i == 0 ? starting_point : wp[i - 1].location, 180 / waypoints * (i + 1), (distance / 2) / (waypoints + 1))
		obj.stopover = true;
		wp.push(obj);
	}

	return wp
}

function calcPoint(pointA, angle, distance){

	//TODO Calculate actual walking distance...

	return pointA.destinationPoint(angle, distance);
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

function calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, waypts, distance) {

  directionsService.route({
    origin: pointA,
    destination: pointA,
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: "WALKING"
  }, function(response, status) {
    if (status === "OK") {
      directionsDisplay.setDirections(response);
      showMap();
    } else {
    	console.log("Trying with 2...");
     	// do it with 2 waypoints...
     	calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, calcWayPoints(pointA, distance, 2))

      // window.alert("Directions request failed due to " + status);
    }
  });
}

initMap();