import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, Spinner } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { uploadAvatar } from '@/lib/upload';
import { apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export function ProfilePhotoUpload({
  avatar,
  firstName,
  lastName,
  onUploaded,
  className,
}: {
  avatar?: string | null;
  firstName?: string;
  lastName?: string;
  onUploaded?: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setPreview(avatar ?? null);
  }, [avatar]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG or PNG image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const { url, user } = await uploadAvatar(file);
      setPreview(url);
      setUser(user);
      onUploaded?.(url);
      toast.success('Profile photo updated');
    } catch (e) {
      setPreview(avatar ?? null);
      toast.error(apiError(e));
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3 sm:flex-row sm:items-center', className)}>
      <div className="relative">
        <Avatar
          src={preview}
          first={firstName}
          last={lastName}
          className="h-24 w-24 rounded-xl text-xl ring-2 ring-primary/20"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium">Profile photo</p>
        <p className="text-xs text-muted-foreground">Visible to organizations searching for talent</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : preview ? 'Change photo' : 'Upload photo'}
        </Button>
      </div>
    </div>
  );
}
