// Constants for Tank properties
const BASE_SIZE = 15; // initial radius
const SIZE_INCREMENT_PER_LEVEL = 2;
const BASE_MAX_HP = 100;
const HP_INCREMENT_PER_LEVEL = 20;

class Tank {
    constructor(x, y, color, speed) { // Size removed, will be calculated
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = speed;

        this.level = 1;
        this.maxHp = BASE_MAX_HP;
        this.hp = this.maxHp;
        this.size = BASE_SIZE + this.level * SIZE_INCREMENT_PER_LEVEL;

        // Shooting cooldown properties
        this.lastShotTime = 0;
        this.shootCooldown = 500; // milliseconds

        // Emergency Escape properties
        this.escapeCooldownEndTimestamp = 0;
        this.isEscapeActive = false;
        this.escapeDurationEndTimestamp = 0;
        this.escapeColor = null; // For optional visual cue

        // Store initial/base values (importantly, after level-based speed/maxHp are set)
        this.originalSpeed = this.speed; 
        this.originalMaxHp = this.maxHp;

        this.aimAngle = 0; // Initialize aim angle
    }

    activateEscape() {
        if (Date.now() >= this.escapeCooldownEndTimestamp && !this.isEscapeActive) {
            this.isEscapeActive = true;
            
            // originalSpeed and originalMaxHp are already set by constructor/reset
            // If they could change by other means mid-life, re-capture here.
            // For now, assume they hold the true base values for the current level/state pre-escape.

            this.speed *= 3;
            this.maxHp *= 2;
            this.hp *= 2; 
            this.hp = Math.min(this.hp, this.maxHp); // Ensure HP doesn't exceed new max HP

            this.escapeDurationEndTimestamp = Date.now() + 5000; // 5 seconds duration
            this.escapeCooldownEndTimestamp = Date.now() + 30000; // 30 seconds cooldown
            this.escapeColor = 'rgba(0, 255, 255, 0.3)'; // Cyan aura
        }
    }

    updateEffects() {
        if (this.isEscapeActive && Date.now() >= this.escapeDurationEndTimestamp) {
            this.speed = this.originalSpeed;
            this.maxHp = this.originalMaxHp;
            this.hp = Math.min(this.hp, this.maxHp); // Clamp HP to original max
            this.isEscapeActive = false;
            this.escapeColor = null;
        }
    }

    collectUpgradeEffect() {
        this.level++;
        this.size = BASE_SIZE + this.level * SIZE_INCREMENT_PER_LEVEL;
        this.maxHp = BASE_MAX_HP + this.level * HP_INCREMENT_PER_LEVEL;
        this.hp = this.maxHp; // Full heal on level up

        // If escape is not active, update originalMaxHp as well.
        // If escape IS active, originalMaxHp holds the pre-escape value.
        if (!this.isEscapeActive) {
            this.originalMaxHp = this.maxHp;
        }
        // Speed is not affected by upgrades in current design, so originalSpeed remains.
    }

    reset() {
        // If escape was active, revert its stat changes before resetting other stats
        if (this.isEscapeActive) {
            this.speed = this.originalSpeed; // Restore original speed
            this.maxHp = this.originalMaxHp; // Restore original maxHp
            // HP will be set to maxHp below, which is now originalMaxHp
        }
        this.isEscapeActive = false;
        this.escapeColor = null;
        this.escapeDurationEndTimestamp = 0; // Stop any active escape effect

        // Reset level-based stats
        this.level = 1;
        this.maxHp = BASE_MAX_HP; 
        this.hp = this.maxHp; // Full health at new (or restored original) maxHp
        this.size = BASE_SIZE + this.level * SIZE_INCREMENT_PER_LEVEL; 
        
        // Re-initialize originalSpeed and originalMaxHp for the new life based on current (level 1) stats
        // Note: this.speed is assumed to be constant or reset to a base value if it can change by other means
        // For now, this.speed is only changed by escape, so originalSpeed is the true base.
        // If other mechanics change speed, this.speed should be reset to BASE_SPEED here.
        this.originalSpeed = this.speed; // Re-capture base speed (which should be the actual base speed)
        this.originalMaxHp = this.maxHp; // Re-capture base maxHp for level 1

        // Cooldown for escape ability is NOT reset upon death, player has to wait.
        // Position is handled in game.js
    }

    takeDamage(damageAmount) {
        this.hp -= damageAmount;
        if (this.hp <= 0) { // Changed to <= 0 for clarity
            this.hp = 0; // Ensure HP doesn't go negative before reset
            this.reset(); // Call reset when HP is 0 or less
        }
    }

    shoot(targetX, targetY, projectilesArray) { // projectilesArray passed as argument
        const now = Date.now();
        if (now - this.lastShotTime > this.shootCooldown) {
            // Projectile properties - using some example values
            const projectileSize = 5;
            const projectileColor = 'red'; 
            const projectileSpeed = 7;
            // projectileDamage is now calculated in game.js based on levels

            const barrelLength = this.size * 1.0; // Consistent with draw method
            const projectileStartX = this.x + Math.cos(this.aimAngle) * barrelLength;
            const projectileStartY = this.y + Math.sin(this.aimAngle) * barrelLength;

            const newProjectile = new Projectile(
                projectileStartX, projectileStartY, 
                projectileSize, projectileColor, projectileSpeed, 
                targetX, targetY, 
                this.level // Pass attacker's level
            );
            projectilesArray.push(newProjectile);
            this.lastShotTime = now;
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 10;
        const barX = this.x - this.size;
        const barY = this.y - this.size - barHeight - 5; // 5 pixels padding

        // Background of the health bar
        ctx.fillStyle = 'grey';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Current health portion
        const currentHealthWidth = barWidth * (this.hp / this.maxHp);
        ctx.fillStyle = 'green';
        ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

        // Optional: Add a border to the health bar
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    draw(ctx) {
        // Draw tank body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw health bar - position will need adjustment if tank body changes significantly
        this.drawHealthBar(ctx); // Draw health bar first, so it's under the tank body/turret

        // Optional: Draw escape aura - also draw this before main tank parts
        if (this.isEscapeActive && this.escapeColor) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // No rotation for aura, it's a general circle
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 7, 0, Math.PI * 2); // Aura slightly larger
            ctx.fillStyle = this.escapeColor;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        }

        // Tank Body (Using dimensions from current prompt)
        ctx.save();
        ctx.translate(this.x, this.y);
        // Optional: Rotate body if tank has separate movement direction angle 
        // ctx.rotate(this.movementAngle || 0); 
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size, -this.size * 0.7, this.size * 2, this.size * 1.4); // Body rectangle
        ctx.restore();

        // Turret and Barrel (Rotated Group - Using dimensions from current prompt)
        ctx.save();
        ctx.translate(this.x, this.y); // Translate to tank's center
        ctx.rotate(this.aimAngle);    // Rotate by aimAngle
        
        // Turret (example: circle)
        const turretRadius = this.size * 0.6;
        ctx.fillStyle = 'grey'; // Or a darker shade of this.color
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2); // Draw turret at (0,0) relative to translated/rotated context
        ctx.fill();
        
        // Barrel (example: rectangle)
        const barrelLength = this.size * 1.0; 
        const barrelWidth = this.size * 0.3;
        ctx.fillStyle = 'darkgrey';
        // Barrel drawn extending from the turret center along the new x-axis (due to rotation)
        ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth); 
        ctx.restore(); // Restore context
    }

    updatePosition(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    moveUp() {
        this.updatePosition(0, -this.speed);
    }

    moveDown() {
        this.updatePosition(0, this.speed);
    }

    moveLeft() {
        this.updatePosition(-this.speed, 0);
    }

    moveRight() {
        this.updatePosition(this.speed, 0);
    }
}
