export const PATTERNS = {
    five: 1000000,
    openFour: 100000,
    closedFour: 10000,
    openThree: 10000,
    closedThree: 1000,
    openTwo: 1000,
    closedTwo: 100
};

export const scoreCell = (board, r, c, player) => {
    let totalScore = 0;
    const size = board.length;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        // Positive direction
        for (let i = 1; i < 5; i++) {
            const nr = r + i * dr;
            const nc = c + i * dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === player) count++;
                else {
                    if (board[nr][nc] === 0) openEnds++;
                    break;
                }
            } else break;
        }

        // Negative direction
        for (let i = 1; i < 5; i++) {
            const nr = r - i * dr;
            const nc = c - i * dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === player) count++;
                else {
                    if (board[nr][nc] === 0) openEnds++;
                    break;
                }
            } else break;
        }

        if (count >= 5) totalScore += PATTERNS.five;
        else if (count === 4) {
            totalScore += (openEnds === 2 ? PATTERNS.openFour : (openEnds === 1 ? PATTERNS.closedFour : 0));
        } else if (count === 3) {
            totalScore += (openEnds === 2 ? PATTERNS.openThree : (openEnds === 1 ? PATTERNS.closedThree : 0));
        } else if (count === 2) {
            totalScore += (openEnds === 2 ? PATTERNS.openTwo : (openEnds === 1 ? PATTERNS.closedTwo : 0));
        }
    }
    return totalScore;
}