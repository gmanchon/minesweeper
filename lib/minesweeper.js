const globalGrid = {
  width: 10,
  height: 10,
  mineCount: 10,
  gameStarted: false,
  gameOver: true,
  timer: null,
  timerStartTime: null
};

const getUserGridParameters = () => {
// getting grid size
  globalGrid.width = parseInt(document.getElementById('grid-width').value, 10) || globalGrid.width;
  globalGrid.height = parseInt(document.getElementById('grid-height').value, 10) || globalGrid.height;
  globalGrid.mineCount = parseInt(document.getElementById('grid-mines').value, 10) || globalGrid.mineCount;
  globalGrid.gameStarted = false;

  console.log(`width ${globalGrid.width} height ${globalGrid.height} mines ${globalGrid.mineCount}`);
};

const checkWin = () => {
  // getting explored cells
  const exploredCount = document.querySelectorAll('#minesweeper td[data-explored="1"]').length;

  // checking whether all cells have been explored
  return exploredCount === globalGrid.width * globalGrid.height - globalGrid.mineCount;
};

const generateMines = () => {
  // shuffling mines
  const gridLength = globalGrid.width * globalGrid.height;
  let mineCount = globalGrid.mineCount;

  // getting first click position
  const firstClickCell = document.querySelector('#minesweeper td[data-first-click="1"]');
  const firstClickCellRow = firstClickCell.parentNode.rowIndex;
  const firstClickCellCol = firstClickCell.cellIndex;

  // creating mines
  while (mineCount > 0) {
    const mineIndex = Math.floor(Math.random() * gridLength);
    const mineRow = Math.floor(mineIndex / globalGrid.width);
    const mineCol = mineIndex % globalGrid.width;

    // getting corresponding cell
    const row = document.querySelectorAll('#minesweeper tr')[mineRow];
    const col = row.querySelectorAll('#minesweeper td')[mineCol];

    // checking first click neighbourhood
    let withinFirstClicksNeighbourhood = false;
    if ((Math.abs(firstClickCellRow - mineRow) <= 1)
        && (Math.abs(firstClickCellCol - mineCol) <= 1)) {
      withinFirstClicksNeighbourhood = true;
    }

    // checking whether cell is free for mine
    if (!col.dataset.mine && !withinFirstClicksNeighbourhood) {
      col.dataset.mine = "1";
      // col.classList.add('flagged');
      mineCount -= 1;
    }
  }

  // marking mines as generated
  globalGrid.gameStarted = true;
};

const countLineMines = (row, rowIndex, colIndex) => {
  let surroundingMineCount = 0;
  const rowColumns = row.querySelectorAll('#minesweeper td');

  // counting left cell
  if (colIndex !== 0) {
    surroundingMineCount += parseInt(rowColumns[colIndex - 1].dataset.mine, 10) || 0;
  }

  // counting middle cell
  surroundingMineCount += parseInt(rowColumns[colIndex].dataset.mine, 10) || 0;

  // counting right cell
  if (colIndex !== globalGrid.width - 1) {
    surroundingMineCount += parseInt(rowColumns[colIndex + 1].dataset.mine, 10) || 0;
  }

  return surroundingMineCount;
};

const revealUnminedLine = (row, rowIndex, colIndex) => {
  // getting row columns
  const rowColumns = row.querySelectorAll('#minesweeper td');

  // left cell recursion
  if (colIndex !== 0) {
    revealUnminedTerritory(rowColumns[colIndex - 1]);
  }

  // middle cell recursion
  revealUnminedTerritory(rowColumns[colIndex]);

  // right cell recursion
  if (colIndex !== globalGrid.width - 1) {
    revealUnminedTerritory(rowColumns[colIndex + 1]);
  }
};

const revealUnminedTerritory = (element) => {
  // checking whether cell was explored
  if (element.dataset.explored) {
    return;
  }

  // getting element coordinates
  const rowIndex = element.parentNode.rowIndex;
  const colIndex = element.cellIndex;
  // console.log(`row ${rowIndex} col ${colIndex}`);

  // counting surrounding mines
  let surroundingMineCount = 0;

  // counting top line
  if (rowIndex !== 0) {
    surroundingMineCount += countLineMines(element.parentNode.previousSibling, rowIndex, colIndex);
  }

  // counting current line
  surroundingMineCount += countLineMines(element.parentNode, rowIndex, colIndex);

  // counting bottom line
  if (rowIndex !== globalGrid.height - 1) {
    surroundingMineCount += countLineMines(element.parentNode.nextSibling, rowIndex, colIndex);
  }

  // exposing surrounding mine count
  if (surroundingMineCount !== 0) {
    // console.log(`surroundingMineCount ${surroundingMineCount}`);
    element.classList.remove('question');
    element.classList.add(`mine-neighbour-${surroundingMineCount}`);

    // mark element as explored
    element.dataset.explored = "1";
  } else {
    // mark element as unmined
    element.classList.remove('question');
    element.classList.remove('unopened');
    element.classList.add('opened');

    // mark element as explored
    element.dataset.explored = "1";

    // top line recusion
    if (rowIndex !== 0) {
      revealUnminedLine(element.parentNode.previousSibling, rowIndex, colIndex);
    }

    // current line recursion
    revealUnminedLine(element.parentNode, rowIndex, colIndex);

    // bottom line recursion
    if (rowIndex !== globalGrid.height - 1) {
      revealUnminedLine(element.parentNode.nextSibling, rowIndex, colIndex);
    }
  }
};

const cellOnRightClick = (event) => {
  // preventing context menu
  event.preventDefault();

  // checking game over
  if (globalGrid.gameOver) {
    return;
  }

  // getting element
  const element = event.currentTarget;
  if (element.classList.contains('flagged')) {
    element.classList.remove('flagged');
    element.classList.add('question');

    // setting mine count
    const flaggedMinCount = parseInt(document.getElementById('mine-count').value, 10);
    document.getElementById('mine-count').value = flaggedMinCount + 1;
  } else if (element.classList.contains('question')) {
    element.classList.remove('question');
  } else {
    element.classList.add('flagged');

    // setting mine count
    const flaggedMinCount = parseInt(document.getElementById('mine-count').value, 10);
    document.getElementById('mine-count').value = flaggedMinCount - 1;
  }
};

const timerCounter = () => {
  document.getElementById('timer').value = Math.floor((Date.now() - globalGrid.timerStartTime) / 1000);
};

const startTimer = () => {
  document.getElementById('timer').value = 0;
  globalGrid.timer = setInterval(timerCounter, 1000);
  globalGrid.timerStartTime = Date.now();
};

const stopTimer = () => {
  clearInterval(globalGrid.timer);
  globalGrid.timer = null;
  globalGrid.timerStartTime = null;
};

const cellOnClick = (event) => {
  // checking game over
  if (globalGrid.gameOver) {
    return;
  }

  // prevent click on flagged cells
  if (event.currentTarget.classList.contains('flagged')) {
    return;
  }

  // generating mines
  if (!globalGrid.gameStarted) {
    // identifying first clicked cell
    event.currentTarget.dataset.firstClick = 1;

    // setting mine count
    document.getElementById('mine-count').value = globalGrid.mineCount;

    // starting timer
    startTimer();

    // generating minefield
    generateMines();
  }

  // test if mine clicked
  if (event.currentTarget.dataset.mine) {
    // game over

    // stopping timer
    stopTimer();

    // setting smiley
    document.getElementById('game-button').innerHTML = '😵';

    // disable grid
    document.getElementById('minesweeper').disabled = true;
    globalGrid.gameOver = true;

    // expose blown mine
    event.currentTarget.classList.add('exposed-mine');

    // expose all mines
    document.querySelectorAll('#minesweeper td[data-mine="1"]').forEach((element) => {
      element.classList.add('mine');
    });

    return;
  }

  // opening unmined territory
  revealUnminedTerritory(event.currentTarget);

  // checking game end
  if (checkWin()) {
    // game won

    // stopping timer
    stopTimer();

    // setting smiley
    document.getElementById('game-button').innerHTML = '😎';

    // ending game
    globalGrid.gameOver = true;
  }
};

const newGameOnClick = (event) => {
  // preventing browser navigation
  if (event) event.preventDefault();

  // enable grid
  document.getElementById('minesweeper').disabled = false;
  globalGrid.gameOver = false;

  // stopping timer
  stopTimer();

  // setting mine count
  document.getElementById('timer').value = "";

  // setting mine count
  document.getElementById('mine-count').value = "";

  // setting smiley
  document.getElementById('game-button').innerHTML = '🤪';

  // get grid parameters
  getUserGridParameters();

  // creating grid
  const grid = document.getElementById('minesweeper');
  grid.innerHTML = "";

  // creating rows
  [...Array(globalGrid.height)].forEach((_, rowIndex) => {
    const row = document.createElement('tr');
    grid.append(row);

    // creating columns
    [...Array(globalGrid.width)].forEach((__, colIndex) => {
      const col = document.createElement('td');

      // appending cell
      col.classList.add('unopened');
      row.append(col);

      // adding cell click handlers
      col.addEventListener('click', cellOnClick);
      col.addEventListener('contextmenu', cellOnRightClick);
    });
  });
};

const newGameChickenOnClick = (event) => {
  document.getElementById('grid-width').value = 5;
  document.getElementById('grid-height').value = 5;
  document.getElementById('grid-mines').value = 5;
  newGameOnClick(event);
};

const newGameBeginnerOnClick = (event) => {
  document.getElementById('grid-width').value = 10;
  document.getElementById('grid-height').value = 10;
  document.getElementById('grid-mines').value = 10;
  newGameOnClick(event);
};

const newGameIntermediateOnClick = (event) => {
  document.getElementById('grid-width').value = 16;
  document.getElementById('grid-height').value = 16;
  document.getElementById('grid-mines').value = 40;
  newGameOnClick(event);
};

const newGameExpertOnClick = (event) => {
  document.getElementById('grid-width').value = 30;
  document.getElementById('grid-height').value = 20;
  document.getElementById('grid-mines').value = 99;
  newGameOnClick(event);
};

const newGameHellOnClick = (event) => {
  document.getElementById('grid-width').value = 30;
  document.getElementById('grid-height').value = 20;
  document.getElementById('grid-mines').value = 199;
  newGameOnClick(event);
};

document.addEventListener('DOMContentLoaded', (event) => {
  // handle new game
  document.getElementById('game-button').addEventListener('click', newGameOnClick);
  document.getElementById('game-chicken').addEventListener('click', newGameChickenOnClick);
  document.getElementById('game-beginner').addEventListener('click', newGameBeginnerOnClick);
  document.getElementById('game-intermediate').addEventListener('click', newGameIntermediateOnClick);
  document.getElementById('game-expert').addEventListener('click', newGameExpertOnClick);
  document.getElementById('game-hell').addEventListener('click', newGameHellOnClick);

  newGameOnClick(null);
});
