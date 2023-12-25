const express = require('express');

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path = require('path');

const server = http.createServer(app);
// This is the instance of soket io in server side
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// for deployment purposes
app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

// create a new object to mapping userName with their soket id
// For production we have to store this object in some database or any where
const userSoketMap = {};

// create a function to get all clines which are connected to same roomId
const getAllConnectedClients = (roomId) => {
    /*
        io.sockets.adapter.rooms.get(roomId) is used to get all connected clients
        in a same roomId and return a MAP, but we want Array. So we use Array.from
        After that we use map function and we get a socketId of all connected clients, then 
        we return an object with socketId and useName usinf userSoketMap object
    */
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userName: userSoketMap[socketId]
        }
    });
}

// When soket is connected then this event will be fired
io.on('connection', (soket) => {
    console.log("socket connected ", soket.id);

    // we have to listen here the which is emit from client side when server is JOIN
    soket.on(ACTIONS.JOIN, ({ roomId, userName }) => {
        // here we have to map the user name with their soket id
        userSoketMap[soket.id] = userName;

        // join the room with soket
        soket.join(roomId);

        /*
            Here there are two cases are possible
            i) Single user joined
            ii) Multiple user joined

            when single user joined, there is no problem
            but when there is multiple user joined then we have to notify the all other
            users which are already joined
            For that, we have to get all the users which are present in same room Id
        */

        const clients = getAllConnectedClients(roomId);
        // now we are notify the all other users that someone has joined with name
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                userName,
                socketId: soket.id
            });
        });
    });

    // Listen for the CODE CHANGE event
    soket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        // ye roomId and code client se mila ahi and we have to send that code to another client, so here we send that code from this server to the other client to yahan se jo code bheje hain usko client main receive karna hoga

        // here io.to means emit the event for all the clients within the rool but, I want to send the event to all clients except the client who code changed.
        // For that we have to write soket.in
        soket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });

    });

    // Listen for the SYNCH_CODE event
    soket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        // here we use io.to because we have to emit only that soketID
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });

    });

    //listen here for disconnecting  Code for disconnecting from soket, pura disconnected hone se pehele ye event
    // call hota hai
    soket.on(ACTIONS.DISCONNECTING, () => {
        // soket.rooms return a map, so we have to convert into Array
        const rooms = [...soket.rooms];
        // notify the connected clients, that one user is disconnected with name
        rooms.forEach((roomId) => {
            soket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: soket.id,
                userName: userSoketMap[soket.id]
            });
        });
        // remove that user from userSoketMap
        delete userSoketMap[soket.id];
        // to leave any room in soket io
        soket.leave();
    })
});

// simple initialization of port number
const PORT = process.env.PORT || 2000;


// listing on the server
server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});