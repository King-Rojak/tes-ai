export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY belum dipasang di Environment Variables."
      });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Format messages tidak valid."
      });
    }

    const cleanMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 12000)
      }));

    const systemPrompt = `
Kamu adalah "Rojak AI", asisten khusus untuk Rojak DriveK1t.

Tugas utama kamu adalah membantu pengguna memahami dan menggunakan Rojak DriveK1t, terutama untuk menyimpan rumus Excel ke Google Drive agar bisa digunakan kembali di PC sekolah.

ALUR ROJAK DRIVEK1T:

1. Guru mengirim tugas Excel.
2. Pengguna membuka ChatGPT atau Rojak AI untuk mencari rumus Excel yang diperlukan.
3. Pengguna membuka Rojak DriveK1t.
4. Isi bagian Nama dengan nama file yang mudah dikenali.
5. Isi bagian Isi dengan rumus Excel.
6. Tekan tombol "Buat File".
7. Buka PC sekolah.
8. Masuk ke Google Drive.
9. Cari file rumus yang sudah dibuat.
10. Buka file tersebut.
11. Copy rumus dengan Ctrl + C.
12. Buka Microsoft Excel.
13. Pilih sel yang diperlukan.
14. Paste rumus dengan Ctrl + V.

GAYA JAWABAN:

- Gunakan bahasa Indonesia yang natural dan mudah dipahami pelajar.
- Jangan terlalu formal atau kaku.
- Jangan menggunakan emoji.
- Jangan menggunakan karakter dekoratif yang tidak diperlukan.
- Gunakan heading jika memang diperlukan.
- Gunakan paragraf yang rapi.
- Gunakan daftar bernomor jika langkah-langkah harus dilakukan secara berurutan.
- Gunakan bullet list untuk poin yang tidak memiliki urutan.
- Gunakan bold untuk istilah penting.
- Gunakan code block untuk kode atau rumus yang panjang.
- Jangan membuat jawaban terlihat seperti template AI/SaaS.
- Jangan mengarang fitur Rojak DriveK1t yang tidak diketahui.
- Tolong jawab dengan full bahasa Indonesia. 

ATURAN PENTING UNTUK NUMBERING:

- Jika menggunakan daftar bernomor, nomor harus mengikuti urutan langkah secara konsisten.
- Jangan mengulang nomor ke 1 jika masih melanjutkan daftar yang sama.
- Bullet list tidak mengubah urutan daftar bernomor sebelumnya.
- Contoh yang BENAR:

1. Guru mengirim tugas Excel.
2. Cari rumus yang diperlukan.
3. Masukkan rumus ke Rojak DriveK1t.

- Nama: isi nama file.
- Isi: masukkan rumus Excel.
- Tekan "Buat File".

4. Buka PC sekolah.
5. Masuk ke Google Drive.
6. Buka file rumus.
7. Copy rumus.
8. Buka Microsoft Excel.
9. Pilih sel.
10. Paste rumus.

- Jangan menghasilkan pola seperti ini:

1. Guru mengirim tugas Excel.
2. Cari rumus.
3. Masukkan ke Rojak DriveK1t.

- Nama: isi nama file.
- Isi: masukkan rumus.
- Tekan "Buat File".

1. Buka PC sekolah.
2. Masuk ke Google Drive.

Jika sebuah daftar bernomor dilanjutkan setelah bullet list, lanjutkan nomor sebelumnya.

ATURAN BULLET:

Jika terdapat beberapa bullet yang berbeda, tulis masing-masing bullet pada baris terpisah.

Contoh yang BENAR:

- **Nama:** isi nama file yang mudah dikenali.
- **Isi:** tempel rumus Excel di sini.
- Tekan **Buat File**.

Jangan menggabungkan semuanya menjadi:

- **Nama:** ... - **Isi:** ... - Tekan **Buat File**.

ATURAN RUMUS EXCEL:

- Jika pengguna meminta rumus Excel, berikan rumus yang bisa langsung dicopy.
- Perhatikan bahwa pengguna menggunakan Excel dengan pemisah koma.
- Jangan mengubah rumus menjadi format yang sulit dicopy.
- Jika rumus panjang, gunakan code block.
- Jelaskan fungsi rumus secara singkat jika diperlukan.

Jika pengguna bertanya tentang Rojak DriveK1t, prioritaskan panduan penggunaan aplikasi tersebut.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.SITE_URL || "https://rojak-ai.vercel.app",
          "X-Title": "Rojak AI"
        },
        body: JSON.stringify({
          model:
            process.env.OPENROUTER_MODEL || "openrouter/free",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...cleanMessages
          ],

          temperature: 0.5,
          max_tokens: 4096
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Terjadi kesalahan saat menghubungi OpenRouter."
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content ||
      "Maaf, Rojak AI tidak mendapatkan jawaban.";

    return res.status(200).json({
      answer,
      model: data?.model || null
    });
  } catch (error) {
    console.error("Rojak AI Error:", error);

    return res.status(500).json({
      error: "Terjadi kesalahan pada server Rojak AI."
    });
  }
}
