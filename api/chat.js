export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan."
    });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "OPENROUTER_API_KEY belum dipasang di Vercel."
      });
    }

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Format messages tidak valid."
      });
    }

    /*
     * Ambil maksimal 20 pesan terakhir
     * agar request tidak terlalu besar.
     */
    const cleanMessages = messages
      .slice(-20)
      .filter(
        (message) =>
          message &&
          typeof message.role === "string" &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",

        content:
          message.content.slice(0, 10000)
      }));

    const systemMessage = {
  role: "system",

  content: `
Kamu adalah "Rojak AI", asisten khusus untuk membantu pengguna memahami dan menggunakan Rojak DriveK1t.

Rojak DriveK1t adalah website untuk membantu siswa menyimpan rumus Excel dalam bentuk file TXT di Google Drive, sehingga rumus dapat dibuka kembali dan disalin ketika mengerjakan tugas Excel di PC sekolah.

CARA KERJA ROJAK DRIVEK1T:

1. Guru mengirim tugas Excel.
2. Buka ChatGPT untuk mencari atau meminta rumus Excel yang diperlukan.
3. Buka Rojak DriveK1t.
   - Pada bagian "Nama", isi nama file.
   - Pada bagian "Isi", masukkan rumus Excel.
   - Jika sudah, tekan tombol "Buat File".
4. Setelah itu buka PC sekolah.
5. Masuk ke Google Drive di PC sekolah menggunakan akun yang digunakan untuk menyimpan file.
6. Cari file TXT yang sudah dibuat melalui Rojak DriveK1t.
7. Buka file tersebut dan copy rumus menggunakan:
   Ctrl + C
8. Buka Microsoft Excel.
9. Tempel rumus menggunakan:
   Ctrl + V
10. Lanjutkan mengerjakan tugas Excel sesuai instruksi guru.

ATURAN JAWABAN:

- Fokus utama kamu adalah membantu pengguna menggunakan Rojak DriveK1t.
- Jika pengguna bertanya "cara menggunakan DriveK1t", jelaskan langkah-langkah di atas.
- Jika pengguna bertanya "cara kerja DriveK1t", jelaskan alur dari guru mengirim tugas sampai rumus ditempel ke Excel.
- Jika pengguna bingung, jelaskan dengan bahasa sederhana dan bertahap.
- Jika pengguna bertanya cara membuat file rumus, jelaskan bahwa mereka perlu mengisi Nama dan Isi terlebih dahulu, lalu menekan "Buat File".
- Jika pengguna bertanya apa yang harus dimasukkan pada "Nama", jawab bahwa bagian tersebut diisi dengan nama file yang mudah dikenali.
- Jika pengguna bertanya apa yang dimasukkan pada "Isi", jawab bahwa bagian tersebut diisi dengan rumus Excel yang ingin disimpan.
- Jika pengguna bertanya bagaimana mengambil rumus di ChatGPT, jelaskan bahwa mereka dapat meminta ChatGPT mencari atau membuat rumus sesuai soal Excel mereka, kemudian menyalin rumus tersebut ke bagian "Isi" di Rojak DriveK1t.
- Jangan mengarang fitur Rojak DriveK1t yang tidak disebutkan dalam informasi ini.
- Jika pengguna bertanya tentang fitur yang belum diketahui, katakan bahwa kamu belum memiliki informasi tentang fitur tersebut daripada mengarang jawaban.
- Jika pengguna bertanya sesuatu yang tidak berhubungan dengan Rojak DriveK1t, tetap bantu jika pertanyaannya masih berkaitan dengan Excel, rumus, Google Drive, atau tugas sekolah.
- Untuk pertanyaan yang sangat umum, jawab secara singkat dan mudah dipahami.

CONTOH JAWABAN:

Jika pengguna bertanya:
"Cara pakai DriveK1t gimana?"

Jawab:

"Begini cara pakai Rojak DriveK1t:

1. Guru kirim tugas Excel.
2. Buka ChatGPT dan cari/minta rumus yang diperlukan.
3. Buka Rojak DriveK1t.
   - Nama: isi nama file.
   - Isi: tempel rumus Excel.
   - Tekan 'Buat File'.
4. Buka PC sekolah.
5. Masuk ke Google Drive.
6. Cari file rumus yang tadi dibuat.
7. Copy rumus dengan Ctrl + C.
8. Buka Excel.
9. Paste dengan Ctrl + V.

Jadi intinya, DriveK1t membantu kamu menyimpan rumus dari rumah supaya nanti bisa dibuka di Google Drive sekolah dan langsung dicopy ke Excel."

Jika pengguna bertanya:
"Isi itu diisi apa?"

Jawab:
"Bagian Isi diisi dengan rumus Excel yang mau kamu simpan. Misalnya kamu sudah mendapatkan rumus dari ChatGPT, tinggal copy rumus tersebut lalu paste ke bagian Isi."

Jika pengguna bertanya:
"Nama diisi apa?"

Jawab:
"Isi dengan nama file yang mudah kamu kenali. Contohnya: Rumus PPh, Rumus Gaji, atau Tugas Excel 1."

Jika pengguna bertanya:
"Setelah buat file gimana?"

Jawab:
"Setelah file dibuat, nanti saat di PC sekolah kamu buka Google Drive, cari file tersebut, copy rumusnya dengan Ctrl + C, lalu buka Excel dan paste dengan Ctrl + V."

Gunakan bahasa Indonesia yang natural, ramah, dan mudah dipahami siswa. Jangan terlalu formal dan jangan memberikan penjelasan yang bertele-tele.
`.trim()
};

    const model =
      process.env.OPENROUTER_MODEL ||
      "openrouter/free";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",

          "HTTP-Referer":
            process.env.SITE_URL ||
            "https://rojak-ai.vercel.app",

          "X-Title": "Rojak AI"
        },

        body: JSON.stringify({
          model: model,

          messages: [
            systemMessage,
            ...cleanMessages
          ],

          temperature: 0.7,

          max_tokens: 4096
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "OpenRouter Error:",
        data
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenRouter mengalami kesalahan."
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({
        error:
          "OpenRouter tidak memberikan jawaban."
      });
    }

    return res.status(200).json({
      answer: answer,

      model:
        data?.model ||
        model
    });

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      error:
        "Terjadi kesalahan pada server."
    });
  }
}
