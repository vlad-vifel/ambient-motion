<template>
    <div v-if="!sessionsStore.current" class="flex items-center justify-center h-64">
        <Loader2 class="size-6 text-muted-foreground animate-spin" />
    </div>

    <div v-else class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3 min-w-0">
                <div
                    v-if="session.audio || session.noAudio || session.presetId === 'music-widget'"
                    class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
                >
                    <img
                        v-if="session.audio?.coverUrl"
                        :src="session.audio.coverUrl"
                        class="absolute inset-0 size-full object-cover"
                    />
                    <VolumeX v-else-if="session.noAudio" class="size-4 text-muted-foreground" />
                    <Music v-else class="size-4 text-muted-foreground" />
                </div>
                <div class="min-w-0">
                    <h2 class="text-xl font-semibold truncate sm:hidden">{{ sessionTitle }}</h2>
                    <p class="text-sm font-medium truncate hidden sm:block">
                        {{ getSessionAudioLabel(session, session.videos.length) }}
                    </p>
                    <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span class="text-xs text-muted-foreground truncate sm:hidden">
                            {{ getSessionAudioLabel(session, session.videos.length) }}
                        </span>
                        <span
                            v-if="!session.noAudio && session.audio?.artist"
                            class="text-xs text-muted-foreground truncate hidden sm:block"
                        >
                            {{ session.audio.artist }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
                <PresetBadge
                    v-if="session.preset"
                    :preset-id="session.preset.id"
                    :name="session.preset.name"
                    :format="session.preset.format"
                />
                <template v-if="selectionIntent">
                    <BulkSelectionActions
                        :intent="selectionIntent"
                        :selected-count="selectedIds.length"
                        :all-selected="allSelected"
                        :downloading="downloading"
                        @toggle-all="toggleSelectAll"
                        @download="downloadSelected"
                        @delete="bulkDeleteOpen = true"
                        @cancel="exitSelection"
                    />
                </template>
                <template v-else-if="completedVideos.length">
                    <Button
                        size="sm"
                        variant="outline"
                        @click="startSelection(SelectionIntent.Download)"
                    >
                        <Download class="size-3.5 mr-1" />
                        Download
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        class="text-destructive hover:text-destructive"
                        @click="startSelection(SelectionIntent.Delete)"
                    >
                        <Trash2 class="size-3.5 mr-1" />
                        Delete
                    </Button>
                </template>
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
                :selectable="!!selectionIntent && video.status === VideoStatus.Completed"
                :selected="selectedIds.includes(video.id)"
                @click="openVideo(video)"
                @toggle-select="toggleSelect(video.id)"
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
        :items="completedVideos.map((v) => ({ src: v.videoUrl!, phrase: v.title, videoId: v.id }))"
        :initial-index="completedVideos.findIndex((v) => v.id === activeVideo?.id)"
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

    <AlertDialog v-model:open="bulkDeleteOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    Delete {{ selectedIds.length }}
                    {{ selectedIds.length === 1 ? 'video' : 'videos' }}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the selected videos and their files.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="doBulkDelete"
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
    import { Download, Film, Loader2, Music, Trash2, VolumeX } from 'lucide-vue-next';
    import { downloadVideoFile } from '@/lib/utils';
    import { getSessionAudioLabel } from '@/components/sessions/utils';
    import PresetBadge from '@/components/shared/PresetBadge.vue';
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
    import VideoEditDialog from '@/components/videos/VideoEditDialog.vue';
    import VideoLightbox from '@/components/videos/VideoLightbox.vue';
    import VideoListItem from '@/components/videos/VideoListItem.vue';
    import BulkSelectionActions from '@/components/shared/BulkSelectionActions.vue';
    import { useVideoSelection } from '@/composables/useVideoSelection';
    import { useSessionsStore } from '@/stores/sessions';
    import { useVideosStore } from '@/stores/videos';
    import { VideoStatus, type Video } from '@/types/video';
    import { SelectionIntent } from '@/types/ui';
    import Button from '@/components/ui/button/Button.vue';

    const route = useRoute();
    const router = useRouter();
    const sessionsStore = useSessionsStore();
    const videosStore = useVideosStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const session = computed(() => sessionsStore.current!);
    const sessionTitle = computed(() => session.value.name || `Session #${session.value.index}`);

    const STATUS_ORDER: Record<VideoStatus, number> = {
        [VideoStatus.Draft]: 0,
        [VideoStatus.Queued]: 0,
        [VideoStatus.Generating]: 1,
        [VideoStatus.Completed]: 2,
        [VideoStatus.Failed]: 2,
    };

    const sortedVideos = computed(() => {
        if (!session.value?.videos) return [];
        return [...session.value.videos]
            .filter((v) => v.status !== VideoStatus.Draft)
            .sort((a, b) => {
                const od = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
                if (od !== 0) return od;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    });

    const completedVideos = computed(
        () =>
            session.value?.videos?.filter(
                (v) => v.status === VideoStatus.Completed && v.videoUrl,
            ) ?? [],
    );
    const videoDialogOpen = ref(false);
    const deleteVideoOpen = ref(false);
    const editDialogOpen = ref(false);
    const activeVideo = ref<Video | null>(null);
    const editVideo = ref<Video | null>(null);
    const deleteVideoId = ref('');

    const bulkDeleteOpen = ref(false);
    const {
        allSelected,
        downloadSelected: downloadSelectedVideos,
        downloading,
        exitSelection,
        selectedIds,
        selectionIntent,
        startSelection,
        toggleSelect,
        toggleSelectAll,
    } = useVideoSelection(completedVideos);

    async function downloadSelected() {
        await downloadSelectedVideos((video) => downloadVideoFile(video.id, video.title));
    }

    async function doBulkDelete() {
        const ids = [...selectedIds.value];
        bulkDeleteOpen.value = false;
        await Promise.allSettled(ids.map((id) => videosStore.remove(id)));
        if (sessionsStore.current) {
            sessionsStore.current.videos = sessionsStore.current.videos.filter(
                (v) => !ids.includes(v.id),
            );
        }
        exitSelection();
    }

    function openVideo(video: Video) {
        if (video.status !== VideoStatus.Completed) return;
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
    });
</script>
