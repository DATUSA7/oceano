import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// === CONFIGURACIÓN ===
let scene, camera, renderer, water, moon, composer;
let particles, initialPositions, targetPositions, particlesCoords;
const PARTICLE_COUNT = 15000;
const mouse = new THREE.Vector2(-999, -999);
const clock = new THREE.Clock();

init();
animate();

function init() {
    // 1. ESCENA Y CÁMARA
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(0, 40, 200);

    // 2. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);

    // 3. POST-PROCESADO (BLOOM para que las partículas brillen)
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // Intensidad del brillo
        0.4, // Radio
        0.85 // Umbral
    );
    composer.addPass(bloomPass);

    // 4. OCÉANO
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    water = new Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
    });
    water.rotation.x = - Math.PI / 2;
    scene.add(water);

    // 5. LUNA
    const moonGeo = new THREE.SphereGeometry(10, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, 100, -500);
    scene.add(moon);
    water.material.uniforms['sunDirection'].value.copy(moon.position).normalize();

    // 6. SISTEMA DE PARTÍCULAS "DATUSA"
    setupParticles();

    // 7. CONTROLES Y EVENTOS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
}

function setupParticles() {
    const textPoints = sampleTextToPoints('DATUSA');
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    initialPositions = new Float32Array(PARTICLE_COUNT * 3);
    targetPositions = new Float32Array(PARTICLE_COUNT * 3);

    const colorPalette = [new THREE.Color(0x87ceeb), new THREE.Color(0xff69b4), new THREE.Color(0x00ffff), new THREE.Color(0xffffff)];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Posición Inicial: Dispersas en el cielo como estrellas
        initialPositions[i3] = (Math.random() - 0.5) * 1000;
        initialPositions[i3 + 1] = 200 + Math.random() * 200;
        initialPositions[i3 + 2] = -400 + (Math.random() - 0.5) * 200;

        // Posición Objetivo: Formando la palabra
        const point = textPoints[i % textPoints.length];
        targetPositions[i3] = point.x * 0.8; // Escala del texto
        targetPositions[i3 + 1] = point.y * 0.8 + 120; // Elevación sobre el mar
        targetPositions[i3 + 2] = -350; // Profundidad

        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function sampleTextToPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 100;
    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    canvas.width = Math.ceil(metrics.width);
    canvas.height = fontSize * 1.2;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText(text, 0, fontSize);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const points = [];
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            if (data[(y * canvas.width + x) * 4 + 3] > 128) {
                points.push({ x: x - canvas.width / 2, y: -y + canvas.height / 2 });
            }
        }
    }
    return points;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    const waterTime = elapsedTime;
    
    // 1. Animación del Agua
    water.material.uniforms['time'].value += 1.0 / 60.0;

    // 2. Animación de Partículas (Lerp + Mouse)
    if (particles) {
        const posAttr = particles.geometry.attributes.position.array;
        // El progreso va de 0 (estrellas) a 1 (palabra) de forma cíclica
        const progress = Math.sin(elapsedTime * 0.3) * 0.5 + 0.5;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;

            // Interpolación base
            let x = THREE.MathUtils.lerp(initialPositions[i3], targetPositions[i3], progress);
            let y = THREE.MathUtils.lerp(initialPositions[i3 + 1], targetPositions[i3 + 1], progress);
            let z = THREE.MathUtils.lerp(initialPositions[i3 + 2], targetPositions[i3 + 2], progress);

            // Interacción con mouse (proyectada simplificada)
            const mouse3D = new THREE.Vector3(mouse.x * 200, mouse.y * 100 + 100, -350);
            const pPos = new THREE.Vector3(x, y, z);
            const dist = pPos.distanceTo(mouse3D);

            if (dist < 50) {
                const force = (1 - dist / 50) * 20;
                const dir = pPos.sub(mouse3D).normalize().multiplyScalar(force);
                x += dir.x;
                y += dir.y;
                z += dir.z;
            }

            posAttr[i3] = x;
            posAttr[i3 + 1] = y;
            posAttr[i3 + 2] = z;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }

    // Renderizado con Bloom
    composer.render();
}