<template>
    <component
        :is="capabilities?.settingsDialogComponent"
        v-if="isTrack"
        :open="open"
        :track="track"
        :entry="trackEntry"
        submit-label="Recreate video"
        :reset-to-initial="true"
        @update:open="emit('update:open', $event)"
        @apply="applyTrackSettings"
    />

    <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
        <DialogContent
            class="max-w-sm gap-0 overflow-hidden p-0"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Edit video</DialogTitle>
                <DialogDescription class="sr-only">Edit video settings</DialogDescription>
            </DialogHeader>

            <div class="flex flex-col gap-4 px-6 pb-6">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Asset</label>
                    <button
                        type="button"
                        class="group relative size-40 overflow-hidden rounded-lg bg-muted text-left"
                        aria-label="Change asset"
                        @click="pickerOpen = true"
                    >
                        <img
                            v-if="selectedAsset"
                            :src="selectedAsset.url"
                            :alt="selectedAsset.filename"
                            class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center">
                            <ImageIcon class="size-5 text-muted-foreground" />
                        </span>
                        <span
                            class="absolute top-1 right-1 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        >
                            <Pencil class="size-3" />
                        </span>
                    </button>
                </div>

                <component
                    :is="capabilities?.entryCardComponent"
                    v-if="isDialogue"
                    :phrase="phrase"
                    :choice-left="choiceLeft"
                    :choice-right="choiceRight"
                    @update:phrase="phrase = $event"
                    @update:choice-left="choiceLeft = $event"
                    @update:choice-right="choiceRight = $event"
                />
                <div v-else class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground" for="video-phrase">Phrase</label>
                    <Input
                        id="video-phrase"
                        v-model="phrase"
                        placeholder="nothing feels the same now"
                        @keydown.enter="submit"
                    />
                </div>

                <div class="flex items-center justify-between gap-2">
                    <Button
                        v-if="isDialogue"
                        size="sm"
                        variant="outline"
                        :disabled="!selectedAsset"
                        @click="settingsOpen = true"
                    >
                        <SlidersHorizontal class="mr-1 size-3.5" />
                        Settings
                    </Button>
                    <span v-else />
                    <div class="flex items-center gap-2">
                        <Button size="sm" variant="ghost" @click="close">Cancel</Button>
                        <Button :disabled="!canSubmit" size="sm" @click="submit">
                            <Loader2 v-if="submitting" class="mr-1 size-3.5 animate-spin" />
                            Recreate video
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <AssetPickerDialog
        v-model:open="pickerOpen"
        :initial-asset="selectedAsset"
        @select="selectedAsset = $event"
    />

    <component
        :is="capabilities?.settingsDialogComponent"
        v-if="isDialogue && selectedAsset"
        v-model:open="settingsOpen"
        :image-url="selectedAsset.url"
        :phrase="phrase"
        :choice-left="choiceLeft"
        :choice-right="choiceRight"
        :settings="settings"
        @apply="settings = $event"
    />
</template>

<script setup lang="ts">
    import { ImageIcon, Loader2, Pencil, SlidersHorizontal } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import AssetPickerDialog from '@/components/assets/AssetPickerDialog.vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { getPresetDefinition } from '@/presets/registry';
    import { PresetEntryMode } from '@/presets/types';
    import type { Asset } from '@/stores/assets';
    import type { Audio } from '@/stores/audio';
    import { useVideosStore } from '@/stores/videos';
    import type { TrackEditorEntry, VideoEditDialogEmits, VideoEditDialogProps } from './types';

    const props = defineProps<VideoEditDialogProps>();

    const emit = defineEmits<VideoEditDialogEmits>();

    const videosStore = useVideosStore();
    const phrase = ref('');
    const choiceLeft = ref('');
    const choiceRight = ref('');
    const selectedAsset = ref<Asset | null>(null);
    const pickerOpen = ref(false);
    const settingsOpen = ref(false);
    const settings = ref<Record<string, unknown>>({});
    const submitting = ref(false);

    const capabilities = computed(() => getPresetDefinition(props.video?.presetId ?? ''));
    const isDialogue = computed(() => capabilities.value?.entryMode === PresetEntryMode.Dialogue);
    const isTrack = computed(() => capabilities.value?.entryMode === PresetEntryMode.Track);
    const defaultSettings = computed(
        () => (capabilities.value?.defaultSettings?.() ?? {}) as Record<string, unknown>,
    );
    const track = computed<Audio | null>(() => {
        const track = props.video?.audio;
        if (!track) return null;
        return {
            ...track,
            filename: track.filename ?? '',
            url: track.url ?? '',
            uploadedAt: '',
            externalTrackId: null,
            externalDurationMs: null,
        };
    });
    const trackEntry = computed<TrackEditorEntry | null>(() => {
        const video = props.video;
        if (!video?.audioId) return null;
        return {
            audioId: video.audioId,
            trimStartMs: video.audioStartMs,
            trimEndMs: video.audioStartMs + video.durationMs,
            audioFadeInMs: video.audioFadeInMs,
            audioFadeOutMs: video.audioFadeOutMs,
            settings: { ...defaultSettings.value, ...(video.settings as Record<string, unknown>) },
        };
    });
    const settingsChanged = computed(
        () =>
            isDialogue.value &&
            JSON.stringify(settings.value) !==
                JSON.stringify(props.video?.settings ?? defaultSettings.value),
    );
    const canSubmit = computed(() => {
        if (!phrase.value.trim() || !selectedAsset.value || submitting.value) return false;
        return (
            phrase.value.trim() !== props.video?.phrase ||
            selectedAsset.value.id !== props.video?.assetId ||
            (isDialogue.value && choiceLeft.value.trim() !== (props.video?.choiceLeft ?? '')) ||
            (isDialogue.value && choiceRight.value.trim() !== (props.video?.choiceRight ?? '')) ||
            settingsChanged.value
        );
    });

    watch(
        () => [props.open, props.video] as const,
        ([open, video]) => {
            if (!open || !video) return;
            phrase.value = video.phrase;
            choiceLeft.value = video.choiceLeft ?? '';
            choiceRight.value = video.choiceRight ?? '';
            settings.value = {
                ...defaultSettings.value,
                ...(video.settings as Record<string, unknown>),
            };
            selectedAsset.value = video.asset ? (video.asset as unknown as Asset) : null;
        },
        { immediate: true },
    );

    function close() {
        emit('update:open', false);
    }

    async function submit() {
        const video = props.video;
        if (!video || !canSubmit.value) return;
        submitting.value = true;
        try {
            const updates: {
                phrase?: string;
                assetId?: string;
                choiceLeft?: string;
                choiceRight?: string;
                settings?: Record<string, unknown>;
            } = {};
            if (phrase.value.trim() !== video.phrase) updates.phrase = phrase.value.trim();
            if (selectedAsset.value?.id !== video.assetId)
                updates.assetId = selectedAsset.value?.id;
            if (isDialogue.value && choiceLeft.value.trim() !== (video.choiceLeft ?? '')) {
                updates.choiceLeft = choiceLeft.value.trim();
            }
            if (isDialogue.value && choiceRight.value.trim() !== (video.choiceRight ?? '')) {
                updates.choiceRight = choiceRight.value.trim();
            }
            if (settingsChanged.value) updates.settings = settings.value;
            await videosStore.requeue(video.id, updates);
            emit('requeued');
            close();
        } finally {
            submitting.value = false;
        }
    }

    async function applyTrackSettings(entry: TrackEditorEntry) {
        const video = props.video;
        if (!video || submitting.value) return;
        submitting.value = true;
        try {
            await videosStore.requeue(video.id, {
                audioStartMs: entry.trimStartMs,
                durationMs: entry.trimEndMs - entry.trimStartMs,
                audioFadeInMs: entry.audioFadeInMs,
                audioFadeOutMs: entry.audioFadeOutMs,
                settings: entry.settings,
            });
            emit('requeued');
        } finally {
            submitting.value = false;
        }
    }
</script>
