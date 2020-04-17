//console.log('app loaded');

// TODO: SG: get orig zip

// TODO: SG: convert zip to lat, lng

// VARS: SG: set defaults and globals
let daMap;
let locationLayer;
let popup;
const site =(() => {    
    let daSite = window.location.hostname;
    daSite = daSite.indexOf('127.0.0.1');
    return (daSite > -1)?'localhost':'notLocalhost';
})();
const redIconURL = (site == 'localhost')?
    '../dist/images/marker-icon-red.png':
    '/themes/custom/fmc/dist/images/marker-icon-red.png';
const redShadowURL = (site == 'localhost')?
    '../dist/images/marker-shadow.png':
    '/themes/custom/fmc/dist/images/marker-shadow.png';
const countryCode = (() => {
    let daPath = window.location.pathname;
    daPath = daPath.indexOf('/us/');
    return (daPath > -1)?'us':'nonus';
})();
const distanceUnit = (countryCode == "us")? "mi" : "km";
const maxListCnt = 10;
const orgZoom = 8; //default/UK 7; US: 5;
const zoomZoom = 12;
// TODO: SG: add variables from twig file
const orgCenter = (() => {
    if (
        (typeof(remote_lat) !== 'undefined') && 
        (typeof(remote_lng) !== 'undefined')
    ) {
        return {
            'lat': remote_lat,
            'lng': remote_lng
        };
    }
    else {
        // const orgCenter = [51.505, -0.09], // UK LONDON
        // const orgCenter = { lat: 52.632469, lng: -1.689423 }, // UK
        // const orgCenter = { lat: 39.0921017, lng: -96.8169365 }, // US KC
        // const orgCenter = {lat: 39.168431, lng: -77.6062407}// US Lansdowne
        return { lat: 39.0921017, lng: -96.8169365 }, // US KC
    }
    console.log("orgCenter: ", orgCenter);
})();
const redIcon = L.icon({
    //iconUrl: '../dist/images/marker-icon-red.png',
    iconUrl: redIconURL,
    iconSize: [25, 41],
    iconAnchor: [25, 41],
    popupAnchor: [-10, -51],
    //shadowUrl: '../dist/images/marker-shadow.png',
    shadowUrl: redShadowURL,
    shadowSize: [25, 41],
    shadowAnchor: [25, 41]
}); //redIcon

// FUNC: SG: read in data 
const getLocations = (async () => {
    // console.log("getLocations: in:: ");
    //const response = await fetch("./data/jf-offices-US.json");
    //const response = await fetch("../data/retailers-geojson.json");
    //const response = await fetch("../data/retailers-geojson-150.json");
    const response = await fetch("/us/en/api/retailers.json");
    const locations = await response.json();
    //console.log("getLocations: locations:: ", locations);
    return locations;
})(); //getStores

// FUNC: SG: sort data by distance from zip and truncate to maxListCnt
const sortDataByZip = (locationOBJ) => {
    //console.log("sortDataByZip: locationOBJ:: ", locationOBJ);
    let sortData = {...locationOBJ}; 
    //console.log("sortDataByZip: sortData:: ", sortData);
    //console.log("sortDataByZip: sortData length:: ", sortData.features.length);
    
    // add distance from zip to features properties
    const sortDataLen = sortData.features.length;
    //console.log("sortDataByZip: sortData sortDataLen:: ", sortDataLen);
    for (let x=0; x<sortDataLen; x++) {
        let testCords = sortData.features[x].geometry.coordinates;
        //console.log("sortDataByZip: location:: ", sortData.features[x].properties.name);
        //console.log("sortDataByZip: testCords:: ", testCords);
        let distance = distanceBetween(orgCenter.lat, orgCenter.lng, testCords[1], testCords[0]);
        //console.log("sortDataByZip: distance:: ", distance);
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

// FUNC: SG: init map
const initMap = (() => {
    // create the map obj assign above
    daMap = L.map('leaflet-map').setView(orgCenter, orgZoom);
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
})(); //initMap

// FUNC: SG: load all data into map
const loadData = (async () => {    
    //console.log("loadData: getLocations:: ", await getLocations);
    return locationLayer.addData(await getLocations);
})(); //loadData

// FUNC: SG: distance diff
const distanceBetween = (lat1, lon1, lat2, lon2) => {
    let r = (countryCode == "us")? 3959 : 6371; //miles : km
    let R = (2*r);
    let p = 0.017453292519943295; // Math.PI / 180
    let c = Math.cos;
    let a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    return R * Math.asin(Math.sqrt(a));
} // distanceBetween

// FUNC: SG: load sorted data (maxListCnt) into list
const showLocationList = (async () => {
    //console.log("in showLocationList: 1");
    const locationOBJ = await getLocations;
    const locationOBJSorted = await sortDataByZip(locationOBJ);
    //console.log("showLocationList: locationOBJSorted:: ", locationOBJSorted);
    const locationList = locationOBJSorted.features;
    //console.log("showLocationList: locationList:: ", locationList);
    const locationListLen = locationList.length;
    //console.log("showLocationList: locationList:: locationListLen:: ", locationListLen);
    if ( locationListLen > 0 ) {
        let daHeader = document.createElement("h2");
        daHeader.innerHTML = `Closest ${maxListCnt} Retailers`;
        let daNode = document.createElement("UL");
        daNode.classList.add("location-list")

        for ( let location in locationList ) {
            const properties = locationList[location].properties;
            //console.log("showLocationList: properties:: ", properties);

            const coords = locationList[location].geometry.coordinates;
            const name = properties.name;
            const description = properties.description;
            //const address = properties.address;
            //const hours = properties.hours;
            const phone = properties.field_retailer_telephone;
            const email = properties.field_retailer_email;
            const distance = Math.round( properties.distance );
            //const image = properties.image;
            //const position = event.feature.getGeometry().get();

            //let loc = name.split(",");
            const re = new RegExp(/\W+/, 'g');
            const loc = name.replace(re, "-").toLowerCase();
            //console.log("showLocationList:: LOC: ", loc);

            let daContent = document.createElement("li");
            daContent.classList.add("location-list-item");
            //<a href="#" oclick="moveToLocation(${coords});scrollListLoc('${loc}'); return false;">
                  
            let daText = String.raw`                
                <h3 id="${loc}"><a href="#" onclick="return false;" data-coords="${coords}" data-loc="${loc}">
              ${name}</a></h3>
                
                <p>${description}</p>
                <p><strong>Distance:</strong> ~ ${distance} ${distanceUnit}</p>
                <p>
                    <strong>Phone:</strong> ${phone}<br/>
                    <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
                </p>
            `;
            daContent.innerHTML = daText;
            daNode.appendChild(daContent);
        } // for
        document.getElementById("location-list-panel").appendChild(daHeader);
        document.getElementById("location-list-panel").appendChild(daNode);
    } // if
    bindListAction();
})(); //showLocationList

// FUNC: SG: add click actions to map
const clickActionMap = (async () => {
    //console.log("clickActionMap: in::");
    let daData = await loadData;
    let layers = daData._layers;
    //console.log("clickActionMap: layers:: ", layers);
    let keys = Object.keys(layers);
    //console.log('obj contains ' + keys.length + ' keys: '+  keys);
    //console.log("clickActionMap: keys:: ",keys);
    keys.map( key => {
        //console.log("clickActionMap: loc:: ",layers[key]);
        //console.log("clickActionMap: feature:: ",layers[key].feature.properties);
        let re = new RegExp(/\W+/, 'g');
        let name = layers[key].feature.properties.name;
        let clickLoc = name.replace(re, "-").toLowerCase();
        //console.log("clickLoc: ", clickLoc);
        let desc = layers[key].feature.properties.description;
        let email = layers[key].feature.properties.field_retailer_email;
        let phone = layers[key].feature.properties.field_retailer_telephone;
        layers[key].bindPopup(`
                <h2>${name}</h2>
                <p>${desc}</p>
                <p>
                    <strong>Phone:</strong> ${phone}<br/>
                    <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
                </p>
        `);
        layers[key].on('click', (ev) => { 
            //console.log("ev: ", ev);
            scrollListLoc(clickLoc, ev);
        });
    });
})(); //clickActionMap

// FUNC: SG: add click actions to list

const moveToLocation = (lng, lat) => {
  //console.log("moveToLocation>> coords: ", lng, lat);
  daMap.closePopup();
  daMap.flyTo(new L.LatLng(lat, lng), zoomZoom);
}; //moveToLocation

const scrollListLoc = (loc) => {
  //console.log("scrollListLoc loc: ", loc);
  let daClass = "active-loc";
  let listItems = document.getElementsByClassName("location-list-item");
    //console.log("scrollListLoc listItems: ", listItems);
  let listItemsLen = listItems.length;
    //console.log("scrollListLoc listItems.length: ", listItemsLen);
  // turn em all off
  for (let i = 0; i < listItemsLen; i++) {
    //console.log("scrollListLoc loc: ", listItems[i]);
    listItems[i].classList.remove(daClass);
  } //for

  //highlight clicked
  let el = document.getElementById(loc);
  //console.log("scrollListLoc el: ", el);
  if (el) {
    let parentEl = el.parentNode;
    if (!parentEl.classList.contains(daClass)) {
        parentEl.classList.add(daClass);
    }
    el.scrollIntoView();
  } else { alert(`This location not in top ${maxListCnt} retailers list.`)}
}; //scrollLocList

// FUNC: SG: Bind list click action
const bindListAction = () => {         
    const listItems = document.getElementsByClassName("location-list-item");
    const listItemsLen = listItems.length;
    for (let i = 0; i < listItemsLen; i++) {   
           
        listItems[i].addEventListener('click', e => {
            // console.log('location-list-item', e.target.dataset);
            let dataCoords = (e.target.dataset.coords).split(',');
            let dataLoc = e.target.dataset.loc;
            // console.log("bindListAction:: click: coords:: ", dataCoords);
            // console.log("bindListAction:: click: loc:: ", dataLoc);

            scrollListLoc(dataLoc);
            moveToLocation(dataCoords[0],dataCoords[1]);

            return false;
        });
    }
};
