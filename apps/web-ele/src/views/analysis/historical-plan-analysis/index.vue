<!-- 
  历史计划分析页面
  从上到下依次为：
  历史计划总览：
  表格：计划号、项目数、总任务数、计划工期、开始时间、结束时间

  历史计划展示：                      计划号：请选择（选择框）
  甘特图类型图表：
    项目号、任务名称、计划工期、开始时间、结束时间、甘特图部分（可拖拽调整）

-->
<script lang="ts" setup>
import type {
  HistoryPlanAnalysisData,
  HistoryPlanTableItem,
  PlanOption,
} from '#/api/analysis/historical-plan-analysis';
import type { PlanTableItem } from '#/api/analysis/project-plan-analysis';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElCard,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getHistoryPlanAnalysisApi } from '#/api/analysis/historical-plan-analysis';

const overviewData = ref<HistoryPlanTableItem[]>([]);
const normalizePlanId = (value: unknown) => String(value ?? '').trim();
const planOptions = ref<PlanOption[]>([]);
const selectedPlan = ref<null | PlanOption>(null);
const ganttData = ref<PlanTableItem[]>([]);
const pageLoading = ref(false);
const errorMessage = ref('');

const filteredGanttData = computed(() => {
  const targetPlanId = normalizePlanId(selectedPlan.value?.label);
  if (!targetPlanId) {
    return [];
  }
  return ganttData.value.filter(
    (task) => normalizePlanId(task.planId) === targetPlanId,
  );
});

const convertChineseDateToISO = (value: null | string | undefined) => {
  if (!value) {
    return '';
  }
  const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, year, month, day] = match;
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }
  return value;
};

const getTaskDate = (task: PlanTableItem, type: 'end' | 'start') => {
  const primary = type === 'start' ? task.start_date : task.end_date;
  if (primary) {
    return primary;
  }
  const fallback = type === 'start' ? task.startTime : task.endTime;
  return convertChineseDateToISO(fallback);
};

const formatDisplayDate = (task: PlanTableItem, type: 'end' | 'start') => {
  const date = getTaskDate(task, type);
  if (!date) {
    return '--';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return dayjs(date).format('YYYY年MM月DD日');
  }
  return date;
};

const timeRange = computed(() => {
  if (filteredGanttData.value.length === 0) {
    return { start: '', end: '' };
  }

  const startDates = filteredGanttData.value
    .map((item) => getTaskDate(item, 'start'))
    .filter(Boolean);
  const endDates = filteredGanttData.value
    .map((item) => getTaskDate(item, 'end'))
    .filter(Boolean);

  if (startDates.length === 0 || endDates.length === 0) {
    return { start: '', end: '' };
  }

  const sortedStartDates = [...startDates].sort(
    (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
  );
  const sortedEndDates = [...endDates].sort(
    (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
  );

  return {
    start: sortedStartDates[0],
    end: sortedEndDates[sortedEndDates.length - 1],
  };
});

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
      currentQuarter.monthCount += 1;
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

function calculateTaskPosition(task: PlanTableItem) {
  if (
    !timeRange.value.start ||
    !timeRange.value.end ||
    monthList.value.length === 0
  ) {
    return { left: 0, width: 0 };
  }

  const rangeStart = dayjs(timeRange.value.start);
  const rangeEnd = dayjs(timeRange.value.end);
  const taskStart = dayjs(getTaskDate(task, 'start'));
  const taskEnd = dayjs(getTaskDate(task, 'end'));
  const totalDays = Math.max(rangeEnd.diff(rangeStart, 'day'), 1);
  const taskStartDays = Math.max(taskStart.diff(rangeStart, 'day'), 0);
  const taskDuration = Math.max(taskEnd.diff(taskStart, 'day') + 1, 1);
  const left = (taskStartDays / totalDays) * 100;
  const width = (taskDuration / totalDays) * 100;
  return {
    left: Math.min(100, Math.max(0, left)),
    width: Math.min(100 - Math.min(100, Math.max(0, left)), Math.max(0, width)),
  };
}

const fetchHistoryPlanAnalysis = async () => {
  pageLoading.value = true;
  errorMessage.value = '';
  try {
    const data: HistoryPlanAnalysisData = await getHistoryPlanAnalysisApi();
    overviewData.value = data.tableList ?? [];
    planOptions.value = data.ganttOptions ?? [];
    ganttData.value = data.projectGanttList ?? [];

    if (!selectedPlan.value && planOptions.value.length > 0) {
      const [firstOption] = planOptions.value;
      selectedPlan.value = firstOption ?? null;
    }
  } catch (error: any) {
    errorMessage.value = error?.message ?? '获取历史计划分析数据失败';
    ElMessage.error(errorMessage.value);
  } finally {
    pageLoading.value = false;
  }
};

watch(
  planOptions,
  (options) => {
    if (options.length === 0) {
      selectedPlan.value = null;
      return;
    }
    const currentPlanId = normalizePlanId(selectedPlan.value?.label);
    const matched = options.find((option) => {
      const optionPlanId =
        normalizePlanId(option.value) || normalizePlanId(option.label);
      return optionPlanId === currentPlanId;
    });
    if (!matched) {
      selectedPlan.value = options[0] ?? null;
    }
  },
  { deep: true },
);

onMounted(fetchHistoryPlanAnalysis);
</script>

<template>
  <Page
    title="历史计划分析"
    description="历史计划分析管理"
    :auto-content-height="true"
    content-class="history-plan-page-content"
  >
    <div class="history-plan-page">
      <!-- 历史计划总览 -->
      <ElCard v-loading="pageLoading" class="history-card">
        <template #header>
          <div class="text-lg font-semibold">历史计划总览</div>
        </template>
        <div class="history-card__body">
          <ElTable :data="overviewData" style="width: 100%" height="100%">
            <ElTableColumn
              prop="planId"
              label="计划号"
              min-width="140"
              align="center"
            />
            <ElTableColumn
              prop="projectNum"
              label="项目数"
              min-width="100"
              align="center"
            />
            <ElTableColumn
              prop="taskNum"
              label="总任务数"
              min-width="120"
              align="center"
            />
            <ElTableColumn
              prop="totalCompletionTime"
              label="计划工期"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                {{ row.totalCompletionTime }} 天
              </template>
            </ElTableColumn>
            <ElTableColumn
              prop="startDate"
              label="开始时间"
              min-width="140"
              align="center"
            />
            <ElTableColumn
              prop="endDate"
              label="结束时间"
              min-width="140"
              align="center"
            />
          </ElTable>
        </div>
      </ElCard>

      <!-- 历史计划展示 -->
      <ElCard v-loading="pageLoading" class="history-card">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">历史计划展示</div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">计划号：</span>
              <ElSelect
                v-model="selectedPlan"
                placeholder="请选择"
                style="width: 200px"
                :disabled="planOptions.length === 0"
                value-key="label"
                clearable
              >
                <ElOption
                  v-for="item in planOptions"
                  :key="item.label"
                  :label="item.label"
                  :value="item"
                />
              </ElSelect>
            </div>
          </div>
        </template>

        <div
          v-if="selectedPlan && filteredGanttData.length > 0"
          class="history-card__body history-card__body--gantt"
        >
          <!-- 甘特图表 - 一张表，表头高度一致 -->
          <div
            class="gantt-table-wrapper rounded border border-gray-200 dark:border-gray-700"
          >
            <table class="gantt-table w-full border-collapse">
              <thead>
                <!-- 第一行：左侧数据列表头（跨两行）+ 右侧季度表头 -->
                <tr style="height: 24px">
                  <th
                    class="info-head info-head--project border border-gray-200 p-2 text-center dark:border-gray-700"
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
                    class="info-head info-head--task border border-gray-200 p-2 text-center dark:border-gray-700"
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
                    class="info-head info-head--duration border border-gray-200 p-2 text-center dark:border-gray-700"
                    rowspan="2"
                    style="
                      height: 48px;
                      color: var(--el-table-header-text-color);
                      background-color: var(--el-table-header-bg-color);
                    "
                  >
                    计划工期
                  </th>
                  <th
                    class="info-head info-head--date border border-gray-200 p-2 text-center dark:border-gray-700"
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
                    class="info-head info-head--date border border-gray-200 p-2 text-center dark:border-gray-700"
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
                    class="month-head border border-gray-200 p-2 text-center text-sm font-semibold dark:border-gray-700"
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
                  v-for="(item, index) in filteredGanttData"
                  :key="index"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                  style="height: 48px"
                >
                  <td
                    class="info-cell info-cell--project border border-gray-200 p-2 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ item.projectId }}
                  </td>
                  <td
                    class="info-cell info-cell--task border border-gray-200 p-2 text-left text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    <span class="block truncate">{{ item.taskName }}</span>
                  </td>
                  <td
                    class="info-cell info-cell--duration border border-gray-200 p-2 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{
                      item.plannedConstructionPeriod ||
                      `${item.planTotalCompletionTime ?? 0} 天`
                    }}
                  </td>
                  <td
                    class="info-cell info-cell--date border border-gray-200 p-2 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ formatDisplayDate(item, 'start') }}
                  </td>
                  <td
                    class="info-cell info-cell--date border border-gray-200 p-2 text-center text-gray-900 dark:border-gray-700 dark:text-gray-100"
                  >
                    {{ formatDisplayDate(item, 'end') }}
                  </td>
                  <!-- 甘特图区域 -->
                  <td
                    class="gantt-cell relative border border-gray-200 p-0 dark:border-gray-700"
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
                        :title="`任务名称：${item.taskName}\n开始日期：${formatDisplayDate(item, 'start')}\n结束日期：${formatDisplayDate(item, 'end')}`"
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
          <template v-if="errorMessage">
            {{ errorMessage }}
          </template>
          <template v-else-if="pageLoading"> 加载中... </template>
          <template v-else-if="planOptions.length === 0">
            暂无计划数据
          </template>
          <template v-else-if="selectedPlan"> 当前计划暂无甘特数据 </template>
          <template v-else> 请选择计划号以查看甘特图 </template>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
:deep(.history-plan-page-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.history-plan-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.history-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  max-height: 50%;
  overflow: hidden;
}

.history-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 16px;
  overflow: hidden;
}

.history-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.history-card__body--gantt {
  padding: 0 0 8px;
  overflow: hidden;
}

.gantt-table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.gantt-table {
  min-width: 960px;
}

.info-head,
.info-cell {
  width: 90px;
  white-space: nowrap;
}

.info-head--task,
.info-cell--task {
  width: 180px;
}

.info-head--duration,
.info-cell--duration {
  width: 110px;
}

.info-head--date,
.info-cell--date {
  width: 140px;
}

.info-cell--task .truncate {
  max-width: 170px;
}

.gantt-cell {
  min-width: 600px;
}

.month-head {
  font-size: 12px;
}

.cursor-move {
  cursor: move;
}
</style>
