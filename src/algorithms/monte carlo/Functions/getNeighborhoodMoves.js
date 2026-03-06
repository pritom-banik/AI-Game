import { hasNeighbor } from "./hasNeighbor.js";

export const getNeighborhoodMoves = (board) => {
    const size = board.length;
    const moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0 && hasNeighbor(board, r, c))
                moves.push({ row: r, col: c });
        }
    }
    return moves.length > 0 ? moves : [{ row: Math.floor(size / 2), col: Math.floor(size / 2) }];
}