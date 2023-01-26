const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartButton = document.querySelector("#restartButton");
const wininng = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let possible = ["", "", "", "", "", "", "", "", ""];
let currPlayer = "X";
let finished = false;

initialState();

function initialState(){
    cells.forEach(cell => cell.addEventListener("click", cellChosen));
    restartButton.addEventListener("click", restartGame);
    statusText.textContent = `${currPlayer}'s turn`;
}

function restartGame(){
    currPlayer = "X";
    possible = ["", "", "", "", "", "", "", "", ""];
    statusText.textContent = `${currPlayer}'s turn`;
    cells.forEach(cell => cell.textContent = "");
    finished = false;
}

function cellChosen(){
    const cellId = this.getAttribute("cellId");
    if(possible[cellId] != "" || finished){
        return;
    }
    updateCell(this, cellId);
    checkwinner();
}

function updateCell(cell, index){
    possible[index] = currPlayer;
    cell.textContent = currPlayer;
}

function changePalyer(){
    if(currPlayer == "X")
        currPlayer = "O";
    else
        currPlayer = "X";
    statusText.textContent = `${currPlayer}'s turn`; 
}

function checkwinner(){
     let won = false;

     for(let i = 0; i < wininng.length; i++){
        const state = wininng[i];
        const cell1 = possible[state[0]];
        const cell2 = possible[state[1]];
        const cell3 = possible[state[2]];
        
        if(cell1 == "" || cell2 == "" || cell3 == ""){
            continue;
        }
        else if(cell1 == cell2 && cell2 == cell3){
            won = true;
            break;
        }
     }
     
     if(won){
        statusText.textContent = `${currPlayer} won!`; 
        finished = true;
     }
     else if(!possible.includes("")){
        statusText.textContent = `Draw!`; 
        finished = true;
     }
     else{
        changePalyer();
     }
}