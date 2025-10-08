import { Body, Controller, Param, Post } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly svc: KycService) {}
  @Post('submit') submit(@Body() _payload: any) { return this.svc.submit(); }
  @Post(':id/approve') approve(@Param('id') id: string) { return this.svc.approve(id); }
}
