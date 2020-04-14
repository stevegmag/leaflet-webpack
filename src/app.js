//console.log('app loaded');

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


// FUNC: SG: read in data 
const getLocations = (async () => {
    // console.log("getLocations: in:: ");
    //const response = await fetch("./data/jf-offices-US.json");
    const response = await fetch("./data/retailers-geojson.json");
    const locations = await response.json();
    console.log("getLocations: locations:: ", locations);
    return locations;
})(); //getStores

// TODO: SG: sort data by distance from zip and truncate to maxListCnt
const sortDataByZip = (locationOBJ) => {
    //console.log("sortDataByZip: locationOBJ:: ", locationOBJ);
    let sortData = {...locationOBJ}; 
    //console.log("sortDataByZip: sortData:: ", sortData);
    //console.log("sortDataByZip: sortData length:: ", sortData.features.length);
    
    // add distance from zip to features properties
    sortDataLen = sortData.features.length;
    for (let x=0; x<sortDataLen; x++) {
        let testCords = sortData.features[x].geometry.coordinates;
        console.log("sortDataByZip: location:: ", sortData.features[x].properties.name);
        console.log("sortDataByZip: testCords:: ", testCords);
        distance = distanceBetween(orgCenter.lat, orgCenter.lng, testCords[1], testCords[0]);
        console.log("sortDataByZip: distance:: ", distance);
        sortData.features[x].properties.distance = distance;
    } //for
    let nestedSort = (prop1, prop2 = null, direction = 'asc') => (e1, e2) => {
    const a = prop2 ? e1[prop1][prop2] : e1[prop1],
        b = prop2 ? e2[prop1][prop2] : e2[prop1],
        sortOrder = direction === "asc" ? 1 : -1
    return (a < b) ? -sortOrder : (a > b) ? sortOrder : 0;
    }

    sortData.features.sort(nestedSort("properties", "distance", "asc"));

    //console.log("sortDataByZip: sorted sortData:: ", sortData);
    // truncate list to 
    sortData.features = sortData.features.slice(0, maxListCnt); 
    return sortData;
}; //sortDataByZip


// TODO: SG: init map
const initMap = (() => {
    // create the map obj
    const daMap = L.map('leaflet-map').setView(orgCenter, orgZoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
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
    //console.log("loadData: getLocations:: ", await getLocations);

    const onEachFeature = (feature, layer) => {
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    };
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
    //console.log("in showLocationList: 1");
    const locationOBJ = await getLocations;
    const locationOBJSorted = await sortDataByZip(locationOBJ);
    //console.log("showLocationList: locationOBJSorted:: ", locationOBJSorted);
    const locationList = locationOBJSorted.features;
    //console.log("showLocationList: locationList:: ", locationList);
    locationListLen = locationList.length;
    //console.log("showLocationList: locationList:: locationListLen:: ", locationListLen);
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
            const distance = Math.round( properties.distance );
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
                <p><strong>Distance:</strong> ${distance} miles</p>
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
})(); //showLocationList
// TODO: SG: add click actions to map

// TODO: SG: add click actions to list

// TODO: SG: get new zip from form