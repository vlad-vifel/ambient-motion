<template>
    <div class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold">Photos</h2>
                <p class="text-sm text-muted-foreground mt-0.5">
                    Upload and organize your photo library
                </p>
            </div>
            <Button size="sm">
                <Upload class="size-4 mr-2" />
                Upload Photos
            </Button>
        </div>

        <div
            class="rounded-xl border border-border/50 bg-card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-64"
        >
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
                <Images class="size-6 text-muted-foreground" />
            </div>
            <div>
                <p class="font-medium">No photos yet</p>
                <p class="text-sm text-muted-foreground mt-1">
                    Upload your first photos to get started
                </p>
            </div>
            <Button size="sm" variant="outline">
                <Upload class="size-4 mr-2" />
                Upload Photos
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Images, Upload } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
</script>
