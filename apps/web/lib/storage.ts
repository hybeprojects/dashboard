import fs from 'fs';
import path from 'path';

export class LocalStorage {
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || path.join(process.cwd(), 'storage');

    // Create storage directory
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, filename: string, folder: string = 'kyc') {
    const filePath = path.join(this.storagePath, folder, filename);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, file);
    return { path: filePath, url: `/api/storage/${folder}/${encodeURIComponent(filename)}` };
  }

  async getSignedUrl(filePath: string) {
    // For local storage, signed URL is a direct download endpoint with encoded path
    // filePath is expected to be relative to storage root
    return `/api/storage/download?file=${encodeURIComponent(filePath)}`;
  }
}

export const storage = new LocalStorage();
