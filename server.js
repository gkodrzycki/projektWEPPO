const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.use(express.static((__dirname)));

const users = {};

io.on('connection', (socket) => {
    
    socket.on('changed', (data) => {
        io.emit('buttonUpdate', data)
    })

    socket.on('reset', () => {
        io.emit('updateReset');
    })

    socket.on('new-user', name => {
        users[socket.id] = name;
        console.log(`${name} connected`);
        socket.broadcast.emit('user-connected', name)
    })

    socket.on('disconnect', () => {
        socket.broadcast.emit('user-disconnected', users[socket.id])
        delete users[socket.id]
    });
});
  

server.listen(3000, () => {
  console.log('listening on *:3000');
});