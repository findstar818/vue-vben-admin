<!-- 
  项目计划分析页面：
    项目计划总览
    项目号、任务名称、计划工时、开始时间、结束时间 甘特图部分（依旧是按照季度显示）
    下侧为"资源占有情况"可视化图表
    X轴为 0% 10%.....
    Y轴：动平衡、试验台架2、恒温间......
    -->
<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { PlanTableItem } from '#/api/analysis/project-plan-analysis';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import dayjs from 'dayjs';
import { ElCard, ElMessage } from 'element-plus';

import { getProjectPlanAnalysisApi } from '#/api/analysis/project-plan-analysis';

// 加载状态
const loading = ref(false);

// 甘特图数据（从 API 获取后转换）
interface GanttDisplayItem {
  projectId: string;
  taskName: string;
  planWorkHours: number;
  startTime: string;
  endTime: string;
}

const ganttData = ref<GanttDisplayItem[]>([]);

// 计算甘特图的时间范围
const timeRange = computed(() => {
  if (ganttData.value.length === 0) {
    return { start: '', end: '' };
  }
  const startDates = ganttData.value.map((item) => item.startTime);
  const endDates = ganttData.value.map((item) => item.endTime);
  const sortedStartDates = startDates.sort();
  const sortedEndDates = endDates.sort();
  return {
    start: sortedStartDates[0],
    end: sortedEndDates[sortedEndDates.length - 1],
  };
});

// 生成月份列表
const monthList = computed(() => {
  if (!timeRange.value.start || !timeRange.value.end) {
    return [];
  }
  const start = dayjs(timeRange.value.start);
  const end = dayjs(timeRange.value.end);
  const months: Array<{ label: string; month: number; year: number }> = [];
  let current = start.startOf('month');

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    months.push({
      year: current.year(),
      month: current.month() + 1,
      label: `${current.month() + 1}月`,
    });
    current = current.add(1, 'month');
  }

  return months;
});

// 生成季度列表
const quarterList = computed(() => {
  if (monthList.value.length === 0) {
    return [];
  }
  const quarters: Array<{
    label: string;
    monthCount: number;
    quarter: number;
    year: number;
  }> = [];

  type QuarterInfo = {
    monthCount: number;
    quarter: number;
    year: number;
  };

  let currentQuarter: null | QuarterInfo = null;

  monthList.value.forEach((month) => {
    const quarter = Math.floor((month.month - 1) / 3) + 1;

    if (
      !currentQuarter ||
      currentQuarter.year !== month.year ||
      currentQuarter.quarter !== quarter
    ) {
      if (currentQuarter) {
        quarters.push({
          year: currentQuarter.year,
          quarter: currentQuarter.quarter,
          monthCount: currentQuarter.monthCount,
          label: `${currentQuarter.year}年第${currentQuarter.quarter}季度`,
        });
      }
      currentQuarter = {
        year: month.year,
        quarter,
        monthCount: 1,
      };
    } else {
      currentQuarter.monthCount++;
    }
  });

  if (currentQuarter) {
    const q: QuarterInfo = currentQuarter;
    quarters.push({
      year: q.year,
      quarter: q.quarter,
      monthCount: q.monthCount,
      label: `${q.year}年第${q.quarter}季度`,
    });
  }

  return quarters;
});

// 计算任务在时间轴上的位置和宽度（百分比）
function calculateTaskPosition(task: { endTime: string; startTime: string }) {
  if (
    !timeRange.value.start ||
    !timeRange.value.end ||
    monthList.value.length === 0
  ) {
    return { left: 0, width: 0 };
  }

  const start = dayjs(timeRange.value.start);
  const end = dayjs(timeRange.value.end);
  const taskStart = dayjs(task.startTime);
  const taskEnd = dayjs(task.endTime);

  const totalDays = end.diff(start, 'day');
  const taskStartDays = taskStart.diff(start, 'day');
  const taskDuration = taskEnd.diff(taskStart, 'day') + 1;

  const left = (taskStartDays / totalDays) * 100;
  const width = (taskDuration / totalDays) * 100;

  return {
    left: Math.max(0, left),
    width: Math.max(0, Math.min(width, 100 - left)),
  };
}

// 资源占有情况图表
const resourceChartRef = ref<EchartsUIType>();
const { renderEcharts: renderResourceChart } = useEcharts(resourceChartRef);

// 资源占有情况数据
const resourceData = ref<Array<{ name: string; value: number }>>([]);

// 初始化数据
const init = async () => {
  loading.value = true;
  try {
    const result = await getProjectPlanAnalysisApi();

    // 转换甘特图数据
    ganttData.value = result.projectGanttList.map((item: PlanTableItem) => ({
      projectId: item.projectId || '',
      taskName: item.taskName || '',
      planWorkHours: item.planTotalCompletionTime || 0,
      startTime: item.start_date || item.startTime || '',
      endTime: item.end_date || item.endTime || '',
    }));

    // 转换资源占有情况数据
    if (result.resourceName && result.resourceOccupancyRate) {
      resourceData.value = result.resourceName.map((name, index) => ({
        name,
        value: Number(result.resourceOccupancyRate[index]) || 0,
      }));
    }

    // 渲染资源占有情况图表
    const resourceNames = resourceData.value.map((item) => item.name);
    const resourceValues = resourceData.value.map((item) => item.value);

    if (resourceNames.length === 0 || resourceValues.length === 0) {
      console.warn('资源数据为空，无法渲染图表');
      return;
    }

    // 等待 DOM 更新后再渲染图表
    await nextTick();

    // 确保图表容器存在
    if (!resourceChartRef.value) {
      console.error('图表容器未找到');
      return;
    }

    renderResourceChart({
      grid: {
        left: 60,
        right: 40,
        top: 0,
        bottom: 20,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          show: true,
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: '#E5E8EF',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: resourceNames,
        axisLabel: {
          show: true,
          color: '#4E5969',
          fontSize: 12,
        },
        axisTick: {
          show: true,
          length: 2,
          lineStyle: {
            color: '#A9AEB8',
          },
          alignWithLabel: true,
        },
        axisLine: {
          lineStyle: {
            color: '#A9AEB8',
          },
        },
        inverse: true,
      } as any,
      tooltip: {
        trigger: 'axis',
      },
      series: [
        {
          data: resourceValues,
          type: 'bar',
          barWidth: 7,
          tooltip: {
            valueFormatter: (value: any) => `${value}%`,
          },
          itemStyle: {
            color: '#4086FF',
            borderRadius: 4,
          },
        },
      ],
      dataZoom: [
        {
          // 设置滚动条的隐藏或显示
          show: resourceNames.length > 7,
          // 设置类型
          type: 'slider',
          // 滚动条圆角
          borderRadius: 50,
          // 设置背景颜色
          backgroundColor: '#fff',
          // 设置选中范围的填充颜色
          fillerColor: '#E1E1E1',
          // 设置边框颜色
          borderColor: '#E1E1E1',
          // 是否显示detail，即拖拽时候显示详细数值信息
          showDetail: false,
          // 数据窗口范围的起始数值
          startValue: 0,
          // 数据窗口范围的结束数值（一页显示多少条数据）
          endValue: 5,
          // 控制哪个轴，如果是number表示控制一个轴，
          // 如果是Array表示控制多个轴。此处控制第二根轴
          yAxisIndex: [0],
          // empty：当前数据窗口外的数据，被设置为空。
          // 即不会影响其他轴的数据范围
          filterMode: 'empty',
          // 滚动条宽度
          width: 8,
          // 滚动条高度
          height: '90%',
          // 距离右边
          right: 2,
          // 控制手柄的尺寸
          handleSize: 0,
          // 是否锁定选择区域（或叫做数据窗口）的大小
          zoomLock: true,
          // 组件离容器上侧的距离
          // 如果top的值为'top', 'middle', 'bottom'，组件会根据相应的位置自动对齐
          top: 'middle',
          // 不可缩放 滑动条默认是有手柄可以进行展示的内容区域缩放的，不太美观
          brushSelect: false,
        },
        {
          // 没有下面这块的话，只能拖动滚动条，
          // 鼠标滚轮在区域内不能控制外部滚动条
          type: 'inside',
          // 控制哪个轴，如果是number表示控制一个轴，
          // 如果是Array表示控制多个轴。此处控制第二根轴
          yAxisIndex: [0],
          // 滚轮是否触发缩放
          zoomOnMouseWheel: false,
          // 鼠标移动能否触发平移
          moveOnMouseMove: true,
          // 鼠标滚轮能否触发平移
          moveOnMouseWheel: true,
        },
      ],
    });
  } catch (error) {
    ElMessage.error((error as Error).message || '获取项目计划分析数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  init();
});
</script>

<template>
  <Page
    title="项目计划分析"
    description="项目计划分析管理"
    :auto-content-height="true"
    content-class="project-plan-page-content"
  >
    <div class="project-plan-analysis-container" v-loading="loading">
      <!-- 项目计划总览 -->
      <ElCard class="gantt-card">
        <template #header>
          <div class="text-lg font-semibold">项目计划总览</div>
        </template>

        <div v-if="ganttData.length > 0" class="gantt-content">
          <!-- 甘特图表 -->
          <div class="gantt-table-wrapper">
            <table class="w-full border-collapse">
              <thead>
                <!-- 第一行：左侧数据列表头（跨两行）+ 右侧季度表头 -->
                <tr style="height: 24px">
                  <th
                    class="gantt-col-project border border-gray-200 p-1 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    项目号
                  </th>
                  <th
                    class="gantt-col-task border border-gray-200 p-1 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    任务名称
                  </th>
                  <th
                    class="gantt-col-hours border border-gray-200 p-1 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    计划工时
                  </th>
                  <th
                    class="gantt-col-date border border-gray-200 p-1 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    开始时间
                  </th>
                  <th
                    class="gantt-col-date border border-gray-200 p-1 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    结束时间
                  </th>
                  <th
                    class="border border-gray-200 p-0 dark:border-gray-700"
                    :colspan="monthList.length"
                    style="
                      height: 24px;
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    <!-- 季度表头 -->
                    <div class="flex h-full">
                      <div
                        v-for="(quarter, index) in quarterList"
                        :key="index"
                        class="flex items-center justify-center border-r border-gray-300 text-center text-sm font-semibold dark:border-gray-600"
                        :style="{
                          width: `${(quarter.monthCount / monthList.length) * 100}%`,
                          height: '100%',
                          color: 'var(--el-table-header-text-color)',
                        }"
                      >
                        {{ quarter.label }}
                      </div>
                    </div>
                  </th>
                </tr>
                <!-- 第二行：月份表头 -->
                <tr style="height: 24px">
                  <th
                    v-for="(month, index) in monthList"
                    :key="index"
                    class="border border-gray-200 p-2 text-center text-sm font-semibold dark:border-gray-700"
                    :style="{
                      minWidth: '80px',
                      height: '100%',
                      backgroundColor: 'var(--el-table-header-bg-color)',
                      color: 'var(--el-table-header-text-color)',
                    }"
                  >
                    {{ month.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- 数据行 -->
                <tr
                  v-for="(item, index) in ganttData"
                  :key="index"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                  style="height: 48px"
                >
                  <td
                    class="gantt-col-project border border-gray-200 p-1 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ item.projectId }}
                  </td>
                  <td
                    class="gantt-col-task border border-gray-200 p-1 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                    :title="item.taskName"
                  >
                    {{ item.taskName }}
                  </td>
                  <td
                    class="gantt-col-hours border border-gray-200 p-1 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ item.planWorkHours }} 天
                  </td>
                  <td
                    class="gantt-col-date border border-gray-200 p-1 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ dayjs(item.startTime).format('YYYY年MM月DD日') }}
                  </td>
                  <td
                    class="gantt-col-date border border-gray-200 p-1 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ dayjs(item.endTime).format('YYYY年MM月DD日') }}
                  </td>
                  <!-- 甘特图区域 -->
                  <td
                    class="relative border border-gray-200 p-0 dark:border-gray-700"
                    :colspan="monthList.length"
                    style="height: 48px"
                  >
                    <div class="relative h-full bg-gray-100 dark:bg-gray-700">
                      <div
                        class="absolute top-2 flex h-6 cursor-move items-center justify-center overflow-hidden rounded bg-blue-500 px-1 transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                        :style="{
                          left: `${calculateTaskPosition(item).left}%`,
                          width: `${calculateTaskPosition(item).width}%`,
                        }"
                        :title="`任务名称：${item.taskName}\n开始日期：${dayjs(item.startTime).format('YYYY年MM月DD日')}\n结束日期：${dayjs(item.endTime).format('YYYY年MM月DD日')}`"
                      >
                        <span
                          class="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-white"
                        >
                          {{ item.taskName }}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="py-8 text-center text-gray-400 dark:text-gray-500">
          暂无数据
        </div>
      </ElCard>

      <!-- 资源占有情况 -->
      <ElCard class="chart-card">
        <template #header>
          <div class="text-lg font-semibold">资源占有情况</div>
        </template>
        <div class="chart-content">
          <div class="chart-wrapper">
            <EchartsUI ref="resourceChartRef" />
          </div>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
:deep(.project-plan-page-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.project-plan-analysis-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.gantt-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  max-height: 50%;
  overflow: hidden;
}

.gantt-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

.gantt-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.gantt-table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.chart-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  max-height: 50%;
  overflow: hidden;
}

.chart-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

.chart-content {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-wrapper :deep(.echarts-container),
.chart-wrapper :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

/* 甘特图左侧列宽度控制 */
.gantt-col-project {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
}

.gantt-col-task {
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gantt-col-hours {
  width: 90px;
  min-width: 90px;
  max-width: 90px;
}

.gantt-col-date {
  width: 140px;
  min-width: 140px;
  max-width: 140px;
  font-size: 12px;
}

.cursor-move {
  cursor: move;
}
</style>
