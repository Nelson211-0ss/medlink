import { useEffect, useState } from 'react';
import { nurseSlides } from '@/lib/images';
import { cn } from '@/lib/utils';

/** Hero slider — healthcare portraits inside circular frames. */
export function NurseSlider({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % nurseSlides.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        'min-h-[min(58vh,560px)] sm:min-h-[min(62vh,620px)] lg:min-h-[640px]',
        className,
      )}
    >
      {nurseSlides.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            'absolute inset-0 flex items-center justify-center pb-10 transition-all duration-700 ease-out sm:pb-12',
            i === index
              ? 'z-10 scale-100 opacity-100'
              : 'pointer-events-none z-0 scale-90 opacity-0',
          )}
          aria-hidden={i !== index}
        >
          <div className={cn('nurse-circle-frame', i === index && 'nurse-circle-float')}>
            <div className="nurse-circle-inner">
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-[108%] w-auto max-w-[115%] object-contain object-bottom"
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {nurseSlides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show ${slide.alt}`}
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'w-6 bg-primary' : 'w-2 bg-primary/30 hover:bg-primary/50',
            )}
          />
        ))}
      </div>
    </div>
  );
}
