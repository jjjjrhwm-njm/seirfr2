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

      // تجميع كل البيانات في كائن واحد شامل
      const payloadObject = {
        uid: user_id.toLowerCase().trim(),
        pid: project_name.trim(),
        code: code,
        vars: environment_variables || {},
        timestamp: Date.now()
      };
      
      // التشفير الآمن لتجنب تلف الرموز في تليجرام
      const payloadJson = JSON.stringify(payloadObject);
      const base64Payload = btoa(unescape(encodeURIComponent(payloadJson)));
      
      // التغليف الجذري الجديد
      const dataRecord = `===NAJM_V16_START===\n${base64Payload}\n===NAJM_V16_END===`;

      // الإرسال كـ Plain Text
      const telegramResponse = await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: dataRecord,
          disable_web_page_preview: true
        })
      });

      const telegramResult = await telegramResponse.json();
      if (!telegramResult.ok) throw new Error(telegramResult.description);

      return new Response(JSON.stringify({ success: true, message_id: telegramResult.result.message_id }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, success: false }), { status: 500, headers });
    }
  }
};
