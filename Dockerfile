# ═══ محوّل PDF — صورة النشر على Google Cloud Run ═══
# بناء ثلاثي المراحل على bun (نفس بيئة التطوير تمامًا):
#   deps    → تثبيت التبعيات بbun.lock + ترقيع dxf-converter
#   builder → توليد عميل Prisma (إن لزم) + بناء Next.js standalone
#   runner  → صورة تشغيل نحيفة تشغّل الخادم المستقل فقط

# ── المرحلة 1: التبعيات ──
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
# postinstall يرقّع @mlightcad/dxf-json-converter (script بـbun متوافق مع Docker)
RUN bun install

# ── المرحلة 2: البناء ──
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# عميل Prisma موجود كسقالة — توليده آمن حتى إن لم يُستورد وقت التشغيل
RUN bunx prisma generate
# next build + نسخ static وpublic داخل standalone (سكربت build في package.json)
RUN bun run build

# ── المرحلة 3: التشغيل ──
FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# الخادم المستقل كامل: server.js + .next/static + public (شامل wasm العمال)
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["bun", "server.js"]
