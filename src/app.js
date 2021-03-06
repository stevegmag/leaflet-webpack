//console.log('app loaded');

// TODO: SG: get orig zip >> current_postal_code (twig file)
// current_location.latitude (twig file)
// current_location.longitude (twig file)
// let remote_lat = current_location.latitude;
// let remote_lng = current_location.longitude

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
const blueIconURL = (site == 'localhost')?
    '../dist/images/marker-icon.png':
    '/themes/custom/fmc/dist/images/marker-icon.png';
const shadowURL = (site == 'localhost')?
    '../dist/images/marker-shadow.png':
    '/themes/custom/fmc/dist/images/marker-shadow.png';
const countryCode = (() => {
    let daPath = window.location.pathname;
    daPath = daPath.indexOf('/us/');
    return (daPath > -1)?'us':'nonus';
})();
const sitePathRoot = (() => {
    let daRoot = window.location.pathname;
    daRoot = (daRoot.length >= 7)? 
        daRoot.slice(0,7):
        '/us/en/';
    return daRoot;
})();
const apiEndPoint = sitePathRoot + 'api/retailers.json';
//console.log("apiEndPoint: ", apiEndPoint);
const distanceUnit = (countryCode == "us")? "mi" : "km";
const maxListCnt = 10;
const maxMapCnt = 50;
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
        return { lat: 39.0921017, lng: -96.8169365 } // US KC
    }
    // console.log("orgCenter: ", orgCenter);
})();
// TODO: SG: setup up blue (default) marker and swap the default with red
const redIcon = L.icon({
    iconUrl: redIconURL,
    iconSize: [25, 41],
    iconAnchor: [25, 41],
    popupAnchor: [-10, -51],
    shadowUrl: shadowURL,
    shadowSize: [25, 41],
    shadowAnchor: [25, 41]
}); //redIcon
const blueIcon = L.icon({
    iconUrl: blueIconURL,
    iconSize: [25, 41],
    iconAnchor: [25, 41],
    popupAnchor: [-10, -51],
    shadowUrl: shadowURL,
    shadowSize: [25, 41],
    shadowAnchor: [25, 41]
}); //redIcon

// FUNC: SG: read in data 
const getLocations = (async () => {
    //console.log("getLocations: in:: ");
    //const response = await fetch("../data/jf-offices-US.json");
    //const response = await fetch("../data/retailers-geojson.json");
    //const response = await fetch("../data/retailers-geojson-150.json");
    //const response = await fetch("/us/en/api/retailers.json");
    const response = await fetch(apiEndPoint);
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
        accessToken: 'pk.eyJ1IjoiZm1jYWctbmEiLCJhIjoiY2s5OXV5ZTR5MWttbDNwbGNjMHJtaWg1bSJ9.HtuFS1-t9oOi98ykHFXNMA' // client api key
    }).addTo(daMap);
    
    // add default icon
    L.Marker.prototype.options.icon = redIcon;
    // add current zip marker to map with unique icon
    const orgMarker = L.marker(orgCenter, {icon: blueIcon}).addTo(daMap);
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
        daHeader.innerHTML = `Showing ${maxListCnt} nearby retailers`;
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
            if (phone.indexOf("tel:") == -1) {
                // phone may come with the link or not
                phone = `<a href="tel:${phone}">${phone}</a>`
            }
            if (email.length > 0) {
                email = String.raw`
                <div class="contact email">
                    <a href="mailto:${email}">${email}</a>
                </div>
                `;
            }

            if (phone.length > 0) {
                phone = String.raw`
                <div class="contact phone">
                    ${phone}
                </div>
                `;
            }
            //let loc = name.split(",");
            const re = new RegExp(/\W+/, 'g');
            const loc = name.replace(re, "-").toLowerCase();
            //console.log("showLocationList:: LOC: ", loc);

            let daContent = document.createElement("li");
            daContent.classList.add("location-list-item");
            //<a href="#" oclick="moveToLocation(${coords});scrollListLoc('${loc}'); return false;">
                  
            let daText = String.raw`  
                <h3 id="${loc}">
                    <a href="#" onclick="return false;" data-coords="${coords}" data-loc="${loc}">
              ${name}</a>
                </h3>      

                <div class="distance">
                    ~ ${distance} ${distanceUnit} from you
                </div>            
                
                <div class="detials">
                    ${description}
                </div>
                ${phone}
                ${email}
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
        if (phone.indexOf("tel:") == -1) {
            // phone may come with the link or not
            phone = `<a href="tel:${phone}">${phone}</a>`
        }
        layers[key].bindPopup(`
                <h3>${name}</h3>
                <p>${desc}</p>

                <div class="contact phone">
                    ${phone}
                </div>
                <div class="contact email">
                    <a href="mailto:${email}">${email}</a>
                </div>
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
  let containerEl = document.getElementsByClassName("location-list");
    containerEl = containerEl[0];
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
    //scroll clicked to top of UL/Container  
    let topPos = parentEl.offsetTop;
    scrollTo(containerEl, topPos, 600);
  } else { alert(`This location not in top ${maxListCnt} retailers list.`)}
}; //scrollLocList

const scrollTo = (element, to, duration) => {
    let start = element.scrollTop,
        change = to - start,
        currentTime = 0,
        increment = 20;
        
    const animateScroll = () =>{        
        currentTime += increment;
        let val = Math.easeInOutQuad(currentTime, start, change, duration);
        element.scrollTop = val;
        if(currentTime < duration) {
            setTimeout(animateScroll, increment);
        }
    };
    animateScroll();
}

Math.easeInOutQuad = (t, b, c, d) => {
    //t = current time
    //b = start value
    //c = change in value
    //d = duration
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	t--;
	return -c/2 * (t*(t-2) - 1) + b;
};

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
}; //bindListAction
