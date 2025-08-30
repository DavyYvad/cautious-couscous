// Configuration module
const Config = {
    STAR_DENSITY: 3000,
    SHOOTING_STAR_CHANCE: 0.008,
    MOUSE_INFLUENCE_RADIUS: 200,
    CONSTELLATION_DISTANCE: 70,
    ORB_DISTORTION_RADIUS: 200,
    ORB_DISTORTION_STRENGTH: 1.8,
    MUSIC_INFLUENCE_RADIUS: 500,
    ANIMATION: {
        FRAME_RATE: 60,
        SMOOTHING: 0.25
    }
};

// Event Bus pour la communication entre modules
class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
}

// Canvas Manager
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.setupResizeListener();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 250);
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Particle System
class ParticleSystem {
    constructor(canvasManager) {
        this.ctx = canvasManager.ctx;
        this.canvas = canvasManager.canvas;
        this.particles = [];
        this.lastFrameTime = 0;
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    update(deltaTime, mousePos) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime, mousePos);
            return particle.isAlive();
        });
    }

    render() {
        this.particles.forEach(particle => particle.render(this.ctx));
    }
}

// Base Particle Class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
    }

    update(deltaTime, mousePos) {
        // Override in subclasses
    }

    render(ctx) {
        // Override in subclasses
    }

    isAlive() {
        return this.alive;
    }
}

// Star Class
class Star extends Particle {
    constructor(x, y, size) {
        super(x, y);
        this.baseX = x;
        this.baseY = y;
        this.size = size;
        this.brightness = Math.random() * 0.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.015 + 0.005;
    }

    update(deltaTime, mousePos) {
        // Twinkling
        this.brightness += this.twinkleSpeed * deltaTime * 60;
        if (this.brightness > 1 || this.brightness < 0.2) {
            this.twinkleSpeed = -this.twinkleSpeed;
        }

        // Mouse interaction
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < Config.MOUSE_INFLUENCE_RADIUS) {
            const force = (Config.MOUSE_INFLUENCE_RADIUS - distance) / Config.MOUSE_INFLUENCE_RADIUS;
            this.x += (dx * force) * 0.02;
            this.y += (dy * force) * 0.02;
        } else {
            this.x += (this.baseX - this.x) * 0.05;
            this.y += (this.baseY - this.y) * 0.05;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.brightness;

        // Halo
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 4
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.2)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// UI Manager
class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.setupUIElements();
        this.setupEventListeners();
    }

    setupUIElements() {
        this.elements = {
            musicToggle: document.getElementById('musicToggleBtn'),
            musicPlayer: document.getElementById('musicPlayerExpanded'),
            playBtn: document.getElementById('playBtn'),
            contactToggle: document.getElementById('contactToggle'),
            contactForm: document.getElementById('contactForm'),
            orbInfoPanel: document.getElementById('orbInfoPanel'),
            closeOrbInfo: document.getElementById('closeOrbInfo'),
            volumeSlider: document.getElementById('volumeSlider'),
            loadYoutubeBtn: document.getElementById('loadYoutubeBtn'),
            youtubeUrl: document.getElementById('youtubeUrl')
        };
    }

    setupEventListeners() {
        // Music controls
        this.elements.musicToggle.addEventListener('click', () => {
            this.toggleMusicPlayer();
        });

        this.elements.playBtn.addEventListener('click', () => {
            this.eventBus.emit('music:toggle');
        });

        // Contact form
        this.elements.contactToggle.addEventListener('click', () => {
            this.elements.contactForm.classList.toggle('active');
        });

        // Orb info panel
        this.elements.closeOrbInfo.addEventListener('click', () => {
            this.closeOrbInfo();
        });

        // Volume control
        this.elements.volumeSlider.addEventListener('mousedown', (e) => {
            this.handleVolumeChange(e);
        });

        // YouTube loader
        this.elements.loadYoutubeBtn.addEventListener('click', () => {
            const videoId = this.elements.youtubeUrl.value.trim();
            if (videoId) {
                this.eventBus.emit('youtube:load', videoId);
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    toggleMusicPlayer() {
        this.elements.musicPlayer.classList.toggle('active');
        this.elements.musicToggle.classList.toggle('playing');
    }

    closeOrbInfo() {
        this.elements.orbInfoPanel.classList.remove('active');
        this.eventBus.emit('orb:close');
    }

    handleVolumeChange(event) {
        const rect = this.elements.volumeSlider.getBoundingClientRect();
        const updateVolume = (e) => {
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            document.getElementById('volumeFill').style.width = `${percent * 100}%`;
            this.eventBus.emit('volume:change', percent);
        };

        updateVolume(event);

        const mouseMove = (e) => updateVolume(e);
        const mouseUp = () => {
            document.removeEventListener('mousemove', mouseMove);
            document.removeEventListener('mouseup', mouseUp);
        };

        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
    }

    showOrbInfo(orbData) {
        const panel = this.elements.orbInfoPanel;
        document.getElementById('orbInfoAvatar').src = orbData.image;
        document.getElementById('orbInfoName').textContent = orbData.name;
        document.getElementById('orbInfoRole').textContent = orbData.role;
        document.getElementById('orbInfoDescription').textContent = orbData.description;

        panel.style.left = `${orbData.x + 60}px`;
        panel.style.top = `${orbData.y - 50}px`;
        panel.classList.add('active');
    }
}

// Orb Manager
class OrbManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.orbs = [];
        this.currentOpenOrb = null;
        this.initOrbs();
    }

    initOrbs() {
        const orbConfigs = [
            {
                id: 'discord',
                image: 'https://cdn.discordapp.com/embed/avatars/0.png',
                name: 'Waples',
                role: 'Founder',
                description: 'Pioneering the digital cosmos, one nebula at a time.',
                x: window.innerWidth * 0.25,
                y: window.innerHeight * 0.3
            },
            {
                id: 'team1',
                image: 'https://cdn.discordapp.com/embed/avatars/1.png',
                name: 'Nebula',
                role: 'Developer',
                description: 'Crafting stellar experiences in the void.',
                x: window.innerWidth * 0.7,
                y: window.innerHeight * 0.6
            }
        ];

        orbConfigs.forEach(config => this.createOrb(config));
    }

    createOrb(config) {
        const orbDiv = document.createElement('div');
        orbDiv.className = 'space-orb';
        orbDiv.style.left = `${config.x - 40}px`;
        orbDiv.style.top = `${config.y - 40}px`;
        orbDiv.innerHTML = `
            <div class="orb-inner">
                <div class="orb-ring"></div>
                <img src="${config.image}" alt="${config.name}" class="orb-image" draggable="false">
            </div>
        `;

        this.setupOrbInteraction(orbDiv, config);
        document.body.appendChild(orbDiv);
        
        this.orbs.push({
            element: orbDiv,
            config: config,
            x: config.x,
            y: config.y
        });
    }

    setupOrbInteraction(element, config) {
        let isDragging = false;
        let hasMoved = false;
        let dragOffset = { x: 0, y: 0 };

        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            
            dragOffset.x = startX - config.x;
            dragOffset.y = startY - config.y;

            const mouseMove = (e) => {
                if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
                    hasMoved = true;
                }
                
                config.x = e.clientX - dragOffset.x;
                config.y = e.clientY - dragOffset.y;
                element.style.left = `${config.x - 40}px`;
                element.style.top = `${config.y - 40}px`;
            };

            const mouseUp = () => {
                if (!hasMoved) {
                    this.eventBus.emit('orb:click', config);
                }
                document.removeEventListener('mousemove', mouseMove);
                document.removeEventListener('mouseup', mouseUp);
            };

            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('mouseup', mouseUp);
        });
    }
}

// Audio Manager
class AudioManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isPlaying = false;
        this.volume = 0.7;
        this.beatTime = 0;
        this.beatIntensity = 0;
        
        this.setupEventListeners();
        this.startSimulation();
    }

    setupEventListeners() {
        this.eventBus.on('music:toggle', () => this.togglePlay());
        this.eventBus.on('volume:change', (volume) => this.setVolume(volume));
        this.eventBus.on('youtube:load', (videoId) => this.loadYouTube(videoId));
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        document.getElementById('playBtn').textContent = this.isPlaying ? '❚❚' : '▶';
        document.getElementById('musicToggleBtn').classList.toggle('playing', this.isPlaying);
    }

    setVolume(volume) {
        this.volume = volume;
    }

    loadYouTube(videoId) {
        const iframe = document.getElementById('youtube-iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0`;
        document.getElementById('trackName').textContent = `YouTube - ${videoId}`;
        this.isPlaying = true;
        this.togglePlay();
    }

    startSimulation() {
        setInterval(() => {
            if (this.isPlaying) {
                this.beatTime += 0.016;
                const pulse1 = Math.sin(this.beatTime * 2) * 0.5 + 0.5;
                const pulse2 = Math.sin(this.beatTime * 3.7 + Math.PI/3) * 0.5 + 0.5;
                this.beatIntensity = (pulse1 * 0.6 + pulse2 * 0.4) * this.volume;
                this.updateVisualizer();
            } else {
                this.beatIntensity *= 0.92;
            }
        }, 16);
    }

    updateVisualizer() {
        const bars = document.querySelectorAll('.mini-bar');
        bars.forEach((bar, index) => {
            const intensity = Math.sin(this.beatTime * (3 + index * 1.5)) * 0.5 + 0.5;
            bar.style.height = `${3 + intensity * 17 * this.volume}px`;
        });
    }
}

// Main Application
class App {
    constructor() {
        this.eventBus = new EventBus();
        this.canvasManager = new CanvasManager('starfield-canvas');
        this.particleSystem = new ParticleSystem(this.canvasManager);
        this.uiManager = new UIManager(this.eventBus);
        this.orbManager = new OrbManager(this.eventBus);
        this.audioManager = new AudioManager(this.eventBus);
        
        this.mousePos = { x: 0, y: 0 };
        this.lastFrameTime = 0;
        
        this.init();
    }

    init() {
        this.createStars();
        this.setupEventListeners();
        this.setupCursor();
        this.startAnimation();
    }

    createStars() {
        const starCount = Math.floor((this.canvasManager.canvas.width * this.canvasManager.canvas.height) / Config.STAR_DENSITY);
        
        for (let i = 0; i < starCount; i++) {
            const star = new Star(
                Math.random() * this.canvasManager.canvas.width,
                Math.random() * this.canvasManager.canvas.height,
                Math.random() * 1.2 + 0.3
            );
            this.particleSystem.addParticle(star);
        }
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            this.updateCursor(e);
        });

        this.eventBus.on('orb:click', (orbData) => {
            this.uiManager.showOrbInfo(orbData);
        });
    }

    setupCursor() {
        this.cursorGlow = document.getElementById('cursorGlow');
    }

    updateCursor(event) {
        if (this.cursorGlow) {
            this.cursorGlow.style.left = event.clientX + 'px';
            this.cursorGlow.style.top = event.clientY + 'px';
        }
    }

    startAnimation() {
        const animate = (currentTime) => {
            const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = currentTime;

            this.canvasManager.clear();
            this.particleSystem.update(deltaTime, this.mousePos);
            this.particleSystem.render();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});