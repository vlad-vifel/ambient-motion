<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-xl p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>
                    Upload assets{{ folderName ? ` to ${folderName} (folder)` : '' }}
                </DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-4">
                <div
                    class="relative rounded-lg border bg-muted transition-colors overflow-hidden"
                    :class="[
                        dragging
                            ? 'border-primary bg-muted/70'
                            : 'border-dashed border-border cursor-pointer hover:bg-muted/70',
                    ]"
                    @click="fileInput?.click()"
                    @dragleave="dragging = false"
                    @dragover.prevent="dragging = true"
                    @drop.prevent="onDrop"
                >
                    <div class="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <ImageIcon class="size-5 text-muted-foreground" />
                        <span class="text-xs text-muted-foreground"
                        >Drop or click to add assets</span
                        >
                    </div>

                    <input
                        ref="fileInput"
                        accept="image/*"
                        class="hidden"
                        type="file"
                        multiple
                        @change="onFileChange"
                    />
                </div>

                <div
                    v-if="selectedFiles.length"
                    class="flex flex-col gap-1 max-h-64 overflow-y-auto"
                >
                    <div
                        v-for="(item, i) in selectedFiles"
                        :key="i"
                        class="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 group"
                    >
                        <button
                            class="size-10 rounded shrink-0 overflow-hidden bg-muted"
                            @click.stop="openLightbox(item)"
                        >
                            <img :src="item.preview" class="size-full object-cover" />
                        </button>

                        <span class="flex-1 text-xs truncate min-w-0">{{ item.file.name }}</span>
                        <span class="text-[10px] text-muted-foreground shrink-0">{{
                            formatSize(item.file.size)
                        }}</span>

                        <button
                            class="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            @click.stop="removeFile(i)"
                        >
                            <Trash2 class="size-3.5" />
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                    <Button
                        :disabled="!selectedFiles.length || uploading"
                        size="sm"
                        @click="submit"
                    >
                        <Loader2 v-if="uploading" class="size-3.5 mr-1.5 animate-spin" />
                        Upload{{ selectedFiles.length ? ` (${selectedFiles.length})` : '' }}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <AssetLightbox
        :open="lightboxOpen"
        :items="lightboxItems"
        :initial-index="lightboxIndex"
        @update:open="lightboxOpen = $event"
    />
</template>

<script setup lang="ts">
    import { ImageIcon, Loader2, Trash2 } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import { useAssetsStore } from '@/stores/assets';
    import AssetLightbox, { type LightboxAsset } from './AssetLightbox.vue';

    const props = defineProps<{
        open: boolean;
        folderId?: string | null;
        folderName?: string | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    const assetsStore = useAssetsStore();

    interface SelectedFile {
        file: File;
        preview: string;
    }

    const selectedFiles = ref<SelectedFile[]>([]);
    const dragging = ref(false);
    const uploading = ref(false);
    const fileInput = ref<HTMLInputElement | null>(null);

    const lightboxOpen = ref(false);
    const lightboxItems = ref<LightboxAsset[]>([]);
    const lightboxIndex = ref(0);

    watch(
        () => props.open,
        (v) => {
            if (!v) {
                selectedFiles.value.forEach((f) => URL.revokeObjectURL(f.preview));
                selectedFiles.value = [];
                dragging.value = false;
                if (fileInput.value) fileInput.value.value = '';
            }
        },
    );

    function onFileChange(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files) addFiles(Array.from(files));
        if (fileInput.value) fileInput.value.value = '';
    }

    function onDrop(e: DragEvent) {
        dragging.value = false;
        const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
            f.type.startsWith('image/'),
        );
        addFiles(files);
    }

    function addFiles(files: File[]) {
        for (const file of files) {
            if (
                !selectedFiles.value.some(
                    (f) => f.file.name === file.name && f.file.size === file.size,
                )
            ) {
                selectedFiles.value.push({ file, preview: URL.createObjectURL(file) });
            }
        }
    }

    function removeFile(index: number) {
        URL.revokeObjectURL(selectedFiles.value[index].preview);
        selectedFiles.value.splice(index, 1);
    }

    function openLightbox(item: SelectedFile) {
        lightboxItems.value = selectedFiles.value.map((f) => ({
            src: f.preview,
            filename: f.file.name,
        }));
        lightboxIndex.value = selectedFiles.value.indexOf(item);
        lightboxOpen.value = true;
    }

    function onCancel() {
        emit('update:open', false);
    }

    async function submit() {
        uploading.value = true;
        try {
            const form = new FormData();
            for (const { file } of selectedFiles.value) {
                form.append('files', file);
            }
            if (props.folderId) form.append('folderId', props.folderId);
            await assetsStore.upload(form);
            emit('update:open', false);
        } finally {
            uploading.value = false;
        }
    }

    function formatSize(bytes: number) {
        return bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(0)} KB`
            : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
</script>
