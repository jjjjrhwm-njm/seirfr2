// Cloudflare Worker - najm-backend (آخر نسخة)
const BOT_TOKEN = "8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI";
const CHAT_ID = "@nejm_njm";

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    
    // نشر مشروع جديد
    if (request.method === "POST" && url.pathname === "/deploy") {
      try {
        const data = await request.json();
        const { user_id, project_name, code, environment_variables } = data;

        if (!user_id || !project_name || !code) {
          return new Response(JSON.stringify({
            error: "Missing required fields"
          }), { status: 400, headers });
        }

        const payloadObject = {
          code: code,
          vars: environment_variables || {},
          timestamp: Date.now(),
          version: "15.0"
        };
        const payloadJson = JSON.stringify(payloadObject);
        const base64Payload = btoa(unescape(encodeURIComponent(payloadJson)));

        const messageText = [
          `[NAJM_ID: ${user_id}]`,
          `[NAJM_PRJ: ${project_name}]`,
          `[NAJM_PAYLOAD_START]`,
          `${base64Payload}`,
          `[NAJM_PAYLOAD_END]`
        ].join('\n');

        const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: messageText,
            disable_web_page_preview: true
          })
        });

        const telegramResult = await telegramResponse.json();

        if (!telegramResult.ok) {
          throw new Error(telegramResult.description);
        }

        return new Response(JSON.stringify({
          success: true,
          message_id: telegramResult.result.message_id,
          project_url: `https://vercelseifr.vercel.app/${encodeURIComponent(user_id)}/${encodeURIComponent(project_name)}`
        }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          error: e.message,
          success: false
        }), { status: 500, headers });
      }
    }
    
    // جلب مشاريع المطور
    if (request.method === "GET" && url.pathname === "/get-projects") {
      const userId = url.searchParams.get("user_id");
      if (!userId) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers });
      }
      
      try {
        // جلب الرسائل من القناة
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allowed_updates: ["channel_post"],
            timeout: 10
          })
        });
        
        const data = await response.json();
        const projects = [];
        
        if (data.ok && data.result) {
          for (const update of data.result) {
            const message = update.channel_post;
            if (message && message.text) {
              const text = message.text;
              
              const idMatch = text.match(/\[NAJM_ID:\s*([^\]]+)\]/i);
              const prjMatch = text.match(/\[NAJM_PRJ:\s*([^\]]+)\]/i);
              const payloadMatch = text.match(/\[NAJM_PAYLOAD_START\]([\s\S]*?)\[NAJM_PAYLOAD_END\]/i);
              
              if (idMatch && prjMatch && payloadMatch) {
                const uid = idMatch[1].trim();
                const prjName = prjMatch[1].trim();
                
                if (uid === userId) {
                  try {
                    let base64Payload = payloadMatch[1].trim();
                    base64Payload = base64Payload.replace(/\s/g, '');
                    const decodedJson = atob(base64Payload);
                    const payload = JSON.parse(decodeURIComponent(escape(decodedJson)));
                    
                    projects.push({
                      name: prjName,
                      code: payload.code || "",
                      envVars: payload.vars || {},
                      url: `https://vercelseifr.vercel.app/${encodeURIComponent(userId)}/${encodeURIComponent(prjName)}`
                    });
                  } catch(e) {
                    console.log("Error parsing:", prjName);
                  }
                }
              }
            }
          }
        }
        
        projects.reverse();
        
        return new Response(JSON.stringify({
          success: true,
          projects: projects
        }), { headers });
        
      } catch (e) {
        return new Response(JSON.stringify({
          error: e.message,
          success: false,
          projects: []
        }), { status: 500, headers });
      }
    }
    
    return new Response("Not Found", { status: 404, headers });
  }
};
