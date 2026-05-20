<template>
    <div
        v-if="collapsible === 'none'"
        :class="
            cn(
                'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
                props.class,
            )
        "
        data-slot="sidebar"
        v-bind="$attrs"
    >
        <slot />
    </div>

    <Sheet v-else-if="isMobile" :open="openMobile" v-bind="$attrs" @update:open="setOpenMobile">
        <SheetContent
            class="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
            data-mobile="true"
            data-sidebar="sidebar"
            data-slot="sidebar"
            :side="side"
            :style="{
                '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            }"
        >
            <SheetHeader class="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div class="flex h-full w-full flex-col">
                <slot />
            </div>
        </SheetContent>
    </Sheet>

    <div
        v-else
        class="group peer text-sidebar-foreground hidden md:block"
        :data-collapsible="state === 'collapsed' ? collapsible : ''"
        :data-side="side"
        data-slot="sidebar"
        :data-state="state"
        :data-variant="variant"
    >
        <div
            :class="
                cn(
                    'transition-[width] duration-200 ease-linear relative w-(--sidebar-width) bg-transparent',
                    'group-data-[collapsible=offcanvas]:w-0',
                    'group-data-[side=right]:rotate-180',
                    variant === 'floating' || variant === 'inset'
                        ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
                        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
                )
            "
            data-slot="sidebar-gap"
        />
        <div
            :class="
                cn(
                    'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
                    side === 'left'
                        ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
                        : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
                    variant === 'floating' || variant === 'inset'
                        ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
                        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
                    props.class,
                )
            "
            :data-side="side"
            data-slot="sidebar-container"
            v-bind="$attrs"
        >
            <div
                class="bg-sidebar group-data-[variant=floating]:ring-sidebar-border group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 flex size-full flex-col"
                data-sidebar="sidebar"
                data-slot="sidebar-inner"
            >
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { SIDEBAR_WIDTH_MOBILE, useSidebar } from './utils';
    import type { SidebarProps } from '.';
    import { Sheet, SheetContent } from '@/components/ui/sheet';
    import SheetDescription from '@/components/ui/sheet/SheetDescription.vue';
    import SheetHeader from '@/components/ui/sheet/SheetHeader.vue';
    import SheetTitle from '@/components/ui/sheet/SheetTitle.vue';
    import { cn } from '@/lib/utils';

    defineOptions({
        inheritAttrs: false,
    });

    const props = withDefaults(defineProps<SidebarProps>(), {
        side: 'left' as SidebarProps['side'],
        variant: 'sidebar' as SidebarProps['variant'],
        collapsible: 'offcanvas' as SidebarProps['collapsible'],
    });

    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
</script>
