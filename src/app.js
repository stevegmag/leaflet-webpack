
console.log('app loaded');

// TODO: SG: get orig zip

// TODO: SG: convert zip to lat, lng

// TODO: SG: set defaults and globals
let locationLayer;
const maxListCnt = 4;
const orgZoom = 8; //default/UK 7; US: 5;
// const orgCenter = [51.505, -0.09], // UK LONDON
// const orgCenter = { lat: 52.632469, lng: -1.689423 }, // UK
// const orgCenter = { lat: 39.0921017, lng: -96.8169365 }, // US KC
const orgCenter = {lat: 39.168431, lng: -77.6062407}// US Lansdowne
const redIcon = L.icon({
    iconUrl: './images/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [25, 41],
    popupAnchor: [-10, -51],
    shadowUrl: './images/marker-shadow.png',
    shadowSize: [25, 41],
    shadowAnchor: [25, 41]
});


// TODO: SG: read in data 
const getLocations = (async () => {
  // console.log("getLocs: in:: ");
  const response = await fetch("./data/jf-offices-US.json");
  //const response = await fetch("./data/retailers-geojson.json");
  const locations = await response.json();
  // console.log("getLocs: locations:: ", locations);
  return locations;
})(); //getStores

// TODO: SG: sort data by distance from zip and truncate to maxListCnt
const sortData = (async () => {
    const sortData = await getLocations;
    console.log("sortData: sortData:: ", sortData);    
    sortTruncFeatures = Array.prototype.slice.call(sortData.features, maxListCnt);
    console.log("sortData: sortTrsortTruncFeaturesuncData:: ", sortTruncFeatures);
    sortData.features = sortTruncFeatures;
    console.log("sortData: sortData:: ", sortData);
    return sortData;
})();

// TODO: SG: init map
const initMap = (() => {
    // create the map obj
    const daMap = L.map('leaflet-map').setView(orgCenter, orgZoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1Ijoic3RldmVnbWFnIiwiYSI6ImNrOHluOWM2MDFqd3EzaXByYzczYzE5eGgifQ.4lM79kpPK_npQd6LsV4UUA' // stevegmag api key
    }).addTo(daMap);

    // TODO: SG: add current zip marker to map
    const orgMarker = L.marker(orgCenter, {icon: redIcon}).addTo(daMap);
    orgMarker.bindPopup("<b>Your Current Location based on postal code.</b><br>Use form field to search on different postal code.").openPopup();
    
    // init dataLayer
    locationLayer = L.geoJSON().addTo(daMap);
})();

// TODO: SG: load all data into map
const loadData = (async () => {    
    console.log("loadData: getLocations:: ", await getLocations);
    return locationLayer.addData(await getLocations);
})();

// TODO: SG: distance diff
const distanceBetween = (lat1, lon1, lat2, lon2) => {
  let p = 0.017453292519943295;    // Math.PI / 180
  let c = Math.cos;
  let a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
} // distanceBetween

// TODO: SG: load sorted data (maxListCnt) into list
const showLocationList = (async () => {
    console.log("in showLocationList: 1");
    const locationOBJ = await sortData;
    console.log("showLocationList: locationOBJ:: ", locationOBJ);
    const locationList = locationOBJ.features;
    console.log("showLocationList: locationList:: ", locationList);
    locationListLen = locationList.length;
    console.log("showLocationList: locationList:: locationListLen:: ", locationListLen);
    if ( locationListLen > 0 ) {
        let daNode = document.createElement("UL");

        for ( let location in locationList ) {
            console.log("showLocationList: locationList:: location:: ", location);
            const properties = locationList[location].properties;
            console.log("showLocationList: properties:: ", properties);

            const coords = locationList[location].geometry.coordinates;
            const name = properties.name;
            const description = properties.description;
            const address = properties.address;
            //const hours = properties.hours;
            const phone = properties.phone;
            const email = properties.email;
            //const image = properties.image;
            //const position = event.feature.getGeometry().get();

            let loc = name.split(",");
            loc = loc[0].replace(" ", "-");
            //console.log("LOC: ", loc);

            let daContent = document.createElement("li");
            let daText = String.raw`
                <a href="javascript: moveToLocation(${coords});scrollLocList('${loc}');">
                <h2 id="${loc}">${name}</h2>
                </a>
                <p>${description}</p>
                <p>${address}</p>
                <p>
                    <strong>Phone:</strong> ${phone}<br/>
                    <strong>Email:</strong> ${email}
                </p>
            `;
            daContent.innerHTML = daText;
            daNode.appendChild(daContent);
        } // for
        document.getElementById("location-list-panel").appendChild(daNode);
    } // if
})(); //showStoreList

// TODO: SG: add click actions to map

// TODO: SG: add click actions to list

// TODO: SG: get new zip from form