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
    }

    collectUpgradeEffect() {
        this.level++;
        this.size = BASE_SIZE + this.level * SIZE_INCREMENT_PER_LEVEL;
        this.maxHp = BASE_MAX_HP + this.level * HP_INCREMENT_PER_LEVEL;
        this.hp = this.maxHp; // Full heal on level up

        // Shooting cooldown properties
        this.lastShotTime = 0;
        this.shootCooldown = 500; // milliseconds
    }

    shoot(targetX, targetY, projectilesArray) { // projectilesArray passed as argument
        const now = Date.now();
        if (now - this.lastShotTime > this.shootCooldown) {
            // Projectile properties - using some example values
            const projectileSize = 5;
            const projectileColor = 'yellow'; // Or this.color for tank's color
            const projectileSpeed = 7;
            const projectileDamage = 25; // Example damage

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

        // Draw health bar
        this.drawHealthBar(ctx);
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
