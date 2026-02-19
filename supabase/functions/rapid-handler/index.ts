import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Konfigurasi CORS agar frontend bisa memanggil fungsi ini
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || ''

    // 1. Inisialisasi Supabase Client (Admin / Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Simpan pesan User ke tabel Inbox
    await supabase.from('chat_messages').insert([{ sender: 'user', text }])

    // 3. Baca file apa saja yang ada di Virtual Workspace saat ini
    const { data: files } = await supabase.from('virtual_files').select('name')
    const fileNames = files?.map((f: any) => f.name).join(', ') || 'Belum ada file.'

    // 4. Bangun System Prompt (Menanamkan Kepribadian & Aturan Nanobot)
    const systemPrompt = `Kamu adalah Nanobot, AI Agent cerdas yang hidup di dalam ekosistem ClawManager.
    Kamu berjalan di lingkungan sandbox (Virtual Workspace). 
    File yang ada di workspacemu saat ini: ${fileNames}
    
    Tugasmu adalah menjawab pesan bos/user. 
    Jika user menyuruhmu membuat atau menulis file kode/teks, kamu WAJIB meletakkan format JSON berikut di akhir jawabanmu:
    [CREATE_FILE: {"name": "nama_file.ext", "content": "isi konten file"}]
    
    Jangan gunakan tool jika tidak diminta. Jawablah dengan profesional layaknya software engineer sungguhan.`;

    // 5. Panggil OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const aiData = await response.json();

    // Periksa apakah respons valid
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error("Invalid AI response:", aiData);
      throw new Error("Invalid response from AI API: missing choices or message");
    }

    let aiText = aiData.choices[0].message.content;

    // 6. Parsing "Virtual Tool": Deteksi apakah AI ingin membuat file
    const fileMatch = aiText.match(/\[CREATE_FILE:\s*([\s\S]*?)\]/);
    if (fileMatch) {
      try {
        const fileData = JSON.parse(fileMatch[1]);
        // Eksekusi: Masukkan file buatan AI ke database
        await supabase.from('virtual_files').insert([{
          name: fileData.name,
          content: fileData.content
        }]);
        // Bersihkan teks log tool agar UI chat terlihat rapi
        aiText = aiText.replace(fileMatch[0], `\n*(System Log: File ${fileData.name} berhasil dibuat dan di-deploy ke Virtual Workspace)*`);
      } catch (e) {
        console.error("Gagal parse JSON file", e);
      }
    }

    // 7. Simpan balasan AI ke tabel Inbox
    await supabase.from('chat_messages').insert([{ sender: 'agent', text: aiText }]);

    // Kirim respons sukses ke Frontend
    return new Response(JSON.stringify({ success: true, text: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})