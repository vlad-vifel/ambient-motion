import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import ffmpegStatic from 'ffmpeg-static';

const execAsync = promisify(exec);

export async function cropCenterSquare(
    inputPath: string,
    outputPath: string,
    size: number,
): Promise<void> {
    const ffmpeg = ffmpegStatic || 'ffmpeg';
    await execAsync(`"${ffmpeg}" -y -i "${inputPath}" -vf "crop=${size}:${size}" "${outputPath}"`, {
        maxBuffer: 50 * 1024 * 1024,
    });
}

export async function applyGrainFilter(inputPath: string, outputPath: string): Promise<void> {
    const tmpPath = `${outputPath}.tmp.mp4`;
    const ffmpeg = ffmpegStatic || 'ffmpeg';

    try {
        await execAsync(
            `"${ffmpeg}" -y -i "${inputPath}" -vf "scale=iw/2:-1,noise=c0s=50:c0f=t+u,scale=2*iw:-1" -codec:v libx264 -crf 33 -codec:a copy "${tmpPath}"`,
            { maxBuffer: 50 * 1024 * 1024 },
        );
        await fs.rm(inputPath, { force: true });
        await fs.rename(tmpPath, outputPath);
    } catch (err) {
        await fs.rm(tmpPath, { force: true });
        throw err;
    }
}
