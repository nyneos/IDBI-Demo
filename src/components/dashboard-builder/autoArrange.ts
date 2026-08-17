import { BLOCK_MIN_SIZE, type DashboardBlock, type GridLayoutItem } from './types';

export function autoArrange(blocks: DashboardBlock[]): GridLayoutItem[] {
  let x = 0;
  let y = 0;
  let rowH = 0;
  return blocks.map((b) => {
    const size = BLOCK_MIN_SIZE[b.type];
    const w = b.layout?.w ?? size.w;
    const h = b.layout?.h ?? size.h;
    if (x + w > 12) {
      y += rowH;
      x = 0;
      rowH = 0;
    }
    const item: GridLayoutItem = {
      i: b.id,
      x,
      y,
      w,
      h,
      minW: size.minW,
      minH: size.minH,
    };
    x += w;
    rowH = Math.max(rowH, h);
    return item;
  });
}
