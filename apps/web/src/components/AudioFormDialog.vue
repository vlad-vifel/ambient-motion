<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-xl p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>{{ editTarget ? 'Edit audio' : 'Upload audio' }}</DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-5">
                <div class="flex gap-4">
                    <div v-if="!editTarget" class="flex flex-col gap-1.5 min-w-0 flex-1">
                        <label class="flex items-center text-xs text-muted-foreground">
                            <span>Audio file</span>
                            <Asterisk class="text-destructive size-3" />
                        </label>

                        <div
                            class="group relative min-h-40 rounded-lg border bg-muted transition-colors overflow-hidden"
                            :class="[
                                audioFile
                                    ? 'border-border/80 bg-muted/40 cursor-default'
                                    : 'border-dashed border-border cursor-pointer hover:bg-muted/70',
                                audioDragging && !audioFile && 'border-primary bg-muted/70',
                            ]"
                            @click="!audioFile && audioInput?.click()"
                            @dragleave="audioDragging = false"
                            @dragover.prevent="!audioFile && (audioDragging = true)"
                            @drop.prevent="!audioFile && onAudioDrop($event)"
                        >
                            <div
                                class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center"
                            >
                                <template v-if="audioFile">
                                    <Music class="size-5 text-primary shrink-0" />
                                    <span
                                        class="text-xs font-medium break-all w-full leading-snug"
                                    >{{ audioFile.name }}</span
                                    >
                                    <span class="text-[10px] text-muted-foreground">{{
                                        formatSize(audioFile.size)
                                    }}</span>
                                </template>
                                <template v-else>
                                    <Music class="size-5 text-muted-foreground" />
                                    <span class="text-xs text-muted-foreground">Drop or click</span>
                                </template>
                            </div>

                            <input
                                ref="audioInput"
                                accept="audio/*"
                                class="hidden"
                                type="file"
                                @change="onAudioChange"
                            />

                            <button
                                v-if="audioFile"
                                class="absolute top-2 right-2 z-10 p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove audio"
                                @click.stop="clearAudio"
                            >
                                <Trash2 class="size-3.5" />
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5 shrink-0">
                        <label class="flex items-center text-xs text-muted-foreground">
                            <span>Cover art</span>
                        </label>
                        <div
                            class="group relative size-40 rounded-lg border bg-muted transition-colors overflow-hidden"
                            :class="[
                                coverPreview
                                    ? 'border-border/80 bg-muted/40 cursor-default'
                                    : 'border-dashed border-border cursor-pointer hover:bg-muted/70',
                                coverDragging && !coverPreview && 'border-primary bg-muted/70',
                            ]"
                            @click="!coverPreview && coverInput?.click()"
                            @dragleave="coverDragging = false"
                            @dragover.prevent="!coverPreview && (coverDragging = true)"
                            @drop.prevent="!coverPreview && onCoverDrop($event)"
                        >
                            <img
                                v-if="coverPreview"
                                class="absolute inset-0 size-full object-cover"
                                :src="coverPreview"
                            />
                            <div
                                v-else
                                class="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                            >
                                <ImageIcon class="size-5 text-muted-foreground" />
                                <span class="text-xs text-muted-foreground">Drop or click</span>
                            </div>

                            <input
                                ref="coverInput"
                                accept="image/*"
                                class="hidden"
                                type="file"
                                @change="onCoverChange"
                            />

                            <button
                                v-if="coverPreview"
                                class="block sm:hidden absolute top-2 right-2 z-10 p-1.5 rounded bg-muted text-destructive"
                                title="Remove cover"
                                @click.stop="clearCover"
                            >
                                <Trash2 class="size-3.5" />
                            </button>

                            <button
                                v-if="coverPreview"
                                class="sm:block hidden absolute top-2 right-2 z-10 p-1.5 rounded group-hover:bg-muted/50 hover:bg-muted group-hover:text-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove cover"
                                @click.stop="clearCover"
                            >
                                <Trash2 class="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <div class="flex flex-col gap-1.5">
                        <label class="flex items-center text-xs text-muted-foreground">
                            <span>Title</span>
                            <Asterisk class="text-destructive size-3" />
                        </label>
                        <Input v-model="title" placeholder="Track title" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="flex items-center text-xs text-muted-foreground">
                            <span>Artist</span>
                            <Asterisk class="text-destructive size-3" />
                        </label>
                        <Input v-model="artist" placeholder="Artist name" />
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" @click="onCancel"> Cancel </Button>
                    <Button :disabled="!canSubmit" size="sm" @click="submit">
                        <Loader2 v-if="submitting" class="size-3.5 mr-1.5 animate-spin" />
                        {{ editTarget ? 'Save' : 'Upload' }}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Asterisk, ImageIcon, Loader2, Music, Trash2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { type Audio, useAudioStore } from '@/stores/audio';

    const props = defineProps<{
        open: boolean;
        editTarget?: Audio | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    const audioStore = useAudioStore();

    const title = ref('');
    const artist = ref('');
    const audioFile = ref<File | null>(null);
    const coverFile = ref<File | null>(null);
    const coverPreview = ref<string | null>(null);
    const coverRemoved = ref(false);
    const audioDragging = ref(false);
    const coverDragging = ref(false);
    const submitting = ref(false);

    const audioInput = ref<HTMLInputElement | null>(null);
    const coverInput = ref<HTMLInputElement | null>(null);

    const canSubmit = computed(
        () =>
            title.value.trim() !== '' &&
            artist.value.trim() !== '' &&
            (!!props.editTarget || !!audioFile.value) &&
            !submitting.value,
    );

    watch(
        () => props.editTarget,
        (t) => {
            title.value = t?.title ?? '';
            artist.value = t?.artist ?? '';
            audioFile.value = null;
            coverFile.value = null;
            coverPreview.value = t?.coverUrl ?? null;
        },
        { immediate: true },
    );

    watch(
        () => props.open,
        (v) => {
            if (!v) {
                title.value = props.editTarget?.title ?? '';
                artist.value = props.editTarget?.artist ?? '';
                audioFile.value = null;
                coverFile.value = null;
                coverPreview.value = props.editTarget?.coverUrl ?? null;
                coverRemoved.value = false;
                audioDragging.value = false;
                coverDragging.value = false;
                if (audioInput.value) audioInput.value.value = '';
                if (coverInput.value) coverInput.value.value = '';
            }
        },
    );

    function onCancel() {
        emit('update:open', false);
    }

    function onAudioChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) setAudio(file);
    }

    function onAudioDrop(e: DragEvent) {
        audioDragging.value = false;
        const file = e.dataTransfer?.files[0];
        if (file?.type.startsWith('audio/')) setAudio(file);
    }

    function setAudio(file: File) {
        audioFile.value = file;
        title.value = file.name.replace(/\.[^/.]+$/, '');
    }

    function onCoverChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) setCover(file);
    }

    function onCoverDrop(e: DragEvent) {
        coverDragging.value = false;
        const file = e.dataTransfer?.files[0];
        if (file?.type.startsWith('image/')) setCover(file);
    }

    function setCover(file: File) {
        coverFile.value = file;
        coverPreview.value = URL.createObjectURL(file);
    }

    function clearAudio() {
        audioFile.value = null;
        if (audioInput.value) audioInput.value.value = '';
    }

    function clearCover() {
        coverFile.value = null;
        coverPreview.value = null;
        coverRemoved.value = true;
        if (coverInput.value) coverInput.value.value = '';
    }

    async function submit() {
        submitting.value = true;
        try {
            const form = new FormData();
            form.append('title', title.value);
            form.append('artist', artist.value);
            if (audioFile.value) form.append('file', audioFile.value);
            if (coverFile.value) form.append('cover', coverFile.value);
            if (props.editTarget && coverRemoved.value && !coverFile.value)
                form.append('removeCover', 'true');

            if (props.editTarget) {
                await audioStore.save(props.editTarget.id, form);
            } else {
                await audioStore.upload(form);
            }

            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }

    function formatSize(bytes: number) {
        return bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(0)} KB`
            : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
</script>
