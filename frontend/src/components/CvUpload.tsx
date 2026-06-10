import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { uploadCv } from '@/lib/upload';
import { apiError } from '@/lib/api';

export function CvUpload({
  cvUrl,
  onUploaded,
}: {
  cvUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Upload a PDF or image (JPG/PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadCv(file);
      onUploaded(url);
      toast.success('CV uploaded');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Resume / CV file</p>
          <p className="text-xs text-muted-foreground">PDF or image, max 10MB. Visible to organizations.</p>
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              View current CV
            </a>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png"
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
        className="shrink-0"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
        {cvUrl ? 'Replace CV' : 'Upload CV'}
      </Button>
    </div>
  );
}
