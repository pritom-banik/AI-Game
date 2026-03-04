import { scoreCell } from "./scoreCell.js";

export const evaluateBoard=(board)=> {
    let aiScore = 0;
    let opponentScore = 0;
    const size = board.length;

    // Evaluation of all rows, columns and diagonals

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) {
                const player = board[r][c];
                const score = scoreCell(board, r, c, player);
                if (player === 1) 
                    aiScore += score;
                else 
                    opponentScore += score;
            }
        }
    }

    return aiScore - opponentScore;
}