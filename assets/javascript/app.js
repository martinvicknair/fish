function initMap() {
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('#map-canvas'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });
};

<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCm9jtLUThY_3O1Uec3Ao-DWDkkBNzCl3U&callback=initMap"async defer></script>