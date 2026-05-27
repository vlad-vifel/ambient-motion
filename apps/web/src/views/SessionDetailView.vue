<template>
    <div v-if="!sessionsStore.current" class="flex items-center justify-center h-64">
        <Loader2 class="size-6 text-muted-foreground animate-spin" />
    </div>

    <div v-else class="flex flex-col gap-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3 min-w-0">
                <div
                    v-if="session.audio"
                    class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
                >
                    <img
                        v-if="session.audio.coverUrl"
                        :src="session.audio.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                    />
                    <Music v-else class="size-4 text-muted-foreground" />
                </div>
                <div class="min-w-0">
                    <!-- Mobile: session name as title -->
                    <h2 class="text-xl font-semibold truncate sm:hidden">{{ sessionTitle }}</h2>
                    <!-- Desktop: audio title (original) -->
                    <p class="text-sm font-medium truncate hidden sm:block">
                        {{ session.audio?.title }}
                    </p>
                    <!-- Mobile: audio info as description -->
                    <p class="text-sm text-muted-foreground truncate mt-0.5 sm:hidden">
                        {{
                            session.audio
                                ? session.audio.title +
                                    (session.audio.artist ? ' – ' + session.audio.artist : '')
                                : 'No audio track'
                        }}
                    </p>
                    <!-- Desktop: artist (original) -->
                    <p
                        v-if="session.audio?.artist"
                        class="text-xs text-muted-foreground truncate hidden sm:block"
                    >
                        {{ session.audio.artist }}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-1">
                <!-- Mobile: text button -->
                <button
                    class="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-border bg-muted/20 hover:bg-muted/40 text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="downloading || !completedVideos.length"
                    @click="downloadAll"
                >
                    <Loader2 v-if="downloading" class="size-4 animate-spin" />
                    <Download v-else class="size-4" />
                    Download all
                </button>
                <!-- Desktop: icon button (original) -->
                <button
                    class="hidden sm:block p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Download all videos"
                    :disabled="downloading || !completedVideos.length"
                    @click="downloadAll"
                >
                    <Loader2 v-if="downloading" class="size-4 animate-spin" />
                    <Download v-else class="size-4" />
                </button>
            </div>
        </div>

        <div
            v-if="!session.videos?.length"
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-3 text-center min-h-48"
        >
            <Film class="size-8 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">No videos in this session yet.</p>
        </div>

        <div v-else class="flex flex-col gap-2">
            <VideoListItem
                v-for="video in sortedVideos"
                :key="video.id"
                :video="video"
                @click="openVideo(video)"
                @delete="startDelete(video.id)"
                @edit="openEditDialog(video)"
            />
        </div>
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
        @requeued="sessionsStore.startPolling()"
    />

    <VideoLightbox
        :open="videoDialogOpen"
        :src="activeVideo?.videoUrl ?? null"
        :phrase="activeVideo?.phrase ?? ''"
        :video-id="activeVideo?.id ?? ''"
        @update:open="videoDialogOpen = $event"
    />

    <AlertDialog v-model:open="deleteVideoOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete video?</AlertDialogTitle>
                <AlertDialogDescription
                >This will permanently delete the video and its file.</AlertDialogDescription
                >
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="doDeleteVideo"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>

<script setup lang="ts">
    import { computed, onMounted, onUnmounted, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import { Download, Film, Loader2, Music } from 'lucide-vue-next';
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
    import { useSessionsStore } from '@/stores/sessions';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const route = useRoute();
    const router = useRouter();
    const sessionsStore = useSessionsStore();
    const videosStore = useVideosStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const session = computed(() => sessionsStore.current!);
    const sessionTitle = computed(() => session.value.name || `Session #${session.value.index}`);

    const STATUS_ORDER: Record<string, number> = {
        QUEUED: 0,
        GENERATING: 1,
        COMPLETED: 2,
        FAILED: 2,
    };
    const sortedVideos = computed(() => {
        if (!session.value?.videos) return [];
        return [...session.value.videos].sort((a, b) => {
            const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
            if (od !== 0) return od;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    });

    const completedVideos = computed(
        () => session.value?.videos?.filter((v) => v.status === 'COMPLETED' && v.videoUrl) ?? [],
    );
    const downloading = ref(false);
    const videoDialogOpen = ref(false);
    const deleteVideoOpen = ref(false);
    const editDialogOpen = ref(false);
    const activeVideo = ref<Video | null>(null);
    const editVideo = ref<Video | null>(null);
    const deleteVideoId = ref('');

    onMounted(async () => {
        const cached = sessionsStore.items.find((s) => s.id === route.params.id);
        const cachedLabel = cached ? cached.name || `Session #${cached.index}` : '...';
        breadcrumbsComposable.setBreadcrumbs([
            { label: 'Create', onClick: () => router.push('/create') },
            { label: cachedLabel },
        ]);

        await sessionsStore.fetchOne(route.params.id as string);
        if (sessionsStore.current) {
            const name = sessionsStore.current.name || `Session #${sessionsStore.current.index}`;
            breadcrumbsComposable.setBreadcrumbs([
                { label: 'Create', onClick: () => router.push('/create') },
                { label: name },
            ]);
        }
        sessionsStore.startPolling();
    });

    onUnmounted(() => {
        sessionsStore.stopPolling();
        breadcrumbsComposable.clearBreadcrumbs();
    });

    function openVideo(video: Video) {
        if (video.status !== 'COMPLETED') return;
        activeVideo.value = video;
        videoDialogOpen.value = true;
    }

    function startDelete(id: string) {
        deleteVideoId.value = id;
        deleteVideoOpen.value = true;
    }

    function openEditDialog(video: Video) {
        editVideo.value = video;
        editDialogOpen.value = true;
    }

    async function doDeleteVideo() {
        await videosStore.remove(deleteVideoId.value);
        if (sessionsStore.current) {
            sessionsStore.current.videos = sessionsStore.current.videos.filter(
                (v) => v.id !== deleteVideoId.value,
            );
        }
        deleteVideoOpen.value = false;
    }

    async function downloadAll() {
        if (downloading.value || !completedVideos.value.length) return;
        downloading.value = true;
        try {
            const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
            const token = localStorage.getItem('token');
            for (const video of completedVideos.value) {
                const response = await fetch(`${apiBase}/api/videos/${video.id}/download`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${video.phrase}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                await new Promise((r) => setTimeout(r, 300));
            }
        } finally {
            downloading.value = false;
        }
    }
</script>
