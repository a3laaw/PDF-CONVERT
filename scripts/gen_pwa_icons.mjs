/* توليد أيقونات PWA لمحوّل PDF — sharp يحوّل SVG إلى PNG بأي مقاس */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "icons");
mkdirSync(OUT, { recursive: true });

/* مستند أبيض بزاوية مطوية + سهمان متقابلان (هوية الموقع) + شارة PDF */
const doc = (scale) => `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
  <path d="M156 84 H296 L356 144 V412 Q356 428 340 428 H172 Q156 428 156 412 Z" fill="#FFFFFF"/>
  <path d="M296 84 L356 144 H296 Z" fill="#DDE0FC"/>
  <path d="M196 196 H268 M252 180 268 196 252 212" stroke="#4F55E3" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M316 244 H244 M260 228 244 244 260 260" stroke="#8B8FF6" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="186" y="300" width="140" height="76" rx="24" fill="#4F55E3"/>
  <text x="256" y="358" font-family="DejaVu Sans" font-size="56" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PDF</text>
</g>`;

const svgMain = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="1" stop-color="#4043D6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  ${doc(1)}
</svg>`;

/* maskable/apple: خلفية بلا زوايا والمحتوى داخل منطقة الأمان الدائرية */
const svgFull = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="1" stop-color="#4043D6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${doc(scale)}
</svg>`;

const jobs = [
  ["icon-192.png", svgMain(112), 192],
  ["icon-512.png", svgMain(112), 512],
  ["maskable-512.png", svgFull(0.72), 512],
  ["apple-touch-icon.png", svgFull(0.84), 180],
  ["favicon-32.png", svgMain(112), 32],
];

for (const [name, svg, size] of jobs) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "fill" })
    .png()
    .toFile(join(OUT, name));
  console.log("OK", name);
}
console.log("icons done →", OUT);
