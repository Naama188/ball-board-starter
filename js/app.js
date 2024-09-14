'use strict'

const WALL = "WALL"
const FLOOR = "FLOOR"
const BALL = "BALL"
const GAMER = "GAMER"
const GLUE = "GLUE"
const GLUED = "GLUED"

const GAMER_IMG = '<img src="img/supermario.png">'
const BALL_IMG = '<img src="img/coin.png">'
const GLUE_IMG = '<img src="img/koopa.png">'
const GLUED_IMG = '<img src="img/supermario-purple.png">'

// Model:
var gBoard
var gGamerPos
var gBallsInterval
var gBallsCounter = 0
var gGlueInterval
var gCanMove = true
var gCanTeleport = true

function onInitGame() {
  gGamerPos = { i: 2, j: 9 }
  gBoard = buildBoard()
  renderBoard(gBoard)
  gBallsInterval = setInterval(addRandomBall, 10000)
  gGlueInterval = setInterval(addRandomGlue, 1000)
}

function buildBoard() {
  var elBtn = document.querySelector("button")
  elBtn.style.display = "none"

  gBallsCounter = 0
  document.querySelector(".counter").innerText = gBallsCounter

  // DONE: Create the Matrix 10 * 12
  const board = []
  const rowsCount = 10
  const colsCount = 12

  // DONE: Put FLOOR everywhere and WALL at edges
  for (var i = 0; i < rowsCount; i++) {
    board[i] = [];
    for (var j = 0; j < colsCount; j++) {
      board[i][j] = { type: FLOOR, gameElement: null }
      if (i === 0 || i === rowsCount - 1 || j === 0 || j === colsCount - 1) {
        board[i][j].type = WALL
      }
    }
  }
  // DONE: Place the gamer and two balls
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
  board[5][5].gameElement = BALL
  board[7][2].gameElement = BALL

  //secret passages
  board[0][5].type = FLOOR
  board[9][5].type = FLOOR
  board[4][0].type = FLOOR
  board[4][11].type = FLOOR
  return board
}

// Render the board to an HTML table
function renderBoard(board) {
  var strHTML = "";
  for (var i = 0; i < board.length; i++) {
    strHTML += "<tr>";
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j];
      // console.log('currCell:', currCell)
      var cellClass = getClassName({ i: i, j: j })

      if (currCell.type === FLOOR) cellClass += " floor"
      else if (currCell.type === WALL) cellClass += " wall"

      strHTML += `<td class="cell ${cellClass}"  onclick="moveTo(${i},${j})" >`

      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG;
      } else if (currCell.gameElement === BALL) {
        strHTML += BALL_IMG
      }

      strHTML += "</td>"

    }
    strHTML += "</tr>"

  }

  const elBoard = document.querySelector(".board")
  elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {

  if (!gCanMove) return

  const targetCell = gBoard[i][j]

  if (targetCell.type === WALL) return

  moveSecretPass(i, j)

  // Calculate distance to make sure we are moving to a neighbor cell
  const iAbsDiff = Math.abs(i - gGamerPos.i)
  const jAbsDiff = Math.abs(j - gGamerPos.j)

  // If the clicked Cell is one of the four allowed
  if (
    (iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0)
  ) {
    if (targetCell.gameElement === BALL) {

      playCoinSound()
      gBallsCounter++

      const elCounter = document.querySelector(".counter");
      elCounter.innerText = gBallsCounter
    }

    if (targetCell.gameElement === GLUE) {

      playGlueSound()

      renderCell(gGamerPos, GLUED_IMG)
      gCanMove = false

      setTimeout(() => {
        renderCell(gGamerPos, GAMER_IMG)
        gCanMove = true
      }, 3000)
    }

    // DONE: Move the gamer
    //* REMOVE FROM LAST CELL
    // update the MODEl
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
    // update the DOM
    renderCell(gGamerPos, "")

    //* ADD TO NEXT CELL
    // update the MODEl
    gBoard[i][j].gameElement = GAMER
    gGamerPos.i = i
    gGamerPos.j = j
    // update the DOM
    renderCell(gGamerPos, gCanMove ? GAMER_IMG : GLUED_IMG)

    gCanTeleport = true

    //count balls neighbors
    var closeBalls = countCloseBalls(gGamerPos.i, gGamerPos.j, gBoard)
    document.querySelector("h2 span").innerText = closeBalls

    if (checkIfVictory()) {
      restartGame()
    }
  } else {
    console.log("TOO FAR", iAbsDiff, jAbsDiff);
  }

}

function teleportPlayer(i, j) {
  // Remove the player from the current location
  gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
  renderCell(gGamerPos, "")

  // Place the player in the new cell
  gGamerPos.i = i
  gGamerPos.j = j
  gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER
  renderCell(gGamerPos, GAMER_IMG)

  // Update teleportation flag to prevent immediate re-teleport
  gCanTeleport = false
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
  const cellSelector = "." + getClassName(location) //.cell-2-9
  const elCell = document.querySelector(cellSelector)
  elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function onKey(ev) {
  let i = gGamerPos.i
  let j = gGamerPos.j

  switch (ev.key) {
    case 'ArrowLeft':
      // Teleport from left to right if standing on teleportation cell
      if (i === 4 && j === 0) {
        teleportPlayer(4, 11)
      } else {
        moveTo(i, j - 1)
      }
      break;
    case 'ArrowRight':
      // Teleport from right to left if standing on teleportation cell
      if (i === 4 && j === 11) {
        teleportPlayer(4, 0)
      } else {
        moveTo(i, j + 1)
      }
      break;
    case 'ArrowUp':
      // Teleport from top to bottom if standing on teleportation cell
      if (i === 0 && j === 5) {
        teleportPlayer(9, 5)
      } else {
        moveTo(i - 1, j)
      }
      break;
    case 'ArrowDown':
      // Teleport from bottom to top if standing on teleportation cell
      if (i === 9 && j === 5) {
        teleportPlayer(0, 5)
      } else {
        moveTo(i + 1, j)
      }
      break
  }
}

// Returns the class name for a specific cell
function getClassName(location) {
  //input: object
  const cellClass = `cell-${location.i}-${location.j}`;
  return cellClass;
}

function findEmptyCells() {
  var emptyCells = [];
  for (var i = 1; i < gBoard.length - 1; i++) {
    for (var j = 1; j < gBoard[1].length - 1; j++) {
      if (!gBoard[i][j].gameElement) emptyCells.push({ i: i, j: j });

    }
  }
  return emptyCells;
}

function addRandomBall() {

  var emptyCells = findEmptyCells();
  if (emptyCells.length === 0) return;
  var randomIdx = getRandomInt(0, emptyCells.length);
  var randomCell = emptyCells[randomIdx];

  //model
  gBoard[randomCell.i][randomCell.j].gameElement = BALL;

  //DOM
  renderCell(randomCell, BALL_IMG);
  var closeBalls = countCloseBalls(gGamerPos.i, gGamerPos.j, gBoard);
  document.querySelector("h2 span").innerText = closeBalls;
}

function addRandomGlue() {
  const emptyCell = findEmptyCells();
  if (emptyCell.length === 0) return; // Stop if no empty cell is found

  const randIdx = getRandomInt(0, emptyCell.length);
  const randCell = emptyCell[randIdx];

  // Update MODEL to place glue
  gBoard[randCell.i][randCell.j].gameElement = GLUE;

  // Update DOM
  renderCell(randCell, GLUE_IMG);

  setTimeout(() => {
    if (gBoard[randCell.i][randCell.j].gameElement === GLUE) {
      // remove the glue after 3 sec
      gBoard[randCell.i][randCell.j].gameElement = null
      //    Update DOM
      renderCell(randCell, "")

    }
  }, 3000)
}

function checkIfVictory() {
  for (var i = 1; i < gBoard.length - 1; i++) {
    for (var j = 1; j < gBoard[1].length - 1; j++) {
      if (gBoard[i][j].gameElement === BALL) return false;
    }
  }
  console.log("NO BALLS LEFT");
  return true;
}

function restartGame() {
  //stop the balls adding
  clearInterval(gBallsInterval)

  //stop the glue adding

  clearInterval(gGlueInterval)

  //show the restart button
  var elBtn = document.querySelector("button")
  elBtn.style.display = "block"
}

function countCloseBalls(rowIdx, cellIdx, board) {
  var ballsCount = 0
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (var j = cellIdx - 1; j <= cellIdx + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (i === rowIdx && j === cellIdx) continue
      if (board[i][j].gameElement === BALL) ballsCount++
    }
  }
  return ballsCount
}

//secret Passages

function moveSecretPass(i, j) {
  if (gGamerPos.i === 4 && gGamerPos.j === 0 && i === 4 && j === 11) {
    teleportPlayer(4, 11);
    return;
  } else if (gGamerPos.i === 4 && gGamerPos.j === 11 && i === 4 && j === 0) {
    teleportPlayer(4, 0);
    return;
  } else if (gGamerPos.i === 0 && gGamerPos.j === 5 && i === 9 && j === 5) {
    teleportPlayer(9, 5);
    return;
  } else if (gGamerPos.i === 9 && gGamerPos.j === 5 && i === 0 && j === 5) {
    teleportPlayer(0, 5);
    return;
  }
}




