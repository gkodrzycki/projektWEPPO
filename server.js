const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(('public')));   
app.use(express.urlencoded({extended: true}));

const rooms = {new: {users: {} }};

app.get('/', (req, res) => {
    res.render('index', {rooms: rooms})
});

app.get('/:room', (req, res) => {
    if(rooms[req.params.room] == null || Object.keys(rooms[req.params.room].users).length == 2){
        return res.redirect('/');
    }
    res.render('room', {roomName: req.params.room})
});
 
app.post('/room', (req, res) => {
    if(rooms[req.body.room] != null){
        return res.redirect('/');
    }
    rooms[req.body.room] = {users: {} }
    res.redirect('/');
    io.emit('roomCreated', req.body.room)
})

io.on('connection', (socket) => {
    socket.on('changed', data => {
        var name = " ";  
        var name2 = ""; 
        if(Object.keys(rooms[data[7]].users).length == 2){
            vals = Object.values(rooms[data[7]].users)
            keys = Object.keys(rooms[data[7]].users)
            if(keys[0] == socket.id){
                name  = vals[1];
                name2 = vals[0];
            }
            else{
                name  = vals[0];
                name2 = vals[1]
            }

            if(data[6] == false && data[3] == false)
                data[2] = name + "'s turn";
            else if(data[6] == false && data[3] == true)
                data[2] = "Draw!"
            else
                data[2] = name2 + " wins!";
        }
        io.to(data[7]).emit('buttonUpdate', data)
    })

    socket.on('reset', room => {
        io.to(room).emit('updateReset');
    })
    
    socket.on('new-user', (room, name) => {
        socket.join(room);
        rooms[room].users[socket.id] = name;
        if(room != '/')
            io.to(room).emit('updateReset');
    })

    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
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