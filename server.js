const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);


app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(('public')));   
app.use(express.urlencoded({extended: true}));

const rooms = {};

app.get('/', (req, res) => {
    res.render('index', {rooms: rooms})
});

app.get('/:room', (req, res) => {
    if(rooms[req.params.room] == null)
        return res.redirect('/');
    res.render('room', {roomName: req.params.room})
});
 
app.post('/room', (req, res) => {
    if(rooms[req.body.room] != null){
        return res.redirect('/');
    }
    rooms[req.body.room] = {users: {} }
    res.redirect(req.body.room)
    io.emit('roomCreated', req.body.room)
})

// const users = {};

io.on('connection', (socket) => {
    socket.on('changed', data => {
        console.log("Change server", data[7]);
        io.to(data[7]).emit('buttonUpdate', data)
    })

    socket.on('reset', room => {
        io.to(room).emit('updateReset');
    })

    socket.on('new-user', (room, name) => {
        socket.join(room);
        rooms[room].users[socket.id] = name;
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