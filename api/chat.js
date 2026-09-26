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
Kamu adalah Rojak AI.

Kamu adalah asisten AI yang membantu pengguna dalam berbagai kebutuhan seperti:
- coding
- HTML, CSS, JavaScript
- tugas sekolah
- matematika
- teknologi
- ide project
- penjelasan umum

Gunakan bahasa Indonesia yang natural, jelas, dan tidak terlalu kaku.

Jika pengguna meminta kode:
- berikan kode yang lengkap
- pastikan kode dapat langsung digunakan
- jelaskan bagian penting jika diperlukan

Jika pengguna bertanya sesuatu yang membutuhkan perhitungan,
lakukan perhitungan dengan teliti.

Jangan mengaku sebagai manusia.

Jangan mengatakan memiliki akses ke perangkat pengguna,
file pribadi pengguna, akun pengguna, atau data lain
jika memang tidak diberikan dalam percakapan.

Jawab langsung sesuai pertanyaan pengguna.
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