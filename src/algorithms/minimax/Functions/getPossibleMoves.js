import { hasNeighbor } from "./hasNeighbor.js";

export const getPossibleMoves = (board) => {
    const moves = [];
    const radius = 1;
    const size = board.length;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0 && hasNeighbor(board, r, c, radius))
                moves.push({
                    row: r,
                    col: c
                });
        }
    }

    // If board is empty will be played in center

    if (moves.length === 0)
        return [{ row: Math.floor(size / 2), col: Math.floor(size / 2) }];

    return moves;
}