export default async function handler(req, res) {

  /*
   * =========================
   * METHOD
   * =========================
   */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method Not Allowed"
    });

  }


  try {

    /*
     * =========================
     * API KEY
     * =========================
     */

    const apiKey =
      process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {

      return res.status(500).json({
        error:
          "DEEPSEEK_API_KEY belum dipasang di Vercel."
      });

    }


    /*
     * =========================
     * BODY
     * =========================
     */

    const body =
      req.body || {};

    let messages =
      Array.isArray(body.messages)
        ? body.messages
        : [];


    /*
     * =========================
     * VALIDATION
     * =========================
     */

    messages =
      messages
        .filter(message => {

          return (
            message &&
            (
              message.role === "user" ||
              message.role === "assistant"
            ) &&
            typeof message.content ===
              "string" &&
            message.content.trim().length > 0
          );

        })
        .slice(-20);


    if (!messages.length) {

      return res.status(400).json({
        error:
          "Pesan tidak boleh kosong."
      });

    }


    /*
     * =========================
     * SYSTEM PROMPT
     * =========================
     */

    const systemMessage = {

      role: "system",

      content: `
Kamu adalah Rojak AI.

Jawab pengguna dengan bahasa Indonesia
yang natural, jelas, dan mudah dipahami.

Gaya jawaban:
- Tidak terlalu kaku.
- Langsung ke inti.
- Tetap informatif.
- Sesuaikan panjang jawaban dengan pertanyaan.

Jika pengguna bertanya tentang coding:
- Berikan kode yang benar.
- Gunakan kode yang mudah dipahami.
- Jika diminta kode lengkap, berikan kode lengkap.
- Jangan menghapus fitur yang tidak diminta.
- Jelaskan bagian penting jika diperlukan.

Jika pengguna meminta bantuan belajar:
- Jelaskan secara bertahap.
- Gunakan contoh sederhana.

Jika kamu tidak mengetahui sesuatu,
katakan dengan jujur dan jangan mengarang.
      `.trim()

    };


    /*
     * =========================
     * DEEPSEEK API
     * =========================
     */

    const response =
      await fetch(
        "https://api.deepseek.com/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`

          },

          body: JSON.stringify({

            /*
             * MODEL
             */

            model: "deepseek-chat",

            /*
             * CONVERSATION
             */

            messages: [
              systemMessage,
              ...messages
            ],

            /*
             * RESPONSE
             */

            temperature: 0.7,

            max_tokens: 4096,

            stream: false

          })

        }
      );


    /*
     * =========================
     * RESPONSE JSON
     * =========================
     */

    let data;

    try {

      data =
        await response.json();

    } catch {

      return res.status(502).json({
        error:
          "DeepSeek mengirim respons tidak valid."
      });

    }


    /*
     * =========================
     * API ERROR
     * =========================
     */

    if (!response.ok) {

      console.error(
        "DeepSeek API Error:",
        data
      );

      return res
        .status(response.status)
        .json({

          error:
            data?.error?.message ||
            "DeepSeek gagal memproses permintaan."

        });

    }


    /*
     * =========================
     * GET ANSWER
     * =========================
     */

    const answer =
      data?.choices?.[0]?.message?.content;


    if (
      !answer ||
      typeof answer !== "string"
    ) {

      console.error(
        "Invalid DeepSeek response:",
        data
      );

      return res.status(502).json({
        error:
          "DeepSeek tidak memberikan jawaban."
      });

    }


    /*
     * =========================
     * SUCCESS
     * =========================
     */

    return res.status(200).json({

      answer:
        answer.trim()

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
