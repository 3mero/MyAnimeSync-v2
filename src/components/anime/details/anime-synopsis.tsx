'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Languages, Undo2, Info, Loader2 } from 'lucide-react';
import { translateTextServer } from '@/lib/translation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

export function AnimeSynopsis({ synopsis }: { synopsis: string | null | undefined }) {
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleTranslateToggle = async () => {
    // If we are showing the translation, switch back to original
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    
    // If we have already translated it, just show it
    if (translatedSynopsis) {
      setShowTranslation(true);
      return;
    }

    // If there's nothing to translate, do nothing
    const textToTranslate = synopsis;
    if (!textToTranslate || !textToTranslate.trim() || textToTranslate === 'No synopsis available.') {
        toast({ variant: "destructive", title: t('toast_nothing_to_translate'), description: t('toast_no_synopsis_available_desc') });
        return;
    }

    // Otherwise, perform the translation
    setIsTranslating(true);
    const result = await translateTextServer(textToTranslate); // Defaults to 'ar'
    if (result) {
      setTranslatedSynopsis(result);
      setShowTranslation(true);
    } else {
        toast({ variant: "destructive", title: t('toast_translation_failed_title'), description: t('toast_translation_failed_desc') });
    }
    setIsTranslating(false);
  };

  const synopsisText = (showTranslation && translatedSynopsis) ? translatedSynopsis : (synopsis || t('no_synopsis_available'));

  return (
    <div>
      <div className={cn("flex items-center justify-between mb-3", lang === 'ar' && 'rtl')}>
        <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
          <Info className="w-5 h-5" /> {t('synopsis')}
        </h2>
        {synopsis && (
            <Button variant="outline" size="sm" onClick={handleTranslateToggle} disabled={isTranslating}>
              {isTranslating ? <Loader2 className="h-4 w-4 animate-spin"/> : showTranslation ? (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t('original_text')}
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  {t('translate_to_arabic')}
                </>
              )}
            </Button>
        )}
      </div>
      
      <p className={cn("text-foreground/80 leading-relaxed whitespace-pre-wrap", lang === 'ar' && showTranslation && "rtl")}>
        {synopsisText}
      </p>
    </div>
  );
}
