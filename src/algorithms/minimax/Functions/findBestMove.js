import { getPossibleMoves } from "./getPossibleMoves.js";
import { minimax } from "./minimax.js";

export const findBestMove = (board) => {
    let bestMove = {
        row: -1,
        col: -1
    };

    let bestValue = -Infinity;
    const depth = 4; // Depth

    const moves = getPossibleMoves(board);

    for (const move of moves) {
        board[move.row][move.col] = 2; // AI is Player 2
        const moveValue = minimax(board, depth - 1, false);
        board[move.row][move.col] = 0;

        if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }

    return bestMove;
}
