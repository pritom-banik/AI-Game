const SIMULATIONS = 300;

const oposition = 1;
const AIc = 2;


function checkWin(tempBoard, player) {
    for (let i = 0; i < tempBoard.length; i++) {
        for (let j = 0; j < tempBoard[i].length; j++) {

            if (
                checkDirection(tempBoard, i, j, 1, 0, player) ||
                checkDirection(tempBoard, i, j, 0, 1, player) ||
                checkDirection(tempBoard, i, j, 1, 1, player) ||
                checkDirection(tempBoard, i, j, 1, -1, player)
            ) return true;
        }
    }
    return false;
}

function checkDirection(tempBoard, x, y, dx, dy, player) {
    for (let k = 0; k < 5; k++) {
        let nx = x + dx * k;
        let ny = y + dy * k;

        if (nx < 0 || ny < 0 || nx >= tempBoard.length || ny >= tempBoard[0].length)
            return false;

        if (tempBoard[nx][ny] !== player)
            return false;
    }
    return true;
}

function randomSimulation(tempBoard, current) {

    let empty = getEmptyCells(tempBoard);

    while (empty.length > 0) {

        let randomIndex = Math.floor(Math.random() * empty.length);
        let [x, y] = empty.splice(randomIndex, 1)[0];

        tempBoard[x][y] = current;

        if (checkWin(tempBoard, current))
            return current;

        current = (current === oposition) ? AIc : oposition;
    }

    return 0;
}

function getEmptyCells(board) {
    let cells = [];
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 0)
                cells.push([i, j]);
        }
    }
    return cells;
}

function copyBoard(board) {
    return board.map(row => row.slice());
}


function monteCarloBestMove(board) {

    let emptyCells = getEmptyCells(board);
    let bestMove = emptyCells[0];
    let bestScore = -1;

    for (let move of emptyCells) {
        let [x, y] = move;
        let wins = 0;

        for (let i = 0; i < SIMULATIONS; i++) {

            let tempBoard = copyBoard(board);

            // AIc plays move
            tempBoard[x][y] = AIc;

            if (checkWin(tempBoard, AIc)) {
                wins++;
                continue;
            }

            let winner = randomSimulation(tempBoard, oposition);

            if (winner === AIc)
                wins++;
        }

        if (wins > bestScore) {
            bestScore = wins;
            bestMove = move;
        }
    }

    let ans = {
        row: bestMove[0],
        col: bestMove[1]
    };

    return ans;
}
