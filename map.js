var map;
var geojsonLayer;
var city = null;

// Mapping of city names to their coordinates
const cityCoordinates = {
    "Warsaw": [52.229676, 21.012229],
    "Lodz": [51.759445, 19.457216],
    "Krakow": [50.064651, 19.944981]
};

function loadPolandBorders() {
    fetch('map.geojson')
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                geojsonLayer.remove();
            }
            geojsonLayer = L.geoJSON(data, {
                style: {
                    color: "#ff7800",
                    weight: 5,
                    opacity: 1
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

function showCity() {
    city = document.getElementById("citySelector").value;
    const polandCoordinates = [52.0693, 19.4803];
    const polandZoomLevel = 6;

    if (map) {
        map.remove();
    }

    map = L.map('mapContainer');

    // Check if dark mode is active
    var isDarkMode = document.body.classList.contains('dark-mode');
    var tileUrl = isDarkMode 
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' // URL for dark mode tiles
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // URL for light mode tiles

    L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (city) {
        map.setView(cityCoordinates[city], 13);
        loadGeoJson(city);
    } else {
        map.setView(polandCoordinates, polandZoomLevel);
        loadPolandBorders();
    }

    map.on('dblclick', function() {
        if (map.getZoom() == 19) {
            map.setZoom(13); // Zoom out to level 19 when the map is double-clicked
        }
    });
}

showCity();

document.getElementById('darkModeToggle').addEventListener('click', function() {
    var isDarkMode = document.body.classList.toggle('dark-mode');
    this.textContent = isDarkMode ? '🌞' : '🌜';

    if (isDarkMode) {
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
    } else {
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
    }
});

document.getElementById('shopSelector').addEventListener('change', updateShopsDisplay);

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
                onEachFeature: function (feature, layer) {
                    if (feature.geometry.type === 'MultiPoint' && feature.properties.tag) {
                        var fillColor = getFillColorByTag(feature.properties.tag);
                        var latlngs = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        var polygon = L.polygon(latlngs, {
                            color: 'black',
                            fillColor: fillColor,
                            fillOpacity: 0.5
                        });

                        var centroid = polygon.getBounds().getCenter();
                        var customIcon = L.icon({
                            iconUrl: feature.properties.image, 
                            iconSize: [20, 20], 
                            iconAnchor: [10, 10]
                        });

                        var marker = L.marker(centroid, {icon: customIcon});
                        marker.bindPopup('<b>' + feature.properties.shopName + '</b><br>' +
                                        feature.properties.streetName + ' ' + feature.properties.streetNumber);

                        marker.on('mouseover', function () {
                            this.openPopup();
                        }).on('mouseout', function () {
                            this.closePopup();
                        }).on('dblclick', function() {
                            map.setView(marker.getLatLng(), 19);
                        });

                        var shopTag = feature.properties.tag;
                        if (!shopLayers[shopTag]) {
                            shopLayers[shopTag] = L.layerGroup();
                        }
                        shopLayers[shopTag].addLayer(polygon).addLayer(marker).addTo(map);
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}


var shopLayers = {}; // Object to hold layers for each type of shop

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

function getFillColorByTag(tag) {
    // Define colors for different tags
    var colors = {
        "biedronka": "yellow",
        "lidl": "blue",
        // Add more tags and colors as needed
    };

    return colors[tag] || "black"; // Default color if tag not found
}

var lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

var darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});
