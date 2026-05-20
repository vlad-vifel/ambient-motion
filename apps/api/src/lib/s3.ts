import crypto from 'crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: 'us-south-1',
    endpoint: `https://${process.env.SUFY_ORIGIN_DOMAIN!}`,
    credentials: {
        accessKeyId: process.env.SUFY_ACCESS_KEY!,
        secretAccessKey: process.env.SUFY_SECRET_KEY!,
    },
});

const BUCKET_NAME = process.env.SUFY_BUCKET_NAME || 'ambient-motion';
const CDN_DOMAIN = process.env.SUFY_CDN_DOMAIN || '';
const URL_SIGNING_KEY = process.env.SUFY_URL_SIGNING_KEY || '';

export async function uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
    userId: string,
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${userId}/${key}`,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);

    return getCDNUrl(key, userId);
}

export async function deleteFile(key: string, userId: string): Promise<void> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${userId}/${key}`,
        });
        await s3Client.send(command);
    } catch (err) {
        console.warn(`[s3] deleteFile failed for ${userId}/${key}:`, err);
    }
}

export function getCDNUrl(key: string, userId: string): string {
    return `https://${CDN_DOMAIN}/${userId}/${key}`;
}

export function generateSignedUrl(
    key: string,
    userId: string,
    expiresInSeconds: number = 3600,
): string {
    const baseUrl = getCDNUrl(key, userId);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const urlWithExpires = `${baseUrl}?expires=${expiresAt}`;

    const signature = crypto
        .createHmac('sha1', URL_SIGNING_KEY)
        .update(urlWithExpires)
        .digest('base64');

    const urlSafeSignature = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const token = `${BUCKET_NAME}:${urlSafeSignature}`;

    return `${urlWithExpires}&token=${token}`;
}

export async function uploadVideoFile(key: string, body: Buffer, userId: string): Promise<string> {
    return uploadFile(key, body, 'video/mp4', userId);
}

export async function uploadThumbnail(key: string, body: Buffer, userId: string): Promise<string> {
    return uploadFile(key, body, 'image/jpeg', userId);
}
