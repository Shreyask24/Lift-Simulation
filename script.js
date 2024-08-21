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

    for (let i = 0; i < liftsCount; i++) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.dataset.lift = i;
        lift.style.transform = `translateY(0px)`;
        lift.style.left = `${(i * 70) + 100}px`;
        building.firstChild.appendChild(lift);
    }
}

function requestLift(floor) {
    if (requestedFloors.has(floor)) {
        return; // Ignore multiple requests for the same floor
    }

    requestedFloors.add(floor); // Mark the floor as requested
    pendingRequests.push(floor);
    processNextRequest();
}

function processNextRequest() {
    if (pendingRequests.length === 0) return;

    const floor = pendingRequests.shift(); // Take the next floor from the queue
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
        closeDoors(closestLift, () => moveLift(closestLift, liftIndex, floor, targetY)); // Close doors before moving
    } else {
        pendingRequests.push(floor); // Re-add the request if no lift is available
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

    lift.addEventListener('transitionend', () => {
        openDoors(lift);
    }, { once: true });
}

function openDoors(lift) {
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        setTimeout(() => {
            lift.classList.remove('door-open');
            const liftIndex = parseInt(lift.dataset.lift);
            liftBusy[liftIndex] = false;
            requestedFloors.delete(liftState[liftIndex]); // Clear the floor request after servicing
            setTimeout(processNextRequest, 2500); // 2.5s to close doors and process next
        }, 2500); // Doors stay open for 2.5 seconds
    }
}

function closeDoors(lift, callback) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }
    setTimeout(callback, 1000); // Ensure doors are closed before moving
}
