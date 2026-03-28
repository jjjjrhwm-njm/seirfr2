// ==========================================
// نجم كلاود - السوبر واركر v20.0 (النسخة الكاملة)
// يدير: قاعدة البيانات + الـ SEO + واجهة المستخدم
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // إعدادات الـ CORS للسماح بالاتصال من أي مكان
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (method === "OPTIONS") return new Response(null, { headers });

    // ------------------------------------------
    // 1. قسم محركات البحث (SEO Gates)
    // ------------------------------------------
    
    // ملف الروبوتات
    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml`, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    // خريطة الموقع
    if (url.pathname === "/sitemap.xml") {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
         <url><loc>${url.origin}/</loc><priority>1.0</priority></url>
      </urlset>`;
      return new Response(sitemap, { headers: { "Content-Type": "application/xml" } });
    }

    // ------------------------------------------
    // 2. قسم قاعدة البيانات (Database API)
    // ------------------------------------------

    // مسار حفظ المشروع (POST)
    if (method === "POST" && url.pathname === "/deploy") {
      try {
        const data = await request.json();
        const dbKey = `${data.user_id}_${data.project_name}`;
        const payload = {
          uid: data.user_id,
          pid: data.project_name,
          code: data.code, // الكود المشفر كـ JSON
          vars: data.environment_variables || {},
          timestamp: Date.now()
        };
        await env.NAJM_DB.put(dbKey, JSON.stringify(payload));
        return new Response(JSON.stringify({ success: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // مسار جلب المشاريع للمستخدم (GET)
    if (method === "GET" && url.pathname === "/get-projects") {
      const userId = url.searchParams.get("user_id");
      try {
        const listed = await env.NAJM_DB.list({ prefix: `${userId}_` });
        const projects = [];
        for (let key of listed.keys) {
          const value = await env.NAJM_DB.get(key.name);
          if(value) {
            const p = JSON.parse(value);
            projects.push({
              name: p.pid,
              code: p.code,
              envVars: p.vars,
              url: `https://vercelseifr.vercel.app/${encodeURIComponent(p.uid)}/${encodeURIComponent(p.pid)}`
            });
          }
        }
        return new Response(JSON.stringify({ success: true, projects }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // ------------------------------------------
    // 3. قسم واجهة المستخدم (The Dashboard UI)
    // ------------------------------------------
    
    // إذا لم يكن الطلب لـ API أو SEO، نعطيه اللوحة الزرقاء (HTML)
    if (method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      // هنا تضع كود الـ HTML الاحترافي الذي طورناه في الخطوات السابقة
      const html = `<!DOCTYPE html>...كود الـ HTML الكامل هنا...`; 
      
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // رد افتراضي لأي مسار غير معروف
    return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers });
  }
};
