
![Pasted image 20261030233517](Attachments/Pasted%20image%2020261030233517.png)

Vẫn là cơ chế xác thực dùng JWT không có signature nên mình đổi sang người khác thoải mái:
![Pasted image 20261030233543](Attachments/Pasted%20image%2020261030233543.png)

Bài này có vẻ ko thể thắng do nhiều tiền được, mình để ý thấy cơ chể của log gửi đến endpoint API /api/audit để xem log người dùng:

![Pasted image 20261030233823](Attachments/Pasted%20image%2020261030233823.png)


Mình thêm `| ls` thì tự nhiên thấy command injection luôn :))
![Pasted image 20261030234055](Attachments/Pasted%20image%2020261030234055.png)


Mình cài reverse shell khai thác cho tiện:
![Pasted image 20261030234449](Attachments/Pasted%20image%2020261030234449.png)

![Pasted image 20261030234457](Attachments/Pasted%20image%2020261030234457.png)

Nghịch nghịch chút thì mình thấy flag trong env:
![Pasted image 20261030234602](Attachments/Pasted%20image%2020261030234602.png)


Source code của app:
```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Đảm bảo thư mục logs tồn tại
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}

let db = {
    "hay_nuoi_toi": { coins: 999, betCount: 0 },
    "nguoi_toi_yeu_la_tien": { coins: 888, betCount: 0 },
    "doi_qua_roi_anh_em_oi": { coins: 777, betCount: 0 },
    "nemchua_36": { coins: 36, betCount: 0 }
};

// Flag is read from the environment; the command-injection RCE exfiltrates it
// from the process environment (e.g. `; printenv FLAG #`) rather than a file.
const FLAG = (process.env.FLAG || '').trim() || 'BKSEC{flag_not_configured}';

const authMiddleware = (req, res, next) => {
    let token = req.cookies.auth_token;

    if (!token) {
        // Tạo user mới nếu chưa có token
        const username = "player_" + Math.random().toString(36).substring(7);
        db[username] = { coins: 1, betCount: 0 };
        // LỖ HỔNG 1: Ký token không dùng secret (None Algorithm)
        token = jwt.sign({ username: username }, '', { algorithm: 'none' });
        res.cookie('auth_token', token);
        req.username = username;
    } else {
        try {
            // LỖ HỔNG 2: Giải mã token mà không cần verify chữ ký
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.username) throw new Error();

            req.username = decoded.username;
            if (!db[req.username]) {
                db[req.username] = { coins: 1, betCount: 0 };
            }
        } catch (e) {
            return res.status(401).json({ error: "Token không hợp lệ!" });
        }
    }
    next();
};

app.get('/api/status', authMiddleware, (req, res) => {
    const user = db[req.username];
    const leaderboard = Object.keys(db)
        .filter(u => typeof db[u].coins === 'number')
        .map(u => ({ username: u, coins: db[u].coins }))
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10);

    res.json({
        username: req.username,
        coins: user.coins,
        betCount: user.betCount,
        leaderboard: leaderboard
    });
});

// LỖ HỔNG RCE: Command Injection qua username trong shell command
app.get('/api/audit', authMiddleware, (req, res) => {
    // Thực thi lệnh liệt kê file log của user.
    // Do req.username lấy từ JWT không tin cậy, attacker có thể chèn chuỗi "; cat flag.txt #"
    const command = `cat logs/${req.username} 2>&1`;

    exec(command, (error, stdout, stderr) => {
        const output = (stdout || '') + (stderr || '') + (error && error.message ? error.message : '');
        if (output.includes('No such file or directory')) {
            return res.json({ message: `${req.username}không có lịch sử bet` });
        }

        res.json({
            message: "Thông tin hệ thống về log cá nhân:",
            debug_info: stdout || stderr
        });
    });
});

app.post('/api/bet', authMiddleware, (req, res) => {
    let { amount } = req.body;
    const user = db[req.username];

    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0 || amount > user.coins) {
        return res.status(400).json({ error: "Số tiền cược không hợp lệ!" });
    }

    user.betCount += 1;
    let win = user.betCount < 10 ? Math.random() > 0.5 : false;

    if (win) {
        user.coins += amount;
    } else {
        user.coins -= amount;
        if (user.coins <= 0) {
            user.coins = 1;
            user.betCount = 0;
        }
    }


    try {
        const logEntry = `[${new Date().toISOString()}] Bet: ${amount} | Result: ${win ? 'WIN' : 'LOSS'} | Balance: ${user.coins}\n`;
        const logPath = path.join(LOGS_DIR, `${req.username}`);
        fs.appendFileSync(logPath, logEntry);
    } catch (e) {
        console.error("Logging error:", e.message);
    }

    res.json({ win, newBalance: user.coins, betCount: user.betCount });
});

app.post('/api/reset', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ status: "ok" });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gambling Coin 2 (RCE) running on http://0.0.0.0:${PORT}`);
});
```