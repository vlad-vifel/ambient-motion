<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">Audio</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your preprocessed audio tracks</p>
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
                    <Select v-model="filterSourceType">
                        <SelectTrigger class="h-8! w-36 text-sm">
                            <SelectValue placeholder="All sources" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem :value="FilterValue.All">All sources</SelectItem>
                            <SelectItem :value="AudioSourceType.Spotify">Spotify</SelectItem>
                            <SelectItem :value="AudioSourceType.Upload">Uploaded</SelectItem>
                        </SelectContent>
                    </Select>
                    <ViewModeToggle v-model="viewMode" />
                    <Button
                        v-if="audioStore.items.length"
                        size="sm"
                        variant="outline"
                        class="text-destructive hover:text-destructive"
                        @click="enterSelection"
                    >
                        <Trash2 class="size-3.5 mr-1" />
                        Delete
                    </Button>
                    <Button size="sm" @click="openUpload">
                        <Upload class="size-3.5 mr-1" />
                        Upload audio
                    </Button>
                </template>
            </div>
        </div>

        <div
            v-if="!audioStore.loading && !audioStore.items.length"
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Music class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No audio tracks yet</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Upload preprocessed audio files ready for video generation
                </p>
            </div>
        </div>

        <div
            v-else-if="filteredAudio.length"
            :class="
                viewMode === ViewMode.List
                    ? 'flex flex-col gap-2'
                    : 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
            "
        >
            <AudioTrackItem
                v-for="track in filteredAudio"
                :key="track.id"
                :track="track"
                :view-mode="viewMode"
                :selection-mode="selectionMode"
                :selected="selectedIds.includes(track.id)"
                :is-playing="player.track?.id === track.id && player.playing"
                @select="toggleSelect(track.id)"
                @activate="handleRowClick(track)"
                @play="onPlay(track)"
                @edit="openEdit(track)"
                @delete="openDeleteDialog(track.id)"
            />
        </div>
        <div
            v-else-if="!audioStore.loading"
            class="rounded-xl border border-border/50 bg-card p-12 text-center"
        >
            <p class="font-medium">No matching audio tracks</p>
            <p class="mt-1 text-sm text-muted-foreground">Try another source filter.</p>
        </div>

        <Dialog :open="uploadChoiceOpen" @update:open="uploadChoiceOpen = $event">
            <DialogContent class="max-w-xl" :show-close-button="false">
                <DialogHeader>
                    <DialogTitle>Upload audio</DialogTitle>
                    <DialogDescription>Choose how you want to add your track.</DialogDescription>
                </DialogHeader>
                <div class="-mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        class="group flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                        @click="chooseUpload(AudioUploadMethod.File)"
                    >
                        <span
                            class="flex size-11 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10"
                        >
                            <Upload
                                class="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                            />
                        </span>
                        <span>
                            <span class="block text-sm font-medium">Upload an audio file</span>
                            <span class="mt-1 block text-xs text-muted-foreground"
                            >Choose an MP3 from your device</span
                            >
                        </span>
                    </button>
                    <button
                        class="group flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                        @click="chooseUpload(AudioUploadMethod.Spotify)"
                    >
                        <span
                            class="flex size-11 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10"
                        >
                            <Link2
                                class="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                            />
                        </span>
                        <span>
                            <span class="block text-sm font-medium">Import from Spotify</span>
                            <span class="mt-1 block text-xs text-muted-foreground"
                            >Use a Spotify link and MP3</span
                            >
                        </span>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
        <AudioFormDialog v-model:open="dialogOpen" :edit-target="editTarget" />
        <SpotifyImportDialog v-model:open="spotifyDialogOpen" />

        <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this audio?</AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        This action cannot be undone. The audio will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="deleteDialogOpen = false"> No </AlertDialogCancel>
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
                        {{ selectedIds.length === 1 ? 'track' : 'tracks' }}?
                    </AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        This action cannot be undone. The selected tracks will be permanently
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
    import { Link2, Music, Trash2, Upload } from 'lucide-vue-next';
    import { computed, onMounted, ref } from 'vue';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import AudioFormDialog from '@/components/audio/AudioFormDialog.vue';
    import AudioTrackItem from '@/components/audio/AudioTrackItem.vue';
    import SpotifyImportDialog from '@/components/audio/SpotifyImportDialog.vue';
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
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import { type Audio, useAudioStore } from '@/stores/audio';
    import { usePlayerStore } from '@/stores/player';
    import BulkSelectionActions from '@/components/shared/BulkSelectionActions.vue';
    import ViewModeToggle from '@/components/shared/ViewModeToggle.vue';
    import {
        AudioSourceType,
        AudioUploadMethod,
        type AudioSourceType as AudioSourceTypeValue,
    } from '@/types/audio';
    import { FilterValue, ViewMode } from '@/types/ui';

    const audioStore = useAudioStore();
    const player = usePlayerStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const dialogOpen = ref(false);
    const uploadChoiceOpen = ref(false);
    const spotifyDialogOpen = ref(false);
    const editTarget = ref<Audio | null>(null);
    const viewMode = ref<ViewMode>(ViewMode.List);
    const filterSourceType = ref<AudioSourceTypeValue | typeof FilterValue.All>(FilterValue.All);

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    const selectionMode = ref(false);
    const selectedIds = ref<string[]>([]);
    const bulkDeleteOpen = ref(false);

    const filteredAudio = computed(() =>
        filterSourceType.value === FilterValue.All
            ? audioStore.items
            : audioStore.items.filter((track) => track.sourceType === filterSourceType.value),
    );
    const allSelected = computed(
        () =>
            filteredAudio.value.length > 0 &&
            filteredAudio.value.every((track) => selectedIds.value.includes(track.id)),
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
        else selectedIds.value = filteredAudio.value.map((t) => t.id);
    }

    async function doBulkDelete() {
        const ids = [...selectedIds.value];
        bulkDeleteOpen.value = false;
        await Promise.allSettled(ids.map((id) => audioStore.remove(id)));
        exitSelection();
    }

    function onPlay(track: Audio) {
        if (player.track?.id === track.id) {
            player.toggle();
        } else {
            player.play(track);
        }
    }

    function handleRowClick(track: Audio) {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        onPlay(track);
    }

    function openUpload() {
        editTarget.value = null;
        uploadChoiceOpen.value = true;
    }

    function chooseUpload(type: AudioUploadMethod) {
        uploadChoiceOpen.value = false;
        if (type === AudioUploadMethod.Spotify) spotifyDialogOpen.value = true;
        else dialogOpen.value = true;
    }

    function openEdit(track: Audio) {
        editTarget.value = track;
        dialogOpen.value = true;
    }

    function openDeleteDialog(id: string) {
        deleteTargetId.value = id;
        deleteDialogOpen.value = true;
    }

    async function doDelete() {
        if (deleteTargetId.value) {
            await audioStore.remove(deleteTargetId.value);
        }
        deleteDialogOpen.value = false;
        deleteTargetId.value = null;
    }

    onMounted(async () => {
        await audioStore.fetchAll();
        player.setPlaylist(audioStore.items);
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Audio' }]);
    });
</script>
