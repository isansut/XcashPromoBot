const axios = require('axios');
//edit token kamu disini
const AUTH_TOKEN = 'tma query_id=AAGRpvpIAwAAAJGm-ki6Bgn2&user=%7B%22id%22%3A7666837137%2C%22first_name%22%3A%22Mawan%22%2C%22last_name%22%3A%22%F0%9F%8D%85%F0%9F%90%BE%22%2C%22username%22%3A%22wefen20560%22%2C%22language_code%22%3A%22id%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F_Ywk6iWi-i5iJTxIjZNDaNqc5D8IE6QBqm_oluYiFkYlPprVMCc-q7GB1J2IRfY_.svg%22%7D&auth_date=1770728755&signature=8qA9bDh7v2pg6Hoq8zq0C1Uz5GNMV0LdvXuyFZSqDBtAIMP9NMxAjUzwTFXsaU8_wTZxIq4a_TbpGt58AYaiDg&hash=301c2749e226f90f8051f43be7fd59016f80d87ed2fdea021acd2e6c289ad2fe';

const client = axios.create({
    baseURL: 'https://xquest-api.xcash.tech',
    headers: {
        'authorization': AUTH_TOKEN,
        'content-type': 'application/json',
        'accept': '*/*',
        'origin': 'https://xtgame.xcash.tech',
        'referer': 'https://xtgame.xcash.tech/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
    }
});

async function startMining() {
    while (true) {
        try {
            // Cek status sesi yang tersisa
            const status = await client.get('/tap/status');
            console.log(`\n📊 Sisa Sesi: ${status.data.sessionsRemaining} | Total Poin: ${status.data.totalPoints}`);

            if (status.data.sessionsRemaining === 0 || !status.data.canStart) {
                console.log('😴 Tidak ada sesi tersisa. Berhenti.');
                break;
            }

            console.log('🚀 Memulai Sesi Baru...');
            const startRes = await client.post('/tap/session/start', {});
            const { sessionId, durationSeconds } = startRes.data;
            const endTime = Date.now() + (durationSeconds * 1000);
            let totalAccepted = 0;

            const blaster = setInterval(() => {
                if (Date.now() >= (endTime - 1500)) {
                    clearInterval(blaster);
                    return;
                }

                const tapCount = 100; // 100 taps per request
                const now = Date.now();
                const timestamps = Array.from({ length: tapCount }, (_, i) => now + (i * 5));

                client.post('/tap/session/taps', { sessionId, tapCount, timestamps })
                    .then(res => {
                        totalAccepted += res.data.accepted;
                        process.stdout.write(`\r🔥 Taps: ${totalAccepted} | Sisa: ${Math.max(0, Math.round((endTime - Date.now())/1000))}s `);
                    })
                    .catch(() => {});
            }, 80);

            // Tunggu durasi sesi selesai
            await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));

            console.log('\n⏹️ Mengakhiri sesi...');
            const endRes = await client.post('/tap/session/end', { sessionId });
            console.log(`✅ Sukses! Poin didapat: ${endRes.data.pointsAwarded}`);

            await new Promise(r => setTimeout(r, 3000));

        } catch (error) {
            console.error('❌ Error:', error.response?.data || error.message);
            break;
        }
    }
}

startMining();
