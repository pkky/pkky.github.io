var map;

function showCity() {
    var cityCoords = document.getElementById("citySelector").value.split(',');
    var latitude = parseFloat(cityCoords[0]);
    var longitude = parseFloat(cityCoords[1]);

    if (map) {
        map.remove(); // Remove previous map instance
    }

    if (cityCoords.length === 2) {
        // Initialize the map
        map = L.map('mapContainer').setView([latitude, longitude], 13);

        // Load and display tile layer on the map (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
}
