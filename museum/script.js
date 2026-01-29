import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
const objects = [];
let raycaster;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// DOM Elements
const instructions = document.getElementById('instructions');
const infoPanel = document.getElementById('info-panel');
const artTitle = document.getElementById('art-title');
const artDesc = document.getElementById('art-desc');

init();
animate();

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 750);

    // Light
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    scene.add(light);

    // Spotlights for drama
    const spotLight = new THREE.SpotLight(0xffffff, 50);
    spotLight.position.set(0, 50, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 1;
    scene.add(spotLight);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // Controls
    controls = new PointerLockControls(camera, document.body);

    instructions.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
        infoPanel.style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        instructions.style.display = 'flex';
    });

    scene.add(controls.getObject());

    // Input
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = true; break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': moveRight = false; break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Raycaster (Interaction)
    raycaster = new THREE.Raycaster();
    document.addEventListener('click', onClick);


    // --- World Building ---

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Grid Helper
    // const grid = new THREE.GridHelper(200, 20, 0x000000, 0x444444);
    // scene.add(grid);

    // Create Artworks
    createArtwork(0, 15, -40, 0, 0xef9a9a, "ECサイト構築", "AIを活用した革新的なEコマースソリューション。");
    createArtwork(40, 15, 0, -Math.PI / 2, 0x90caf9, "企業サイト", "高パフォーマンスでモダンなコーポレートサイト。");
    createArtwork(-40, 15, 0, Math.PI / 2, 0xa5d6a7, "保有スキル", "JavaScript, Three.js, React, Node.js など。");
    createArtwork(0, 15, 40, Math.PI, 0xffcc80, "お問い合わせ", "ご連絡はこちらまで: hello@example.com");

    // Renderer
    try {
        renderer = new THREE.WebGLRenderer({ antialias: false });
    } catch (e) {
        alert("WebGLがサポートされていないか、有効になっていません。\nブラウザの設定を確認してください。");
        return;
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function createArtwork(x, y, z, rotY, color, title, description) {
    // Frame
    const frameGeo = new THREE.BoxGeometry(22, 17, 1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    scene.add(frame);

    // Canvas (The "Art")
    const artGeo = new THREE.PlaneGeometry(20, 15);
    const artMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
    });
    // Create texture from canvas for text?
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(50, 150, 412, 84);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 192);

    const texture = new THREE.CanvasTexture(canvas);
    artMat.map = texture;

    const artwork = new THREE.Mesh(artGeo, artMat);
    // Position slightly in front of frame
    artwork.position.z = 0.6;
    frame.add(artwork); // Attach to frame

    // Store metadata for interaction
    artwork.userData = { isArt: true, title: title, description: description };
    // Make sure the artwork mesh itself is in the interactable objects list (or check parent)
    // We'll raycast against artwork
    objects.push(artwork);

    // Spotlight for this art
    const spot = new THREE.SpotLight(0xffffff, 100);
    // Relative position
    const offsetVector = new THREE.Vector3(0, 20, 20);
    offsetVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    spot.position.set(x + offsetVector.x, y + 20, z + offsetVector.z);

    spot.target = frame;
    spot.angle = Math.PI / 6;
    spot.penumbra = 0.5;
    scene.add(spot);
}

function onClick() {
    // Raycast from camera center
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    // We need to check world interaction. objects contains local meshes attached to frames.
    // Raycaster works with world space.
    // Need to update matrices just in case? Three.js does it auto usually.

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const item = intersects[0].object;
        if (item.userData.isArt) {
            showInfo(item.userData.title, item.userData.description);
        }
    }
}

function showInfo(title, desc) {
    artTitle.textContent = title;
    artDesc.textContent = desc;
    infoPanel.style.display = 'block';

    // Auto hide after a while?
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;

    renderer.render(scene, camera);
}
