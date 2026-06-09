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
      <div className="nurse-circle-frame nurse-circle-float">
        <div className="nurse-circle-inner">
          {nurseSlides.map((slide, i) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={cn(
                'nurse-circle-img absolute bottom-0 left-1/2 transition-opacity duration-700',
                i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              style={{
                transform: `translateX(calc(-50% + ${slide.offsetX}%)) scale(${slide.scale})`,
                transformOrigin: 'bottom center',
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              aria-hidden={i !== index}
            />
          ))}
        </div>
      </div>

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
