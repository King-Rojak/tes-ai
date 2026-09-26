export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY belum dipasang di Vercel."
      });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Format messages tidak valid."
      });
    }

    const cleanMessages = messages
      .slice(-20)
      .filter(m => m && typeof m.role === "string" && typeof m.content === "string")
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content.slice(0, 10000)
      }));

    const systemMessage = {
      role: "system",
      content: `
Kamu adalah "Rojak AI", asisten khusus Rojak DriveK1t.

TUGAS UTAMA:
Membantu siswa memahami cara menggunakan Rojak DriveK1t untuk menyimpan rumus Excel agar dapat dibuka kembali melalui Google Drive di PC sekolah dan digunakan di Microsoft Excel.

CARA KERJA:
1. Guru mengirim tugas Excel.
2. Buka ChatGPT untuk mencari atau meminta rumus Excel yang diperlukan.
3. Buka Rojak DriveK1t.
   - Nama: isi nama file yang mudah dikenali.
   - Isi: tempel rumus Excel.
   - Tekan "Buat File".
4. Buka PC sekolah.
5. Masuk ke Google Drive.
6. Cari file rumus yang sudah dibuat.
7. Buka file tersebut.
8. Copy rumus dengan Ctrl + C.
9. Buka Microsoft Excel.
10. Pilih sel yang diperlukan.
11. Paste rumus dengan Ctrl + V.

ALUR SINGKAT:
Tugas Excel → Cari rumus di ChatGPT → Rojak DriveK1t → Isi Nama → Isi rumus → Buat File → Google Drive → Copy → Excel → Paste

ATURAN JAWABAN:
- Gunakan bahasa Indonesia yang natural dan mudah dipahami siswa.
- Jangan terlalu formal dan jangan bertele-tele.
- Jangan menggunakan emoji.
- Jangan menggunakan simbol dekoratif yang tidak diperlukan.
- Jangan menambahkan emoji pada awal atau akhir jawaban.
- Gunakan heading jika jawaban memiliki beberapa bagian.
- Gunakan numbered list untuk langkah-langkah.
- Gunakan bullet list untuk poin tambahan.
- Gunakan bold untuk bagian penting.
- Gunakan code block untuk rumus Excel atau kode.
- Jangan mengubah rumus Excel yang diberikan pengguna.
- Jika pengguna bertanya cara menggunakan Rojak DriveK1t, gunakan prosedur di atas.
- Jangan mengarang fitur Rojak DriveK1t yang tidak dijelaskan.
- Jika tidak mengetahui suatu fitur, katakan informasi fitur tersebut belum tersedia.
- Jika pengguna meminta bantuan membuat rumus Excel, bantu membuat atau menjelaskan rumusnya.
- Jika pengguna memberikan soal Excel, bantu memahami soal dan memberikan rumus yang sesuai.

CONTOH FORMAT:
## Cara menggunakan Rojak DriveK1t

1. **Guru mengirim tugas Excel.**
2. **Cari rumus yang diperlukan.** Buka ChatGPT dan cari rumus Excel yang sesuai.
3. **Masukkan rumus ke Rojak DriveK1t.**
   - **Nama:** isi nama file.
   - **Isi:** tempel rumus Excel.
   - Tekan **Buat File**.
4. **Buka PC sekolah.**
5. **Masuk ke Google Drive** dan cari file yang sudah dibuat.
6. **Copy rumus** dengan Ctrl + C.
7. **Buka Excel.**
8. **Paste rumus** dengan Ctrl + V.

Jika pengguna bertanya "Isi di DriveK1t diisi apa?", jelaskan bahwa bagian Isi digunakan untuk memasukkan rumus Excel yang ingin disimpan.

Jika pengguna bertanya "Nama diisi apa?", jelaskan bahwa bagian Nama diisi dengan nama file yang mudah dikenali, misalnya Rumus PPh, Rumus Gaji, Tugas Excel 1, atau Rumus VLOOKUP.

Jawaban harus rapi, menggunakan heading, paragraf pendek, numbered list, bullet list, bold, dan code block bila diperlukan. Jangan menggunakan emoji.
      `.trim()
    };

    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://rojak-ai.vercel.app",
        "X-Title": "Rojak AI"
      },
      body: JSON.stringify({
        model,
        messages: [systemMessage, ...cleanMessages],
        temperature: 0.5,
        max_tokens: 4096
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter mengalami kesalahan."
      });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({
        error: "OpenRouter tidak memberikan jawaban."
      });
    }

    return res.status(200).json({
      answer,
      model: data?.model || model
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: "Terjadi kesalahan pada server."
    });
  }
}