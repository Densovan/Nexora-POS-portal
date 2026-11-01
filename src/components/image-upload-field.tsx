import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { getApiErrorMessage, uploadsApi } from '@nexora/api-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/toast';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
  shape?: 'square' | 'circle' | 'wide';
  disabled?: boolean;
}

const SHAPE_CLASSES: Record<NonNullable<ImageUploadFieldProps['shape']>, string> = {
  square: 'h-28 w-28 rounded-xl',
  circle: 'h-24 w-24 rounded-full',
  wide: 'h-28 w-full max-w-xs rounded-xl',
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  shape = 'square',
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const preview = mediaUrl(value);

  const upload = useMutation({
    mutationFn: (file: File) => uploadsApi.image(file),
    onSuccess: (result) => {
      onChange(result.url);
      toast({ title: `${label} uploaded`, variant: 'success' });
    },
    onError: (error) => {
      toast({
        title: `Could not upload ${label.toLowerCase()}`,
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    },
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: 'Unsupported file',
        description: 'Use a JPEG, PNG, or WebP image.',
        variant: 'error',
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: 'Image too large',
        description: 'Images must be 5 MB or smaller.',
        variant: 'error',
      });
      return;
    }
    upload.mutate(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 text-slate-400',
            SHAPE_CLASSES[shape],
          )}
        >
          {preview ? (
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={(event) => {
              pick(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={upload.isPending}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {preview ? 'Replace' : 'Upload'}
            </Button>
            {preview && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || upload.isPending}
                onClick={() => onChange(null)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{hint ?? 'JPEG, PNG, or WebP · up to 5 MB.'}</p>
        </div>
      </div>
    </div>
  );
}
