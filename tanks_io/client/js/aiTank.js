// Assumes BASE_SIZE, SIZE_INCREMENT_PER_LEVEL, BASE_MAX_HP, HP_INCREMENT_PER_LEVEL
// are globally available from tank.js

class AITank extends Tank {
    constructor(x, y, color, speed, level, worldWidth, worldHeight) {
        super(x, y, color, speed); // Call Tank constructor

        // AI-specific properties
        this.level = level; // Set initial level for AI
        this.worldWidth = worldWidth; // For AI behavior and boundary checks
        this.worldHeight = worldHeight;

        // Recalculate size, maxHp, and hp based on the provided level
        this.size = BASE_SIZE + this.level * SIZE_INCREMENT_PER_LEVEL;
        this.maxHp = BASE_MAX_HP + this.level * HP_INCREMENT_PER_LEVEL;
        this.hp = this.maxHp;

        this.shootCooldown = 1000; // AI specific cooldown in milliseconds
        this.lastShotTime = 0;

        // AI Movement state
        this.movementTarget = null;
        this.timeToChangeDirection = 0; // ms
        this.shootingRange = 400; // pixels
    }

    // Override shoot method for AI-specific projectiles or behavior
    shoot(targetX, targetY, projectilesArray) {
        const now = Date.now();
        if (now - this.lastShotTime > this.shootCooldown) {
            // AI Projectile properties
            const projectileSize = 5;
            const projectileColor = 'orange'; // AI projectiles are orange
            const projectileSpeed = 6; // Slightly slower or different speed for AI
            const projectileDamage = 20; // AI projectile damage

            // Ensure Projectile class is available (should be global)
            if (typeof Projectile === 'undefined') {
                console.error("Projectile class is not defined for AITank.shoot");
                return;
            }

            const newProjectile = new Projectile(
                this.x, this.y,
                projectileSize, projectileColor, projectileSpeed,
                targetX, targetY,
                projectileDamage
            );
            projectilesArray.push(newProjectile);
            this.lastShotTime = now;
        }
    }

    // Override reset for AI-specific repositioning
    reset() {
        super.reset(); // Call the base Tank's reset method
        // Now, reposition the AI tank randomly
        if (this.worldWidth && this.worldHeight) {
            this.x = Math.random() * this.worldWidth;
            this.y = Math.random() * this.worldHeight;
        } else {
            // Fallback if world dimensions aren't set, though they should be.
            console.warn("AITank world dimensions not set, defaulting to 0,0 for respawn.");
            this.x = 0; 
            this.y = 0;
        }
    }

    // AI-specific update logic will be added later.
    // For now, basic movement or placeholder for update logic.
    updateAI(playerTank, upgrades, otherAITanks, projectilesArray, worldWidth, worldHeight) {
        // Movement Logic (Random)
        if (Date.now() > this.timeToChangeDirection || !this.movementTarget) {
            this.timeToChangeDirection = Date.now() + Math.random() * 3000 + 2000; // Change direction every 2-5 seconds
            this.movementTarget = { x: Math.random() * worldWidth, y: Math.random() * worldHeight };
        }

        if (this.movementTarget) {
            let dirX = this.movementTarget.x - this.x;
            let dirY = this.movementTarget.y - this.y;
            const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

            if (magnitude > this.speed) { // Only move if not already at target (approx)
                dirX /= magnitude;
                dirY /= magnitude;
                this.updatePosition(dirX * this.speed, dirY * this.speed);
            } else {
                this.movementTarget = null; // Reached target, will pick new one
            }
        }
        
        // Shooting Logic
        const distToPlayer = Math.sqrt((playerTank.x - this.x)**2 + (playerTank.y - this.y)**2);
        if (distToPlayer < this.shootingRange) {
            this.shoot(playerTank.x, playerTank.y, projectilesArray);
        }
    }

    // takeDamage is inherited from Tank class, if it exists there.
    // If not, it needs to be added to Tank or AITank.
}
