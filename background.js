const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    init();
});

// Combined character set: numbers, math symbols, and Font Awesome 5 Free (Solid) icons
const numbersAndSymbols = '0123456789∫∑√∞π∂∇∈∀∃λμαβγ'.split('');
const faIcons = [
    '\uf5d2', // atom
    '\uf5dc', // brain
    '\uf698', // square-root-alt
    '\uf534', // infinity
    '\uf121', // code
    '\uf085', // cogs
    '\uf0c3', // flask
    '\uf542', // project-diagram
    '\uf83e', // wave-square
    '\uf471', // dna
    '\uf544', // robot
    '\uf2db', // microchip
    '\uf7ee', // satellite-dish
    '\uf1b3'  // cube
];
const characters = [...numbersAndSymbols, ...faIcons]; // Combine them

const fontSize = 16;
const maxSpeed = 2;
const friction = 0.98;

const particles = [];

// --- Math Function Visualizations (unchanged) ---
function drawSineWave(p, time) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.lineWidth = 1;
    const amplitude = 20;
    const frequency = 0.1;
    for (let i = -30; i < 30; i++) {
        const x = p.x + i;
        const y = p.y + amplitude * Math.sin(i * frequency + time);
        i === -30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
}
function drawSpiral(p, time) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(230, 126, 34, 0.5)';
    ctx.lineWidth = 1;
    const radius = 5;
    for (let i = 0; i < 50; i++) {
        const angle = 0.2 * i;
        const x = p.x + (radius + angle * 0.5) * Math.cos(angle + time);
        const y = p.y + (radius + angle * 0.5) * Math.sin(angle + time);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
}
function drawLissajousCurve(p, time) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
    ctx.lineWidth = 1;
    const a = 3, b = 4;
    const size = 25;
    for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const x = p.x + size * Math.sin(a * angle + time);
        const y = p.y + size * Math.sin(b * angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
}
function drawExpandingCircle(p, time) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    const maxRadius = 30;
    const currentRadius = (Date.now() % 2000) / 2000 * maxRadius;
    ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
}
function drawStarburst(p, time) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
    ctx.lineWidth = 1;
    const numRays = 8;
    const rayLength = 25;
    for (let i = 0; i < numRays; i++) {
        const angle = (Math.PI * 2 / numRays) * i + time * 0.05;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + rayLength * Math.cos(angle), p.y + rayLength * Math.sin(angle));
    }
    ctx.stroke();
}
const functionVisualizers = [drawSineWave, drawSpiral, drawLissajousCurve, drawExpandingCircle, drawStarburst];

// --- Particle Class ---
class Particle {
    constructor() { this.reset(); }
    reset(x = Math.random() * width, y = Math.random() * height) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.char = characters[Math.floor(Math.random() * characters.length)];
        this.functionType = Math.floor(Math.random() * functionVisualizers.length);
        this.wander = 0.005; this.theta = Math.random() * Math.PI * 2;
    }
    update() {
        this.theta += (Math.random() - 0.5) * 0.5;
        this.vx += Math.cos(this.theta) * this.wander;
        this.vy += Math.sin(this.theta) * this.wander;
        this.vx *= friction; this.vy *= friction;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) { this.vx = (this.vx / speed) * maxSpeed; this.vy = (this.vy / speed) * maxSpeed; }
        
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > width) this.x = 0; else if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0; else if (this.y < 0) this.y = height;
    }
    draw(isHovered) {
        let alpha = 0.3;
        const currentFontSize = isHovered ? fontSize * 1.5 : fontSize;
        
        // Check if the character is a Font Awesome icon
        if (faIcons.includes(this.char)) {
            ctx.font = `900 ${currentFontSize}px "Font Awesome 5 Free"`; // Use FA font for icons
        } else {
            ctx.font = `${currentFontSize}px "Fira Code"`; // Use Fira Code for numbers/symbols
        }
        
        ctx.fillStyle = isHovered ? `rgba(230, 126, 34, ${Math.min(1, alpha * 3)})` : `rgba(224, 224, 224, ${alpha})`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

function init() {
    particles.length = 0;
    const particleCount = 450;
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());
}

let mouse = { x: null, y: null, radius: 120 };
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

function animate() {
    ctx.clearRect(0, 0, width, height);
    const time = Date.now() * 0.005;
    
    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        let isHovered = false;
        
        if (mouse.x) {
            const dx = mouse.x - p1.x;
            const dy = mouse.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                isHovered = true;
                if (distance > 1) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    p1.vx += (dx / distance) * force * 0.2;
                    p1.vy += (dy / distance) * force * 0.2;
                }
            }
        }
        
        p1.update();
        p1.draw(isHovered);
        if (isHovered) functionVisualizers[p1.functionType](p1, time);

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
            if (dist < 80) {
                ctx.beginPath();
                let lineOpacity = 0.08, lineLineWidth = 1;
                if (isHovered) { // Simplified check, ideally check if both are hovered or close
                     // lineOpacity = 0.4; lineLineWidth = 2; // Keep it subtle
                }
                ctx.strokeStyle = `rgba(224, 224, 224, ${lineOpacity})`;
                ctx.lineWidth = lineLineWidth;
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    init();
});