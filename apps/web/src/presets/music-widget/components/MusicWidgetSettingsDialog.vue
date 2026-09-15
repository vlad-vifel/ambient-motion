<template>
    <Dialog v-model:open="dialogOpen">
        <DialogContent fullscreen>
            <DialogHeader class="px-6 pb-4 pt-6"
            ><DialogTitle>Settings</DialogTitle
            ><DialogDescription class="sr-only"
            >Music Widget render settings</DialogDescription
            ></DialogHeader
            >
            <div
                v-if="track && localEntry"
                class="grid min-h-0 gap-6 overflow-y-auto px-6 pb-4 lg:grid-cols-[minmax(300px,430px)_1fr]"
            >
                <div class="flex flex-col items-center gap-3">
                    <div
                        :ref="setFullscreenContainer"
                        class="relative flex w-full justify-center"
                        :class="isPreviewFullscreen && 'h-dvh w-dvw items-center bg-black'"
                    >
                        <div
                            class="group relative overflow-hidden bg-black"
                            :style="previewViewportStyle"
                        >
                            <MusicWidgetPreviewCanvas
                                :track="track"
                                :settings="localEntry.settings"
                                :preview-current-time="previewCurrentTime"
                                :preview-progress="previewProgress"
                                :buttons-asset="buttonsAsset"
                                :overlay-asset="overlayAsset"
                                :visualizer-asset="visualizerAsset"
                                :style="previewCanvasStyle"
                            /><Button
                                v-if="!isPreviewFullscreen"
                                size="sm"
                                variant="secondary"
                                class="absolute bottom-3 right-3 size-9 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                title="Fullscreen preview"
                                @click.stop="toggleFullscreen"
                            ><Maximize2 class="size-4" /><span class="sr-only"
                            >Fullscreen preview</span
                            ></Button
                            >
                        </div>
                        <Button
                            v-if="isPreviewFullscreen"
                            size="sm"
                            variant="secondary"
                            class="absolute right-5 top-5 z-10 size-10 p-0"
                            title="Exit fullscreen preview"
                            @click.stop="toggleFullscreen"
                        ><X class="size-5" /><span class="sr-only"
                        >Exit fullscreen preview</span
                        ></Button
                        >
                    </div>
                </div>
                <div class="flex flex-col gap-5">
                    <section class="flex flex-col gap-3">
                        <div class="flex flex-col gap-3">
                            <span
                                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                            >Audio</span
                            >
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-sm">Selected fragment</span
                                    ><span class="text-sm tabular-nums text-muted-foreground"
                                    >{{
                                        formatDurationSeconds(
                                            displayedTrim[1] - displayedTrim[0],
                                        )
                                    }}
                                        s</span
                                    >
                                </div>
                                <div
                                    class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-3"
                                >
                                    <span
                                        class="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
                                    >{{ formatTime(displayedTrim[0]) }}</span
                                    ><Slider
                                        class="flex-1"
                                        :min="0"
                                        :max="Math.round(track.duration)"
                                        :step="100"
                                        :model-value="displayedTrim"
                                        @update:model-value="updateTrim"
                                        @pointerup="commitTrim"
                                        @keyup="commitTrim"
                                    /><span
                                        class="w-7 shrink-0 text-xs tabular-nums text-muted-foreground"
                                    >{{ formatTime(displayedTrim[1]) }}</span
                                    >
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm">Audio fade-in / fade-out</span>
                                <div
                                    class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-3"
                                >
                                    <span
                                        class="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
                                    >{{ formatTime(displayedFadeHandles[0]) }}</span
                                    ><Slider
                                        class="flex-1"
                                        :min="0"
                                        :max="Math.round(track.duration)"
                                        :handle-min="localEntry.trimStartMs"
                                        :handle-max="localEntry.trimEndMs"
                                        :step="100"
                                        :model-value="displayedFadeHandles"
                                        @update:model-value="updateFades"
                                        @pointerup="commitFades"
                                        @keyup="commitFades"
                                    /><span
                                        class="w-7 shrink-0 text-xs tabular-nums text-muted-foreground"
                                    >{{ formatTime(displayedFadeHandles[1]) }}</span
                                    >
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <span class="text-sm">Audio preview</span
                                ><MiniAudioPlayer
                                    :key="`${track.id}-${previewResetToken}`"
                                    :src="track.url"
                                    :duration-ms="track.duration"
                                    :start-ms="localEntry.trimStartMs"
                                    :end-ms="localEntry.trimEndMs"
                                    :fade-in-ms="localEntry.audioFadeInMs"
                                    :fade-out-ms="localEntry.audioFadeOutMs"
                                />
                            </div>
                        </div>
                    </section>
                    <section class="flex flex-col gap-3">
                        <span
                            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                        >Appearance</span
                        >
                        <div class="flex flex-col gap-2.5">
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Overall brightness (%)</label
                                ><NumberField
                                    v-model="localEntry.settings.overallBrightness"
                                    :min="0"
                                    :max="150"
                                    :step="5"
                                    class="w-28"
                                ><NumberFieldContent
                                ><NumberFieldDecrement /><NumberFieldInput /><NumberFieldIncrement /></NumberFieldContent
                                ></NumberField>
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Overall contrast (%)</label
                                ><NumberField
                                    v-model="localEntry.settings.contrast"
                                    :min="0"
                                    :max="150"
                                    :step="5"
                                    class="w-28"
                                ><NumberFieldContent
                                ><NumberFieldDecrement /><NumberFieldInput /><NumberFieldIncrement /></NumberFieldContent
                                ></NumberField>
                            </div>
                            <div class="flex items-center justify-between gap-3 pt-1">
                                <label class="text-sm">Background brightness (%)</label
                                ><NumberField
                                    v-model="localEntry.settings.backgroundBrightness"
                                    :min="0"
                                    :max="100"
                                    :step="5"
                                    class="w-28"
                                ><NumberFieldContent
                                ><NumberFieldDecrement /><NumberFieldInput /><NumberFieldIncrement /></NumberFieldContent
                                ></NumberField>
                            </div>
                        </div>
                    </section>
                    <section class="flex flex-col gap-3">
                        <span
                            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                        >Watermark</span
                        ><label
                            class="group flex cursor-pointer items-center gap-2"
                            @click="
                                localEntry.settings.watermarkEnabled =
                                    !localEntry.settings.watermarkEnabled
                            "
                        ><div
                             :class="[
                                 'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors group-hover:border-primary',
                                 localEntry.settings.watermarkEnabled
                                     ? 'border-primary bg-primary text-primary-foreground'
                                     : 'border-input bg-transparent',
                             ]"
                         >
                             <Check v-if="localEntry.settings.watermarkEnabled" class="size-3" />
                         </div>
                            <span
                                :class="[
                                    'select-none text-sm leading-none transition-colors',
                                    localEntry.settings.watermarkEnabled
                                        ? 'text-foreground'
                                        : 'text-muted-foreground group-hover:text-foreground',
                                ]"
                            >Show watermark</span
                            ></label
                        ><Input
                            v-model="localEntry.settings.watermarkText"
                            :disabled="!localEntry.settings.watermarkEnabled"
                            maxlength="40"
                            placeholder="ambient mode"
                        />
                        <div class="flex items-center justify-between gap-3">
                            <label class="text-sm">Watermark brightness (%)</label>
                            <NumberField
                                v-model="localEntry.settings.watermarkBrightness"
                                :min="0"
                                :max="200"
                                :step="5"
                                class="w-28"
                            ><NumberFieldContent
                            ><NumberFieldDecrement /><NumberFieldInput /><NumberFieldIncrement /></NumberFieldContent
                            ></NumberField>
                        </div>
                    </section>
                </div>
            </div>
            <div
                class="flex items-center justify-between gap-2 border-t border-border/50 px-6 py-4"
            >
                <Button size="sm" variant="ghost" :disabled="!hasChanges" @click="reset"
                ><RotateCcw class="mr-1 size-3.5" />Reset</Button
                >
                <div class="flex gap-2">
                    <Button size="sm" variant="ghost" @click="dialogOpen = false">Cancel</Button
                    ><Button size="sm" :disabled="!hasChanges" @click="apply">{{
                        submitLabel
                    }}</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { Check, Maximize2, RotateCcw, X } from 'lucide-vue-next';
    import MiniAudioPlayer from '@/components/audio/MiniAudioPlayer.vue';
    import MusicWidgetPreviewCanvas from '@/presets/music-widget/components/MusicWidgetPreviewCanvas.vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput,
    } from '@/components/ui/number-field';
    import { Slider } from '@/components/ui/slider';
    import {
        defaultMusicWidgetSettings,
        type MusicWidgetSettingsDialogEmits,
        type MusicWidgetSettingsDialogProps,
        type MusicWidgetEntry,
    } from '@/presets/music-widget/types';
    import { useScaledPreview } from '@/presets/music-widget/useScaledPreview';
    import buttonsAsset from '@/assets/presets/music-widget/controls/buttons.png';
    import overlayAsset from '@/assets/presets/music-widget/frames/overlay-frame.png';
    import visualizerAsset from '@/assets/presets/music-widget/frames/visualizer-frame.png';
    import {
        formatMusicWidgetTime as formatTime,
        getMusicWidgetDurationSeconds as formatDurationSeconds,
    } from '@/presets/music-widget/utils';

    const props = withDefaults(defineProps<MusicWidgetSettingsDialogProps>(), {
        submitLabel: 'Apply',
        resetToInitial: false,
    });
    const emit = defineEmits<MusicWidgetSettingsDialogEmits>();
    const dialogOpen = computed({
        get: () => props.open,
        set: (value) => emit('update:open', value),
    });
    const localEntry = ref<MusicWidgetEntry | null>(null);
    const initialEntry = ref<MusicWidgetEntry | null>(null);
    const trimDraft = ref<[number, number] | null>(null);
    const fadeDraft = ref<[number, number] | null>(null);
    const previewResetToken = ref(0);
    const {
        isPreviewFullscreen,
        previewCanvasStyle,
        previewViewportStyle,
        setFullscreenContainer,
        toggleFullscreen,
    } = useScaledPreview(dialogOpen);
    const previewCurrentTime = computed(() =>
        props.track?.duration ? props.track.duration / 2 : 0,
    );
    const previewProgress = computed(() =>
        props.track ? previewCurrentTime.value / props.track.duration : 0,
    );
    const fadeHandles = computed(() =>
        localEntry.value
            ? [
                  localEntry.value.trimStartMs + localEntry.value.audioFadeInMs,
                  localEntry.value.trimEndMs - localEntry.value.audioFadeOutMs,
              ]
            : [0, 0],
    );
    const displayedFadeHandles = computed(() => fadeDraft.value ?? fadeHandles.value);
    const displayedTrim = computed(
        () =>
            trimDraft.value ??
            (localEntry.value
                ? [localEntry.value.trimStartMs, localEntry.value.trimEndMs]
                : [0, 0]),
    );
    const hasChanges = computed(
        () => JSON.stringify(localEntry.value) !== JSON.stringify(initialEntry.value),
    );
    function updateTrim(value: number[] | undefined) {
        if (!value || value.length < 2) return;
        trimDraft.value = [Math.round(value[0]), Math.round(value[1])];
    }
    function commitTrim() {
        if (!localEntry.value || !trimDraft.value) return;
        const [start, end] = trimDraft.value;
        const changedStart = start !== localEntry.value.trimStartMs;
        const changedEnd = end !== localEntry.value.trimEndMs;
        localEntry.value.trimStartMs = start;
        localEntry.value.trimEndMs = end;
        if (changedStart) localEntry.value.audioFadeInMs = 0;
        if (changedEnd) localEntry.value.audioFadeOutMs = 0;
        trimDraft.value = null;
        fadeDraft.value = null;
        previewResetToken.value += 1;
    }
    function updateFades(value: number[] | undefined) {
        if (!value || value.length < 2) return;
        fadeDraft.value = [Math.round(value[0]), Math.round(value[1])];
    }
    function commitFades() {
        if (!localEntry.value || !fadeDraft.value) return;
        const [start, end] = fadeDraft.value;
        localEntry.value.audioFadeInMs = Math.max(0, start - localEntry.value.trimStartMs);
        localEntry.value.audioFadeOutMs = Math.max(0, localEntry.value.trimEndMs - end);
        fadeDraft.value = null;
        previewResetToken.value += 1;
    }
    function reset() {
        if (!localEntry.value || !props.track) return;
        localEntry.value =
            props.resetToInitial && initialEntry.value
                ? JSON.parse(JSON.stringify(initialEntry.value))
                : {
                      audioId: localEntry.value.audioId,
                      trimStartMs: 0,
                      trimEndMs: Math.round(props.track.duration),
                      audioFadeInMs: 0,
                      audioFadeOutMs: 0,
                      settings: defaultMusicWidgetSettings(),
                  };
        trimDraft.value = null;
        fadeDraft.value = null;
        previewResetToken.value += 1;
    }
    function apply() {
        commitTrim();
        commitFades();
        if (!localEntry.value || !hasChanges.value) return;
        emit('apply', JSON.parse(JSON.stringify(localEntry.value)));
        dialogOpen.value = false;
    }
    watch(
        () => [props.open, props.entry] as const,
        ([open, entry]) => {
            if (open && entry) {
                const normalizedEntry = {
                    ...entry,
                    settings: { ...defaultMusicWidgetSettings(), ...entry.settings },
                };
                initialEntry.value = JSON.parse(JSON.stringify(normalizedEntry));
                localEntry.value = JSON.parse(JSON.stringify(normalizedEntry));
                trimDraft.value = null;
                fadeDraft.value = null;
            }
        },
        { immediate: true, deep: true },
    );
</script>
