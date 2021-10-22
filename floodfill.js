/* 
    Name:   Reeve Jarvis
    Course: DGL-213
    Section: DLU1
    Assignment: Module #1 Milestone #2
    Date: 09/30/2021

    Filename:   index.html
*/

"use strict";

// *****************************************************************************
// #region Constants and Variables

// Canvas references
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// UI references
const restartButton = document.querySelector(".restart");
const colorSelectButtons = document.querySelectorAll(".color-select");
const undoButton = document.querySelector("#undo");

// References to new scoreboard elements
const numberOfClicksText = document.querySelector("#numberOfClicks");
const playerPointsText = document.querySelector("#playerPoints");
const gameOver = document.querySelector("#gameOver");
const highScore = document.querySelector("#highScore");

// Constants
const CELL_COLORS = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
};

// Cell dimensions
const CELLS_PER_AXIS = 9;
const CELL_WIDTH = canvas.width / CELLS_PER_AXIS;
const CELL_HEIGHT = canvas.height / CELLS_PER_AXIS;

// Game objects
let replacementColor = CELL_COLORS.white;
let grids;

// Variables for scoring values
const WIN_SCORE = 200;
let numberOfClicks;
let cellsChanged;
let playerPoints;
let finalScore;

// History values
const previousPointGains = [];
let previousHighScore = 0;

// #endregion

// *****************************************************************************
// #region Game Logic

function startGame(startingGrid = []) {
    numberOfClicks = 0;
    cellsChanged = 0;
    playerPoints = 0;
    finalScore = 0;
    if (startingGrid.length === 0) {
        startingGrid = initializeGrid();
    }
    initializeHistory(startingGrid);
    render(grids[0]);
}

function initializeGrid() {
    const newGrid = [];
    for (let i = 0; i < CELLS_PER_AXIS * CELLS_PER_AXIS; i++) {
        newGrid.push(chooseRandomPropertyFrom(CELL_COLORS));
    }
    return newGrid;
}

function initializeHistory(startingGrid) {
    grids = [];
    grids.push(startingGrid);
}

function render(grid) {
    for (let i = 0; i < grid.length; i++) {
        ctx.fillStyle = `rgb(${grid[i][0]}, ${grid[i][1]}, ${grid[i][2]})`;
        ctx.fillRect((i % CELLS_PER_AXIS) * CELL_WIDTH, Math.floor(i / CELLS_PER_AXIS) * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
    numberOfClicksText.innerText = numberOfClicks;
    playerPointsText.innerText = playerPoints;
}

function updateGridAt(mousePositionX, mousePositionY) {
    const gridCoordinates = convertCartesiansToGrid(mousePositionX, mousePositionY);
    const newGrid = grids[grids.length - 1].slice();
    floodFill(newGrid, gridCoordinates, newGrid[gridCoordinates.row * CELLS_PER_AXIS + gridCoordinates.column]);
    grids.push(newGrid);
    updatePlayerPoints();
    render(grids[grids.length - 1]);
    checkWinConditions(grids[grids.length - 1]);
}

function floodFill(grid, gridCoordinate, colorToChange) {
    if (arraysAreEqual(colorToChange, replacementColor)) {
        return;
    } else if (!arraysAreEqual(grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column], colorToChange)) {
        return;
    } else {
        grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column] = replacementColor;
        trackCellChanges();
        floodFill(grid, { column: Math.max(gridCoordinate.column - 1, 0), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: Math.min(gridCoordinate.column + 1, CELLS_PER_AXIS - 1), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.max(gridCoordinate.row - 1, 0) }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.min(gridCoordinate.row + 1, CELLS_PER_AXIS - 1) }, colorToChange);
    }
    return;
}

function updatePlayerPoints() {
    playerPoints += cellsChanged * 5;
    previousPointGains.push(cellsChanged * 5);
    cellsChanged = 0;
}

function checkWinConditions(grid) {
    let startingCell = grid[0];
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] != startingCell) return;
    }

    let winStatement;
    finalScore = Math.floor(playerPoints / numberOfClicks);
    trackHighScores(finalScore);
    if (finalScore >= WIN_SCORE) {
        winStatement = `<h3>YOU WIN!</h3><p>Final Score: ${finalScore}</p>`;
    } else {
        winStatement = `<h3>YOU LOSE!</h3><p>Final Score: ${finalScore}</p>`;
    }
    highScore.innerHTML = "<h3>TRY AND BEAT IT!</h3><p>Press Restart</p>";
    gameOver.innerHTML = winStatement;
}

function restart() {
    highScore.innerHTML = "";
    gameOver.innerHTML = `<h3>Score To Beat:</h3><p>${previousHighScore}</p>`;
    startGame(grids[0]);
}

function undoLastMove() {
    if (grids.length > 1) {
        grids.pop();
        playerPoints -= previousPointGains[previousPointGains.length - 1];
        previousPointGains.pop();
        numberOfClicks--;
        gameOver.innerHTML = "";
        render(grids[grids.length - 1]);
    }
}

// #endregion

// *****************************************************************************
// #region Event Listeners

canvas.addEventListener("mousedown", gridClickHandler);
function gridClickHandler(event) {
    numberOfClicks++;
    updateGridAt(event.offsetX, event.offsetY);
}

restartButton.addEventListener("mousedown", restartClickHandler);
function restartClickHandler() {
    restart();
}

undoButton.addEventListener("mousedown", undoClickHandler);
function undoClickHandler() {
    undoLastMove();
}

colorSelectButtons.forEach((button) => {
    button.addEventListener("mousedown", () => (replacementColor = CELL_COLORS[button.name]));
});

// #endregion

// *****************************************************************************
// #region Helper Functions

function convertCartesiansToGrid(xPos, yPos) {
    return {
        column: Math.floor(xPos / (canvas.clientWidth / CELLS_PER_AXIS)),
        row: Math.floor(yPos / (canvas.clientHeight / CELLS_PER_AXIS)),
    };
}

function chooseRandomPropertyFrom(object) {
    const keys = Object.keys(object);
    return object[keys[Math.floor(keys.length * Math.random())]];
}

function arraysAreEqual(arr1, arr2) {
    if (arr1.length != arr2.length) {
        return false;
    } else {
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] != arr2[i]) {
                return false;
            }
        }
        return true;
    }
}

function trackCellChanges() {
    cellsChanged++;
}

function trackHighScores(finalScore) {
    if (finalScore > previousHighScore) {
        previousHighScore = finalScore;
    }
}

// #endregion

//Start game
startGame();
