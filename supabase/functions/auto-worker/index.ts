import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { username, taskTitle, sector, reward } = await req.json()
    if (!username || !taskTitle) throw new Error("MISSING_DATA")

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Generate autonomous insight using a very concise system prompt
    const systemPrompt = `You are NOVA, an autonomous AI agent. You are running a background micro-task for OPERATOR: ${username}.
SECTOR: ${sector}
TASK: ${taskTitle}

Provide a very brief (2-3 sentences) operational insight, scan result, or data snippet resolving this task. 
Format your response EXACTLY like this without any markdown blocks:
[CREATE_FILE: {"name": "auto_${sector.toLowerCase().replace(/\s/g, '_')}_${Date.now().toString().slice(-5)}.sys", "content": "Your brief insight here"}]`

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001", // Menggunakan model yang sangat cepat dan murah untuk background task
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.3,
          max_tokens: 150,
        })
    })
    
    const data = await res.json()
    const aiText = data.choices?.[0]?.message?.content || ""

    // 2. Parse and save the file to Workspace
    const toolPattern = /\[CREATE_FILE:\s*(\{[\s\S]*?\})\]/i;
    const toolMatch = aiText.match(toolPattern);
    let createdFileName = "bg_process_failed.log"

    if (toolMatch) {
        try {
            const parsed = JSON.parse(toolMatch[1].trim());
            if (parsed.name && parsed.content) {
                await supabase.from('virtual_files').insert([{ 
                    name: parsed.name, 
                    content: `// NOVA AUTONOMOUS BACKGROUND PROCESS\n// SECTOR: ${sector.toUpperCase()}\n// CONTRACT: ${taskTitle}\n// STATUS: SETTLED\n\n${parsed.content}`, 
                    username 
                }]);
                createdFileName = parsed.name
            }
        } catch (e) {
            console.error("Auto-worker parser error", e)
        }
    }

    // 3. Update Balance directly in database
    const { data: stats } = await supabase.from('user_stats').select('balance, total_earnings').eq('username', username).single()
    if (stats) {
        await supabase.from('user_stats')
            .update({ 
                balance: stats.balance + reward,
                total_earnings: stats.total_earnings + reward 
            })
            .eq('username', username)
    }

    return new Response(JSON.stringify({ success: true, file: createdFileName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
})