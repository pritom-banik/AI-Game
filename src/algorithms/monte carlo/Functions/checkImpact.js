import { isWinningMove } from "./isWinningMove.js";

export const checkImpact = (board, row, col, player, target) => {
    board[row][col] = player;
    const win = isWinningMove(board, row, col);
    board[row][col] = 0;
    return win;
}