<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Videos</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    All generated videos across sessions
                </p>
            </div>

            <div class="flex items-center gap-2">
                <div
                    v-if="!videosStore.loading && videosStore.items.length"
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
            </div>
        </div>

        <div
            v-if="!videosStore.items.length"
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Film class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No videos yet</p>
                <p class="text-sm text-muted-foreground mt-1">Generate videos on Create page</p>
            </div>
        </div>

        <div
            v-else-if="videosStore.items.length && viewMode === 'list'"
            class="flex flex-col gap-2"
        >
            <div
                v-for="video in videosStore.items"
                :key="video.id"
                class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                @click="openVideo(video)"
            >
                <div
                    class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
                >
                    <img
                        v-if="video.thumbnailUrl"
                        :src="video.thumbnailUrl"
                        class="absolute inset-0 size-full object-cover"
                    />
                    <Loader2
                        v-else-if="video.status === 'QUEUED' || video.status === 'GENERATING'"
                        class="size-4 text-muted-foreground animate-spin"
                    />
                    <AlertCircle
                        v-else-if="video.status === 'FAILED'"
                        class="size-4 text-destructive"
                    />
                    <Film v-else class="size-4 text-muted-foreground" />
                </div>

                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ video.phrase }}</p>
                </div>

                <span
                    :class="[
                        'text-xs px-2 py-0.5 rounded-full shrink-0',
                        statusClass(video.status),
                    ]"
                >
                    {{ statusLabel(video.status) }}
                </span>

                <div
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                    <button
                        class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteDialog(video.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <div
                v-for="video in videosStore.items"
                :key="video.id"
                class="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                @click="openVideo(video)"
            >
                <img
                    v-if="video.thumbnailUrl"
                    :src="video.thumbnailUrl"
                    class="size-full object-cover bg-muted"
                />
                <div v-else class="size-full flex items-center justify-center">
                    <Loader2
                        v-if="video.status === 'QUEUED' || video.status === 'GENERATING'"
                        class="size-6 text-muted-foreground animate-spin"
                    />
                    <AlertCircle
                        v-else-if="video.status === 'FAILED'"
                        class="size-6 text-destructive"
                    />
                    <Film v-else class="size-6 text-muted-foreground" />
                </div>

                <div class="absolute top-2 left-2">
                    <span
                        :class="[
                            'text-xs px-2 py-0.5 rounded-full shrink-0',
                            statusClass(video.status),
                        ]"
                    >
                        {{ statusLabel(video.status) }}
                    </span>
                </div>

                <div
                    class="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style="
                        background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent 35%);
                    "
                >
                    <p class="text-white text-xs truncate leading-snug">{{ video.phrase }}</p>
                </div>

                <div
                    class="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <button
                        class="p-1.5 rounded group-hover:bg-muted/50 hover:bg-muted group-hover:text-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        @click.stop="openDeleteDialog(video.id)"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>

        <VideoLightbox
            :open="lightboxOpen"
            :src="lightboxSrc"
            :phrase="lightboxPhrase"
            @update:open="lightboxOpen = $event"
        />

        <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete video?</AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        This action cannot be undone. The video and its files will be permanently
                        deleted.
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
    import { AlertCircle, Film, Grid, List, Loader2, Trash2 } from 'lucide-vue-next';
    import { onMounted, onUnmounted, ref } from 'vue';
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
    import VideoLightbox from '@/components/VideoLightbox.vue';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const videosStore = useVideosStore();

    const viewMode = ref<'list' | 'grid'>('list');

    const lightboxOpen = ref(false);
    const lightboxSrc = ref<string | null>(null);
    const lightboxPhrase = ref('');

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    onMounted(() => {
        videosStore.startPolling();
    });

    onUnmounted(() => {
        videosStore.stopPolling();
    });

    function openVideo(video: Video) {
        if (video.status !== 'COMPLETED' || !video.videoUrl) return;
        lightboxSrc.value = video.videoUrl;
        lightboxPhrase.value = video.phrase;
        lightboxOpen.value = true;
    }

    function openDeleteDialog(id: string) {
        deleteTargetId.value = id;
        deleteDialogOpen.value = true;
    }

    async function doDelete() {
        if (deleteTargetId.value) {
            await videosStore.remove(deleteTargetId.value);
        }
        deleteDialogOpen.value = false;
        deleteTargetId.value = null;
    }

    function statusClass(status: string) {
        const map: Record<string, string> = {
            QUEUED: 'bg-muted text-muted-foreground',
            GENERATING: 'bg-blue-500/15 text-blue-400',
            COMPLETED: 'bg-emerald-500/15 text-emerald-400',
            FAILED: 'bg-destructive/15 text-destructive',
        };
        return map[status] ?? 'bg-muted text-muted-foreground';
    }

    function statusLabel(status: string) {
        const map: Record<string, string> = {
            QUEUED: 'queued',
            GENERATING: 'creating',
            COMPLETED: 'done',
            FAILED: 'failed',
        };
        return map[status] ?? status.toLowerCase();
    }
</script>
