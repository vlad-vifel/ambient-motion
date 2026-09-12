import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

const ffmpeg = ffmpegStatic || 'ffmpeg';

export function renderThumbnail({
    videoPath,
    durationMs,
    outputPath,
}: {
    videoPath: string;
    durationMs: number;
    outputPath: string;
}): Promise<void> {
    const middleTimestampSeconds = Math.max(0, durationMs / 2000);
    const centerSquareFilter = "crop='min(iw,ih)':'min(iw,ih)':(iw-ow)/2:(ih-oh)/2";

    return new Promise((resolve, reject) => {
        const process = spawn(
            ffmpeg,
            [
                '-y',
                '-i',
                videoPath,
                '-ss',
                String(middleTimestampSeconds),
                '-an',
                '-frames:v',
                '1',
                '-vf',
                centerSquareFilter,
                '-q:v',
                '4',
                outputPath,
            ],
            { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        let stderr = '';

        process.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        process.once('error', reject);
        process.once('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`FFmpeg thumbnail extraction failed: ${stderr.slice(-1000)}`));
        });
    });
}
