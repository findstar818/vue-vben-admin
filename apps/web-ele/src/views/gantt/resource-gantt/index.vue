<script lang="ts" setup>
import type {
  ResourceGanttItem,
  ResourceGanttPayload,
} from '#/api/gantt/resource-gantt';

import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
} from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElCard,
  ElEmpty,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
} from 'element-plus';

import { getResourceGanttDataApi } from '#/api/gantt/resource-gantt';
import {
  ganttInstanceManager,
  generateGanttInstanceId,
} from '#/utils/gantt-instance-manager';

import 'dhtmlx-gantt/codebase/dhtmlxgantt';

import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

// 为当前页面生成唯一的实例ID
const instanceId = generateGanttInstanceId('resource-gantt');
const ganttInstance = ganttInstanceManager.getInstance(instanceId);

const ganttContainer = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const resourceTasks = ref<ResourceGanttItem[]>([]);
const scalesValue = ref<'month' | 'quarter' | 'week' | 'year'>('quarter');
const scalesOptions = [
  { label: '日视图', value: 'month' },
  { label: '周视图', value: 'week' },
  { label: '季度视图', value: 'quarter' },
  { label: '年视图', value: 'year' },
];

const scalesInfo = {
  levels: [
    {
      name: 'quarter',
      scales: [
        {
          unit: 'quarter',
          step: 1,
          format(date: Date) {
            const month = date.getMonth() + 1;
            const quarter = Math.ceil(month / 3);
            return `${date.getFullYear()}年第${quarter}季度`;
          },
        },
        { unit: 'month', step: 1, format: '%M' },
      ],
    },
    {
      name: 'year',
      scales: [
        {
          unit: 'year',
          step: 1,
          format(date: Date) {
            return `${date.getFullYear()}年`;
          },
        },
        {
          unit: 'quarter',
          step: 1,
          format(date: Date) {
            const quarter = Math.floor((date.getMonth() + 3) / 3);
            return `第${quarter}季度`;
          },
        },
      ],
    },
    {
      name: 'month',
      scales: [
        {
          unit: 'month',
          step: 1,
          format(date: Date) {
            const month = date.getMonth() + 1;
            return `${date.getFullYear()}年${month}月`;
          },
        },
        {
          unit: 'day',
          step: 1,
          format(date: Date) {
            return `${date.getDate()}`;
          },
        },
      ],
    },
    {
      name: 'week',
      scales: [
        {
          unit: 'month',
          step: 1,
          format(date: Date) {
            const month = date.getMonth() + 1;
            return `${date.getFullYear()}年${month}月`;
          },
        },
        {
          unit: 'week',
          step: 1,
          format(date: Date) {
            const firstDayOfMonth = new Date(
              date.getFullYear(),
              date.getMonth(),
              1,
            );
            const firstDayWeekDay = firstDayOfMonth.getDay();
            const currentDate = date.getDate();
            let firstWeekDays = 7 - firstDayWeekDay;
            if (firstDayWeekDay === 0) {
              firstWeekDays = 7;
            }
            if (currentDate <= firstWeekDays) {
              return '第1周';
            }
            const week = Math.ceil((currentDate - firstWeekDays) / 7) + 1;
            return `第${week}周`;
          },
        },
      ],
    },
  ],
};

let ganttInitialized = false;
let eventsBound = false;
let destroyTimer: null | ReturnType<typeof setTimeout> = null;

const configureGantt = () => {
  ganttInstance.i18n.setLocale('cn');
  ganttInstance.config.readonly = false;
  ganttInstance.config.show_task_cells = true;
  ganttInstance.config.autofit = true;
  ganttInstance.config.autoscroll = true;
  ganttInstance.config.drag_progress = false;
  ganttInstance.config.fit_tasks = true;
  ganttInstance.config.scale_height = 40;
  ganttInstance.config.show_unscheduled = true;
  ganttInstance.config.show_links = false;
  ganttInstance.config.auto_types = false;
  ganttInstance.config.details_on_dblclick = false;
  ganttInstance.config.xml_date = '%Y-%m-%d';
  ganttInstance.config.open_split_tasks = true;
  ganttInstance.config.columns = [
    {
      name: 'resourceName',
      label: '资源名称',
      align: 'center',
      width: 140,
      tree: true,
    },
    {
      name: 'resourceOccupancyRate',
      label: '资源占有率',
      align: 'center',
      width: 100,
      template(task: ResourceGanttItem & { progress?: number }) {
        if (task.type === 'project') {
          const percent = (task.progress ?? 0) * 100;
          return `${Math.round(percent)}%`;
        }
        return '';
      },
    },
  ];
  ganttInstance.plugins({
    tooltip: true,
  });
  ganttInstance.templates.tooltip_text = function (
    start: Date,
    end: Date,
    task: ResourceGanttItem & { progress?: number },
  ) {
    if (task.type === 'project') {
      const percent = (task.progress ?? 0) * 100;
      return `<b>${task.resourceName}</b><br/><b>资源占有率：</b>${percent}%`;
    }
    if (task.type === 'task') {
      return [
        `<b>${task.projectName ?? ''}</b>`,
        `<br/><b>${task.taskName ?? task.text ?? ''}</b>`,
        `<br/><b>开始日期：</b>${ganttInstance.templates.tooltip_date_format(start)}`,
        `<br/><b>结束日期：</b>${ganttInstance.templates.tooltip_date_format(end)}`,
      ].join('');
    }
    return `<b>${task.taskName ?? task.text ?? ''}</b>`;
  };
  if (ganttInstance.ext?.zoom) {
    ganttInstance.ext.zoom.init(scalesInfo);
  }
};

const updateScaleAndRange = () => {
  const validStartDates = resourceTasks.value
    .map((item) => (item.start_date ? new Date(item.start_date) : null))
    .filter((date): date is Date => !!date && !Number.isNaN(date.valueOf()));
  const validEndDates = resourceTasks.value
    .map((item) => (item.end_date ? new Date(item.end_date) : null))
    .filter((date): date is Date => !!date && !Number.isNaN(date.valueOf()));

  if (validStartDates.length === 0 || validEndDates.length === 0) {
    return;
  }
  const minStart = new Date(
    Math.min(...validStartDates.map((date) => date.getTime())),
  );
  const maxEnd = new Date(
    Math.max(...validEndDates.map((date) => date.getTime())),
  );

  const nextMonthFirstDay = new Date(
    minStart.getFullYear(),
    minStart.getMonth() + 1,
    1,
  );
  const lastDay =
    nextMonthFirstDay.getDay() === 0
      ? 31
      : (nextMonthFirstDay.getDay() + 1) * 2 - 1;

  ganttInstance.config.start_date = new Date(
    minStart.getFullYear(),
    minStart.getMonth(),
    1,
  );
  ganttInstance.config.end_date = new Date(
    maxEnd.getFullYear() + 1,
    maxEnd.getMonth(),
    lastDay,
  );
  if (ganttInstance.ext?.zoom) {
    ganttInstance.ext.zoom.setLevel(scalesValue.value);
  }
};

const calculateOverlap = (
  taskA: ResourceGanttItem,
  taskB: ResourceGanttItem,
) => {
  if (
    !taskA.start_date ||
    !taskA.end_date ||
    !taskB.start_date ||
    !taskB.end_date
  ) {
    return null;
  }
  const start1 = new Date(taskA.start_date).getTime();
  const end1 = new Date(taskA.end_date).getTime();
  const start2 = new Date(taskB.start_date).getTime();
  const end2 = new Date(taskB.end_date).getTime();
  if (end1 <= start2 || start1 >= end2) {
    return null;
  }
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  return {
    start: new Date(overlapStart),
    end: new Date(overlapEnd),
  };
};

const bindOverlapHandlers = () => {
  if (eventsBound) {
    return;
  }
  eventsBound = true;

  ganttInstance.attachEvent(
    'onBeforeSplitTaskDisplay',
    (childTaskId: number | string) => {
      const overlapTaskList: any[] = [];
      const currentTask = ganttInstance.getTask(childTaskId);
      const parentId = ganttInstance.getParent(childTaskId);
      const siblings = ganttInstance.getChildren(parentId);
      for (let i = siblings.indexOf(childTaskId); i < siblings.length; i += 1) {
        const siblingId = siblings[i];
        if (childTaskId === siblingId) {
          continue;
        }
        if (String(siblingId).startsWith('overlap_')) {
          continue;
        }
        const overlap = calculateOverlap(
          currentTask,
          ganttInstance.getTask(siblingId),
        );
        if (overlap) {
          overlapTaskList.push({
            id: `overlap_${childTaskId}_${siblingId}`,
            resourceName: '占有重叠',
            text: '',
            taskName: '资源占有重叠标记',
            start_date: overlap.start,
            end_date: overlap.end,
            type: '',
            color: 'red',
            readonly: true,
            parent: parentId,
          });
        }
      }
      overlapTaskList.forEach((overlapTask) => {
        ganttInstance.addTask(overlapTask, parentId);
      });
    },
  );

  ganttInstance.attachEvent('onAfterTaskDrag', (taskId: number | string) => {
    const parentId = ganttInstance.getParent(taskId);
    let children = ganttInstance.getChildren(parentId);
    const overlapForDelete: string[] = [];
    children.forEach((child: number | string) => {
      if (String(child).startsWith('overlap_')) {
        overlapForDelete.push(String(child));
      }
    });
    overlapForDelete.forEach((overlapTaskId) => {
      ganttInstance.deleteTask(overlapTaskId);
    });
    children = ganttInstance.getChildren(parentId);
    const overlapForAdd: any[] = [];
    for (let i = 0; i < children.length; i += 1) {
      for (let j = i + 1; j < children.length; j += 1) {
        const taskA = ganttInstance.getTask(children[i]);
        const taskB = ganttInstance.getTask(children[j]);
        const overlap = calculateOverlap(taskA, taskB);
        if (overlap) {
          overlapForAdd.push({
            id: `overlap_${children[i]}_${children[j]}`,
            resourceName: '占有重叠',
            text: '',
            taskName: '资源占有重叠标记',
            start_date: overlap.start,
            end_date: overlap.end,
            type: '',
            color: 'red',
            readonly: true,
            parent: parentId,
          });
        }
      }
    }
    overlapForAdd.forEach((overlapTask) => {
      ganttInstance.addTask(overlapTask, parentId);
    });
  });
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
    bindOverlapHandlers();
    ganttInitialized = true;
  }
  updateScaleAndRange();
  ganttInstance.clearAll();
  ganttInstance.parse({ data: resourceTasks.value });

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
      console.warn('[ResourceGantt] Error rendering gantt:', error);
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
  eventsBound = false;
};

const normalizeRawDate = (value: Date | null | string | undefined) => {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const dateText = String(value).trim();
  if (!dateText) {
    return '';
  }
  const chineseMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (chineseMatch) {
    const [, year, month, day] = chineseMatch;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const sanitized = (
    dateText.replaceAll(/[./]/g, '-').replaceAll('T', ' ').split(' ')[0] ?? ''
  ).trim();
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(sanitized)) {
    const timestamp = Date.parse(dateText);
    if (!Number.isNaN(timestamp)) {
      const dateObj = new Date(timestamp);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }
  const date = new Date(sanitized);
  if (!Number.isNaN(date.valueOf())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

const normalizeResourceTasks = (
  payload: ResourceGanttPayload,
): ResourceGanttItem[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.resourceGanttList)) {
    return payload.resourceGanttList;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const convertResourceTasks = (
  tasks: ResourceGanttItem[],
): ResourceGanttItem[] => {
  const normalized = tasks.map((item) => {
    const normalizedStart = normalizeRawDate(
      item.start_date || (item as any).startDate || (item as any).startTime,
    );
    const normalizedEnd = normalizeRawDate(
      item.end_date || (item as any).endDate || (item as any).endTime,
    );
    return {
      ...item,
      start_date: normalizedStart,
      end_date: normalizedEnd,
      text: item.text || item.taskName || item.resourceName,
      parent: item.parent ?? '',
    };
  });

  const childRanges = new Map<
    string,
    {
      end: number;
      start: number;
    }
  >();

  normalized.forEach((task) => {
    if (!task.parent) {
      return;
    }
    const startTs = Date.parse(task.start_date);
    const endTs = Date.parse(task.end_date);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
      return;
    }
    const existing = childRanges.get(task.parent);
    if (existing) {
      existing.start = Math.min(existing.start, startTs);
      existing.end = Math.max(existing.end, endTs);
    } else {
      childRanges.set(task.parent, { start: startTs, end: endTs });
    }
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  normalized.forEach((task) => {
    if (task.type !== 'project' || (task.start_date && task.end_date)) {
      return;
    }
    const range = childRanges.get(task.id) || childRanges.get(task.sortId);
    if (range) {
      task.start_date = formatDate(range.start);
      task.end_date = formatDate(range.end);
    }
  });

  return normalized;
};

const fetchResourceGantt = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload = await getResourceGanttDataApi();
    const rawTasks = normalizeResourceTasks(payload);
    resourceTasks.value = convertResourceTasks(rawTasks);
    console.log(
      '[ResourceGantt] raw payload:',
      payload,
      '\nraw tasks:',
      rawTasks,
      '\nnormalized:',
      resourceTasks.value,
    );
    if (resourceTasks.value.length > 0) {
      // 等待 DOM 更新后再渲染
      await nextTick();
      await renderGantt();
    }
  } catch (error: any) {
    errorMessage.value = error?.message ?? '获取资源甘特图数据失败';
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

const handleScaleChange = (value: boolean | number | string | undefined) => {
  const nextValue = String(value ?? '') as
    | 'month'
    | 'quarter'
    | 'week'
    | 'year';
  scalesValue.value = nextValue;
  if (ganttInstance.ext?.zoom) {
    ganttInstance.ext.zoom.setLevel(nextValue);
  }
};

onMounted(() => {
  fetchResourceGantt();
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
    // 注意：事件绑定不需要移除，因为它们是全局的
    // 但我们可以选择移除，以避免冲突
    // eventsBound = false; // 可选：如果需要移除事件绑定
  }
});

onActivated(async () => {
  // 页面激活时，如果数据存在，重新渲染（会重新初始化）
  if (resourceTasks.value.length > 0) {
    await nextTick();
    await renderGantt();
  }
});
</script>

<template>
  <Page
    title="资源甘特图"
    description="资源甘特图管理"
    :auto-content-height="true"
    content-class="resource-gantt-page-content"
  >
    <div class="resource-gantt-page">
      <ElCard v-loading="loading" class="gantt-card">
        <template #header>
          <div class="card-header">
            <div class="text-lg font-semibold">资源甘特图</div>
            <ElRadioGroup
              v-model="scalesValue"
              size="small"
              @change="handleScaleChange"
            >
              <ElRadioButton
                v-for="option in scalesOptions"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </ElRadioButton>
            </ElRadioGroup>
          </div>
        </template>

        <div class="gantt-body">
          <div v-if="errorMessage" class="gantt-status gantt-status--error">
            {{ errorMessage }}
          </div>
          <ElEmpty
            v-else-if="!loading && resourceTasks.length === 0"
            description="暂无资源甘特数据"
          />
          <div
            v-show="resourceTasks.length > 0"
            ref="ganttContainer"
            class="gantt-container"
          ></div>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
:deep(.resource-gantt-page-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.resource-gantt-page {
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

.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.gantt-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.gantt-container {
  flex: 1;
  min-height: 520px;
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
