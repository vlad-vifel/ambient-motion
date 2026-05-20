<template>
    <div class="flex flex-col gap-6">
        <div>
            <h2 class="text-xl font-semibold">Create</h2>
            <p class="text-sm text-muted-foreground mt-0.5">
                Generate atmospheric videos from your photos and audio
            </p>
        </div>

        <div
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64">
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Sparkles class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">Video generation</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Select audio, photos, set mood and generate phrases to create your videos
                </p>
            </div>
            <Button size="sm">
                <Sparkles class="size-4 mr-2" />
                Start Creating
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Sparkles } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
</script>
