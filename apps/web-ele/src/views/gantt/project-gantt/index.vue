<script lang="ts" setup>
import type {
  PlanTableItem,
  ProjectGanttLink,
} from '#/api/gantt/project-gantt';

import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
} from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard, ElMessage } from 'element-plus';

import { getProjectGanttDataApi } from '#/api/gantt/project-gantt';
import {
  ganttInstanceManager,
  generateGanttInstanceId,
} from '#/utils/gantt-instance-manager';

import 'dhtmlx-gantt/codebase/dhtmlxgantt';

import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

// 为当前页面生成唯一的实例ID
const instanceId = generateGanttInstanceId('project-gantt');
const ganttInstance = ganttInstanceManager.getInstance(instanceId);

const ganttContainer = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const ganttData = ref<PlanTableItem[]>([]);
const ganttLinks = ref<ProjectGanttLink[]>([]);

let ganttInitialized = false;
let destroyTimer: null | ReturnType<typeof setTimeout> = null;

const normalizeDate = (value?: null | string) => {
  if (!value) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return value;
};

const toDate = (value?: null | string) => {
  const normalized = normalizeDate(value ?? '');
  if (!normalized) {
    return null;
  }
  const segments = normalized.split('-').map(Number);
  if (segments.length !== 3 || segments.some((num) => Number.isNaN(num))) {
    return null;
  }
  const [year, month, day] = segments as [number, number, number];
  return new Date(year, month - 1, day);
};

const configureGantt = () => {
  ganttInstance.i18n.setLocale('cn');
  ganttInstance.config.readonly = true;
  ganttInstance.config.show_task_cells = true;
  ganttInstance.config.autofit = true;
  ganttInstance.config.autoscroll = true;
  ganttInstance.config.drag_progress = false;
  ganttInstance.config.fit_tasks = true;
  ganttInstance.config.scale_height = 40;
  ganttInstance.config.show_unscheduled = true;
  ganttInstance.config.show_progress = false;
  ganttInstance.config.auto_types = false;
  ganttInstance.config.xml_date = '%Y-%m-%d';
  ganttInstance.config.open_split_tasks = true;
  ganttInstance.config.columns = [
    { name: 'projectId', label: '项目号', align: 'center', width: 80 },
    { name: 'wbs', label: 'WBS', align: 'center', width: 80 },
    { name: 'taskName', label: '任务名称', align: 'center', width: 120 },
    {
      name: 'plannedConstructionPeriod',
      label: '计划工期',
      align: 'center',
      width: 90,
    },
    { name: 'startTime', label: '开始时间', align: 'center', width: 120 },
    { name: 'endTime', label: '结束时间', align: 'center', width: 120 },
  ];
  ganttInstance.plugins({
    tooltip: true,
  });
  ganttInstance.templates.tooltip_text = function (
    start: Date,
    end: Date,
    task: PlanTableItem,
  ) {
    return [
      `<b>任务名称：</b> ${task.text ?? task.taskName ?? ''}`,
      `<br/><b>开始日期：</b> ${ganttInstance.templates.tooltip_date_format(start)}`,
      `<br/><b>结束日期：</b> ${ganttInstance.templates.tooltip_date_format(end)}`,
    ].join('');
  };
};

const updateScaleRange = () => {
  if (ganttData.value.length === 0) {
    return;
  }
  const startDates = ganttData.value
    .map((item) => toDate(item.start_date) || toDate(item.startTime))
    .filter((date): date is Date => !!date);
  const endDates = ganttData.value
    .map((item) => toDate(item.end_date) || toDate(item.endTime))
    .filter((date): date is Date => !!date);
  if (startDates.length === 0 || endDates.length === 0) {
    return;
  }
  const minStart = new Date(
    Math.min(...startDates.map((date) => date.getTime())),
  );
  const maxEnd = new Date(Math.max(...endDates.map((date) => date.getTime())));
  const lastDay = new Date(
    maxEnd.getFullYear(),
    maxEnd.getMonth() + 1,
    0,
  ).getDate();

  ganttInstance.config.start_date = new Date(
    minStart.getFullYear(),
    minStart.getMonth(),
    1,
  );
  ganttInstance.config.end_date = new Date(
    maxEnd.getFullYear(),
    maxEnd.getMonth(),
    lastDay,
  );
  ganttInstance.config.scales = [
    {
      unit: 'quarter',
      step: 1,
      format(date: Date) {
        const month = date.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        return `${date.getFullYear()}年 第${quarter}季度`;
      },
    },
    { unit: 'month', step: 1, format: '%M' },
  ];
};

const renderGantt = async () => {
  if (!ganttContainer.value) {
    return;
  }
  // 等待 DOM 更新完成
  await nextTick();

  // 检查容器是否有尺寸
  const checkContainerSize = () => {
    if (!ganttContainer.value) {
      return false;
    }
    const rect = ganttContainer.value.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // 如果容器没有尺寸，等待一下再重试
  if (!checkContainerSize()) {
    setTimeout(() => {
      if (ganttContainer.value) {
        renderGantt();
      }
    }, 100);
    return;
  }

  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = null;
  }
  if (!ganttInitialized) {
    // 准备初始化（清理其他实例的数据）
    ganttInstanceManager.prepareInitialization(instanceId);
    configureGantt();
    ganttInstance.init(ganttContainer.value);
    ganttInstanceManager.setContainer(instanceId, ganttContainer.value);
    ganttInitialized = true;
  }
  updateScaleRange();
  ganttInstance.clearAll();
  ganttInstance.parse({
    data: ganttData.value,
    links: ganttLinks.value,
  });

  // 强制渲染，确保图表显示
  await nextTick();
  if (ganttInitialized && ganttContainer.value) {
    try {
      // 尝试调用 render 方法
      if (typeof (ganttInstance as any).render === 'function') {
        (ganttInstance as any).render();
      } else if (typeof (ganttInstance as any).updateView === 'function') {
        (ganttInstance as any).updateView();
      }
    } catch (error) {
      console.warn('[ProjectGantt] Error rendering gantt:', error);
    }
  }
};

const destroyGantt = () => {
  if (!ganttInitialized) {
    return;
  }
  // 使用管理器清理，而不是直接调用 clearAll 和 destructor
  // 这样可以避免影响其他正在使用的页面
  ganttInstanceManager.clearInstance(instanceId);
  ganttInstanceManager.destroyInstance(instanceId);
  ganttInitialized = false;
};

const fetchGanttData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await getProjectGanttDataApi();
    ganttData.value = res.projectGanttList ?? [];
    ganttLinks.value = res.projectGanttLinks ?? [];
    if (ganttData.value.length > 0) {
      // 等待 DOM 更新后再渲染
      await nextTick();
      await renderGantt();
    }
  } catch (error: any) {
    errorMessage.value = error?.message ?? '获取项目甘特图数据失败';
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGanttData();
});

onBeforeUnmount(() => {
  destroyGantt();
});

onDeactivated(() => {
  // 页面停用时，只清理数据，不销毁实例
  // 这样可以避免影响其他正在使用的页面
  if (ganttInitialized) {
    ganttInstanceManager.clearInstance(instanceId);
    // 标记为未初始化，这样重新激活时可以重新初始化
    ganttInitialized = false;
  }
});

onActivated(async () => {
  // 页面激活时，如果数据存在，重新渲染（会重新初始化）
  if (ganttData.value.length > 0) {
    await nextTick();
    await renderGantt();
  }
});
</script>

<template>
  <Page
    title="项目甘特图"
    description="项目甘特图管理"
    :auto-content-height="true"
    content-class="project-gantt-page-content"
  >
    <div class="project-gantt-page">
      <ElCard v-loading="loading" class="gantt-card">
        <template #header>
          <div class="text-lg font-semibold">项目甘特图</div>
        </template>
        <div class="gantt-body">
          <div v-if="errorMessage" class="gantt-status gantt-status--error">
            {{ errorMessage }}
          </div>
          <div
            v-else-if="!loading && ganttData.length === 0"
            class="gantt-status"
          >
            暂无甘特数据
          </div>
          <div
            v-show="ganttData.length > 0"
            ref="ganttContainer"
            class="gantt-container"
          ></div>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
:deep(.project-gantt-page-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.project-gantt-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.gantt-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.gantt-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 16px;
}

.gantt-body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.gantt-container {
  flex: 1;
  min-height: 500px;
}

.gantt-status {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.gantt-status--error {
  color: var(--el-color-error);
}
</style>
