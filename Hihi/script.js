let noPressCount = 0;

document.getElementById('noButton').addEventListener('click', handleNoButtonPress);

document.getElementById('yesButton').addEventListener('click', handleYesButtonPress);

function handleYesButtonPress() {
    document.getElementById('yesImageContainer').style.display = 'block';
}


function handleNoButtonPress() {
    noPressCount++;
    adjustButtonSizesAndText();
}

function adjustButtonSizesAndText() {
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');

    // Adjust size of Yes button based on noPressCount
    if (noPressCount === 1) {
        yesButton.style.fontSize = '64px'; // Slightly larger for the first press
    } else if (noPressCount === 2) {
        yesButton.style.fontSize = '192px'; // Even larger for the second press
    } else if (noPressCount >= 3) {
        yesButton.style.fontSize = '350px'; // Largest size for three or more presses
    }

    // Decrease size of No button but not less than 12px
    noButton.style.fontSize = `${Math.max(16 - noPressCount, 12)}px`;

    // Change text of No button based on noPressCount
    if (noPressCount === 1) {
        noButton.textContent = 'Are you sure?';
    } else if (noPressCount === 2) {
        noButton.textContent = 'Are you sure?!?!';
    } else if (noPressCount >= 3) {
        noButton.textContent = 'WTF?!?!?!';
    }
}
