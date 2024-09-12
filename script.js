let liftState = [];
let liftRequests = [];
let liftBusy = [];
let requestedFloors = new Set();
let liftMoving = [];
let doorsOpening = [];

document.getElementById('generate').addEventListener('click', generateBuilding);
document.getElementById('back-btn').addEventListener('click', showForm);

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
    liftRequests = Array.from({ length: liftsCount }, () => []);
    liftMoving = Array(liftsCount).fill(false);
    doorsOpening = Array(liftsCount).fill(false);
    requestedFloors.clear();

    for (let i = 1; i <= floorsCount; i++) {
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

        floor.appendChild(floorButtons);
        building.appendChild(floor);
    }

    for (let i = 0; i < liftsCount; i++) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.dataset.lift = i;
        lift.style.transform = 'translateY(0px)';
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

function requestLift(floor, direction, button) {
    disableButton(button);

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

        // Only consider lifts that are not moving or moving in the right direction
        if (!liftMoving[liftIndex] || (direction === 'up' && currentFloor < floor) || (direction === 'down' && currentFloor > floor)) {
            if (distance < minDistance) {
                closestLift = lift;
                minDistance = distance;
            }
        }
    });

    // If no lift is moving in the right direction, fallback to any available lift
    if (!closestLift) {
        lifts.forEach(lift => {
            const liftIndex = parseInt(lift.dataset.lift);
            const currentFloor = liftState[liftIndex];
            const distance = Math.abs(currentFloor - floor);

            if (!liftMoving[liftIndex]) {
                if (distance < minDistance) {
                    closestLift = lift;
                    minDistance = distance;
                }
            }
        });
    }

    if (closestLift) {
        const liftIndex = parseInt(closestLift.dataset.lift);
        liftRequests[liftIndex].push({ floor, direction, button });
        if (!liftBusy[liftIndex] && !liftMoving[liftIndex]) {
            moveLiftToNextFloor(liftIndex);
        }
    }
}

function moveLiftToNextFloor(liftIndex) {
    if (liftRequests[liftIndex].length === 0) {
        liftBusy[liftIndex] = false;
        liftMoving[liftIndex] = false;
        return;
    }

    liftBusy[liftIndex] = true;
    liftMoving[liftIndex] = true;
    const { floor, direction, button } = liftRequests[liftIndex].shift();
    const lifts = document.querySelectorAll('.lift');
    const lift = lifts[liftIndex];
    const targetY = -(floor - 1) * 112;

    const currentFloor = liftState[liftIndex];
    const floorsToMove = Math.abs(currentFloor - floor);
    const moveTime = floorsToMove * 2000; // 2 seconds per floor

    setTimeout(() => {
        lift.style.transition = `transform ${moveTime}ms linear`; // Changed to 'linear' for consistent speed
        lift.style.transform = `translateY(${targetY}px)`;
        liftState[liftIndex] = floor;

        setTimeout(() => {
            liftMoving[liftIndex] = false;
            openDoors(lift, liftIndex, floor, button, direction);
        }, moveTime);
    }, 1000);
}

function openDoors(lift, liftIndex, targetFloor, button, direction) {
    if (!doorsOpening[liftIndex]) {
        doorsOpening[liftIndex] = true;
        if (!lift.classList.contains('door-open')) {
            lift.classList.add('door-open');

            setTimeout(() => {
                closeDoors(lift, liftIndex, targetFloor, button, direction);
                requestedFloors.delete(targetFloor);
            }, 2500);
        } else {
            setTimeout(() => {
                closeDoors(lift, liftIndex, targetFloor, button, direction);
                requestedFloors.delete(targetFloor);
            }, 2500);
        }
    }
}

function closeDoors(lift, liftIndex, targetFloor, button, direction) {
    if (lift.classList.contains('door-open')) {
        lift.classList.remove('door-open');
    }

    doorsOpening[liftIndex] = false;

    reactivateButtonsAtFloor(targetFloor);

    moveLiftToNextFloor(liftIndex);
}

function disableButton(button) {
    button.disabled = true;
    button.style.opacity = '0.5';
}

function enableButton(button) {
    button.disabled = false;
    button.style.opacity = '1';
}

function reactivateButtonsAtFloor(floor) {
    const buttons = document.querySelectorAll(`.floor[data-floor="${floor}"] .floor-buttons button`);
    buttons.forEach(button => enableButton(button));
}

function hideForm() {
    document.getElementById('control-panel').style.display = 'none';
    document.getElementById('back-btn').style.display = 'block';
}

function showForm() {
    document.getElementById('control-panel').style.display = 'block';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('building').innerHTML = '';
    document.getElementById('floors').value = '';
    document.getElementById('lifts').value = '';
}