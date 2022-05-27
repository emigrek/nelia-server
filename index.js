require('dotenv').config()
const app = require('express')()
const io = require('socket.io')(process.env.SOCKET_PORT, {
    cors: {
      origin: '*',
    }
});
const cors = require('cors');

app.use(cors())

const Reception = require('./system/Reception');
const reception = new Reception();

io.on('connection', (socket) => {
    socket.on('queue up', (data) => {
        var user = reception.createUser(socket, data);

        reception.match(user);

        socket.broadcast.emit('users length update', reception.queue.length);
        socket.emit('users length update', reception.queue.length);
    });

    socket.on('queue down', () => {
        reception.removeUserFromQueue(socket.id);

        socket.broadcast.emit('users length update', reception.queue.length);
        socket.emit('users length update', reception.queue.length);
    });

    socket.on('message', (data) => {
        var { name } = reception.getRoom(socket.id);
        socket.broadcast.to(name).emit('message', data);
    });

    socket.on('typing', (state) => {
        var { name } = reception.getRoom(socket.id);
        socket.broadcast.to(name).emit('typing', state);
    });

    socket.on('leave', () => {
        var { name } = reception.getRoom(socket.id);

        socket.broadcast.to(name).emit("connection end");

        reception.destroyRoom(name);
    });

    socket.on('disconnect', () => {
        if(!reception.getUser(socket.id)) return;

        var { name } = reception.getRoom(socket.id);

        socket.broadcast.to(name).emit("connection end");

        reception.destroyRoom(name);
        reception.removeUser(socket.id);
    });
});