var map;
var geojsonLayer;
var city = null;
var shopLayers = {};
var currentGreenSquareMarker = null;
var polandBounds = [
    [49.0, 14.1],
    [55.0, 24.1]
];
let searchRadius = 1500;
var visibleShopMarkers = [];
var isZoomLevelOutOfRange = false;

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
    const initialCoordinates = [52.0693, 19.4803];
    const initialZoomLevel = 6;

    map = L.map('mapContainer', {
        maxBounds: polandBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 6,
    }).setView(initialCoordinates, initialZoomLevel);

    loadPolandBorders();

    var shopTypes = ["Biedronka", "Lidl", "Carrefour", "Auchan", "Rossmann", "Kaufland", "Dealz"];
    shopTypes.forEach(shopType => {
        shopLayers[shopType.toLowerCase()] = L.layerGroup().addTo(map);
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    map.on('zoomend', function() {
        if (map.getZoom() === 6) {
            resetMapView();
        }
        if (map.getZoom() <= 12 || map.getZoom() >= 20) {
            isZoomLevelOutOfRange = true;
            clearVisibleShops();
        } else {
            isZoomLevelOutOfRange = false;
            if (currentGreenSquareMarker) {
                const coords = currentGreenSquareMarker.getLatLng();
                showShopsInRadius([coords.lat, coords.lng], searchRadius);
            }
        }
    });

    EU();
}

function updateSearchRadius(value) {
    searchRadius = parseInt(value, 10);
    document.getElementById('radiusValue').innerText = searchRadius;

    if (currentGreenSquareMarker && !isZoomLevelOutOfRange) {
        const coords = currentGreenSquareMarker.getLatLng();
        clearVisibleShops();
        showShopsInRadius([coords.lat, coords.lng], searchRadius);
    }
}

function resetMapView() {
    document.getElementById('citySelector').value = 'Wybierz miasto';

    clearCityData();

    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
        currentGreenSquareMarker = null;
    }

    map.setView([52.0693, 19.4803], 6);

    map.setZoom(6);
    map.options.minZoom = 6;
    map.options.maxZoom = 7;

    loadPolandBorders();
}

function clearCityData() {
    if (geojsonLayer) {
        geojsonLayer.remove();
        geojsonLayer = null;
    }

    Object.keys(shopLayers).forEach(key => {
        if (shopLayers[key]) {
            shopLayers[key].remove();
            shopLayers[key] = null;
        }
    });

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
    document.querySelectorAll('.shopToggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
            if (currentGreenSquareMarker && !isZoomLevelOutOfRange) {
                const coords = currentGreenSquareMarker.getLatLng();
                clearVisibleShops();
                showShopsInRadius([coords.lat, coords.lng], searchRadius);
            }
        });
    });
}

function showCity() {
    let city = document.getElementById('citySelector').value;

    clearCityData();
    clearVisibleShops();

    if (geojsonLayer) {
        geojsonLayer.remove();
        geojsonLayer = null;
    }

    Object.keys(shopLayers).forEach(key => {
        if (shopLayers[key]) {
            shopLayers[key].clearLayers();
            shopLayers[key].remove();
            delete shopLayers[key];
        }
    });

    var shopTypes = ["Biedronka", "Lidl", "Carrefour", "Auchan", "Rossmann", "Kaufland", "Dealz"];
    shopTypes.forEach(shopType => {
        shopLayers[shopType.toLowerCase()] = L.layerGroup();
    });

    if (currentGreenSquareMarker) {
        map.removeLayer(currentGreenSquareMarker);
        currentGreenSquareMarker = null;
    }

    document.getElementById('addressInput').value = '';

    if (city && city !== 'Wybierz miasto') {
        map.options.minZoom = 6;
        map.options.maxZoom = 19;

        map.setView(cityCoordinates[city], 13);
        loadGeoJson(city);
    } else {
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
                    return L.layerGroup();
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
                iconSize: [40, 40],
                iconAnchor: [10, 10]
            });

            var marker = L.marker([coord[0], coord[1]], {icon: customIcon});
            marker.bindPopup(function() {
                if (currentGreenSquareMarker) {
                    var distance = calculateDistance(marker.getLatLng(), currentGreenSquareMarker.getLatLng());
                    return '<b>' + feature.properties.shopName + '</b><br>Distance: ' + distance + ' meters';
                } else {
                    return '<b>' + feature.properties.shopName + '</b><br>Distance: not available';
                }
            });

            var shopTag = feature.properties.tag.toLowerCase();

            if (!shopLayers[shopTag]) {
                console.error("Shop layer not found for tag:", shopTag);
                shopLayers[shopTag] = L.layerGroup().addTo(map);
            } else {
                shopLayers[shopTag].addLayer(marker);
            }
        });
    }
}

function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2).toFixed(2);
}

function geocodeAddress(address, city) {
    let addressInput = document.getElementById('addressInput');

    addressInput.classList.remove('shake', 'red-border');

    let queryString = `https://nominatim.openstreetmap.org/search?format=json&q=${address}`;

    if (city) {
        queryString += `, ${city}`;
    }

    fetch(queryString)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const coordinates = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                addGreenSquareMarker(coordinates[0], coordinates[1]);
                map.setView(coordinates, 15);
                clearVisibleShops();
                showShopsInRadius(coordinates, searchRadius);
            } else {
                console.error('No results found for this address.');
                addressInput.classList.add('shake', 'red-border');

                setTimeout(function() {
                    addressInput.classList.remove('shake', 'red-border');
                }, 500);
            }
        })
        .catch(error => {
            console.error('Error during geocoding:', error);
            addressInput.classList.add('shake', 'red-border');

            setTimeout(function() {
                addressInput.classList.remove('shake', 'red-border');
            }, 500);
        });
}

function clearVisibleShops() {
    visibleShopMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    visibleShopMarkers = [];
}

function showShopsInRadius(centerCoords, radius) {
    clearVisibleShops();

    if (isZoomLevelOutOfRange) {
        return;
    }

    Object.keys(shopLayers).forEach(shopTag => {
        var checkbox = document.querySelector(`.shopToggle[value="${shopTag}"]`);
        if (shopLayers[shopTag] && checkbox && checkbox.checked) {
            shopLayers[shopTag].eachLayer(function(layer) {
                var shopCoords = layer.getLatLng();
                var distance = map.distance(centerCoords, shopCoords);

                if (distance <= radius) {
                    const isShopAlreadyVisible = visibleShopMarkers.some(marker => marker.getLatLng().equals(shopCoords));

                    if (!isShopAlreadyVisible) {
                        layer.addTo(map);
                        shopLayers[shopTag].addLayer(layer);

                        visibleShopMarkers.push(layer);
                    }
                }
            });
        }
    });
}

function addGreenSquareMarker(lat, lng) {
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

var lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
});

var darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
});

function loadPolandBorders() {
    fetch('Map/Poland.geojson')
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                geojsonLayer.remove();
            }
            geojsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: "#ff7800",
                        weight: 5,
                        fillColor: "#ff7800",
                        fillOpacity: 0.2
                    };
                }
            }).addTo(map);
            geojsonLayer.bringToFront();
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

function EU() {
    fetch('Map/EU.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    if (feature.properties.name === "Poland") {
                        return {
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                            color: "#ffffff",
                            weight: 1
                        };
                    } else {
                        return {
                            fillColor: "#444444",
                            fillOpacity: 0.9,
                            color: "#000000",
                            weight: 1
                        };
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the EU GeoJSON file:', error));
}

function toggleDropdown() {
    document.getElementById("shopToggleContainer").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function updateShopMarkersVisibility() {
    if (!isZoomLevelOutOfRange) {
        if (currentGreenSquareMarker) {
            const coords = currentGreenSquareMarker.getLatLng();
            showShopsInRadius([coords.lat, coords.lng], searchRadius);
        }
    } else {
        clearVisibleShops();
    }
}
