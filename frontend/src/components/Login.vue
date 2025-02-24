<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>微信扫码登录</h2>
        </div>
      </template>
      <div class="qrcode-container">
        <iframe 
          v-if="qrcodeUrl" 
          :src="qrcodeUrl" 
          frameborder="0" 
          width="300" 
          height="400"
          @load="handleIframeLoad"
          @error="handleIframeError"
        ></iframe>
        <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button type="primary" @click="refreshQrcode" :loading="loading">
          刷新二维码
        </el-button>
      </div>
      <div class="user-info" v-if="userInfo">
        <el-avatar :src="userInfo.headimgurl" :size="64"></el-avatar>
        <h3>{{ userInfo.nickname }}</h3>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const qrcodeUrl = ref('')
const loading = ref(false)
const error = ref('')
const userInfo = ref(null)

const handleIframeLoad = (event) => {
  console.log('iframe 加载成功');
  // 清除可能存在的错误
  error.value = '';
}

const handleIframeError = (event) => {
  console.error('iframe 加载失败:', event);
  error.value = 'QR码加载失败，请刷新重试';
}

const getQrcodeUrl = async () => {
  try {
    error.value = ''
    loading.value = true
    console.log('开始请求二维码URL...')
    
    const baseUrl = 'http://i4qd87.natappfree.cc'  // 修改为内网穿透的外部访问地址
    console.log('请求后端地址:', baseUrl)
    
    const response = await axios.get(`${baseUrl}/api/wechat/qrcode`, {
      timeout: 5000,
      validateStatus: null,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    console.log('收到二维码响应:', response)
    
    if (response.status !== 200) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }
    
    if (!response.data.qrcodeUrl) {
      throw new Error('返回的数据中没有二维码URL')
    }
    
    qrcodeUrl.value = response.data.qrcodeUrl
    console.log('二维码URL:', qrcodeUrl.value)
  } catch (err) {
    console.error('获取二维码失败:', err)
    error.value = `获取二维码失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

const refreshQrcode = () => {
  getQrcodeUrl()
}

onMounted(() => {
  getQrcodeUrl()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: center;
}

.qrcode-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.qrcode-container iframe {
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.user-info {
  margin-top: 20px;
}

.user-info h3 {
  margin-top: 10px;
  color: #333;
}
</style> 