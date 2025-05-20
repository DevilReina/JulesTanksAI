document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Ensure Tank class is available (it should be, due to script order)
    if (typeof Tank === 'undefined') {
        console.error('Tank class not found. Make sure tank.js is loaded before game.js');
        return;
    }

    // World Dimensions
    const WORLD_WIDTH = 1600;
    const WORLD_HEIGHT = 1200;
    canvas.width = WORLD_WIDTH; // Set canvas size to match world
    canvas.height = WORLD_HEIGHT; // Set canvas size to match world

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

    // AI Tanks Array
    let aiTanks = [];

    // Ensure AITank class is available
    if (typeof AITank === 'undefined') {
        console.error('AITank class not found. Make sure aiTank.js is loaded before game.js.');
        return;
    }

    // Create AI Tank Instances
    const aiTank1 = new AITank(150, 150, 'purple', 2, 1, WORLD_WIDTH, WORLD_HEIGHT);
    const aiTank2 = new AITank(WORLD_WIDTH - 150, WORLD_HEIGHT - 150, 'darkgreen', 2, 1, WORLD_WIDTH, WORLD_HEIGHT); // Changed color
    aiTanks.push(aiTank1, aiTank2);


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

        // Implement Boundary Checks / Player Death by Boundary
        if (playerTank.x - playerTank.size < 0 || 
            playerTank.x + playerTank.size > WORLD_WIDTH ||
            playerTank.y - playerTank.size < 0 ||
            playerTank.y + playerTank.size > WORLD_HEIGHT) {
            
            playerTank.reset(); // Reset stats first
            const respawnPoint = findSafestRespawnPoint(aiTanks, WORLD_WIDTH, WORLD_HEIGHT);
            playerTank.x = respawnPoint.x;
            playerTank.y = respawnPoint.y;
            // Optionally, clear projectiles or other game elements associated with the player
            // projectiles = []; // Example: Clears all projectiles on death
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

        // Display Player Level
        ctx.fillStyle = 'white'; // Or 'black' if background is light
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Level: ${playerTank.level}`, 30, 30);

        // Draw Upgrades
        upgrades.forEach(upgrade => {
            upgrade.draw(ctx);
        });

        // Update and Draw Projectiles & Collision Detection
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.updatePosition();
            p.draw(ctx);

            // Player Collision
            if (p.color === 'orange' && checkCollision(p, playerTank)) { // AI projectile hitting player
                playerTank.takeDamage(p.damage);
                projectiles.splice(i, 1); // Remove projectile
                if (playerTank.hp <= 0) { // playerTank.reset() is called internally by takeDamage
                    const respawnPoint = findSafestRespawnPoint(aiTanks, WORLD_WIDTH, WORLD_HEIGHT);
                    playerTank.x = respawnPoint.x;
                    playerTank.y = respawnPoint.y;
                }
                continue; // Next projectile
            }

            // AI Tank Collision
            for (let j = aiTanks.length - 1; j >= 0; j--) {
                const ai = aiTanks[j];
                if (p.color === 'red' && checkCollision(p, ai)) { // Player projectile hitting AI
                    ai.takeDamage(p.damage);
                    projectiles.splice(i, 1); // Remove projectile
                    // AI's own reset method (including repositioning) is called internally by takeDamage
                    // if ai.hp <= 0.
                    break; // Projectile is gone, stop checking against other AIs
                }
            }
            
            // Remove Off-screen Projectiles (if not already removed by collision)
            // Need to check if projectiles[i] still exists because it might have been spliced
            if (projectiles[i] && (p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > WORLD_HEIGHT)) {
                projectiles.splice(i, 1);
            }
        }

        // Draw the player tank
        playerTank.draw(ctx);

        // Draw AI Tanks and Apply Boundary Clamping
        aiTanks.forEach(aiTank => {
            aiTank.updateAI(playerTank, upgrades, aiTanks, projectiles, WORLD_WIDTH, WORLD_HEIGHT);

            // Boundary Checks for AI Tanks (Clamping) - applied after AI updates its position
            if (aiTank.x - aiTank.size < 0) {
                aiTank.x = aiTank.size;
            }
            if (aiTank.x + aiTank.size > WORLD_WIDTH) {
                aiTank.x = WORLD_WIDTH - aiTank.size;
            }
            if (aiTank.y - aiTank.size < 0) {
                aiTank.y = aiTank.size;
            }
            if (aiTank.y + aiTank.size > WORLD_HEIGHT) {
                aiTank.y = WORLD_HEIGHT - aiTank.size;
            }

            aiTank.draw(ctx); // Draws AI tank and its health bar
        });

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    gameLoop();

    // Helper function to find the safest respawn point
    function findSafestRespawnPoint(aiTanksArray, worldWidth, worldHeight) {
        const padding = 50;
        let candidatePoints = [
            // Corners
            { x: padding, y: padding },
            { x: worldWidth - padding, y: padding },
            { x: padding, y: worldHeight - padding },
            { x: worldWidth - padding, y: worldHeight - padding },
            // Midpoints of edges
            { x: worldWidth / 2, y: padding },
            { x: worldWidth - padding, y: worldHeight / 2 },
            { x: worldWidth / 2, y: worldHeight - padding },
            { x: padding, y: worldHeight / 2 },
        ];

        // Add some random points
        for (let i = 0; i < 8; i++) { // Adding 8 random points
            candidatePoints.push({
                x: Math.random() * (worldWidth - 2 * padding) + padding,
                y: Math.random() * (worldHeight - 2 * padding) + padding,
            });
        }

        let bestPoint = null;
        let maxMinDistance = 0;

        if (!aiTanksArray || aiTanksArray.length === 0) {
            return { x: worldWidth / 2, y: worldHeight / 2 }; // Default to center if no AIs
        }

        candidatePoints.forEach(point => {
            let minDistanceToAnAI = Infinity;
            aiTanksArray.forEach(aiTank => {
                const dx = point.x - aiTank.x;
                const dy = point.y - aiTank.y;
                const distanceToThisAI = Math.sqrt(dx * dx + dy * dy);
                minDistanceToAnAI = Math.min(minDistanceToAnAI, distanceToThisAI);
            });

            if (minDistanceToAnAI > maxMinDistance) {
                maxMinDistance = minDistanceToAnAI;
                bestPoint = point;
            }
        });

        if (bestPoint) {
            return bestPoint;
        } else {
            // If all points are equally bad (e.g., an AI is on every point, highly unlikely)
            // or if somehow no bestPoint was selected, default to a random candidate or center.
            // For simplicity, defaulting to center here.
            return { x: worldWidth / 2, y: worldHeight / 2 };
        }
    }

    // Input for Shooting (Mouse Click)
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        playerTank.shoot(mouseX, mouseY, projectiles); // Pass projectiles array
    });
});
