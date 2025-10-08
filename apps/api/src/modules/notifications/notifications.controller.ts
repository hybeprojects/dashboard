import { Controller, Get, Patch, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../security/jwt.guard';
import { supabaseAdmin } from '../../lib/supabase.client';

@Controller('notifications')
export class NotificationsController {
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    const userId = req.user.sub;
    const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error('Could not fetch notifications');
    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read')
  async markRead(@Req() req: any, @Body() body: { ids: string[] }) {
    const userId = req.user.sub;
    const { error } = await supabaseAdmin.from('notifications').update({ is_read: true }).in('id', body.ids).eq('user_id', userId);
    if (error) throw new Error('Could not update notifications');
    await supabaseAdmin.from('audit_logs').insert([{ action: 'notifications_mark_read', user_id: userId, ip_address: null }]);
    return { success: true };
  }
}
