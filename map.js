var map;
var geojsonLayer;
var city = null;
var shopLayers = {}; // Object to hold layers for each type of shop
var currentGreenSquareMarker = null;
var polandBounds = [
    [49.0, 14.1], // Southwest coordinates
    [55.0, 24.1]  // Northeast coordinates
];
const searchRadius = 1000; // 2 km
var visibleShopsGlobal = [];
var visibleShopMarkers = [];

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
    const initialCoordinates = [52.0693, 19.4803]; // Coordinates for the center of Poland
    const initialZoomLevel = 6;
    
    map = L.map('mapContainer', {
        maxBounds: polandBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 6, // Set minimum zoom level
    }).setView(initialCoordinates, initialZoomLevel);

    // Load Poland borders by default
    loadPolandBorders();
    
    // Initialize shop layers without adding them to the map
    var shopTypes = ["Biedronka", "Lidl", "Carrefour", "Auchan", "Rossmann"]; // Add other shop types if necessary
    shopTypes.forEach(shopType => {
        // Convert shopType to lowercase
        shopLayers[shopType.toLowerCase()] = L.layerGroup().addTo(map); 
    });

    // Add the tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
    
    map.on('zoomend', function() {
        if (map.getZoom() === 6) {
            resetMapView();
        }
    });
    
    EU();
}

function resetMapView() {
    // Reset city selection
    document.getElementById('citySelector').value = 'Wybierz miasto';

    // Clear previous city data
    clearCityData();

    // Remove the previous green square marker if it exists
    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
        currentGreenSquareMarker = null;
    }

    // Set view for Poland, ensure the zoom level is set to 6
    map.setView([52.0693, 19.4803], 6);

    // Set maximum zoom level to 7
    map.setZoom(6);
    map.options.minZoom = 6;
    map.options.maxZoom = 7;

    loadPolandBorders();
}

function clearCityData() {
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
}

function attachEventListeners() {
    document.getElementById('citySelector').addEventListener('change', showCity);
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('addressInput').addEventListener('change', function(e) {
        var address = e.target.value;
        var city = document.getElementById('citySelector').value;
        geocodeAddress(address, city);
    });
}

function showCity() {
    let city = document.getElementById('citySelector').value;

    // Clear previous city data, shops, and markers
    clearCityData();
    clearVisibleShops();

    // Clear previous city data
    if (geojsonLayer) {
        geojsonLayer.remove();
        geojsonLayer = null;
    }
    
    // Remove previous shop layers and markers
    Object.keys(shopLayers).forEach(key => {
        if (shopLayers[key]) {
            shopLayers[key].clearLayers(); // Clear markers from the layer
            shopLayers[key].remove(); // Remove layer from map
            delete shopLayers[key]; // Delete the key from the shopLayers object
        }
    });

    // Reinitialize shop layers without adding them to the map
    var shopTypes = ["Biedronka", "Lidl", "Carrefour", "Auchan", "Rossmann"]; // Add other shop types if necessary
    shopTypes.forEach(shopType => {
        shopLayers[shopType.toLowerCase()] = L.layerGroup(); // Don't add to map yet
    });

    // Remove the previous green square marker if it exists
    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
        currentGreenSquareMarker = null;
    }
    
    // Clear the address input
    document.getElementById('addressInput').value = '';

    // Set view and load data based on selected city
    if (city && city !== 'Wybierz miasto') {
        // Allow zooming up to level 19 for specific cities
        map.options.minZoom = 6;
        map.options.maxZoom = 19;

        map.setView(cityCoordinates[city], 13);
        loadGeoJson(city); // Load city-specific data
    } else {
        // Set view for Poland and load borders if 'Wybierz miasto' is selected
        resetMapView();
    }
}

function loadGeoJson(city) {
    var geoJsonPath = 'localizations/' + city + '.geojson';

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

            var marker = L.marker([coord[0], coord[1]], {icon: customIcon}); // Leaflet expects [lat, lng]
            marker.bindPopup(function() {
                if (currentGreenSquareMarker) {
                    // Calculate distance from green square marker to the shop
                    var distance = calculateDistance(marker.getLatLng(), currentGreenSquareMarker.getLatLng());
                    return '<b>' + feature.properties.shopName + '</b><br>Distance: ' + distance + ' meters';
                } else {
                    return '<b>' + feature.properties.shopName + '</b><br>Distance: not available';
                }
            });

            var shopTag = feature.properties.tag.toLowerCase(); // Convert tag to lowercase

            // Check if the shopLayer for this tag exists
            if (!shopLayers[shopTag]) {
                console.error("Shop layer not found for tag:", shopTag);
                shopLayers[shopTag] = L.layerGroup().addTo(map);
            } else {
                shopLayers[shopTag].addLayer(marker); // Add marker to the corresponding layer group
            }
        });
    }
}

// Utility function to calculate the distance between two points
function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2).toFixed(2); // Distance in meters, rounded to 2 decimals
}

function geocodeAddress(address, city) {
    let addressInput = document.getElementById('addressInput');

    // Clear any previous shake and red-border classes
    addressInput.classList.remove('shake', 'red-border');

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

                // Clear previously visible shops
                clearVisibleShops();

                // Show shops within the radius
                showShopsInRadius(coordinates, searchRadius);
            } else {
                console.error('No results found for this address.');
                // Apply the shake and red-border classes to the address input
                addressInput.classList.add('shake', 'red-border');

                // Optionally, remove the shake and red-border classes after some time
                setTimeout(function() {
                    addressInput.classList.remove('shake', 'red-border');
                }, 500); // Duration of shaking animation
            }
        })
        .catch(error => {
            console.error('Error during geocoding:', error);
            // Apply the shake and red-border classes to the address input in case of an error
            addressInput.classList.add('shake', 'red-border');

            // Optionally, remove the shake and red-border classes after some time
            setTimeout(function() {
                addressInput.classList.remove('shake', 'red-border');
            }, 500); // Duration of shaking animation
        });
}

function clearVisibleShops() {
    // Remove each marker from the map and clear the array
    visibleShopMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    visibleShopMarkers = [];
}

function showShopsInRadius(centerCoords, radius) {
    // Clear the global visible shops list at the beginning of each call
    clearVisibleShops();

    Object.keys(shopLayers).forEach(shopTag => {
        if (shopLayers[shopTag]) {
            shopLayers[shopTag].eachLayer(function(layer) {
                var shopCoords = layer.getLatLng();
                var distance = map.distance(centerCoords, shopCoords);
                
                if (distance <= radius) {
                    // Check if the shop is already in the visibleShopsGlobal array to avoid duplicates
                    const isShopAlreadyVisible = visibleShopMarkers.some(marker => marker.getLatLng().equals(shopCoords));

                    if (!isShopAlreadyVisible) {
                        layer.addTo(map);
                        shopLayers[shopTag].addLayer(layer);

                        // Add the marker to the visibleShopMarkers list
                        visibleShopMarkers.push(layer);
                    }
                }
            });
        }
    });
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

function updateShopsDisplay() {
    var checkboxes = document.querySelectorAll('#shopSelector input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            if (shopLayers[checkbox.value.toLowerCase()]) { // Use toLowerCase() to ensure consistency
                shopLayers[checkbox.value.toLowerCase()].addTo(map);
            }
        } else {
            if (shopLayers[checkbox.value.toLowerCase()]) {
                map.removeLayer(shopLayers[checkbox.value.toLowerCase()]);
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
});

var darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
});

function loadPolandBorders() {
    fetch('Map/Poland.geojson') // Adjust the path to your GeoJSON file
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                geojsonLayer.remove();  // Remove previous layer if it exists
            }
            geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: "#ff7800", // border color
                        weight: 5,
                        fillColor: "#ff7800", // light color for Poland
                        fillOpacity: 0.2
                    };
                }
            }).addTo(map);
            geojsonLayer.bringToFront(); // Make sure the border is always on top
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

function EU() {
    fetch('Map/EU.json') // Adjust the path to your GeoJSON file for EU
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    // Check if the country is Poland, then style differently
                    if (feature.properties.name === "Poland") {
                        return {
                            fillColor: "#ffffff", // White color for Poland
                            fillOpacity: 1, // Slightly transparent
                            color: "#ffffff", // Black border color
                            weight: 1
                        };
                    } else {
                        return {
                            fillColor: "#444444", // Black color for other countries
                            fillOpacity: 0.9, // Slightly transparent
                            color: "#000000", // Black border color
                            weight: 1
                        };
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the EU GeoJSON file:', error));
}