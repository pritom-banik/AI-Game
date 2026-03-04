// Patterns

export const PATTERNS = {
    five: 100000,
    openFour: 10000,
    closedFour: 1000,
    openThree: 1000,
    closedThree: 100,
    openTwo: 100,
    closedTwo: 10
};

export const scoreCell = (board, r, c, player) => {
    let totalScore = 0;
    const size = board.length;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
        let count = 0;
        let blocked = 0;

        // Counting consecutive pieces in one direction

        for (let i = 0; i < 5; i++) {
            const nr = r + i * dr;
            const nc = c + i * dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === player)
                    count++;
                else if (board[nr][nc] === 0)
                    break;
                else {
                    blocked++;
                    break;
                }
            }
            else {
                blocked++;
                break;
            }
        }

        // Simplistic scoring based on count and blocks

        if (count === 5)
            totalScore += PATTERNS.five;
        else if (count === 4)
            totalScore += (blocked === 0 ? PATTERNS.openFour : PATTERNS.closedFour);
        else if (count === 3)
            totalScore += (blocked === 0 ? PATTERNS.openThree : PATTERNS.closedThree);
        else if (count === 2)
            totalScore += (blocked === 0 ? PATTERNS.openTwo : PATTERNS.closedTwo);
    }

    return totalScore;
}