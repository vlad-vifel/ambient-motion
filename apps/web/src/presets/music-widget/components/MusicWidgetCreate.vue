<template>
    <div class="flex w-full flex-col gap-6">
        <div v-if="step === 2">
            <h2 class="text-xl font-semibold">Configure your videos</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">
                Review each track before generating its video.
            </p>
        </div>

        <div v-if="step === 1" class="flex flex-col gap-1.5">
            <label class="text-xs text-muted-foreground">Audio tracks</label>
            <MultiSelect
                v-model="selectedTrackIds"
                :options="trackOptions"
                placeholder="Select audio tracks"
                multiple-label="tracks selected"
                empty-text="Upload audio tracks on the Audio page first."
                :max-selected="10"
            />
            <p class="text-xs text-muted-foreground">
                Select up to 10 tracks. Each track creates its own video.
            </p>
        </div>

        <div v-if="step === 2 && selectedTracks.length" class="flex flex-col gap-4 sm:gap-3">
            <div
                v-for="entry in modelValue"
                :key="entry.audioId"
                class="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
                <img
                    v-if="getTrack(entry.audioId)?.coverUrl"
                    :src="getTrack(entry.audioId)?.coverUrl ?? ''"
                    :alt="`${getTrack(entry.audioId)?.title ?? 'Track'} cover`"
                    class="size-32 shrink-0 rounded-lg object-cover"
                />
                <div
                    v-else
                    class="flex size-32 shrink-0 items-center justify-center rounded-lg bg-muted"
                >
                    <Music class="size-5 text-muted-foreground" />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{{ getTrack(entry.audioId)?.title }}</p>
                    <p class="truncate text-xs text-muted-foreground">
                        {{ getTrack(entry.audioId)?.artist }}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    class="size-10 shrink-0 p-0"
                    title="Preview and settings"
                    @click="openEditor(entry.audioId)"
                >
                    <SlidersHorizontal class="size-4" />
                    <span class="sr-only">Preview and settings</span>
                </Button>
            </div>
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <div
            class="sticky bottom-0 flex justify-between border-t border-border/50 bg-background py-4"
        >
            <Button v-if="step === 2" size="sm" variant="ghost" @click="emit('back')">Back</Button>
            <span v-else />
            <Button v-if="step === 1" :disabled="!modelValue.length" @click="emit('next')">
                Next
            </Button>
            <Button v-else :disabled="!modelValue.length || submitting" @click="emit('generate')">
                <Loader2 v-if="submitting" class="mr-1 size-3.5 animate-spin" />
                Create videos ({{ modelValue.length }})
            </Button>
        </div>
    </div>

    <MusicWidgetSettingsDialog
        v-model:open="editorOpen"
        :track="activeTrack"
        :entry="currentEntry"
        @apply="applyEditor"
    />
</template>

<script setup lang="ts">
    import { Loader2, Music, SlidersHorizontal } from 'lucide-vue-next';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
    import MusicWidgetSettingsDialog from '@/presets/music-widget/components/MusicWidgetSettingsDialog.vue';
    import {
        defaultMusicWidgetSettings,
        type MusicWidgetCreateEmits,
        type MusicWidgetCreateProps,
        type MusicWidgetEntry,
    } from '@/presets/music-widget/types';
    import { AudioSourceType } from '@/types/audio';

    const props = defineProps<MusicWidgetCreateProps>();
    const emit = defineEmits<MusicWidgetCreateEmits>();

    const editorOpen = ref(false);
    const activeId = ref<string | null>(null);
    const availableTracks = computed(() =>
        props.tracks.filter((track) => track.sourceType === AudioSourceType.Spotify),
    );
    const selectedTracks = computed(() =>
        props.modelValue.map((entry) => getTrack(entry.audioId)).filter(Boolean),
    );
    const trackOptions = computed<MultiSelectOption[]>(() =>
        availableTracks.value.map((track) => ({
            value: track.id,
            label: track.title,
            description: track.artist,
            imageUrl: track.coverUrl,
        })),
    );
    const selectedTrackIds = computed({
        get: () => props.modelValue.map((entry) => entry.audioId),
        set: (audioIds: string[]) => {
            const entries = audioIds.slice(0, 10).flatMap((audioId) => {
                const existing = props.modelValue.find((entry) => entry.audioId === audioId);
                if (existing) return [existing];
                const track = getTrack(audioId);
                if (!track) return [];
                return [
                    {
                        audioId: track.id,
                        trimStartMs: 0,
                        trimEndMs: Math.round(track.duration),
                        audioFadeInMs: 0,
                        audioFadeOutMs: 0,
                        settings: defaultMusicWidgetSettings(),
                    },
                ];
            });
            emit('update:modelValue', entries);
        },
    });
    const activeTrack = computed(() =>
        activeId.value ? (getTrack(activeId.value) ?? null) : null,
    );
    const currentEntry = computed(() =>
        activeId.value
            ? (props.modelValue.find((entry) => entry.audioId === activeId.value) ?? null)
            : null,
    );

    function getTrack(id: string) {
        return props.tracks.find((track) => track.id === id);
    }

    function openEditor(id: string) {
        activeId.value = id;
        editorOpen.value = true;
    }

    function applyEditor(updated: MusicWidgetEntry) {
        emit(
            'update:modelValue',
            props.modelValue.map((entry) => (entry.audioId === updated.audioId ? updated : entry)),
        );
    }
</script>
