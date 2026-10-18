import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const defaultFolder = process.env.CLOUDINARY_FOLDER || 'retailflow/products';
const maxFileSizeMb = Number(process.env.MAX_IMAGE_SIZE_MB) || 5;

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  !cloudName.includes('placeholder') &&
  !cloudName.includes('your_') &&
  !apiKey.includes('your_') &&
  !apiSecret.includes('your_')
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log(`Cloudinary SDK configured successfully for cloud: ${cloudName}`);
} else {
  console.log(
    'Notice: Cloudinary credentials not fully configured in environment. Image uploads will use safe simulated storage until valid credentials are added to .env.'
  );
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const MAX_FILE_SIZE_BYTES = maxFileSizeMb * 1024 * 1024;

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export const cloudinaryService = {
  isConfigured(): boolean {
    return isConfigured;
  },

  getCloudName(): string {
    return isConfigured ? cloudName : '';
  },

  getMaxFileSizeMb(): number {
    return maxFileSizeMb;
  },

  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No image file was provided.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file format (${file.mimetype}). Accepted formats: JPEG, PNG, WebP, GIF.`
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the ${maxFileSizeMb}MB limit (actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`
      };
    }

    return { valid: true };
  },

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    if (!isConfigured) {
      throw new Error('Banner image storage is not configured. Add valid Cloudinary credentials before uploading so the image can be stored permanently.');
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: defaultFolder,
            resource_type: 'image',
            overwrite: true,
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes
            });
          }
        );
        uploadStream.end(fileBuffer);
    });
  },

  async delete(publicId: string): Promise<{ success: boolean; result?: any }> {
    if (!publicId) return { success: true };

    if (isConfigured) {
      try {
        const res = await cloudinary.uploader.destroy(publicId, {
          invalidate: true,
          resource_type: 'image'
        });
        return { success: res.result === 'ok' || res.result === 'not found', result: res.result };
      } catch (err: any) {
        console.warn(`Error deleting Cloudinary asset ${publicId}:`, err);
        return { success: false, result: err.message };
      }
    } else {
      // Simulated deletion
      return { success: true, result: 'ok (simulated)' };
    }
  }
};
