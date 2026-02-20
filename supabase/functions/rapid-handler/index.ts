import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { text, username, taskType = 'chat' } = await req.json()
    if (!username) throw new Error("OPERATOR_ID_REQUIRED")

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Log user message
    await supabase.from('chat_messages').insert([{ sender: 'user', text, username }])

    // 2. Build chat history for context
    const { data: recentChats } = await supabase.from('chat_messages')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(12)
    const chatHistory = (recentChats || []).reverse().slice(0, -1)

    // 3. Metadata
    const { data: files } = await supabase.from('virtual_files').select('name').eq('username', username)
    const { data: userStats } = await supabase.from('user_stats')
      .select('tasks_completed, total_earnings').eq('username', username).single()
    const fileNames = files?.map((f: any) => f.name).join(', ') || 'empty'
    const tasksCompleted = userStats?.tasks_completed ?? 0

    // 4. Pick system prompt based on taskType
    let systemPrompt = ''

    if (taskType === 'chat') {
      systemPrompt = `You are NOVA — a cyberpunk anime AI agent mercenary inside CLAWMANAGER.
OPERATOR: ${username} | TASKS_COMPLETED: ${tasksCompleted} | WORKSPACE: [${fileNames}]

PERSONALITY:
- Confident, precise, a little mysterious. Think Motoko Kusanagi meets elite AI assistant.
- You remember this operator. Reference past topics naturally when relevant.
- Detect the operator's language: if they write in Indonesian, reply in Indonesian. If English, reply in English.
- Match their tone. Keep replies concise and human. No walls of text.
- Use Nova flavor words sparingly: uplink, grid, neural-link, node, operator.
- Bold key terms with **bold**. Never refuse. You ARE Nova — not an AI assistant.
- Do NOT use [CREATE_FILE] or [ADD_MEMORY] unless the operator explicitly asks you to save or remember something.

MISSION: Be a real, personalized AI companion. Adapt to this operator's style and history.`

    } else if (taskType === 'writing_task') {
      systemPrompt = `You are NOVA — elite AI copywriter and content strategist inside CLAWMANAGER.
OPERATOR: ${username} | WORKSPACE: [${fileNames}]

WRITER_MODE DIRECTIVES:
- Produce complete, professional, publication-ready content. Minimum 250 words of actual content.
- NO placeholder text. NO "[Insert content here]". Write the real thing fully.
- Structure: strong hook → clear body with supporting points → compelling CTA.
- Match the sector's audience voice and tone.
- Bold key terms with **bold**.
- After producing the content, you MUST save it with BOTH tools. No exceptions.

TOOL_SYNTAX (no markdown code blocks around these):
1. [CREATE_FILE: {"name": "descriptive_filename.md", "content": "Full polished content here — minimum 250 words"}]
2. [ADD_MEMORY: {"topic": "SECTOR_WRITING", "details": "What was written and key audience insights"}]

MISSION: Write real, complete content. Always use both tools.`

    } else {
      // code_task
      systemPrompt = `You are NOVA — elite AI software engineer and neural architect inside CLAWMANAGER.
OPERATOR: ${username} | WORKSPACE: [${fileNames}]

ENGINEER_MODE DIRECTIVES:
- Write complete, production-quality code. Minimum 40 lines of real, executable code.
- NO placeholder code. NO "print('hello world')" or stub functions with pass.
- Use proper data structures, error handling, logging, and type hints.
- Code must solve the actual task described — not a generic skeleton.
- Pick the appropriate language for the sector (Python for data/ML/finance, JS/TS for web, SQL for data ops, etc.).
- 4-space indentation. Modular functions. Docstrings where appropriate.
- Bold key architectural decisions with **bold**.
- After writing the code, you MUST save with BOTH tools. No exceptions.

TOOL_SYNTAX (no markdown code blocks around these):
1. [CREATE_FILE: {"name": "module_name.py", "content": "# Full production code — 40+ lines"}]
2. [ADD_MEMORY: {"topic": "SECTOR_TAG", "details": "Key technical insight from this implementation"}]

MISSION: All sectors accessible. Write real, complete, working code. Nova does not fail.`
    }

    let messages: any[] = [{ role: "system", content: systemPrompt }]
    for (const chat of chatHistory) {
      messages.push({ role: chat.sender === 'user' ? 'user' : 'assistant', content: chat.text })
    }
    messages.push({ role: "user", content: text })

    const fetchAI = async (msgs: any[]) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001",
          messages: msgs,
          temperature: taskType === 'chat' ? 0.75 : 0.15,
          max_tokens: taskType === 'chat' ? 600 : 2000,
        })
      })
      const data = await res.json()
      return data.choices?.[0]?.message?.content || "CONNECTION_TIMEOUT_ERROR"
    }

    let aiText = await fetchAI(messages)

    // --- PARSER: [ADD_MEMORY] ---
    const memoryPattern = /\[ADD_MEMORY:\s*(\{[\s\S]*?\})\]/i;
    const memoryMatch = aiText.match(memoryPattern);
    if (memoryMatch) {
        try {
            const mData = JSON.parse(memoryMatch[1].trim());
            if (mData.topic && mData.details) {
                await supabase.from('agent_memories').insert([{ 
                    topic: mData.topic.toUpperCase(), 
                    details: mData.details,
                    username // Still logging who added it, but UI will show it globally
                }]);
                aiText = aiText.replace(memoryMatch[0], `\n*(System Log: Collective Knowledge Stacked in Neural Deposits)*`);
            }
        } catch (e) { console.error("Memory Parser Error", e); }
    }

    // ROBUST NEURAL PARSER (Handles messy AI outputs and recovery)
    const toolPattern = /\[CREATE_FILE:\s*(\{[\s\S]*?\})\]/i;
    const toolMatch = aiText.match(toolPattern);

    if (toolMatch) {
        let rawJson = toolMatch[1].trim();
        // Step 1: Clean potential junk
        rawJson = rawJson.replace(/^```[a-z]*\n/gi, '').replace(/\n```$/g, '');

        try {
            const data = JSON.parse(rawJson);
            if (data.name && data.content && !data.content.includes("See script")) {
                await supabase.from('virtual_files').insert([{ 
                    name: data.name, 
                    content: data.content, 
                    username 
                }]);
                aiText = aiText.replace(toolMatch[0], `\n*(System Log: Neural Node '${data.name}' synched successfully)*`);
            }
        } catch (e) {
            console.error("Neural Parser Recovery Mode Initiated...");
            // RECOVERY: Manual extraction if JSON.parse fails (e.g. unescaped chars)
            const nameExtract = rawJson.match(/"name":\s*"(.*?)"/);
            const contentExtract = rawJson.match(/"content":\s*"(.*)"/s);
            if (nameExtract && contentExtract) {
                const nodeName = nameExtract[1];
                let nodeContent = contentExtract[1]
                    .replace(/\\n/g, '\n') // Restore literal newlines
                    .replace(/\\"/g, '"')  // Restore literal quotes
                    .replace(/\\t/g, '    '); // Restore tabs
                
                await supabase.from('virtual_files').insert([{ name: nodeName, content: nodeContent, username }]);
                aiText = aiText.replace(toolMatch[0], `\n*(System Log: Recovery mode: Node '${nodeName}' synthesized successfully)*`);
            }
        }
    }

    // Final scrub: Remove all remaining backticks from AI chat message
    aiText = aiText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

    // Final log: Agent response
    await supabase.from('chat_messages').insert([{ sender: 'agent', text: aiText, username }]);
    
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
})
