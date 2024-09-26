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
  let availableMoves = [];
  
  if (activeBoardIndex !== null && mainBoard[activeBoardIndex].winner === null) {
    for (let j = 0; j < 9; j++) {
      if (mainBoard[activeBoardIndex].cells[j] === null) {
        availableMoves.push([activeBoardIndex, j]);
      }
    }
  } else {
    for (let i = 0; i < 9; i++) {
      if (mainBoard[i].winner === null) {
        for (let j = 0; j < 9; j++) {
          if (mainBoard[i].cells[j] === null) {
            availableMoves.push([i, j]);
          }
        }
      }
    }
  }

  if (availableMoves.length > 0) {
    const [boardIndex, cellIndex] = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    mainBoard[boardIndex].cells[cellIndex] = PLAYER_O;
    turnsPlayed++;
    checkSmallBoardWinner(boardIndex);
    activeBoardIndex = mainBoard[cellIndex].winner ? null : cellIndex;
  }
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
