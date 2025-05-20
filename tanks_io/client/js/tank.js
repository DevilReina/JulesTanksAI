class Tank {
    constructor(x, y, size, color, speed) {
        this.x = x;
        this.y = y;
        this.size = size; // radius
        this.color = color;
        this.speed = speed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
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
