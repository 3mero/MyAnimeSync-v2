'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, User, Upload } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import { useLogger } from '@/hooks/use-logger';

export function AuthDialog() {
  const { t } = useTranslation();
  const { signInLocally, importData } = useAuth();
  const { addLog } = useLogger();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalSignIn = (e: React.FormEvent) => {
      e.preventDefault();
      addLog(`Attempting local sign-in for user: ${username}`);
      setLoading(true);
      signInLocally(username);
      setLoading(false);
      setOpen(false);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        addLog(`Importing data from file: ${file.name} from Auth Dialog`);
        importData(file);
        // The app will reload on successful import, closing the dialog.
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LogIn className="mr-2 h-4 w-4" /> {t('local_signin')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('welcome_to_animesync')}</DialogTitle>
          <DialogDescription>
            {t('sign_in_desc_local')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLocalSignIn} className="space-y-4 pt-4">
           <div className="space-y-1">
            <Label htmlFor="username-local">{t('username')}</Label>
            <Input
              id="username-local"
              type="text"
              placeholder={t('your_username_placeholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !username}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2" />}
            {t('local_signin_button')}
          </Button>
        </form>

        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">أو</span>
            </div>
        </div>
        
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
        />
        <Button onClick={handleImportClick} variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            استرداد من نسخة احتياطية
        </Button>

      </DialogContent>
    </Dialog>
  );
}
