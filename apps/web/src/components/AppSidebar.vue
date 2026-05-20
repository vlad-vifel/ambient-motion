<template>
    <Sidebar variant="inset">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton as-child size="lg">
                        <RouterLink to="/">
                            <div
                                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <span class="text-xs font-bold">AM</span>
                            </div>
                            <span class="font-semibold text-sm">ambient motion</span>
                        </RouterLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem v-for="item in navItems" :key="item.name">
                            <SidebarMenuButton as-child :is-active="route.name === item.name">
                                <RouterLink :to="item.path">
                                    <component :is="item.icon" class="size-4" />
                                    <span>{{ item.label }}</span>
                                </RouterLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <SidebarMenuButton class="cursor-pointer" size="lg">
                                <Avatar class="size-8 rounded-full">
                                    <AvatarFallback
                                        class="rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                                        {{ userInitials }}
                                    </AvatarFallback>
                                </Avatar>
                                <div class="flex flex-col gap-0.5 leading-none min-w-0">
                                    <span class="text-sm font-medium truncate">{{
                                        userEmail
                                    }}</span>
                                </div>
                                <ChevronsUpDown
                                    class="ml-auto size-4 text-muted-foreground shrink-0" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" class="w-44" side="top">
                            <DropdownMenuLabel
                                class="text-xs text-muted-foreground font-normal truncate">
                                {{ userEmail }}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="cursor-pointer"
                                variant="destructive"
                                @click="handleLogout">
                                <LogOut class="size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
</template>

<script setup lang="ts">
    import { ChevronsUpDown, ImageIcon, LogOut, Music, Sparkles, Video } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { Avatar, AvatarFallback } from '@/components/ui/avatar';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import {
        Sidebar,
        SidebarContent,
        SidebarFooter,
        SidebarGroup,
        SidebarGroupContent,
        SidebarHeader,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
    } from '@/components/ui/sidebar';
    import { useAuthStore } from '@/stores/auth';

    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();

    const navItems = [
        { name: 'photos', path: '/photos', label: 'Photos', icon: ImageIcon },
        { name: 'audio', path: '/audio', label: 'Audio', icon: Music },
        { name: 'videos', path: '/videos', label: 'Videos', icon: Video },
        { name: 'create', path: '/create', label: 'Create', icon: Sparkles },
    ];

    const userEmail = computed(() => auth.user?.email ?? 'user@example.com');
    const userInitials = computed(() => userEmail.value.slice(0, 2).toUpperCase());

    async function handleLogout() {
        auth.logout();
        await router.push('/login');
    }
</script>
