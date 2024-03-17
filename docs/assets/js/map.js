var map = L.map('mapid').setView([41.8908, 12.4749], 15);
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
    // attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
    maxZoom: 18,
    minZoom: 3,
    subdomains: 'abc',
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