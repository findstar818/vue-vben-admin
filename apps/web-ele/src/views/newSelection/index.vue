<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToProcess() {
  router.push('/process');
}
</script>

<template>
  <div class="page-wrapper">
    <div class="needBackGround">
      <div class="content-wrapper">
        <div class="content-container">
          <div class="content-item">
            <div class="content-item-title">
              <h1 @click="goToProcess">数据湖</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 波纹动画 */
@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.4;
  }

  50% {
    opacity: 0.2;
  }

  100% {
    width: 120px;
    height: 120px;
    opacity: 0;
  }
}

@keyframes ripple-hover {
  0% {
    width: 0;
    height: 0;
    opacity: 0.25;
  }

  30% {
    opacity: 0.15;
  }

  100% {
    width: 180px;
    height: 180px;
    opacity: 0;
  }
}

:deep(body) {
  height: 100vh !important;
  max-height: 100vh !important;
  overflow: hidden !important;
}

.page-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.needBackGround {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background-image: url('/database/fivedatalake.png');
  background-repeat: no-repeat;
  background-position: top center;
  background-size: auto 100vh;
}

.content-wrapper {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  max-height: 100vh;
  padding-bottom: 7%;
  overflow: hidden;
}

.content-item {
  text-align: center;
}

.content-item-title {
  position: relative;
  display: inline-block;
}

.content-item-title h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 72px;
  font-weight: bold;
  line-height: 1.2;
  color: #03b7e1;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 水面波纹效果 - 使用伪元素创建波纹 */
.content-item-title h1::before,
.content-item-title h1::after {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  width: 0;
  height: 0;
  pointer-events: none;
  content: '';
  background: rgb(3 183 225 / 25%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.content-item-title h1::before {
  animation: ripple 2s infinite;
}

.content-item-title h1::after {
  animation: ripple 2s infinite 0.5s;
}

/* Hover 时的波纹效果 */
.content-item-title h1:hover {
  text-shadow:
    0 0 20px rgb(3 183 225 / 50%),
    0 0 40px rgb(3 183 225 / 30%),
    0 0 60px rgb(3 183 225 / 20%);
  transform: scale(1.05);
}

.content-item-title h1:hover::before,
.content-item-title h1:hover::after {
  animation: ripple-hover 2s infinite;
}

.content-item-title h1:hover::after {
  animation-delay: 0.4s;
}

/* 防止页面滚动 */
</style>
