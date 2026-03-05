import { monteCarloBestMove } from './monteCarlo.js';

onmessage = function (e) {
    const { board } = e.data;
    const bestMove = monteCarloBestMove(board);
    postMessage(bestMove);
};
