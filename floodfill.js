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
const restartButton = document.querySelector("#restart");
const colorSelectButtons = document.querySelectorAll(".color-select");
// New Addition - Reference to the undo button
const undoButton = document.querySelector("#undo");

// New Addition - References to new scoreboard elements
const numberOfClicksText = document.querySelector("#numberOfClicks");
const playerScoreText = document.querySelector("#playerScore");
const results = document.querySelector("#results");

// Constants
const CELL_COLORS = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
};
const CELLS_PER_AXIS = 9;
const CELL_WIDTH = canvas.width / CELLS_PER_AXIS;
const CELL_HEIGHT = canvas.height / CELLS_PER_AXIS;

// Game objects
let replacementColor = CELL_COLORS.white;
let grids;

// New Addition - Variables for scoring values
let numberOfClicks;
let cellsChanged;
let playerScore;
let finalScore;

// New Addition - History values
let previousPointGains = [];
let previousHighScore = 0;

// #endregion

// *****************************************************************************
// #region Game Logic

function startGame(startingGrid = []) {
    // New addition - Initialize our scoring values to 0 on a new game
    numberOfClicks = 0;
    cellsChanged = 0;
    playerScore = 0;
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
    // New Addition - On render we update our scoreboard elements with current values
    numberOfClicksText.innerText = numberOfClicks;
    playerScoreText.innerText = playerScore;
}

function updateGridAt(mousePositionX, mousePositionY) {
    const gridCoordinates = convertCartesiansToGrid(mousePositionX, mousePositionY);
    const newGrid = grids[grids.length - 1].slice(); //Makes a copy of the most recent grid state
    floodFill(newGrid, gridCoordinates, newGrid[gridCoordinates.row * CELLS_PER_AXIS + gridCoordinates.column]);
    grids.push(newGrid);
    render(grids[grids.length - 1]);
}

function floodFill(grid, gridCoordinate, colorToChange) {
    if (arraysAreEqual(colorToChange, replacementColor)) {
        return;
    } //The current cell is already the selected color
    else if (!arraysAreEqual(grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column], colorToChange)) {
        return;
    } //The current cell is a different color than the initially clicked-on cell
    else {
        grid[gridCoordinate.row * CELLS_PER_AXIS + gridCoordinate.column] = replacementColor;
        floodFill(grid, { column: Math.max(gridCoordinate.column - 1, 0), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: Math.min(gridCoordinate.column + 1, CELLS_PER_AXIS - 1), row: gridCoordinate.row }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.max(gridCoordinate.row - 1, 0) }, colorToChange);
        floodFill(grid, { column: gridCoordinate.column, row: Math.min(gridCoordinate.row + 1, CELLS_PER_AXIS - 1) }, colorToChange);
    }
    return;
}

// New Addition - Function that updates the player score value
function updatePlayerScore() {
    playerScore += cellsChanged * 5; // 5 points per cell changed
    previousPointGains.push(cellsChanged * 5); // Running history of point gains
    cellsChanged = 0; // Reset cellsChanged after each score update
}

function restart() {
    startGame(grids[0]);
}

// #endregion

// *****************************************************************************
// #region Event Listeners

canvas.addEventListener("mousedown", gridClickHandler);
function gridClickHandler() {
    updateGridAt(event.offsetX, event.offsetY);
}

restartButton.addEventListener("mousedown", restartClickHandler);
function restartClickHandler() {
    restart();
}

colorSelectButtons.forEach((button) => {
    button.addEventListener("mousedown", () => (replacementColor = CELL_COLORS[button.name]));
});

// #endregion

// *****************************************************************************
// #region Helper Functions

// To convert canvas coordinates to grid coordinates
function convertCartesiansToGrid(xPos, yPos) {
    return {
        column: Math.floor(xPos / CELL_WIDTH),
        row: Math.floor(yPos / CELL_HEIGHT),
    };
}

// To choose a random property from a given object
function chooseRandomPropertyFrom(object) {
    const keys = Object.keys(object);
    return object[keys[Math.floor(keys.length * Math.random())]]; //Truncates to integer
}

// To compare two arrays
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

// New Addition - Function that tracks the number of cells changed
function trackCellChanges() {
    cellsChanged++;
}

// New Addition - Function that tracks the high score for grid repeats
function trackHighScores(finalScore) {
    if (finalScore > previousHighScore) {
        previousHighScore = finalScore;
    }
}

// #endregion

//Start game
startGame();
