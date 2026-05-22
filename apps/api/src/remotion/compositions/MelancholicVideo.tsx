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

interface MelancholicVideoProps {
    imageUrl: string;
    audioUrl: string;
    phrase: string;
    durationMs: number;
}

export const MelancholicVideo: React.FC<MelancholicVideoProps> = ({
    imageUrl,
    audioUrl,
    phrase,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames, width } = useVideoConfig();

    const fadeFrames = Math.round(2.5 * fps);

    const blackOpacity = interpolate(
        frame,
        [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames - fps / 5],
        [1, 0.2, 0.2, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    const fontSize = Math.round(width * 0.042);
    const barPaddingV = Math.round(width * 0.022);
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

            {/* Layer 4: animated noise */}
            <AbsoluteFill style={{ opacity: 0.45, mixBlendMode: 'overlay' }}>
                {/*TODO:*/}
            </AbsoluteFill>

            <Html5Audio src={audioUrl} />
        </AbsoluteFill>
    );
};
