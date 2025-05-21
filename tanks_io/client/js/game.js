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

    // STANDARD_BASE_SPEED is defined in tank.js, ensure it's accessible or re-defined here if not.
    // Assuming tank.js is loaded first, STANDARD_BASE_SPEED should be globally available.
    const playerTank = new Tank(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'blue', STANDARD_BASE_SPEED); 

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

    // Damage Scaling Factor
    const DAMAGE_SCALE_EXP_FACTOR = 1.5;

    // Triple Shot Power-up Spawning Management
    let lastTripleShotSpawnTime = 0;
    const TRIPLE_SHOT_SPAWN_INTERVAL = 15000; // 15 seconds
    const MAX_TRIPLE_SHOT_ON_MAP = 1; // Limit to one triple shot power-up on map at a time

    // Camera Variables
    let cameraX = 0;
    let cameraY = 0;

    // Mouse Position (relative to canvas)
    let mousePos = { x: 0, y: 0 };

    // Ensure AITank class is available
    if (typeof AITank === 'undefined') {
        console.error('AITank class not found. Make sure aiTank.js is loaded before game.js.');
        return;
    }

    // Create AI Tank Instances
    // Assuming STANDARD_BASE_SPEED is globally available from tank.js
    const aiTank1 = new AITank(150, 150, 'purple', STANDARD_BASE_SPEED, 1, WORLD_WIDTH, WORLD_HEIGHT);
    const aiTank2 = new AITank(WORLD_WIDTH - 150, WORLD_HEIGHT - 150, 'darkgreen', STANDARD_BASE_SPEED, 1, WORLD_WIDTH, WORLD_HEIGHT);
    aiTanks.push(aiTank1, aiTank2);

    // Default size for general upgrades
    const GENERAL_UPGRADE_SIZE = 7;
    const GENERAL_UPGRADE_TYPE = 'growth';
    const GENERAL_UPGRADE_COLORS = ['green', 'yellow', 'purple', 'orange', 'cyan'];

    function spawnUpgrade(fixedX, fixedY, fixedColor = null, fixedType = GENERAL_UPGRADE_TYPE, fixedSize = GENERAL_UPGRADE_SIZE) {
        if (upgrades.length >= MAX_UPGRADES && !fixedColor) { // Allow specific drops even if general max is reached
            return; 
        }

        const x = (fixedX !== undefined && fixedX !== null) ? fixedX : Math.random() * (WORLD_WIDTH - fixedSize * 2) + fixedSize;
        const y = (fixedY !== undefined && fixedY !== null) ? fixedY : Math.random() * (WORLD_HEIGHT - fixedSize * 2) + fixedSize;
        
        const color = fixedColor ? fixedColor : GENERAL_UPGRADE_COLORS[Math.floor(Math.random() * GENERAL_UPGRADE_COLORS.length)];
        
        const type = fixedType;
        const size = fixedSize;
        
        const newUpgrade = new Upgrade(x, y, size, color, type);
        upgrades.push(newUpgrade);
    }

    // Initial spawning of upgrades
    for (let i = 0; i < 5; i++) {
        spawnUpgrade(); // Calls with no args for random general upgrades
    }

    // Periodic spawning of upgrades (general growth upgrades)
    setInterval(() => {
        // Only spawn general 'growth' upgrades if below MAX_UPGRADES
        if (upgrades.filter(upg => upg.type === GENERAL_UPGRADE_TYPE || upg.type === 'growth_plus').length < MAX_UPGRADES) {
             spawnUpgrade(); // Calls with no args for random general upgrades
        }
    }, UPGRADE_SPAWN_INTERVAL);


    // Function to spawn a cluster of upgrades from a defeated AI
    function spawnDroppedUpgrade(x, y, color) {
        const SPREAD_RADIUS = 20; // Max distance from center point
        const NUM_DROPS = 3;
        const DROP_TYPE = 'growth_plus'; // Custom type for AI drops
        const DROP_SIZE = 5;       // Custom size for AI drops

        for (let i = 0; i < NUM_DROPS; i++) {
            const offsetX = (Math.random() - 0.5) * 2 * SPREAD_RADIUS;
            const offsetY = (Math.random() - 0.5) * 2 * SPREAD_RADIUS;
            // Call the enhanced spawnUpgrade with specific parameters
            spawnUpgrade(x + offsetX, y + offsetY, color, DROP_TYPE, DROP_SIZE);
        }
    }
    window.spawnDroppedUpgrade = spawnDroppedUpgrade; // Make globally accessible for AITank.js

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

    // Additional keydown listener for non-movement actions like abilities
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') { // Changed from 'e' or 'E' to Spacebar
            playerTank.activateEscape();
        }
        // Add other ability keys here if needed
    });

    function gameLoop() {
        // Update player effects (like Emergency Escape duration)
        playerTank.updateEffects();

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

        // Update player's aim angle based on mouse position
        const worldMouseX = mousePos.x + cameraX;
        const worldMouseY = mousePos.y + cameraY;
        playerTank.aimAngle = Math.atan2(worldMouseY - playerTank.y, worldMouseX - playerTank.x);

        // Implement Boundary Checks / Player Death by Boundary
        // This logic ensures player dies and respawns upon hitting world edges.
        // Verified: The condition playerTank.y - playerTank.size < 0 correctly detects top boundary collision.
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

        // Tank vs. Tank Collision (Player vs. AI)
        for (let i = aiTanks.length - 1; i >= 0; i--) { // Iterate backwards if AIs can be removed (e.g. on death)
            const ai = aiTanks[i];
            if (!ai || ai.hp <= 0) continue; // Skip if AI is already dead or null

            if (checkCollision(playerTank, ai)) {
                const playerLevel = playerTank.level;
                const aiLevel = ai.level;
                let crushed = false;

                // Crushing Logic
                if (playerLevel >= aiLevel + 4) { // Player crushes AI
                    ai.takeDamage(ai.maxHp); // AI is crushed
                    crushed = true;
                    // ai.reset() will be called by takeDamage, which includes repositioning
                } else if (aiLevel >= playerLevel + 4) { // AI crushes Player
                    playerTank.takeDamage(playerTank.maxHp); // Player is crushed
                    crushed = true;
                    // playerTank.reset() will be called by takeDamage
                    // and then game.js handles repositioning for player
                    if (playerTank.hp <= 0) { // Check if player died from this
                         const respawnPoint = findSafestRespawnPoint(aiTanks, WORLD_WIDTH, WORLD_HEIGHT);
                         playerTank.x = respawnPoint.x;
                         playerTank.y = respawnPoint.y;
                    }
                } 
                // Ramming Logic (only if not crushed)
                else if (!crushed && Math.abs(playerLevel - aiLevel) <= 3) {
                    playerTank.takeDamage(10);
                    ai.takeDamage(10);
                    // Check if player died from ramming
                    if (playerTank.hp <= 0) {
                         const respawnPoint = findSafestRespawnPoint(aiTanks, WORLD_WIDTH, WORLD_HEIGHT);
                         playerTank.x = respawnPoint.x;
                         playerTank.y = respawnPoint.y;
                    }
                    // AI death from ramming is handled by its own takeDamage->reset cycle
                }
                
                // If a crush happened, and the AI was the one crushed,
                // we might want to skip further interactions with this specific AI for this frame.
                // Iterating backwards and AI resetting (moving) might naturally handle this.
                // If player crushed AI, AI might be "dead" (hp <=0) for next collision checks.
            }
        }


        // Specific Triple Shot Power-up Spawning (in gameLoop)
        if (Date.now() - lastTripleShotSpawnTime > TRIPLE_SHOT_SPAWN_INTERVAL) {
            const existingTripleShots = upgrades.filter(upg => upg.type === TRIPLE_SHOT_TYPE).length;
            if (existingTripleShots < MAX_TRIPLE_SHOT_ON_MAP) {
                // Spawn using undefined for x,y to get random position, specific type, color, and size
                spawnUpgrade(undefined, undefined, 'lime', TRIPLE_SHOT_TYPE, 10); 
                lastTripleShotSpawnTime = Date.now();
            }
        }

        // Upgrade Collection Logic
        for (let i = upgrades.length - 1; i >= 0; i--) {
            const currentUpgrade = upgrades[i]; // Get the upgrade object
            if (checkCollision(playerTank, currentUpgrade)) {
                playerTank.collectUpgradeEffect(currentUpgrade); // Pass the whole upgrade object
                upgrades.splice(i, 1); // Remove collected upgrade
                // Optional: spawnUpgrade(); // To immediately replace (if desired for general upgrades)
            }
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update Camera Position
        cameraX = playerTank.x - canvas.width / 2;
        cameraY = playerTank.y - canvas.height / 2;

        // Clamp Camera to World Boundaries
        cameraX = Math.max(0, Math.min(cameraX, WORLD_WIDTH - canvas.width));
        cameraY = Math.max(0, Math.min(cameraY, WORLD_HEIGHT - canvas.height));
        
        // Save context and apply camera translation
        ctx.save();
        ctx.translate(-cameraX, -cameraY);

        // --- START OF WORLD-BASED DRAWING ---

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
                const attackerLevel = p.attackerLevel;
                const targetLevel = playerTank.level;
                const targetMaxHp = playerTank.maxHp;
                let baseDamage = targetMaxHp * 0.25;
                let actualDamage = baseDamage;

                if (attackerLevel < targetLevel) {
                    const levelDifference = targetLevel - attackerLevel;
                    actualDamage = baseDamage / Math.pow(DAMAGE_SCALE_EXP_FACTOR, levelDifference);
                }
                actualDamage = Math.max(1, Math.floor(actualDamage));
                
                playerTank.takeDamage(actualDamage);
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
                    const attackerLevel = p.attackerLevel;
                    const targetLevel = ai.level;
                    const targetMaxHp = ai.maxHp;
                    let baseDamage = targetMaxHp * 0.25;
                    let actualDamage = baseDamage;

                    if (attackerLevel < targetLevel) {
                        const levelDifference = targetLevel - attackerLevel;
                        actualDamage = baseDamage / Math.pow(DAMAGE_SCALE_EXP_FACTOR, levelDifference);
                    }
                    actualDamage = Math.max(1, Math.floor(actualDamage));

                    ai.takeDamage(actualDamage);
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
        
        // --- END OF WORLD-BASED DRAWING ---
        ctx.restore(); // Restore context to pre-camera state

        // UI elements that should NOT move with the camera can be drawn here.
        // For example, a static minimap, score display, etc.
        // The current "Level" display is drawn relative to the world, so it moves.
        // If it needs to be static, it should be moved after ctx.restore().
        // For now, let's move the Level display to be static.
        
        // Draw UI elements (like Player Level) that should be static on screen
        ctx.fillStyle = 'black'; // Changed from 'white' to 'black'
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Level: ${playerTank.level}`, 30, 30);

        // --- Leaderboard Drawing ---
        // Gather tanks for leaderboard (player and active AI tanks)
        let allTanksForLeaderboard = [playerTank, ...aiTanks.filter(ai => ai.hp > 0)];

        // Sort tanks by level (descending), then by maxHp (descending) as a tie-breaker
        allTanksForLeaderboard.sort((a, b) => b.level - a.level || b.maxHp - a.maxHp);

        // Take top 10
        const topTanks = allTanksForLeaderboard.slice(0, 10);

        // Draw Leaderboard
        ctx.fillStyle = 'black'; // Changed from 'white' to 'black'
        ctx.font = '16px Arial';
        ctx.textAlign = 'right'; // Align text to the right for top-right corner placement
        ctx.textBaseline = 'top';
        
        const leaderboardX = canvas.width - 30; // X position for right alignment
        const leaderboardStartY = 30;         // Y position for the title
        const lineHeight = 20;                // Line height for each entry

        ctx.fillText('Leaderboard', leaderboardX, leaderboardStartY);

        for (let i = 0; i < topTanks.length; i++) {
            const tank = topTanks[i];
            let displayName = '';
            if (tank === playerTank) {
                displayName = 'Player';
            } else {
                // Assuming AI tanks have a 'color' property that's a string
                displayName = `AI (${tank.color || 'Unknown'})`; 
            }
            ctx.fillText(`${i + 1}. ${displayName} - Lvl: ${tank.level}`, leaderboardX, leaderboardStartY + lineHeight + (i * lineHeight));
        }
        // --- End of Leaderboard Drawing ---


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

    // Input for Shooting (Mouse Click) - Uses worldMouseX/Y already calculated for aiming
    canvas.addEventListener('click', (event) => {
        // We use the continuously updated worldMouseX/Y from the gameLoop's calculation
        // (derived from mousePos set by mousemove) for shooting.
        // This ensures click-to-shoot uses the same aim point as visual tracking.
        const worldMouseXForShooting = mousePos.x + cameraX;
        const worldMouseYForShooting = mousePos.y + cameraY;
        playerTank.shoot(worldMouseXForShooting, worldMouseYForShooting, projectiles);
    });

    // Mouse Move Listener for Aiming
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = event.clientX - rect.left;
        mousePos.y = event.clientY - rect.top;
    });
});
