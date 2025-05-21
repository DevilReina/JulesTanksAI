class Projectile {
    // Constructor updated to accept dynamic size.
    // The 'size' parameter was already present from a previous refactor,
    // but this confirms its role for dynamic sizing.
    constructor(x, y, size, color, speed, targetX, targetY, attackerLevel) { 
        this.x = x;
        this.y = y;
        this.size = size; // Store dynamic size
        this.color = color;
        this.attackerLevel = attackerLevel; // Store attacker's level

        const dirX = targetX - x;
        const dirY = targetY - y;
        const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

        if (magnitude === 0) {
            // Handle zero magnitude case (e.g., target is same as origin)
            // Default to moving right, or could choose not to create the projectile
            this.dx = speed;
            this.dy = 0;
        } else {
            this.dx = (dirX / magnitude) * speed;
            this.dy = (dirY / magnitude) * speed;
        }
        // this.speed = speed; // Optionally store speed if needed elsewhere
    }

    updatePosition() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Uses this.size
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}
