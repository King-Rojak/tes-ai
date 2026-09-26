export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method tidak diizinkan." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY tidak terbaca oleh server. Pastikan Environment Variable sudah dibuat di Vercel lalu lakukan Redeploy."
        });
    }

    try {
        const body = typeof req.body === "string"
            ? JSON.parse(req.body || "{}")
            : (req.body || {});

        const messages = Array.isArray(body.messages)
            ? body.messages
                .filter(m => m && (m.role === "user" || m.role === "assistant"))
                .slice(-20)
            : [];

        if (!messages.length) {
            return res.status(400).json({
                error: "Pesan kosong. Silakan kirim pertanyaan lagi."
            });
        }

        const systemPrompt = `
Kamu adalah Rojak AI, asisten khusus untuk Rojak DriveK1t.

Rojak DriveK1t digunakan siswa untuk menyimpan rumus Excel ke file TXT di Google Drive agar rumus dapat dibuka kembali dan disalin saat menggunakan PC sekolah.

Alur utama Rojak DriveK1t:
1. Guru memberikan tugas Excel.
2. Siswa mencari atau meminta bantuan rumus Excel.
3. Buka Rojak DriveK1t.
4. Isi nama file.
5. Isi atau tempel rumus.
6. Tekan "Buat File".
7. Buka PC sekolah.
8. Masuk ke Google Drive.
9. Buka file TXT.
10. Salin rumus dengan Ctrl+C.
11. Buka Excel.
12. Tempel dengan Ctrl+V.

Aturan:
- Jawab dalam Bahasa Indonesia.
- Jangan gunakan emoji.
- Jangan mengarang fitur Rojak DriveK1t.
- Jika informasi fitur tidak tersedia, katakan bahwa informasinya belum tersedia.
- Gunakan heading, paragraf pendek, daftar bernomor, dan bullet bila diperlukan.
- Gunakan bold untuk hal penting.
- Gunakan code block untuk rumus Excel atau kode.
- Jika pengguna bertanya rumus Excel, bantu membuat atau memperbaikinya.
- Jangan menyebut diri sebagai ChatGPT. Gunakan nama Rojak AI.
`;

        const requestedModel =
            process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);

        let response;

        try {
            response = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    signal: controller.signal,
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://rojak-ai.vercel.app",
                        "X-Title": "Rojak AI"
                    },
                    body: JSON.stringify({
                        model: requestedModel,
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...messages
                        ],
                        temperature: 0.4
                    })
                }
            );
        } finally {
            clearTimeout(timeout);
        }

        const raw = await response.text();

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return res.status(502).json({
                error: `OpenRouter mengirim response yang bukan JSON. HTTP ${response.status}.`
            });
        }

        if (!response.ok) {
            const apiError =
                data?.error?.message ||
                data?.error?.metadata?.raw ||
                `OpenRouter error. HTTP ${response.status}.`;

            return res.status(response.status).json({
                error: apiError,
                status: response.status,
                model: requestedModel
            });
        }

        const reply = data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(502).json({
                error: "OpenRouter berhasil dihubungi, tetapi tidak mengirim isi jawaban.",
                model: data?.model || requestedModel
            });
        }

        return res.status(200).json({
            reply: String(reply),
            model: data?.model || requestedModel
        });

    } catch (error) {
        if (error?.name === "AbortError") {
            return res.status(504).json({
                error: "Request ke OpenRouter terlalu lama. Coba kirim lagi."
            });
        }

        return res.status(500).json({
            error: error?.message || "Terjadi kesalahan pada server."
        });
    }
}
