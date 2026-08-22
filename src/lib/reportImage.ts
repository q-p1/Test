import type { RoutineReport } from './reports';

const WIDTH = 1080;
const PADDING = 72;
const NAVY = '#0b213a';
const NAVY_DARK = '#071625';
const GOLD = '#e4c993';
const PAPER = '#f4f1ea';
const CARD = '#fffdf8';
const INK = '#14263a';
const MUTED = '#627083';
const LINE = '#ddd7cc';

export async function renderReportPng(report: RoutineReport): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const estimatedLines = report.sections.reduce((sum, section) => sum + section.lines.length + 1, 0);
  const height = Math.max(1400, Math.min(2300, 760 + estimatedLines * 92));
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('تعذّر تجهيز صورة التقرير.');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = NAVY_DARK;
  ctx.fillRect(0, 0, WIDTH, 310);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  text(ctx, 'روتيني', WIDTH - PADDING, 92, 34, 800, GOLD);
  text(ctx, report.title, WIDTH - PADDING, 168, 58, 900, '#fffaf0');
  text(ctx, report.subtitle, WIDTH - PADDING, 222, 28, 600, '#cbd6e1');

  roundedRect(ctx, PADDING, 244, 206, 82, 24, GOLD);
  ctx.textAlign = 'center';
  text(ctx, `${report.score}%`, PADDING + 103, 299, 40, 900, NAVY_DARK);
  ctx.textAlign = 'right';

  let y = 358;
  const gap = 16;
  const statWidth = (WIDTH - PADDING * 2 - gap * 3) / 4;
  report.stats.slice(0, 4).forEach((stat, index) => {
    const x = WIDTH - PADDING - statWidth - index * (statWidth + gap);
    roundedRect(ctx, x, y, statWidth, 122, 22, CARD, LINE);
    ctx.textAlign = 'center';
    text(ctx, stat.value, x + statWidth / 2, y + 52, 31, 900, NAVY);
    text(ctx, stat.label, x + statWidth / 2, y + 91, 20, 700, MUTED);
    ctx.textAlign = 'right';
  });

  y += 162;
  for (const section of report.sections) {
    const lineHeight = 35;
    const titleHeight = 48;
    const innerWidth = WIDTH - PADDING * 2 - 56;
    const wrapped = section.lines.flatMap((line) => wrapText(ctx, line, innerWidth, 25, 600));
    const cardHeight = titleHeight + Math.max(1, wrapped.length) * lineHeight + 42;

    roundedRect(ctx, PADDING, y, WIDTH - PADDING * 2, cardHeight, 26, CARD, LINE);
    text(ctx, section.title, WIDTH - PADDING - 28, y + 43, 28, 900, NAVY);
    let lineY = y + 86;
    for (const line of wrapped) {
      text(ctx, `• ${line}`, WIDTH - PADDING - 28, lineY, 25, 600, INK);
      lineY += lineHeight;
    }
    y += cardHeight + 18;
    if (y > height - 130) break;
  }

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, height - 84, WIDTH, 84);
  ctx.textAlign = 'center';
  text(ctx, 'بياناتك من روتيني · محفوظة على جهازك', WIDTH / 2, height - 34, 21, 700, '#d8e1ea');

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('تعذّر إنشاء صورة التقرير.')), 'image/png', 1);
  });
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  color: string,
) {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "SF Arabic", "Geeza Pro", Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, size: number, weight: number): string[] {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "SF Arabic", "Geeza Pro", Arial, sans-serif`;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0]!;
  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
