import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycSubmission } from './kyc.entity';
import { supabaseAdmin } from '../../lib/supabase.client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KycService {
  constructor(@InjectRepository(KycSubmission) private repo: Repository<KycSubmission>) {}

  async submit(body: any, files: any) {
    // basic validation
    const accountType = body.accountType || 'personal';
    if (accountType === 'business') {
      const required = [
        'businessName',
        'businessAddress',
        'taxId',
        'annualIncome',
        'depositAccountNumber',
        'routingNumber',
        'initialDeposit',
        'representativeName',
        'representativeSsn',
      ];
      for (const r of required) {
        if (!body[r]) throw new BadRequestException(`${r} is required for business accounts`);
      }
      if (Number(body.initialDeposit) < 500)
        throw new BadRequestException('Minimum initial deposit is $500');
    }

    // upload files to Supabase storage
    const uploaded: { key: string; url: string }[] = [];
    const bucket = 'kyc-docs';

    if (files) {
      for (const fieldName of Object.keys(files)) {
        const farr = files[fieldName];
        if (!farr || !farr.length) continue;
        const f = farr[0] as any;
        const key = `kyc/${uuidv4()}/${f.originalname}`;
        try {
          await supabaseAdmin.storage
            .from(bucket)
            .upload(key, f.buffer, { contentType: f.mimetype });
        } catch (e) {
          // attempt to create bucket and retry once
          try {
            await supabaseAdmin.storage.createBucket(bucket, { public: true });
            await supabaseAdmin.storage
              .from(bucket)
              .upload(key, f.buffer, { contentType: f.mimetype });
          } catch (e2) {
            // ignore failure
          }
        }
        const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(key);
        const url = (urlData as any)?.publicUrl || `/${key}`;
        uploaded.push({ key, url });
      }
    }

    const submission = this.repo.create({
      userId: body.userId || null,
      accountType,
      data: body,
      files: uploaded,
      status: 'submitted',
    } as any);
    const saved = await this.repo.save(submission as any);

    // if business account, initiate micro-deposit verification (placeholder)
    if (accountType === 'business') {
      // create two micro-deposits (in cents) and store in the data for manual verification
      const amt1 = Math.floor(Math.random() * 90) + 1; // 1-90 cents
      const amt2 = Math.floor(Math.random() * 90) + 1;
      saved.data = { ...saved.data, microDeposits: { amt1, amt2, status: 'pending' } };
      await this.repo.save(saved as any);
    }

    return { status: 'submitted', id: saved.id };
  }

  async list(status?: string) {
    const where = status ? { status } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async approve(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    sub.status = 'approved';
    await this.repo.save(sub as any);
    return { id: sub.id, status: sub.status };
  }

  async reject(id: string, reason?: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    sub.status = 'rejected';
    sub.data = { ...sub.data, rejectReason: reason || null };
    await this.repo.save(sub as any);
    return { id: sub.id, status: sub.status };
  }
}
