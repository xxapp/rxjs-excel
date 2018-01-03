var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var uid = 0;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/dist/index.html');
});

app.get('/dist/*', function(req, res) {
    res.sendFile(__dirname + req.url);
});

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.join('room', function() {
        io.to('room').emit('uid', ++uid);
    });
    socket.on('disconnect', function() {
        console.log('user disconnected');
        socket.leave('room', function() {
            io.to('room').emit('uid', --uid);
        });
    });

    socket.on('edit', function(value) {
        console.log(value);
        socket.broadcast.emit('sync', value);
    });
})

http.listen(3000, function() {
    console.log('listening on *.3000');
});