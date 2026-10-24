#!/bin/bash
# حارس خادم التطوير — يعيد التشغيل تلقائيًا إذا توقف
cd /home/z/my-project
while true; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:3000/ 2>/dev/null)
  if [ "$code" != "200" ]; then
    echo "[$(date +%H:%M:%S)] down (code=$code) — restarting" >> /home/z/my-project/dev-watchdog.log
    ( setsid bun run dev >> /home/z/my-project/dev-watchdog.log 2>&1 & )
    sleep 20
  fi
  sleep 6
done
