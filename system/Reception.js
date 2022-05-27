const { nanoid } = require('nanoid');
const moment = require('moment');

class Reception {
    constructor() {
        this.queue = [];
        this.rooms = [];
        this.users = [];
    }

    match(user) {
        if(this.queue.length < 1) 
            return this.queue.push(user);

        var stranger = this.findStranger(user);
        var room = {
            name: nanoid(16),
            created: moment().format(),
            users: [ user, stranger ]
        }

        stranger.socket.join(room.name);
        user.socket.join(room.name);

        this.rooms.push(room);

        stranger.socket.emit("connection established", { name: room.name, created: room.created, user: user.data });
        user.socket.emit("connection established", { name: room.name, created: room.created, user: stranger.data });
    }

    findStranger(user) {
        var { region } = user;
        var candidates = [];

        switch(region) {
            case "Polska":
                candidates = this.queue.filter(user => user.region != "poza Polską");
                break;
            case "poza Polską":
                candidates = this.queue.filter(user => user.region == "poza Polską");
                break;
            default:
                candidates = this.queue.filter(user => user.region == region);
                break;
        }

        if(!candidates.length) {
            candidates = this.queue;
        }

        var candidate = candidates[Math.floor(Math.random() * candidates.length)];
        this.queue = this.queue.filter(user => user.socket.id != candidate.socket.id);

        return candidate;
    }

    createUser(socket, data) {
        var user = {
            socket: socket,
            data: data
        };

        this.users.push(user);

        return user;
    }

    removeUser(socketId) {
        this.users = this.users.filter(user => user.socket.id !== socketId);
        return;
    }

    removeUserFromQueue(socketId) {
        this.queue = this.queue.filter(user => user.socket.id !== socketId);
        return;
    }

    getUser(socketId) {
        return this.users.filter(user => user.socket.id === socketId)[0];
    }

    getRoom(socketId) {
        var found = false;

        this.rooms.forEach(room => {
            room.users.forEach(user => {
                if(user.socket.id == socketId) found = room;
            });
        });

        return found;
    }

    destroyRoom(name) {
        this.rooms = this.rooms.filter(room => room.name !== name);
    }
};
module.exports = Reception;