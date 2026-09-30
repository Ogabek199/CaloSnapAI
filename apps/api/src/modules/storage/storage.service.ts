import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Stores JPEG images in Cloudinary when CLOUDINARY_URL is set.
 * Falls back to local disk for development only: Railway's filesystem is wiped on every deploy.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly useCloudinary: boolean;
  private readonly uploadsRoot = path.join(process.cwd(), 'uploads');

  constructor(configService: ConfigService) {
    const url = configService.get<string>('CLOUDINARY_URL');
    this.useCloudinary = !!url;
    if (url) {
      cloudinary.config({ secure: true });
    } else if (configService.get('NODE_ENV') === 'production') {
      this.logger.warn('CLOUDINARY_URL is not set; images are stored on ephemeral local disk.');
    }
  }

  get isRemote(): boolean {
    return this.useCloudinary;
  }

  async saveJpeg(buffer: Buffer, folder: 'scans' | 'avatars'): Promise<string> {
    const id = randomUUID();

    if (this.useCloudinary) {
      const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `taom-ai/${folder}`,
        public_id: id,
        resource_type: 'image',
        overwrite: false,
      });
      return result.secure_url;
    }

    const dir = path.join(this.uploadsRoot, folder);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, `${id}.jpg`), buffer);
    return `/uploads/${folder}/${id}.jpg`;
  }

  /** Best-effort removal of images this service stored; foreign URLs and data URIs are ignored. */
  async deleteMany(urls: (string | null | undefined)[]): Promise<void> {
    const cloudIds: string[] = [];
    const localFiles: string[] = [];
    for (const url of urls) {
      if (!url) continue;
      const cloud = /\/image\/upload\/(?:v\d+\/)?(taom-ai\/(?:scans|avatars)\/[\w-]+)\.\w+$/.exec(url);
      if (cloud) cloudIds.push(cloud[1]);
      const local = /^\/uploads\/(scans|avatars)\/([\w-]+\.jpg)$/.exec(url);
      if (local) localFiles.push(path.join(this.uploadsRoot, local[1], local[2]));
    }

    if (this.useCloudinary) {
      // Admin API accepts at most 100 ids per call.
      for (let i = 0; i < cloudIds.length; i += 100) {
        await cloudinary.api
          .delete_resources(cloudIds.slice(i, i + 100))
          .catch((e) => this.logger.warn(`Cloudinary delete failed: ${e?.message}`));
      }
    }
    await Promise.all(localFiles.map((f) => fs.promises.unlink(f).catch(() => {})));
  }
}
