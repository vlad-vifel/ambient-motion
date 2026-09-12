import React from 'react';
import {
    AbsoluteFill,
    Img,
    interpolate,
    Loop,
    OffthreadVideo,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

interface MusicWidgetSettings {
    overallBrightness?: number;
    watermarkBrightness?: number;
    backgroundBrightness?: number;
    contrast?: number;
    watermarkEnabled?: boolean;
    watermarkText?: string;
}

export interface MusicWidgetVideoProps extends Record<string, unknown> {
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    title?: string;
    artist?: string;
    fullAudioDurationMs?: number;
    audioStartMs?: number;
    audioFadeInMs?: number;
    audioFadeOutMs?: number;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    settings?: MusicWidgetSettings | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function formatTime(valueMs: number): string {
    const seconds = Math.max(0, Math.floor(valueMs / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
        : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export const MusicWidgetVideo: React.FC<MusicWidgetVideoProps> = ({
    imageUrl,
    phrase,
    artist = '',
    fullAudioDurationMs,
    audioStartMs = 0,
    durationMs,
    fadeInMs,
    fadeOutMs,
    settings,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const elapsedMs = (frame / fps) * 1000;
    const totalDuration = Math.max(1, fullAudioDurationMs ?? audioStartMs + durationMs);
    const currentTrackMs = clamp(audioStartMs + elapsedMs, 0, totalDuration);
    const progress = currentTrackMs / totalDuration;
    const overallBrightness = clamp(settings?.overallBrightness ?? 100, 0, 120);
    const watermarkBrightness = clamp(settings?.watermarkBrightness ?? 100, 0, 200);
    const backgroundBrightness = clamp(settings?.backgroundBrightness ?? 80, 0, 100);
    const contrast = clamp(settings?.contrast ?? 100, 0, 200);
    const watermarkEnabled = settings?.watermarkEnabled ?? true;
    const watermarkText = settings?.watermarkText?.trim() || 'ambient mode';
    const titleText = phrase;
    const fadeInFrames = Math.max(1, Math.round((fadeInMs / 1000) * fps));
    const fadeOutFrames = Math.max(1, Math.round((fadeOutMs / 1000) * fps));
    const fadeOutStart = Math.max(fadeInFrames, durationInFrames - fadeOutFrames);
    const videoBlack =
        frame < fadeInFrames
            ? interpolate(frame, [0, fadeInFrames], [1, 0], { extrapolateRight: 'clamp' })
            : interpolate(frame, [fadeOutStart, durationInFrames - 1], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
              });
    const drift = Math.sin((frame / (fps * 7.2)) * Math.PI * 2);
    const wobble = Math.sin((frame / (fps * 5.8)) * Math.PI * 2);
    const rotation = Math.sin((frame / (fps * 8.6)) * Math.PI * 2 + 0.7) * 2;
    const fontUrl = staticFile('fonts/Montserrat-500.ttf');

    return (
        <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
            <style>{`@font-face { font-family: 'MusicWidgetMontserrat'; src: url('${fontUrl}') format('truetype'); font-weight: 500; }`}</style>
            <AbsoluteFill
                style={{
                    filter: `contrast(${contrast / 100}) brightness(${Math.max(1, overallBrightness / 100)})`,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                }}
            >
                <AbsoluteFill
                    style={{
                        transform: `scale(${1.055 + drift * 0.015}) translate(${drift * 8}px, ${wobble * 6}px) rotate(${rotation}deg)`,
                    }}
                >
                    <Img
                        src={imageUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'blur(18px)',
                            transform: 'scale(1.08)',
                        }}
                    />
                </AbsoluteFill>
                <AbsoluteFill
                    style={{ backgroundColor: '#000', opacity: (100 - backgroundBrightness) / 100 }}
                />
                <Loop durationInFrames={Math.max(1, Math.round(24 * fps))}>
                    <OffthreadVideo
                        src={staticFile('presets/music-widget/overlay.mp4')}
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.2,
                            mixBlendMode: 'overlay',
                        }}
                    />
                </Loop>
                <div
                    style={{
                        position: 'absolute',
                        left: 135,
                        top: 411,
                        width: 810,
                        height: 1097,
                        borderRadius: 44,
                        backgroundColor: '#000',
                        opacity: 0.5,
                        overflow: 'hidden',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: 171,
                        top: 445,
                        width: 738,
                        height: 738,
                        borderRadius: 18,
                        overflow: 'hidden',
                    }}
                >
                    <Img
                        src={imageUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 185,
                        top: 1218,
                        width: 710,
                        textAlign: 'center',
                        color: '#fff',
                        fontFamily: 'MusicWidgetMontserrat, sans-serif',
                        fontSize: 30,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {titleText}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        left: 185,
                        top: 1261,
                        width: 710,
                        textAlign: 'center',
                        color: '#fff',
                        opacity: 0.6,
                        fontFamily: 'MusicWidgetMontserrat, sans-serif',
                        fontSize: 30,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {artist}
                </div>
                <Loop durationInFrames={Math.max(1, Math.round(2.4 * fps))}>
                    <OffthreadVideo
                        src={staticFile('presets/music-widget/visualizer.webm')}
                        transparent
                        muted
                        style={{
                            position: 'absolute',
                            left: 830,
                            top: 1233,
                            width: 75,
                            height: 44,
                            objectFit: 'contain',
                            opacity: 0.5,
                        }}
                    />
                </Loop>
                <div
                    style={{
                        position: 'absolute',
                        left: 188,
                        top: 1324,
                        width: 708,
                        height: 16,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(255,255,255,0.65)',
                        fontFamily: 'MusicWidgetMontserrat, sans-serif',
                        fontSize: 25,
                        fontWeight: 600,
                        lineHeight: 1,
                    }}
                >
                    <span style={{ width: 57, flexShrink: 0 }}>{formatTime(currentTrackMs)}</span>
                    <div
                        style={{
                            marginLeft: 24,
                            width: 543,
                            height: 16,
                            flexShrink: 0,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.6)',
                        }}
                    >
                        <div
                            style={{
                                width: `${progress * 100}%`,
                                height: '100%',
                                borderRadius: 8,
                                background: '#fff',
                            }}
                        />
                    </div>
                    <span style={{ marginLeft: 24, width: 60, flexShrink: 0, textAlign: 'right' }}>
                        {formatTime(totalDuration)}
                    </span>
                </div>
                <Img
                    src={staticFile('presets/music-widget/buttons.png')}
                    style={{
                        position: 'absolute',
                        left: 337,
                        top: 1374,
                        width: 407,
                        height: 106,
                        opacity: 0.8,
                        objectFit: 'contain',
                    }}
                />
                {watermarkEnabled ? (
                    <div
                        style={{
                            position: 'absolute',
                            top: 1761,
                            width: '100%',
                            textAlign: 'center',
                            color: '#fff',
                            opacity: Math.min(1, watermarkBrightness / 100),
                            mixBlendMode: 'overlay',
                            fontFamily: 'MusicWidgetMontserrat, sans-serif',
                            fontSize: 35,
                            fontWeight: 600,
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '0 80px',
                        }}
                    >
                        {watermarkText}
                    </div>
                ) : null}
                {watermarkEnabled && watermarkBrightness > 100 ? (
                    <div
                        style={{
                            position: 'absolute',
                            top: 1761,
                            width: '100%',
                            textAlign: 'center',
                            color: '#fff',
                            opacity: Math.min(1, (watermarkBrightness - 100) / 100),
                            mixBlendMode: 'overlay',
                            fontFamily: 'MusicWidgetMontserrat, sans-serif',
                            fontSize: 35,
                            fontWeight: 600,
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '0 80px',
                        }}
                    >
                        {watermarkText}
                    </div>
                ) : null}
            </AbsoluteFill>
            <AbsoluteFill
                style={{
                    backgroundColor: '#000',
                    opacity: Math.max(0, (100 - overallBrightness) / 100),
                }}
            />
            <AbsoluteFill style={{ backgroundColor: '#000', opacity: videoBlack }} />
        </AbsoluteFill>
    );
};
