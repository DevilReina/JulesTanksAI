document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Ensure Tank class is available (it should be, due to script order)
    if (typeof Tank === 'undefined') {
        console.error('Tank class not found. Make sure tank.js is loaded before game.js');
        return;
    }

    // World Dimensions (using canvas dimensions)
    const WORLD_WIDTH = canvas.width;
    const WORLD_HEIGHT = canvas.height;

    const playerTank = new Tank(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 20, 'blue', 3); // Centered, speed 3

    // Keyboard Input Handling
    const keysPressed = {};
    window.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
    });
    window.addEventListener('keyup', (event) => {
        keysPressed[event.key] = false;
    });

    function gameLoop() {
        // Calculate dx, dy based on pressed keys
        let dx = 0;
        let dy = 0;

        if (keysPressed['ArrowUp'] || keysPressed['w']) {
            dy -= playerTank.speed;
        }
        if (keysPressed['ArrowDown'] || keysPressed['s']) {
            dy += playerTank.speed;
        }
        if (keysPressed['ArrowLeft'] || keysPressed['a']) {
            dx -= playerTank.speed;
        }
        if (keysPressed['ArrowRight'] || keysPressed['d']) {
            dx += playerTank.speed;
        }

        // Update tank position
        playerTank.updatePosition(dx, dy);

        // Implement Boundary Checks
        // Left boundary
        if (playerTank.x - playerTank.size < 0) {
            playerTank.x = playerTank.size;
        }
        // Right boundary
        if (playerTank.x + playerTank.size > WORLD_WIDTH) {
            playerTank.x = WORLD_WIDTH - playerTank.size;
        }
        // Top boundary
        if (playerTank.y - playerTank.size < 0) {
            playerTank.y = playerTank.size;
        }
        // Bottom boundary
        if (playerTank.y + playerTank.size > WORLD_HEIGHT) {
            playerTank.y = WORLD_HEIGHT - playerTank.size;
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the player tank
        playerTank.draw(ctx);

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    gameLoop();
});
