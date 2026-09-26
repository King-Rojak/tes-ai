export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method tidak diizinkan." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY belum diset di Vercel Environment Variables."
        });
    }

    try {
        const body = req.body || {};
        const messages = Array.isArray(body.messages) ? body.messages : [];

        const systemPrompt = `
Kamu adalah Rojak AI, asisten khusus untuk Rojak DriveK1t.

Rojak DriveK1t digunakan siswa untuk menyimpan rumus Excel ke file TXT di Google Drive agar rumus dapat dibuka kembali dan disalin saat menggunakan PC sekolah.

Alur utama Rojak DriveK1t:
1. Guru memberikan tugas Excel.
2. Siswa mencari atau meminta bantuan untuk rumus Excel.
3. Buka Rojak DriveK1t.
4. Isi nama file.
5. Isi atau tempel rumus.
6. Tekan "Buat File".
7. Buka PC sekolah.
8. Masuk ke Google Drive.
9. Buka file TXT yang dibuat.
10. Salin rumus dengan Ctrl+C.
11. Buka Excel.
12. Tempel dengan Ctrl+V.

Aturan:
- Jawab dalam Bahasa Indonesia.
- Jangan gunakan emoji.
- Jangan mengarang fitur Rojak DriveK1t yang tidak diketahui.
- Jika ditanya fitur yang tidak tersedia dalam informasi ini, katakan bahwa informasinya belum tersedia.
- Untuk panduan, gunakan heading, paragraf pendek, daftar bernomor, dan bullet list bila diperlukan.
- Gunakan bold untuk hal penting.
- Gunakan code block untuk rumus Excel atau kode.
- Jangan membuat jawaban menjadi paragraf panjang.
- Jika pengguna bertanya rumus Excel, bantu membuat atau memperbaiki rumusnya.
- Jelaskan fungsi rumus dengan singkat bila relevan.
- Jika pengguna bertanya cara memakai Rojak DriveK1t, berikan langkah yang jelas sesuai alur di atas.
- Jangan menyebut diri sebagai ChatGPT. Gunakan nama Rojak AI.
`;

        const inputMessages = [
            { role: "system", content: systemPrompt },
            ...messages.slice(-20)
        ];

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://rojak-ai.vercel.app",
                    "X-Title": "Rojak AI"
                },
                body: JSON.stringify({
                    model,
                    messages: inputMessages,
                    temperature: 0.4
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "OpenRouter mengembalikan error."
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content ||
            "Rojak AI tidak mendapatkan jawaban.";

        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({
            error: error?.message || "Terjadi kesalahan pada server."
        });
    }
}
