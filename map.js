var map;
var geojsonLayer;

// Function to show the map for the selected city
function showCity() {
    var city = document.getElementById("citySelector").value;
    var coordinates = city.split(',');

    if (map) {
        map.remove(); // Remove previous map instance
    }

    if (coordinates.length === 2) {
        var latitude = parseFloat(coordinates[0]);
        var longitude = parseFloat(coordinates[1]);

        // Initialize the map
        map = L.map('mapContainer').setView([latitude, longitude], 13);

        // Load and display tile layer on the map (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Load GeoJSON for the selected city
        loadGeoJson(city);
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

// Function to define behavior for each feature in the GeoJSON file
function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.shopName) {
        // Create a popup with the shop name and image
        var popupContent = '<b>' + feature.properties.shopName + '</b>';
        if (feature.properties.image) {
            popupContent += '<br><img src="' + feature.properties.image + '" width="100px">';
        }
        layer.bindPopup(popupContent);
    }
}
