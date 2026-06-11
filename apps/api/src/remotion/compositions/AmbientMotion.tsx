import React from 'react';
import {
    AbsoluteFill,
    Html5Audio,
    Img,
    interpolate,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

const fontFamily = 'Montserrat';

interface AmbientMotionProps {
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
    fadeInMs: number;
    fadeOutMs: number;
}

export const AmbientMotion: React.FC<AmbientMotionProps> = ({
    imageUrl,
    audioUrl,
    phrase,
    fadeInMs,
    fadeOutMs,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames, width } = useVideoConfig();

    const fadeInFrames = Math.max(1, Math.round((fadeInMs / 1000) * fps));
    const fadeOutFrames = Math.max(1, Math.round((fadeOutMs / 1000) * fps));
    const endFade = Math.max(durationInFrames - fadeOutFrames, fadeInFrames + 1);
    const lastFrame = Math.max(endFade + 1, durationInFrames - 1);

    const blackOpacity = interpolate(
        frame,
        [0, fadeInFrames, endFade, lastFrame],
        [1, 0.2, 0.2, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    const fontSize = Math.round(width * 0.038);
    const barPaddingV = Math.round(width * 0.019);
    const barPaddingH = Math.round(width * 0.06);

    const fontUrl = staticFile('fonts/Montserrat-500.ttf');

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            <style>
                {`
                    @font-face {
                        font-family: 'Montserrat';
                        font-weight: 500;
                        src: url('${fontUrl}') format('truetype');
                    }
                `}
            </style>

            {/* Layer 1: photo */}
            <AbsoluteFill>
                <Img
                    src={imageUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </AbsoluteFill>

            {/* Layer 2: text bar */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#dfe8f6',
                    paddingTop: barPaddingV,
                    paddingBottom: barPaddingV,
                    paddingLeft: barPaddingH,
                    paddingRight: barPaddingH,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        fontSize,
                        fontWeight: 500,
                        color: '#000',
                        textTransform: 'lowercase',
                        fontFamily,
                        lineHeight: 1.3,
                        textAlign: 'center',
                    }}
                >
                    {phrase}
                </span>
            </div>

            {/* Layer 3: black fade-in/fade-out overlay */}
            <AbsoluteFill
                style={{
                    backgroundColor: '#000',
                    opacity: blackOpacity,
                }}
            />

            {audioUrl ? <Html5Audio src={audioUrl} /> : null}
        </AbsoluteFill>
    );
};
