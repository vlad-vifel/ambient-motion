<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">{{ currentFolder?.name || 'Assets' }}</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your assets for video generation</p>
            </div>

            <div class="flex items-center gap-2">
                <div
                    v-if="
                        !isLoading &&
                            (assetsStore.items.length || (!currentFolder && foldersStore.items.length))
                    "
                    class="flex gap-1 p-0.5 rounded-md border border-border bg-muted/20"
                >
                    <button
                        :class="[
                            'p-1.5 rounded transition-colors',
                            viewMode === 'list'
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        ]"
                        title="List view"
                        @click="viewMode = 'list'"
                    >
                        <List class="size-4" />
                    </button>
                    <button
                        :class="[
                            'p-1.5 rounded transition-colors',
                            viewMode === 'grid'
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        ]"
                        title="Grid view"
                        @click="viewMode = 'grid'"
                    >
                        <Grid class="size-4" />
                    </button>
                </div>

                <Button
                    v-if="!currentFolder"
                    size="sm"
                    variant="outline"
                    @click="openFolderForm(null)"
                >
                    <FolderPlus class="size-4" />
                    New folder
                </Button>

                <Button size="sm" @click="uploadDialogOpen = true">
                    <Upload class="size-4" />
                    Upload assets
                </Button>
            </div>
        </div>

        <div
            v-if="
                !isLoading &&
                    !assetsStore.items.length &&
                    (!foldersStore.items.length || currentFolder !== null)
            "
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <component
                    :is="currentFolder ? ImageIcon : FolderOpen"
                    class="size-6 text-muted-foreground"
                />
            </div>
            <div>
                <p class="font-medium">
                    {{ currentFolder ? 'No assets in this folder' : 'No assets yet' }}
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                    {{
                        currentFolder
                            ? 'Upload assets to this folder'
                            : 'Create folders or upload assets to get started'
                    }}
                </p>
            </div>
        </div>

        <div v-else-if="viewMode === 'list'" class="flex flex-col gap-2">
            <div
                v-for="folder in visibleFolders"
                :key="folder.id"
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                @click="enterFolder(folder)"
            >
                <div
                    class="size-9 rounded-md bg-muted/60 shrink-0 flex items-center justify-center"
                >
                    <Folder class="size-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ folder.name }}</p>
                </div>
                <div class="hidden sm:group-hover:flex items-center gap-1 shrink-0">
                    <button
                        class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                        @click.stop="openFolderForm(folder)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteFolderDialog(folder.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                        <button
                            class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <MoreVertical class="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" @click.stop>
                        <DropdownMenuItem @click="openFolderForm(folder)">
                            <Pencil class="size-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            class="text-destructive focus:text-destructive"
                            @click="openDeleteFolderDialog(folder.id)"
                        >
                            <Trash2 class="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div
                v-for="asset in assetsStore.items"
                :key="asset.id"
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                @click="openLightbox(asset)"
            >
                <div class="size-9 rounded-md bg-muted shrink-0 overflow-hidden">
                    <img :src="asset.url" class="size-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ asset.filename }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <Badge v-if="asset.isUsed" variant="secondary" class="text-xs"> used </Badge>
                    <span class="text-xs text-muted-foreground">{{ formatSize(asset.size) }}</span>
                </div>
                <div class="hidden sm:group-hover:flex items-center gap-1 shrink-0">
                    <button
                        class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                        @click.stop="openAssetEdit(asset)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteAssetDialog(asset.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                        <button
                            class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <MoreVertical class="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" @click.stop>
                        <DropdownMenuItem @click="openAssetEdit(asset)">
                            <Pencil class="size-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            class="text-destructive focus:text-destructive"
                            @click="openDeleteAssetDialog(asset.id)"
                        >
                            <Trash2 class="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <div
                v-for="folder in visibleFolders"
                :key="folder.id"
                class="group relative flex flex-col items-center justify-center aspect-square rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer gap-2 p-3"
                @click="enterFolder(folder)"
            >
                <Folder class="size-8 text-muted-foreground" />
                <p class="text-xs font-medium truncate w-full text-center">
                    {{ folder.name }}
                </p>
                <div class="absolute top-2 right-2 hidden sm:group-hover:flex gap-0.5">
                    <button
                        class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                        @click.stop="openFolderForm(folder)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteFolderDialog(folder.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <div class="absolute top-2 right-2 sm:hidden" @click.stop>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child @click.stop>
                            <button class="p-1 rounded bg-muted text-foreground transition-colors">
                                <MoreVertical class="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" @click.stop>
                            <DropdownMenuItem @click="openFolderForm(folder)">
                                <Pencil class="size-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="text-destructive focus:text-destructive"
                                @click="openDeleteFolderDialog(folder.id)"
                            >
                                <Trash2 class="size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                v-for="asset in assetsStore.items"
                :key="asset.id"
                class="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                @click="openLightbox(asset)"
            >
                <img :src="asset.url" class="size-full object-cover bg-muted" />
                <div
                    class="absolute inset-0 flex flex-col justify-end p-2 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    :style="{
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent 35%)',
                    }"
                >
                    <p class="text-white text-xs truncate leading-snug">
                        {{ asset.filename }}
                    </p>
                </div>
                <div v-if="asset.isUsed" class="absolute top-2 left-2 flex">
                    <Badge variant="secondary" class="text-xs">used</Badge>
                </div>
                <div class="absolute top-2 right-2 hidden sm:group-hover:flex gap-0.5">
                    <button
                        class="p-1.5 rounded group-hover:bg-muted/50 hover:bg-muted text-foreground transition-colors"
                        title="Rename"
                        @click.stop="openAssetEdit(asset)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded group-hover:bg-muted/50 hover:bg-muted group-hover:text-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteAssetDialog(asset.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <div class="absolute top-2 right-2 sm:hidden" @click.stop>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child @click.stop>
                            <button class="p-1 rounded bg-muted text-foreground transition-colors">
                                <MoreVertical class="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" @click.stop>
                            <DropdownMenuItem @click="openAssetEdit(asset)">
                                <Pencil class="size-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="text-destructive focus:text-destructive"
                                @click="openDeleteAssetDialog(asset.id)"
                            >
                                <Trash2 class="size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>

        <AssetUploadDialog
            v-model:open="uploadDialogOpen"
            :folder-id="currentFolder?.id ?? null"
            :folder-name="currentFolder?.name ?? null"
        />

        <FolderFormDialog v-model:open="folderFormOpen" :edit-target="editFolderTarget" />

        <AssetEditDialog v-model:open="assetEditOpen" :asset="editAssetTarget" />

        <AssetLightbox
            :open="lightboxOpen"
            :src="lightboxSrc"
            :filename="lightboxFilename"
            :is-used="lightboxIsUsed"
            @update:open="lightboxOpen = $event"
        />

        <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{{
                        deleteTarget?.type === 'folder' ? 'Delete folder?' : 'Delete asset?'
                    }}</AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        {{
                            deleteTarget?.type === 'folder'
                                ? 'The folder and all assets inside will be permanently deleted. This action cannot be undone.'
                                : 'This action cannot be undone. The asset will be permanently deleted.'
                        }}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="deleteDialogOpen = false">No</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        @click="doDelete"
                    >
                        Yes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>

<script setup lang="ts">
    import {
        Folder,
        FolderOpen,
        FolderPlus,
        Grid,
        ImageIcon,
        List,
        MoreVertical,
        Pencil,
        Trash2,
        Upload,
    } from 'lucide-vue-next';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import AssetEditDialog from '@/components/AssetEditDialog.vue';
    import AssetLightbox from '@/components/AssetLightbox.vue';
    import AssetUploadDialog from '@/components/AssetUploadDialog.vue';
    import FolderFormDialog from '@/components/FolderFormDialog.vue';
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from '@/components/ui/alert-dialog';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { type Asset, useAssetsStore } from '@/stores/assets';
    import { type Folder as FolderType, useFoldersStore } from '@/stores/folders';

    const assetsStore = useAssetsStore();
    const foldersStore = useFoldersStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const viewMode = ref<'list' | 'grid'>('list');
    const currentFolder = ref<FolderType | null>(null);

    const uploadDialogOpen = ref(false);
    const folderFormOpen = ref(false);
    const editFolderTarget = ref<FolderType | null>(null);
    const assetEditOpen = ref(false);
    const editAssetTarget = ref<Asset | null>(null);

    const lightboxOpen = ref(false);
    const lightboxSrc = ref<string | null>(null);
    const lightboxFilename = ref('');
    const lightboxIsUsed = ref(false);

    const deleteDialogOpen = ref(false);
    const deleteTarget = ref<{ type: 'asset' | 'folder'; id: string } | null>(null);
    const initialLoading = ref(true);

    const visibleFolders = computed(() => (currentFolder.value ? [] : foldersStore.items));

    const isLoading = computed(() => assetsStore.loading || foldersStore.loading);

    watch(currentFolder, () => {
        if (currentFolder.value) {
            breadcrumbsComposable.setBreadcrumbs([
                { label: 'Assets', onClick: exitFolder },
                { label: currentFolder.value.name },
            ]);
        } else {
            breadcrumbsComposable.setBreadcrumbs([{ label: 'Assets' }]);
        }
    });

    onMounted(async () => {
        try {
            await Promise.all([foldersStore.fetchAll(), assetsStore.fetchAll(null)]);
        } finally {
            initialLoading.value = false;
        }
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Assets' }]);
    });

    async function enterFolder(folder: FolderType) {
        currentFolder.value = folder;
        assetsStore.items = [];
        await assetsStore.fetchAll(folder.id);
    }

    async function exitFolder() {
        currentFolder.value = null;
        assetsStore.items = [];
        await assetsStore.fetchAll(null);
    }

    function openFolderForm(folder: FolderType | null) {
        editFolderTarget.value = folder;
        folderFormOpen.value = true;
    }

    function openAssetEdit(asset: Asset) {
        editAssetTarget.value = asset;
        assetEditOpen.value = true;
    }

    function openLightbox(asset: Asset) {
        lightboxSrc.value = asset.url;
        lightboxFilename.value = asset.filename;
        lightboxIsUsed.value = asset.isUsed;
        lightboxOpen.value = true;
    }

    function openDeleteFolderDialog(id: string) {
        deleteTarget.value = { type: 'folder', id };
        deleteDialogOpen.value = true;
    }

    function openDeleteAssetDialog(id: string) {
        deleteTarget.value = { type: 'asset', id };
        deleteDialogOpen.value = true;
    }

    async function doDelete() {
        if (!deleteTarget.value) return;
        const target = deleteTarget.value;
        deleteDialogOpen.value = false;
        deleteTarget.value = null;
        try {
            if (target.type === 'folder') {
                await foldersStore.remove(target.id);
            } else {
                await assetsStore.remove(target.id);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

    function formatSize(bytes: number) {
        return bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(0)} KB`
            : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
</script>
