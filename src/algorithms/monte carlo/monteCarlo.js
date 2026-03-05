// MCTS Algorithm

const ITERATIONS = 2000; // Optimal balance for quality vs speed
const C = 1.41; // Exploration parameter (sqrt(2))

class MCTSNode {
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

export function monteCarloBestMove(board) {
    const aiPlayer = 2;
    const opponent = 1;

    const root = new MCTSNode(board, opponent);
    const rootMoves = getNeighborhoodMoves(board);

    // 1. Immediate Win
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, aiPlayer, 5)) {
            return m;
        }
    }

    // 2. Immediate Threat
    for (const m of rootMoves) {
        if (checkImpact(board, m.row, m.col, opponent, 5)) {
            return m;
        }
    }

    // 3. Open Four Tactics (Win Pursuit)
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, aiPlayer)) {
            return m;
        }
    }

    // 4. Block Opponent Open Four
    for (const m of rootMoves) {
        if (isOpenFour(board, m.row, m.col, opponent)) {
            return m;
        }
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
            if (winner === aiPlayer) node.wins += 1;
            else if (winner === 0) node.wins += 0.5;
            node = node.parent;
        }
    }

    if (root.children.length === 0) {
        return rootMoves[0];
    }

    const bestChild = root.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
    );

    return { row: bestChild.move.row, col: bestChild.move.col };
}

function smartRollout(board, currentPlayer) {
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

        if (isWinningMove(tempBoard, move.row, move.col)) return player;
        if (isBoardFull(tempBoard)) return 0;

        player = player === 1 ? 2 : 1;
    }
}

function getNeighborhoodMoves(board) {
    const size = board.length;
    const moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0 && hasNeighbor(board, r, c)) {
                moves.push({ row: r, col: c });
            }
        }
    }
    return moves.length > 0 ? moves : [{ row: Math.floor(size / 2), col: Math.floor(size / 2) }];
}

function hasNeighbor(board, r, c) {
    const size = board.length;
    for (let i = r - 1; i <= r + 1; i++) {
        for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < size && j >= 0 && j < size && board[i][j] !== 0)
                return true;
        }
    }
    return false;
}

function isWinningMove(board, row, col) {
    const player = board[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const size = board.length;

    for (const [dr, dc] of directions) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) count++;
            else break;
        }
        for (let i = 1; i < 5; i++) {
            const r = row - dr * i, c = col - dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) count++;
            else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

function checkImpact(board, row, col, player, target) {
    board[row][col] = player;
    const win = isWinningMove(board, row, col);
    board[row][col] = 0;
    return win;
}

function isOpenFour(board, row, col, player) {
    board[row][col] = player;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const size = board.length;
    let foundOpenFour = false;

    for (const [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        let r_pos = row + dr, c_pos = col + dc;
        while (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === player) {
            count++; r_pos += dr; c_pos += dc;
        }
        if (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === 0) openEnds++;

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

function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== 0));
}

function copyBoard(board) {
    return board.map(row => [...row]);
}
