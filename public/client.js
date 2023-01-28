const socket = io('http://localhost:3000');
const board = document.getElementById("gameContainer");
const roomContainer = document.getElementById("room-container")

if(board != null){
    const name = prompt("What's your name?");
    socket.emit('new-user', roomName, name);
}

function onClickHandler(btn){   
    if(possible[btn.getAttribute("cellId")] == ""){
        if(!finished){
            var args = [];
        //btn player com finished possible newplayer winner rooms
        args[0] = btn.getAttribute("cellId");
        args[1] = currPlayer;
        
        cellChosen(args[0]);
        checkwinner();
        args[3] = finished;
        }
        if(!finished)
            changePalyer();

        args[4] = possible
        args[2] = "";
        args[5] = currPlayer;
        args[6] = winner;
        args[7] = roomName;
        socket.emit('changed', args);
    }
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
    socket.emit('reset', roomName);
}

socket.on('updateReset', () => {
    restartGame();
})

socket.on('message', () => {
    window.alert("Pokój nie istnieje albo jest pusty");
})


socket.on('roomCreated', room => {
    const roomLink = document.createElement('a');
    const roomBlock = document.createElement('div');
    roomLink.href = `/${room}`;
    roomLink.innerText = `${room}`;
    roomBlock.classList.add('cell');
    roomLink.style.textDecoration = 'none';
    roomBlock.appendChild(roomLink);
    roomContainer.append(roomBlock);
})