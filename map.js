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

function loadGeoJson(city) {
    var geoJsonPath = city + '.geojson';

    if (geojsonLayer) {
        geojsonLayer.remove();
    }

    fetch(geoJsonPath)
        .then(response => response.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    if (feature.geometry.type === 'MultiPoint') {
                        var latlngs = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        var polygon = L.polygon(latlngs, {
                            color: 'black',
                            fillColor: 'black',
                            fillOpacity: 0.5
                        }).addTo(map);

                        polygon.bindPopup('<b>' + feature.properties.shopName + '</b><br>' +
                        feature.properties.streetName + ' ' + feature.properties.streetNumber);

                        polygon.on('mouseover', function () {
                            this.openPopup();
                        });
                        polygon.on('mouseout', function () {
                            this.closePopup();
                        });
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}