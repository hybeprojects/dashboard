import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDetail } from './kyc-detail.entity';
import { supabaseAdmin } from '../../lib/supabase.client';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { KycSubmitDto } from './dto/kyc-submit.dto';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('KYC_ENCRYPTION_KEY environment variable must be set and be 32 characters long.');
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY as string), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() as string, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY as string), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

@Injectable()
export class KycService {
  constructor(@InjectRepository(KycDetail) private detailRepo: Repository<KycDetail>) {}

  async submit(user: any, body: any, files: any) {
    // basic validation via class-validator
    const dto = plainToInstance(KycSubmitDto, body || {});
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: false });
    if (errors.length) {
      throw new BadRequestException('Invalid submission payload');
    }

    // account type
    const accountType = dto.accountType || 'personal';
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

    const detail = new KycDetail();
    detail.userId = user.sub;
    detail.accountType = accountType;
    detail.fullName = body.fullName;
    detail.dob = body.dob;
    detail.ssnEncrypted = body.ssn ? encrypt(body.ssn) : undefined;
    detail.address = body.address;
    detail.businessName = body.businessName;
    detail.taxIdEncrypted = body.taxId ? encrypt(body.taxId) : undefined;
    detail.businessAddress = body.businessAddress;
    detail.files = uploaded;
    const savedDetail = await this.detailRepo.save(detail);

    return { status: 'submitted', id: savedDetail.id };
  }

  async list(status?: string) {
    const where = status ? { status } : {};
    const details = await this.detailRepo.find({ where, order: { createdAt: 'DESC' } });
    return details.map((detail) => {
      if (detail.ssnEncrypted) {
        detail.ssn = decrypt(detail.ssnEncrypted);
      }
      if (detail.taxIdEncrypted) {
        detail.taxId = decrypt(detail.taxIdEncrypted);
      }
      return detail;
    });
  }

  async approve(id: string) {
    const detail = await this.detailRepo.findOne({ where: { id } });
    if (!detail) throw new NotFoundException('Submission not found');
    detail.status = 'approved';
    await this.detailRepo.save(detail);
    return { id: detail.id, status: detail.status };
  }

  async reject(id: string, reason?: string) {
    const detail = await this.detailRepo.findOne({ where: { id } });
    if (!detail) throw new NotFoundException('Submission not found');
    detail.status = 'rejected';
    detail.rejectReason = reason;
    await this.detailRepo.save(detail);
    return { id: detail.id, status: detail.status };
  }
}
