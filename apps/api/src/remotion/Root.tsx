import React from 'react';
import { Composition } from 'remotion';
import { MelancholicVideo } from './compositions/MelancholicVideo';
import { VIDEO_PRESETS } from './presets';

const defaultProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'nothing feels the same now',
    durationMs: 30000,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyVideo = MelancholicVideo as React.ComponentType<any>;

export const RemotionRoot: React.FC = () => (
    <>
        {(
            Object.entries(VIDEO_PRESETS) as [
                string,
                { width: number; height: number; fps: number },
            ][]
        ).map(([id, p]) => (
            <Composition
                key={id}
                id={id}
                component={AnyVideo}
                durationInFrames={p.fps * 30}
                fps={p.fps}
                width={p.width}
                height={p.height}
                defaultProps={defaultProps}
                calculateMetadata={({ props }) => ({
                    durationInFrames: Math.max(
                        1,
                        Math.round(((props as typeof defaultProps).durationMs / 1000) * p.fps),
                    ),
                })}
            />
        ))}
    </>
);
