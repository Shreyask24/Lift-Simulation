document.getElementById('generate').addEventListener('click', generateBuilding);
document.getElementById('back-btn').addEventListener('click', showForm); // Add this event listener for the back button

let liftState = [];
let pendingRequests = { up: [], down: [] };
let liftBusy = [];
let requestedFloors = { up: new Set(), down: new Set() };

function generateBuilding() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.remove();
    }

    const floorsCount = parseInt(document.getElementById('floors').value);
    const liftsCount = parseInt(document.getElementById('lifts').value);

    if (isNaN(floorsCount) || isNaN(liftsCount) || floorsCount < 1 || liftsCount < 1 || floorsCount === 1) {
        displayError('Please enter valid positive numbers above one for floors and lifts.');
        return;
    }

    hideForm();

    const building = document.getElementById('building');
    building.innerHTML = '';

    liftState = Array(liftsCount).fill(1);
    liftBusy = Array(liftsCount).fill(false);
    requestedFloors = { up: new Set(), down: new Set() };

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
            upButton.onclick = () => requestLift(i, 'up');
            floorButtons.appendChild(upButton);
        }

        if (i !== 1) {
            const downButton = document.createElement('button');
            downButton.className = 'down';
            downButton.innerText = 'Down';
            downButton.onclick = () => requestLift(i, 'down');
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

function requestLift(floor, direction) {
    if (requestedFloors[direction].has(floor)) {
        return;
    }

    requestedFloors[direction].add(floor);
    pendingRequests[direction].push(floor);
    processNextRequest(direction);
}

function processNextRequest(direction) {
    if (pendingRequests[direction].length === 0) return;

    const floor = pendingRequests[direction].shift();
    const lifts = document.querySelectorAll('.lift');
    const targetY = -(floor - 1) * 160;
    let closestLift = null;
    let minDistance = Infinity;

    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];
        const isBusy = liftBusy[liftIndex];
        const distance = Math.abs(currentFloor - floor);

        if (distance < minDistance && !isBusy) {
            closestLift = lift;
            minDistance = distance;
        }
    });

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        liftBusy[liftIndex] = true;
        closeDoorsAndMove(closestLift, liftIndex, floor, targetY, direction);
    } else {
        pendingRequests[direction].push(floor);
        setTimeout(() => processNextRequest(direction), 1000);
    }
}

function closeDoorsAndMove(lift, liftIndex, targetFloor, targetY, direction) {
    // Ensure doors are closed before moving
    if (lift.classList.contains('door-open')) {
        closeDoors(lift, liftIndex, () => moveLift(lift, liftIndex, targetFloor, targetY, direction));
    } else {
        // Move directly if doors are already closed
        moveLift(lift, liftIndex, targetFloor, targetY, direction);
    }
}

function moveLift(lift, liftIndex, targetFloor, targetY, direction) {
    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - targetFloor);
    const moveTime = floorsToMove * 2000;

    lift.style.transition = `transform ${moveTime}ms linear`;
    lift.style.transform = `translateY(${targetY}px)`;
    liftState[liftIndex] = targetFloor;

    setTimeout(() => {
        openDoors(lift, liftIndex, targetFloor, direction);
    }, moveTime);
}

function openDoors(lift, liftIndex, targetFloor, direction) {
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        setTimeout(() => {
            requestedFloors[direction].delete(targetFloor);
            closeDoors(lift, liftIndex);
        }, 2500); // Doors stay open for 2.5 seconds
    }
}

function closeDoors(lift, liftIndex, callback = null) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    setTimeout(() => {
        liftBusy[liftIndex] = false;
        if (callback) callback(); // Move lift after doors close
        setTimeout(() => processNextRequest('up'), 500);
        setTimeout(() => processNextRequest('down'), 500);
    }, 2500); // Close doors after 2.5 seconds
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