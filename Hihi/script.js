let hasTriedToPress = false;

document.getElementById('yesButton').addEventListener('touchstart', enhanceMovement);
document.getElementById('noButton').addEventListener('touchstart', enhanceMovement);

document.getElementById('yesButton').addEventListener('mouseover', moveButton);
document.getElementById('noButton').addEventListener('mouseover', moveButton);

function enhanceMovement() {
    if (!hasTriedToPress) {
        hasTriedToPress = true;
    }
}

function moveButton(event) {
    if (!hasTriedToPress) return;

    const button = event.target;
    const newX = Math.random() * (window.innerWidth - button.offsetWidth);
    const newY = Math.random() * (window.innerHeight - button.offsetHeight);

    button.style.position = 'absolute';
    button.style.left = `${newX}px`;
    button.style.top = `${newY}px`;
}
