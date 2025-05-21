// Define TRIPLE_SHOT_TYPE constant
const TRIPLE_SHOT_TYPE = 'triple_shot_powerup';

class Upgrade {
    constructor(x, y, size = 7, color = 'green', type = 'growth') {
        this.x = x;
        this.y = y;
        this.size = size; // radius
        this.color = color;
        this.type = type;
    }

    draw(ctx) {
        if (this.type === TRIPLE_SHOT_TYPE) {
            // Custom drawing for Triple Shot Power-up
            // Base circle (distinct color)
            ctx.fillStyle = 'lime'; // Example: Bright green for triple shot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();

            // Simple "T" or three dots to signify triple shot
            ctx.fillStyle = 'black';
            const dotSize = this.size * 0.2;
            // Center dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, dotSize, 0, Math.PI * 2);
            ctx.fill();
            // Left dot
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.5, this.y, dotSize, 0, Math.PI * 2);
            ctx.fill();
            // Right dot
            ctx.beginPath();
            ctx.arc(this.x + this.size * 0.5, this.y, dotSize, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Default drawing for other upgrades
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }
}
