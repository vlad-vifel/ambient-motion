<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Videos</h2>
                <p class="text-sm text-muted-foreground mt-0.5">Your generated video library</p>
            </div>
            <Badge class="gap-1.5" variant="outline">
                <span class="size-1.5 rounded-full bg-emerald-400" />
                0 videos
            </Badge>
        </div>

        <div
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Video class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No videos yet</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Generated videos will appear here once you start creating
                </p>
            </div>
            <Button size="sm" variant="outline" @click="$router.push('/create')">
                <Sparkles class="size-4 mr-2" />
                Go to Create
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Sparkles, Video } from 'lucide-vue-next';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
</script>
