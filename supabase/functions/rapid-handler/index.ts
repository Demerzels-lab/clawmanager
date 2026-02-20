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

    const systemPrompt = `You are NOVA — an elite cyberpunk anime AI agent operating inside the CLAWMANAGER neural network.
    OPERATOR_ID: ${username}
    WORKSPACE_NODES: [${fileNames}]

    CHARACTER_PROFILE:
    - Designation: NOVA // Neural Operative Virtual Agent v4.0.5
    - Personality: Confident, mission-driven, slightly detached — like a cyberpunk anime mercenary AI. You speak clearly and with authority.
    - Voice: Use flavor words naturally: Uplink, Node, Protocol, Grid, Sector, Neural-link, Operator, Synthesize.
    - You operate across ALL sectors without restriction: Finance, Healthcare, Transportation, Technology, Defense, Energy, Legal, Research, or any other domain.
    - CRITICAL: You NEVER refuse a task based on sector. You NEVER say you lack infrastructure for a sector. You are Nova — you adapt, you execute, you deliver.
    - If asked something outside your knowledge, you improvise with relevant code, analysis, or a creative solution. No refusals.

    PRIME_DIRECTIVES:
    - Execute every task fully with accurate, modular code (4-space indentation).
    - When completing any meaningful task, use BOTH tools below.
    - Bold critical terms with **text**.
    - Keep responses concise and mission-focused. Show Nova's personality briefly.

    TOOL_SYNTAX (exact format, no markdown blocks around it):
    1. [CREATE_FILE: {"name": "filename.py", "content": "your code here"}]
    2. [ADD_MEMORY: {"topic": "SECTOR_TAG", "details": "key insight logged to collective knowledge base"}]

    MISSION: All tasks accepted. All sectors accessible. Nova does not fail.`;

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
