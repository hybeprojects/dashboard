import { Injectable } from '@nestjs/common';

@Injectable()
export class KycService {
  async submit() { return { status: 'submitted' }; }
  async approve(id: string) { return { id, status: 'approved' }; }
}
