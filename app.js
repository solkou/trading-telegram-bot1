// app.js - TradingView → Telegram 中継サーバー
const express = require('express');
const axios = require('axios');
const app = express();

// 環境変数（Railway で設定）
const PORT = process.env.PORT || 10000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7901051348:AAFv-pRmtTTVVu0ZWT--M670307bsbyc6Ow';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'your_chat_id_here';

// JSONデータを受信できるように設定
app.use(express.json());

// ヘルスチェック用（サーバーが生きているか確認）
app.get('/', (req, res) => {
    res.json({ 
        status: 'サーバー稼働中', 
        timestamp: new Date().toISOString(),
        message: 'TradingView → Telegram 中継サーバー'
    });
});

// TradingViewからのWebhook受信エンドポイント
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook受信:', JSON.stringify(req.body, null, 2));
        
        // TradingViewからのデータを解析
        const alertData = req.body;
        
        // メッセージフォーマット作成
        let message = '';
        
        if (typeof alertData === 'string') {
            // 文字列の場合（シンプルアラート）
            message = `🔔 TradingView アラート\n${alertData}`;
        } else if (alertData.ticker && alertData.signal) {
            // JSON形式の場合（V2.1からのアラート）
            const emoji = alertData.signal === 'bullish' ? '🟢' : '🔴';
            const signalText = alertData.signal === 'bullish' ? '上昇シグナル' : '下落シグナル';
            
            message = `${emoji} ${alertData.ticker} ${signalText}！\n`;
            message += `現在価格：${alertData.price}円\n`;
            message += `RSI：${alertData.rsi}\n`;
            message += `時刻：${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})} JST`;
        } else {
            // その他の形式
            message = `🔔 TradingView アラート\n${JSON.stringify(alertData, null, 2)}`;
        }
        
        // Telegramに送信
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramData = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        };
        
        const response = await axios.post(telegramUrl, telegramData);
        
        if (response.data.ok) {
            console.log('Telegram送信成功:', message);
            res.json({ success: true, message: 'Telegram送信完了' });
        } else {
            console.error('Telegram送信エラー:', response.data);
            res.status(500).json({ success: false, error: 'Telegram送信失敗' });
        }
        
    } catch (error) {
        console.error('エラー詳細:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// テスト用エンドポイント
app.post('/test', async (req, res) => {
    try {
        const testMessage = `🧪 テストメッセージ\n時刻：${new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})} JST`;
        
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramData = {
            chat_id: TELEGRAM_CHAT_ID,
            text: testMessage
        };
        
        const response = await axios.post(telegramUrl, telegramData);
        
        if (response.data.ok) {
            res.json({ success: true, message: 'テストメッセージ送信完了' });
        } else {
            res.status(500).json({ success: false, error: 'テスト送信失敗' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: Port ${PORT}`);
    console.log(`📱 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN ? '設定済み' : '未設定'}`);
    console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID ? '設定済み' : '未設定'}`);
});
