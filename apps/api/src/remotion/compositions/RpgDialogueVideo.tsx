import React, { useId } from 'react';
import { AbsoluteFill, Html5Audio, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Lora';
import { PixelGridOverlay } from './PixelGridOverlay';

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

interface RpgDialogueVideoProps {
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

    // Always even so cellSize/2 is an integer — ensures pixel blocks align with grid lines
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

            {/* Pixelated layer is screen-fixed: pixel blocks stay locked to the grid
                while the content slides underneath them */}
            <AbsoluteFill style={{ filter: `url(#${pixelateId})` }}>
                {/* Only the image drifts */}
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

                {/* Text is static — stays centered regardless of image drift */}
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
                            <svg
                                width={Math.round(choiceSize * 0.88)}
                                height={Math.round(choiceSize * 0.88)}
                                viewBox="0 0 20.123 20.122"
                                style={{
                                    transform: 'scaleY(-1)',
                                    display: 'block',
                                    flexShrink: 0,
                                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id={`cg-x-${pixelateId}`}
                                        gradientUnits="userSpaceOnUse"
                                        x1="10.0615"
                                        y1="0"
                                        x2="10.0615"
                                        y2="18.0092"
                                    >
                                        <stop offset="0" stopColor="#5B5B5F" />
                                        <stop offset="0.0231" stopColor="#59595D" />
                                        <stop offset="0.4507" stopColor="#333335" />
                                        <stop offset="0.7912" stopColor="#1C1C1D" />
                                        <stop offset="1" stopColor="#141414" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    fill={`url(#cg-x-${pixelateId})`}
                                    cx="10.061"
                                    cy="10.061"
                                    r="10.061"
                                />
                                <polygon
                                    fill="#6273A8"
                                    points="16.107,5.608 14.514,4.015 10.061,8.468 5.608,4.015 4.016,5.608 8.469,10.061 4.016,14.514 5.608,16.106 10.061,11.653 14.514,16.106 16.107,14.514 11.654,10.061"
                                />
                            </svg>
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
                            <svg
                                width={Math.round(choiceSize * 0.88)}
                                height={Math.round(choiceSize * 0.88)}
                                viewBox="0 0 19.996 19.995"
                                style={{
                                    transform: 'scaleY(-1)',
                                    display: 'block',
                                    flexShrink: 0,
                                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id={`cg-o-${pixelateId}`}
                                        gradientUnits="userSpaceOnUse"
                                        x1="9.998"
                                        y1="0"
                                        x2="9.998"
                                        y2="17.896"
                                    >
                                        <stop offset="0" stopColor="#5B5B5F" />
                                        <stop offset="0.0231" stopColor="#59595D" />
                                        <stop offset="0.4507" stopColor="#333335" />
                                        <stop offset="0.7912" stopColor="#1C1C1D" />
                                        <stop offset="1" stopColor="#141414" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    fill={`url(#cg-o-${pixelateId})`}
                                    cx="9.998"
                                    cy="9.998"
                                    r="9.998"
                                />
                                <path
                                    fill="#CC3333"
                                    d="M9.998,5.177c2.658,0,4.82,2.163,4.82,4.82s-2.162,4.82-4.82,4.82c-2.658,0-4.819-2.163-4.819-4.82S7.34,5.177,9.998,5.177 M9.998,3.293c-3.703,0-6.705,3.002-6.705,6.705c0,3.703,3.002,6.705,6.705,6.705c3.704,0,6.706-3.002,6.706-6.705C16.704,6.295,13.702,3.293,9.998,3.293L9.998,3.293z"
                                />
                            </svg>
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

            <PixelGridOverlay cellSize={cellSize} lineColor="#000000" lineThickness={0} />

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
