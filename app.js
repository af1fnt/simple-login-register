const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');


io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

app.use((req, res, next) => {
    req.io = io;
    next();
});



app.use('/auth', authRoutes);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


