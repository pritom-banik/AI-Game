// MCTS Algorithm

const C = 1.41; // Exploration parameter (sqrt(2))

import { getNeighborhoodMoves } from "../Functions/getNeighborhoodMoves.js";

export class MCTSNode {
    constructor(board, player, move = null, parent = null) {
        this.player = player;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.untriedMoves = board ? getNeighborhoodMoves(board) : [];
    }

    isFullyExpanded() {
        return this.untriedMoves.length === 0;
    }

    getBestChild() {
        let bestChild = null;
        let bestValue = -Infinity;

        for (const child of this.children) {
            const exploitation = child.wins / child.visits;
            const exploration = C * Math.sqrt(Math.log(this.visits) / child.visits);
            const ucbScore = exploitation + exploration;

            if (ucbScore > bestValue) {
                bestValue = ucbScore;
                bestChild = child;
            }
        }
        return bestChild;
    }
}


















