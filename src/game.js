// Black --> 1
// White --> 2

export class GomokuGame {
    constructor(size = 15) {
        this.size = size;
        this.board = Array(size).fill().map(() => Array(size).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
    }

    makeMove(row, col) {
        if (this.gameOver || this.board[row][col] !== 0) return false;

        this.board[row][col] = this.currentPlayer;

        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
        }
        else if (this.isBoardFull()) {
            this.gameOver = true;
            this.winner = 0; // Draw
        }
        else
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        return true;
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            let count = 1;
            count += this.countConsecutive(row, col, dr, dc, player);
            count += this.countConsecutive(row, col, -dr, -dc, player);
            if (count >= 5)
                return true;
        }
        return false;
    }

    countConsecutive(row, col, dr, dc, player) {
        let count = 0;
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) {
            count++;
            r += dr;
            c += dc;
        }
        return count;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== 0));
    }
}