const socket = io('http://localhost:3000');

// const name = prompt("What's your name?");
// socket.emit('new-user', name);

// socket.on('user-connected', name => {
//     appendMessage(`${name} connected`);
// })

// socket.on('user-disconnected', name => {
//     appendMessage(`${name} disconnected`)
// })


function onClickHandler(btn){
    if(!finished){
        var args = [];
        //btn player com finished possible newplayer winner
        args[0] = btn.getAttribute("cellId");
        args[1] = currPlayer;
        
        cellChosen(args[0]);
        checkwinner();
        console.log(finished)
        args[3] = finished;
    }
    if(!finished)
        changePalyer();
    
    args[4] = possible
    if(finished && winner)
        args[2] = args[1] + " won!";
    else if(finished && !winner)
        args[2] = "Draw!";
    else 
        args[2] = currPlayer + "'s turn"
    args[5] = currPlayer;
    args[6] = winner;
    socket.emit('changed', args);
}

socket.on('buttonUpdate', function(data){
    document.getElementById(data[0]).innerHTML = data[1];
    document.getElementById("statusText").innerHTML = data[2];
    currPlayer = data[5];
    if(data[1] == "X")
        document.getElementById(data[0]).style.backgroundColor = "red";
    else
        document.getElementById(data[0]).style.backgroundColor = "blue";
    possible = data[4];
    finished = data[3];
})

function resetHandler(){
    restartGame();
    socket.emit('reset');
}

socket.on('updateReset', () => {
    restartGame();
})