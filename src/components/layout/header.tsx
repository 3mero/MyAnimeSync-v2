'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthDialog } from '@/components/auth/auth-dialog';

import { useAuth } from '@/hooks/use-auth';
import { useHydration } from '@/hooks/use-hydration';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { genres_list, translations } from '@/i18n';
import { useLogger } from '@/hooks/use-logger';
import { LiveClock } from './live-clock';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { NotificationsDialog } from '@/components/notifications/notifications-dialog';


import {
  Home, Search, Tv, CheckCircle2, Bookmark, LogOut, User,
  Info, CalendarClock,
  Languages, Loader2,
  Menu, Palette, Bell, BookOpen, BookCheck, BookUser, Newspaper, Settings
} from 'lucide-react';


const mainNavLinks = [
  { href: '/', labelKey: 'home', icon: Home },
  { href: '/search', labelKey: 'search', icon: Search },
  { href: '/schedules', labelKey: 'schedules', icon: CalendarClock },
];

const animeListLinks: { href: string; labelKey: keyof typeof translations.ar; icon: React.ElementType; key: 'watching' | 'plan-to-watch' | 'completed' }[] = [
  { href: '/list/watching', labelKey: 'watching', icon: Tv, key: 'watching' },
  { href: '/list/plan-to-watch', labelKey: 'plan_to_watch', icon: Bookmark, key: 'plan-to-watch' },
  { href: '/list/completed', labelKey: 'completed', icon: CheckCircle2, key: 'completed' },
];

const mangaListLinks: { href: string; labelKey: keyof typeof translations.ar; icon: React.ElementType; key: 'reading' | 'plan-to-read' | 'read' }[] = [
  { href: '/list/reading', labelKey: 'currently_reading', icon: BookOpen, key: 'reading' },
  { href: '/list/plan-to-read', labelKey: 'plan_to_read_manga', icon: BookUser, key: 'plan-to-read' },
  { href: '/list/read', labelKey: 'read', icon: BookCheck, key: 'read' },
];

const mainGenres = genres_list.filter(g => g.type === 'genre');
const themes = genres_list.filter(g => g.type === 'tag');


function AuthSection() {
    const { authMode, localProfile, signOut, sharedDataConfig } = useAuth();
    const { t } = useTranslation();
    const isHydrated = useHydration();

    if (!isHydrated) {
      return <div className="w-[100px] h-10"><Loader2 className="animate-spin" /></div>
    }

    if (authMode === 'none') {
        return <AuthDialog />;
    }

    const displayName = localProfile?.username || 'User';
    const displayAvatar = localProfile?.avatar_url;
    
    const isConnected = !!sharedDataConfig.url;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={displayAvatar} alt={displayName} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    {isConnected && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('connected')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {t('local_account')}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('log_out')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MobileNav({ listCounts }: { listCounts: Record<string, number> }) {
  const { t } = useTranslation();
  const { authMode } = useAuth();
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" disabled>
                <Menu />
            </Button>
        </div>
    );
  }
  
  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
            <span className="sr-only">Open Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="left" align="start">
          <DropdownMenuLabel>{t('home')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mainNavLinks.map(link => (
            <Link href={link.href} key={link.href}>
              <DropdownMenuItem>
                <link.icon className="mr-2 h-4 w-4" />
                <span>{t(link.labelKey as keyof typeof translations.ar)}</span>
              </DropdownMenuItem>
            </Link>
          ))}
           <Link href="/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('control_panel')}</span>
              </DropdownMenuItem>
            </Link>
          {authMode !== 'none' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-yellow-500">{t('anime')}</DropdownMenuLabel>
                {animeListLinks.map(link => {
                    const count = listCounts[link.key];
                    return (
                        <Link href={link.href} key={link.href}>
                            <DropdownMenuItem className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <link.icon className="mr-2 h-4 w-4" />
                                    <span>{t(link.labelKey)}</span>
                                </div>
                                {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                            </DropdownMenuItem>
                        </Link>
                    )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-blue-400">{t('manga')}</DropdownMenuLabel>
                 {mangaListLinks.map(link => {
                    const count = listCounts[link.key];
                    return (
                        <Link href={link.href} key={link.href}>
                            <DropdownMenuItem className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <link.icon className="mr-2 h-4 w-4" />
                                    <span>{t(link.labelKey)}</span>
                                </div>
                                {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                            </DropdownMenuItem>
                        </Link>
                    )
                 })}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Header() {
  const { t, toggleLanguage } = useTranslation();
  const { authMode, listData, trackedMedia } = useAuth();
  const pathname = usePathname();
  const isHydrated = useHydration();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);


  const listCounts = useMemo(() => {
    if (!isHydrated || authMode === 'none') {
        return {
            watching: 0,
            'plan-to-watch': 0,
            completed: 0,
            reading: 0,
            'plan-to-read': 0,
            read: 0,
        };
    }
    
    const completedAnimeCount = Object.keys(listData.watchedEpisodes || {}).reduce((count, mediaId) => {
        const currentlyWatchingList = listData.currentlyWatching || [];
        const media = currentlyWatchingList.find(id => String(id) === mediaId) 
            ? trackedMedia.find(m => m.id === Number(mediaId))
            : trackedMedia.find(m => m.id === Number(mediaId));
            
        if (media && media.episodes && (listData.watchedEpisodes?.[mediaId]?.length || 0) >= media.episodes) {
            return count + 1;
        }
        return count;
    }, 0);


    const readMangaCount = Object.keys(listData.readChapters || {}).reduce((count, mediaId) => {
        const media = trackedMedia.find(m => m.id === Number(mediaId));
        const total = media?.chapters || media?.volumes;
        if (media && total && (listData.readChapters?.[mediaId]?.read.length || 0) >= total) {
            return count + 1;
        }
        return count;
    }, 0);

    return {
        watching: listData.currentlyWatching?.length || 0,
        'plan-to-watch': listData.planToWatch?.length || 0,
        completed: completedAnimeCount,
        reading: listData.currentlyReading?.length || 0,
        'plan-to-read': listData.planToRead?.length || 0,
        read: readMangaCount,
    }
  }, [listData, trackedMedia, authMode, isHydrated]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-primary" />
              <span className="font-bold font-headline text-xl">{t('app_title')}</span>
            </Link>
            <LiveClock />
        </div>
        
        <nav className="hidden md:flex items-center gap-1 text-sm mr-6">
          {mainNavLinks.map(link => (
            <Link key={link.href} href={link.href}>
                <Button 
                  variant="ghost"
                  className={cn("flex items-center gap-2", pathname === link.href ? "bg-accent text-accent-foreground" : "")}
                >
                    <link.icon />
                    {t(link.labelKey as keyof typeof translations.ar)}
                </Button>
            </Link>
          ))}
          
          {authMode !== 'none' && (
            <>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">{t('my_lists')}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-yellow-500">{t('anime')}</DropdownMenuLabel>
                    {animeListLinks.map(link => {
                        const count = listCounts[link.key];
                        return (
                           <Link href={link.href} key={link.href}>
                              <DropdownMenuItem className="flex justify-between">
                                  <div className="flex items-center gap-2">
                                    <link.icon className="mr-2 h-4 w-4" />
                                    <span>{t(link.labelKey as keyof typeof translations.ar)}</span>
                                  </div>
                                  {isHydrated && count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                              </DropdownMenuItem>
                          </Link>
                        )
                    })}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-blue-400">{t('manga')}</DropdownMenuLabel>
                     {mangaListLinks.map(link => {
                         const count = listCounts[link.key];
                         return (
                           <Link href={link.href} key={link.href}>
                              <DropdownMenuItem className="flex justify-between">
                                  <div className="flex items-center gap-2">
                                    <link.icon className="mr-2 h-4 w-4" />
                                    <span>{t(link.labelKey as keyof typeof translations.ar)}</span>
                                  </div>
                                  {isHydrated && count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
                              </DropdownMenuItem>
                          </Link>
                         )
                     })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
             <Link href="/settings">
                <Button 
                  variant="ghost"
                  className={cn("flex items-center gap-2", pathname === "/settings" ? "bg-accent text-accent-foreground" : "")}
                >
                    <Settings />
                    {t('control_panel')}
                </Button>
            </Link>
            </>
          )}
        </nav>
        
        <div className="flex-grow"></div>

        <div className="flex items-center justify-end gap-2">
            <div className="md:hidden">
              <Link href="/" className="flex items-center gap-2">
                  <Logo className="w-8 h-8 text-primary" />
                  <span className="font-bold font-headline text-xl">{t('app_title')}</span>
              </Link>
            </div>
            <div className="flex-grow md:flex-grow-0"></div>

            {authMode !== 'none' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsNotificationsOpen(true)}>
                  <Bell />
                </Button>
                <NotificationsDialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} />
              </>
            )}
            
            <AuthSection />

            <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle language">
                <Languages />
            </Button>
            {isHydrated && <MobileNav listCounts={listCounts} />}
        </div>
      </div>
    </header>
  );
}
