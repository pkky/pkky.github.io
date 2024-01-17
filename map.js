var map;
var geojsonLayer;
var city = null;
var shopLayers = {}; // Object to hold layers for each type of shop
var currentGreenSquareMarker = null;


// Mapping of city names to their coordinates
const cityCoordinates = {
    "Warsaw": [52.229676, 21.012229],
    "Lodz": [51.759445, 19.457216],
    "Krakow": [50.064651, 19.944981],
    "Wroclaw": [51.107883, 17.038538],
    "Bydgoszcz": [53.123482, 18.008438],
    "Torun": [53.013790, 18.598444],
    "Lublin": [51.246454, 22.568446],
    "Gorzow_Wielkopolski": [52.73679, 15.22878],
    "Zielona_Gora": [51.935621, 15.506186],
    "Opole": [50.675107, 17.921298],
    "Rzeszow": [50.041187, 21.999121],
    "Bialystok": [53.132489, 23.168840],
    "Gdansk": [54.352025, 18.646638],
    "Katowice": [50.270908, 19.039993],
    "Kielce": [50.866077, 20.628569],
    "Olsztyn": [53.770226, 20.490189],
    "Poznan": [52.406374, 16.925168],
    "Szczecin": [53.428543, 14.552812]
};


document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    attachEventListeners();
});

function initializeMap() {
    // Set the initial view of the map
    const initialCoordinates = [52.0693, 19.4803]; // Coordinates for Poland
    const initialZoomLevel = 6;
    map = L.map('mapContainer').setView(initialCoordinates, initialZoomLevel);

    // Add the tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load Poland borders by default
    loadPolandBorders();
}

function attachEventListeners() {
    document.getElementById('citySelector').addEventListener('change', showCity);
    document.getElementById('shopSelector').addEventListener('change', updateShopsDisplay);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
}

function showCity() {
    city = document.getElementById("citySelector").value;
    
    // Clear previous city data
    if (geojsonLayer) {
        geojsonLayer.remove();
        geojsonLayer = null;
    }
    
    // Remove previous shop layers
    Object.keys(shopLayers).forEach(key => {
        if (shopLayers[key]) {
            shopLayers[key].remove();
            shopLayers[key] = null;
        }
    });

    // Clear the shopLayers object
    shopLayers = {};
    
    // Remove the previous green square marker if it exists
    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
        currentGreenSquareMarker = null;
    }
    
    // Set view and load data based on selected city
    if (city) {
        map.setView(cityCoordinates[city], 13);
        loadGeoJson(city);
    } else {
        // Set view for Poland and load borders
        map.setView([52.0693, 19.4803], 6);
        loadPolandBorders();
    }
}

function loadGeoJson(city) {
    var geoJsonPath = city + '.geojson';

    if (geojsonLayer) {
        geojsonLayer.remove();
    }

    fetch(geoJsonPath)
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
                    return L.layerGroup(); // Avoid creating default markers
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

function onEachFeature(feature, layer) {
    if (feature.geometry.type === 'MultiPoint' && feature.properties.image) {
        feature.geometry.coordinates.forEach((coord) => {
            var customIcon = L.icon({
                iconUrl: feature.properties.image,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            var marker = L.marker([coord[0], coord[1]], {icon: customIcon});
            marker.bindPopup('<b>' + feature.properties.shopName + '</b>');
            
            marker.on('mouseover', function () {
                this.openPopup();
            }).on('mouseout', function () {
                this.closePopup();
            }).on('dblclick', function () {
                if (map.getZoom() === 19) {
                    map.setView(cityCoordinates[city], 13); // Zoom out to level 13 for the selected city
                } else {
                    map.setView(marker.getLatLng(), 19); // Zoom in to level 19 on the marker
                }
            });

            var shopTag = feature.properties.tag;
            if (!shopLayers[shopTag]) {
                shopLayers[shopTag] = L.layerGroup();
            }
            shopLayers[shopTag].addLayer(marker).addTo(map);
        });
    }
}

function geocodeAddress(address, city) {
    let queryString = `https://nominatim.openstreetmap.org/search?format=json&q=${address}`;
    
    // Append city to the query if it's selected
    if (city) {
        queryString += `, ${city}`;
    }

    fetch(queryString)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                // Assuming the first result is the most relevant
                const coordinates = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                
                // Add a green square marker to the map at the geocoded location
                addGreenSquareMarker(coordinates[0], coordinates[1]);
                
                // Optionally, center the map on the new marker
                map.setView(coordinates, 15);
            } else {
                console.error('No results found for this address.');
            }
        })
        .catch(error => console.error('Error during geocoding:', error));
}

function addGreenSquareMarker(lat, lng) {
    // Remove the previous marker if it exists
    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
    }

    var greenIcon = L.divIcon({
        className: 'green-square-marker',
        iconSize: [20, 20],
        html: '<div style="background-color:green; width:100%; height:100%;"></div>'
    });

    currentGreenSquareMarker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
}

document.getElementById('addressInput').addEventListener('change', function(e) {
    var address = e.target.value;
    var city = document.getElementById('citySelector').value;
    geocodeAddress(address, city);
});

function updateShopsDisplay() {
    var checkboxes = document.querySelectorAll('#shopSelector input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            if (shopLayers[checkbox.value]) {
                shopLayers[checkbox.value].addTo(map);
            }
        } else {
            if (shopLayers[checkbox.value]) {
                map.removeLayer(shopLayers[checkbox.value]);
            }
        }
    });
}

function toggleDarkMode() {
    var isDarkMode = document.body.classList.toggle('dark-mode');
    this.textContent = isDarkMode ? '🌞' : '🌜';

    if (isDarkMode) {
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
    } else {
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
    }
}

// Define light and dark tile layers for dark mode toggle
var lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

var darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

function loadPolandBorders() {
    fetch('map.geojson')  // Make sure this is the correct path to your GeoJSON file
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                geojsonLayer.remove();  // Remove previous layer if it exists
            }
            geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    return {color: "#ff7800", weight: 2};  // Style for the border, adjust as needed
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}