/**
 * ElevatorCanvas - A standalone canvas renderer for elevator simulations.
 *
 * Usage:
 *   import { ElevatorCanvas } from './elevatorcanvas.js';
 *
 *   const renderer = new ElevatorCanvas(document.getElementById('myCanvas'));
 *
 *   // Optional: pass DOM elements to display stats
 *   renderer.domStats = {
 *       timer: document.getElementById('timerDisplay'),
 *       waiting: document.getElementById('waitingDisplay'),
 *       transit: document.getElementById('transitDisplay')
 *   };
 *
 *   // Call render() each simulation step, passing your building object.
 *   // The building must have:
 *   //   .floors    - array of floor objects, each with:
 *   //                  .floorNumber, .upButtonPressed, .downButtonPressed,
 *   //                  .queue.people (array of {destinationFloor})
 *   //   .elevators - array of elevator objects, each with:
 *   //                  .currentFloor, .destinationFloor, .capacity,
 *   //                  .queue.people (array of {destinationFloor})
 *   renderer.render(building);
 */

class ElevatorCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.timer = 0;
    }

    // Color palette - Retro-futuristic control room
    colors = {
        bgDeep: '#0a0a0c',
        bgPanel: '#12131a',
        amber: '#ffb000',
        amberDim: '#b37a00',
        amberGlow: 'rgba(255, 176, 0, 0.3)',
        cyan: '#00ffd0',
        cyanDim: '#00a088',
        cyanGlow: 'rgba(0, 255, 208, 0.3)',
        red: '#ff3366',
        redGlow: 'rgba(255, 51, 102, 0.3)',
        gridLine: 'rgba(255, 176, 0, 0.06)',
        textDim: 'rgba(255, 255, 255, 0.35)',
        shaftBg: '#0d0e12'
    };

    render(building) {
        this.timer++;
        const ctx = this.ctx;
        const canvas = this.canvas;
        const c = this.colors;

        const numFloors = building.floors.length;
        const numElevators = building.elevators.length;

        // Layout calculations
        const padding = 25;
        const shaftWidth = 140;
        const shaftGap = 8;
        const totalShaftWidth = (shaftWidth * numElevators) + (shaftGap * (numElevators - 1)) + 60;
        const floorHeight = canvas.height / numFloors;
        const shaftStartX = canvas.width - totalShaftWidth - padding + 30;

        // Update DOM stats if available
        if (this.domStats) {
            let totalWaiting = 0;
            let totalInTransit = 0;
            for (let floor of building.floors) {
                totalWaiting += floor.queue.people.length;
            }
            for (let elev of building.elevators) {
                totalInTransit += elev.queue.people.length;
            }
            this.domStats.timer.textContent = String(this.timer).padStart(3, '0');
            this.domStats.waiting.textContent = totalWaiting;
            this.domStats.transit.textContent = totalInTransit;
        }

        // Clear canvas
        ctx.fillStyle = c.bgPanel;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid
        ctx.strokeStyle = c.gridLine;
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw building cross-section outline
        ctx.strokeStyle = c.amberDim;
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, 0, canvas.width - padding * 2, canvas.height);

        // Draw floor separators and floor areas
        for (let f = 0; f < numFloors; f++) {
            const y = canvas.height - (f + 1) * floorHeight;
            const floor = building.floors[f];

            // Floor separator line
            ctx.strokeStyle = c.amberDim;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, y + floorHeight);
            ctx.lineTo(canvas.width - padding, y + floorHeight);
            ctx.stroke();

            // Floor label - architectural style
            ctx.fillStyle = c.amber;
            ctx.font = '900 28px Orbitron, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${f}`, padding + 15, y + floorHeight - 20);

            // Floor sub-label
            ctx.fillStyle = c.textDim;
            ctx.font = '300 9px JetBrains Mono, monospace';
            ctx.fillText('LEVEL', padding + 15, y + floorHeight - 45);

            // Draw call buttons panel
            const btnPanelX = padding + 60;
            const btnPanelY = y + floorHeight / 2 - 25;

            // Button panel background
            ctx.fillStyle = 'rgba(255, 176, 0, 0.05)';
            ctx.fillRect(btnPanelX, btnPanelY, 32, 50);
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(btnPanelX, btnPanelY, 32, 50);

            // Up button
            if (f < numFloors - 1) {
                const upActive = floor.upButtonPressed;
                ctx.fillStyle = upActive ? c.cyan : 'rgba(0, 255, 208, 0.15)';
                ctx.beginPath();
                ctx.moveTo(btnPanelX + 16, btnPanelY + 8);
                ctx.lineTo(btnPanelX + 26, btnPanelY + 20);
                ctx.lineTo(btnPanelX + 6, btnPanelY + 20);
                ctx.closePath();
                ctx.fill();
                if (upActive) {
                    ctx.shadowColor = c.cyan;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Down button
            if (f > 0) {
                const downActive = floor.downButtonPressed;
                ctx.fillStyle = downActive ? c.red : 'rgba(255, 51, 102, 0.15)';
                ctx.beginPath();
                ctx.moveTo(btnPanelX + 16, btnPanelY + 42);
                ctx.lineTo(btnPanelX + 26, btnPanelY + 30);
                ctx.lineTo(btnPanelX + 6, btnPanelY + 30);
                ctx.closePath();
                ctx.fill();
                if (downActive) {
                    ctx.shadowColor = c.red;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Draw waiting area with people
            const people = floor.queue.people;
            const waitingStartX = padding + 110;
            const personSpacing = 38;
            const maxPerRow = Math.floor((shaftStartX - waitingStartX - 20) / personSpacing);

            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const row = Math.floor(idx / maxPerRow);
                const col = idx % maxPerRow;
                const px = waitingStartX + col * personSpacing;
                const py = y + 30 + row * 50;

                this.drawPerson(ctx, px, py, p.destinationFloor, p.destinationFloor > f);
            }
        }

        // Draw elevator shafts
        for (let i = 0; i < numElevators; i++) {
            const elevator = building.elevators[i];
            const shaftX = shaftStartX + i * (shaftWidth + shaftGap);

            // Shaft background
            ctx.fillStyle = c.shaftBg;
            ctx.fillRect(shaftX, 0, shaftWidth, canvas.height);

            // Shaft borders
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(shaftX, 0, shaftWidth, canvas.height);

            // Shaft label at top
            ctx.fillStyle = c.textDim;
            ctx.font = '500 10px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`SHAFT ${String.fromCharCode(65 + i)}`, shaftX + shaftWidth / 2, 15);

            // Draw guide rails
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.1)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(shaftX + 8, 0);
            ctx.lineTo(shaftX + 8, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(shaftX + shaftWidth - 8, 0);
            ctx.lineTo(shaftX + shaftWidth - 8, canvas.height);
            ctx.stroke();

            // Draw floor indicators in shaft
            for (let f = 0; f < numFloors; f++) {
                const indicatorY = canvas.height - (f + 1) * floorHeight + floorHeight - 5;
                ctx.fillStyle = elevator.currentFloor === f ? c.amber : 'rgba(255, 176, 0, 0.15)';
                ctx.font = '700 11px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(f.toString(), shaftX + shaftWidth / 2, indicatorY);
            }

            // Draw elevator car
            const carY = canvas.height - (elevator.currentFloor + 1) * floorHeight + 8;
            const carHeight = floorHeight - 16;
            const carX = shaftX + 12;
            const carWidth = shaftWidth - 24;

            // Car shadow/depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(carX + 4, carY + 4, carWidth, carHeight);

            // Determine elevator state and color
            const isMovingUp = elevator.destinationFloor > elevator.currentFloor;
            const isMovingDown = elevator.destinationFloor < elevator.currentFloor;
            const stateColor = isMovingUp ? c.cyan : isMovingDown ? c.red : c.amberDim;
            const stateGlow = isMovingUp ? c.cyanGlow : isMovingDown ? c.redGlow : c.amberGlow;

            // Car body with state-based border
            ctx.fillStyle = '#1a1b22';
            ctx.fillRect(carX, carY, carWidth, carHeight);

            // Car border glow
            ctx.strokeStyle = stateColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(carX, carY, carWidth, carHeight);

            // Add glow effect
            ctx.shadowColor = stateGlow;
            ctx.shadowBlur = 10;
            ctx.strokeRect(carX, carY, carWidth, carHeight);
            ctx.shadowBlur = 0;

            // Elevator doors (center split)
            const doorGap = 4;
            const doorWidth = (carWidth - doorGap) / 2 - 8;
            ctx.fillStyle = '#252730';
            ctx.fillRect(carX + 4, carY + 25, doorWidth, carHeight - 35);
            ctx.fillRect(carX + carWidth - doorWidth - 4, carY + 25, doorWidth, carHeight - 35);

            // Door frame
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(carX + 4, carY + 25, doorWidth, carHeight - 35);
            ctx.strokeRect(carX + carWidth - doorWidth - 4, carY + 25, doorWidth, carHeight - 35);

            // Floor display panel at top of car
            ctx.fillStyle = '#0a0a0c';
            ctx.fillRect(carX + carWidth / 2 - 20, carY + 4, 40, 18);
            ctx.strokeStyle = stateColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(carX + carWidth / 2 - 20, carY + 4, 40, 18);

            // Floor number display
            ctx.fillStyle = stateColor;
            ctx.font = '700 12px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(elevator.currentFloor.toString(), carX + carWidth / 2, carY + 17);

            // Direction arrow
            if (isMovingUp || isMovingDown) {
                ctx.fillStyle = stateColor;
                ctx.font = '14px Arial';
                ctx.fillText(isMovingUp ? '▲' : '▼', carX + carWidth / 2 + 25, carY + 16);
            }

            // Draw people in elevator
            const people = elevator.queue.people;
            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const px = carX + 25 + col * 45;
                const py = carY + 45 + row * 45;

                this.drawPerson(ctx, px, py, p.destinationFloor, p.destinationFloor > elevator.currentFloor, true);
            }

            // Capacity indicator
            ctx.fillStyle = c.textDim;
            ctx.font = '300 8px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${people.length}/${elevator.capacity}`, carX + carWidth / 2, carY + carHeight - 5);
        }

        // Draw corner brackets for architectural feel
        this.drawCornerBracket(ctx, padding - 5, -5, 20, c.amber);
        this.drawCornerBracket(ctx, canvas.width - padding + 5, -5, 20, c.amber, true, false);
        this.drawCornerBracket(ctx, padding - 5, canvas.height + 5, 20, c.amber, false, true);
        this.drawCornerBracket(ctx, canvas.width - padding + 5, canvas.height + 5, 20, c.amber, true, true);
    }

    drawPerson(ctx, x, y, destFloor, goingUp, inElevator = false) {
        const c = this.colors;
        const color = goingUp ? c.cyan : c.red;
        const glow = goingUp ? c.cyanGlow : c.redGlow;

        // Person body - geometric humanoid shape
        const size = inElevator ? 14 : 16;

        // Glow effect
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8;

        // Head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - size * 0.6, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Body (trapezoid)
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y);
        ctx.lineTo(x + size * 0.4, y);
        ctx.lineTo(x + size * 0.25, y + size * 0.7);
        ctx.lineTo(x - size * 0.25, y + size * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Destination badge
        ctx.fillStyle = c.bgDeep;
        ctx.beginPath();
        ctx.arc(x, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = `700 ${size * 0.45}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(destFloor.toString(), x, y + size * 0.25);
        ctx.textBaseline = 'alphabetic';
    }

    drawCornerBracket(ctx, x, y, size, color, flipX = false, flipY = false) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const dx = flipX ? -1 : 1;
        const dy = flipY ? -1 : 1;

        ctx.moveTo(x + size * dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + size * dy);

        ctx.stroke();
    }
}

export { ElevatorCanvas };
