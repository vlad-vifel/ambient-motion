export const AudioSourceType = {
    Upload: 'UPLOAD',
    Spotify: 'SPOTIFY',
} as const;

export type AudioSourceType = (typeof AudioSourceType)[keyof typeof AudioSourceType];

export const AudioUploadMethod = {
    File: 'file',
    Spotify: 'spotify',
} as const;

export type AudioUploadMethod = (typeof AudioUploadMethod)[keyof typeof AudioUploadMethod];
