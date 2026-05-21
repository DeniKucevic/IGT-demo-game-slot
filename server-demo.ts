// server/mockedServer.ts

const SYMBOLS = ["🍒", "🍋", "⭐", "🔔", "💎", "7️⃣"];
const REEL_COUNT = 5;
const ROW_COUNT = 3;

function generateReelPositions() {
  return Array.from({ length: REEL_COUNT }, () =>
    Math.floor(Math.random() * SYMBOLS.length),
  );
}

function calculateWin(positions: number[]) {
  // srednji red je pobednička linija (pozicija 1)
  const middleRow = positions.map((pos) => SYMBOLS[pos]);

  if (middleRow.every((s) => s === middleRow[0])) {
    return { winningLines: [1], prize: 500 }; // jackpot
  }
  if (middleRow[0] === middleRow[1] && middleRow[1] === middleRow[2]) {
    return { winningLines: [1], prize: 100 };
  }
  return { winningLines: [], prize: 0 };
}

export function getResponseData() {
  const reelPositions = generateReelPositions();
  const { winningLines, prize } = calculateWin(reelPositions);

  return {
    reelPositions, // [2, 5, 1, 3, 0]
    winningLines, // [1] ili []
    prize, // 500, 100, ili 0
  };
}
