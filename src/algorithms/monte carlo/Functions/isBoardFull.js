export const isBoardFull = (board) => {
    return board.every(row => row.every(cell => cell !== 0));
}