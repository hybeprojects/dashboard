import { Injectable } from '@nestjs/common';

@Injectable()
export class KycService {
  async submit(payload?: any) { return { status: 'submitted', data: payload }; }
  async approve(id: string) { return { id, status: 'approved' }; }
}
