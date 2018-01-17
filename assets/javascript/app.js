$(document).ready(function() {
//   console.log("ready!");
  // window.onload = getLocation; // uncomment to geolocate on page load

  // elements in html
  var listings = document.getElementById("listings");
  var mapCanvas = document.getElementById("map");

  // these values will come from the html5_geolocation
  // Latitude is the Y axis, longitude is the X axis.
  // initial values set to remote location so as to render a "blank" map until geolocation occurs
  // var userX = -89.89;
  // var userY = 25.68;
  var userX = 39.6802645;
  var userY = -104.9444163;
  var LatLng = "userY, userX";
  var userLoc = "";
  var searchTerms = "SELF";
  var searchResult = -1;
  var database = firebase.database();
  // initMap(); //uncomment to initMap once initial variable set

  //sets radius in miles and number of sites within that radius for query
  var radius = 1;
  var numSites = 3;

  function initMap () {
    var yourLocation = {lat: userX, lng: userY};
    var map = new google.maps.Map(document.getElementById("map"), {
      zoom: 15,
      center: yourLocation
    });
    var marker = new google.maps.Marker({
      position: yourLocation,
      map: map
    });
  };

  initMap();
   

  $("#find-me").on("click", function() {
    console.log("click");

    //get the location
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
      $("#listings-area").empty();
      //header = '<p align="center"><img src="https://personablemedia.com/wp-content/uploads/2018/01/denver-123-sack.jpg" alt="" /></p>';
      //$("#listings-area").append(header);
      searchDate = moment().format('YYYY-MM-DD dd h:mm a');
      searchResult = results.length;
      text = "'" + userLoc + "'" + " searched for " + "'" + searchTerms + "'" + " which returned " + "'" + searchResult + "'" + " listings";
      console.log(text);
      console.log(results);
      pushFireData();
      for (var i = 0; i < results.length; i++) {
        // console.log(results[i].attributes);
        name = results[i].attributes.siteName;
        sponsor = results[i].attributes.sponsoringOrganization;
        address = results[i].attributes.address;
        breakfastTime = results[i].attributes.breakfastTime;
        lunchTime = results[i].attributes.lunchTime;
        encAddress = encodeURIComponent(address);
        days = results[i].attributes.daysofOperation;
        contact = formatPhoneNumber(results[i].attributes.contactPhone);
        phone = results[i].attributes.contactPhone;
        LatLng = results[i].geometry.y + ',' + results[i].geometry.x;

        //insert code for calculating distance from LatLng to the x and y of the location
        milesCalc = '.3'

        if (lunchTime == null) {
          lunchTime = 'not serving lunch';
        }
        if (breakfastTime == null) {
          breakfastTime = 'not serving breakfast';
        }

        listing = '<li align="center" class="list-group-item spec"><strong><h1 align="center">' + (i+1) + '</h1><h3>' + name + '</h3></strong>'
        + 'Serving on: ' + days + '<br>'
        + 'Breakfast Time: ' + breakfastTime + '<br>'
        + 'Lunch Time: ' + lunchTime + '<br>'
        + '<h4>' + milesCalc + ' miles away</h4>'
        + '<a href="https://www.google.com/maps/search/?api=1&query=' + encAddress + '"><h4>' + address + '</h4></a>'
        + '<a href="tel:/1' + phone + '"><h4>' + contact + '</h4></a></li>';

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
    getUserLoc();

    //find the sites!
    findSites();

  }

  //log the tracking data into firebase
  function pushFireData() {
    // initMap();
    database.ref().push({
      userLoc: userLoc,
      searchResult: searchResult,
      searchTerms: searchTerms,
      searchDate: searchDate,
      userX: userX,
      userY: userY,

    });
  }

  // from https://stackoverflow.com/questions/8358084/regular-expression-to-reformat-a-us-phone-number-in-javascript
  // mobile hyperlink attribute to place a call is href="tel:/13038005415"
  function formatPhoneNumber(s) {
    var s2 = ("" + s).replace(/\D/g, '');
    var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
    return (!m) ? null : m[1] + "-" + m[2] + "-" + m[3];
  }

  //returns human readable semi-anonymous place location for user
  function getUserLoc() {

    queryURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + userY + ',' + userX + "&key=AIzaSyCm9jtLUThY_3O1Uec3Ao-DWDkkBNzCl3U";
    $.ajax({
      url: queryURL,
      method: 'GET'
    }).done(function(response) {
      userLoc = response.results[1].formatted_address;
    });
  };


});
