document.getElementById('generate').addEventListener('click', generateBuilding);
document.getElementById('back-btn').addEventListener('click', showForm);

let liftState = [];
let liftRequests = [];
let liftBusy = [];
let requestedFloorsUp = new Set();
let requestedFloorsDown = new Set();

function generateBuilding() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.remove();
    }

    const floorsCount = parseInt(document.getElementById('floors').value);
    const liftsCount = parseInt(document.getElementById('lifts').value);

    // Input validation
    if (isNaN(floorsCount) || isNaN(liftsCount) || floorsCount < 1 || liftsCount < 1 || floorsCount === 1) {
        displayError('Please enter valid positive numbers above one for floors and lifts.');
        return;
    }

    hideForm();

    const building = document.getElementById('building');
    building.innerHTML = '';

    // Initialize state for lifts
    liftState = Array(liftsCount).fill(1);
    liftBusy = Array(liftsCount).fill(false);
    liftRequests = Array.from({ length: liftsCount }, () => []);
    requestedFloorsUp.clear();
    requestedFloorsDown.clear();

    for (let i = 1; i <= floorsCount; i++) {
        const floor = document.createElement('div');
        floor.className = 'floor';
        floor.dataset.floor = i;

        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-label';

        if (i === 1) {
            floorLabel.innerText = 'Ground Floor';
        } else {
            floorLabel.innerText = `Floor ${i - 1}`;
        }

        const floorButtons = document.createElement('div');
        floorButtons.className = 'floor-buttons';

        if (i !== floorsCount) {
            const upButton = document.createElement('button');
            upButton.className = 'up';
            upButton.innerText = 'Up';
            upButton.onclick = (e) => requestLift(i, 'up', e.target);
            floorButtons.appendChild(upButton);
        }

        if (i !== 1) {
            const downButton = document.createElement('button');
            downButton.className = 'down';
            downButton.innerText = 'Down';
            downButton.onclick = (e) => requestLift(i, 'down', e.target);
            floorButtons.appendChild(downButton);
        }

        floorLabel.appendChild(floorButtons);

        floor.appendChild(floorLabel);
        building.appendChild(floor);
    }

    // Create lifts
    for (let i = 0; i < liftsCount; i++) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.dataset.lift = i;
        lift.style.transform = `translateY(0px)`;
        lift.style.left = `${(i * 70) + 100}px`;
        building.firstChild.appendChild(lift); // Add lifts to the bottom floor
    }
}

function displayError(message) {
    const controlPanel = document.getElementById('control-panel');
    const errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.color = 'red';
    errorMessage.style.marginTop = '10px';
    errorMessage.innerText = message;
    controlPanel.appendChild(errorMessage);
}

function requestLift(floor, direction, button) {
    // Disable the button and reduce opacity
    button.disabled = true;
    button.style.opacity = '0.5'; // Reduced opacity to indicate disabled state

    let requestSet = direction === 'up' ? requestedFloorsUp : requestedFloorsDown;

    if (requestSet.has(floor)) {
        return;
    }

    requestSet.add(floor);

    const lifts = document.querySelectorAll('.lift');
    let closestLift = null;
    let minDistance = Infinity;

    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        if (distance < minDistance && !liftBusy[liftIndex]) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        liftRequests[liftIndex].push({ floor, direction, button });
        if (!liftBusy[liftIndex]) {
            moveLiftToNextFloor(liftIndex);
        }
    }
}

function moveLiftToNextFloor(liftIndex) {
    if (liftRequests[liftIndex].length === 0) {
        liftBusy[liftIndex] = false;
        return;
    }

    liftBusy[liftIndex] = true;
    const { floor, direction, button } = liftRequests[liftIndex].shift();
    const lifts = document.querySelectorAll('.lift');
    const lift = lifts[liftIndex];
    const targetY = -(floor - 1) * 160;

    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - floor);
    const moveTime = floorsToMove * 2000; // 2 seconds per floor

    setTimeout(() => {
        lift.style.transition = `transform ${moveTime}ms linear`;
        lift.style.transform = `translateY(${targetY}px)`;
        liftState[liftIndex] = floor;

        setTimeout(() => {
            openDoors(lift, liftIndex, floor, button, direction);
        }, moveTime);
    }, 2000);
}

function openDoors(lift, liftIndex, targetFloor, button, direction) {
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        setTimeout(() => {
            closeDoors(lift, liftIndex, targetFloor, button, direction);
            if (direction === 'up') {
                requestedFloorsUp.delete(targetFloor);
            } else {
                requestedFloorsDown.delete(targetFloor);
            }
        }, 3000);
    }
}

function closeDoors(lift, liftIndex, targetFloor, button, direction) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    // Re-enable both buttons and restore opacity after the lift arrives
    const floorDiv = document.querySelector(`.floor[data-floor="${targetFloor}"]`);
    const upButton = floorDiv.querySelector('.up');
    const downButton = floorDiv.querySelector('.down');

    if (upButton) {
        upButton.disabled = false;
        upButton.style.opacity = '1';
    }

    if (downButton) {
        downButton.disabled = false;
        downButton.style.opacity = '1';
    }

    moveLiftToNextFloor(liftIndex);
}

// Hide form and show back button
function hideForm() {
    document.getElementById('control-panel').style.display = 'none';
    document.getElementById('back-btn').style.display = 'block';
}

// Show form and reset building
function showForm() {
    document.getElementById('control-panel').style.display = 'block';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('building').innerHTML = '';
    document.getElementById('floors').value = '';
    document.getElementById('lifts').value = '';
}