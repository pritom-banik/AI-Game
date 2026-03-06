import { checkImpact } from "./checkImpact.js";
import { copyBoard } from "./copyBoard.js";
import { getNeighborhoodMoves } from "./getNeighborhoodMoves.js";
import { isBoardFull } from "./isBoardFull.js";
import { isWinningMove } from "./isWinningMove.js";

export const smartRollout = (board, currentPlayer) => {
    const tempBoard = copyBoard(board);
    let player = currentPlayer;

    while (true) {
        const moves = getNeighborhoodMoves(tempBoard);
        if (moves.length === 0) return 0;

        let selectedMove = null;

        // Tactical prioritized move selection for rollout
        for (const m of moves) {
            if (checkImpact(tempBoard, m.row, m.col, player, 5)) {
                selectedMove = m;
                break;
            }
        }

        if (!selectedMove) {
            const opponent = player === 1 ? 2 : 1;
            for (const m of moves) {
                if (checkImpact(tempBoard, m.row, m.col, opponent, 5)) {
                    selectedMove = m;
                    break;
                }
            }
        }

        const move = selectedMove || moves[Math.floor(Math.random() * moves.length)];
        tempBoard[move.row][move.col] = player;

        if (isWinningMove(tempBoard, move.row, move.col)) 
            return player;
        if (isBoardFull(tempBoard)) 
            return 0;

        player = player === 1 ? 2 : 1;
    }
}