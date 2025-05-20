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

    const playerTank = new Tank(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'blue', 3); // Size removed from constructor

    // Upgrades Array
    let upgrades = [];
    const MAX_UPGRADES = 10; // Example maximum
    const UPGRADE_SPAWN_INTERVAL = 3000; // 3 seconds

    // Ensure Upgrade class is available
    if (typeof Upgrade === 'undefined') {
        console.error('Upgrade class not found. Make sure upgrade.js is loaded before game.js');
        return;
    }

    // Ensure Projectile class is available (Tank creates them, game.js manages the array)
    if (typeof Projectile === 'undefined') {
        console.error('Projectile class not found. Make sure projectile.js is loaded before game.js.');
        // Note: tank.js also needs Projectile, so projectile.js should be included before tank.js in HTML
        return;
    }
    
    // Projectiles Array
    let projectiles = [];

    function spawnUpgrade() {
        if (upgrades.length >= MAX_UPGRADES) {
            return; // Don't spawn more if max is reached
        }

        const size = 7;
        const randomX = Math.random() * (WORLD_WIDTH - size * 2) + size; // Avoid edges
        const randomY = Math.random() * (WORLD_HEIGHT - size * 2) + size; // Avoid edges
        
        const colors = ['green', 'yellow', 'purple', 'orange', 'cyan'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // For now, only 'growth' type, can be expanded later
        const newUpgrade = new Upgrade(randomX, randomY, size, randomColor, 'growth');
        upgrades.push(newUpgrade);
    }

    // Initial spawning of upgrades
    for (let i = 0; i < 5; i++) {
        spawnUpgrade();
    }

    // Periodic spawning of upgrades
    setInterval(spawnUpgrade, UPGRADE_SPAWN_INTERVAL);

    // Collision Detection Function
    function checkCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.size + circle2.size;
    }

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

        // Upgrade Collection Logic
        for (let i = upgrades.length - 1; i >= 0; i--) {
            if (checkCollision(playerTank, upgrades[i])) {
                playerTank.collectUpgradeEffect(); // Call new method
                upgrades.splice(i, 1); // Remove collected upgrade
                // Optional: spawnUpgrade(); // To immediately replace
            }
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Upgrades
        upgrades.forEach(upgrade => {
            upgrade.draw(ctx);
        });

        // Update and Draw Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.updatePosition();
            p.draw(ctx);

            // Remove Off-screen Projectiles
            if (p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > WORLD_HEIGHT) {
                projectiles.splice(i, 1);
            }
        }

        // Draw the player tank
        playerTank.draw(ctx);

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    gameLoop();

    // Input for Shooting (Mouse Click)
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        playerTank.shoot(mouseX, mouseY, projectiles); // Pass projectiles array
    });
});
