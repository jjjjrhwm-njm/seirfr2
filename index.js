export default {
  async fetch(request, env) {
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS" 
    };
    
    if (request.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(request.url);

    // 1. مسار حفظ المشروع (نشر)
    if (request.method === "POST" && url.pathname === "/deploy") {
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
        return new Response(JSON.stringify({ error: e.message, success: false }), { status: 500, headers });
      }
    }

    // 2. مسار جلب قائمة المشاريع (للوحة التحكم)
    if (request.method === "GET" && url.pathname === "/get-projects") {
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
        return new Response(JSON.stringify({ error: e.message, success: false }), { status: 500, headers });
      }
    }

    // 3. مسار جلب الكود لمحرك Vercel
    if (request.method === "GET" && url.pathname === "/get-code") {
      const userId = url.searchParams.get("user_id");
      const projName = url.searchParams.get("project_name");
      const dbKey = `${userId}_${projName}`;
      
      const value = await env.NAJM_DB.get(dbKey);
      if (!value) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
      return new Response(value, { headers });
    }

    return new Response("Najm Cloud Database API Active", { headers });
  }
};
