let hasTriedToPress = false;

document.getElementById('yesButton').addEventListener('touchstart', startMoving);
document.getElementById('noButton').addEventListener('touchstart', startMoving);

function startMoving(event) {
    if (!hasTriedToPress) {
        hasTriedToPress = true;
        moveButton(event);
    }
}

function moveButton(event) {
    if (!hasTriedToPress) return;

    const button = event.target;
    const newX = Math.random() * (window.innerWidth - button.offsetWidth);
    const newY = Math.random() * (window.innerHeight - button.offsetHeight);

    button.style.position = 'fixed'; // Changed from 'absolute' to 'fixed' for better positioning on mobile
    button.style.left = `${newX}px`;
    button.style.top = `${newY}px`;
}
