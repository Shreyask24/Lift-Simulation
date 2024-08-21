document.getElementById('generate').addEventListener('click', generateBuilding);

let liftState = [];
let pendingRequests = [];
let liftBusy = [];
let requestedFloors = new Set();

function generateBuilding() {
    const floorsCount = parseInt(document.getElementById('floors').value);
    const liftsCount = parseInt(document.getElementById('lifts').value);

    const building = document.getElementById('building');
    building.innerHTML = '';

    liftState = Array(liftsCount).fill(1);
    liftBusy = Array(liftsCount).fill(false);
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
        lift.style.left = `${(i * 70) + 100}px`; // Position lifts next to each other
        building.firstChild.appendChild(lift);
    }
}

function requestLift(floor) {
    if (requestedFloors.has(floor)) {
        return;
    }

    requestedFloors.add(floor); // Mark the floor as requested
    pendingRequests.push(floor);
    processNextRequest();
}

function processNextRequest() {
    if (pendingRequests.length === 0) return;

    const floor = pendingRequests.shift();
    const lifts = document.querySelectorAll('.lift');
    const targetY = -(floor - 1) * 112;
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
        moveLift(closestLift, liftIndex, floor, targetY);
    } else {
        pendingRequests.push(floor);
        setTimeout(processNextRequest, 1000);
    }
}

function moveLift(lift, liftIndex, targetFloor, targetY) {
    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - targetFloor);
    const moveTime = floorsToMove * 2000;

    lift.style.transition = `transform ${moveTime}ms ease`;
    lift.style.transform = `translateY(${targetY}px)`;
    liftState[liftIndex] = targetFloor;

    setTimeout(() => {
        openDoors(lift, liftIndex, targetFloor);
    }, moveTime);
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

    liftBusy[liftIndex] = false;
    setTimeout(processNextRequest, 500);
}
