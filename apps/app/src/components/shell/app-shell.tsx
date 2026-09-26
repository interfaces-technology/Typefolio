"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderIcon,
  HeartIcon,
  HomeIcon,
  MonitorIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react";

import { LibraryProvider, useLibrary } from "@/components/library/library-provider";
import { SearchOverlay } from "@/components/search/search-overlay";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OfflineBanner } from "@/components/ui/feedback";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { relativeTime } from "@/lib/format";

function deviceIcon(platform: string) {
  if (platform === "ios") return SmartphoneIcon;
  if (platform === "macos") return TabletIcon;
  return MonitorIcon;
}

function AppSidebar() {
  const pathname = usePathname();
  const { devices } = useLibrary();

  const libraryItems = [
    { href: "/fonts", label: "All fonts", icon: FolderIcon },
    { href: "/favorites", label: "Favorites", icon: HeartIcon },
    { href: "/recent", label: "Recently added", icon: RefreshCwIcon },
    { href: "/shared", label: "Shared", icon: Share2Icon },
    { href: "/collections", label: "Collections", icon: FolderIcon },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <span className="font-semibold">Typefolio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Devices</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devices.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/devices">
                      <MonitorIcon />
                      <span>No devices yet</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                devices.map((device) => {
                  const Icon = deviceIcon(device.platform);
                  return (
                    <SidebarMenuItem key={device.id}>
                      <SidebarMenuButton asChild>
                        <Link href="/devices">
                          <Icon />
                          <span>{device.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
              <Link href="/settings">
                <SettingsIcon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileNav({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/fonts", label: "Fonts", icon: FolderIcon },
    { href: "/favorites", label: "Saved", icon: HeartIcon },
    { href: "/devices", label: "Sync", icon: RefreshCwIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
              "flex h-auto flex-col gap-1 px-3 py-1.5",
            )}
          >
            <Icon className="size-4" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        className="flex h-auto flex-col gap-1 px-3 py-1.5"
        onClick={onSearch}
      >
        <SearchIcon className="size-4" />
        <span className="text-[10px]">Search</span>
      </Button>
    </nav>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { offline, devices } = useLibrary();
  const latestSync = devices
    .map((device) => device.lastSyncAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  useEffect(() => {
    let pendingG = false;
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if ((meta && event.key.toLowerCase() === "k") || (meta && event.key === "/")) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "g" && !meta) {
        pendingG = true;
        window.setTimeout(() => {
          pendingG = false;
        }, 600);
      } else if (pendingG) {
        const map: Record<string, string> = {
          f: "/fonts",
          c: "/collections",
          d: "/devices",
        };
        const href = map[event.key.toLowerCase()];
        if (href) router.push(href);
        pendingG = false;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Button
            variant="outline"
            className="hidden w-full max-w-sm justify-start text-muted-foreground md:inline-flex"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
            Search fonts, collections...
            <kbd className="ml-auto text-xs">⌘K</kbd>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/devices"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}
            >
              <Badge variant="outline">
                {latestSync ? `Synced ${relativeTime(latestSync)}` : "Sync"}
              </Badge>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <Avatar className="size-7">
                    <AvatarFallback>TF</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/devices")}>
                  Devices
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/auth/sign-in";
                        },
                      },
                    })
                  }
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {offline ? <OfflineBanner /> : null}
        <div className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
        <MobileNav onSearch={() => setSearchOpen(true)} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LibraryProvider>
      <TooltipProvider>
        <ShellInner>{children}</ShellInner>
      </TooltipProvider>
    </LibraryProvider>
  );
}
