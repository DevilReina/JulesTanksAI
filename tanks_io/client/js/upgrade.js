class Upgrade {
    constructor(x, y, size = 7, color = 'green', type = 'growth') {
        this.x = x;
        this.y = y;
        this.size = size; // radius
        this.color = color;
        this.type = type;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}
