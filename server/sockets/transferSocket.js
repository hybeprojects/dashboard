const cookie = require('cookie');
const { createClient } = require('@supabase/supabase-js');
const jwtLib = require('jsonwebtoken');

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

module.exports = function transferSocket(io) {
  return function (socket) {
    socket.on('authenticate', async (token) => {
      try {
        const supabase = getSupabaseServer();
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data || !data.user) throw new Error('Invalid token');
        const userId = data.user.id;
        socket.user = { supabaseId: userId, id: userId };
        socket.join(userId);
        socket.emit('authenticated', { ok: true });
      } catch (e) {
        socket.emit('unauthorized');
        socket.disconnect(true);
      }
    });
  };
};
