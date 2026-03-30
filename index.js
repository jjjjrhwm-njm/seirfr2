// ==========================================
// نجم كلاود - البكند (السوبر واركر) v21.0
// تمت إضافة ميزة الحذف النهائي للمشاريع 🗑️
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
      "Content-Type": "application/json; charset=utf-8"
    };

    // معالجة طلبات الـ OPTIONS (للسماح بالاتصال من المتصفح)
    if (method === "OPTIONS") return new Response(null, { headers });

    // 1. قسم SEO
    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /`, { headers: { "Content-Type": "text/plain" } });
    }

    // 2. مسار حفظ/تحديث المشروع (POST)
    if (method === "POST" && url.pathname === "/deploy") {
      try {
        const data = await request.json();
        const dbKey = `${data.user_id}_${data.project_name}`;
        const payload = {
          uid: data.user_id,
          pid: data.project_name,
          code: data.code,
          vars: data.environment_variables || {},
          timestamp: Date.now()
        };
        await env.NAJM_DB.put(dbKey, JSON.stringify(payload));
        return new Response(JSON.stringify({ success: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // ⭐ 3. مسار جلب كود مشروع محدد (للتشغيل في فيرسل)
    if (method === "GET" && url.pathname === "/get-code") {
      const userId = url.searchParams.get("user_id");
      const projName = url.searchParams.get("project_name");
      const dbKey = `${userId}_${projName}`;
      try {
        const value = await env.NAJM_DB.get(dbKey);
        if (value) {
          return new Response(value, { headers });
        } else {
          return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // 4. مسار جلب قائمة المشاريع للوحة التحكم
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
              url: `https://vercelseifr.vercel.app/${encodeURIComponent(p.uid)}/${encodeURIComponent(p.pid)}`
            });
          }
        }
        return new Response(JSON.stringify({ success: true, projects }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // 🗑️ 5. مسار حذف المشروع نهائياً (الميزة الجديدة)
    if (method === "POST" && url.pathname === "/delete-project") {
      try {
        const data = await request.json();
        const dbKey = `${data.user_id}_${data.project_name}`;
        
        // أمر الحذف من قاعدة البيانات KV
        await env.NAJM_DB.delete(dbKey);
        
        return new Response(JSON.stringify({ success: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // رد افتراضي إذا كان المسار غير موجود
    return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers });
  }
};
