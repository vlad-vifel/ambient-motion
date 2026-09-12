import { Composition } from 'remotion';
import type { ComponentType } from 'react';
import { renderPresetDefinitions } from '../presets/render-registry';

const getDurationMetadata = (durationMs: number, fps: number) => ({
    durationInFrames: Math.max(1, Math.round((durationMs / 1000) * fps)),
});

export const RemotionRoot = () => (
    <>
        {renderPresetDefinitions.map((preset) => (
            <Composition
                key={preset.id}
                id={preset.compositionId}
                component={preset.component as ComponentType<Record<string, unknown>>}
                durationInFrames={30 * 30}
                fps={preset.fps}
                width={preset.width}
                height={preset.height}
                defaultProps={preset.defaultProps}
                calculateMetadata={({ props }) =>
                    getDurationMetadata(Number(props.durationMs ?? 30000), preset.fps)
                }
            />
        ))}
    </>
);
