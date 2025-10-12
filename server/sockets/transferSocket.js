module.exports = function registerSockets(io) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    // expect client to send JWT in auth token; we will map to user id via payload
    try {
      if (token) {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const decoded = jwt.verify(token, secret);
        const userId = decoded.sub;
        // join room for this user
        socket.join(userId);
      }
    } catch (e) {
      // ignore
    }

    socket.on('disconnect', () => {});
  });
};
