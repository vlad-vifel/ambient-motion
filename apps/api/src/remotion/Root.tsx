import React from 'react';
import { Composition } from 'remotion';
import { MelancholicVideo } from './compositions/MelancholicVideo';

const defaultProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'nothing feels the same now',
    durationMs: 30000,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyVideo = MelancholicVideo as React.ComponentType<any>;

export const RemotionRoot: React.FC = () => (
    <Composition
        id="ambient-motion-1"
        component={AnyVideo}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => ({
            durationInFrames: Math.max(
                1,
                Math.round(((props as typeof defaultProps).durationMs / 1000) * 30),
            ),
        })}
    />
);
