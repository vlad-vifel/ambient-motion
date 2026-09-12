<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">{{ currentFolder?.name || 'Assets' }}</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your assets for video generation</p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
                <template v-if="selectionMode">
                    <BulkSelectionActions
                        :selected-count="selectedIds.length"
                        :all-selected="allSelected"
                        @toggle-all="toggleSelectAll"
                        @delete="bulkDeleteOpen = true"
                        @cancel="exitSelection"
                    />
                </template>
                <template v-else>
                    <ViewModeToggle v-model="viewMode" />

                    <Button
                        v-if="assetsStore.items.length"
                        size="sm"
                        variant="outline"
                        class="text-destructive hover:text-destructive"
                        @click="enterSelection"
                    >
                        <Trash2 class="size-3.5 mr-1" />
                        Delete
                    </Button>

                    <Button
                        v-if="!currentFolder"
                        size="sm"
                        variant="outline"
                        @click="openFolderForm(null)"
                    >
                        <FolderPlus class="size-3.5 mr-1" />
                        New folder
                    </Button>

                    <Button size="sm" @click="uploadDialogOpen = true">
                        <Upload class="size-3.5 mr-1" />
                        Upload assets
                    </Button>
                </template>
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

        <div
            :class="
                viewMode === ViewMode.List
                    ? 'flex flex-col gap-2'
                    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            "
        >
            <AssetFolderItem
                v-for="folder in visibleFolders"
                :key="folder.id"
                :folder="folder"
                :view-mode="viewMode"
                :selection-mode="selectionMode"
                @open="enterFolder(folder)"
                @rename="openFolderForm(folder)"
                @delete="openDeleteFolderDialog(folder.id)"
            />
            <AssetItem
                v-for="asset in assetsStore.items"
                :key="asset.id"
                :asset="asset"
                :view-mode="viewMode"
                :selection-mode="selectionMode"
                :selected="selectedIds.includes(asset.id)"
                @select="toggleSelect(asset.id)"
                @preview="openLightbox(asset)"
                @edit="openAssetEdit(asset)"
                @delete="openDeleteAssetDialog(asset.id)"
            />
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
            :items="
                assetsStore.items.map((a) => ({
                    src: a.url,
                    filename: a.filename,
                    isUsed: a.isUsed,
                }))
            "
            :initial-index="lightboxIndex"
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

        <AlertDialog :open="bulkDeleteOpen" @update:open="bulkDeleteOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete {{ selectedIds.length }}
                        {{ selectedIds.length === 1 ? 'asset' : 'assets' }}?
                    </AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        This action cannot be undone. The selected assets will be permanently
                        deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="bulkDeleteOpen = false">No</AlertDialogCancel>
                    <AlertDialogAction
                        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        @click="doBulkDelete"
                    >
                        Yes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>

<script setup lang="ts">
    import { FolderOpen, FolderPlus, ImageIcon, Trash2, Upload } from 'lucide-vue-next';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import AssetEditDialog from '@/components/assets/AssetEditDialog.vue';
    import AssetFolderItem from '@/components/assets/AssetFolderItem.vue';
    import AssetItem from '@/components/assets/AssetItem.vue';
    import AssetLightbox from '@/components/assets/AssetLightbox.vue';
    import AssetUploadDialog from '@/components/assets/AssetUploadDialog.vue';
    import FolderFormDialog from '@/components/folders/FolderFormDialog.vue';
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
    import { Button } from '@/components/ui/button';
    import BulkSelectionActions from '@/components/shared/BulkSelectionActions.vue';
    import ViewModeToggle from '@/components/shared/ViewModeToggle.vue';
    import { type Asset, useAssetsStore } from '@/stores/assets';
    import { type Folder as FolderType, useFoldersStore } from '@/stores/folders';
    import { AssetTargetType, ViewMode } from '@/types/ui';

    const assetsStore = useAssetsStore();
    const foldersStore = useFoldersStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const viewMode = ref<ViewMode>(ViewMode.Grid);
    const currentFolder = ref<FolderType | null>(null);

    const uploadDialogOpen = ref(false);
    const folderFormOpen = ref(false);
    const editFolderTarget = ref<FolderType | null>(null);
    const assetEditOpen = ref(false);
    const editAssetTarget = ref<Asset | null>(null);

    const lightboxOpen = ref(false);
    const lightboxIndex = ref(0);

    const deleteDialogOpen = ref(false);
    const deleteTarget = ref<{ type: AssetTargetType; id: string } | null>(null);
    const initialLoading = ref(true);

    const selectionMode = ref(false);
    const selectedIds = ref<string[]>([]);
    const bulkDeleteOpen = ref(false);

    const allSelected = computed(
        () => assetsStore.items.length > 0 && selectedIds.value.length === assetsStore.items.length,
    );

    function enterSelection() {
        selectionMode.value = true;
        selectedIds.value = [];
    }

    function exitSelection() {
        selectionMode.value = false;
        selectedIds.value = [];
    }

    function toggleSelect(id: string) {
        const idx = selectedIds.value.indexOf(id);
        if (idx === -1) selectedIds.value.push(id);
        else selectedIds.value.splice(idx, 1);
    }

    function toggleSelectAll() {
        if (allSelected.value) selectedIds.value = [];
        else selectedIds.value = assetsStore.items.map((a) => a.id);
    }

    async function doBulkDelete() {
        const ids = [...selectedIds.value];
        bulkDeleteOpen.value = false;
        await Promise.allSettled(ids.map((id) => assetsStore.remove(id)));
        exitSelection();
    }

    const visibleFolders = computed(() => (currentFolder.value ? [] : foldersStore.items));

    const isLoading = computed(() => assetsStore.loading || foldersStore.loading);

    async function enterFolder(folder: FolderType) {
        exitSelection();
        currentFolder.value = folder;
        assetsStore.items = [];
        await assetsStore.fetchAll(folder.id);
    }

    async function exitFolder() {
        exitSelection();
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
        lightboxIndex.value = assetsStore.items.indexOf(asset);
        lightboxOpen.value = true;
    }

    function openDeleteFolderDialog(id: string) {
        deleteTarget.value = { type: AssetTargetType.Folder, id };
        deleteDialogOpen.value = true;
    }

    function openDeleteAssetDialog(id: string) {
        deleteTarget.value = { type: AssetTargetType.Asset, id };
        deleteDialogOpen.value = true;
    }

    async function doDelete() {
        if (!deleteTarget.value) return;
        const target = deleteTarget.value;
        deleteDialogOpen.value = false;
        deleteTarget.value = null;
        try {
            if (target.type === AssetTargetType.Folder) {
                await foldersStore.remove(target.id);
            } else {
                await assetsStore.remove(target.id);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

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
</script>
