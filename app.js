// Configuration
const CONFIG = {
    stars: {
        density: 3000,
        maxCount: 300,
        twinkleSpeed: 0.01
    },
    effects: {
        mouseRadius: 150,
        constellationDistance: 80
    },
    performance: {
        fps: 60,
        throttleMs: 16
    }
};

// Utility functions
const Utils = {
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },
    
    random(min, max) {
        return Math.random() * (max - min) + min;
    }
};

// Canvas Module
class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.mousePos = { x: 0, y: 0 };
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', Utils.throttle((e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        }, CONFIG.performance.throttleMs));
        
        this.createStars();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        const count = Math.min(
            Math.floor((this.canvas.width * this.canvas.height) / CONFIG.stars.density),
            CONFIG.stars.maxCount
        );
        
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Utils.random(0, this.canvas.width),
                y: Utils.random(0, this.canvas.height),
                size: Utils.random(0.5, 1.5),
                brightness: Utils.random(0.3, 1),
                twinkleSpeed: Utils.random(0.005, CONFIG.stars.twinkleSpeed)
            });
        }
    }
    
    updateStars() {
        this.stars.forEach(star => {
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0.3) {
                star.twinkleSpeed = -star.twinkleSpeed;
            }
        });
    }
    
    renderStars() {
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    renderConstellations() {
        const nearbyStars = this.stars.filter(star => 
            Utils.distance(star.x, star.y, this.mousePos.x, this.mousePos.y) < CONFIG.effects.mouseRadius
        );
        
        this.ctx.strokeStyle = 'rgba(155, 135, 245, 0.2)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i < nearbyStars.length - 1; i++) {
            for (let j = i + 1; j < nearbyStars.length; j++) {
                const dist = Utils.distance(
                    nearbyStars[i].x, nearbyStars[i].y,
                    nearbyStars[j].x, nearbyStars[j].y
                );
                
                if (dist < CONFIG.effects.constellationDistance) {
                    this.ctx.globalAlpha = (1 - dist / CONFIG.effects.constellationDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(nearbyStars[i].x, nearbyStars[i].y);
                    this.ctx.lineTo(nearbyStars[j].x, nearbyStars[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateStars();
        this.renderStars();
        this.renderConstellations();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Audio Player Module
class AudioPlayer {
    constructor() {
        this.iframe = document.getElementById('youtube-iframe');
        this.isPlaying = false;
        this.volume = 0.7;
        
        this.initElements();
        this.bindEvents();
    }
    
    initElements() {
        this.elements = {
            toggle: document.getElementById('musicToggle'),
            player: document.getElementById('playerExpanded'),
            playBtn: document.getElementById('playBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            input: document.getElementById('youtubeInput'),
            loadBtn: document.getElementById('loadBtn'),
            trackName: document.getElementById('trackName')
        };
    }
    
    bindEvents() {
        this.elements.toggle.addEventListener('click', () => this.togglePlayer());
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.loadBtn.addEventListener('click', () => this.loadVideo());
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
        });
        
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadVideo();
        });
    }
    
    togglePlayer() {
        this.elements.player.classList.toggle('active');
    }
    
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.elements.playBtn.textContent = this.isPlaying ? '❚❚' : '▶';
        this.elements.toggle.classList.toggle('playing', this.isPlaying);
    }
    
    loadVideo() {
        const videoId = this.elements.input.value.trim();
        if (!videoId) return;
        
        this.iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        this.elements.trackName.textContent = `YouTube - ${videoId}`;
        this.isPlaying = true;
        this.togglePlay();
    }
}

// UI Module
class UIController {
    constructor() {
        this.initNavigation();
        this.initContact();
    }
    
    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(nav => 
                    nav.classList.remove('active')
                );
                item.classList.add('active');
            });
        });
    }
    
    initContact() {
        const toggle = document.getElementById('contactToggle');
        const form = document.getElementById('contactForm');
        
        toggle.addEventListener('click', () => {
            form.classList.toggle('active');
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            console.log('Form submitted');
            form.classList.remove('active');
        });
    }
}

// App Initialization
class App {
    constructor() {
        this.modules = {};
        this.init();
    }
    
    init() {
        this.modules.canvas = new CanvasRenderer('canvas');
        this.modules.audio = new AudioPlayer();
        this.modules.ui = new UIController();
        
        window.addEventListener('beforeunload', () => this.destroy());
    }
    
    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module.destroy) module.destroy();
        });
    }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
    new App();
});