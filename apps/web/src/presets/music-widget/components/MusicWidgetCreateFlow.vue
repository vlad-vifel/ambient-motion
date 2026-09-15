<template>
    <div class="mx-auto flex w-full max-w-xl flex-col gap-6">
        <MusicWidgetCreate
            v-model="entries"
            :step="step"
            :tracks="audioStore.items"
            :submitting="submitting"
            :error="error"
            @generate="submit"
            @next="goToStep2"
            @back="goToStep1"
        />
    </div>
</template>

<script setup lang="ts">
    import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
    import MusicWidgetCreate from '@/presets/music-widget/components/MusicWidgetCreate.vue';
    import type {
        MusicWidgetCreateFlowProps,
        MusicWidgetEntry,
    } from '@/presets/music-widget/types';
    import { getApiErrorMessage } from '@/lib/errors';
    import { useAudioStore } from '@/stores/audio';
    import { useSessionsStore } from '@/stores/sessions';

    const props = defineProps<MusicWidgetCreateFlowProps>();
    const emit = defineEmits<{
        (event: 'step-change', step: 1 | 2): void;
    }>();
    const audioStore = useAudioStore();
    const sessionsStore = useSessionsStore();
    const route = useRoute();
    const router = useRouter();
    const entries = ref<MusicWidgetEntry[]>([]);
    const step = ref<1 | 2>(1);
    watch(step, (value) => emit('step-change', value), { immediate: true });
    const draftId = ref<string | null>(null);
    const populating = ref(false);
    const submitting = ref(false);
    const error = ref('');

    function goToStep1() {
        step.value = 1;
    }

    function goToStep2() {
        step.value = 2;
    }

    function buildDraftPayload() {
        return {
            id: draftId.value ?? undefined,
            assetIds: [],
            durationMs: 0,
            fadeInMs: 0,
            fadeOutMs: 0,
            presetId: props.presetId,
            entries: entries.value.map((entry) => ({
                phrase: audioStore.items.find((audio) => audio.id === entry.audioId)?.title ?? '',
                audioId: entry.audioId,
                trimStartMs: entry.trimStartMs,
                trimEndMs: entry.trimEndMs,
                audioFadeInMs: entry.audioFadeInMs,
                audioFadeOutMs: entry.audioFadeOutMs,
                settings: entry.settings,
            })),
        };
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let savePromise: Promise<void> | null = null;
    let draftDirty = false;

    function scheduleDraftSave() {
        if (populating.value || submitting.value || !draftId.value) return;
        draftDirty = true;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            void persistDraft();
        }, 800);
    }

    async function persistDraft() {
        if (populating.value || submitting.value || !draftId.value || !draftDirty || savePromise) {
            return savePromise ?? undefined;
        }

        savePromise = (async () => {
            while (draftDirty && !populating.value && !submitting.value && draftId.value) {
                draftDirty = false;
                try {
                    await sessionsStore.saveDraft(buildDraftPayload());
                    error.value = '';
                } catch (reason: unknown) {
                    draftDirty = true;
                    error.value = getApiErrorMessage(reason, 'Failed to save the draft');
                    return;
                }
            }
        })();

        try {
            await savePromise;
        } finally {
            savePromise = null;
        }
    }

    async function flushDraftSave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        await persistDraft();
    }

    watch(entries, scheduleDraftSave, { deep: true });

    async function submit() {
        if (!entries.value.length || submitting.value) return;
        submitting.value = true;
        error.value = '';
        try {
            const session = await sessionsStore.saveDraft(buildDraftPayload());
            draftId.value = session.id;
            await sessionsStore.generate(
                session.id,
                entries.value.map((entry) => ({
                    phrase:
                        audioStore.items.find((audio) => audio.id === entry.audioId)?.title ?? '',
                })),
            );
            await router.push(`/create/${session.id}`);
        } catch (reason: unknown) {
            error.value = getApiErrorMessage(reason, 'Failed to create Music Widget videos');
        } finally {
            submitting.value = false;
        }
    }

    onMounted(async () => {
        await audioStore.fetchAll();
        const sessionId = route.params.id as string | undefined;
        if (!sessionId) return;

        const session =
            sessionsStore.current?.id === sessionId
                ? sessionsStore.current
                : await sessionsStore.fetchOne(sessionId);
        populating.value = true;
        try {
            draftId.value = session.id;
            entries.value = (session.videos ?? [])
                .filter((video) => Boolean(video.audioId))
                .map((video) => ({
                    audioId: video.audioId!,
                    trimStartMs: video.audioStartMs ?? 0,
                    trimEndMs: (video.audioStartMs ?? 0) + video.durationMs,
                    audioFadeInMs: video.audioFadeInMs ?? 0,
                    audioFadeOutMs: video.audioFadeOutMs ?? 0,
                    settings: video.settings as MusicWidgetEntry['settings'],
                }));
            step.value = entries.value.length ? 2 : 1;
        } finally {
            populating.value = false;
        }
    });

    onBeforeRouteLeave(flushDraftSave);
    onBeforeUnmount(() => {
        void flushDraftSave();
    });
</script>
