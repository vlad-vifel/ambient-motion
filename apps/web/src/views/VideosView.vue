<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Videos</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    All generated videos across sessions
                </p>
            </div>
            <Badge v-if="videosStore.items.length" variant="secondary">
                {{ videosStore.items.length }}
                {{ videosStore.items.length === 1 ? 'video' : 'videos' }}
            </Badge>
        </div>

        <div
            v-if="!videosStore.loading && !videosStore.items.length"
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

        <div v-else class="flex flex-col gap-2">
            <VideoListItem
                v-for="video in sortedVideos"
                :key="video.id"
                :video="video"
                @click="openVideo(video)"
                @delete="openDeleteDialog(video.id)"
                @edit="openEditDialog(video)"
            />
        </div>

        <VideoEditDialog
            :open="editDialogOpen"
            :video="editVideo"
            @update:open="
                (v) => {
                    editDialogOpen = v;
                    if (!v) editVideo = null;
                }
            "
            @requeued="videosStore.startPolling()"
        />

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
    import { Film } from 'lucide-vue-next';
    import { computed, onMounted, onUnmounted, ref } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
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
    import VideoEditDialog from '@/components/VideoEditDialog.vue';
    import VideoLightbox from '@/components/VideoLightbox.vue';
    import VideoListItem from '@/components/VideoListItem.vue';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const videosStore = useVideosStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const STATUS_ORDER: Record<string, number> = {
        QUEUED: 0,
        GENERATING: 1,
        COMPLETED: 2,
        FAILED: 2,
    };

    const sortedVideos = computed(() =>
        [...videosStore.items].sort((a, b) => {
            const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
            if (od !== 0) return od;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    );

    const lightboxOpen = ref(false);
    const lightboxSrc = ref<string | null>(null);
    const lightboxPhrase = ref('');

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    const editDialogOpen = ref(false);
    const editVideo = ref<Video | null>(null);

    onMounted(() => {
        videosStore.startPolling();
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Videos' }]);
    });

    onUnmounted(() => {
        videosStore.stopPolling();
        breadcrumbsComposable.clearBreadcrumbs();
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

    function openEditDialog(video: Video) {
        editVideo.value = video;
        editDialogOpen.value = true;
    }

    async function doDelete() {
        if (deleteTargetId.value) {
            await videosStore.remove(deleteTargetId.value);
        }
        deleteDialogOpen.value = false;
        deleteTargetId.value = null;
    }
</script>
