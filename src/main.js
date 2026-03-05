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
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.4;
document.body.appendChild(renderer.domElement);

/* CINEMATIC LIGHTING */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 5.0);
spotLight.position.set(20, 45, 20);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.5;
spotLight.decay = 1.5;
spotLight.distance = 250;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-20, 20, -20);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xDAB98E, 2.0, 100);
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

loader.load('/assets/board.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const boardMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.2
    });

    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.75;
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

/* GAME STATE */
let gameMode = 'AI_VS_AI'; // 'AI_VS_AI' or 'HUMAN_VS_AI'
let opponentAI = 'MINIMAX'; // 'MINIMAX' or 'MCTS'
let isHumanTurn = false;
let humanMovePromiseResolve = null;

const game = new GomokuGame(BOARD_SIZE);
const animatingStones = [];

/* INTERACTIVITY SETUP */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const gridToWorld = (row, col) => {
    const offset = (BOARD_SIZE - 1) / 2;
    return {
        x: (col - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE),
        z: (row - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE)
    };
}

const worldToGrid = (x, z) => {
    const offset = (BOARD_SIZE - 1) / 2;
    const col = Math.round(x / (BOARD_WORLD_SIZE / BOARD_SIZE) + offset);
    const row = Math.round(z / (BOARD_WORLD_SIZE / BOARD_SIZE) + offset);
    return { row, col };
}

const renderStone = (row, col, player) => {
    const pos = gridToWorld(row, col);

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

    stone.position.set(pos.x, 15, pos.z);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);

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

const showVictoryDialogue = (winner) => {
    const victoryOverlay = document.getElementById('victoryOverlay');
    const victoryMessage = document.getElementById('victoryMessage');
    const victoryTitle = document.querySelector('.victory-title');

    if (victoryOverlay && victoryMessage) {
        if (winner === 0) {
            victoryTitle.innerText = "DRAW";
            victoryMessage.innerText = "It's a tie!";
        } else if (gameMode === 'HUMAN_VS_AI') {
            if (winner === 1) {
                victoryTitle.innerText = "VICTORY";
                victoryMessage.innerText = "You won!";
            } else {
                victoryTitle.innerText = "YOU LOST";
                victoryMessage.innerText = "AI won";
            }
        } else {
            victoryTitle.innerText = "BATTLE ENDED";
            victoryMessage.innerText = winner === 1 ? "Minimax won" : "MCTS won";
        }
        victoryOverlay.style.display = 'flex';
    }
}

const resetGame = () => {
    // Clear stones from scene
    const stonesToRemove = [];
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry.type === 'SphereGeometry') {
            stonesToRemove.push(object);
        }
    });
    stonesToRemove.forEach(s => scene.remove(s));

    // Reset game state
    game.board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    game.currentPlayer = 1;
    game.gameOver = false;
    game.winner = null;
    animatingStones.length = 0;

    // Hide UI
    document.getElementById('victoryOverlay').style.display = 'none';
    document.getElementById('info').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('overlay').style.opacity = '1';

    // Show main menu
    document.getElementById('menuMain').style.display = 'block';
    document.getElementById('menuChooseAI').style.display = 'none';
}

const getHumanMove = () => {
    return new Promise((resolve) => {
        isHumanTurn = true;
        renderer.domElement.classList.add('clickable');
        humanMovePromiseResolve = resolve;
    });
}

const handleBoardClick = (event) => {
    if (!isHumanTurn || game.gameOver) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    for (const intersect of intersects) {
        // Check if we hit the board platform
        if (intersect.object.geometry.type === 'BoxGeometry') {
            const gridPos = worldToGrid(intersect.point.x, intersect.point.z);
            if (gridPos.row >= 0 && gridPos.row < BOARD_SIZE && gridPos.col >= 0 && gridPos.col < BOARD_SIZE) {
                if (game.board[gridPos.row][gridPos.col] === 0) {
                    isHumanTurn = false;
                    renderer.domElement.classList.remove('clickable');
                    humanMovePromiseResolve(gridPos);
                    break;
                }
            }
        }
    }
}

const handleBoardHover = (event) => {
    if (!isHumanTurn || game.gameOver) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    let isOverBoard = false;
    for (const intersect of intersects) {
        if (intersect.object.geometry.type === 'BoxGeometry') {
            const gridPos = worldToGrid(intersect.point.x, intersect.point.z);
            if (gridPos.row >= 0 && gridPos.row < BOARD_SIZE && gridPos.col >= 0 && gridPos.col < BOARD_SIZE) {
                if (game.board[gridPos.row][gridPos.col] === 0) {
                    isOverBoard = true;
                    break;
                }
            }
        }
    }

    if (isOverBoard) {
        renderer.domElement.classList.add('clickable');
    } else {
        renderer.domElement.classList.remove('clickable');
    }
}

window.addEventListener('mousedown', (e) => handleBoardClick(e));
window.addEventListener('mousemove', (e) => handleBoardHover(e));

const runGame = async () => {
    const infoDiv = document.getElementById('info');
    if (infoDiv)
        infoDiv.style.display = 'block';

    while (!game.gameOver) {
        let move;
        const player = game.currentPlayer;

        if (gameMode === 'HUMAN_VS_AI') {
            if (player === 1) {
                updateStatus("Your Turn (Black)", "#ffffff");
                move = await getHumanMove();
            } else {
                updateStatus("AI thinking...", "#DAB98E");
                move = opponentAI === 'MINIMAX' ? await getMinimaxMoveFromWorker(game.board) : await getMCTSMoveFromWorker(game.board);
            }
        } else {
            // AI vs AI
            const isMinimax = player === 1;
            updateStatus(
                isMinimax ? "Minimax thinking..." : "Monte Carlo thinking...",
                isMinimax ? "#ffffff" : "#DAB98E"
            );
            move = isMinimax ? await getMinimaxMoveFromWorker(game.board) : await getMCTSMoveFromWorker(game.board);
        }

        if (move) {
            if (game.makeMove(move.row, move.col)) {
                renderStone(move.row, move.col, player);

                // Universal delay for better game rhythm
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (game.gameOver) {
                    let statusText = "";
                    if (game.winner === 0) statusText = "DRAW";
                    else if (gameMode === 'HUMAN_VS_AI') {
                        statusText = game.winner === 1 ? "VICTORY" : "YOU LOST";
                    } else {
                        statusText = game.winner === 1 ? "MINIMAX WON" : "MCTS WON";
                    }
                    updateStatus(statusText, "red");
                    setTimeout(() => showVictoryDialogue(game.winner), 2000);
                    break;
                }
            }
        }
    }
}

/* MENU LOGIC */

const startSession = async () => {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        await cinematicFlyIn();
        overlay.style.display = 'none';
        runGame();
    }
}

document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('menuMain').style.display = 'none';
    document.getElementById('menuChooseAI').style.display = 'block';
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
    document.getElementById('menuChooseAI').style.display = 'none';
    document.getElementById('menuMain').style.display = 'block';
});

document.getElementById('aiVsAiBtn').addEventListener('click', () => {
    gameMode = 'AI_VS_AI';
    startSession();
});

document.getElementById('playMinimaxBtn').addEventListener('click', () => {
    gameMode = 'HUMAN_VS_AI';
    opponentAI = 'MINIMAX';
    startSession();
});

document.getElementById('playMctsBtn').addEventListener('click', () => {
    gameMode = 'HUMAN_VS_AI';
    opponentAI = 'MCTS';
    startSession();
});

document.getElementById('backToMenuBtn').addEventListener('click', () => resetGame());

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
        const frame = () => {
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

                setTimeout(() => {
                    isOrbitPaused = false;
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

    if (!isIntroActive) {
        if (isOrbitPaused) {
            camera.position.set(0, 40, 45);
            camera.lookAt(0, 0, 0);
        } else {
            if (orbitTimeOffset === 0) orbitTimeOffset = (Date.now() * 0.0001) - (Math.PI / 2);

            const timer = (Date.now() * 0.0001) - orbitTimeOffset;
            camera.position.x = Math.cos(timer) * 45;
            camera.position.z = Math.sin(timer) * 45;
            camera.lookAt(0, 0, 0);
        }
    }

    updateStones();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

