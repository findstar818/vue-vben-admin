<script lang="ts" setup>
import { useRouter } from 'vue-router';

// 数据处理流程步骤，每个步骤对应一个跳转路由
const dataProcessSteps = [
  {
    english: 'Data Validation',
    chinese: 'C 环',
    image: '/database/C.png',
    alt: 'Data Validation',
    path: '/process',
  },
  {
    english: 'Original Data',
    chinese: 'F 环',
    image: '/database/F.jpg',
    alt: 'Original Data',
    path: '/process',
  },
  {
    english: 'Standardized Data',
    chinese: 'f 环',
    image: '/database/lf.jpg',
    alt: 'Standardized Data',
    path: '/process',
  },
  {
    english: 'Replicated Data',
    chinese: 'S 环',
    image: '/database/S.png',
    alt: 'Replicated Data',
    path: '/process',
  },
  {
    english: 'Cleaned Data',
    chinese: 'I 环',
    image: '/database/I.png',
    alt: 'Cleaned Data',
    path: '/process',
  },
];

const router = useRouter();

// 计算每个元素在圆环上的位置
// 为了让5个圆形元素相切：D = 2 * R * sin(36°)
// 如果元素直径 D = 240px，则 R = 240 / (2 * sin(36°)) ≈ 204px
// 为了产生轻微重叠效果但不过于拥挤，使用90%的半径
const circleDiameter = 240; // 圆形元素直径（再减小一点）
const baseRadius = circleDiameter / (2 * Math.sin(Math.PI / 5)); // 相切时的圆环半径（约238px）
const radius = baseRadius * 0.9; // 使用90%让元素轻微重叠，但不会太拥挤
const totalItems = dataProcessSteps.length;
const angleStep = (2 * Math.PI) / totalItems; // 每个元素之间的角度间隔

// 计算每个元素的位置
const getPosition = (index: number) => {
  // 从顶部开始，逆时针排列
  const angle = index * angleStep - Math.PI / 2; // -90度开始，从顶部开始
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return { x, y, angle: (angle * 180) / Math.PI };
};

// 计算容器尺寸（需要容纳圆形元素和圆环半径）
const containerSize = Math.ceil((radius + circleDiameter / 2) * 2) + 100; // 容器大小（圆环半径 + 元素半径）* 2 + padding

// 点击卡片跳转对应页面
function goToProcess(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="page-wrapper">
    <div class="needBackGround">
      <div class="content-wrapper">
        <h2 class="mb-8 text-center text-2xl font-bold"></h2>
        <div class="overflow-visible px-6 py-6">
          <div class="circular-container">
            <!-- 五个圆形元素 -->
            <div
              v-for="(step, index) in dataProcessSteps"
              :key="step.english"
              class="process-card"
              :style="{
                left: `calc(50% + ${getPosition(index).x - 540}px)`,
                top: `calc(50% + ${getPosition(index).y + 10}px)`,
                transform: 'translate(-50%, -50%)',
              }"
              @click="goToProcess(step.path)"
            >
              <div
                class="circular-content flex flex-col items-center justify-center"
              >
                <div class="image-container flex items-center justify-center">
                  <img
                    :src="step.image"
                    :alt="step.alt"
                    class="circular-image"
                  />
                </div>
                <div
                  class="process-text-chinese text-center text-base font-medium"
                >
                  {{ step.chinese }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.bg-white) {
  background-color: #fff !important;
}

.circular-container {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: calc(100% - 120px); /* 减去标题和padding的高度 */
  padding: 20px;
}

/* 圆形卡片样式 */
.process-card {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 240px;
  cursor: pointer;
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.process-card:hover {
  z-index: 10;
  box-shadow: 0 20px 40px rgb(0 0 0 / 25%);
  transform: translate(-50%, -50%) scale(1.4);
}

.process-card:hover .circular-content {
  transform: scale(1.1);
}

.process-card:hover .image-container {
  transform: scale(1.15);
}

.process-card:hover .process-text-chinese {
  transform: scale(1.1);
}

.circular-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  margin-bottom: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.circular-image {
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.process-text-chinese {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  color: #000 !important;
  text-align: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.needBackGround {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-image: url('/database/dataLake.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
}

.content-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  padding: 20px;
}
</style>
