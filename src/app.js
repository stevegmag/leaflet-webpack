
console.log('app loaded');

// TODO: SG: get orig zip

// TODO: SG: convert zip to lat, lng

// TODO: SG: set defaults and globals
let locationLayer;
const orgZoom = 8; //default/UK 7; US: 5;
// center: [51.505, -0.09], // UK LONDON
// center: { lat: 52.632469, lng: -1.689423 }, // UK
// center: { lat: 39.0921017, lng: -96.8169365 }, // US KC
const orgCenter = {lat: 39.168431, lng: -77.6062407}// US Lansdowne


// TODO: SG: read in data 
const getLocs = (async () => {
  // console.log("getLocs: in:: ");
  //const response = await fetch("./data/jf-offices-US.json");
  const response = await fetch("./data/retailers-geojson.json");
  const locations = await response.json();
  // console.log("getLocs: locations:: ", locations);
  return locations;
})(); //getStores

// TODO: SG: sort data by distance from zip

// TODO: SG: init map
let initMap = (() => {
    let daMap = L.map('leaflet-map').setView(orgCenter, orgZoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1Ijoic3RldmVnbWFnIiwiYSI6ImNrOHluOWM2MDFqd3EzaXByYzczYzE5eGgifQ.4lM79kpPK_npQd6LsV4UUA' // stevegmag api key
    }).addTo(daMap);

    // TODO: SG: add current zip to map
    let orgMarker = L.marker(orgCenter).addTo(daMap);
    orgMarker.bindPopup("<b>Your Current Location based on postal code.</b><br>Use form field to search on different postal code.").openPopup();
    
    locationLayer = L.geoJSON().addTo(daMap);
})();

// TODO: SG: load data into map
let loadData = (async () => {    
    // console.log("loadData: getLocs:: ", await getLocs);
    return locationLayer.addData(await getLocs);
})();

// TODO: SG: load sorted data (forst 10) into list

// TODO: SG: add click actions to map

// TODO: SG: add click actions to list

// TODO: SG: get new zip from form