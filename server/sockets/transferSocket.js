module.exports = function registerSockets(io) {
  const cookie = require('cookie');
  const jwtLib = require('jsonwebtoken');

  io.on('connection', (socket) => {
    try {
      // Prefer token sent in auth payload, fall back to cookie header (httpOnly cookie set by server).
      const tokenFromAuth = socket.handshake.auth?.token;
      let token = tokenFromAuth;

      if (!token && socket.request && socket.request.headers && socket.request.headers.cookie) {
        const cookies = cookie.parse(socket.request.headers.cookie || '');
        token = cookies?.token;
      }

      if (token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET not set');
        const decoded = jwtLib.verify(token, secret);
        const userId = decoded.sub;
        // join room for this user
        socket.join(userId);
      }
    } catch (e) {
      // ignore connection auth errors; socket will remain connected but without user room
    }

    socket.on('disconnect', () => {});
  });
};
