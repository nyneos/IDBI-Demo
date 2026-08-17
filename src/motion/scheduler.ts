type Tick = (time: number, delta: number) => void;

const subscribers = new Set<Tick>();
let raf = 0;
let last = 0;
let running = false;

function frame(now: number): void {
  const delta = last === 0 ? 16 : now - last;
  last = now;
  for (const cb of subscribers) {
    cb(now, delta);
  }
  if (subscribers.size > 0) {
    raf = requestAnimationFrame(frame);
  } else {
    running = false;
    last = 0;
    raf = 0;
  }
}

function start(): void {
  if (running) return;
  running = true;
  last = 0;
  raf = requestAnimationFrame(frame);
}

function stop(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  running = false;
  last = 0;
}

export function subscribe(cb: Tick): () => void {
  subscribers.add(cb);
  if (!running) start();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stop();
  };
}

export function isSchedulerRunning(): boolean {
  return running;
}

export function subscriberCount(): number {
  return subscribers.size;
}
