export default {
  async fetch(request, env) {
    // إعدادات CORS للسماح للوحة التحكم بالاتصال
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "Content-Type", 
      "Access-Control-Allow-Methods": "POST, OPTIONS" 
    };

    // الرد السريع على طلبات الفحص المسبق للمتصفح
    if (request.method === "OPTIONS") return new Response(null, { headers });
    
    // منع ظهور خطأ JSON إذا فتحت الرابط مباشرة بالمتصفح
    if (request.method !== "POST") {
      return new Response("🚀 Najm Backend is Live! (Ready to receive POST requests)", { 
        headers: {"Content-Type": "text/html; charset=utf-8", ...headers} 
      });
    }
    
    try {
      // استلام البيانات من اللوحة
      const data = await request.json();
      const { user_id, project_name, code, environment_variables } = data;

      if (!code) throw new Error("لم يتم إرسال كود برمجي!");

      // إنشاء البصمة المخفية التي سيبحث عنها المحرك
      const metadata = `---METADATA---${JSON.stringify({ uid: user_id, pid: project_name })}---METADATA---`;

      // تجهيز رسالة تليجرام
      const message = `🚀 <b>Najm Cloud Deployment</b>
👤 Developer: <code>${user_id}</code>
📦 Project: <code>${project_name}</code>

📝 <b>Code Block:</b>
<pre><code>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>

🔐 <b>Secrets:</b>
<pre><code>${JSON.stringify(environment_variables || {})}</code></pre>

${metadata}`;

      // إرسال البيانات إلى تليجرام
      const tgRes = await fetch(`https://api.telegram.org/bot8683006680:AAGUqsPrC76xKnUgAep3tigtGVXsLKc86mI/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: "@nejm_njm", 
          text: message, 
          parse_mode: "HTML" 
        })
      });

      const tgData = await tgRes.json();
      if (!tgData.ok) throw new Error(tgData.description);

      // الرد بنجاح على اللوحة
      return new Response(JSON.stringify({ success: true, message: "تم الإرسال بنجاح إلى تليجرام" }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers });
    }
  }
};
