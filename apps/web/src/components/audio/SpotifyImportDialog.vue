<template>
    <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
        <DialogContent class="max-w-lg gap-0" :show-close-button="false">
            <DialogHeader class="pb-3">
                <DialogTitle>Import Spotify track</DialogTitle>
            </DialogHeader>
            <div class="space-y-4">
                <div class="flex flex-col gap-1.5">
                    <label class="block text-xs text-muted-foreground">Spotify link</label>
                    <div class="flex gap-2">
                        <Input
                            v-model="sourceUrl"
                            class="h-10"
                            placeholder="Paste a Spotify track link"
                            :disabled="lookingUp || !!lookup"
                            @keydown.enter.prevent="lookupTrack"
                        />
                        <Button
                            class="h-10 w-10 shrink-0 p-0"
                            title="Find track"
                            :disabled="!sourceUrl.trim() || lookingUp || !!lookup"
                            @click="lookupTrack"
                        >
                            <Loader2 v-if="lookingUp" class="size-4 animate-spin" />
                            <Search v-else class="size-4" />
                            <span class="sr-only">Find track</span>
                        </Button>
                    </div>
                </div>
                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
                <template v-if="lookup">
                    <div class="flex gap-4 rounded-xl border border-border bg-muted/20 p-3">
                        <div class="size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <img
                                v-if="coverPreview"
                                :src="coverPreview"
                                class="size-full object-cover"
                            />
                            <div
                                v-else
                                class="flex size-full items-center justify-center text-xs text-muted-foreground"
                            >
                                Cover required
                            </div>
                        </div>
                        <div class="min-w-0 flex-1 space-y-2 py-0.5">
                            <Input v-model="title" class="h-8" aria-label="Track title" />
                            <Input v-model="artist" class="h-8" aria-label="Track artist" />
                            <p class="text-xs text-muted-foreground">
                                Track length – {{ formatDuration(lookup.track.durationMs) }}
                            </p>
                        </div>
                    </div>
                    <label
                        v-if="lookup.cover.requiresManualUpload"
                        class="block cursor-pointer rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/40"
                    >
                        <input
                            class="hidden"
                            type="file"
                            accept="image/*"
                            @change="onCoverChange"
                        />
                        {{ coverFile ? coverFile.name : 'Upload a square cover at least 1000px' }}
                    </label>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-muted-foreground">Audio file</label>
                        <div
                            class="group relative min-h-24 cursor-pointer overflow-hidden rounded-lg border bg-muted transition-colors"
                            :class="[
                                audioFile
                                    ? 'border-border/80 bg-muted/40'
                                    : 'border-dashed border-border hover:bg-muted/70',
                                audioDragging && !audioFile && 'border-primary bg-muted/70',
                            ]"
                            @click="!audioFile && audioInput?.click()"
                            @dragleave="audioDragging = false"
                            @dragover.prevent="!audioFile && (audioDragging = true)"
                            @drop.prevent="onAudioDrop"
                        >
                            <div
                                class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center"
                            >
                                <Music v-if="audioFile" class="size-5 text-primary" />
                                <Music v-else class="size-5 text-muted-foreground" />
                                <span
                                    class="text-xs"
                                    :class="audioFile ? 'font-medium' : 'text-muted-foreground'"
                                >{{ audioFile ? audioFile.name : 'Drop or click' }}</span
                                >
                                <span v-if="audioFile" class="text-[10px] text-muted-foreground">{{
                                    formatSize(audioFile.size)
                                }}</span>
                            </div>
                            <input
                                ref="audioInput"
                                class="hidden"
                                type="file"
                                accept="audio/mpeg,.mp3"
                                @change="onAudioChange"
                            />
                            <button
                                v-if="audioFile"
                                class="absolute right-2 top-2 rounded bg-destructive/10 p-1.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                                title="Remove audio"
                                @click.stop="clearAudio"
                            >
                                <Trash2 class="size-3.5" />
                            </button>
                        </div>
                    </div>
                </template>
                <div class="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" @click="close">Cancel</Button>
                    <Button :disabled="!canImport" @click="submit">
                        <Loader2 v-if="importing" class="mr-1 size-4 animate-spin" />
                        Import
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { Loader2, Music, Search, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { useAudioStore } from '@/stores/audio';
    import { getApiErrorMessage } from '@/lib/errors';
    import { formatAudioDuration as formatDuration, formatFileSize as formatSize } from './utils';

    const props = defineProps<{ open: boolean }>();
    const emit = defineEmits<{ (event: 'update:open', value: boolean): void }>();
    const audioStore = useAudioStore();
    const sourceUrl = ref('');
    const lookingUp = ref(false);
    const importing = ref(false);
    const error = ref('');
    const lookup = ref<Awaited<ReturnType<typeof audioStore.lookupSpotify>> | null>(null);
    const title = ref('');
    const artist = ref('');
    const audioFile = ref<File | null>(null);
    const audioInput = ref<HTMLInputElement | null>(null);
    const audioDragging = ref(false);
    const coverFile = ref<File | null>(null);
    const coverPreview = computed(() =>
        coverFile.value ? URL.createObjectURL(coverFile.value) : (lookup.value?.cover.url ?? null),
    );
    const canImport = computed(
        () =>
            !!lookup.value &&
            !!audioFile.value &&
            (!lookup.value.cover.requiresManualUpload || !!coverFile.value) &&
            !importing.value,
    );

    function onAudioChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) setAudio(file);
    }
    function onAudioDrop(event: DragEvent) {
        audioDragging.value = false;
        const file = event.dataTransfer?.files[0];
        if (file?.name.toLowerCase().endsWith('.mp3')) setAudio(file);
    }
    function setAudio(file: File) {
        audioFile.value = file;
    }
    function clearAudio() {
        audioFile.value = null;
        if (audioInput.value) audioInput.value.value = '';
    }
    function onCoverChange(event: Event) {
        coverFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
    }
    async function lookupTrack() {
        error.value = '';
        lookingUp.value = true;
        try {
            lookup.value = await audioStore.lookupSpotify(sourceUrl.value);
            title.value = lookup.value.track.title;
            artist.value = lookup.value.track.artist;
        } catch (lookupError: unknown) {
            error.value = getApiErrorMessage(lookupError, 'Could not look up this Spotify track');
        } finally {
            lookingUp.value = false;
        }
    }
    async function submit() {
        if (!lookup.value || !audioFile.value) return;
        importing.value = true;
        error.value = '';
        try {
            const form = new FormData();
            form.append('lookupToken', lookup.value.lookupToken);
            form.append('file', audioFile.value);
            form.append('title', title.value.trim());
            form.append('artist', artist.value.trim());
            if (coverFile.value) form.append('cover', coverFile.value);
            await audioStore.importSpotify(form);
            close();
        } catch (importError: unknown) {
            error.value = getApiErrorMessage(importError, 'Import failed');
        } finally {
            importing.value = false;
        }
    }
    function close() {
        emit('update:open', false);
    }
    watch(
        () => props.open,
        (isOpen) => {
            if (!isOpen) {
                sourceUrl.value = '';
                lookup.value = null;
                title.value = '';
                artist.value = '';
                audioFile.value = null;
                coverFile.value = null;
                error.value = '';
                audioDragging.value = false;
            }
        },
    );
</script>
