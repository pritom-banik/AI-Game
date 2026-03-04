import { evaluateBoard } from "./evaluateBoard.js";
import { getPossibleMoves } from "./getPossibleMoves.js";
import { PATTERNS } from "./scoreCell.js";

const winScore = 1000000;


export const minimax=(board, depth, isMaximizing)=> {
    const score = evaluateBoard(board);

    // Terminal state or depth reached

    if (depth === 0 || Math.abs(score) >= PATTERNS.five)
        return score;

    const possibleMoves = getPossibleMoves(board);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            board[move.row][move.col] = 1;
            const evaluation = minimax(board, depth - 1, false);
            board[move.row][move.col] = 0; 
            maxEval = Math.max(maxEval, evaluation);
        }
        return maxEval;
    } 
    else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            board[move.row][move.col] = 2; 
            const evaluation = minimax(board, depth - 1, true);
            board[move.row][move.col] = 0;
            minEval = Math.min(minEval, evaluation);
        }
        return minEval;
    }
}


