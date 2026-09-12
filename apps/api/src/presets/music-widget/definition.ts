import { musicWidgetRenderDefinition } from './render-definition';
import { prepareMusicWidgetAudio } from './audio';
import { prepareMusicWidgetDraft, queueMusicWidgetSession } from './session';
import { requeueMusicWidgetVideo } from './requeue';
import { PresetAssetSource, PresetAudioRenderStrategy, type PresetDefinition } from '../types';

export const musicWidgetPreset: PresetDefinition = {
    ...musicWidgetRenderDefinition,
    display: {
        name: 'Music Widget',
        description: 'Vertical music player composition based on the ambientmode50 reference',
        format: 'VERTICAL_9_16',
    },
    applyGrain: false,
    assetSource: PresetAssetSource.AudioCover,
    audioRenderStrategy: PresetAudioRenderStrategy.PreparedTrack,
    prepareAudio: prepareMusicWidgetAudio,
    workflow: {
        prepareDraft: prepareMusicWidgetDraft,
        queueSession: queueMusicWidgetSession,
        requeueVideo: requeueMusicWidgetVideo,
    },
};
