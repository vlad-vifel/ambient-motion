import { generateSignedUrl } from '../lib/s3';

interface VideoWithUrls {
    status: string;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    audio?: { filename?: string } | null;
    [key: string]: unknown;
}

export function applyVideoSignedUrls<T extends VideoWithUrls>(video: T, userId: string) {
    const audio = video.audio;
    return {
        ...video,
        audio: audio
            ? {
                  ...audio,
                  url: audio.filename
                      ? generateSignedUrl(`audio/${audio.filename}`, userId, 24 * 3600)
                      : null,
              }
            : audio,
        videoUrl:
            video.videoUrl && video.status === 'COMPLETED'
                ? generateSignedUrl(video.videoUrl, userId, 24 * 3600)
                : null,
        thumbnailUrl:
            video.thumbnailUrl && video.status === 'COMPLETED'
                ? generateSignedUrl(video.thumbnailUrl, userId, 24 * 3600)
                : null,
    };
}
