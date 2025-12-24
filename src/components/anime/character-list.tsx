'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import type { JikanCharacter } from '@/lib/types';
import { Users, Loader2, PlusCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 12;

interface CharacterListProps {
  characters: JikanCharacter[] | null;
  isLoading: boolean;
  error: string | null;
}

export function CharacterList({ characters, isLoading, error }: CharacterListProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  if (error) {
    return (
        <div className="py-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Characters</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!characters || characters.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{t('no_characters_found')}</div>;
  }
  
  const mainCharacters = characters.filter(c => c.role === 'Main');
  const supportingCharacters = characters.filter(c => c.role === 'Supporting');
  
  const allCharacters = [...mainCharacters, ...supportingCharacters];

  const visibleCharacters = allCharacters.slice(0, visibleCount);
  const hasMoreToLoad = visibleCount < allCharacters.length;

  return (
    <div>
        <h3 className="text-xl font-headline font-semibold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {t('characters')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
             {visibleCharacters.map(({ character, voice_actors }) => {
              const japaneseVA = voice_actors?.find(va => va.language === 'Japanese');
              return (
                 <Link href={`/character/${character.mal_id}`} key={character.mal_id} className="group block text-center">
                    <Card className="overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-md">
                    <div className="relative aspect-[2/3] w-full">
                        <Image
                            src={character.images.webp.image_url}
                            alt={character.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 16vw"
                            data-ai-hint="anime character"
                        />
                    </div>
                    </Card>
                    <p className="mt-2 text-sm font-semibold truncate group-hover:text-primary">{character.name}</p>
                    {japaneseVA && (
                        <p className="text-xs text-muted-foreground truncate">{japaneseVA.person.name}</p>
                    )}
                </Link>
              )
            })}
        </div>
         {hasMoreToLoad && (
            <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}>
                    <PlusCircle className="mr-2" /> {t('show_more')}
                </Button>
            </div>
        )}
    </div>
  );
}
