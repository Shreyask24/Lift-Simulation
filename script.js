document.getElementById('generate').addEventListener('click', generateBuilding);

let liftState = [];
let pendingRequests = [];

function generateBuilding() {
    const floorsCount = parseInt(document.getElementById('floors').value);
    const liftsCount = parseInt(document.getElementById('lifts').value);

    const building = document.getElementById('building');
    building.innerHTML = ''; // Clear previous building layout

    liftState = Array(liftsCount).fill(1); // Initialize lifts to start at floor 1

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
    const lifts = document.querySelectorAll('.lift');
    let liftAlreadyOnFloor = null;

    // Check if any lift is already on the requested floor
    lifts.forEach(lift => {
        const liftIndex = parseInt(lift.dataset.lift);
        const currentFloor = liftState[liftIndex];

        if (currentFloor === floor) {
            liftAlreadyOnFloor = lift;
        }
    });

    // If there's a lift on the requested floor, just open the doors
    if (liftAlreadyOnFloor) {
        openDoors(liftAlreadyOnFloor);
    } else {
        pendingRequests.push(floor);
        processNextRequest(); // Start processing the next request in the queue
    }
}

function processNextRequest() {
    if (pendingRequests.length === 0) return; // If no pending requests, stop

    const floor = pendingRequests.shift(); // Get the next floor in the queue
    const lifts = document.querySelectorAll('.lift');
    const targetY = -(floor - 1) * 112;
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
        moveLift(closestLift, liftIndex, floor, targetY);
    }
}

function moveLift(lift, liftIndex, targetFloor, targetY) {
    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - targetFloor);
    const moveTime = floorsToMove * 2000; // 2 seconds per floor

    lift.style.transition = `transform ${moveTime}ms ease`;
    lift.style.transform = `translateY(${targetY}px)`;
    liftState[liftIndex] = targetFloor;

    lift.addEventListener('transitionend', () => {
        openDoors(lift);
    }, { once: true });
}

function openDoors(lift) {
    lift.classList.add('door-open');

    setTimeout(() => {
        lift.classList.remove('door-open');
        // Process the next floor call after the doors close
        setTimeout(processNextRequest, 2500); // Doors close after 2.5 seconds
    }, 2500); // Doors stay open for 2.5 seconds
}

generateBuilding();
