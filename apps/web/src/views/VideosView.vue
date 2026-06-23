<template>
    <div class="flex flex-col gap-6 pb-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 class="text-xl font-semibold">Videos</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    All generated videos across sessions
                </p>
            </div>
            <div class="flex flex-wrap items-center sm:justify-end gap-2">
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

        <div class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                />
                <Input v-model="searchQuery" placeholder="Search" class="pl-9 h-8!" />
            </div>
            <div class="grid grid-cols-2 sm:flex gap-2">
                <Select v-model="filterPresetId">
                    <SelectTrigger class="h-8! w-full sm:w-44 shrink-0">
                        <SelectValue placeholder="All presets" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All presets</SelectItem>
                        <SelectItem
                            v-for="preset in presetsStore.items"
                            :key="preset.id"
                            :value="preset.id"
                        >
                            {{ preset.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select v-model="filterAudioId">
                    <SelectTrigger class="h-8! w-full sm:w-44 shrink-0">
                        <SelectValue placeholder="All audio" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All audio</SelectItem>
                        <SelectItem value="none">No audio</SelectItem>
                        <SelectItem
                            v-for="track in audioStore.items"
                            :key="track.id"
                            :value="track.id"
                        >
                            {{ track.title }} – {{ track.artist }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
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

        <div
            v-else-if="!filteredVideos.length"
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Film class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No videos match the filter</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters
                </p>
            </div>
        </div>

        <div v-else class="flex flex-col gap-2">
            <VideoListItem
                v-for="video in filteredVideos"
                :key="video.id"
                :video="video"
                :selectable="!!selectionIntent && video.status === 'COMPLETED'"
                :selected="selectedIds.includes(video.id)"
                @click="openVideo(video)"
                @toggle-select="toggleSelect(video.id)"
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

        <AlertDialog :open="bulkDeleteOpen" @update:open="bulkDeleteOpen = $event">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete {{ selectedIds.length }}
                        {{ selectedIds.length === 1 ? 'video' : 'videos' }}?
                    </AlertDialogTitle>
                    <AlertDialogDescription class="text-wrap">
                        This action cannot be undone. The selected videos and their files will be
                        permanently deleted.
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
    import { Download, Film, Loader2, Search, Trash2 } from 'lucide-vue-next';
    import { computed, onMounted, onUnmounted, ref } from 'vue';
    import { downloadVideoFile } from '@/lib/utils';
    import { Button } from '@/components/ui/button';
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
    import { usePresetsStore } from '@/stores/presets';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const videosStore = useVideosStore();
    const audioStore = useAudioStore();
    const presetsStore = usePresetsStore();
    const breadcrumbsComposable = useBreadcrumbs();

    const searchQuery = ref('');
    const filterAudioId = ref('all');
    const filterPresetId = ref('all');

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
            const matchesAudio =
                filterAudioId.value === 'all' ||
                (filterAudioId.value === 'none' ? v.noAudio : v.audioId === filterAudioId.value);
            const matchesPreset =
                filterPresetId.value === 'all' || v.presetId === filterPresetId.value;
            return matchesSearch && matchesAudio && matchesPreset;
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
        presetsStore.fetchAll();
        breadcrumbsComposable.setBreadcrumbs([{ label: 'Videos' }]);
    });

    onUnmounted(() => {
        videosStore.stopPolling();
    });

    const completedVideos = computed(() =>
        filteredVideos.value.filter((v) => v.status === 'COMPLETED' && v.videoUrl),
    );

    const downloading = ref(false);

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
        exitSelection();
    }

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
