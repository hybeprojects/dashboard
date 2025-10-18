module.exports = function registerSockets(io) {
  const cookie = require('cookie');
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  io.on('connection', async (socket) => {
    try {
      const tokenFromAuth = socket.handshake.auth?.token;
      let token = tokenFromAuth;

      if (!token && socket.request && socket.request.headers && socket.request.headers.cookie) {
        const cookies = cookie.parse(socket.request.headers.cookie || '');
        token = cookies?.token || cookies['sb-access-token'] || cookies['supabase-auth-token'];
      }

      if (token) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data && data.user) {
            const userId = data.user.id;
            socket.join(userId);
          }
        } catch (e) {
          // ignore socket auth errors
        }
      }
    } catch (e) {
      // ignore connection auth errors
    }

    socket.on('disconnect', () => {});
  });
};
