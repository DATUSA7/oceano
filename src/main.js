import './style.css';

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';


// ============================================================
// CONFIGURACIÓN RESPONSIVE
// ============================================================

function getDeviceType() {

    const width = window.innerWidth;

    if (width <= 480) {
        return 'mobile';
    }

    if (width <= 768) {
        return 'tablet';
    }

    return 'desktop';
}


let deviceType = getDeviceType();


// ============================================================
// VARIABLES
// ============================================================

let scene;
let camera;
let renderer;
let composer;

let water;
let moon;

let particles;

let initialPositions;
let targetPositions;


// ============================================================
// PARTÍCULAS RESPONSIVE
// ============================================================

function getParticleCount() {

    if (deviceType === 'mobile') {
        return 7000;
    }

    if (deviceType === 'tablet') {
        return 10000;
    }

    return 15000;
}


let PARTICLE_COUNT = getParticleCount();


// ============================================================
// INTERACCIÓN
// ============================================================

const mouse = new THREE.Vector2(-999, -999);


// ============================================================
// RELOJ
// ============================================================

const clock = new THREE.Clock();


// ============================================================
// INICIAR
// ============================================================

init();
animate();


// ============================================================
// INIT
// ============================================================

function init() {


    // ========================================================
    // CANVAS
    // ========================================================

    const canvas =
        document.getElementById(
            'services-canvas'
        );


    if (!canvas) {

        console.error(
            'No se encontró el canvas #services-canvas'
        );

        return;
    }


    // ========================================================
    // CONTENEDOR
    // ========================================================

    const container =
        document.querySelector(
            '.canvas-container'
        );


    if (!container) {

        console.error(
            'No se encontró .canvas-container'
        );

        return;
    }


    // ========================================================
    // ESCENA
    // ========================================================

    scene =
        new THREE.Scene();


    // ========================================================
    // CÁMARA
    // ========================================================

    const width =
        container.clientWidth ||
        window.innerWidth;


    const height =
        container.clientHeight ||
        window.innerHeight;


    const fov =
        deviceType === 'mobile'
            ? 60
            : 55;


    camera =
        new THREE.PerspectiveCamera(

            fov,

            width / height,

            1,

            20000
        );


    // Posición inicial
    setCameraPosition();


    // ========================================================
    // RENDERER
    // ========================================================

    renderer =
        new THREE.WebGLRenderer({

            canvas: canvas,

            antialias: true,

            powerPreference: 'high-performance'
        });


    // Pixel Ratio
    setPixelRatio();


    // Tamaño
    renderer.setSize(
        width,
        height
    );


    // Tone Mapping
    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1;


    // ========================================================
    // POSTPROCESADO
    // ========================================================

    composer =
        new EffectComposer(
            renderer
        );


    const renderPass =
        new RenderPass(
            scene,
            camera
        );


    composer.addPass(
        renderPass
    );


    // Bloom
    const bloomStrength =
        deviceType === 'mobile'
            ? 0.06
            : deviceType === 'tablet'
                ? 0.08
                : 0.10;


    const bloomPass =
        new UnrealBloomPass(

            new THREE.Vector2(
                width,
                height
            ),

            bloomStrength,

            0.4,

            0.85
        );


    composer.addPass(
        bloomPass
    );


    // ========================================================
    // OCÉANO
    // ========================================================

    createWater();


    // ========================================================
    // LUNA
    // ========================================================

    createMoon();


    // ========================================================
    // PARTÍCULAS
    // ========================================================

    setupParticles();


    // ========================================================
    // CONTROLES
    // ========================================================

    const controls =
        new OrbitControls(
            camera,
            renderer.domElement
        );


    // Suavidad
    controls.enableDamping =
        true;


    controls.dampingFactor =
        0.05;


    // No desplazar la escena
    controls.enablePan =
        false;


    // Velocidad de rotación
    controls.rotateSpeed =
        deviceType === 'mobile'
            ? 0.4
            : 0.5;


    // Velocidad zoom
    controls.zoomSpeed =
        deviceType === 'mobile'
            ? 0.5
            : 0.7;


    // Límites
    controls.minDistance =
        120;


    controls.maxDistance =
        500;


    // Rotación vertical
    controls.minPolarAngle =
        THREE.MathUtils.degToRad(
            15
        );


    controls.maxPolarAngle =
        Math.PI * 0.495;


    // Centro
    controls.target.set(
        0,
        10,
        0
    );


    controls.update();


    // ========================================================
    // EVENTOS
    // ========================================================

    window.addEventListener(
        'resize',
        onWindowResize
    );


    window.addEventListener(
        'mousemove',
        onMouseMove
    );


    window.addEventListener(
        'touchstart',
        onTouchMove,
        { passive: true }
    );


    window.addEventListener(
        'touchmove',
        onTouchMove,
        { passive: true }
    );


    window.addEventListener(
        'touchend',
        onTouchEnd,
        { passive: true }
    );


    // Primer ajuste
    onWindowResize();
}


// ============================================================
// POSICIÓN DE CÁMARA
// ============================================================

function setCameraPosition() {

    if (deviceType === 'mobile') {

        camera.position.set(
            0,
            45,
            240
        );

    } else if (deviceType === 'tablet') {

        camera.position.set(
            0,
            42,
            220
        );

    } else {

        camera.position.set(
            0,
            40,
            200
        );
    }
}


// ============================================================
// PIXEL RATIO
// ============================================================

function setPixelRatio() {

    const maxPixelRatio =
        deviceType === 'mobile'
            ? 1.5
            : 2;


    renderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            maxPixelRatio
        )
    );
}


// ============================================================
// CREAR AGUA
// ============================================================

function createWater() {

    const textureSize =
        deviceType === 'mobile'
            ? 256
            : deviceType === 'tablet'
                ? 384
                : 512;


    const waterGeometry =
        new THREE.PlaneGeometry(
            10000,
            10000
        );


    const textureLoader =
        new THREE.TextureLoader();


    const waterNormals =
        textureLoader.load(

            '/textures/waternormals.jpg',

            function (texture) {

                texture.wrapS =
                    texture.wrapT =
                    THREE.RepeatWrapping;
            }
        );


    water =
        new Water(

            waterGeometry,

            {

                textureWidth:
                    textureSize,

                textureHeight:
                    textureSize,

                waterNormals:
                    waterNormals,

                sunDirection:
                    new THREE.Vector3(),

                sunColor:
                    0xffffff,

                waterColor:
                    0x001e0f,

                distortionScale:
                    3.7
            }
        );


    water.rotation.x =
        -Math.PI / 2;


    scene.add(
        water
    );
}


// ============================================================
// CREAR LUNA
// ============================================================

function createMoon() {

    const textureLoader =
        new THREE.TextureLoader();


    const moonTexture =
        textureLoader.load(
            '/textures/8k_moon.jpg'
        );


    moon =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                100,
                32,
                32
            ),

            new THREE.MeshStandardMaterial({

                map:
                    moonTexture,

                emissive:
                    new THREE.Color(
                        0x87CEEB
                    ),

                emissiveMap:
                    moonTexture
            })
        );


    moon.position.set(
        0,
        120,
        -500
    );


    scene.add(
        moon
    );


    // Dirección de iluminación
    water.material
        .uniforms[
            'sunDirection'
        ]
        .value
        .copy(
            moon.position
        )
        .normalize();
}


// ============================================================
// MOUSE
// ============================================================

function onMouseMove(event) {

    mouse.x =
        (event.clientX /
            window.innerWidth) *
        2 - 1;


    mouse.y =
        -(event.clientY /
            window.innerHeight) *
        2 + 1;
}


// ============================================================
// TOUCH
// ============================================================

function onTouchMove(event) {

    if (
        !event.touches ||
        event.touches.length === 0
    ) {
        return;
    }


    const touch =
        event.touches[0];


    mouse.x =
        (touch.clientX /
            window.innerWidth) *
        2 - 1;


    mouse.y =
        -(touch.clientY /
            window.innerHeight) *
        2 + 1;
}


// ============================================================
// FIN TOUCH
// ============================================================

function onTouchEnd() {

    mouse.set(
        -999,
        -999
    );
}


// ============================================================
// PARTÍCULAS
// ============================================================

function setupParticles() {

    const textPoints =
        sampleTextToPoints(
            'DATUSA'
        );


    const geometry =
        new THREE.BufferGeometry();


    const positions =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const colors =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    initialPositions =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    targetPositions =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const colorPalette = [

        new THREE.Color(
            0x87ceeb
        ),

        new THREE.Color(
            0xff69b4
        ),

        new THREE.Color(
            0x00ffff
        ),

        new THREE.Color(
            0xffffff
        )
    ];


    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {

        const i3 =
            i * 3;


        // -----------------------------------------------
        // POSICIÓN INICIAL
        // -----------------------------------------------

        initialPositions[i3] =
            (Math.random() - 0.5) *
            1000;


        initialPositions[i3 + 1] =
            200 +
            Math.random() * 200;


        initialPositions[i3 + 2] =
            -400 +
            (Math.random() - 0.5) *
            200;


        // -----------------------------------------------
        // POSICIÓN FINAL
        // -----------------------------------------------

        const point =
            textPoints[
                i %
                textPoints.length
            ];


        targetPositions[i3] =
            point.x * 0.8;


        targetPositions[i3 + 1] =
            point.y * 0.8 +
            120;


        targetPositions[i3 + 2] =
            -350;


        // -----------------------------------------------
        // COLOR
        // -----------------------------------------------

        const color =
            colorPalette[
                Math.floor(
                    Math.random() *
                    colorPalette.length
                )
            ];


        colors[i3] =
            color.r;


        colors[i3 + 1] =
            color.g;


        colors[i3 + 2] =
            color.b;


        // Posición inicial
        positions[i3] =
            initialPositions[i3];


        positions[i3 + 1] =
            initialPositions[i3 + 1];


        positions[i3 + 2] =
            initialPositions[i3 + 2];
    }


    geometry.setAttribute(

        'position',

        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    geometry.setAttribute(

        'color',

        new THREE.BufferAttribute(
            colors,
            3
        )
    );


    // Tamaño de partículas
    const particleSize =
        deviceType === 'mobile'
            ? 0.9
            : 0.7;


    const material =
        new THREE.PointsMaterial({

            size:
                particleSize,

            vertexColors:
                true,

            transparent:
                true,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false
        });


    particles =
        new THREE.Points(
            geometry,
            material
        );


    scene.add(
        particles
    );
}


// ============================================================
// TEXTO → PUNTOS
// ============================================================

function sampleTextToPoints(text) {

    const canvas =
        document.createElement(
            'canvas'
        );


    const ctx =
        canvas.getContext(
            '2d'
        );


    const fontSize = 100;


    ctx.font =
        `bold ${fontSize}px Arial`;


    const metrics =
        ctx.measureText(text);


    canvas.width =
        Math.ceil(
            metrics.width
        );


    canvas.height =
        fontSize * 1.2;


    ctx.font =
        `bold ${fontSize}px Arial`;


    ctx.fillStyle =
        'white';


    ctx.fillText(
        text,
        0,
        fontSize
    );


    const data =
        ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;


    const points = [];


    for (
        let y = 0;
        y < canvas.height;
        y += 2
    ) {

        for (
            let x = 0;
            x < canvas.width;
            x += 2
        ) {

            const alpha =
                data[
                    (
                        y *
                        canvas.width +
                        x
                    ) * 4 + 3
                ];


            if (
                alpha > 128
            ) {

                points.push({

                    x:
                        x -
                        canvas.width / 2,

                    y:
                        -y +
                        canvas.height / 2
                });
            }
        }
    }


    return points;
}


// ============================================================
// RESIZE
// ============================================================

function onWindowResize() {

    const container =
        document.querySelector(
            '.canvas-container'
        );


    const width =
        container.clientWidth ||
        window.innerWidth;


    const height =
        container.clientHeight ||
        window.innerHeight;


    // Detectar dispositivo
    const newDeviceType =
        getDeviceType();


    // Actualizar tipo de dispositivo
    if (
        newDeviceType !==
        deviceType
    ) {

        deviceType =
            newDeviceType;

        setCameraPosition();

        PARTICLE_COUNT =
            getParticleCount();
    }


    // Cámara
    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();


    // Renderer
    renderer.setSize(
        width,
        height
    );


    // Pixel Ratio
    setPixelRatio();


    // Composer
    composer.setSize(
        width,
        height
    );
}


// ============================================================
// ANIMACIÓN
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // ========================================================
    // LUNA
    // ========================================================

    if (moon) {

        moon.rotation.y +=
            0.002;
    }


    // ========================================================
    // TIEMPO
    // ========================================================

    const elapsedTime =
        clock.getElapsedTime();


    // ========================================================
    // AGUA
    // ========================================================

    if (water) {

        water.material
            .uniforms['time']
            .value +=
            1.0 / 60.0;
    }


    // ========================================================
    // PARTÍCULAS
    // ========================================================

    if (particles) {

        const posAttr =
            particles
                .geometry
                .attributes
                .position
                .array;


        // ----------------------------------------------------
        // TRANSICIÓN
        // ----------------------------------------------------

        const progress =
            Math.sin(
                elapsedTime * 0.3
            ) *
            0.5 +
            0.5;


        // ----------------------------------------------------
        // MOUSE / TOUCH
        // ----------------------------------------------------

        const mouseX =
            mouse.x * 200;


        const mouseY =
            mouse.y * 100 +
            100;


        const mouseZ =
            -350;


        // ----------------------------------------------------
        // INTERACCIÓN
        // ----------------------------------------------------

        const interactionRadius =
            deviceType === 'mobile'
                ? 45
                : 50;


        const interactionStrength =
            deviceType === 'mobile'
                ? 16
                : 20;


        // ----------------------------------------------------
        // PARTICULAS
        // ----------------------------------------------------

        for (
            let i = 0;
            i < PARTICLE_COUNT;
            i++
        ) {

            const i3 =
                i * 3;


            // Interpolación
            let x =
                THREE.MathUtils.lerp(

                    initialPositions[i3],

                    targetPositions[i3],

                    progress
                );


            let y =
                THREE.MathUtils.lerp(

                    initialPositions[i3 + 1],

                    targetPositions[i3 + 1],

                    progress
                );


            let z =
                THREE.MathUtils.lerp(

                    initialPositions[i3 + 2],

                    targetPositions[i3 + 2],

                    progress
                );


            // ------------------------------------------------
            // INTERACCIÓN
            // ------------------------------------------------

            if (
                mouse.x > -2 &&
                mouse.x < 2
            ) {

                const dx =
                    x -
                    mouseX;


                const dy =
                    y -
                    mouseY;


                const dz =
                    z -
                    mouseZ;


                const distSquared =
                    dx * dx +
                    dy * dy +
                    dz * dz;


                const radiusSquared =
                    interactionRadius *
                    interactionRadius;


                if (
                    distSquared <
                    radiusSquared
                ) {

                    const dist =
                        Math.sqrt(
                            distSquared
                        );


                    const force =
                        (
                            1 -
                            dist /
                            interactionRadius
                        ) *
                        interactionStrength;


                    const invDist =
                        1 /
                        Math.max(
                            dist,
                            0.001
                        );


                    x +=
                        dx *
                        invDist *
                        force;


                    y +=
                        dy *
                        invDist *
                        force;


                    z +=
                        dz *
                        invDist *
                        force;
                }
            }


            // Actualizar posición
            posAttr[i3] =
                x;


            posAttr[i3 + 1] =
                y;


            posAttr[i3 + 2] =
                z;
        }


        particles
            .geometry
            .attributes
            .position
            .needsUpdate =
            true;
    }


    // ========================================================
    // RENDER
    // ========================================================

    composer.render();
}