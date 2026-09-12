import React, { useId } from 'react';
import {
    AbsoluteFill,
    Html5Audio,
    Img,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Lora';

const { fontFamily: FONT_FAMILY } = loadFont('normal', { weights: ['500'] });
const TWO_PI = 2 * Math.PI;

interface RpgSettings {
    brightness?: number;
    contrast?: number;
    textOffsetY?: number;
    gapQuestionOptions?: number;
    gapOptions?: number;
    vignette?: boolean;
    overlayPercent?: number;
}

export interface RpgDialogueVideoProps extends Record<string, unknown> {
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
    choiceLeft?: string;
    choiceRight?: string;
    settings?: RpgSettings | null;
}

export const RpgDialogueVideo: React.FC<RpgDialogueVideoProps> = ({
    imageUrl,
    audioUrl,
    phrase,
    choiceLeft = 'Yes',
    choiceRight = 'No',
    settings,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const brightness = settings?.brightness ?? 90;
    const contrast = settings?.contrast ?? 105;
    const textOffsetY = settings?.textOffsetY ?? 0;
    const gapQuestionOptions = settings?.gapQuestionOptions ?? Math.round(height * 0.025);
    const gapOptions = settings?.gapOptions ?? Math.round(width * 0.14);
    const vignette = settings?.vignette ?? true;
    const overlayPercent = settings?.overlayPercent ?? 10;

    const cellSize = Math.max(4, Math.round((width * 0.004) / 2) * 2);
    const dilateRadius = cellSize / 2;

    const driftXPeriod = fps * 7;
    const driftYPeriod = fps * 5.5;
    const driftX = cellSize * 1.7 * Math.sin((frame / driftXPeriod) * TWO_PI);
    const driftY = cellSize * 1.2 * Math.sin((frame / driftYPeriod) * TWO_PI);

    const phraseSize = Math.round(width * 0.062);
    const choiceSize = Math.round(width * 0.053);

    const baseGlow = '0 0 8px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.3)';

    const pulse = 0.5 - 0.5 * Math.cos((frame / (fps * 2.8)) * TWO_PI);
    const pulseInner = 4 + pulse * 14;
    const pulseBlur = 10 + pulse * 32;
    const pulseGlow = `${baseGlow}, 0 0 ${pulseInner}px rgba(255,255,255,${pulse * 0.95}), 0 0 ${pulseBlur}px rgba(255,255,255,${pulse * 0.75})`;

    const rawId = useId();
    const pixelateId = `pixelate-${rawId.replace(/:/g, '')}`;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            <svg width={0} height={0} style={{ position: 'absolute' }}>
                <defs>
                    <filter id={pixelateId} x="0" y="0" width="100%" height="100%">
                        <feFlood x={cellSize / 2} y={cellSize / 2} width={1} height={1} />
                        <feComposite width={cellSize} height={cellSize} />
                        <feTile result="tiles" />
                        <feComposite in="SourceGraphic" in2="tiles" operator="in" />
                        <feMorphology operator="dilate" radius={dilateRadius} />
                    </filter>
                </defs>
            </svg>

            <AbsoluteFill style={{ filter: `url(#${pixelateId})` }}>
                <AbsoluteFill style={{ transform: `translate(${driftX}px, ${driftY}px)` }}>
                    <Img
                        src={imageUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scale(1.12)',
                            transformOrigin: 'center center',
                            filter: `brightness(${brightness / 100}) contrast(${contrast / 100})`,
                        }}
                    />
                </AbsoluteFill>

                <AbsoluteFill
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: gapQuestionOptions,
                        transform: `translateY(${-textOffsetY}px)`,
                    }}
                >
                    <div
                        style={{
                            fontFamily: FONT_FAMILY,
                            fontWeight: 500,
                            fontSize: phraseSize,
                            color: 'rgba(255, 255, 255, 0.93)',
                            textAlign: 'center',
                            lineHeight: 1.7,
                            wordSpacing: '0.12em',
                            paddingLeft: Math.round(width * 0.08),
                            paddingRight: Math.round(width * 0.08),
                            textShadow: baseGlow,
                        }}
                    >
                        {phrase}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: gapOptions,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: Math.round(choiceSize * 0.28),
                            }}
                        >
                            <Img
                                src={staticFile('presets/rpg-dialogue/controls/choice-x.svg')}
                                style={{
                                    width: Math.round(choiceSize * 0.88),
                                    height: Math.round(choiceSize * 0.88),
                                    transform: 'scaleY(-1)',
                                    display: 'block',
                                    flexShrink: 0,
                                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: FONT_FAMILY,
                                    fontWeight: 500,
                                    fontSize: choiceSize,
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textShadow: pulseGlow,
                                }}
                            >
                                {choiceLeft}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: Math.round(choiceSize * 0.28),
                            }}
                        >
                            <Img
                                src={staticFile('presets/rpg-dialogue/controls/choice-o.svg')}
                                style={{
                                    width: Math.round(choiceSize * 0.88),
                                    height: Math.round(choiceSize * 0.88),
                                    transform: 'scaleY(-1)',
                                    display: 'block',
                                    flexShrink: 0,
                                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: FONT_FAMILY,
                                    fontWeight: 500,
                                    fontSize: choiceSize,
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    textShadow: baseGlow,
                                }}
                            >
                                {choiceRight}
                            </span>
                        </div>
                    </div>
                </AbsoluteFill>
            </AbsoluteFill>

            {vignette && (
                <AbsoluteFill
                    style={{
                        background:
                            'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            <AbsoluteFill
                style={{
                    backgroundColor: `rgba(0,0,0,${overlayPercent / 100})`,
                    pointerEvents: 'none',
                }}
            />

            {audioUrl ? <Html5Audio src={audioUrl} /> : null}
        </AbsoluteFill>
    );
};
