const e = require('express')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)


app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static(('public')))   
app.use(express.urlencoded({extended: true}))

const rooms = {testRoom:  {users: {}, player1: {}, player2: {}, move: {}, state: ["", "", "", "", "", "", "", "", ""], comment: ""}}

//Home page
app.get('/', (req, res) => {
    res.render('index', {rooms: rooms})
})

//Join room
app.get('/:room', (req, res) => {
    //If room doesn't exist there is nowhere to go
    if (rooms[req.params.room] == null){
        return res.redirect('/')
    }
    res.render('room', {roomName: req.params.room})
})

//Create room
app.post('/room', (req, res) => {
    //if room already exists there is no point in making 2nd with the same name
    if (rooms[req.body.room] != null) {
        return res.redirect('/')
    }
    rooms[req.body.room] = {users: {}, player1: {}, player2: {}, move: {}, state: ["", "", "", "", "", "", "", "", ""], comment: ""}
    res.redirect('/')
    io.emit('roomCreated', req.body.room)
})

io.on('connection', (socket) => {
    socket.on('changed', data => {
        var name2 = ""
        //If there is any game we can update
        if (Object.keys(rooms[data[7]].move)[0] == socket.id && Object.keys(rooms[data[7]].player1).length == 1 && Object.keys(rooms[data[7]].player2).length) {
            rooms[data[7]].state = data[4]

            //change who's move it is now
            if (socket.id == Object.keys(rooms[data[7]].player1)[0]) {
                rooms[data[7]].move = rooms[data[7]].player2
                name2 =  Object.values(rooms[data[7]].player1)[0] 
            } else if(socket.id == Object.keys(rooms[data[7]].player2)[0]) {
                rooms[data[7]].move = rooms[data[7]].player1 
                name2 =  Object.values(rooms[data[7]].player2)[0] 
            }

            //check what comment should appear
            if (!data[6] && !data[3])
                data[2] = Object.values(rooms[data[7]].move)[0] + "'s turn"
            else if (!data[6] && data[3])
                data[2] = "Draw!"
            else
                data[2] = name2 + " wins!"
            
            rooms[data[7]].comment = data[2]
            //Update for everyone
            io.to(data[7]).emit('buttonUpdate', data)
        } else {
            update = [rooms[data[7]].state, rooms[data[7]].comment, Object.keys(rooms[data[7]].users).length - 2]
            io.to(data[7]).emit('getState', update)
        }
    })

    socket.on('reset', room => {
        //Check who want to reset
        if (Object.keys(rooms[room].move)[0] == socket.id && Object.keys(rooms[room].users).length >= 2) {
            io.to(room).emit('updateReset')
            rooms[room].move = rooms[room].player1
            rooms[room].comment = Object.values(rooms[room].move)[0] + "'s turn!"
            rooms[room].state = ["", "", "", "", "", "", "", "", ""]
            data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 2, true]
            io.to(room).emit('getState', data)
        } else if (Object.keys(rooms[room].move)[0] != socket.id && Object.keys(rooms[room].users).length >= 2) {
            data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 2, false]
            io.to(room).emit('getState', data)
        } else {
            io.to(room).emit('updateReset')
            rooms[room].comment = "Waiting for opponent..."
            rooms[room].state = ["", "", "", "", "", "", "", "", ""]
            data =[rooms[room].state, rooms[room].comment, 0, false]
            io.to(room).emit('getState', data)
        }
    })
    
    socket.on('new-user', (room, name) => {
        socket.join(room)
        rooms[room].users[socket.id] = name
        //If needed assign as player
        if (Object.keys(rooms[room].users).length == 1) {
            rooms[room].player1[socket.id] = name
            rooms[room].move[socket.id] = name
        } else if (Object.keys(rooms[room].users).length == 2)
            rooms[room].player2[socket.id] = name
        
        
        //clean current state of game or emit it to new user
        if (room != '/' && Object.keys(rooms[room].users).length <= 2) {
            io.to(room).emit('updateReset')
            rooms[room].state = ["", "", "", "", "", "", "", "", ""]
            
            if (Object.keys(rooms[room].users).length == 1){
                rooms[room].comment = "Waiting for opponent..."
            }
            else if (Object.keys(rooms[room].users).length == 2)
            rooms[room].comment = Object.values(rooms[room].move)[0] + "'s turn!"
            
            data =[rooms[room].state, rooms[room].comment, 0, false]
            io.to(room).emit('getState', data)
        } else if (room != '/' && Object.keys(rooms[room].users).length > 2) {
            data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 2, false]
            io.to(room).emit('getState', data)
        }
    })

    socket.on('disconnect', () => {
        //Check every room if user was player fix stuff
        getUserRooms(socket).forEach(room => {
            if (socket.id == Object.keys(rooms[room].player1)) {
                rooms[room].player1 = rooms[room].player2
                rooms[room].move = rooms[room].player1
                var temp = {}
                rooms[room].player2 = temp 
                rooms[room].comment = "Waiting for opponent..."
                rooms[room].state = ["", "", "", "", "", "", "", "", ""]
                data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 2, true]
                io.to(room).emit('getState', data)
            } else if(socket.id == Object.keys(rooms[room].player2)) {
                rooms[room].move = rooms[room].player1
                var temp = {}
                rooms[room].player2 = temp
                rooms[room].comment = "Waiting for opponent..."
                rooms[room].state = ["", "", "", "", "", "", "", "", ""]
                data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 2, true]
                io.to(room).emit('getState', data) 
            } else {
                data =[rooms[room].state, rooms[room].comment, Object.keys(rooms[room].users).length - 3, false]
                io.to(room).emit('getState', data)
            }
            delete rooms[room].users[socket.id]
        })
    })
})
  
function getUserRooms(socket){
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null)
            names.push(name)
        return names
    }, [])
}

server.listen(3000)