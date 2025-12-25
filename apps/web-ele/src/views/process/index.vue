<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, onUnmounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

// 视频列表
const videos = [
  { id: 1, src: '/videos/11.mov', title: '产品介绍', msg: '结构数据' },
  { id: 2, src: '/videos/22.mov', title: '用户演示', msg: '文本数据' },
  { id: 3, src: '/videos/33.mov', title: '功能特性', msg: '音频数据' },
  { id: 4, src: '/videos/44.mov', title: '客户案例', msg: '图片数据' },
  { id: 5, src: '/videos/55.mov', title: '技术架构', msg: '视频数据' },
  { id: 6, src: '/videos/66.mov', title: '未来规划', msg: '图谱数据' },
  // { id: 7, src: '/videos/77.mov', title: '未来规划', msg: '半构数据' },
];

// 视频播放相关状态
const videoRefs = ref<HTMLVideoElement[]>([]);

// 数据处理流程步骤
const dataProcessSteps = [
  {
    english: 'Original Data',
    chinese: '原始数据',
    image: '/database/11.png',
    alt: 'Original Data',
  },
  {
    english: 'Standardized Data',
    chinese: '标化数据',
    image: '/database/22.png',
    alt: 'Standardized Data',
  },
  {
    english: 'Replicated Data',
    chinese: '副本数据',
    image: '/database/33.png',
    alt: 'Replicated Data',
  },
  {
    english: 'Cleaned Data',
    chinese: '清洗数据',
    image: '/database/44.png',
    alt: 'Cleaned Data',
  },
  {
    english: 'Data Validation',
    chinese: '校验数据',
    image: '/database/55.png',
    alt: 'Data Validation',
  },
];

// Echarts refs
const chart1Ref = ref<EchartsUIType>();
const chart2Ref = ref<EchartsUIType>();
const chart3Ref = ref<EchartsUIType>();
const chart4Ref = ref<EchartsUIType>();
const chart5Ref = ref<EchartsUIType>();

// Use echarts
const { renderEcharts: render1 } = useEcharts(chart1Ref);
const { renderEcharts: render2 } = useEcharts(chart2Ref);
const { renderEcharts: render3 } = useEcharts(chart3Ref);
const { renderEcharts: render4 } = useEcharts(chart4Ref);
const { renderEcharts: render5 } = useEcharts(chart5Ref);

// Options for each chart
const dataScientistOptions = {
  title: {
    left: 'center',
  },
  tooltip: { trigger: 'axis' },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['2020', '2021', '2022', '2023', '2024', '2025'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: 'Python',
      type: 'line',
      data: [120, 180, 150, 220, 190, 280],
      smooth: true,
    },
    {
      name: 'R',
      type: 'line',
      data: [150, 120, 170, 140, 200, 240],
      smooth: true,
    },
    {
      name: 'SQL',
      type: 'line',
      data: [100, 160, 130, 190, 150, 230],
      smooth: true,
    },
    {
      name: 'Machine Learning',
      type: 'line',
      data: [80, 140, 110, 170, 130, 210],
      smooth: true,
    },
    {
      name: 'Deep Learning',
      type: 'line',
      data: [60, 120, 90, 150, 110, 190],
      smooth: true,
    },
  ],
};

const dataAnalystOptions = {
  title: {
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '数据清洗',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      data: [120, 132, 101, 134, 90, 230],
    },
    {
      name: '数据分析',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      data: [220, 182, 191, 234, 290, 330],
    },
    {
      name: '可视化',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      data: [150, 232, 201, 154, 190, 330],
    },
    {
      name: '建模',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      data: [98, 77, 101, 99, 40, 120],
    },
    {
      name: '报告',
      type: 'bar',
      stack: 'total',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      data: [120, 132, 101, 134, 90, 230],
    },
  ],
};

const businessOptions = {
  title: {
    left: 'center',
  },
  tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
  series: [
    {
      name: '业务人员分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 8,
      },
      data: [
        { value: 1048, name: '企业1' },
        { value: 735, name: '企业2' },
        { value: 580, name: '企业3' },
        { value: 484, name: '企业4' },
        { value: 300, name: '企业5' },
        { value: 200, name: '企业6' },
        { value: 150, name: '企业7' },
        { value: 100, name: '企业8' },
      ],
    },
  ],
};

const saasOptions = {
  title: {
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985',
      },
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '数据存储',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [120, 132, 101, 134, 90, 230],
    },
    {
      name: '数据分析',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [220, 182, 191, 234, 290, 330],
    },
    {
      name: 'AI服务',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [150, 232, 201, 154, 190, 330],
    },
    {
      name: '可视化',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [98, 77, 101, 99, 40, 120],
    },
    {
      name: 'API集成',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [120, 132, 101, 134, 90, 230],
    },
    {
      name: '安全服务',
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: {
        focus: 'series',
      },
      data: [80, 95, 110, 125, 140, 155],
    },
  ],
};

const apiOptions = {
  title: {
    left: 'center',
  },
  tooltip: {},
  radar: {
    indicator: [
      { name: '响应时间', max: 100 },
      { name: '成功率', max: 100 },
      { name: '并发量', max: 100 },
      { name: '稳定性', max: 100 },
      { name: '安全性', max: 100 },
      { name: '易用性', max: 100 },
    ],
  },
  series: [
    {
      name: 'API性能',
      type: 'radar',
      data: [
        {
          value: [75, 95, 85, 92, 88, 78],
          name: 'API A',
        },
        {
          value: [82, 78, 88, 85, 92, 90],
          name: 'API B',
        },
        {
          value: [88, 92, 75, 95, 85, 82],
          name: 'API C',
        },
      ],
    },
  ],
};

onMounted(() => {
  render1(dataScientistOptions as any);
  render2(dataAnalystOptions as any);
  render3(businessOptions as any);
  render4(saasOptions as any);
  render5(apiOptions as any);

  // 启动所有视频自动播放
  startAllVideos();
});

onUnmounted(() => {
  // 清理所有视频
  videoRefs.value.forEach((video) => {
    if (video) {
      video.pause();
    }
  });
});

// 视频播放逻辑 - 所有视频独立循环播放
const startAllVideos = () => {
  // 延迟启动，确保DOM已渲染
  setTimeout(() => {
    videoRefs.value.forEach((video, index) => {
      if (video) {
        video.play().catch((error) => {
          console.log(`视频 ${index + 1} 播放失败:`, error);
        });
      }
    });
  }, 1000);
};

const setVideoRef = (el: HTMLVideoElement | null, index: number) => {
  if (el) {
    videoRefs.value[index] = el;
  }
};
</script>

<template>
  <div class="p-5">
    <div class="mb-5 flex flex-wrap gap-4">
      <div class="min-w-0 flex-1">
        <EchartsUI ref="chart1Ref" height="250px" />
      </div>
      <div class="min-w-0 flex-1">
        <EchartsUI ref="chart2Ref" height="250px" />
      </div>
      <div class="min-w-0 flex-1">
        <EchartsUI ref="chart3Ref" height="250px" />
      </div>
      <div class="min-w-0 flex-1">
        <EchartsUI ref="chart4Ref" height="250px" />
      </div>
      <div class="min-w-0 flex-1">
        <EchartsUI ref="chart5Ref" height="250px" />
      </div>
    </div>

    <div class="mt-5">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="step in dataProcessSteps"
          :key="step.english"
          class="flex min-h-[280px] flex-col items-center rounded-lg bg-white p-6 shadow-md"
        >
          <div class="mb-3 text-base font-medium text-gray-600">
            {{ step.english }}
          </div>
          <div
            class="mb-3 flex h-36 w-36 items-center justify-center rounded-lg"
          >
            <img
              :src="step.image"
              :alt="step.alt"
              class="h-full w-full rounded-lg object-cover"
            />
          </div>
          <div class="text-base font-medium text-gray-800">
            {{ step.chinese }}
          </div>
        </div>
      </div>
    </div>

    <!-- 动态箭头容器：与视频列表同网格布局 -->
    <div class="flex justify-center py-4">
      <!-- 增加上下内边距，让箭头更显眼 -->
      <div class="grid w-full grid-cols-6 gap-2">
        <div
          v-for="(video, index) in videos"
          :key="`arrow-${video.id}`"
          class="flex items-center justify-center"
        >
          <!-- 替换为箭头图标容器，添加自定义类名 -->
          <!-- <div class="arrow-icon animate-bounce"></div> -->
          <svg
            class="arrow-svg animate-bounce"
            width="48"
            height="64"
            viewBox="0 0 24 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L20 12H4L12 2ZM12 30L12 14L4 14L4 16L20 16L20 14L12 14L12 30Z"
              fill="#409eff"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <div class="grid grid-cols-6 gap-2">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          class="relative overflow-hidden rounded bg-gray-100"
        >
          <video
            :ref="(el) => setVideoRef(el as HTMLVideoElement, index)"
            :src="video.src"
            class="h-32 w-full object-cover"
            muted
            loop
            playsinline
            preload="metadata"
          ></video>
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2"
          >
            <p>{{ video.msg }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%,
  100% {
    opacity: 0.9;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-12px); /* 增加浮动距离，更明显 */
  }
}

.arrow-icon {
  position: relative;

  /* 箭头尺寸：宽24px，高32px，可自行调整 */
  width: 24px;
  height: 32px;
  font-size: 32px; /* 箭头图标大小 */
  line-height: 1;

  /* 箭头颜色，可自定义 */
  color: #409eff;
}

/* 用伪元素实现箭头（也可以直接用SVG/字体图标，这里用纯CSS实现更美观的箭头） */
.arrow-icon::after {
  display: block;

  /* 可选：添加阴影，提升立体感 */
  text-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  content: '↑'; /* 用向上符号作为箭头，也可以用 FontAwesome 的图标 <i class="fa fa-arrow-up"></i> */

  /* 让箭头有渐变透明度，更柔和 */
  opacity: 0.9;
}

/* 箭头浮动动画：保留但优化动画曲线，更自然 */
.animate-bounce {
  animation: bounce 1.5s infinite ease-in-out;
}

/* 向上箭头样式：替换原三角形，使用更美观的箭头 */

/* SVG 箭头样式 */
.arrow-svg {
  opacity: 0.9;

  /* 可选：添加阴影，提升立体感 */
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 10%));
}
</style>
