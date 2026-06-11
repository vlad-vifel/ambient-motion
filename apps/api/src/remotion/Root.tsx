import React from 'react';
import { Composition } from 'remotion';
import { AmbientMotion } from './compositions/AmbientMotion';
import { RpgDialogueVideo } from './compositions/RpgDialogueVideo';

const defaultProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'nothing feels the same now',
    durationMs: 30000,
    fadeInMs: 0,
    fadeOutMs: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyVideo = AmbientMotion as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyRpg = RpgDialogueVideo as React.ComponentType<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calcDuration = ({ props }: { props: any }) => ({
    durationInFrames: Math.max(1, Math.round(((props.durationMs as number) / 1000) * 30)),
});

export const RemotionRoot: React.FC = () => (
    <>
        <Composition
            id="ambient-motion"
            component={AnyVideo}
            durationInFrames={30 * 30}
            fps={30}
            width={1080}
            height={1080}
            defaultProps={defaultProps}
            calculateMetadata={calcDuration}
        />
        <Composition
            id="rpg-dialogue"
            component={AnyRpg}
            durationInFrames={30 * 30}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={defaultProps}
            calculateMetadata={calcDuration}
        />
    </>
);
