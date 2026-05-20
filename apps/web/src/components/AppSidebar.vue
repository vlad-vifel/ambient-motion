<template>
    <Sidebar variant="inset">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton as-child size="lg">
                        <RouterLink to="/">
                            <div
                                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                            >
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
                                <Avatar class="size-7 rounded-full">
                                    <AvatarFallback
                                        class="rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs"
                                    >
                                        {{ userInitials }}
                                    </AvatarFallback>
                                </Avatar>
                                <div class="flex flex-col leading-none min-w-0">
                                    <span class="text-sm font-medium truncate">{{ userName }}</span>
                                    <span
                                        class="text-xs text-muted-foreground font-normal truncate"
                                    >{{ userEmail }}</span
                                    >
                                </div>
                                <ChevronsUpDown
                                    class="ml-auto size-4 text-muted-foreground shrink-0"
                                />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" class="" side="top">
                            <DropdownMenuLabel class="flex flex-col">
                                <span class="font-semibold">{{ userName }}</span>
                                <span class="text-xs text-muted-foreground font-normal">{{
                                    userEmail
                                }}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem class="cursor-pointer" @click="openProfileDialog">
                                <User class="size-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem class="cursor-pointer" disabled>
                                <Settings class="size-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="cursor-pointer"
                                variant="destructive"
                                @click="handleLogout"
                            >
                                <LogOut class="size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>

        <ProfileDialog
            :open="profileDialogOpen"
            @update:open="profileDialogOpen = $event"
            @profile-updated="handleProfileUpdated"
        />
    </Sidebar>
</template>

<script setup lang="ts">
    import {
        ChevronsUpDown,
        ImageIcon,
        LogOut,
        Music,
        Settings,
        Sparkles,
        User,
        Video,
    } from 'lucide-vue-next';
    import { computed, ref } from 'vue';
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
    import ProfileDialog from './ProfileDialog.vue';

    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();
    const profileDialogOpen = ref(false);

    const navItems = [
        { name: 'assets', path: '/assets', label: 'Assets', icon: ImageIcon },
        { name: 'audio', path: '/audio', label: 'Audio', icon: Music },
        { name: 'videos', path: '/videos', label: 'Videos', icon: Video },
        { name: 'create', path: '/create', label: 'Create', icon: Sparkles },
    ];

    const userEmail = computed(() => auth.user?.email ?? 'user@example.com');
    const userName = computed(() => auth.user?.name ?? 'User');
    const userInitials = computed(() => userName.value.slice(0, 2).toUpperCase());

    function openProfileDialog() {
        profileDialogOpen.value = true;
    }

    function handleProfileUpdated() {
        // Profile updated, dialog will close automatically
    }

    async function handleLogout() {
        auth.logout();
        await router.push('/login');
    }
</script>
