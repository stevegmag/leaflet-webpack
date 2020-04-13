
console.log('app loaded');

// TODO: SG: get orig zip

// TODO: SG: convert zip to lat, lng

// TODO: SG: set defaults and globals
let locationLayer;
const maxListCnt = 4;
const orgZoom = 8; //default/UK 7; US: 5;
// center: [51.505, -0.09], // UK LONDON
// center: { lat: 52.632469, lng: -1.689423 }, // UK
// center: { lat: 39.0921017, lng: -96.8169365 }, // US KC
const orgCenter = {lat: 39.168431, lng: -77.6062407}// US Lansdowne


// TODO: SG: read in data 
const getLocations = (async () => {
  // console.log("getLocs: in:: ");
  const response = await fetch("./data/jf-offices-US.json");
  //const response = await fetch("./data/retailers-geojson.json");
  const locations = await response.json();
  // console.log("getLocs: locations:: ", locations);
  return locations;
})(); //getStores

// TODO: SG: sort data by distance from zip
let sortData = (async () => {
    const sortData = await getLocations;
    console.log("sortData: sortData:: ", sortData);
    sortTruncFeatures = Array.prototype.slice.call(sortData.features, maxListCnt);
    console.log("sortData: sortTrsortTruncFeaturesuncData:: ", sortTruncFeatures);
    sortData.features = sortTruncFeatures;
    console.log("sortData: sortData:: ", sortData);
    return sortData;
})();

// TODO: SG: init map
let initMap = (() => {
    // create the map obj
    let daMap = L.map('leaflet-map').setView(orgCenter, orgZoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1Ijoic3RldmVnbWFnIiwiYSI6ImNrOHluOWM2MDFqd3EzaXByYzczYzE5eGgifQ.4lM79kpPK_npQd6LsV4UUA' // stevegmag api key
    }).addTo(daMap);

    // TODO: SG: add current zip marker to map
    let orgMarker = L.marker(orgCenter).addTo(daMap);
    orgMarker.bindPopup("<b>Your Current Location based on postal code.</b><br>Use form field to search on different postal code.").openPopup();
    
    // init dataLayer
    locationLayer = L.geoJSON().addTo(daMap);
})();

// TODO: SG: load data into map
let loadData = (async () => {    
    console.log("loadData: getLocations:: ", await getLocations);
    return locationLayer.addData(await getLocations);
})();

// TODO: SG: load sorted data (forst 10) into list
// const showLocationList = (async () => {
//   console.log("in showLocationList: 1");
//   const locationOBJ = await sortData;
//   const locationList = locationOBJ.features;
//   console.log("storeList: ", locationList);
//   if (locationList.length > 0) {
//     let daNode = document.createElement("UL");

//     for (location in locationList) {
//       console.log("showLocationList: location:: ", location);
//       const properties = locationList[location].properties;

//       console.log("showLocationList: properties:: ", properties);

//     //   const coords = locationList[location].geometry.coordinates;
//     //   const name = properties.name;
//     //   const description = properties.description;
//     //   //const address = properties.address;
//     //   //const hours = properties.hours;
//     //   const phone = properties.phone;
//     //   const email = properties.email;
//     //   //const image = properties.image;
//     //   //const position = event.feature.getGeometry().get();

//     //   let loc = name.split(",");
//     //   loc = loc[0].replace(" ", "-");
//     //   //console.log("LOC: ", loc);

//     //   let daContent = document.createElement("li");
//     //   let daText = String.raw`
//     //       <a href="javascript: moveToLocation(${coords});scrollLocList('${loc}');">
//     //       <h2 id="${loc}">${name}</h2>
//     //       </a>
//     //       <p>${description}</p>
//     //       <p>${address}</p>
//     //       <p>
//     //         <strong>Open:</strong> ${hours}<br/>
//     //         <strong>Phone:</strong> ${phone}<br/>
//     //         <strong>Email:</strong> ${email}
//     //       </p>
//     //   `;
//     //   daContent.innerHTML = daText;
//     //   daNode.appendChild(daContent);
//     // } // for
//     // document.getElementById("location-list-panel").appendChild(daNode);
//   } // if
// })(); //showStoreList

// TODO: SG: add click actions to map

// TODO: SG: add click actions to list

// TODO: SG: get new zip from form