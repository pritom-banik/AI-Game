<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Battlefield Gomoku</title>
<style>
    body {
        margin: 0;
        overflow: hidden;
        background: black;
        font-family: Arial, sans-serif;
    }

    #ui {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 10;
        color: white;
    }

    button {
        padding: 10px 20px;
        background: #aa0000;
        border: none;
        color: white;
        cursor: pointer;
        font-weight: bold;
    }

    button:hover {
        background: #ff0000;
    }
</style>
</head>
<body>

<div id="ui">
    <button onclick="resetBoard()">Reset</button>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<script>
/* ------------------ BASIC SETUP ------------------ */

const scene = new THREE.Scene();
//scene.background = new THREE.Color(0xff0a1a);
//scene.fog = new THREE.FogExp2(0x000000, 0.03);
const loader = new THREE.TextureLoader();
loader.load('./300-movie-wallpaper.jpg', (texture) => {
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

const moonLight = new THREE.DirectionalLight(0xDAB98E, 3.5);
moonLight.position.set(-10, 100, -10);
moonLight.castShadow = true;
scene.add(moonLight);

/* ------------------ GROUND (BATTLEFIELD) ------------------ */

//const groundGeo = new THREE.PlaneGeometry(80, 80, 100, 100);
//const groundMat = new THREE.MeshStandardMaterial({
//    color: 0xffffff,
//    roughness: 5
//});

//const ground = new THREE.Mesh(groundGeo, groundMat);
//ground.rotation.x = Math.PI / 2;
//ground.receiveShadow = true;
//scene.add(ground);

/* Add rough terrain */
//const vertices = groundGeo.attributes.position;
//for (let i = 0; i < vertices.count; i++) {
//    vertices.setY(i, Math.random() * 0.6);
//}
//vertices.needsUpdate = true;

/* ------------------ BOARD PLATFORM ------------------ */

const BOARD_SIZE = 15;
const BOARD_WORLD_SIZE = 30;
const cellSize = BOARD_WORLD_SIZE / BOARD_SIZE;

const boardGeo = new THREE.BoxGeometry(
    BOARD_WORLD_SIZE,
    2,
    BOARD_WORLD_SIZE
);

//const boardMat = new THREE.MeshStandardMaterial({
//    color: 0x333333,
//    roughness: 0.8,
//   metalness: 0.1
//});

//const board = new THREE.Mesh(boardGeo, boardMat);
//board.position.y = 1;
//board.castShadow = true;
//board.receiveShadow = true;
//scene.add(board);

const loader2 = new THREE.TextureLoader();
loader2.load('./board.jpg', function(texture) {
    const boardMat = new THREE.MeshStandardMaterial({
        map: texture,        // ← This is the texture image
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

/* ------------------ STONES ------------------ */

const stoneGeo = new THREE.SphereGeometry(cellSize * 0.4, 32, 32);

const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 1,
    roughness: 0.2
});

const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x4444ff,
    emissiveIntensity: 1
});

let stones = [];

/* Place stone function */
function placeStone(row, col, player) {

    const x = col * cellSize - BOARD_WORLD_SIZE/2 + cellSize/2;
    const z = row * cellSize - BOARD_WORLD_SIZE/2 + cellSize/2;

    const material = player === 1 ? blackMat : whiteMat;

    const stone = new THREE.Mesh(stoneGeo, material);
    stone.position.set(x, 3, z);
    stone.castShadow = true;

    scene.add(stone);
    stones.push(stone);

    /* Drop animation */
    let targetY = 3;
    stone.position.y = 10;

    const drop = () => {
        stone.position.y -= 0.5;
        if (stone.position.y > targetY) {
            requestAnimationFrame(drop);
        } else {
            stone.position.y = targetY;
        }
    };
    drop();
}

/* ------------------ TEST STONES ------------------ */

placeStone(7,7,1);
placeStone(7,8,2);
placeStone(8,7,1);

/* ------------------ RESET ------------------ */

function resetBoard() {
    stones.forEach(s => scene.remove(s));
    stones = [];
}

/* ------------------ ANIMATION LOOP ------------------ */

function animate() {
    requestAnimationFrame(animate);

    /* slow cinematic camera rotation */
    camera.position.x = 40 * Math.cos(Date.now() * 0.00005);
    camera.position.z = 40 * Math.sin(Date.now() * 0.00005);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

animate();

/* ------------------ RESPONSIVE ------------------ */

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>

</body>
</html>