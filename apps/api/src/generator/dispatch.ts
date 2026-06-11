export interface VideoDispatchPayload {
    videoId: string;
    phrase: string;
    presetComponent: string;
    sourceImageUrl: string;
    sourceAudioUrl: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    settings?: unknown;
    userId: string;
}

export function isGitHubDispatchEnabled(): boolean {
    return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function triggerVideoGeneration(payload: VideoDispatchPayload): Promise<void> {
    if (isGitHubDispatchEnabled()) {
        await dispatchVideoGeneration(payload);
    }
}

export async function triggerBatchVideoGeneration(videoIds: string[]): Promise<void> {
    if (isGitHubDispatchEnabled()) {
        await dispatchBatchVideoGeneration(videoIds);
    }
}

async function dispatchBatchVideoGeneration(videoIds: string[]): Promise<void> {
    const token = process.env.GITHUB_TOKEN!;
    const repo = process.env.GITHUB_REPO!;

    const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event_type: 'generate-video-batch',
            client_payload: { videoIds },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub dispatch failed: ${response.status} ${text}`);
    }
}

async function dispatchVideoGeneration(payload: VideoDispatchPayload): Promise<void> {
    const token = process.env.GITHUB_TOKEN!;
    const repo = process.env.GITHUB_REPO!;

    const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event_type: 'generate-video',
            client_payload: payload,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub dispatch failed: ${response.status} ${text}`);
    }
}
