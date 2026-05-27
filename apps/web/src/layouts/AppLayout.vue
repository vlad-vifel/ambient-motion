<template>
    <SidebarProvider style="--sidebar-width: 188px">
        <AppSidebar />
        <SidebarInset class="flex flex-col min-h-0 overflow-hidden">
            <header class="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border/50">
                <SidebarTrigger class="-ml-1" />
                <Breadcrumb v-if="breadcrumbs.breadcrumbs.value.length">
                    <BreadcrumbList>
                        <BreadcrumbItem
                            v-for="(item, index) in breadcrumbs.breadcrumbs.value"
                            :key="index"
                        >
                            <BreadcrumbLink
                                v-if="item.onClick"
                                class="cursor-pointer"
                                @click="item.onClick"
                            >
                                {{ item.label }}
                            </BreadcrumbLink>
                            <BreadcrumbPage v-else>
                                {{ item.label }}
                            </BreadcrumbPage>
                            <BreadcrumbSeparator
                                v-if="index < breadcrumbs.breadcrumbs.value.length - 1"
                            />
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 v-else class="text-sm font-medium text-foreground/70">
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
    import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from '@/components/ui/breadcrumb';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';

    const route = useRoute();
    const breadcrumbs = useBreadcrumbs();

    const pageTitles: { [key: string]: string } = {
        assets: 'Assets',
        audio: 'Audio',
        create: 'Create',
        videos: 'Videos',
    };

    const pageTitle = computed(() => pageTitles[route.name as string] ?? 'ambient motion');
</script>
