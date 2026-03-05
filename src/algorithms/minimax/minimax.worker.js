import { findBestMove } from './Functions/findBestMove.js';

self.onmessage = (e) => {
    const { board } = e.data;
    const move = findBestMove(board);
    self.postMessage(move);
};
