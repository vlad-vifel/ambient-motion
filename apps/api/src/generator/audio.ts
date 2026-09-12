import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

const ffmpeg = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';

export function muxAudioTrack({
    videoPath,
    audioPath,
    outputPath,
}: {
    videoPath: string;
    audioPath: string;
    outputPath: string;
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(
            ffmpeg,
            [
                '-y',
                '-i',
                videoPath,
                '-i',
                audioPath,
                '-map',
                '0:v:0',
                '-map',
                '1:a:0',
                '-c:v',
                'copy',
                '-c:a',
                'aac',
                '-b:a',
                '192k',
                '-movflags',
                '+faststart',
                '-shortest',
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
            reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-1000)}`));
        });
    });
}
