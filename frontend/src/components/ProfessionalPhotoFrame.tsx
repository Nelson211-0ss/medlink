import { useEffect, useState } from 'react';
import { getProfessionalPhoto, isPortraitCutout } from '@/lib/images';
import { cn, initials } from '@/lib/utils';

interface ProfessionalPhotoFrameProps {
  avatar?: string | null;
  profession?: string | null;
  professionalId?: string;
  alt: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  size?: 'md' | 'lg' | 'sidebar';
}

export function ProfessionalPhotoFrame({
  avatar,
  profession,
  professionalId,
  alt,
  firstName,
  lastName,
  className,
  size = 'lg',
}: ProfessionalPhotoFrameProps) {
  const photo = getProfessionalPhoto({ avatar, profession, id: professionalId });
  const [failed, setFailed] = useState(false);
  const cutout = isPortraitCutout(photo);
  const showPhoto = !failed;

  useEffect(() => {
    setFailed(false);
  }, [photo]);

  const sizeClass =
    size === 'sidebar'
      ? 'org-resume-photo'
      : size === 'lg'
        ? 'h-44 w-44 sm:h-52 sm:w-52'
        : 'h-32 w-32';

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden',
        size === 'sidebar'
          ? sizeClass
          : 'rounded-xl border border-border/60 bg-gradient-to-b from-muted/30 to-muted shadow-sm',
        size !== 'sidebar' && sizeClass,
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt={alt}
          className={cn(
            'h-full w-full',
            cutout
              ? size === 'sidebar'
                ? 'object-contain object-bottom px-3 pb-3 pt-1'
                : 'object-contain object-bottom px-2 pb-1'
              : size === 'sidebar'
                ? 'object-cover object-top'
                : 'object-cover object-center',
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center text-2xl font-bold sm:text-3xl',
            size === 'sidebar'
              ? 'bg-white/15 text-primary-foreground'
              : 'bg-primary/10 text-primary',
          )}
        >
          {initials(firstName, lastName)}
        </div>
      )}
    </div>
  );
}
