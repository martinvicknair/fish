$(document).ready(function() {
  console.log("ready!");
  // window.onload = getLocation; // uncomment to geolocate on page load

  // elements in html
  var listings = document.getElementById("listings");
  var mapCanvas = document.getElementById("map-canvas");

  // these values will come from the html5_geolocation
  // Latitude is the Y axis, longitude is the X axis.
  // initial values set to remote location so as to render a "blank" map until geolocation occurs
  var userX = -89.89;
  var userY = 25.68;
  var LatLng = "userY, userX";
  // initMap(); //uncomment to initMap once initial variable set

  //sets radius in miles and number of sites within that radius for query
  var radius = 3;
  var numSites = 99;

  function initMap() {
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('#map-canvas'), {
      center: {
        lat: -34.397,
        lng: 150.644
      },
      zoom: 8
    });
  };

  // button functionality
  $("#find-me").on("click", function() {
    console.log("click");
    getLocation();
  });

  // api from https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services
  // https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Summer_Meal_Sites_2017/FeatureServer/0/query
  function findSites() {

    queryURL = "https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Summer_Meal_Sites_2017/FeatureServer/0/query?geometry=%7Bx%3A" + userX + "%2C+y%3A" + userY +
      "%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&distance=" + radius +
      ".&units=esriSRUnit_StatuteMile&returnGeodetic=false&outFields=siteName%2CsponsoringOrganization%2C+address%2CcontactPhone%2CstartDate%2C+endDate%2C+daysofOperation%2C+breakfastTime%2C+lunchTime%2C+snackTime%2C+dinnerSupperTime&returnGeometry=true&multipatchOption=xyFootprint&resultRecordCount=" +
      numSites + "&returnExceededLimitFeatures=true&f=pjson&token=";

    $.ajax({
      url: queryURL,
      method: 'GET'
    }).done(function(response) {
      // console.log(response);
      obj = JSON.parse(response);
      results = obj.features;
      console.log(results);
      $("#listings-area").empty();
      for (var i = 0; i < results.length; i++) {
        // console.log(results[i].attributes);
        name = results[i].attributes.siteName;
        sponsor = results[i].attributes.sponsoringOrganization;
        address = results[i].attributes.address;
        encAddress = encodeURIComponent(address);
        days = results[i].attributes.daysofOperation;
        contact = formatPhoneNumber(results[i].attributes.contactPhone);
        LatLng = results[i].geometry.y + ',' + results[i].geometry.x;

        listing = '<li class="list-group-item spec">' + name + '<br>' + sponsor + '<br>' + '<a href="https://www.google.com/maps/search/?api=1&query=' + encAddress + '">' + address + '</a>' + '<br>' + 'Serving on: ' + days + '<br>' + 'Call ' + '<a href="tel:+1-' + contact + '">' +
          contact + '</a>' + ' for meal times</li>';
        $("#listings-area").append(listing);

      }
    });
    // initMap(); //uncomment to initMap after ajax query
    // need to build new ajax query to return users zip code/city, to be called from within the findSites query
    // var = userZip; will be the users Zip code
    // var = userCity; will be the users city name
    // var = userResult; will be the number of sites returned from search
    // would like to log these values in firebase
  };

  // from https://www.w3schools.com/html/html5_geolocation.asp
  function getLocation() {
    $('#listings').empty();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      g.innerHTML = "Geolocation is not supported by this browser.";
    }
  }

  // from https://www.w3schools.com/html/html5_geolocation.asp
  function showPosition(position) {
    userX = position.coords.longitude;
    userY = position.coords.latitude;
    findSites();
  }

  // from https://stackoverflow.com/questions/8358084/regular-expression-to-reformat-a-us-phone-number-in-javascript
  function formatPhoneNumber(s) {
    var s2 = ("" + s).replace(/\D/g, '');
    var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
    return (!m) ? null : m[1] + "-" + m[2] + "-" + m[3];
  }


});
