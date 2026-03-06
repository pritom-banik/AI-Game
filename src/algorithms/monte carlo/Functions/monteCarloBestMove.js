import { checkImpact } from "./checkImpact.js";
import { copyBoard } from "./copyBoard.js";
import { getNeighborhoodMoves } from "./getNeighborhoodMoves.js";
import { isOpenFour } from "./isOpenFour.js";
import { smartRollout } from "./smartRollout.js";
import { MCTSNode } from "../MCTSNode/MCTSNode.js";

const ITERATIONS = 2000; // Optimal balance for quality vs speed

export const monteCarloBestMove = (board) => {
    const aiPlayer = 2;
    const opponent = 1;

    const root = new MCTSNode(board, opponent);
    const rootMoves = getNeighborhoodMoves(board);

    // Immediate Win
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, aiPlayer, 5))
            return m;
    }

    // Immediate Threat
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, opponent, 5))
            return m;
    }

    // Open Four Tactics (Win Pursuit)
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, aiPlayer))
            return m;
    }

    // Block Opponent Open Four
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, opponent))
            return m;
    }

    // MCTS Iterations
    for (let i = 0; i < ITERATIONS; i++) {
        let node = root;
        let tempBoard = copyBoard(board);

        while (node.isFullyExpanded() && node.children.length > 0) {
            node = node.getBestChild();
            tempBoard[node.move.row][node.move.col] = node.player;
        }

        if (node.untriedMoves.length > 0) {
            const moveIndex = Math.floor(Math.random() * node.untriedMoves.length);
            const move = node.untriedMoves.splice(moveIndex, 1)[0];
            const nextPlayer = node.player === 1 ? 2 : 1;

            tempBoard[move.row][move.col] = nextPlayer;
            const newNode = new MCTSNode(tempBoard, nextPlayer, move, node);
            node.children.push(newNode);
            node = newNode;
        }

        const winner = smartRollout(tempBoard, node.player === 1 ? 2 : 1);

        while (node !== null) {
            node.visits++;
            if (winner === aiPlayer) 
                node.wins += 1;
            else if (winner === 0) 
                node.wins += 0.5;
            node = node.parent;
        }
    }

    if (root.children.length === 0) 
        return rootMoves[0];

    const bestChild = root.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
    );

    return { row: bestChild.move.row, col: bestChild.move.col };
}