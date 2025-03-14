const mainBoardElement = document.getElementById('main-board');
const resetButton = document.getElementById('reset-button');
let mainBoard = createMainBoard();
let activeBoardIndex = null;
let isComputerTurn = false;
let turnsPlayed = 0;
let gameOver = false;

const PLAYER_X = 'X';
const PLAYER_O = 'O';

function createMainBoard() {
  return Array(9).fill(null).map(() => ({
    cells: Array(9).fill(null),
    winner: null
  }));
}

function renderBoard() {
  mainBoardElement.innerHTML = '';

  mainBoard.forEach((board, boardIndex) => {
    const smallBoardElement = document.createElement('div');
    smallBoardElement.classList.add('small-board');

    if (board.winner !== null) {
      smallBoardElement.innerHTML = '';
      smallBoardElement.classList.add('won');
      const winnerElement = document.createElement('div');
      winnerElement.classList.add('winner-symbol');
      winnerElement.textContent = board.winner;
      smallBoardElement.appendChild(winnerElement);
    } else {
      board.cells.forEach((cell, cellIndex) => {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');

        if (cell !== null) {
          cellElement.textContent = cell;
          cellElement.classList.add('disabled');
        }

        if (board.winner !== null || gameOver || (activeBoardIndex !== null && activeBoardIndex !== boardIndex)) {
          cellElement.classList.add('disabled');
        } else if (cell === null && !gameOver && (activeBoardIndex === null || activeBoardIndex === boardIndex)) {
          cellElement.addEventListener('click', () => handleMove(boardIndex, cellIndex));
        }

        smallBoardElement.appendChild(cellElement);
      });
    }

    if (boardIndex === activeBoardIndex && !board.winner && !gameOver) {
      smallBoardElement.classList.add('active-board');
    }

    mainBoardElement.appendChild(smallBoardElement);
  });
}

function handleMove(boardIndex, cellIndex) {
  if (isComputerTurn || mainBoard[boardIndex].winner !== null || mainBoard[boardIndex].cells[cellIndex] !== null || gameOver) {
    return;
  }

  mainBoard[boardIndex].cells[cellIndex] = PLAYER_X;
  turnsPlayed++;
  checkSmallBoardWinner(boardIndex);

  activeBoardIndex = mainBoard[cellIndex].winner ? null : cellIndex;

  renderBoard();

  if (checkMainBoardWinner()) {
    highlightWinningLine();
    gameOver = true;
    return;
  }

  isComputerTurn = true;
  setTimeout(() => {
    computerMove();
    isComputerTurn = false;

    if (checkMainBoardWinner()) {
      highlightWinningLine();
      gameOver = true;
    }

    renderBoard();
  }, 500); 
}

function computerMove() {
  // If game is over, don't make a move
  if (gameOver) return;
  
  // Get all available moves in the active board or across all boards if no active board
  let availableMoves = getAvailableMoves();
  
  if (availableMoves.length === 0) return;
  
  // Prioritize winning moves in the current small board
  const winningMove = findWinningMove(availableMoves, PLAYER_O);
  if (winningMove) {
    makeMove(winningMove[0], winningMove[1], PLAYER_O);
    return;
  }
  
  // Block opponent's winning moves
  const blockingMove = findWinningMove(availableMoves, PLAYER_X);
  if (blockingMove) {
    makeMove(blockingMove[0], blockingMove[1], PLAYER_O);
    return;
  }
  
  // Strategic move selection (using a simplified minimax approach)
  const strategicMove = findStrategicMove(availableMoves);
  makeMove(strategicMove[0], strategicMove[1], PLAYER_O);
}

function getAvailableMoves() {
  let moves = [];
  
  if (activeBoardIndex !== null && mainBoard[activeBoardIndex].winner === null) {
    // Get moves in the active board
    for (let j = 0; j < 9; j++) {
      if (mainBoard[activeBoardIndex].cells[j] === null) {
        moves.push([activeBoardIndex, j]);
      }
    }
  } else {
    // Get moves from all available boards
    for (let i = 0; i < 9; i++) {
      if (mainBoard[i].winner === null) {
        for (let j = 0; j < 9; j++) {
          if (mainBoard[i].cells[j] === null) {
            moves.push([i, j]);
          }
        }
      }
    }
  }
  
  return moves;
}

function findWinningMove(moves, player) {
  // Check each move to see if it would result in winning a small board
  for (const [boardIndex, cellIndex] of moves) {
    // Create a temporary copy of the board
    const boardCopy = [...mainBoard[boardIndex].cells];
    boardCopy[cellIndex] = player;
    
    // Check if this move creates a win
    if (hasWinningLine(boardCopy, player)) {
      return [boardIndex, cellIndex];
    }
  }
  
  return null;
}

function hasWinningLine(cells, player) {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (cells[a] === player && cells[b] === player && cells[c] === player) {
      return true;
    }
  }
  
  return false;
}

function findStrategicMove(moves) {
  // Score each possible move
  const scoredMoves = moves.map(move => {
    const [boardIndex, cellIndex] = move;
    let score = 0;
    
    // Prefer center positions in small boards
    if (cellIndex === 4) score += 3;
    
    // Prefer corners over edges in small boards
    if ([0, 2, 6, 8].includes(cellIndex)) score += 2;
    
    // Consider the strategic value of the next board the opponent will be sent to
    if (mainBoard[cellIndex].winner === null) {
      // If we send opponent to a board that is almost full, that's good
      const filledCells = mainBoard[cellIndex].cells.filter(cell => cell !== null).length;
      score += filledCells * 0.5;
      
      // Avoid sending to a board where opponent could win
      if (hasTwoInARow(mainBoard[cellIndex].cells, PLAYER_X)) {
        score -= 10;
      }
    }
    
    // If move sends to an already won board, that's great (opponent must play anywhere)
    if (mainBoard[cellIndex].winner !== null) {
      score += 5;
    }
    
    // Check if this move creates a fork (multiple winning opportunities)
    const boardCopy = [...mainBoard[boardIndex].cells];
    boardCopy[cellIndex] = PLAYER_O;
    if (countWinningOpportunities(boardCopy, PLAYER_O) > 1) {
      score += 20;
    }
    
    return { move, score };
  });
  
  // Sort by score and pick the best move
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Add a small amount of randomness to the top 3 moves (if we have that many)
  const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
  const randomIndex = Math.floor(Math.random() * topMoves.length);
  return topMoves[randomIndex].move;
}

function hasTwoInARow(cells, player) {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const line of winningLines) {
    const [a, b, c] = line;
    const playerCells = [cells[a], cells[b], cells[c]].filter(cell => cell === player).length;
    const emptyCells = [cells[a], cells[b], cells[c]].filter(cell => cell === null).length;
    
    if (playerCells === 2 && emptyCells === 1) {
      return true;
    }
  }
  
  return false;
}

function countWinningOpportunities(cells, player) {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  let count = 0;
  
  for (const line of winningLines) {
    const [a, b, c] = line;
    const playerCells = [cells[a], cells[b], cells[c]].filter(cell => cell === player).length;
    const emptyCells = [cells[a], cells[b], cells[c]].filter(cell => cell === null).length;
    
    if (playerCells === 2 && emptyCells === 1) {
      count++;
    }
  }
  
  return count;
}

function makeMove(boardIndex, cellIndex, player) {
  mainBoard[boardIndex].cells[cellIndex] = player;
  turnsPlayed++;
  checkSmallBoardWinner(boardIndex);
  activeBoardIndex = mainBoard[cellIndex].winner ? null : cellIndex;
}

function checkSmallBoardWinner(boardIndex) {
  const board = mainBoard[boardIndex];
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let line of winningLines) {
    const [a, b, c] = line;
    if (board.cells[a] && board.cells[a] === board.cells[b] && board.cells[a] === board.cells[c]) {
      board.winner = board.cells[a];
      return;
    }
  }
}

function checkMainBoardWinner() {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let line of winningLines) {
    const [a, b, c] = line;
    if (mainBoard[a].winner && mainBoard[a].winner === mainBoard[b].winner && mainBoard[a].winner === mainBoard[c].winner) {
      return true;
    }
  }

  return false;
}

function highlightWinningLine() {
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let line of winningLines) {
    const [a, b, c] = line;
    if (mainBoard[a].winner && mainBoard[a].winner === mainBoard[b].winner && mainBoard[a].winner === mainBoard[c].winner) {
      const smallBoards = document.querySelectorAll('.small-board');
      [a, b, c].forEach(index => {
        smallBoards[index].classList.add('highlight');
      });
    }
  }
}

resetButton.addEventListener('click', () => {
  mainBoard = createMainBoard();
  activeBoardIndex = null;
  isComputerTurn = false;
  gameOver = false;
  turnsPlayed = 0;
  renderBoard(); 
});

renderBoard();