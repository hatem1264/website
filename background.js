const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    init();
});

const characters = '0123456789∫∑√∞π∂∇∈∀∃λμαβγ'.split('');
const fontSize = 16;
const maxSpeed = 2;
const friction = 0.98;

const particles = [];

const codeSnippets = [
    {
        lang: "python",
        code: [
            "def is_prime(n):",
            "    if n <= 1:",
            "        return False",
            "    for i in range(2, int(n**0.5) + 1):",
            "        if n % i == 0:",
            "            return False",
            "    return True",
            "# This is a Python comment"
        ],
        colors: {
            keyword: 'rgba(52, 152, 219, 1)', // Blue
            string: 'rgba(230, 126, 34, 1)', // Orange
            comment: 'rgba(46, 204, 113, 1)', // Green
            number: 'rgba(46, 204, 113, 1)', // Green
            functionCall: 'rgba(230, 126, 34, 1)' // Orange
        }
    },
    {
        lang: "fenics",
        code: [
            "from dolfin import *",
            "mesh = UnitSquareMesh(8, 8)",
            "V = FunctionSpace(mesh, 'P', 1)",
            "u = TrialFunction(V)",
            "v = TestFunction(V)",
            "f = Constant(1.0)",
            "a = inner(grad(u), grad(v))*dx",
            "L = f*v*dx"
        ],
        colors: {
            keyword: 'rgba(52, 152, 219, 1)',
            string: 'rgba(230, 126, 34, 1)',
            comment: 'rgba(46, 204, 113, 1)',
            number: 'rgba(46, 204, 113, 1)',
            functionCall: 'rgba(230, 126, 34, 1)'
        }
    },
    {
        lang: "cpp",
        code: [
            "#include <iostream>",
            "",
            "int main() {",
            "    std::cout << \"Hello C++!\" << std::endl;",
            "    return 0;",
            "}"
        ],
        colors: {
            keyword: 'rgba(52, 152, 219, 1)',
            string: 'rgba(230, 126, 34, 1)',
            comment: 'rgba(46, 204, 113, 1)',
            number: 'rgba(46, 204, 113, 1)',
            functionCall: 'rgba(230, 126, 34, 1)'
        }
    },
    {
        lang: "python",
        code: [
            "import numpy as np",
            "def sigmoid(x):",
            "    return 1 / (1 + np.exp(-x))",
            "data = np.array([1, 2, 3])",
            "print(sigmoid(data))"
        ],
        colors: {
            keyword: 'rgba(52, 152, 219, 1)',
            string: 'rgba(230, 126, 34, 1)',
            comment: 'rgba(46, 204, 113, 1)',
            number: 'rgba(46, 204, 113, 1)',
            functionCall: 'rgba(230, 126, 34, 1)'
        }
    }
];

let codeSnippetState = {
    visible: false,
    x: 0,
    y: 0,
    alpha: 0,
    timer: 0,
    currentSnippet: null
};

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
        this.isExploding = false; this.explosionLife = 0;
    }
    update() {
        if (this.isExploding) {
            this.vx *= 0.99; this.vy *= 0.99; this.x += this.vx; this.y += this.vy;
            this.explosionLife--;
            if (this.explosionLife <= 0) this.reset();
            return;
        }
        this.theta += (Math.random() - 0.5) * 0.5;
        this.vx += Math.cos(this.theta) * this.wander;
        this.vy += Math.sin(this.theta) * this.wander;
        this.vx *= friction;
        this.vy *= friction;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) { this.vx = (this.vx / speed) * maxSpeed; this.vy = (this.vy / speed) * maxSpeed; }
        
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > width) this.x = 0; else if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0; else if (this.y < 0) this.y = height;
    }
    draw(isHovered) {
        let alpha = 0.3;
        if (this.isExploding) alpha = this.explosionLife / 60;
        const currentFontSize = isHovered ? fontSize * 1.5 : fontSize;
        ctx.font = `${currentFontSize}px "Fira Code"`;
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

// Helper for drawing highlighted code
function drawHighlightedCode(snippet, x, y, alpha) {
    if (!snippet || !snippet.code) return;

    const codeFontSize = 10; // Smaller font size
    const lineHeight = 14; // Tighter line height
    const padding = 8; // Reduced padding
    const snippetWidth = 250; // Smaller box
    const snippetHeight = snippet.code.length * lineHeight + padding * 2;

    // Draw background box
    ctx.fillStyle = `rgba(28, 28, 34, ${0.8 * alpha})`;
    ctx.fillRect(x - snippetWidth / 2, y - snippetHeight / 2, snippetWidth, snippetHeight);

    ctx.font = `${codeFontSize}px "Fira Code"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yOffset = padding;
    for (const line of snippet.code) {
        let xOffset = padding;
        const tokens = line.split(/(\b\w+\b|\s+|[^\w\s])/g).filter(Boolean);

        for (const token of tokens) {
            let color = `rgba(224, 224, 224, ${alpha})`;

            const keywords = ['def', 'if', 'for', 'return', 'import', 'from', 'class', 'int', 'main', 'std::cout', 'std::endl', 'mesh', 'FunctionSpace', 'TrialFunction', 'TestFunction', 'Constant', 'inner', 'grad', 'dx', 'np', 'as'];
            const cppKeywords = ['#include', 'int', 'return', 'std::cout', 'std::endl'];

            if (keywords.includes(token) || cppKeywords.includes(token)) {
                color = snippet.colors.keyword;
            } else if (token.match(/^["'].*["']$/)) {
                color = snippet.colors.string;
            } else if (token.startsWith('#') || token.startsWith('//')) {
                color = snippet.colors.comment;
            } else if (!isNaN(token) && token.trim() !== '') {
                color = snippet.colors.number;
            } else if (token.match(/\b\w+\b\(/)) {
                color = snippet.colors.functionCall;
            }

            ctx.fillStyle = color.replace(/, 1\)/, `, ${alpha})`);
            ctx.fillText(token, x - snippetWidth / 2 + xOffset, y - snippetHeight / 2 + yOffset);
            xOffset += ctx.measureText(token).width;
        }
        yOffset += lineHeight;
    }
}


function animate() {
    ctx.clearRect(0, 0, width, height);
    const time = Date.now() * 0.005;
    const currentHovered = new Set();

    if (mouse.x) {
        for (const p of particles) {
            if (p.isExploding) continue;
            if (Math.sqrt((mouse.x - p.x)**2 + (mouse.y - p.y)**2) < mouse.radius) {
                currentHovered.add(p);
            }
        }
    }

    if (currentHovered.size >= 15 && !codeSnippetState.visible) {
        let centerX = 0, centerY = 0;
        currentHovered.forEach(p => { centerX += p.x; centerY += p.y; });
        centerX /= currentHovered.size;
        centerY /= currentHovered.size;
        
        currentHovered.forEach(p => {
            p.isExploding = true;
            p.explosionLife = 60;
            const dx = p.x - centerX, dy = p.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            p.vx = (dx / dist) * (Math.random() * 5 + 5);
            p.vy = (dy / dist) * (Math.random() * 5 + 5);
        });

        codeSnippetState.visible = true;
        codeSnippetState.timer = 180;
        codeSnippetState.alpha = 1.0;
        codeSnippetState.x = centerX;
        codeSnippetState.y = centerY;
        codeSnippetState.currentSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
    }

    if (codeSnippetState.visible && codeSnippetState.currentSnippet) {
        codeSnippetState.timer--;
        if (codeSnippetState.timer <= 60) {
            codeSnippetState.alpha = codeSnippetState.timer / 60;
        }
        if (codeSnippetState.timer <= 0) {
            codeSnippetState.visible = false;
            codeSnippetState.currentSnippet = null;
        }

        drawHighlightedCode(codeSnippetState.currentSnippet, codeSnippetState.x, codeSnippetState.y, codeSnippetState.alpha);
    }

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (currentHovered.has(p1) && !p1.isExploding) {
            const dx = mouse.x - p1.x, dy = mouse.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 1) {
                const force = (mouse.radius - distance) / mouse.radius;
                p1.vx += (dx / distance) * force * 0.2;
                p1.vy += (dy / distance) * force * 0.2;
            }
        }
        p1.update();
        const isCurrentlyHovered = currentHovered.has(p1) && !p1.isExploding;
        p1.draw(isCurrentlyHovered);
        if (isCurrentlyHovered) functionVisualizers[p1.functionType](p1, time);

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            if (p1.isExploding || p2.isExploding) continue;
            const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
            if (dist < 80) {
                ctx.beginPath();
                let lineOpacity = 0.08, lineLineWidth = 1;
                if (currentHovered.has(p1) || currentHovered.has(p2)) {
                    lineOpacity = 0.4; lineLineWidth = 2;
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