import { Controller, Post, Body, UseInterceptors, UploadedFiles, Param, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../security/jwt.guard';

@Controller('kyc')
export class KycController {
  constructor(private readonly svc: KycService) {}

  @Post('submit')
  @UseInterceptors(FileFieldsInterceptor(
    [
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'proofAddress', maxCount: 1 },
    ],
    { storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } },
  ))
  submit(@Body() body: any, @UploadedFiles() files: any) {
    return this.svc.submit(body, files);
  }

  // Admin: list submissions
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query('status') status?: string) {
    return this.svc.list(status);
  }

  // Admin approve/reject
  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.svc.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: any) {
    return this.svc.reject(id, body?.reason || null);
  }
}
