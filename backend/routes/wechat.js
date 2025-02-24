const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// 微信服务器验证接口 - 放在最前面
router.get('/wxcheck', (req, res) => {
  console.log('收到请求！！！')
  console.log('请求头:', req.headers);
  console.log('请求URL:', req.url);
  console.log('请求方法:', req.method);
  console.log('请求参数:', req.query);
  
  try {
    const { signature, timestamp, nonce, echostr } = req.query;
    
    // 添加调试日志
    console.log('收到微信验证请求：', {
      signature,
      timestamp,
      nonce,
      echostr
    });
    
    if (!signature || !timestamp || !nonce || !echostr) {
      console.log('缺少必要的参数');
      return res.status(400).send('缺少必要的参数');
    }
    
    const token = 'mma_test_token';
    const tmpArr = [token, timestamp, nonce];
    tmpArr.sort();
    
    const tmpStr = tmpArr.join('');
    const hashCode = crypto.createHash('sha1').update(tmpStr).digest('hex');
    
    console.log('本地计算的签名:', hashCode);
    console.log('微信发送的签名:', signature);
    
    if (hashCode === signature) {
      console.log('微信服务器验证成功');
      res.send(echostr);
    } else {
      console.log('微信服务器验证失败');
      res.status(403).send('验证失败');
    }
  } catch (error) {
    console.error('处理微信验证请求失败:', error);
    res.status(500).send('服务器错误');
  }
});

// 获取微信登录二维码URL
router.get('/qrcode', async (req, res) => {
  try {
    // 添加日志便于调试
    console.log('正在生成二维码URL...');
    
    // 检查环境变量
    if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_REDIRECT_URI) {
      console.error('环境变量缺失:', {
        WECHAT_APP_ID: process.env.WECHAT_APP_ID,
        WECHAT_REDIRECT_URI: process.env.WECHAT_REDIRECT_URI
      });
      throw new Error('缺少必要的环境变量配置');
    }

    const appId = process.env.WECHAT_APP_ID;
    const redirectUri = encodeURIComponent(process.env.WECHAT_REDIRECT_URI);
    const scope = 'snsapi_userinfo';// snsapi_login
    const state = Math.random().toString(36).substr(2, 15);

    const qrcodeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=STATE#wechat_redirect`;
    
    console.log('生成的二维码URL:', qrcodeUrl);
    
    // 验证生成的 URL 是否可访问
    try {
      const testResponse = await axios.head(qrcodeUrl);
      console.log('二维码URL可访问，状态码:', testResponse.status);
    } catch (error) {
      console.warn('二维码URL可能无法访问:', error.message);
    }
    
    res.json({ qrcodeUrl });
  } catch (error) {
    console.error('获取二维码URL失败:', error);
    res.status(500).json({ 
      message: '获取二维码URL失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 添加一个 Map 用于存储用户信息
const userInfoMap = new Map();

// 修改 callback 路由，存储用户信息
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    console.log('收到微信回调，code:', code);
    
    // 使用code获取access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const tokenResponse = await axios.get(tokenUrl);
    const { access_token, openid } = tokenResponse.data;

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const userInfoResponse = await axios.get(userInfoUrl);

    // 存储用户信息
    userInfoMap.set(openid, userInfoResponse.data);
    console.log('存储用户信息:', userInfoResponse.data);

    // 返回成功页面
    res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>登录成功</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              background-color: #f5f5f5;
            }
            .success-icon {
              color: #07C160;
              font-size: 64px;
              margin-bottom: 20px;
            }
            .message {
              color: #333;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✓</div>
          <div class="message">
            <h2>登录成功</h2>
            <p>请返回原页面</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('处理回调失败:', error);
    res.status(500).json({ message: '处理回调失败', error: error.message });
  }
});

// 添加检查状态的接口
router.get('/check-status', (req, res) => {
  try {
    console.log('检查用户状态...');
    console.log('当前存储的用户数:', userInfoMap.size);
    
    // 获取最新的用户信息
    const latestUserInfo = Array.from(userInfoMap.values())[userInfoMap.size - 1];
    
    if (latestUserInfo) {
      console.log('找到用户信息:', latestUserInfo);
      res.json({ userInfo: latestUserInfo });
      // 返回后清除用户信息，避免重复返回
      userInfoMap.clear();
    } else {
      console.log('未找到用户信息');
      res.json({ userInfo: null });
    }
  } catch (error) {
    console.error('检查状态失败:', error);
    res.status(500).json({ message: '检查状态失败', error: error.message });
  }
});

// 添加测试路由
router.get('/test', (req, res) => {
  res.send('Wechat route is working');
});

module.exports = router; 