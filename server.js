function debug (obj) {
    return util.inspect(obj, false, null);
}

var util = require('util');
// io(<port>) will create a http server
var io = require('socket.io')(5465);
var fs = require('fs');

var clients;

if (fs.existsSync('history.js')) {
    clients = JSON.parse(fs.readFileSync('history.js', {encoding: 'utf8'}));
} else {
    clients = {};
}

io.on('connection', function (socket) {
    var session;

    socket.on('join', function (sess) {
        session = sess;
        if (!clients[session]) {
            clients[session] = {clients: [], msg: []};
        }
        clients[session].clients.push(socket.id);

        console.log('sending history: ' + debug(clients[session].msg));
        socket.emit('history', clients[session].msg);
    });

    socket.on('disconnect', function () {
        console.log('Disconnection: ' + debug(clients[session]));
        var indexSocket = clients[session].clients.indexOf(socket.id);
        if (-1 !== indexSocket) {
            clients[session].clients.splice(indexSocket, 1);
        }
    });

    socket.on('message', function (msg) {
        var sess = clients[session];

        var date = new Date();
        var data = {date: date.valueOf(), name: msg.name.substring(0, 30), msg: msg.msg.substring(0, 250)};

        sess.msg.push(data);
        while (15 < sess.msg.length) {
            sess.msg.shift();
        }

        for (var i=0; i < sess.clients.length; ++i) {
            console.log('sending to ' + sess.clients[i] + ' ' + debug(data));
            socket.to(sess.clients[i]).emit('message', data);
        }
    });
});

process.on('SIGINT', function () {
    console.log('Server is shutting down');
    
    var key;
    
    for (key in clients) {
        if (clients.hasOwnProperty(key)) {
            clients[key].clients = [];
        }
    }
    fs.writeFile('history.js', JSON.stringify(clients), function (err) {
        if (err) {
            console.log(err);
        }
        process.exit();
    });
});

console.log('Server running at http://0.0.0.0:5465/');
