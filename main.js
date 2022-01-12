let churchCount = document.getElementById("map-counter");
let map = L.map('map').setView([42.70107, -84.60312], 12);
let fileBaseUrl = 'https://davincikab.github.io/mission_filled/';

// load a tile layer
let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);

let cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
    attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
  });
 

// icons
let churchIcon = L.divIcon({
    className:'div-marker',
    html:'<div class="church-icon">C</div>'
});

let missionaryIcon = L.divIcon({
    className:'div-marker',
    html:'<div>M</div>'
});

let churchCluster = L.markerClusterGroup({
     iconCreateFunction: iconCreate
});

churchCluster.addTo(map);

let missionaryCluster = L.markerClusterGroup({
     iconCreateFunction: iconCreate
});

function iconCreate(cluster) {
    return L.divIcon({
        className:'marker-cluster',
        html: '<div class="cluster-marker"><b>' + cluster.getChildCount() + '</b><div>' 
    });
}

missionaryCluster.addTo(map);

// 
let neighNeeds = L.geoJSON(neighbourhoodData, {
    style:function(feature) {
        return {
            weight:1,
            fillColor:getFillColor(),
            fillOpacity:0.7,
            color:'#999',
        }
    }
});

neighNeeds.addTo(map);

function getFillColor() {
    let colors = ['#b2182b','#d6604d','#f4a582','#fddbc7','#e0e0e0','#bababa','#878787','#4d4d4d'];
    let index = parseInt(Math.random() * 8);
    
    return colors[index]
}



// layer control
var overlay = {
    'Neighbourhood Needs':neighNeeds,
    'Churches':churchCluster,
    'Missionary':missionaryCluster
};

var baseLayers = {
    'Carto Dark':cartoDark,
    'OSM':osm
};

L.control.layers(baseLayers, overlay, { collapsed:false}).addTo(map);


// fetch the data
d3.csv(`${fileBaseUrl}churches.csv`)
.then(data => {
    // console.log(data);
    let markers = createMarkers(data, true);
    churchCluster.addLayers(markers);

    updateCount(data.length);
});

d3.csv(`${fileBaseUrl}missionary.csv`)
.then(data => {
    // console.log(data);
    let markers = createMarkers(data);
    missionaryCluster.addLayers(markers);
});

function updateCount(count) {
    let total = 0;
    let timeInterval = setInterval(() => {
        total += 1;
        if(total > count) {
            clearInterval(timeInterval)
        }

        // update
        churchCount.innerHTML = total;
        churchCount.setAttribute('data-count', total);
    }, 10);
}

function createMarkers(data, isChurch) {
    let icon = isChurch ? churchIcon : missionaryIcon;

    let markerArray = data.map(item => {
        let popupContent = getPopupContent(item, isChurch);
        
        return L.marker([
            parseFloat(item.latitude), 
            parseFloat(item.longitude)
        ], 
        { icon:icon, title:item.Name }
        ).bindPopup(popupContent);


    });

    return markerArray;
}

function getPopupContent(item, isChurch) {
    if(isChurch) {
        return `<h2>${item.Name}</h5> <p>${item.address}</p>`;
    } else {
        return `<h2>${item.Name}</h5> <p>${item.address}</p>`;
    }
}

// handle input changes
let filterObj = {
    servicecategory:'all',
    servicelanguage:'all',
    neighbourhood:'all'
};

let filters = document.querySelectorAll(".filter > select");
console.log(filters);

filters.forEach(filter => {
    filter.onchange = function(e) {
        // get the id
        let { id, value } = e.target;

        filterObj[id] = value;

        filterServices(filterObj);
    }
});

// filter the data
function filterServices(filterObj) {
    console.log(filterObj);
}

// auto complete
const autoCompleteIns = new autoComplete(
    {
        selector: "#autoComplete",
        placeHolder: "Search for Churches...",
        data: {
            src: async function() {
                let churches = await d3.csv(`${fileBaseUrl}churches.csv`);
                let missionaries = await d3.csv(`${fileBaseUrl}missionary.csv`);

                // 
                // console.log(churches);
                return churches;
            },
            keys:['address'], //zip code or city/state region 
            cache: true,
        },
        resultsList: {
            element: (list, data) => {

                if (!data.results.length) {
                    // Create "No Results" message element
                    const message = document.createElement("div");
                    // Add class to the created element
                    message.setAttribute("class", "no_result");
                    // Add message text content
                    message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                    // Append message element to the results list
                    list.prepend(message);
                }
            },
            noResults: true,
        },
        resultItem: {
            element: (item, data) => {
                item.setAttribute("data-parent", "food-item");

                item.innerHTML = `<div >
                    ${data.value.Name} 
                    </br>
                    ${data.match}
                </div>`;

                // console.log(data);
            },
            highlight: {
                render: true
            }
        }
    }
);

document.querySelector("#autoComplete").addEventListener("selection", function (event) {
    // "event.detail" carries the autoComplete.js "feedback" object
    let { selection:{ value} } = event.detail;

    map.flyTo([
        +value.latitude,
        +value.longitude
    ], 18);

    // ge
    map.once('zoomend', function(e) {
        console.log('Zoom End');

        // display the popup
        churchCluster.eachLayer(layer => {

            if(layer.options.title == value.Name) {
                console.log(layer);

                layer.openPopup();
            }
        });
    });

    // update the input value
    this.value = value.address;
});


// geocode the addresses
d3.csv('lansing_miss.csv')
.then(data => {
    console.log(data);

    // places api
    // getChurchCoord(data, cbFunction);

    function cbFunction(places) {
        console.log(JSON.stringify(places))
    }
   
});

function getChurchCoord(data, cbFunction) {
    let index = 0;
    let newArray = [];

    async function geocode(item) {
        // increment the index
        index += 1;

        if(index == data.length) {
            cbFunction(newArray);
            return;
        }

        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${item.address}.json?&types=address&access_token=pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA`;
        let result =  await fetch(url).then(res => res.json());
        let coord = result.features[0].center;

        newArray.push({
            ...item,
            latitude:coord[1],
            longitude:coord[0]
        });

        setTimeout(e => {
           
        }, 500);

        return geocode(data[index]);
    }

    geocode(data[index]);

    // return newArray;
}

