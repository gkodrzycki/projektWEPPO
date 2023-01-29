const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(('public')));   
app.use(express.urlencoded({extended: true}));

const rooms = {new:  {users: {}, player1: {}, player2: {}, move: {}, state: ["", "", "", "", "", "", "", "", ""], com: ""}};

app.get('/', (req, res) => {
    res.render('index', {rooms: rooms})
});

//Join room
app.get('/:room', (req, res) => {
    if(rooms[req.params.room] == null){
        return res.redirect('/');
    }
    res.render('room', {roomName: req.params.room})
});

//Create
app.post('/room', (req, res) => {
    if(rooms[req.body.room] != null){
        return res.redirect('/');
    }
    rooms[req.body.room] = {users: {}, player1: {}, player2: {}, move: {}, state: ["", "", "", "", "", "", "", "", ""], com: ""}
    res.redirect('/');
    io.emit('roomCreated', req.body.room)
})

io.on('connection', (socket) => {
    socket.on('changed', data => {
        var name2 = ""; 
        if(Object.keys(rooms[data[7]].move)[0] == socket.id && Object.keys(rooms[data[7]].users).length >= 2){
            rooms[data[7]].state = data[4];

            if(socket.id == Object.keys(rooms[data[7]].player1)[0]){
                rooms[data[7]].move = rooms[data[7]].player2;
                name2 =  Object.values(rooms[data[7]].player1)[0] 
            }
            if(socket.id == Object.keys(rooms[data[7]].player2)[0]){
                rooms[data[7]].move = rooms[data[7]].player1; 
                name2 =  Object.values(rooms[data[7]].player2)[0] 
            }

            if(data[6] == false && data[3] == false)
                data[2] = Object.values(rooms[data[7]].move)[0] + "'s turn";
            else if(data[6] == false && data[3] == true)
                data[2] = "Draw!"
            else
                data[2] = name2 + " wins!";
            
                rooms[data[7]].com = data[2];
            io.to(data[7]).emit('buttonUpdate', data)
        }
    })

    socket.on('reset', room => {
        if(Object.keys(rooms[room].move)[0] == socket.id && Object.keys(rooms[room].users).length >= 2){
            io.to(room).emit('updateReset');
            rooms[room].move = rooms[room].player1
            rooms[room].com = Object.values(rooms[room].move)[0] + "'s turn!";
            rooms[room].state = ["", "", "", "", "", "", "", "", ""];
            io.to(room).emit('getState', data);
        }
        else if(Object.keys(rooms[room].move)[0] != socket.id && Object.keys(rooms[room].users).length >= 2){
            data =[rooms[room].state, rooms[room].com];
            io.to(room).emit('getState', data);
        }
        else{
            io.to(room).emit('updateReset');
            rooms[room].com = "Waiting for opponent...";
            rooms[room].state = ["", "", "", "", "", "", "", "", ""];
            data =[rooms[room].state, rooms[room].com];
            io.to(room).emit('getState', data);
        }
    })
    
    socket.on('new-user', (room, name) => {
        socket.join(room);
        rooms[room].users[socket.id] = name;
        if(Object.keys(rooms[room].users).length == 1){
            rooms[room].player1[socket.id] = name;
            rooms[room].move[socket.id] = name;
        }
        if(Object.keys(rooms[room].users).length == 2)
            rooms[room].player2[socket.id] = name;

        if(room != '/' && Object.keys(rooms[room].users).length <= 2){
            io.to(room).emit('updateReset');
            rooms[room].state = ["", "", "", "", "", "", "", "", ""]
            if(Object.keys(rooms[room].users).length == 1)
                rooms[room].com = "Waiting for opponent...";
            if(Object.keys(rooms[room].users).length == 2)
                rooms[room].com = Object.values(rooms[room].move)[0] + "'s turn!";
            
            data =[rooms[room].state, rooms[room].com];
            io.to(room).emit('getState', data)
        }
        else if(room != '/' && Object.keys(rooms[room].users).length > 2){
            data =[rooms[room].state, rooms[room].com];
            io.to(room).emit('getState', data);
        }
    })

    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
            if(socket.id == Object.keys(rooms[room].player1)){
                rooms[room].player1 = rooms[room].player2
                rooms[room].move = rooms[room].player1
                var temp = {}
                rooms[room].player2 = temp; 
                rooms[room].com = "Waiting for opponent...";
                rooms[room].state = ["", "", "", "", "", "", "", "", ""];
                data =[rooms[room].state, rooms[room].com];
                io.to(room).emit('getState', data);
            }
            else if(socket.id == Object.keys(rooms[room].player2)){
                rooms[room].move = rooms[room].player1
                var temp = {}
                rooms[room].player2 = temp;
                rooms[room].com = "Waiting for opponent...";
                rooms[room].state = ["", "", "", "", "", "", "", "", ""];
                data =[rooms[room].state, rooms[room].com];
                io.to(room).emit('getState', data); 
            }
            delete rooms[room].users[socket.id]
        })
    });
});
  
function getUserRooms(socket){
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if(room.users[socket.id] != null)
            names.push(name);
        return names;
    }, [])
}

server.listen(3000);