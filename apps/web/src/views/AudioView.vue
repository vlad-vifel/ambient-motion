<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Audio</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your preprocessed audio tracks</p>
            </div>
            <div class="flex items-center gap-2">
                <div
                    v-if="!audioStore.loading && audioStore.items.length"
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
                <Button size="sm" @click="openUpload">
                    <Upload class="size-4" />
                    Upload audio
                </Button>
            </div>
        </div>

        <div
            v-if="!audioStore.items.length"
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
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors"
            >
                <button
                    class="group/cover relative size-9 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                    @click="onPlay(track)"
                >
                    <img
                        v-if="track.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                        :src="track.coverUrl"
                    />
                    <Music
                        v-else
                        class="size-4 text-muted-foreground transition-all duration-150 group-hover/cover:text-transparent"
                    />
                    <span
                        class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md transition-opacity duration-150 opacity-0 group-hover/cover:opacity-100"
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

                <div
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
            </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
                v-for="track in audioStore.items"
                :key="track.id"
                class="group flex flex-col gap-2 p-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors"
            >
                <button
                    class="group/cover relative w-full aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden"
                    @click="onPlay(track)"
                >
                    <img
                        v-if="track.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                        :src="track.coverUrl"
                    />
                    <Music
                        v-else
                        class="size-8 text-muted-foreground transition-all duration-150 group-hover/cover:text-transparent"
                    />
                    <span
                        class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md transition-opacity duration-150 opacity-0 group-hover/cover:opacity-100"
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
                        class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
    </div>
</template>

<script setup lang="ts">
    import { Grid, List, Music, Pause, Pencil, Play, Trash2, Upload } from 'lucide-vue-next';
    import { onMounted, ref } from 'vue';
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
    import { Button } from '@/components/ui/button';
    import { type Audio, useAudioStore } from '@/stores/audio';
    import { usePlayerStore } from '@/stores/player';

    const audioStore = useAudioStore();
    const player = usePlayerStore();

    const dialogOpen = ref(false);
    const editTarget = ref<Audio | null>(null);
    const viewMode = ref<'list' | 'grid'>('list');

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    onMounted(async () => {
        await audioStore.fetchAll();
        player.setPlaylist(audioStore.items);
    });

    function onPlay(track: Audio) {
        if (player.track?.id === track.id) {
            player.toggle();
        } else {
            player.play(track);
        }
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
</script>
