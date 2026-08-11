import * as THREE from 'three';

/**
 * Función que inicializa la escena.
 * @param {string} elementId - El ID del div donde se meterá el 3D.
 * @param {object} options - Parámetros personalizables (color, etc.)
 */
export function crearCuboDatusa(elementId, options = {}) {
    const container = document.getElementById(elementId);
    if (!container) return;

    // 1. Escena y Cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    // 2. Renderer (Transparente para que no tape el diseño 2D)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Un Cubo Simple
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: options.color || 0x00f2ff,
        wireframe: true 
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 4. Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 5. Animación
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    // 6. Responsive (Se adapta al tamaño del DIV del diseñador)
    const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    animate();
}