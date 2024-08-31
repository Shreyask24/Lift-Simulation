document.getElementById('generate').addEventListener('click', generateBuilding);

let liftState = [];
let liftRequests = [];
let liftBusy = [];
let requestedFloors = new Set();

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

    const building = document.getElementById('building');
    building.innerHTML = '';

    // Initialize state for lifts
    liftState = Array(liftsCount).fill(1); // Tracks the current floor of each lift
    liftBusy = Array(liftsCount).fill(false); // Tracks if a lift is busy or not
    liftRequests = Array.from({ length: liftsCount }, () => []); // Tracks the requests assigned to each lift
    requestedFloors.clear();

    // Create floors
    for (let i = 1; i <= floorsCount; i++) {
        const floor = document.createElement('div');
        floor.className = 'floor';
        floor.dataset.floor = i;

        const floorButtons = document.createElement('div');
        floorButtons.className = 'floor-buttons';

        if (i !== floorsCount) {
            const upButton = document.createElement('button');
            upButton.className = 'up';
            upButton.innerText = 'Up';
            upButton.onclick = () => requestLift(i);
            floorButtons.appendChild(upButton);
        }

        if (i !== 1) {
            const downButton = document.createElement('button');
            downButton.className = 'down';
            downButton.innerText = 'Down';
            downButton.onclick = () => requestLift(i);
            floorButtons.appendChild(downButton);
        }

        floor.appendChild(floorButtons);
        building.appendChild(floor);
    }

    // Create lifts
    for (let i = 0; i < liftsCount; i++) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.dataset.lift = i;
        lift.style.transform = `translateY(0px)`;
        lift.style.left = `${(i * 70) + 100}px`;
        building.firstChild.appendChild(lift);
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

function requestLift(floor) {
    if (requestedFloors.has(floor)) {
        return; // Ignore if the floor has already been requested
    }

    requestedFloors.add(floor);

    const lifts = document.querySelectorAll('.lift');
    let closestLift = null;
    let minDistance = Infinity;

    // Find the closest lift (busy or not)
    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        // Pick the closest lift regardless of its current state
        if (distance < minDistance) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        // Assign this request to the closest lift, even if it's busy
        liftRequests[liftIndex].push(floor);
        if (!liftBusy[liftIndex]) {
            moveLiftToNextFloor(liftIndex); // Start moving the lift if it's idle
        }
    }
}

function moveLiftToNextFloor(liftIndex) {
    if (liftRequests[liftIndex].length === 0) {
        liftBusy[liftIndex] = false;
        return;
    }

    liftBusy[liftIndex] = true; // Mark the lift as busy
    const nextFloor = liftRequests[liftIndex].shift();
    const lifts = document.querySelectorAll('.lift');
    const lift = lifts[liftIndex];
    const targetY = -(nextFloor - 1) * 112;

    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - nextFloor);
    const moveTime = floorsToMove * 2000; // 2 seconds per floor

    setTimeout(() => {
        lift.style.transition = `transform ${moveTime}ms ease`;
        lift.style.transform = `translateY(${targetY}px)`;
        liftState[liftIndex] = nextFloor;

        setTimeout(() => {
            openDoors(lift, liftIndex, nextFloor);
        }, moveTime);
    }, 1000);
}

function openDoors(lift, liftIndex, targetFloor) {
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        setTimeout(() => {
            closeDoors(lift, liftIndex);
            requestedFloors.delete(targetFloor); // Mark this floor as served
        }, 2500);
    }
}

function closeDoors(lift, liftIndex) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    // Check if there are more requests to process
    moveLiftToNextFloor(liftIndex);
}