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

    liftState = Array(liftsCount).fill(1); // All lifts start at the ground floor (floor 1)
    liftBusy = Array(liftsCount).fill(false); // Lifts are initially not busy
    requestedFloors.clear(); // Reset any previously requested floors

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
    const targetY = -(floor - 1) * 112; // Calculate the Y-position to move the lift to
    let closestLift = null;
    let minDistance = Infinity;

    // Find the closest available lift
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
        liftBusy[liftIndex] = true; // Mark the lift as busy
        moveLift(closestLift, liftIndex, floor, targetY); // Move lift directly to the target floor
    } else {
        pendingRequests.push(floor); // Re-add the request if no lift is available
        setTimeout(processNextRequest, 1000);
    }
}

function moveLift(lift, liftIndex, targetFloor, targetY) {
    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - targetFloor);
    const moveTime = floorsToMove * 2000; // Time to move between floors (2 seconds per floor)

    lift.style.transition = `transform ${moveTime}ms ease`;
    lift.style.transform = `translateY(${targetY}px)`; // Move lift to the new floor
    liftState[liftIndex] = targetFloor; // Update the lift's current floor

    // Ensure that doors remain closed while the lift is moving
    setTimeout(() => {
        openDoors(lift, liftIndex, targetFloor); // Open doors only when the lift reaches the target floor
    }, moveTime); // Execute this after the lift has completed its movement
}

function openDoors(lift, liftIndex, targetFloor) {
    // Open the doors only if they aren't already open
    if (!lift.classList.contains('door-open')) {
        lift.classList.add('door-open');

        // Keep doors open for 2.5 seconds
        setTimeout(() => {
            closeDoors(lift, liftIndex); // Close doors after 2.5 seconds
            requestedFloors.delete(targetFloor); // Remove the floor from the requested set
        }, 2500);
    }
}

function closeDoors(lift, liftIndex) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open'); // Close the doors
    }

    liftBusy[liftIndex] = false; // Mark the lift as not busy anymore
    setTimeout(processNextRequest, 500); // Process the next request after a short delay
}
