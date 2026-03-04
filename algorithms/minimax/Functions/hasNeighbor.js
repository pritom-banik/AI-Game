export const hasNeighbor=(board, row, col, radius)=> {
    const size = board.length;
    for (let i = row - radius; i <= row + radius; i++) {
        for (let j = col - radius; j <= col + radius; j++) {
            if (i >= 0 && i < size && j >= 0 && j < size) {
                if (board[i][j] !== 0) 
                    return true;
            }
        }
    }
    return false;
}