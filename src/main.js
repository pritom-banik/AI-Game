import * as THREE from 'three';
/* ------------------ BASIC SETUP ------------------ */
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
loader.load('./assets/300-movie-wallpaper.jpg', (texture) => {
  scene.background = texture;
});

const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/* ------------------ LIGHTING ------------------ */

const ambientLight = new THREE.AmbientLight(0xE2974F, 1);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xDAB98E, 4.5);
moonLight.position.set(-10, 10, -10);
moonLight.castShadow = true;
scene.add(moonLight);

/* ------------------ BOARD PLATFORM ------------------ */

const BOARD_SIZE = 15;
const BOARD_WORLD_SIZE = 30;
const cellSize = BOARD_WORLD_SIZE / BOARD_SIZE;

const boardGeo = new THREE.BoxGeometry(
    BOARD_WORLD_SIZE+2.5,
    2,
    BOARD_WORLD_SIZE+2.5
);

const loader2 = new THREE.TextureLoader();
loader2.load('./assets/board.jpg', function(texture) {
    const boardMat = new THREE.MeshStandardMaterial({
        map: texture,        
        roughness: 1,
        metalness: 1
    });

    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 1;
    board.castShadow = true;
    board.receiveShadow = true;
    scene.add(board);
});

/* ------------------ GRID LINES ------------------ */

const gridHelper = new THREE.GridHelper(
    BOARD_WORLD_SIZE,
    BOARD_SIZE,
    0x000000,
    0x000000
);

gridHelper.position.y = 2.01;
scene.add(gridHelper);

/* ------------------ CAMERA ------------------ */

camera.position.set(0, 70, 0);
camera.lookAt(0, 0, 0);

/* ------------------ ANIMATION LOOP ------------------ */

function animate() {
    requestAnimationFrame(animate);

    
    camera.position.x = 40 * Math.cos(Date.now() * 0.00002);
    camera.position.z = 40 * Math.sin(Date.now() * 0.00002);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

animate();