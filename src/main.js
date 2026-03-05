import * as THREE from 'three';
import { GomokuGame } from './game.js';

// MCTS Worker
const mctsWorker = new Worker(new URL('./algorithms/monte carlo/mcts.worker.js', import.meta.url), {
    type: 'module'
});

// Minimax Worker
const minimaxWorker = new Worker(new URL('./algorithms/minimax/minimax.worker.js', import.meta.url), {
    type: 'module'
});

const getMCTSMoveFromWorker = (board) => {
    return new Promise((resolve) => {
        mctsWorker.onmessage = (e) => {
            resolve(e.data);
        };
        mctsWorker.postMessage({ board });
    });
}

const getMinimaxMoveFromWorker = (board) => {
    return new Promise((resolve) => {
        minimaxWorker.onmessage = (e) => {
            resolve(e.data);
        };
        minimaxWorker.postMessage({ board });
    });
}

/* BASIC SETUP */
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

loader.load('/assets/300-movie-wallpaper.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    scene.background = texture;
    scene.environment = texture;
});

const camera = new THREE.PerspectiveCamera(
    35, // Slightly narrower for cinematic feel
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.4; // Slightly increased exposure
document.body.appendChild(renderer.domElement);

/* CINEMATIC LIGHTING */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Further increased for clarity
scene.add(ambientLight);

// Main moody spotlight
const spotLight = new THREE.SpotLight(0xffffff, 5.0); // Boosted further
spotLight.position.set(20, 45, 20);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.5;
spotLight.decay = 1.5; // Softer decay
spotLight.distance = 250;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Fill light from opposite side to soften shadows
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-20, 20, -20);
scene.add(fillLight);

// Rim light for depth
const rimLight = new THREE.PointLight(0xDAB98E, 2.0, 100); // Increased intensity
rimLight.position.set(-20, 10, -20);
scene.add(rimLight);

/* BOARD PLATFORM */

const BOARD_SIZE = 15;
const BOARD_WORLD_SIZE = 30;

const boardGeo = new THREE.BoxGeometry(
    BOARD_WORLD_SIZE + 2.5,
    1.5,
    BOARD_WORLD_SIZE + 2.5
);

loader.load('/assets/board.jpg', function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const boardMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.2
    });

    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.75; // Lowered to align with grid
    board.receiveShadow = true;
    scene.add(board);
});

/* GRID LINES */

const gridHelper = new THREE.GridHelper(
    BOARD_WORLD_SIZE,
    BOARD_SIZE,
    0x000000,
    0x000000
);

gridHelper.position.y = 1.51;
scene.add(gridHelper);

/* GAME ENGINE & AI */

const game = new GomokuGame(BOARD_SIZE);
const animatingStones = [];

const gridToWorld = (row, col) => {
    const offset = (BOARD_SIZE - 1) / 2;
    return {
        x: (col - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE),
        z: (row - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE)
    };
}

const renderStone = (row, col, player) => {
    const pos = gridToWorld(row, col);

    // Premium physical material for polished stones
    const geo = new THREE.SphereGeometry(0.8, 32, 24);
    const mat = new THREE.MeshPhysicalMaterial({
        color: player === 1 ? 0x0a0a0a : 0xfcfcfc,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.8
    });

    const stone = new THREE.Mesh(geo, mat);

    // Start height for the drop animation
    stone.position.set(pos.x, 15, pos.z);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);

    // Animation state
    animatingStones.push({
        mesh: stone,
        targetY: 2.1,
        velocity: 0,
        bounced: false
    });
}

const updateStones = () => {
    const gravity = 0.05;
    const bounce = -0.3;

    for (let i = animatingStones.length - 1; i >= 0; i--) {
        const s = animatingStones[i];
        s.velocity -= gravity;
        s.mesh.position.y += s.velocity;

        if (s.mesh.position.y <= s.targetY) {
            if (!s.bounced) {
                s.mesh.position.y = s.targetY;
                s.velocity *= bounce;
                s.bounced = true;
            }
            else {
                s.mesh.position.y = s.targetY;
                animatingStones.splice(i, 1);
            }
        }
    }
}

const updateStatus = (message, color) => {
    const statusMsg = document.getElementById('statusMessage');
    const badge = document.getElementById('playerBadge');
    if (statusMsg)
        statusMsg.innerText = message;
    if (badge) {
        badge.style.color = color;
        badge.style.backgroundColor = color;
    }
}

let gamePaused = false;

const showPauseMenu = () => {
    const pm = document.getElementById('pauseMenu');
    if (pm) pm.classList.remove('hidden');
};
const hidePauseMenu = () => {
    const pm = document.getElementById('pauseMenu');
    if (pm) pm.classList.add('hidden');
};

const runGame = async () => {
    const infoDiv = document.getElementById('info');
    if (infoDiv)
        infoDiv.style.display = 'block';

    while (!game.gameOver) {

        // This is for pause the game
        if (gamePaused) {
            await new Promise(resolve => {
                const resume = document.getElementById('resumeBtn');
                const unpause = () => {
                    gamePaused = false;
                    hidePauseMenu();
                    resume.removeEventListener('click', unpause);
                    resolve();
                };
                resume.addEventListener('click', unpause);
            });
        }


        const isMinimax = game.currentPlayer === 1;
        updateStatus(
            isMinimax ? "Minimax thinking..." : "Monte Carlo thinking...",
            isMinimax ? "#ffffff" : "#DAB98E"
        );

        let move;
        if (isMinimax) {
            console.log("Requesting Minimax move from worker...");
            move = await getMinimaxMoveFromWorker(game.board);
        }
        else {
            console.log("Requesting MCTS move from worker...");
            move = await getMCTSMoveFromWorker(game.board);
        }

        if (move) {
            const player = game.currentPlayer;
            if (game.makeMove(move.row, move.col)) {
                renderStone(move.row, move.col, player);

                if (game.gameOver) {
                    const statusText = game.winner === 0 ? "Draw!" : `Player ${game.winner === 1 ? 'Black' : 'White'} Wins!`;
                    updateStatus(statusText, "red");
                    break;
                }
            }
        }
        // 1 sec delay between moves
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/* MENU LOGIC */

const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', async () => {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            // cinematic camera move
            await cinematicFlyIn();
            overlay.style.display = 'none';
            runGame();
        }
    });
}

// PAUSE/MENUBAR 
const menuBar = document.getElementById('menuBar');
if (menuBar) {
    menuBar.addEventListener('click', () => {
        gamePaused = true;
        showPauseMenu();
    });
}

const resumeBtn = document.getElementById('resumeBtn');
if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
        gamePaused = false;
        hidePauseMenu();
    });
}

const mainMenuBtn = document.getElementById('mainMenuBtn');
if (mainMenuBtn) {
    mainMenuBtn.addEventListener('click', () => {
        // simplest: reload page to show the start overlay again
        window.location.reload();
    });
}

/* INTERACTIVE CAMERA */

camera.position.set(0, 40, 40);
camera.lookAt(0, 0, 0);

/* ANIMATION LOOP */

let isIntroActive = false;
let isOrbitPaused = false;
let orbitTimeOffset = 0;

const cinematicFlyIn = async () => {
    isIntroActive = true;
    const duration = 1800; // Slightly slower for more impact
    const startTime = Date.now();
    const startPos = new THREE.Vector3(120, 80, 120);
    const endPos = new THREE.Vector3(0, 40, 45); // Match orbit radius (45)

    return new Promise((resolve) => {
        function frame() {
            const now = Date.now();
            const t = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

            camera.position.lerpVectors(startPos, endPos, ease);
            camera.lookAt(0, 0, 0);

            if (t < 1)
                requestAnimationFrame(frame);
            else {
                isIntroActive = false;
                isOrbitPaused = true;

                // Keep camera locked for 2.5 seconds to capture first few moves
                setTimeout(() => {
                    isOrbitPaused = false;
                    // Dynamically calculate offset the moment orbit starts
                    orbitTimeOffset = (Date.now() * 0.0001) - (Math.PI / 2);
                }, 2500);

                resolve();
            }
        }
        frame();
    });
}

const animate = () => {
    requestAnimationFrame(animate);

    if (!gamePaused) {
        if (!isIntroActive) {
            if (isOrbitPaused) {
                // Lock to exact end position
                camera.position.set(0, 40, 45);
                camera.lookAt(0, 0, 0);
            } else {
                // Smooth Orbit using synchronized offset
                // Ensure offset is initialized if we skipped the intro (failsafe)
                if (orbitTimeOffset === 0) orbitTimeOffset = (Date.now() * 0.0001) - (Math.PI / 2);

                const timer = (Date.now() * 0.0001) - orbitTimeOffset;
                camera.position.x = Math.cos(timer) * 45;
                camera.position.z = Math.sin(timer) * 45;
                camera.lookAt(0, 0, 0);
            }
        }

        updateStones();
    }
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
