import * as React from "react";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { Switch } from "../ui/switch";
import CreateNewChat from "../chat/CreateNewChat";
import NewGroupChatModal from "../chat/NewGroupChatModal";
import GroupChatList from "../chat/GroupChatList";
import AddFriendModal from "../chat/AddFriendModal";
import DirectMessageList from "../chat/DirectMessageList";
import { useThemeStore } from "@/stores/useThemeStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {isDark, toggleTheme} = useThemeStore();
  const { user } = useAuthStore();
  const { convoLoading } = useChatStore();

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-gradient-primary" render={<a href="#" />}>
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Moji</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80"/>
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon className="size-4 text-white/80"/>
                  </div>
                </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* Content */}
      <SidebarContent className="beautiful-scrollbar">
        {/* New chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat></CreateNewChat>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Nhom Chat
          </SidebarGroupLabel>
          <SidebarGroupAction title="Tao Nhom" className="cursor-pointer">
            <NewGroupChatModal></NewGroupChatModal>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <GroupChatList></GroupChatList>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* direct messages */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Ban Be
          </SidebarGroupLabel>
          <SidebarGroupAction title="Ket Ban" className="cursor-pointer">
            <AddFriendModal></AddFriendModal>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <DirectMessageList></DirectMessageList>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Footer */}
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
