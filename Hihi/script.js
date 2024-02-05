let hasBeenPressed = false;

document.getElementById('yesButton').addEventListener('click', () => startMoving());
document.getElementById('noButton').addEventListener('click', () => startMoving());

function startMoving() {
    if (!hasBeenPressed) {
        hasBeenPressed = true;
        moveButton('yesButton');
        moveButton('noButton');
    }
}

function moveButton(buttonId) {
    if (!hasBeenPressed) return;

    const button = document.getElementById(buttonId);
    const newX = Math.random() * (window.innerWidth - button.offsetWidth);
    const newY = Math.random() * (window.innerHeight - button.offsetHeight);

    button.style.position = 'fixed';
    button.style.left = `${newX}px`;
    button.style.top = `${newY}px`;

    setTimeout(() => moveButton(buttonId), 50); // Move the button every 50 milliseconds
}
