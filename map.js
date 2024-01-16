var map;
var geojsonLayer;


// Mapping of city names to their coordinates
const cityCoordinates = {
    "Warsaw": [52.229676, 21.012229],
    "Lodz": [51.759445, 19.457216],
    "Krakow": [50.064651, 19.944981]
    // more cities and coordinates
};

// Function to show the map for the selected city
function showCity() {
    var city = document.getElementById("citySelector").value;

    // Check if a city is selected
    if (city) {
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

// Function to load GeoJSON file
function loadGeoJson(city) {
    var geoJsonPath = city + '.geojson'; // Path to the GeoJSON file

    fetch(geoJsonPath)
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                geojsonLayer.clearLayers(); // Clear previous layers
            }

            geojsonLayer = L.geoJSON(data, {
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

function onEachFeature(feature, layer) {
    if (feature.geometry.type === 'MultiPoint') {
        feature.geometry.coordinates.forEach((coord) => {
            // Create a custom icon
            var customIcon = L.icon({
                iconUrl: feature.properties.image, // URL to the image
                iconSize: [20, 20], // Size of the icon
                iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
                popupAnchor: [-10, -45] // Point from which the popup should open relative to the iconAnchor
            });

            // Create a marker with the custom icon
            var point = L.marker([coord[0], coord[1]], {icon: customIcon});
            point.bindPopup(getPopupContent(feature));
            point.addTo(map);
        });
    } else if (feature.properties && feature.properties.shopName) {
        layer.bindPopup(getPopupContent(feature));
    }
}

function getPopupContent(feature) {
    var popupContent = '<b>' + feature.properties.shopName + '</b>';
    return popupContent;
}