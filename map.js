var map;
var geojsonLayer;

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
    var city = document.getElementById("citySelector").value;
    const polandCoordinates = [52.0693, 19.4803];
    const polandZoomLevel = 6;

    if (city) {
        var coordinates = cityCoordinates[city];
        loadGeoJson(city);

        if (map) {
            map.remove();
        }

        map = L.map('mapContainer').setView([coordinates[0], coordinates[1]], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

    } else {
        if (map) {
            map.remove();
        }
        map = L.map('mapContainer').setView(polandCoordinates, polandZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        loadPolandBorders();
    }
}

showCity();

document.getElementById('darkModeToggle').addEventListener('click', function() {
    var isDarkMode = document.body.classList.toggle('dark-mode');
    this.textContent = isDarkMode ? '🌞' : '🌜';
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
                    // Return an empty layer to avoid creating default markers
                    return L.layerGroup();
                },
                onEachFeature: function (feature, layer) {
                    if (feature.geometry.type === 'MultiPoint' && feature.properties.tag) {
                        var latlngs = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        var polygon = L.polygon(latlngs, {
                            color: 'black',
                            fillColor: 'black',
                            fillOpacity: 0.5
                        })

                        var centroid = polygon.getBounds().getCenter();
                        var customIcon = L.icon({
                            iconUrl: feature.properties.image, // Path to the shop image
                            iconSize: [30, 30], // Adjust icon size as needed
                            iconAnchor: [15, 15] // Adjust anchor to center the icon
                        });

                        var marker = L.marker(centroid, {icon: customIcon});

                        polygon.bindPopup('<b>' + feature.properties.shopName + '</b><br>' +
                        feature.properties.streetName + ' ' + feature.properties.streetNumber);

                        polygon.on('mouseover', function () {
                            this.openPopup();
                        });
                        polygon.on('mouseout', function () {
                            this.closePopup();
                        });

                        var shopTag = feature.properties.tag;
                        if (!shopLayers[shopTag]) {
                            shopLayers[shopTag] = L.layerGroup();
                        }
                        shopLayers[shopTag].addLayer(polygon).addLayer(marker);
                    }
                }
            })
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

var shopLayers = {}; // Object to hold layers for each type of shop

function updateShopsDisplay() {
    var checkboxes = document.querySelectorAll('#shopSelector input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            // Show the layer if it exists
            if (shopLayers[checkbox.value]) {
                shopLayers[checkbox.value].addTo(map);
            }
        } else {
            // Remove the layer from the map
            if (shopLayers[checkbox.value]) {
                map.removeLayer(shopLayers[checkbox.value]);
            }
        }
    });
}
