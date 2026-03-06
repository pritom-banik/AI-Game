export const copyBoard = (board) => {
    return board.map(row => [...row]);
}