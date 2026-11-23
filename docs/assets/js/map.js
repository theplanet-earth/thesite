var map = L.map('mapid').setView([41.8908, 12.4749], 15);
// The standard tiles of OpenStreetMap, used as its tile usage policy asks: this exact URL, no
// {s} subdomains, the attribution visible on the map, and the browser's own Referer
// (https://operations.osmfoundation.org/policies/tiles/). The CARTO basemaps used until
// 2026-11 now answer with an "API key required" image (https://carto.com/basemaps/apikey).
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 3,
}).addTo(map);
var polygon = L.polygon([
  [41.89208, 12.47340],
  [41.89208, 12.48048],
  [41.88863, 12.48048],
  [41.88863, 12.47340]
]).addTo(map);


// function onMapClick(e) {
//     popup
//         .setLatLng(e.latlng)
//         .setContent("You clicked the map at " + e.latlng.toString())
//         .openOn(map);
// }

function onMapClick() {
    window.location.href = "https://enjoy.theplanet.wtf";
}

map.on('click', onMapClick);

polygon.on('mouseover', function(e) {
    var popup = L.popup()
    /* If you want to style specific popups differently, you can assign a custom class to them when creating the popup in your JavaScript: */
    // var popup = L.popup({className: 'custom-popup'})
        .setLatLng(e.latlng) // Sets the position of the popup
        .setContent("Click to Start The Game from here!") // Sets the message of the popup
        .openOn(map); // Opens the popup
});

polygon.on('mouseout', function(e) {
    map.closePopup(); // Closes the popup when the mouse leaves the polygon area
});