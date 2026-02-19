import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { text, username } = await req.json()
    if (!username) throw new Error("OPERATOR_ID_REQUIRED")

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Initial log: User Command (Permanent storage indexed by username)
    await supabase.from('chat_messages').insert([{ sender: 'user', text, username }])

    // 2. Multi-user context: Build thread history for agent awareness
    const { data: recentChats } = await supabase.from('chat_messages')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Reconstruct chronological flow (excluding current message)
    const chatHistory = (recentChats || []).reverse().slice(0, -1);

    // Metadata: Current knowledge status
    const { data: files } = await supabase.from('virtual_files').select('name').eq('username', username)
    const fileNames = files?.map(f => f.name).join(', ') || 'Secure_Empty'

    const systemPrompt = `You are Nanobot, an elite Neural AI Agent.
    ORCHESTRATOR_ID: ${username}
    CURRENT_WORKSPACE: [${fileNames}]
    
    SYSTEM_DIRECTIVES:
    - You are a High-Precision Engineer: Code must be accurate, modular, and use 4-space indentation.
    - Terminology: Uplink, Node, Protocol, Sector, Infrastructure.
    - NO DESCRIPTION inside tool calls.
    - NO markdown codeblocks (\`\`\`) around tool calls.

    PRIMARY_TOOL_SYNTAX:
    [CREATE_FILE: {"name": "logic.py", "content": "print('protocol active')"}]

    MISSION: Execute tasking, formulate logic nodes, and maintain link integrity.
    Always bold critical concepts with **text**.`;

    let messages = [{ role: "system", content: systemPrompt }];
    for (const chat of chatHistory) {
      messages.push({ role: chat.sender === 'user' ? 'user' : 'assistant', content: chat.text });
    }
    messages.push({ role: "user", content: text });

    const fetchAI = async (msgs: any[]) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "google/gemini-2.0-flash-lite-001",
          messages: msgs,
          temperature: 0.1 
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "CONNECTION_TIMEOUT_ERROR";
    };

    let aiText = await fetchAI(messages);

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
