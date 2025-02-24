const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const wechatRoutes = require('./routes/wechat');

// 加载环境变量
dotenv.config();

const app = express();

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 中间件配置
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// 路由配置
app.use('/api/wechat', wechatRoutes);

// 添加根路由测试
app.get('/', (req, res) => {
  res.send('Server is running at root');
});

// 添加调试路由
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 在 dotenv.config() 后添加检查
console.log('环境变量检查:');
console.log('PORT:', process.env.PORT);
console.log('WECHAT_APP_ID:', process.env.WECHAT_APP_ID);
console.log('WECHAT_REDIRECT_URI:', process.env.WECHAT_REDIRECT_URI);

const port = 8080;  // 修改为新的本地端口

// 添加错误处理
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${port}`);
  console.log('服务器已准备好接收请求');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，请尝试其他端口`);
  } else {
    console.error('服务器启动失败:', err);
  }
  process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}); 