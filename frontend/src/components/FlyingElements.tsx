/** Subtle floating shapes used as a site-wide decorative layer. */
export function FlyingElements() {
  const dots = [
    { cls: 'left-[8%] top-[12%] h-3 w-3', delay: '0s', dur: '6s' },
    { cls: 'left-[18%] top-[55%] h-2 w-2', delay: '1.2s', dur: '8s' },
    { cls: 'left-[72%] top-[18%] h-4 w-4', delay: '0.6s', dur: '7s' },
    { cls: 'left-[85%] top-[42%] h-2.5 w-2.5', delay: '2s', dur: '6s' },
    { cls: 'left-[55%] top-[8%] h-2 w-2', delay: '1.8s', dur: '8s' },
    { cls: 'left-[92%] top-[78%] h-3 w-3', delay: '0.4s', dur: '7s' },
  ];

  const crosses = [
    { cls: 'left-[42%] top-[22%]', delay: '1s' },
    { cls: 'left-[68%] top-[68%]', delay: '2.4s' },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {dots.map((item, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-primary/15 ${item.cls} animate-fly`}
          style={{ animationDelay: item.delay, animationDuration: item.dur }}
        />
      ))}
      {crosses.map((item, i) => (
        <span
          key={`x-${i}`}
          className={`absolute text-lg font-bold text-primary/20 ${item.cls} animate-fly`}
          style={{ animationDelay: item.delay, animationDuration: '7s' }}
        >
          +
        </span>
      ))}
    </div>
  );
}
