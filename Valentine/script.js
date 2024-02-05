document.getElementById('yesButton').addEventListener('mouseover', moveButton);
document.getElementById('noButton').addEventListener('mouseover', moveButton);

function moveButton(event) {
    const button = event.target;
    const buttonRect = button.getBoundingClientRect();
    const newX = Math.random() * (window.innerWidth - buttonRect.width);
    const newY = Math.random() * (window.innerHeight - buttonRect.height);

    button.style.position = 'absolute';
    button.style.left = `${newX}px`;
    button.style.top = `${newY}px`;
}
