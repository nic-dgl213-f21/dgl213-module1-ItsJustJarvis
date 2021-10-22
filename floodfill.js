/* 
    Name:   Reeve Jarvis
    Course: DGL-213
    Section: DLU1
    Assignment: Module #1 Milestone #2

    ** Module 2.5 **
    Latest Update: 10/21/2021

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
const playerPointsText = document.querySelector("#playerScore");
const gameOver = document.querySelector("#gameOver");
const results = document.querySelector("#highScore");

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

let isInteractionOpen = false;

// Game objects
let replacementColor = CELL_COLORS.white;
let grids;

// Variables for scoring values
const WIN_SCORE = 200;
let numberOfClicks;
let cellsChanged;
let playerScore;

// History values
const previousPointGains = [];
let previousHighScore = 0;

// Results Content

let winHeading = document.createElement("h3");
let winStatement = document.createElement("p");
let replayPromptHeading = document.createElement("h3");
let replayPrompt = document.createElement("p");

// #endregion

// *****************************************************************************
// #region Game Logic

function startGame(startingGrid = []) {
    if (!Array.isArray(startingGrid)) {
        return;
    }

    if (startingGrid.length === 0) {
        startingGrid = initializeGrid();
    }
    initializeHistory(startingGrid);
    initializePlayer();
    render(grids[0]);
    startCanvasInteraction();
}

function initializePlayer() {
    numberOfClicks = 0;
    cellsChanged = 0;
    playerScore = 0;
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
    playerPointsText.innerText = playerScore == 0 ? 0 : Math.floor(playerScore / numberOfClicks);
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
    let pointGain = cellsChanged * 5;
    playerScore += pointGain;
    previousPointGains.push(pointGain);
    cellsChanged = 0;
}

function checkWinConditions(grid) {
    let startingCell = grid[0];
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] != startingCell) return;
    }
    stopCanvasInteraction();
    displayResults();
}

function displayResults() {
    let finalScore = Math.floor(playerScore / numberOfClicks);
    trackHighScores(finalScore);

    if (finalScore >= WIN_SCORE) {
        winHeading.innerText = "YOU WIN!";
        winStatement.innerText = `Final Score: ${finalScore}`;
    } else {
        winHeading.innerText = "YOU LOSE!";
        winStatement.innerText = `Final Score: ${finalScore}`;
    }
    replayPromptHeading.innerText = "TRY AND BEAT IT!";
    replayPrompt.innerText = "Press Restart";

    results.appendChild(replayPromptHeading);
    results.appendChild(replayPrompt);
    gameOver.appendChild(winHeading);
    gameOver.appendChild(winStatement);
}

function restart() {
    results.innerText = "";
    winHeading.innerText = "Score To Beat:";
    winStatement.innerText = `${previousHighScore}`;
    gameOver.appendChild(winHeading);
    gameOver.appendChild(winStatement);
    startGame();
}

function undoLastMove() {
    if (grids.length > 1) {
        grids.pop();
        playerScore -= previousPointGains[previousPointGains.length - 1];
        previousPointGains.pop();
        numberOfClicks--;
        gameOver.innerText = "";
        results.innerText = "";
        render(grids[grids.length - 1]);
    }
    if (!isInteractionOpen) {
        startCanvasInteraction();
    }
}

// #endregion

// *****************************************************************************
// #region Event Listeners

function startCanvasInteraction() {
    canvas.addEventListener("mousedown", gridClickHandler);
    isInteractionOpen = true;
}

function stopCanvasInteraction() {
    canvas.removeEventListener("mousedown", gridClickHandler);
    isInteractionOpen = false;
}

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
