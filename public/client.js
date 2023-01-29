const socket = io('http://localhost:3000')
const board = document.getElementById("gameContainer")
const roomContainer = document.getElementById("room-container")

//If not in room there is no point for asking name
if(board != null){
    const name = prompt("What's your name?")
    socket.emit('new-user', roomName, name)
}

//Getting all info after choosing tile
function onClickHandler(btn){   
    if (possible[btn.getAttribute("cellId")] == "") {
        if (!finished) {
            var args = []
            //btn player com finished possible newplayer winner room
            args[0] = btn.getAttribute("cellId")
            args[1] = currPlayer
            
            cellChosen(args[0])
            checkwinner()
            args[3] = finished
        }
        
        //If there are still possible moves change
        if(!finished)
            changePalyer()

        args[4] = possible
        args[2] = ""
        args[5] = currPlayer
        args[6] = winner
        args[7] = roomName
        socket.emit('changed', args)
    }
}

//Update board state
socket.on('buttonUpdate', function(data){
    document.getElementById(data[0]).innerHTML = data[1]
    document.getElementById("statusText").innerHTML = data[2]
    currPlayer = data[5]
    
    if(data[1] == "X")
        document.getElementById(data[0]).style.backgroundColor = "red"
    else
        document.getElementById(data[0]).style.backgroundColor = "blue"
    
    possible = data[4]
    finished = data[3]
})

//Get current board state 
socket.on('getState', data => {
    for(let i = 0; i < 9; i++){
        if (data[0][i] == "X") {
            document.getElementById(i).style.backgroundColor = "red"
            document.getElementById(i).textContent = "X"
        } else if(data[0][i] == "O") {
            document.getElementById(i).style.backgroundColor = "blue"
            document.getElementById(i).textContent = "O"
        }
    }
    document.getElementById("statusText").innerHTML = data[1]
})

//Manage clicked reset button
function resetHandler(){
    restartGame()
    socket.emit('reset', roomName)
}

//Reser board state
socket.on('updateReset', () => {
    restartGame()
})

//Handle creating new room
socket.on('roomCreated', room => {
    var roomLink = document.createElement('a')
    var roomBlock = document.createElement('div')
    var roomSpan = document.createElement('span')
    var roomNode = document.createElement('li');
    var element = document.querySelector('li') 

    roomLink.href = `/${room}`
    roomLink.innerText = `${room}`
    roomLink.style.textDecoration = 'none'
    roomLink.style.color = "inherit"
    
    roomSpan.appendChild(roomLink)
    roomNode.appendChild(roomSpan)

    roomBlock.appendChild(roomNode)
    roomBlock.setAttribute("id", room)

    window.getComputedStyle(element, roomBlock)
    roomBlock.style.marginTop = "1rem"
    roomContainer.append(roomBlock)
    refresh()
})