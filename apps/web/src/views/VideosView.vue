<template>
    <div class="flex flex-col gap-6 pb-6">
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

        <div class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input v-model="searchQuery" placeholder="Search" class="pl-9" />
            </div>
            <Select v-model="filterAudioId">
                <SelectTrigger class="w-full sm:w-56 shrink-0">
                    <SelectValue placeholder="All audio" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All audio</SelectItem>
                    <SelectItem v-for="track in audioStore.items" :key="track.id" :value="track.id">
                        {{ track.title }} – {{ track.artist }}
                    </SelectItem>
                </SelectContent>
            </Select>
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
                v-for="video in filteredVideos"
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
            :items="
                completedVideos.map((v) => ({ src: v.videoUrl!, phrase: v.phrase, videoId: v.id }))
            "
            :initial-index="lightboxIndex"
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
    import { Film, Search } from 'lucide-vue-next';
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
    import { Input } from '@/components/ui/input';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import VideoEditDialog from '@/components/VideoEditDialog.vue';
    import VideoLightbox from '@/components/VideoLightbox.vue';
    import VideoListItem from '@/components/VideoListItem.vue';
    import { useAudioStore } from '@/stores/audio';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const videosStore = useVideosStore();
    const audioStore = useAudioStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const searchQuery = ref('');
    const filterAudioId = ref('all');

    const STATUS_ORDER: Record<string, number> = {
        QUEUED: 0,
        GENERATING: 1,
        COMPLETED: 2,
        FAILED: 2,
    };

    const sortedVideos = computed(() =>
        videosStore.items
            .map((v, i) => ({ v, i }))
            .sort((a, b) => {
                const od = STATUS_ORDER[a.v.status] - STATUS_ORDER[b.v.status];
                if (od !== 0) return od;
                const td = new Date(b.v.createdAt).getTime() - new Date(a.v.createdAt).getTime();
                if (td !== 0) return td;
                return a.i - b.i;
            })
            .map(({ v }) => v),
    );

    const filteredVideos = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        return sortedVideos.value.filter((v) => {
            const matchesSearch = !query || v.phrase.toLowerCase().includes(query);
            const matchesAudio = filterAudioId.value === 'all' || v.audioId === filterAudioId.value;
            return matchesSearch && matchesAudio;
        });
    });

    const lightboxOpen = ref(false);
    const lightboxIndex = ref(0);

    const deleteDialogOpen = ref(false);
    const deleteTargetId = ref<string | null>(null);

    const editDialogOpen = ref(false);
    const editVideo = ref<Video | null>(null);

    onMounted(() => {
        videosStore.startPolling();
        audioStore.fetchAll();
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Videos' }]);
    });

    onUnmounted(() => {
        videosStore.stopPolling();
    });

    const completedVideos = computed(() =>
        filteredVideos.value.filter((v) => v.status === 'COMPLETED' && v.videoUrl),
    );

    function openVideo(video: Video) {
        if (video.status !== 'COMPLETED' || !video.videoUrl) return;
        lightboxIndex.value = completedVideos.value.findIndex((v) => v.id === video.id);
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
