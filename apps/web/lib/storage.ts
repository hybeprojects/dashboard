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

    // Ensure default subfolders exist
    for (const folder of ['kyc', 'statements', 'receipts']) {
      const dir = path.join(this.storagePath, folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, filename: string, folder: string = 'kyc') {
    const filePath = path.join(this.storagePath, folder, filename);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, file);
    const relPath = path.join(folder, filename);
    return { path: relPath, url: `/api/storage/${folder}/${encodeURIComponent(filename)}` };
  }

  async getSignedUrl(filePath: string) {
    // For local storage, return direct path served by /api/storage/[...path]
    const segments = filePath.split(/[\\/]+/).filter(Boolean);
    const urlPath = segments.map(encodeURIComponent).join('/');
    return `/api/storage/${urlPath}`;
  }
}

export const storage = new LocalStorage();
