<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">Audio</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your preprocessed audio tracks</p>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
                <template v-if="selectionMode">
                    <Button size="sm" variant="ghost" @click="toggleSelectAll">
                        {{ allSelected ? 'Deselect all' : 'Select all' }}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        class="text-destructive hover:text-destructive"
                        :disabled="!selectedIds.length"
                        @click="bulkDeleteOpen = true"
                    >
                        <Trash2 class="size-3.5 mr-1" />
                        Delete{{ selectedIds.length ? ` (${selectedIds.length})` : '' }}
                    </Button>
                    <Button size="sm" variant="ghost" @click="exitSelection">Cancel</Button>
                </template>
                <template v-else>
                    <div class="flex gap-1 p-0.5 rounded-md border border-border bg-muted/20">
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

        <div v-else-if="viewMode === 'list'" class="flex flex-col gap-2">
            <div
                v-for="track in audioStore.items"
                :key="track.id"
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer sm:cursor-auto"
                :class="[
                    selectionMode && 'cursor-pointer! border-border',
                    selectedIds.includes(track.id) && 'bg-muted/50',
                ]"
                @click="selectionMode ? toggleSelect(track.id) : handleRowClick(track)"
            >
                <Checkbox
                    v-if="selectionMode"
                    :model-value="selectedIds.includes(track.id)"
                    class="pointer-events-none shrink-0"
                />
                <button
                    class="group/cover relative size-9 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                    @click.stop="selectionMode ? toggleSelect(track.id) : onPlay(track)"
                >
                    <img
                        v-if="track.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                        :src="track.coverUrl"
                    />
                    <Music
                        v-else
                        class="size-4 text-muted-foreground transition-all duration-150 sm:group-hover/cover:text-transparent"
                    />
                    <span
                        class="hidden sm:flex absolute inset-0 items-center justify-center bg-black/30 rounded-md transition-opacity duration-150 opacity-0 group-hover/cover:opacity-100"
                    >
                        <Pause
                            v-if="player.track?.id === track.id && player.playing"
                            class="size-3.5 fill-white text-white"
                        />
                        <Play v-else class="size-3.5 fill-white text-white translate-x-px" />
                    </span>
                </button>

                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                        {{ track.title }}
                    </p>
                    <p class="text-xs text-muted-foreground truncate">
                        {{ track.artist || '—' }}
                    </p>
                </div>

                <span class="text-xs text-muted-foreground shrink-0">{{
                    formatDuration(track.duration)
                }}</span>

                <div
                    v-if="!selectionMode"
                    class="hidden sm:group-hover:flex items-center gap-1 shrink-0"
                >
                    <button
                        class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                        @click.stop="openEdit(track)"
                    >
                        <Pencil class="size-3.5" />
                    </button>
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteDialog(track.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <DropdownMenu v-if="!selectionMode">
                    <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                        <button
                            class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <MoreVertical class="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" @click.stop>
                        <DropdownMenuItem @click="openEdit(track)">
                            <Pencil class="size-3.5" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            class="text-destructive focus:text-destructive"
                            @click="openDeleteDialog(track.id)"
                        >
                            <Trash2 class="size-3.5" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
                v-for="track in audioStore.items"
                :key="track.id"
                class="group flex flex-col gap-2 p-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer sm:cursor-auto"
                :class="
                    selectionMode && selectedIds.includes(track.id) && 'bg-muted/50 border-border'
                "
                @click="selectionMode ? toggleSelect(track.id) : handleRowClick(track)"
            >
                <button
                    class="group/cover relative w-full aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden"
                    @click.stop="selectionMode ? toggleSelect(track.id) : onPlay(track)"
                >
                    <Checkbox
                        v-if="selectionMode"
                        :model-value="selectedIds.includes(track.id)"
                        class="absolute top-2 left-2 z-10 pointer-events-none bg-background/80"
                    />
                    <img
                        v-if="track.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                        :src="track.coverUrl"
                    />
                    <Music
                        v-else
                        class="size-8 text-muted-foreground transition-all duration-150 sm:group-hover/cover:text-transparent"
                    />
                    <span
                        class="hidden sm:flex absolute inset-0 items-center justify-center bg-black/30 rounded-md transition-opacity duration-150 opacity-0 group-hover/cover:opacity-100"
                    >
                        <Pause
                            v-if="player.track?.id === track.id && player.playing"
                            class="size-6 fill-white text-white"
                        />
                        <Play v-else class="size-6 fill-white text-white translate-x-px" />
                    </span>
                </button>

                <div class="flex items-center justify-between gap-2 min-w-0">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                            {{ track.title }}
                        </p>
                        <p class="text-xs text-muted-foreground truncate">
                            {{ track.artist || '—' }}
                        </p>
                    </div>

                    <div
                        v-if="!selectionMode"
                        class="hidden sm:group-hover:flex items-center gap-0.5 shrink-0"
                    >
                        <button
                            class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                            @click.stop="openEdit(track)"
                        >
                            <Pencil class="size-3.5" />
                        </button>
                        <button
                            class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                            @click.stop="openDeleteDialog(track.id)"
                        >
                            <Trash2 class="size-3.5" />
                        </button>
                    </div>
                    <DropdownMenu v-if="!selectionMode">
                        <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                            <button
                                class="p-1 rounded bg-muted text-foreground transition-colors shrink-0"
                            >
                                <MoreVertical class="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" @click.stop>
                            <DropdownMenuItem @click="openEdit(track)">
                                <Pencil class="size-3.5" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="text-destructive focus:text-destructive"
                                @click="openDeleteDialog(track.id)"
                            >
                                <Trash2 class="size-3.5" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>

        <AudioFormDialog v-model:open="dialogOpen" :edit-target="editTarget" />

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
    import {
        Grid,
        List,
        MoreVertical,
        Music,
        Pause,
        Pencil,
        Play,
        Trash2,
        Upload,
    } from 'lucide-vue-next';
    import { computed, onMounted, ref } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import AudioFormDialog from '@/components/AudioFormDialog.vue';
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
    import { Button } from '@/components/ui/button';
    import { type Audio, useAudioStore } from '@/stores/audio';
    import { usePlayerStore } from '@/stores/player';

    const audioStore = useAudioStore();
    const player = usePlayerStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const dialogOpen = ref(false);
    const editTarget = ref<Audio | null>(null);
    const viewMode = ref<'list' | 'grid'>('list');

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    const selectionMode = ref(false);
    const selectedIds = ref<string[]>([]);
    const bulkDeleteOpen = ref(false);

    const allSelected = computed(
        () => audioStore.items.length > 0 && selectedIds.value.length === audioStore.items.length,
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
        else selectedIds.value = audioStore.items.map((t) => t.id);
    }

    async function doBulkDelete() {
        const ids = [...selectedIds.value];
        bulkDeleteOpen.value = false;
        await Promise.allSettled(ids.map((id) => audioStore.remove(id)));
        exitSelection();
    }

    onMounted(async () => {
        await audioStore.fetchAll();
        player.setPlaylist(audioStore.items);
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Audio' }]);
    });

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
        dialogOpen.value = true;
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

    function formatDuration(ms: number): string {
        const totalSeconds = Math.round(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
</script>
