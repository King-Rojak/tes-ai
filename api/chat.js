export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method tidak diizinkan."
        });

    }


    try {

        const apiKey =
            process.env.OPENROUTER_API_KEY;


        if (!apiKey) {

            return res.status(500).json({
                error:
                    "OPENROUTER_API_KEY belum dipasang di Vercel."
            });

        }


        const { messages } =
            req.body || {};


        if (!Array.isArray(messages)) {

            return res.status(400).json({
                error:
                    "Format messages tidak valid."
            });

        }


        /*
         * Hanya mengambil 20 pesan terakhir.
         */

        const cleanMessages =
            messages
                .slice(-20)
                .filter(message => {

                    return (
                        message &&
                        typeof message.role === "string" &&
                        typeof message.content === "string"
                    );

                })
                .map(message => {

                    return {

                        role:
                            message.role === "assistant"
                                ? "assistant"
                                : "user",

                        content:
                            message.content
                                .slice(0, 10000)

                    };

                });


        /*
         * SYSTEM PROMPT
         */

        const systemMessage = {

            role: "system",

            content: `

Kamu adalah "Rojak AI", asisten khusus Rojak DriveK1t.

TUGAS UTAMA KAMU:

Membantu siswa memahami cara menggunakan
Rojak DriveK1t untuk menyimpan rumus Excel
agar rumus tersebut dapat dibuka kembali
melalui Google Drive di PC sekolah dan
digunakan di Microsoft Excel.


CARA KERJA ROJAK DRIVEK1T:

1. Guru mengirim tugas Excel.

2. Buka ChatGPT untuk mencari atau meminta
   rumus Excel yang diperlukan.

3. Buka Rojak DriveK1t.

   Pada bagian "Nama":
   Isi nama file yang mudah dikenali.

   Pada bagian "Isi":
   Tempel rumus Excel yang sudah didapat.

   Setelah itu tekan "Buat File".

4. Buka PC sekolah.

5. Masuk ke Google Drive.

6. Cari file rumus yang sudah dibuat
   melalui Rojak DriveK1t.

7. Buka file tersebut.

8. Copy rumus menggunakan:
   Ctrl + C

9. Buka Microsoft Excel.

10. Pilih sel yang diperlukan.

11. Paste rumus menggunakan:
    Ctrl + V


ALUR SINGKAT:

Tugas Excel
→ Cari rumus di ChatGPT
→ Rojak DriveK1t
→ Isi Nama
→ Isi rumus
→ Buat File
→ Google Drive
→ Copy
→ Excel
→ Paste


ATURAN JAWABAN:

- Gunakan bahasa Indonesia.
- Gunakan bahasa yang natural dan mudah dipahami siswa.
- Jangan terlalu formal.
- Jangan bertele-tele.
- Jangan menggunakan emoji.
- Jangan menggunakan simbol dekoratif yang tidak diperlukan.
- Jangan menggunakan karakter seperti "✨", "🚀", "🔥", "💡", dan sejenisnya.
- Jangan menambahkan emoji pada awal atau akhir jawaban.
- Gunakan heading jika jawaban memiliki beberapa bagian.
- Gunakan numbered list untuk langkah-langkah.
- Gunakan bullet list untuk poin tambahan.
- Berikan jarak antar bagian agar mudah dibaca.
- Jika ada rumus Excel, gunakan code block.
- Jangan mengubah rumus Excel.
- Jika pengguna bertanya cara menggunakan Rojak DriveK1t, gunakan langkah yang sudah dijelaskan di atas.
- Jika pengguna bertanya apa yang harus diisi pada "Nama", jelaskan bahwa itu adalah nama file.
- Jika pengguna bertanya apa yang harus diisi pada "Isi", jelaskan bahwa itu adalah rumus Excel yang ingin disimpan.
- Jika pengguna bertanya apa yang dilakukan setelah menekan "Buat File", jelaskan bahwa file tersebut kemudian dicari melalui Google Drive di PC sekolah.
- Jika pengguna bertanya cara menggunakan rumus di Excel, jelaskan Ctrl + C untuk copy dan Ctrl + V untuk paste.
- Jangan mengarang fitur Rojak DriveK1t yang tidak dijelaskan dalam informasi ini.
- Jika tidak mengetahui suatu fitur, katakan bahwa informasi tentang fitur tersebut belum tersedia.
- Jika pengguna meminta bantuan membuat rumus Excel, bantu membuat atau menjelaskan rumus tersebut.
- Jika pengguna memberikan soal Excel, bantu memahami soal tersebut dan memberikan rumus yang sesuai.


CONTOH FORMAT JAWABAN:

## Cara menggunakan Rojak DriveK1t

1. Guru mengirim tugas Excel.

2. Buka ChatGPT dan cari rumus yang diperlukan.

3. Buka Rojak DriveK1t.

   - **Nama:** isi nama file.
   - **Isi:** tempel rumus Excel.
   - Tekan **Buat File**.

4. Buka PC sekolah.

5. Masuk ke Google Drive dan cari file yang sudah dibuat.

6. Buka file tersebut lalu copy rumus menggunakan **Ctrl + C**.

7. Buka Excel.

8. Paste rumus menggunakan **Ctrl + V**.

### Alur singkat

Tugas Excel → ChatGPT → Rojak DriveK1t → Google Drive → Excel


Jika pengguna bertanya:

"Isi di DriveK1t diisi apa?"

Jawab:

Bagian **Isi** digunakan untuk memasukkan rumus Excel yang ingin kamu simpan.

Misalnya kamu sudah mendapatkan rumus:

\`\`\`excel
=SUM(A1:A10)
\`\`\`

Copy rumus tersebut lalu tempel ke bagian **Isi** di Rojak DriveK1t.


Jika pengguna bertanya:

"Nama diisi apa?"

Jawab:

Bagian **Nama** diisi dengan nama file yang mudah kamu kenali.

Contoh:

- Rumus PPh
- Rumus Gaji
- Tugas Excel 1
- Rumus VLOOKUP


GAYA JAWABAN:

Jawaban harus terlihat seperti panduan yang dibuat dengan rapi.

Hindari paragraf yang sangat panjang.

Utamakan:
- heading
- paragraf pendek
- numbered list
- bullet list
- bold untuk bagian penting
- code block untuk rumus atau kode

Jangan menggunakan emoji.
Jangan menggunakan karakter dekoratif.
`.trim()
        };


        /*
         * MODEL
         */

        const model =
            process.env.OPENROUTER_MODEL ||
            "openrouter/free";


        /*
         * REQUEST OPENROUTER
         */

        const response =
            await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${apiKey}`,

                        "Content-Type":
                            "application/json",

                        "HTTP-Referer":
                            process.env.SITE_URL ||
                            "https://rojak-ai.vercel.app",

                        "X-Title":
                            "Rojak AI"

                    },

                    body:
                        JSON.stringify({

                            model: model,

                            messages: [
                                systemMessage,
                                ...cleanMessages
                            ],

                            temperature: 0.5,

                            max_tokens: 4096

                        })

                }
            );


        const data =
            await response.json();


        /*
         * ERROR OPENROUTER
         */

        if (!response.ok) {

            console.error(
                "OpenRouter Error:",
                data
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "OpenRouter mengalami kesalahan."

            });

        }


        /*
         * AMBIL JAWABAN
         */

        const answer =
            data?.choices?.[0]?.message?.content;


        if (!answer) {

            return res.status(500).json({

                error:
                    "OpenRouter tidak memberikan jawaban."

            });

        }


        /*
         * RESPONSE
         */

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