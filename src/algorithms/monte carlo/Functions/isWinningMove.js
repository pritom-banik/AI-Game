export const isWinningMove = (board, row, col) => {
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