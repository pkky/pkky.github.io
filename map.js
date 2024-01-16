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

function updateMapWithFilteredData() {
    if (!map || !globalGeojsonData) return;

    if (geojsonLayer) {
        geojsonLayer.remove();
    }

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
    for (var i = 0; i < checkboxes.length; i++) {
        console.log("Checking:", checkboxes[i].value, shopTag, checkboxes[i].checked);
        if (checkboxes[i].value === shopTag && checkboxes[i].checked) {
            return true;
        }
    }
    return false;
}

// Function to define behavior for each feature in the GeoJSON file
function onEachFeature(feature, layer) {
    if (feature.geometry.type === 'MultiPoint') {
        feature.geometry.coordinates.forEach((coord) => {
            if (shouldDisplayShop(feature.properties.tag)) {
                var customIcon = L.icon({
                    iconUrl: feature.properties.image, // URL to the image
                    iconSize: [20, 20], // Size of the icon
                    iconAnchor: [10, 20], // Point of the icon which will correspond to marker's location
                    popupAnchor: [0, -20] // Point from which the popup should open relative to the iconAnchor
                });

                var point = L.marker([coord[0], coord[1]], {icon: customIcon});
                point.bindPopup(getPopupContent(feature));
                point.addTo(map);
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
