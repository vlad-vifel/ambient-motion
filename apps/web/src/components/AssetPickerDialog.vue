<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-2xl p-0 gap-0 flex flex-col max-h-[85vh]"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader
                class="px-6 pt-6 pb-4 shrink-0"
                :class="!currentFolder && 'border-b border-border/50'"
            >
                <DialogTitle>Select asset</DialogTitle>
                <DialogDescription class="sr-only"
                >Choose an asset for this phrase</DialogDescription
                >
            </DialogHeader>

            <div
                v-if="currentFolder"
                class="px-6 pb-3 shrink-0 flex items-center gap-1.5 text-sm border-b border-border/50"
            >
                <button
                    class="text-muted-foreground hover:text-foreground transition-colors"
                    @click="exitFolder"
                >
                    All assets
                </button>
                <ChevronRight class="size-3.5 text-muted-foreground" />
                <span class="font-medium">{{ currentFolder.name }}</span>
            </div>

            <div class="px-6 py-4 overflow-y-auto min-h-0 flex-1">
                <div v-if="loading" class="py-12 flex items-center justify-center">
                    <Loader2 class="size-6 text-muted-foreground animate-spin" />
                </div>

                <template v-else>
                    <div
                        v-if="!visibleFolders.length && !displayedAssets.length"
                        class="py-12 flex flex-col items-center gap-3 text-center"
                    >
                        <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon class="size-6 text-muted-foreground" />
                        </div>
                        <p class="text-sm text-muted-foreground">No assets found</p>
                    </div>

                    <div v-else class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        <div
                            v-for="folder in visibleFolders"
                            :key="folder.id"
                            class="group relative flex flex-col items-center justify-center aspect-square rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer gap-1 p-3"
                            @click="enterFolder(folder)"
                        >
                            <Folder class="size-6 text-muted-foreground" />
                            <p class="text-xs font-medium truncate w-full text-center">
                                {{ folder.name }}
                            </p>
                        </div>

                        <div
                            v-for="asset in displayedAssets"
                            :key="asset.id"
                            :class="[
                                'relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all',
                                selected?.id === asset.id
                                    ? 'ring-2 ring-primary'
                                    : 'ring-2 ring-transparent hover:ring-border/60',
                            ]"
                            @click="selected = asset"
                        >
                            <img :src="asset.url" class="size-full object-cover bg-muted" />
                            <div
                                v-if="selected?.id === asset.id"
                                class="absolute inset-0 bg-primary/20 flex items-center justify-center"
                            >
                                <div
                                    class="size-6 rounded-full bg-primary flex items-center justify-center"
                                >
                                    <Check class="size-3.5 text-primary-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div
                class="px-6 py-4 shrink-0 border-t border-border/50 flex items-center justify-end gap-2"
            >
                <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                <Button size="sm" :disabled="!selected" @click="onSave">Save</Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Check, ChevronRight, Folder, ImageIcon, Loader2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
    import api from '@/lib/api';
    import type { Asset } from '@/stores/assets';

    interface FolderItem {
        id: string;
        name: string;
    }

    const props = defineProps<{
        open: boolean;
        initialAsset?: Asset | null;
        excludeAssetIds?: string[];
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
        (e: 'select', asset: Asset): void;
    }>();

    const folders = ref<FolderItem[]>([]);
    const assets = ref<Asset[]>([]);
    const currentFolder = ref<FolderItem | null>(null);
    const selected = ref<Asset | null>(null);
    const loading = ref(false);

    const visibleFolders = computed(() => (currentFolder.value ? [] : folders.value));
    const displayedAssets = computed(() => {
        const excluded = new Set(props.excludeAssetIds ?? []);
        return assets.value.filter((a) => !a.isUsed && !excluded.has(a.id));
    });

    watch(
        () => props.open,
        async (v) => {
            if (v) {
                currentFolder.value = null;
                selected.value = props.initialAsset ?? null;
                await loadRoot();
            }
        },
    );

    async function loadRoot() {
        loading.value = true;
        try {
            const [foldersRes, assetsRes] = await Promise.all([
                api.get<FolderItem[]>('/api/folders'),
                api.get<Asset[]>('/api/assets', { params: { folderId: 'root' } }),
            ]);
            folders.value = foldersRes.data;
            assets.value = assetsRes.data;
        } finally {
            loading.value = false;
        }
    }

    async function enterFolder(folder: FolderItem) {
        currentFolder.value = folder;
        loading.value = true;
        try {
            const res = await api.get<Asset[]>('/api/assets', { params: { folderId: folder.id } });
            assets.value = res.data;
        } finally {
            loading.value = false;
        }
    }

    async function exitFolder() {
        currentFolder.value = null;
        await loadRoot();
    }

    function onCancel() {
        emit('update:open', false);
    }

    function onSave() {
        if (!selected.value) return;
        emit('select', selected.value);
        emit('update:open', false);
    }
</script>
