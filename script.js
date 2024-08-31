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
    liftState = Array(liftsCount).fill(1);
    liftBusy = Array(liftsCount).fill(false);
    liftRequests = Array.from({ length: liftsCount }, () => []);
    requestedFloors.clear();

    // Create floors
    for (let i = 1; i <= floorsCount; i++) { // Start from bottom floor upwards
        const floor = document.createElement('div');
        floor.className = 'floor';
        floor.dataset.floor = i;

        const floorButtons = document.createElement('div');
        floorButtons.className = 'floor-buttons';

        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-label';

        if (i === 1) {
            floorLabel.innerText = 'Ground Floor';
        } else {
            floorLabel.innerText = `Floor ${i - 1}`;
        }

        floor.appendChild(floorLabel);

        if (i !== floorsCount) {
            const downButton = document.createElement('button');
            downButton.className = 'up';
            downButton.innerText = 'Up';
            downButton.onclick = () => requestLift(i);
            floorButtons.appendChild(downButton);
        }

        if (i !== 1) {
            const upButton = document.createElement('button');
            upButton.className = 'down';
            upButton.innerText = 'Down';
            upButton.onclick = () => requestLift(i);
            floorButtons.appendChild(upButton);
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

function requestLift(floor) {
    if (requestedFloors.has(floor)) {
        return;
    }

    requestedFloors.add(floor);

    const lifts = document.querySelectorAll('.lift');
    let closestLift = null;
    let minDistance = Infinity;

    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        if (distance < minDistance) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        liftRequests[liftIndex].push(floor);
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
            requestedFloors.delete(targetFloor);
        }, 2500);
    }
}

function closeDoors(lift, liftIndex) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    moveLiftToNextFloor(liftIndex);
}