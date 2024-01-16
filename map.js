function showCity() {
    var city = document.getElementById("citySelector").value;
    var mapContainer = document.getElementById("mapContainer");

    mapContainer.innerHTML = ""; // Clear previous city

    if (city) {
        var cityElement = document.createElement("div");
        cityElement.innerText = "Displaying map for: " + city.charAt(0).toUpperCase() + city.slice(1);
        cityElement.style.position = "absolute";
        cityElement.style.top = "50%";
        cityElement.style.left = "50%";
        cityElement.style.transform = "translate(-50%, -50%)";
        cityElement.style.fontSize = "24px";

        mapContainer.appendChild(cityElement);
    }
}
