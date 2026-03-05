// MCTS Algorithm

const ITERATIONS = 5000;
const C = 1.41; // Exploration parameter (sqrt(2))

// Node structure of tree

class MCTSNode {
    constructor(board, player, move = null, parent = null) {
        this.player = player;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;

        // Potential moves to explore from this state
        // Only calculate untriedMoves if a valid board is provided
        this.untriedMoves = board ? getNeighborhoodMoves(board) : [];
    }

    isFullyExpanded() {
        return this.untriedMoves.length === 0;
    }

    getBestChild() {
        let bestChild = null;
        let bestValue = -Infinity;

        for (const child of this.children) {
            // UCB1 Formula: (wins / visits) + C * sqrt(log(parent_visits) / child_visits)
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

// Main MCTS Function

export const monteCarloBestMove = (board) => {
    const aiPlayer = 2; // Assuming AI is White/2
    const opponent = 1;

    // Root node represents current state (last move was opponent's)
    const root = new MCTSNode(board, opponent);

    // CRITICAL: Immediate Win/Block check at the root
    const rootMoves = getNeighborhoodMoves(board);

    // 1. Can AI win right now?
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, aiPlayer, 5)) {
            console.log("MCTS: Immediate win detected!");
            return m;
        }
    }

    // 2. Must AI block opponent's immediate win?
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, opponent, 5)) {
            console.log("MCTS: Immediate threat blocked!");
            return m;
        }
    }

    // 3. Can AI create an Open Four (guaranteed win)?
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, aiPlayer)) {
            console.log("MCTS: Open Four detected (Win pursuit)!");
            return m;
        }
    }

    // 4. Must AI block opponent's Open Four?
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, opponent)) {
            console.log("MCTS: Opponent Open Four blocked!");
            return m;
        }
    }

    for (let i = 0; i < ITERATIONS; i++) {
        let node = root;
        let tempBoard = copyBoard(board);

        // 1. Selection: Move down the tree using UCB1
        while (node.isFullyExpanded() && node.children.length > 0) {
            node = node.getBestChild();
            tempBoard[node.move.row][node.move.col] = node.player;
        }

        // 2. Expansion: Add a new node to the tree
        if (node.untriedMoves.length > 0) {
            const moveIndex = Math.floor(Math.random() * node.untriedMoves.length);
            const move = node.untriedMoves.splice(moveIndex, 1)[0];
            const nextPlayer = node.player === 1 ? 2 : 1;

            // Apply the move to the board and create the new node
            tempBoard[move.row][move.col] = nextPlayer;
            const newNode = new MCTSNode(tempBoard, nextPlayer, move, node);
            node.children.push(newNode);
            node = newNode;
        }

        // 3. Simulation (Rollout): Play randomly but smartly till terminal state
        const winner = smartRollout(tempBoard, node.player === 1 ? 2 : 1);

        // 4. Backpropagation: Update wins and visits
        while (node !== null) {
            node.visits++;
            if (winner === aiPlayer)
                node.wins += 1;
            else if (winner === 0)
                node.wins += 0.5; // Draw
            node = node.parent;
        }
    }

    // Return the move from the child with the most visits
    if (root.children.length === 0) {
        // Fallback catch - should not happen if board has empty spots
        const moves = getNeighborhoodMoves(board);
        return moves[0];
    }

    const bestChild = root.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
    );

    return { row: bestChild.move.row, col: bestChild.move.col };
}


// Tactical Rollout: Prioritize immediate wins and blocks

const smartRollout = (board, currentPlayer) => {
    const tempBoard = copyBoard(board);
    const size = tempBoard.length;
    let player = currentPlayer;

    while (true) {
        const moves = getNeighborhoodMoves(tempBoard);
        if (moves.length === 0) return 0; // Draw

        // 1. Check if current player can win in one move
        for (const m of moves) {
            if (checkImpact(tempBoard, m.row, m.col, player, 5))
                return player; // Win
        }

        // 2. Check if current player can create an Open Four (guaranteed win)
        for (const m of moves) {
            if (isOpenFour(tempBoard, m.row, m.col, player)) {
                bestMove = m;
                break;
            }
        }

        // 3. Check if opponent is about to win (block it)
        if (!bestMove) {
            const opponent = player === 1 ? 2 : 1;
            for (const m of moves) {
                if (checkImpact(tempBoard, m.row, m.col, opponent, 5)) {
                    bestMove = m;
                    break;
                }
            }
        }

        // 4. Check if opponent is about to create an Open Four (must block)
        if (!bestMove) {
            const opponent = player === 1 ? 2 : 1;
            for (const m of moves) {
                if (isOpenFour(tempBoard, m.row, m.col, opponent)) {
                    bestMove = m;
                    break;
                }
            }
        }

        // 5. Otherwise pick a random neighbor move
        if (!bestMove)
            bestMove = moves[Math.floor(Math.random() * moves.length)];

        tempBoard[bestMove.row][bestMove.col] = player;

        // Simple win check (faster than full scan)
        if (isWinningMove(tempBoard, bestMove.row, bestMove.col))
            return player;

        if (isBoardFull(tempBoard)) return 0;

        player = opponent;
    }
}

// Fast Neighborhood Move Selection

const getNeighborhoodMoves = (board) => {
    const size = board.length;
    const moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                if (hasNeighbor(board, r, c)) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }
    // If empty board, try center
    if (moves.length === 0)
        return [{ row: Math.floor(size / 2), col: Math.floor(size / 2) }];
    return moves;
}

const hasNeighbor = (board, r, c) => {
    const size = board.length;
    for (let i = r - 1; i <= r + 1; i++) {
        for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < size && j >= 0 && j < size && board[i][j] !== 0)
                return true;
        }
    }
    return false;
}

const isWinningMove = (board, row, col) => {
    const player = board[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const size = board.length;

    for (const [dr, dc] of directions) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player)
                count++;
            else
                break;
        }
        for (let i = 1; i < 5; i++) {
            const r = row - dr * i, c = col - dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player)
                count++;
            else
                break;
        }
        if (count >= 5)
            return true;
    }
    return false;
}

// Check if placing a stone creates a line of 'target' length

const checkImpact = (board, row, col, player, target) => {
    board[row][col] = player;
    const win = isWinningMove(board, row, col);
    board[row][col] = 0;
    return win;
}

const isOpenFour = (board, row, col, player) => {
    board[row][col] = player;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const size = board.length;
    let foundOpenFour = false;

    for (const [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        // Check positive
        let r_pos = row + dr, c_pos = col + dc;
        while (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === player) {
            count++; r_pos += dr; c_pos += dc;
        }
        if (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === 0) openEnds++;

        // Check negative
        let r_neg = row - dr, c_neg = col - dc;
        while (r_neg >= 0 && r_neg < size && c_neg >= 0 && c_neg < size && board[r_neg][c_neg] === player) {
            count++; r_neg -= dr; c_neg -= dc;
        }
        if (r_neg >= 0 && r_neg < size && c_neg >= 0 && c_neg < size && board[r_neg][c_neg] === 0) openEnds++;

        if (count === 4 && openEnds === 2) {
            foundOpenFour = true;
            break;
        }
    }
    board[row][col] = 0;
    return foundOpenFour;
}

const isBoardFull = (board) => {
    return board.every(row => row.every(cell => cell !== 0));
}

const copyBoard = (board) => {
    return board.map(row => [...row]);
}
