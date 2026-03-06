export const isOpenFour = (board, row, col, player) => {
    board[row][col] = player;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    const size = board.length;
    let foundOpenFour = false;

    for (const [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        let r_pos = row + dr, c_pos = col + dc;
        while (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === player) {
            count++; 
            r_pos += dr; 
            c_pos += dc;
        }
        if (r_pos >= 0 && r_pos < size && c_pos >= 0 && c_pos < size && board[r_pos][c_pos] === 0) 
            openEnds++;

        let r_neg = row - dr, c_neg = col - dc;
        while (r_neg >= 0 && r_neg < size && c_neg >= 0 && c_neg < size && board[r_neg][c_neg] === player) {
            count++; 
            r_neg -= dr; 
            c_neg -= dc;
        }
        if (r_neg >= 0 && r_neg < size && c_neg >= 0 && c_neg < size && board[r_neg][c_neg] === 0) 
            openEnds++;

        if (count === 4 && openEnds === 2) {
            foundOpenFour = true;
            break;
        }
    }
    board[row][col] = 0;
    return foundOpenFour;
}