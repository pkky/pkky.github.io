var map;
var geojsonLayer;

// Mapping of city names to their coordinates
const cityCoordinates = {
    "Warsaw": [52.229676, 21.012229],
    "Lodz": [51.759445, 19.457216],
    "Krakow": [50.064651, 19.944981]
    // Add more cities and coordinates as needed
};

// Function to show the map for the selected city
function showCity() {
    var city = document.getElementById("citySelector").value;

    // Check if a city is selected
    if (city) {
        loadGeoJson(city);
        var coordinates = cityCoordinates[city]; // Get coordinates from the mapping

        if (map) {
            map.remove(); // Remove previous map instance
        }

        var latitude = coordinates[0];
        var longitude = coordinates[1];

        // Initialize the map
        map = L.map('mapContainer').setView([latitude, longitude], 13);

        // Load and display tile layer on the map (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Load GeoJSON for the selected city
        loadGeoJson(city);
    } else {
        if (map) {
            // Clear the existing map and layers if no city is selected
            map.remove();
            map = null;
            geojsonLayer = null;
        }
    }
}

var globalGeojsonData = null;

function loadGeoJson(city) {
    var geoJsonPath = city + '.geojson';

    if (geojsonLayer) {
        geojsonLayer.remove();
    }

    fetch(geoJsonPath)
        .then(response => response.json())
        .then(data => {
            globalGeojsonData = data;
            updateMapWithFilteredData();
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

var markers = []; // Global array to keep track of markers

function updateMapWithFilteredData() {
    if (!map || !globalGeojsonData) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = []; // Reset the markers array

    // Add new geojsonLayer with filtered data
    geojsonLayer = L.geoJSON(globalGeojsonData, {
        filter: function(feature, layer) {
            return shouldDisplayShop(feature.properties.tag);
        },
        onEachFeature: onEachFeature
    }).addTo(map);
}



// Function to determine if a shop should be displayed
function shouldDisplayShop(shopTag) {
    var checkboxes = document.querySelectorAll('#shopSelector input[type="checkbox"]');
    var displayShop = false;
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].value === shopTag && checkboxes[i].checked) {
            displayShop = true;
            break;
        }
    }
    return displayShop;
}


// Function to define behavior for each feature in the GeoJSON file
function onEachFeature(feature, layer) {
    if (feature.geometry.type === 'MultiPoint') {
        feature.geometry.coordinates.forEach((coord) => {
            if (shouldDisplayShop(feature.properties.tag)) {
                var customIcon = L.icon({
                    iconUrl: feature.properties.image,
                    iconSize: [20, 20],
                    iconAnchor: [10, 20],
                    popupAnchor: [0, -20]
                });

                var point = L.marker([coord[0], coord[1]], {icon: customIcon});
                point.bindPopup(getPopupContent(feature));
                point.addTo(map);
                markers.push(point); // Add marker to the global markers array
            }
        });
    } else if (feature.properties && feature.properties.shopName) {
        layer.bindPopup(getPopupContent(feature));
    }
}


// Function to get popup content
function getPopupContent(feature) {
    return '<b>' + feature.properties.shopName + '</b>';
}

document.getElementById('shopSelector').addEventListener('change', function() {
    updateMapWithFilteredData();
});

