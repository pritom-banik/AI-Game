import * as THREE from 'three';

import { GomokuGame } from './game.js';
import { findBestMove } from '../algorithms/minimax/Functions/findBestMove.js';

/* BASIC SETUP */
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

loader.load('/assets/300-movie-wallpaper.jpg', (texture) => {
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

/* LIGHTING */

const ambientLight = new THREE.AmbientLight(0xE2974F, 1);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xDAB98E, 4.5);
moonLight.position.set(-10, 10, -10);
moonLight.castShadow = true;
scene.add(moonLight);

/* BOARD PLATFORM */

const BOARD_SIZE = 15;
const BOARD_WORLD_SIZE = 30;

const boardGeo = new THREE.BoxGeometry(
    BOARD_WORLD_SIZE + 2.5,
    2,
    BOARD_WORLD_SIZE + 2.5
);

const loader2 = new THREE.TextureLoader();

loader2.load('/assets/board.jpg', function(texture) {
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

/* GRID LINES */

const gridHelper = new THREE.GridHelper(
    BOARD_WORLD_SIZE,
    BOARD_SIZE,
    0x000000,
    0x000000
);

gridHelper.position.y = 2.01;
scene.add(gridHelper);

/* GAME ENGINE & AI */

const game = new GomokuGame(BOARD_SIZE);

const gridToWorld = (row, col) => {
    const offset = (BOARD_SIZE - 1) / 2;
    return {
        x: (col - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE),
        z: (row - offset) * (BOARD_WORLD_SIZE / BOARD_SIZE)
    };
}

const renderStone = (row, col, player) => {
    const pos = gridToWorld(row, col);
    const geo = new THREE.SphereGeometry(0.8, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: player === 1 ? 0x111111 : 0xEEEEEE,
        roughness: 0.1,
        metalness: 0.8
    });
    const stone = new THREE.Mesh(geo, mat);
    stone.position.set(pos.x, 2.5, pos.z);
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
}

const runGame = async () => {
    while (!game.gameOver) {
        console.log(`Player ${game.currentPlayer} (Minimax) is thinking...`);

        // Both players will use the same Minimax for now
        const move = findBestMove(game.board);

        if (move) {
            const player = game.currentPlayer;
            if (game.makeMove(move.row, move.col)) {
                renderStone(move.row, move.col, player);

                if (game.gameOver) {
                    const statusText = game.winner === 0 ? "Draw!" : `Player ${game.winner === 1 ? 'Black' : 'White'} Wins!`;
                    document.getElementById('info').innerText = statusText;
                    console.log(statusText);
                    break;
                }
            }
        }

        // 2 sec delay between moves
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Check for #info div and then start the game
window.addEventListener('load', () => {
    runGame();
});

/* CAMERA */

camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);

/* ANIMATION LOOP */

const animate = () => {
    requestAnimationFrame(animate);

    camera.position.x = 45 * Math.cos(Date.now() * 0.0001);
    camera.position.z = 45 * Math.sin(Date.now() * 0.0001);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

animate();
