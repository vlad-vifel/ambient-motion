<template>
    <SidebarProvider style="--sidebar-width: 200px">
        <AppSidebar />
        <SidebarInset class="flex flex-col min-h-0 overflow-hidden">
            <header class="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border/50">
                <SidebarTrigger class="-ml-1" />
                <h1 class="text-sm font-medium text-foreground/70">
                    {{ pageTitle }}
                </h1>
            </header>

            <div class="flex flex-1 flex-col gap-4 p-4 overflow-auto">
                <RouterView />
            </div>

            <AudioPlayer v-if="route.name === 'audio'" />
        </SidebarInset>
    </SidebarProvider>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import AppSidebar from '@/components/AppSidebar.vue';
    import AudioPlayer from '@/components/AudioPlayer.vue';
    import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

    const route = useRoute();

    const pageTitles: { [key: string]: string } = {
        assets: 'Assets',
        audio: 'Audio',
        create: 'Create',
        videos: 'Videos',
    };

    const pageTitle = computed(() => pageTitles[route.name as string] ?? 'ambient motion');
</script>
