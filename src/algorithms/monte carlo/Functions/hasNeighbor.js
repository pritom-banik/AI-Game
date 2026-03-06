export const hasNeighbor = (board, r, c) => {
    const size = board.length;
    for (let i = r - 1; i <= r + 1; i++) {
        for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < size && j >= 0 && j < size && board[i][j] !== 0)
                return true;
        }
    }
    return false;
}