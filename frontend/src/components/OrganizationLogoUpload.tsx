import { useEffect, useRef, useState } from 'react';
import { Building2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { uploadOrgLogo } from '@/lib/upload';
import { apiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export function OrganizationLogoUpload({
  logo,
  organizationName,
  onUploaded,
  className,
}: {
  logo?: string | null;
  organizationName?: string;
  onUploaded?: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logo ?? null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(logo ?? null);
  }, [logo]);

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
      const { url } = await uploadOrgLogo(file);
      setPreview(url);
      onUploaded?.(url);
      toast.success('Organization logo updated');
    } catch (e) {
      setPreview(logo ?? null);
      toast.error(apiError(e));
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const initial = organizationName?.trim().charAt(0).toUpperCase() || 'O';

  return (
    <div className={cn('flex flex-col items-center gap-3 sm:flex-row sm:items-center', className)}>
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-primary/15 bg-primary/5 ring-2 ring-primary/10">
          {preview ? (
            <img src={preview} alt={`${organizationName ?? 'Organization'} logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-primary">
              <Building2 className="h-8 w-8" />
              <span className="text-lg font-bold">{initial}</span>
            </span>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium">Organization logo</p>
        <p className="text-xs text-muted-foreground">Shown on your job postings to professionals</p>
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
          {uploading ? 'Uploading...' : preview ? 'Change logo' : 'Upload logo'}
        </Button>
      </div>
    </div>
  );
}
