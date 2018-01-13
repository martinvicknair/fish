$( document ).ready(function() {
    console.log( "ready!" );

    // elements in html
    var listings = document.getElementById("listings");
    var mapCanvas = document.getElementById("map-canvas");

    // these values will come from the html5_geolocation
    var userX = 0;
    var userY = 0;

    //sets radius in miles and number of sites within that radius for query
    var radius = 2;
    var numSites = 99;


    $("#find-me").on("click", function() {
      console.log("click");
      getLocation();
    });


    function getLocation() {
      $('#listings').empty();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else {
        g.innerHTML = "Geolocation is not supported by this browser.";
      }
    }

    function showPosition(position) {
      g.innerHTML = "Latitude(y): " + position.coords.latitude +
        "<br>Longitude(x): " + position.coords.longitude;
      userX = position.coords.longitude;
      userY = position.coords.latitude;
      findSites();
    }

    // returns a list of sites using an ajax GET api query
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
        for (var i = 0; i < results.length; i++) {
          console.log(results[i].attributes);
          name = results[i].attributes.siteName;
          sponsor = results[i].attributes.sponsoringOrganization;
          address = results[i].attributes.address;
          days = results[i].attributes.daysofOperation;
          contact = formatPhoneNumber(results[i].attributes.contactPhone);
          LatLng = results[i].geometry.y + ',' + results[i].geometry.x;
          listing = name + '<br>' + sponsor + '<br>' + '<a href="https://www.google.com/maps/search/?api=1&query=' + LatLng + '">' + address + '</a>' + '<br>' + 'Serving on: ' + days + '<br>' + 'Call ' + '<a href="tel:+1-' + contact + '">' +
            contact + '</a>' + ' for meal times<br>' + LatLng + '<br><br>';

          listings.innerHTML = listings.innerHTML + listing;
        }
      });
    }
    function initMap() {
       // Create a map object and specify the DOM element for display.
       var map = new google.maps.Map(document.getElementById('#map-canvas'), {
           center: { lat: -34.397, lng: 150.644 },
           zoom: 8
       });
    };





});
