// ============================================
// Configuration
// ============================================
const CONFIG = {
    STAR_DENSITY: 3000,
    SHOOTING_STAR_CHANCE: 0.008,
    MOUSE_INFLUENCE_RADIUS: 200,
    CONSTELLATION_DISTANCE: 70,
    ORB_PULSE_RADIUS: 150,
    ORB_DISTORTION_RADIUS: 200,
    ORB_DISTORTION_STRENGTH: 1.8,
    MUSIC_INFLUENCE_RADIUS: 500,
    MUSIC_WAVE_RADIUS: 600,
    MUSIC_COLOR_RADIUS: 150,
};

// ============================================
// State Management
// ============================================
const createState = () => ({
    canvas: null,
    ctx: null,
    youtubeIframe: null,
    stars: [],
    shootingStars: [],
    nebulae: [],
    orbs: [],
    cosmicWaves: [],
    mousePosition: { x: 0, y: 0 },
    animationId: null,
    currentOpenOrb: null,
    musicConstellation: null,
    isPlaying: false,
    isMusicBarOpen: false,
    beatTime: 0,
    beatIntensity: 0,
    colorPhase: 0,
    currentVolume: 0.7,
    isDraggingVolume: false,
    isMuted: false
});

const state = createState();

// ============================================
// Factory Functions
// ============================================

// Star Factory
const makeStar = (x, y, size, speed) => ({
    x,
    y,
    baseX: x,
    baseY: y,
    size,
    speed,
    brightness: Math.random() * 0.5 + 0.5,
    twinkleSpeed: Math.random() * 0.015 + 0.005,
    orbInfluence: 0,
    musicInfluence: 0,
    distortedX: x,
    distortedY: y,
    cosmicHue: 220 + Math.random() * 80,
    cosmicPhase: Math.random() * Math.PI * 2,
    pulsePhase: Math.random() * Math.PI * 2,
});

// CosmicWave Factory
const makeCosmicWave = (x, y, intensity) => ({
    x,
    y,
    radius: 0,
    maxRadius: CONFIG.MUSIC_WAVE_RADIUS * (0.5 + intensity * 0.5),
    speed: 3 + intensity * 5,
    opacity: 0.5,
    hue: 250 + Math.random() * 60,
});

// MusicConstellation Factory
const makeMusicConstellation = () => {
    const x = window.innerWidth - 150;
    const y = window.innerHeight / 2;
    const stars = createNoteShape(x, y);
    
    return {
        x,
        y,
        stars,
        isHovered: false
    };
};

const createNoteShape = (centerX, centerY) => {
    const notePoints = [
        { x: 0, y: 0, size: 2.5 },
        { x: -8, y: -5, size: 2 },
        { x: -10, y: 0, size: 2 },
        { x: -8, y: 5, size: 2 },
        { x: 0, y: 8, size: 2.5 },
        { x: 8, y: 5, size: 2 },
        { x: 10, y: 0, size: 2 },
        { x: 8, y: -5, size: 2 },
        { x: 10, y: 0, size: 1.8 },
        { x: 10, y: -10, size: 1.8 },
        { x: 10, y: -20, size: 1.8 },
        { x: 10, y: -30, size: 2 },
        { x: 10, y: -40, size: 2.2 },
        { x: 10, y: -40, size: 2 },
        { x: 15, y: -35, size: 1.8 },
        { x: 20, y: -32, size: 1.8 },
        { x: 25, y: -30, size: 2 },
        { x: 22, y: -25, size: 1.5 },
        { x: 18, y: -22, size: 1.5 },
        { x: 14, y: -20, size: 1.5 }
    ];

    return notePoints.map(point => ({
        x: centerX + point.x * 2,
        y: centerY + point.y * 2,
        baseX: centerX + point.x * 2,
        baseY: centerY + point.y * 2,
        size: point.size,
        brightness: 0.8,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        hue: 270
    }));
};

// Orb Factory
const makeOrb = (config) => {
    const orb = {
        id: config.id,
        x: config.x || Math.random() * (window.innerWidth - 200) + 100,
        y: config.y || Math.random() * (window.innerHeight - 200) + 100,
        image: config.image,
        name: config.name,
        role: config.role,
        description: config.description,
        pulseIntensity: 0,
        pulseDirection: 1,
        element: null,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        hasMoved: false,
    };
    
    orb.element = createOrbElement(orb);
    return orb;
};

const createOrbElement = (orb) => {
    const orbDiv = document.createElement('div');
    orbDiv.className = 'space-orb';
    orbDiv.style.left = `${orb.x - 40}px`;
    orbDiv.style.top = `${orb.y - 40}px`;
    orbDiv.innerHTML = `
        <div class="orb-inner">
            <div class="orb-ring"></div>
            <img src="${orb.image}" alt="${orb.name}" class="orb-image" draggable="false">
        </div>
    `;
    
    attachOrbEvents(orbDiv, orb);
    document.body.appendChild(orbDiv);
    return orbDiv;
};

// Nebula Factory
const makeNebula = () => ({
    x: Math.random() * state.canvas.width,
    y: Math.random() * state.canvas.height,
    radius: Math.random() * 150 + 80,
    opacity: Math.random() * 0.015 + 0.005,
    hue: Math.random() * 40 + 250
});

// ShootingStar Factory
const makeShootingStar = () => ({
    x: Math.random() * state.canvas.width,
    y: 0,
    velocity: Math.random() * 10 + 5,
    length: Math.random() * 80 + 20,
    opacity: 1,
    decayRate: 0.01
});

// ============================================
// Update Functions
// ============================================

const updateStar = (star) => {
    // Twinkle animation
    star.brightness += star.twinkleSpeed;
    if (star.brightness > 1 || star.brightness < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed;
    }

    // Reset influences
    star.orbInfluence = 0;
    star.musicInfluence = 0;
    let totalDistortionX = 0;
    let totalDistortionY = 0;

    // Music influence
    if (state.musicConstellation && state.isPlaying && state.beatIntensity > 0) {
        const result = calculateMusicInfluence(star);
        star.musicInfluence = result.influence;
        totalDistortionX += result.distortionX;
        totalDistortionY += result.distortionY;
        star.cosmicHue = result.hue;
    }

    // Orb distortion
    const orbDistortion = calculateOrbDistortion(star);
    star.orbInfluence = orbDistortion.maxInfluence;
    totalDistortionX += orbDistortion.totalX;
    totalDistortionY += orbDistortion.totalY;

    // Apply distortion
    const smoothingFactor = 0.25;
    star.distortedX += (star.x + totalDistortionX - star.distortedX) * smoothingFactor;
    star.distortedY += (star.y + totalDistortionY - star.distortedY) * smoothingFactor;

    // Mouse interaction
    const mouseInteraction = calculateMouseInteraction(star);
    star.x += mouseInteraction.deltaX;
    star.y += mouseInteraction.deltaY;

    // Subtle drift
    const time = Date.now() * 0.00005 * star.speed;
    star.baseX += Math.sin(time) * 0.03;
    star.baseY += Math.cos(time) * 0.015;
};

const updateCosmicWave = (wave) => {
    wave.radius += wave.speed;
    wave.opacity *= 0.97;
    wave.hue += 1;
    return wave.radius < wave.maxRadius && wave.opacity > 0.01;
};

const updateMusicConstellation = (constellation) => {
    constellation.stars.forEach((star, index) => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0.3) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }

        if (state.isPlaying) {
            const musicOffset = Math.sin(Date.now() * 0.001 + index) * state.beatIntensity * 2;
            const danceOffset = Math.cos(Date.now() * 0.0015 + index * 0.5) * state.beatIntensity * 1.5;

            star.x = star.baseX + musicOffset;
            star.y = star.baseY + danceOffset;
            star.hue = 250 + Math.sin(state.colorPhase + index * 0.2) * 30;
        } else {
            star.x += (star.baseX - star.x) * 0.1;
            star.y += (star.baseY - star.y) * 0.1;
            star.hue = 270;
        }
    });
};

const updateOrb = (orb) => {
    orb.pulseIntensity += 0.02 * orb.pulseDirection;
    if (orb.pulseIntensity >= 1 || orb.pulseIntensity <= 0) {
        orb.pulseDirection *= -1;
    }
};

const updateShootingStar = (star) => {
    star.x -= star.velocity;
    star.y += star.velocity * 0.5;
    star.opacity -= star.decayRate;
    return star.opacity > 0;
};

// ============================================
// Calculation Functions
// ============================================

const calculateMusicInfluence = (star) => {
    const deltaX = star.x - state.musicConstellation.x;
    const deltaY = star.y - state.musicConstellation.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < CONFIG.MUSIC_INFLUENCE_RADIUS) {
        const influence = Math.pow((CONFIG.MUSIC_INFLUENCE_RADIUS - distance) / CONFIG.MUSIC_INFLUENCE_RADIUS, 1.5);
        const musicInfluence = influence * state.beatIntensity;

        const angle = Math.atan2(deltaY, deltaX);
        const time = Date.now() * 0.001;
        
        const spiralMove = Math.sin(time * 2 + star.cosmicPhase + distance * 0.01) * musicInfluence * 25;
        const pulseMove = Math.cos(time * 3 + star.pulsePhase) * musicInfluence * 20;
        const rotationAngle = time * 0.5 + distance * 0.005;
        
        return {
            influence: musicInfluence,
            distortionX: Math.cos(angle + rotationAngle) * spiralMove + Math.sin(angle) * pulseMove,
            distortionY: Math.sin(angle + rotationAngle) * spiralMove + Math.cos(angle) * pulseMove,
            hue: 240 + Math.sin(state.colorPhase + star.cosmicPhase) * 40 + musicInfluence * 30
        };
    }

    return { influence: 0, distortionX: 0, distortionY: 0, hue: star.cosmicHue };
};

const calculateOrbDistortion = (star) => {
    let totalX = 0;
    let totalY = 0;
    let maxInfluence = 0;

    state.orbs.forEach(orb => {
        const deltaX = star.x - orb.x;
        const deltaY = star.y - orb.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < CONFIG.ORB_DISTORTION_RADIUS && distance > 0) {
            const distortionForce = Math.pow((CONFIG.ORB_DISTORTION_RADIUS - distance) / CONFIG.ORB_DISTORTION_RADIUS, 2);
            const angle = Math.atan2(deltaY, deltaX);

            const radialStrength = distortionForce * CONFIG.ORB_DISTORTION_STRENGTH;
            totalX += Math.cos(angle) * radialStrength * 30;
            totalY += Math.sin(angle) * radialStrength * 30;

            maxInfluence = Math.max(maxInfluence, distortionForce * 0.5);
        }
    });

    return { totalX, totalY, maxInfluence };
};

const calculateMouseInteraction = (star) => {
    const deltaX = state.mousePosition.x - star.x;
    const deltaY = state.mousePosition.y - star.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < CONFIG.MOUSE_INFLUENCE_RADIUS) {
        const force = (CONFIG.MOUSE_INFLUENCE_RADIUS - distance) / CONFIG.MOUSE_INFLUENCE_RADIUS;
        return {
            deltaX: (deltaX * force) * 0.02,
            deltaY: (deltaY * force) * 0.02
        };
    } else {
        return {
            deltaX: (star.baseX - star.x) * 0.05,
            deltaY: (star.baseY - star.y) * 0.05
        };
    }
};

const simulateCosmicRhythm = () => {
    if (!state.isPlaying) {
        state.beatIntensity *= 0.92;
        return;
    }

    state.beatTime += 0.016;
    
    const pulse1 = Math.sin(state.beatTime * 2) * 0.5 + 0.5;
    const pulse2 = Math.sin(state.beatTime * 3.7 + Math.PI/3) * 0.5 + 0.5;
    const pulse3 = Math.sin(state.beatTime * 5.3 + Math.PI*2/3) * 0.5 + 0.5;
    
    state.beatIntensity = (pulse1 * 0.4 + pulse2 * 0.3 + pulse3 * 0.3) * state.currentVolume;
    state.beatIntensity = Math.min(1, state.beatIntensity * 1.2);
    
    state.colorPhase += 0.02;
    
    if (pulse1 > 0.8 && Math.random() < 0.2) {
        state.cosmicWaves.push(makeCosmicWave(
            state.musicConstellation.x,
            state.musicConstellation.y,
            state.beatIntensity
        ));
    }
    
    updateMiniVisualizer();
};

const checkMusicConstellationClick = (x, y) => {
    if (!state.musicConstellation) return false;
    const distance = Math.hypot(x - state.musicConstellation.x, y - state.musicConstellation.y);
    return distance < 60;
};

// ============================================
// Render Functions
// ============================================

const renderStar = (star) => {
    const { ctx } = state;
    ctx.save();
    
    const totalBrightness = star.brightness * (1 + star.orbInfluence * 0.5 + star.musicInfluence * 1.2);
    ctx.globalAlpha = Math.min(totalBrightness, 1);

    const renderX = star.distortedX;
    const renderY = star.distortedY;

    if (star.musicInfluence > 0.05) {
        renderCosmicHalo(renderX, renderY, star);
    } else {
        renderNormalHalo(renderX, renderY, star);
    }

    renderStarCore(renderX, renderY, star);
    
    ctx.restore();
};

const renderCosmicHalo = (x, y, star) => {
    const { ctx } = state;
    const haloSize = star.size * 6 * (1 + star.musicInfluence * 1.5);
    
    for (let i = 0; i < 2; i++) {
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, haloSize * (1 - i * 0.3)
        );

        const hue = star.cosmicHue + i * 20;
        const sat = 40 + star.musicInfluence * 30;
        
        gradient.addColorStop(0, `hsla(${hue}, ${sat}%, 70%, ${0.6 * (1 - i * 0.3)})`);
        gradient.addColorStop(0.3, `hsla(${hue + 20}, ${sat - 10}%, 50%, ${0.3 * (1 - i * 0.3)})`);
        gradient.addColorStop(0.6, `hsla(${hue + 40}, ${sat - 20}%, 40%, ${0.15 * (1 - i * 0.3)})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, haloSize * (1 - i * 0.3), 0, Math.PI * 2);
        ctx.fill();
    }

    if (star.musicInfluence > 0.3) {
        ctx.shadowBlur = 20 * star.musicInfluence;
        ctx.shadowColor = `hsla(${star.cosmicHue}, 50%, 60%, ${star.musicInfluence * 0.5})`;
    }
};

const renderNormalHalo = (x, y, star) => {
    const { ctx } = state;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 4);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.2)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, star.size * 4 * (1 + star.orbInfluence * 0.5), 0, Math.PI * 2);
    ctx.fill();
};

const renderStarCore = (x, y, star) => {
    const { ctx } = state;
    const coreSize = star.size * (1 + star.musicInfluence * 0.8 + star.orbInfluence * 0.3);
    
    if (star.musicInfluence > 0) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
        gradient.addColorStop(0, `hsla(${star.cosmicHue}, 30%, 95%, 1)`);
        gradient.addColorStop(0.7, `hsla(${star.cosmicHue}, 40%, 80%, 0.8)`);
        gradient.addColorStop(1, `hsla(${star.cosmicHue}, 50%, 70%, 0.6)`);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    }
    
    ctx.beginPath();
    ctx.arc(x, y, coreSize, 0, Math.PI * 2);
    ctx.fill();
};

const renderCosmicWave = (wave) => {
    const { ctx } = state;
    ctx.save();
    ctx.globalAlpha = wave.opacity * 0.3;
    
    const gradient = ctx.createRadialGradient(
        wave.x, wave.y, wave.radius * 0.8,
        wave.x, wave.y, wave.radius
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, `hsla(${wave.hue}, 60%, 50%, 0.3)`);
    gradient.addColorStop(1, `hsla(${wave.hue}, 40%, 30%, 0.1)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
};

const renderMusicConstellation = (constellation) => {
    const { ctx } = state;
    
    if (state.isPlaying && state.beatIntensity > 0.1) {
        renderMusicHalo(constellation);
    }

    renderMusicConnections(constellation);

    constellation.stars.forEach(star => {
        renderMusicStar(star);
    });
};

const renderMusicHalo = (constellation) => {
    const { ctx } = state;
    ctx.save();
    ctx.globalAlpha = state.beatIntensity * 0.15;
    
    const gradient = ctx.createRadialGradient(
        constellation.x, constellation.y, 0,
        constellation.x, constellation.y, CONFIG.MUSIC_COLOR_RADIUS
    );

    gradient.addColorStop(0, `hsla(${250 + Math.sin(state.colorPhase) * 20}, 50%, 50%, 0.2)`);
    gradient.addColorStop(0.5, `hsla(${270 + Math.sin(state.colorPhase) * 20}, 40%, 40%, 0.1)`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(constellation.x, constellation.y, CONFIG.MUSIC_COLOR_RADIUS * (1 + state.beatIntensity * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const renderMusicConnections = (constellation) => {
    const { ctx } = state;
    ctx.save();
    
    if (state.isPlaying) {
        ctx.strokeStyle = `hsla(${260 + Math.sin(state.colorPhase) * 20}, 50%, 60%, ${0.3 + state.beatIntensity * 0.2})`;
        ctx.shadowBlur = 5 + state.beatIntensity * 10;
        ctx.shadowColor = `hsla(${260}, 50%, 50%, ${state.beatIntensity * 0.5})`;
    } else {
        ctx.strokeStyle = `rgba(155, 135, 245, 0.3)`;
    }
    
    ctx.lineWidth = 1 + state.beatIntensity;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        ctx.moveTo(constellation.stars[i].x, constellation.stars[i].y);
        ctx.lineTo(constellation.stars[next].x, constellation.stars[next].y);
    }
    for (let i = 8; i < constellation.stars.length - 1; i++) {
        ctx.moveTo(constellation.stars[i].x, constellation.stars[i].y);
        ctx.lineTo(constellation.stars[i + 1].x, constellation.stars[i + 1].y);
    }
    ctx.stroke();
    ctx.restore();
};

const renderMusicStar = (star) => {
    const { ctx } = state;
    const gradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * 6
    );

    if (state.isPlaying) {
        gradient.addColorStop(0, `hsla(${star.hue}, 40%, 70%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${star.hue}, 30%, 50%, 0.4)`);
    } else {
        gradient.addColorStop(0, 'rgba(155, 135, 245, 0.7)');
        gradient.addColorStop(0.5, 'rgba(110, 95, 200, 0.3)');
    }
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.globalAlpha = star.brightness;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.isPlaying 
        ? `hsla(${star.hue}, 30%, 85%, 0.95)`
        : 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
};

const renderNebula = (nebula) => {
    const { ctx } = state;
    ctx.save();
    const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
    );
    gradient.addColorStop(0, `hsla(${nebula.hue}, 60%, 35%, ${nebula.opacity})`);
    gradient.addColorStop(0.5, `hsla(${nebula.hue}, 50%, 25%, ${nebula.opacity * 0.5})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const renderShootingStar = (star) => {
    const { ctx } = state;
    ctx.save();
    ctx.globalAlpha = star.opacity;

    const gradient = ctx.createLinearGradient(
        star.x, star.y,
        star.x + star.length, star.y - star.length * 0.5
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(star.x + star.length, star.y - star.length * 0.5);
    ctx.stroke();

    ctx.restore();
};

const renderConstellations = () => {
    const { ctx, stars, mousePosition } = state;
    const nearbyStars = [];

    stars.forEach(star => {
        const distToMouse = Math.hypot(star.distortedX - mousePosition.x, star.distortedY - mousePosition.y);
        if (distToMouse < CONFIG.MOUSE_INFLUENCE_RADIUS * 1.5) {
            nearbyStars.push(star);
        }
    });

    for (let i = 0; i < nearbyStars.length; i++) {
        for (let j = i + 1; j < nearbyStars.length; j++) {
            const deltaX = nearbyStars[i].distortedX - nearbyStars[j].distortedX;
            const deltaY = nearbyStars[i].distortedY - nearbyStars[j].distortedY;
            const distance = Math.hypot(deltaX, deltaY);

            if (distance < CONFIG.CONSTELLATION_DISTANCE) {
                ctx.save();
                const opacity = (1 - distance / CONFIG.CONSTELLATION_DISTANCE) * 0.2 * nearbyStars[i].brightness;
                
                if (state.isPlaying && (nearbyStars[i].musicInfluence > 0 || nearbyStars[j].musicInfluence > 0)) {
                    const avgHue = (nearbyStars[i].cosmicHue + nearbyStars[j].cosmicHue) / 2;
                    ctx.strokeStyle = `hsla(${avgHue}, 40%, 60%, ${opacity})`;
                } else {
                    ctx.strokeStyle = `rgba(155, 135, 245, ${opacity})`;
                }
                
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(nearbyStars[i].distortedX, nearbyStars[i].distortedY);
                ctx.lineTo(nearbyStars[j].distortedX, nearbyStars[j].distortedY);
                ctx.stroke();
                ctx.restore();
            }
        }
    }
};

// ============================================
// UI Control Functions
// ============================================

const loadYouTube = () => {
    const input = document.getElementById('youtubeUrl');
    const videoId = input.value.trim();
    
    if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0`;
        state.youtubeIframe.src = embedUrl;
        document.getElementById('trackName').textContent = 'YouTube - ' + videoId;
        state.isPlaying = true;
        document.getElementById('playBtn').textContent = '❚❚';
        document.getElementById('musicToggleBtn').classList.add('playing');
    }
};

const togglePlay = () => {
    if (state.youtubeIframe.src) {
        state.isPlaying = !state.isPlaying;
        if (state.isPlaying) {
            document.getElementById('playBtn').textContent = '❚❚';
            document.getElementById('musicToggleBtn').classList.add('playing');
        } else {
            document.getElementById('playBtn').textContent = '▶';
            document.getElementById('musicToggleBtn').classList.remove('playing');
        }
    } else {
        document.getElementById('youtubeUrl').focus();
    }
};

const toggleMute = () => {
    state.isMuted = !state.isMuted;
    const btn = event.currentTarget;
    btn.textContent = state.isMuted ? '🔇' : '🔊';
};

const toggleMusicBar = () => {
    const player = document.getElementById('musicPlayerExpanded');
    state.isMusicBarOpen = !state.isMusicBarOpen;
    if (state.isMusicBarOpen) {
        player.classList.add('active');
    } else {
        player.classList.remove('active');
    }
};

const toggleContact = () => {
    const form = document.getElementById('contactForm');
    form.classList.toggle('active');
};

const startVolumeChange = (event) => {
    state.isDraggingVolume = true;
    updateVolume(event);

    const mouseMoveHandler = (e) => updateVolume(e);
    const mouseUpHandler = () => {
        state.isDraggingVolume = false;
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

const updateVolume = (event) => {
    const volumeBar = document.querySelector('.volume-slider');
    const rect = volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    
    state.currentVolume = percent;
    document.getElementById('volumeFill').style.width = `${percent * 100}%`;
};

const updateMiniVisualizer = () => {
    const bars = document.querySelectorAll('.mini-bar');
    if (!state.isPlaying) {
        bars.forEach(bar => bar.style.height = '3px');
        return;
    }

    bars.forEach((bar, index) => {
        const offset = index * 0.3;
        const intensity = Math.sin(state.beatTime * (3 + index * 1.5) + offset) * 0.5 + 0.5;
        const height = 3 + intensity * 17 * state.currentVolume;
        bar.style.height = `${height}px`;
    });
};

// ============================================
// Orb Management Functions
// ============================================

const attachOrbEvents = (element, orb) => {
    element.addEventListener('mousedown', (e) => startOrbDrag(e, orb));
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!orb.hasMoved) {
            toggleOrbInfo(orb);
        }
    });
};

const startOrbDrag = (e, orb) => {
    e.stopPropagation();
    orb.hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;
    orb.dragOffset.x = startX - orb.x;
    orb.dragOffset.y = startY - orb.y;

    const mouseMoveHandler = (e) => {
        const deltaX = Math.abs(e.clientX - startX);
        const deltaY = Math.abs(e.clientY - startY);

        if (deltaX > 5 || deltaY > 5) {
            orb.hasMoved = true;
            if (state.currentOpenOrb === orb) {
                closeOrbInfo();
            }
        }

        orb.x = e.clientX - orb.dragOffset.x;
        orb.y = e.clientY - orb.dragOffset.y;
        orb.element.style.left = `${orb.x - 40}px`;
        orb.element.style.top = `${orb.y - 40}px`;
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
};

const toggleOrbInfo = (orb) => {
    if (state.currentOpenOrb === orb) {
        closeOrbInfo();
    } else {
        showOrbInfo(orb);
    }
};

const showOrbInfo = (orb) => {
    const panel = document.getElementById('orbInfoPanel');
    const avatar = document.getElementById('orbInfoAvatar');
    const name = document.getElementById('orbInfoName');
    const role = document.getElementById('orbInfoRole');
    const description = document.getElementById('orbInfoDescription');

    avatar.src = orb.image;
    name.textContent = orb.name;
    role.textContent = orb.role;
    description.textContent = orb.description;

    const panelWidth = 320;
    let panelX = orb.x + 60;
    let panelY = orb.y - 50;

    if (panelX + panelWidth > window.innerWidth - 32) {
        panelX = orb.x - panelWidth - 60;
    }
    if (panelY < 32) {
        panelY = 32;
    }

    panel.style.left = `${panelX}px`;
    panel.style.top = `${panelY}px`;
    panel.classList.add('active');

    state.currentOpenOrb = orb;
};

const closeOrbInfo = () => {
    const panel = document.getElementById('orbInfoPanel');
    panel.classList.remove('active');
    state.currentOpenOrb = null;
};

// ============================================
// Event Handlers
// ============================================

const handleResize = () => {
    initCanvas();
    initStars();
};

const handleMouseMove = (event) => {
    state.mousePosition.x = event.clientX;
    state.mousePosition.y = event.clientY;

    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow) {
        cursorGlow.style.left = event.clientX + 'px';
        cursorGlow.style.top = event.clientY + 'px';
    }
};

const handleCanvasClick = (event) => {
    if (checkMusicConstellationClick(event.clientX, event.clientY)) {
        toggleMusicBar();
    }
};

const handleGlobalClick = (event) => {
    if (event.target.closest('.music-container')) {
        return;
    }

    if (checkMusicConstellationClick(event.clientX, event.clientY)) {
        toggleMusicBar();
        return;
    }

    const panel = document.getElementById('orbInfoPanel');
    const isClickOnPanel = panel.contains(event.target);
    const isClickOnOrb = event.target.closest('.space-orb');

    if (!isClickOnPanel && !isClickOnOrb && state.currentOpenOrb) {
        closeOrbInfo();
    }
};

const handleNavClick = (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    e.currentTarget.classList.add('active');
};

// ============================================
// Initialization Functions
// ============================================

const initCanvas = () => {
    state.canvas.width = window.innerWidth;
    state.canvas.height = window.innerHeight;
};

const initStars = () => {
    state.stars = [];
    state.nebulae = [];
    state.cosmicWaves = [];
    
    const starCount = Math.floor((state.canvas.width * state.canvas.height) / CONFIG.STAR_DENSITY);

    for (let i = 0; i < 4; i++) {
        state.nebulae.push(makeNebula());
    }

    for (let i = 0; i < starCount; i++) {
        state.stars.push(makeStar(
            Math.random() * state.canvas.width,
            Math.random() * state.canvas.height,
            Math.random() * 1.2 + 0.3,
            Math.random() * 2 + 1
        ));
    }

    state.musicConstellation = makeMusicConstellation();
};

const initOrbs = () => {
    state.orbs.push(makeOrb({
        id: 'discord',
        image: 'https://cdn.discordapp.com/embed/avatars/0.png',
        name: 'Waples',
        role: 'Founder',
        description: 'Pioneering the digital cosmos, one nebula at a time. Building bridges between worlds in the vast network of stars.',
        x: window.innerWidth * 0.25,
        y: window.innerHeight * 0.3
    }));

    state.orbs.push(makeOrb({
        id: 'team1',
        image: 'https://cdn.discordapp.com/embed/avatars/1.png',
        name: 'Nebula',
        role: 'Developer',
        description: 'Crafting stellar experiences in the void. Specializing in quantum computing and interdimensional protocols.',
        x: window.innerWidth * 0.7,
        y: window.innerHeight * 0.6
    }));
};

// ============================================
// Main Loop
// ============================================

const animate = () => {
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

    simulateCosmicRhythm();

    state.nebulae.forEach(nebula => renderNebula(nebula));

    state.cosmicWaves = state.cosmicWaves.filter(wave => {
        const isAlive = updateCosmicWave(wave);
        if (isAlive) renderCosmicWave(wave);
        return isAlive;
    });

    state.orbs.forEach(orb => updateOrb(orb));

    if (state.musicConstellation) {
        updateMusicConstellation(state.musicConstellation);
    }

    state.stars.forEach(star => {
        updateStar(star);
        renderStar(star);
    });

    if (state.musicConstellation) {
        renderMusicConstellation(state.musicConstellation);
    }

    renderConstellations();

    if (Math.random() < CONFIG.SHOOTING_STAR_CHANCE) {
        state.shootingStars.push(makeShootingStar());
    }

    state.shootingStars = state.shootingStars.filter(star => {
        const isAlive = updateShootingStar(star);
        if (isAlive) renderShootingStar(star);
        return isAlive;
    });

    state.animationId = requestAnimationFrame(animate);
};

// ============================================
// Main Initialization
// ============================================

const init = () => {
    // Initialize DOM references
    state.canvas = document.getElementById('starfield-canvas');
    state.ctx = state.canvas.getContext('2d');
    state.youtubeIframe = document.getElementById('youtube-iframe');

    initCanvas();
    initStars();
    initOrbs();
    animate();

    // Initialize volume
    document.getElementById('volumeFill').style.width = `${state.currentVolume * 100}%`;

    // Attach event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    state.canvas.addEventListener('click', handleCanvasClick);
    document.addEventListener('click', handleGlobalClick);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavClick);
    });

    // Make functions globally available for onclick handlers in HTML
    window.toggleMusicBar = toggleMusicBar;
    window.togglePlay = togglePlay;
    window.toggleMute = toggleMute;
    window.startVolumeChange = startVolumeChange;
    window.loadYouTube = loadYouTube;
    window.toggleContact = toggleContact;
    window.closeOrbInfo = closeOrbInfo;
};

const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    state.canvas.removeEventListener('click', handleCanvasClick);
    document.removeEventListener('click', handleGlobalClick);
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
    }
};

// Start the application
init();

// Cleanup on unload
window.addEventListener('beforeunload', cleanup);