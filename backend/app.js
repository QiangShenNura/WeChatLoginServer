const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
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

// 处理前端路由
app.get('/login', (req, res) => {
  res.redirect('/');
});

// 处理根路径和所有前端路由
app.get('*', (req, res) => {
  // 在开发环境中，重定向到 Vite 开发服务器
  res.redirect('http://localhost:8080');
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

const port = 3000;  // 修改为新的本地端口

// 添加启动日志
const server = app.listen(port, '127.0.0.1', () => {
  console.log('=================================');
  console.log(`后端服务器启动信息:`);
  console.log(`- 时间: ${new Date().toISOString()}`);
  console.log(`- 环境: ${process.env.NODE_ENV}`);
  console.log(`- 端口: ${port}`);
  console.log(`- 地址: http://127.0.0.1:${port}`);
  console.log('=================================');
});

// 添加服务器错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`错误: 端口 ${port} 已被占用`);
    console.error('请确保没有其他服务正在使用该端口');
    process.exit(1);
  } else {
    console.error('服务器错误:', error);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}); 