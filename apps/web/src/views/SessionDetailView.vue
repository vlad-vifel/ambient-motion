<template>
    <div v-if="!sessionsStore.current" class="flex items-center justify-center h-64">
        <Loader2 class="size-6 text-muted-foreground animate-spin" />
    </div>

    <div v-else class="flex flex-col gap-6">
        <div class="flex items-center gap-3">
            <button
                class="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                @click="$router.push('/create')"
            >
                <ArrowLeft class="size-4" />
            </button>

            <h2 class="text-xl font-semibold flex-1 min-w-0 truncate">
                {{ sessionLabel }}
            </h2>

            <button
                class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete session"
                @click="deleteOpen = true"
            >
                <Trash2 class="size-4" />
            </button>
        </div>

        <div v-if="session.audio" class="flex items-center gap-3">
            <div
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
                <p class="text-sm font-medium truncate">{{ session.audio.title }}</p>
                <p v-if="session.audio.artist" class="text-xs text-muted-foreground truncate">
                    {{ session.audio.artist }}
                </p>
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
            <div
                v-for="video in session.videos"
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

                <button
                    v-if="video.status !== 'QUEUED' && video.status !== 'GENERATING'"
                    class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="Delete"
                    @click.stop="startDelete(video.id)"
                >
                    <Trash2 class="size-3.5" />
                </button>
            </div>
        </div>
    </div>

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

    <AlertDialog v-model:open="deleteOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete session?</AlertDialogTitle>
                <AlertDialogDescription
                >The session will be deleted. Videos generated in this session will be
                    kept.</AlertDialogDescription
                >
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="deleteSession"
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
    import { AlertCircle, ArrowLeft, Film, Loader2, Music, Trash2 } from 'lucide-vue-next';
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
    import { useSessionsStore } from '@/stores/sessions';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const route = useRoute();
    const router = useRouter();
    const sessionsStore = useSessionsStore();
    const videosStore = useVideosStore();

    const session = computed(() => sessionsStore.current!);
    const deleteOpen = ref(false);
    const videoDialogOpen = ref(false);
    const deleteVideoOpen = ref(false);
    const activeVideo = ref<Video | null>(null);
    const deleteVideoId = ref('');

    const sessionLabel = computed(() => {
        if (session.value.name) return session.value.name;
        const idx = sessionsStore.items.findIndex((s) => s.id === session.value.id);
        const num = idx === -1 ? session.value.id.slice(-4) : sessionsStore.items.length - 1 - idx;
        return `#${num}`;
    });

    onMounted(async () => {
        await sessionsStore.fetchOne(route.params.id as string);
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

    async function doDeleteVideo() {
        await videosStore.remove(deleteVideoId.value);
        if (sessionsStore.current) {
            sessionsStore.current.videos = sessionsStore.current.videos.filter(
                (v) => v.id !== deleteVideoId.value,
            );
        }
        deleteVideoOpen.value = false;
    }

    async function deleteSession() {
        await sessionsStore.remove(session.value.id);
        deleteOpen.value = false;
        router.push('/create');
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
