#!/usr/bin/env bash
# ═══ نشر محوّل PDF على Google Cloud Run — سطر واحد ═══
# الاستعمال:  ./deploy/cloudrun-deploy.sh <PROJECT_ID> [REGION]
# مثال:       ./deploy/cloudrun-deploy.sh my-pdf-project me-central1
#
# ما يفعله السكربت:
#   1) التحقق من gcloud والمشروع
#   2) تفعيل الـ APIs المطلوبة (مرة واحدة فقط)
#   3) بناء الصورة عبر Cloud Build (باستخدام Dockerfile ثلاثي المراحل) والنشر
#
# الحد المجاني يغطي هذا التطبيق بسهولة (المعالجة كلها في متصفح المستخدم):
#   2 مليون طلب/شهر + 360 ألف GB-ثانية ذاكرة + 120 دقيقة بناء/يوم

set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${REGION:-${2:-me-central1}}"
SERVICE="${SERVICE:-pdf-converter}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "✗ gcloud غير مثبت. ثبّته من: https://cloud.google.com/sdk/docs/install"
  echo "  أو استخدم Cloud Shell من المتصفح (لا يحتاج تثبيتًا): https://shell.cloud.google.com"
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi
if [ -z "$PROJECT_ID" ]; then
  echo "✗ لا يوجد Project ID. الاستعمال: ./deploy/cloudrun-deploy.sh <PROJECT_ID> [REGION]"
  exit 1
fi

echo "▶ المشروع: $PROJECT_ID | المنطقة: $REGION | الخدمة: $SERVICE"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "▶ 1/2 تفعيل الـ APIs (run + cloudbuild + artifactregistry)…"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "$PROJECT_ID" >/dev/null

echo "▶ 2/2 البناء والنشر (أول بناء يستغرق ~5-8 دقائق)…"
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300

echo ""
echo "✅ تم النشر — الرابط المباشر ظهر في المخرجات أعلاه (*.run.app)"
echo "   للتحديث لاحقًا: أعد السطر نفسه بعد أي تغيير (يبني الفرق فقط عادةً)."
