$(document).ready(function() {
  // elements in html
  var listings = document.getElementById("listings");
  var mapCanvas = document.getElementById("map");
  //sets radius in miles and number of sites within that radius for query
  var radius = 3;
  var numSites = 5;
  var listingArr = [];
  var listingArrTitle = [];
  var listingMASTER= [];
  var distArr = [];
  

  //search button was clicked, get the location
  $("#find-me").on("click", function() {
    //get the location
    getLocation();
    listingArr = [];
    listingArrTitle = [];
    listingMASTER = [];
  });

  // from https://www.w3schools.com/html/html5_geolocation.asp
  // gets the location
  function getLocation() {
    $('#listings').empty();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      g.innerHTML = "Geolocation is not supported by this browser.";
    }
  }

  // from https://www.w3schools.com/html/html5_geolocation.asp
  // show the position
  function showPosition(position) {
    userX = position.coords.longitude;
    userY = position.coords.latitude;
    //firebase LOG where the user is searching from
    var database = firebase.database();
    database.ref().push({
      userX: userX,
      userY: userY,
      dateAdded: firebase.database.ServerValue.TIMESTAMP
    });
    //find the sites!
    findSites();
  }


  // api from https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services
  // https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Summer_Meal_Sites_2017/FeatureServer/0/query
  function findSites() {
    var milesCalc = '';
    queryURL = "https://services1.arcgis.com/RLQu0rK7h4kbsBq5/ArcGIS/rest/services/Summer_Meal_Sites_2017/FeatureServer/0/query?geometry=%7Bx%3A" + userX + "%2C+y%3A" + userY +
      "%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&distance=" + radius +
      ".&units=esriSRUnit_StatuteMile&returnGeodetic=false&outFields=siteName%2CsponsoringOrganization%2C+address%2CcontactPhone%2CstartDate%2C+endDate%2C+daysofOperation%2C+breakfastTime%2C+lunchTime%2C+snackTime%2C+dinnerSupperTime&returnGeometry=true&multipatchOption=xyFootprint&resultRecordCount=" +
      numSites + "&returnExceededLimitFeatures=true&f=pjson&token=";
    $.ajax({
      url: queryURL,
      method: 'GET'
    }).done(function(response) {
      obj = JSON.parse(response);
      results = obj.features;
      $("#listings-area").empty();
      //header = '<p align="center"><img src="https://personablemedia.com/wp-content/uploads/2018/01/denver-123-sack.jpg" alt="" /></p>';
      //$("#listings-area").append(header);
      var promises = [];
      var HandleAjaxResponse = function(i, y, x) {
        // console.log(i, y, x)
        //calc the distance
        queryURL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins="
          + userY + "," + userX
          + "&destinations=" + y + "," + x
          + "&key=AIzaSyAsbVYGpHF47lZVZHMEsHQuJQXffqQFt-w";
        console.log(name);
        return $.ajax({
          url: queryURL,
          method: 'GET'
        }).done(function (response) {
          milesCalc = response.rows[0].elements[0].distance.text;
          // console.log(i, y, x)
          distArr[i] = milesCalc
        });
      }
      for (var i = 0; i < results.length; i++) {
        name = results[i].attributes.siteName;
        sponsor = results[i].attributes.sponsoringOrganization;
        address = results[i].attributes.address;
        breakfastTime = results[i].attributes.breakfastTime;
        lunchTime = results[i].attributes.lunchTime;
        encAddress = encodeURIComponent(address);
        days = results[i].attributes.daysofOperation;
        contact = formatPhoneNumber(results[i].attributes.contactPhone);
        phone = results[i].attributes.contactPhone;
        listObj = {lat: results[i].geometry.y, lng: results[i].geometry.x};
        listingArrTitle.push(name);
        listingArr.push(listObj);

        //cors fix
        jQuery.ajaxPrefilter(function(options) {
          if (options.crossDomain && jQuery.support.cors) {
              options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
            }
          });


        
        var calcPromise = HandleAjaxResponse(i, results[i].geometry.y, results[i].geometry.x)
          promises.push(calcPromise);
          
          //build the primary array with all the info
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
          + '<h4 id= ' + 'dist' + i + '>' + '</h4>'
          + '<a href="https://www.google.com/maps/search/?api=1&query=' + encAddress + '"><h4>' + address + '</h4></a>'
          + '<a href="tel:/1' + phone + '"><h4>' + contact + '</h4></a></li>';

          listingMASTER.push(listing);

          //update the text beneath the map on the screen
          $("#listings-area").append(listing);
          //add the points + data to the map!
          
        
      };
      // console.log(listingMASTER)

      addPoints(listingArr, listingArrTitle, listingMASTER);

      Promise.all(promises).then(function () {
        for(let i =0; i<distArr.length; i++) {
          document.getElementById('dist' + i).append(distArr[i])
        }
      });
      
    });


  };

  function addPoints(listingArr, listingArrTitle, listingMASTER) {
    var yourLocation = { lat: userY, lng: userX };
    var map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: yourLocation
    });

    var marker = new google.maps.Marker({
      position: yourLocation,
      map: map,
      title: "You Are Here",
      label: "U"
    })

    for(i=0; i<listingArr.length; i++) {
      addMarker(listingArr[i], map, listingArrTitle[i], i, listingMASTER[i]);
    }

    // for (let i = 0; i < distArr.length; i++) {
    //   console.log(distArr[i])
    //   document.getElementById('dist' + i).html(distArr[i])
    // }

  };


  //adds a marker
  function addMarker(location, map, title, label, master) {
    label = label + 1;
    // Add the marker at the clicked location, and add the next-available label
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      title: title,
      label: encodeURIComponent(label)
      // adding code for info window
      //https://stackoverflow.com/questions/11507187/add-infowindow-to-looped-array-of-markers-on-google-map-using-api-v3
    });
    // adding code for info window
    marker.info = new google.maps.InfoWindow({
      content: master
    });
    google.maps.event.addListener(marker, 'click', function() {
      marker.info.open(map, this);
    });
  };

  // from https://stackoverflow.com/questions/8358084/regular-expression-to-reformat-a-us-phone-number-in-javascript
  // mobile hyperlink attribute to place a call is href="tel:/13038005415"
  function formatPhoneNumber(s) {
    var s2 = ("" + s).replace(/\D/g, '');
    var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
    return (!m) ? null : m[1] + "-" + m[2] + "-" + m[3];
  };
});
