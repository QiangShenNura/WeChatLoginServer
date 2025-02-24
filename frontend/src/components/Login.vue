<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>微信扫码登录</h2>
        </div>
      </template>
      <div class="qrcode-container">
        <qrcode-vue
          v-if="qrcodeUrl && !userInfo"
          :value="qrcodeUrl"
          :size="200"
          level="H"
          render-as="svg"
          :margin="2"
          :foreground="'#2C8532'"
          :background="'#ffffff'"
          @click="refreshQrcode"
        />
        <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button 
          v-if="!userInfo"
          type="success" 
          @click="refreshQrcode" 
          :loading="loading"
        >
          刷新二维码
        </el-button>
      </div>
      <div v-if="userInfo" class="user-info">
        <el-avatar :src="userInfo.headimgurl" :size="64"></el-avatar>
        <h3>{{ userInfo.nickname }}</h3>
        <p class="user-detail">欢迎使用</p>
        <div class="user-extra">
          <p>性别: {{ userInfo.sex === 1 ? '男' : userInfo.sex === 2 ? '女' : '未知' }}</p>
          <p>地区: {{ userInfo.country }} {{ userInfo.province }} {{ userInfo.city }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import axios from 'axios'
import QrcodeVue from 'qrcode.vue'

const qrcodeUrl = ref('')
const loading = ref(false)
const error = ref('')
const userInfo = ref(null)
let pollTimer = null // 用于存储轮询定时器

// 获取用户信息的轮询函数
const pollUserInfo = async () => {
  try {
    const baseUrl = 'http://fvmq8e.natappfree.cc'  // 使用你的内网穿透地址
    const response = await axios.get(`${baseUrl}/api/wechat/check-status`, {
      timeout: 5000,
      validateStatus: null
    })
    
    if (response.data && response.data.userInfo) {
      userInfo.value = response.data.userInfo
      // 清除轮询定时器
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }
  } catch (err) {
    console.error('轮询用户信息失败:', err)
  }
}

// 开始轮询
const startPolling = () => {
  // 先清除可能存在的轮询
  if (pollTimer) {
    clearInterval(pollTimer)
  }
  // 每3秒轮询一次
  pollTimer = setInterval(pollUserInfo, 3000)
}

const getQrcodeUrl = async () => {
  try {
    error.value = ''
    loading.value = true
    console.log('开始请求二维码URL...')
    
    const baseUrl = 'http://fvmq8e.natappfree.cc'  // 使用你的内网穿透地址
    console.log('请求后端地址:', baseUrl)
    
    const response = await axios.get(`${baseUrl}/api/wechat/qrcode`, {
      timeout: 5000,
      validateStatus: null,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (response.status !== 200) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }
    
    if (!response.data.qrcodeUrl) {
      throw new Error('返回的数据中没有二维码URL')
    }
    
    qrcodeUrl.value = response.data.qrcodeUrl
    console.log('二维码URL:', qrcodeUrl.value)
    
    // 获取到二维码后开始轮询
    startPolling()
    
  } catch (err) {
    console.error('获取二维码失败:', err)
    error.value = `获取二维码失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 组件卸载时清除轮询
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

const refreshQrcode = () => {
  getQrcodeUrl()
}

onMounted(() => {
  getQrcodeUrl()
})

// 添加用户信息变化的监听
watch(userInfo, (newValue) => {
  if (newValue) {
    try {
      // 调用安卓接口
      window.AndroidInterface?.onWechatUserInfo(JSON.stringify(newValue))
      console.log('已将用户信息发送到安卓层:', newValue)
    } catch (err) {
      console.error('调用安卓接口失败:', err)
    }
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: center;
}

.card-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

.qrcode-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qrcode-container :deep(svg) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 100%;
  height: auto;
}

.user-info {
  margin-top: 1rem;
  padding: 1rem;
}

.user-info h3 {
  margin: 0.5rem 0;
  color: #333;
}

.user-detail {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.user-extra {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
}

.user-extra p {
  margin: 0.3rem 0;
}

/* 移动端适配 */
@media screen and (max-width: 480px) {
  .login-container {
    padding: 0;
    background-color: #ffffff;
  }

  .login-card {
    margin: 0;
    box-shadow: none;
    border: none;
  }

  .qrcode-container {
    padding: 1rem 0.5rem;
  }

  .user-info {
    padding: 1rem 0.5rem;
  }

  .user-extra {
    margin: 1rem 0.5rem;
  }

  .card-header h2 {
    font-size: 1.2rem;
  }
}
</style> 