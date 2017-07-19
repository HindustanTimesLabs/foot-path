var isMobile = false; //initiate as false
// device detection
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;

var api_key = "AIzaSyB6N7-9Y1x9Zpt6KECf1AFpAbRSGfX8mK0",
  spherical = google.maps.geometry.spherical,
  markers = [],
  lines = [],
  windows = [];

function initMap() {

  if (!isMobile) $("#address").focus();

  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;

  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: {lat: 19.129809, lng: 72.877417},
    styles: gray_style,
    mapTypeControl: false,
    zoomControl: (isMobile ? false : true)
  });

  directionsDisplay.setMap(map);

  $("#floating-panel input").keyup(function(e){

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
  	
    if (isActive && e.which == 13){
      $("#go").removeClass("active").addClass("inactive").html("<i class='fa fa-spinner fa-pulse fa-fw'></i> Loading your run… <span class='sr-only'>Loading...</span>");
      getCoordsFromAddress(getAddressValue(), api_key);
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
        var initialHeading = jz.num.randBetween(0, 360);
        var destination = calcPoint(origin, initialHeading, distance);
				
				calculateAndDisplayRoute(directionsService, directionsDisplay, origin, distance, destination, map, initialHeading)

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
  if (!isMobile) $("#address").focus();
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

function calculateAndDisplayRoute(directionsService, directionsDisplay, origin, distance, destination, map, initialHeading) {

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
      
      var destination2 = calcPoint(origin2, initialHeading + 120, distance);

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
              // console.log('Target Distance:', distance * 3000, 'Actual Distance:', spherical.computeLength(pathD));

              $("#summary").html("You asked for a <b>" + jz.str.numberLakhs((distance * 3).toFixed(2)) + "</b> km run, and we found you a <b>" + jz.str.numberLakhs((spherical.computeLength(pathD) / 1000).toFixed(2)) + "</b> km run.");
              // $(".actual-distance span").html();

              map.fitBounds(result.routes[0].bounds)   

              var legs = result.routes[0].legs;

              var reverse = result.routes[0].waypoint_order[0] == 0 ? false : true;


              addInfoWindow(origin, "<b>Start</b> and <b>finish</b> at:<div style='margin-top:5px; font-size:.9em'>" + legs[0].start_address + "</div>", true);
              waypoints.forEach(function(d, i){
                var first_stop = "<b>" + (reverse ? "Second" : "First") + "</b>, go to:<div style='margin-top:5px; font-size:.9em'>" + legs[1].start_address + "</div>",
                  second_stop = "<b>" + (reverse ? "First" : "Second") + "</b>, go to:<div style='margin-top:5px; font-size:.9em'>" + legs[2].start_address + "</div>";

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

  function addInfoWindow(location, html, show){
    var win = new google.maps.InfoWindow({
      content: html,
      maxWidth: 200
    });
    var marker = addMarker(location)
    if (show) win.open(map, marker);
    marker.addListener("click", function() {
      win.open(map, marker);
    });
    marker.addListener("mouseover", function() {
      win.open(map, marker);
    });
    marker.addListener("mouseout", function() {
      win.close(map, marker);
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
      icon: "img/marker.png"
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

    // Define the symbol, using one of the predefined paths ('CIRCLE')
    // supplied by the Google Maps JavaScript API.
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      strokeColor: "#177aa6",
      strokeOpacity: 1,
      fillColor: "#1a8bbc",
      fillOpacity: 1
    };

    // Draw a polyline of our path
    var line = new google.maps.Polyline({
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: weight,
      path: path,
      icons: [{
        icon: lineSymbol,
        offset: "100%"
      }],
      map: map
    });
    lines.push(line);

    animateCircle(line);
  }

  // Use the DOM setInterval() function to change the offset of the symbol
  // at fixed intervals.
  function animateCircle(line) {
      var count = 0;
      window.setInterval(function() {
        count = (count + 1) % 200;

        var icons = line.get('icons');
        icons[0].offset = (count / 2) + '%';
        line.set('icons', icons);
      }, 50);
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