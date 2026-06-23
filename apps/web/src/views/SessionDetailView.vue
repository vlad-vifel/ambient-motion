<template>
    <div v-if="!sessionsStore.current" class="flex items-center justify-center h-64">
        <Loader2 class="size-6 text-muted-foreground animate-spin" />
    </div>

    <div v-else class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3 min-w-0">
                <div
                    v-if="session.audio || session.noAudio"
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
                    <!-- Mobile: session name as title -->
                    <h2 class="text-xl font-semibold truncate sm:hidden">{{ sessionTitle }}</h2>
                    <!-- Desktop: audio title -->
                    <p class="text-sm font-medium truncate hidden sm:block">
                        {{
                            session.noAudio
                                ? 'No audio'
                                : (session.audio?.title ?? 'No audio track')
                        }}
                    </p>
                    <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span class="text-xs text-muted-foreground truncate sm:hidden">
                            {{
                                session.noAudio
                                    ? 'No audio'
                                    : session.audio
                                        ? session.audio.title +
                                            (session.audio.artist ? ' – ' + session.audio.artist : '')
                                        : 'No audio track'
                            }}
                        </span>
                        <!-- Desktop: artist -->
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
                <Badge
                    v-if="session.preset"
                    variant="secondary"
                    class="flex items-center gap-1 shrink-0"
                >
                    <span
                    >{{ session.preset.name }} ({{ formatLabels[session.preset.format] }})</span
                    >
                    <component :is="formatIcons[session.preset.format]" class="size-3" />
                </Badge>
                <template v-if="selectionIntent">
                    <Button size="sm" variant="ghost" @click="toggleSelectAll">
                        {{ allSelected ? 'Deselect all' : 'Select all' }}
                    </Button>
                    <Button
                        v-if="selectionIntent === 'download'"
                        size="sm"
                        variant="outline"
                        :disabled="downloading || !selectedIds.length"
                        @click="downloadSelected"
                    >
                        <Loader2 v-if="downloading" class="size-3.5 mr-1 animate-spin" />
                        <Download v-else class="size-3.5 mr-1" />
                        Download{{ selectedIds.length ? ` (${selectedIds.length})` : '' }}
                    </Button>
                    <Button
                        v-else
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
                <template v-else-if="completedVideos.length">
                    <Button size="sm" variant="outline" @click="startSelection('download')">
                        <Download class="size-3.5 mr-1" />
                        Download
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        class="text-destructive hover:text-destructive"
                        @click="startSelection('delete')"
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
                :selectable="!!selectionIntent && video.status === 'COMPLETED'"
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
        :items="completedVideos.map((v) => ({ src: v.videoUrl!, phrase: v.phrase, videoId: v.id }))"
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
    import { Badge } from '@/components/ui/badge';
    import { formatIcons, formatLabels } from '@/lib/presetFormat';
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
    import Button from '@/components/ui/button/Button.vue';

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
        return [...session.value.videos]
            .filter((v) => v.status !== 'DRAFT')
            .sort((a, b) => {
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

    const selectionIntent = ref<'download' | 'delete' | null>(null);
    const selectedIds = ref<string[]>([]);
    const bulkDeleteOpen = ref(false);

    const allSelected = computed(
        () =>
            completedVideos.value.length > 0 &&
            selectedIds.value.length === completedVideos.value.length,
    );

    function startSelection(intent: 'download' | 'delete') {
        selectionIntent.value = intent;
        selectedIds.value = [];
    }

    function exitSelection() {
        selectionIntent.value = null;
        selectedIds.value = [];
    }

    function toggleSelect(id: string) {
        const idx = selectedIds.value.indexOf(id);
        if (idx === -1) selectedIds.value.push(id);
        else selectedIds.value.splice(idx, 1);
    }

    function toggleSelectAll() {
        if (allSelected.value) selectedIds.value = [];
        else selectedIds.value = completedVideos.value.map((v) => v.id);
    }

    async function downloadSelected() {
        if (downloading.value) return;
        const targets = completedVideos.value.filter((v) => selectedIds.value.includes(v.id));
        if (!targets.length) return;
        downloading.value = true;
        try {
            for (const video of targets) {
                await downloadVideoFile(video.id, video.phrase);
                await new Promise((r) => setTimeout(r, 300));
            }
        } finally {
            downloading.value = false;
            exitSelection();
        }
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
</script>
