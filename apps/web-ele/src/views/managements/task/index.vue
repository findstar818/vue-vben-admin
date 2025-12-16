<!-- 任务管理：页面组成：Page头部：任务列表  下面为选择框  项目名称： 选择框内选择项目名称   
横线隔开
最左侧按钮：添加任务，修改任务  最右侧按钮：新增项目导入
下面为表格  项目名称  任务编号  任务名称 最大工期  最小工期  计划工期  前置任务编号  资源设备
-->
<script lang="ts" setup>
import type { FormInstance, UploadRawFile } from 'element-plus';

import type { Option, TaskData, TaskDataDisplay } from '#/api/management/task';

import { computed, h, nextTick, onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSpace,
  ElTableV2,
  ElUpload,
} from 'element-plus';
import * as XLSX from 'xlsx';

import {
  addExcelTaskApi,
  addTaskApi,
  editTaskApi,
  getProjectNameOptionsApi,
  getResourceOptionsApi,
  getTaskListApi,
} from '#/api/management/task';

// 加载状态
const loading = ref(false);

// 项目名称下拉选项
const projectOptions = ref<Option[]>([]);

// 选中的项目
const selectedProject = ref('');

// 任务列表数据
const tableData = ref<TaskDataDisplay[]>([]);
const listOrgData = ref<TaskDataDisplay[]>([]);

// 选中的行
const selectedRows = ref<TaskDataDisplay[]>([]);
// 选中的行 key 集合（用于虚拟表格）
const selectedRowKeys = ref<Set<string>>(new Set());

// 添加任务对话框显示状态
const visibleAdd = ref(false);

// 修改任务对话框显示状态
const visibleEdit = ref(false);

// 表单引用
const formRef = ref<FormInstance>();

// 添加任务表单数据
const taskAddForm = ref<TaskData>({
  projectId: '',
  taskId: '',
  taskSequence: '',
  wbs: '',
  taskName: '',
  taskPriority: '',
  taskClass: '',
  isLeafTask: '',
  parentTaskWbs: '',
  planTimeUb: '',
  planTimeLb: '',
  planTimeTarget: '',
  prepositionTaskId: [],
  delayTime: '',
  prepositionType: '',
  resource: [],
});

// 修改任务表单数据
const taskEditForm = ref<TaskData>({
  projectId: '',
  taskId: '',
  taskSequence: '',
  wbs: '',
  taskName: '',
  taskPriority: '',
  taskClass: '',
  isLeafTask: '',
  parentTaskWbs: '',
  planTimeUb: '',
  planTimeLb: '',
  planTimeTarget: '',
  prepositionTaskId: [],
  delayTime: '',
  prepositionType: '',
  resource: [],
});

// 前置任务WBS下拉选项
const prepositionTaskIdOptions = ref<Option[]>([]);

// 前置类型下拉选项
const prepositionTypeOptions = ref<Option[]>([
  { label: '完成-开始', value: 'FS' },
  { label: '完成-完成', value: 'FF' },
  { label: '开始-开始', value: 'SS' },
  { label: '开始-完成', value: 'SF' },
]);

// 资源设备下拉选项
const resourceOptions = ref<Option[]>([]);

// 表格容器引用和尺寸
const tableWrapperRef = ref<HTMLElement>();
const tableWidth = ref(0);
const tableHeight = ref(0);

// 更新表格尺寸
const updateTableSize = () => {
  if (tableWrapperRef.value) {
    const rect = tableWrapperRef.value.getBoundingClientRect();
    tableWidth.value = rect.width;
    tableHeight.value = rect.height;
  }
};

// 监听窗口大小变化
let resizeObserver: null | ResizeObserver = null;
onMounted(async () => {
  await init();
  // 等待 DOM 渲染完成后再设置 ResizeObserver
  await nextTick();
  if (tableWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateTableSize();
    });
    resizeObserver.observe(tableWrapperRef.value);
    // 初始计算尺寸
    updateTableSize();
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// 表格列配置（虚拟滚动表格使用）
const columns = computed<any[]>(() => {
  const baseColumns = [
    {
      key: 'selection',
      dataKey: 'selection',
      title: '',
      width: 55,
      fixed: 'left',
      cellRenderer: ({ rowData }: { rowData: TaskDataDisplay }) => {
        const isSelected = selectedRowKeys.value.has(rowData.taskId);
        return h(ElCheckbox, {
          modelValue: isSelected,
          'onUpdate:modelValue': (val: any) => {
            handleRowSelect(rowData, Boolean(val));
          },
          onClick: (e: Event) => {
            e.stopPropagation();
          },
        });
      },
      headerCellRenderer: () => {
        const isAllSelected =
          tableData.value.length > 0 &&
          tableData.value.every((row) => selectedRowKeys.value.has(row.taskId));
        const isIndeterminate =
          !isAllSelected &&
          tableData.value.some((row) => selectedRowKeys.value.has(row.taskId));
        return h(ElCheckbox, {
          modelValue: isAllSelected,
          indeterminate: isIndeterminate,
          'onUpdate:modelValue': (val: any) => {
            handleSelectAll(Boolean(val));
          },
        });
      },
    },
    {
      key: 'projectName',
      dataKey: 'projectName',
      title: '项目名称',
      width: 120,
    },
    {
      key: 'wbs',
      dataKey: 'wbs',
      title: '任务编号',
      width: 120,
    },
    {
      key: 'taskName',
      dataKey: 'taskName',
      title: '任务名称',
      width: 200,
      flexGrow: 1,
      flexShrink: 0,
    },
    {
      key: 'planTimeUb',
      dataKey: 'planTimeUb',
      title: '最大工期',
      width: 100,
    },
    {
      key: 'planTimeLb',
      dataKey: 'planTimeLb',
      title: '最小工期',
      width: 100,
    },
    {
      key: 'planTimeTarget',
      dataKey: 'planTimeTarget',
      title: '计划工期',
      width: 100,
    },
    {
      key: 'perWbs',
      dataKey: 'perWbs',
      title: '前置任务编号',
      width: 130,
    },
    {
      key: 'resourceName',
      dataKey: 'resourceName',
      title: '资源设备',
      width: 200,
      flexGrow: 1,
      flexShrink: 0,
    },
  ];
  return baseColumns;
});

// 处理行选择
const handleRowSelect = (row: TaskDataDisplay, selected: boolean) => {
  if (selected) {
    selectedRowKeys.value.add(row.taskId);
    if (!selectedRows.value.find((r) => r.taskId === row.taskId)) {
      selectedRows.value.push(row);
    }
  } else {
    selectedRowKeys.value.delete(row.taskId);
    selectedRows.value = selectedRows.value.filter(
      (r) => r.taskId !== row.taskId,
    );
  }
};

// 处理全选
const handleSelectAll = (selected: boolean) => {
  if (selected) {
    tableData.value.forEach((row) => {
      selectedRowKeys.value.add(row.taskId);
      if (!selectedRows.value.find((r) => r.taskId === row.taskId)) {
        selectedRows.value.push(row);
      }
    });
  } else {
    tableData.value.forEach((row) => {
      selectedRowKeys.value.delete(row.taskId);
    });
    selectedRows.value = [];
  }
};

// 初始化数据
const init = async () => {
  loading.value = true;
  try {
    // 获取任务列表
    const taskList = await getTaskListApi();
    listOrgData.value = taskList;
    tableData.value = taskList;

    // 获取项目名称下拉选项
    const projectOptionsList = await getProjectNameOptionsApi();
    projectOptions.value = projectOptionsList;
  } catch (error) {
    ElMessage.error((error as Error).message || '获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 项目选择变化
const handleProjectChange = (value: string) => {
  // 清空选择
  selectedRowKeys.value.clear();
  selectedRows.value = [];

  if (!value || value === '') {
    tableData.value = listOrgData.value;
    return;
  }

  tableData.value = listOrgData.value.filter(
    (item) => item.projectId === value,
  );
};

// 打开添加任务对话框
const handleAddTask = async () => {
  // 重置表单
  taskAddForm.value = {
    projectId: '',
    taskId: '',
    taskSequence: '',
    wbs: '',
    taskName: '',
    taskPriority: '',
    taskClass: '',
    isLeafTask: '',
    parentTaskWbs: '',
    planTimeUb: '',
    planTimeLb: '',
    planTimeTarget: '',
    prepositionTaskId: [],
    delayTime: '',
    prepositionType: '',
    resource: [],
  };

  // 初始化下拉选项
  await initPopup();
  visibleAdd.value = true;
};

// 打开修改任务对话框
const handleModifyTask = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行修改');
    return;
  }

  const selectedItem = selectedRows.value[0];
  if (!selectedItem) return;

  // 填充表单数据（注意：原项目中没有完整的编辑表单数据，这里需要根据实际数据结构调整）
  taskEditForm.value = {
    projectId: selectedItem.projectId || '',
    taskId: selectedItem.taskId || '',
    taskSequence: '',
    wbs: selectedItem.wbs || '',
    taskName: selectedItem.taskName || '',
    taskPriority: '',
    taskClass: selectedItem.taskClass || '',
    isLeafTask: '',
    parentTaskWbs: '',
    planTimeUb: selectedItem.planTimeUb || '',
    planTimeLb: selectedItem.planTimeLb || '',
    planTimeTarget: selectedItem.planTimeTarget || '',
    prepositionTaskId: [],
    delayTime: '',
    prepositionType: '',
    resource: [],
  };

  // 初始化下拉选项
  await initPopup();
  visibleEdit.value = true;
};

// 初始化弹出框下拉选项
const initPopup = async () => {
  // 前置任务WBS选项（从现有任务列表中获取）
  prepositionTaskIdOptions.value = listOrgData.value.map((item) => ({
    label: item.wbs,
    value: item.taskId,
  }));

  try {
    // 获取资源设备下拉选项
    const resourceOptionsList = await getResourceOptionsApi();
    resourceOptions.value = resourceOptionsList;
  } catch (error) {
    ElMessage.error((error as Error).message || '获取资源选项失败');
  }
};

// 添加任务确定
const handleAddTaskOK = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await addTaskApi(taskAddForm.value);
      ElMessage.success('添加任务成功');
      visibleAdd.value = false;
      await init();
      handleProjectChange(selectedProject.value);
    } catch (error) {
      ElMessage.error((error as Error).message || '添加任务失败');
    } finally {
      loading.value = false;
    }
  });
};

// 修改任务确定
const handleEditTaskOK = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await editTaskApi(taskEditForm.value);
      ElMessage.success('修改任务成功');
      visibleEdit.value = false;
      selectedRowKeys.value.clear();
      selectedRows.value = [];
      await init();
      handleProjectChange(selectedProject.value);
    } catch (error) {
      ElMessage.error((error as Error).message || '修改任务失败');
    } finally {
      loading.value = false;
    }
  });
};

// 关闭对话框
const handleCancel = () => {
  visibleAdd.value = false;
  visibleEdit.value = false;
  formRef.value?.resetFields();
};

// Excel 导入前处理
const beforeUpload = (file: UploadRawFile) => {
  return new Promise<boolean>((resolve) => {
    ElMessageBox.confirm(
      '请确认是否将此文件内数据登录到任务管理信息',
      '项目导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
      .then(() => {
        readExcelFile(file as File);
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

// 读取 Excel 文件
const readExcelFile = async (file: File) => {
  // 文件大小检查（20MB）
  const fileSize = file.size / 1024 / 1024;
  if (fileSize > 20) {
    ElMessage.error('上传文件大小不能超过20MB!');
    return;
  }

  try {
    const data = await readFile(file);
    const workbook = XLSX.read(data, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      ElMessage.error('Excel 文件没有工作表');
      return;
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      ElMessage.error('无法读取工作表数据');
      return;
    }
    const fileData = XLSX.utils.sheet_to_json(worksheet);

    // 导入数据
    await addTaskFromExcel(fileData);
  } catch (error) {
    ElMessage.error((error as Error).message || '读取文件失败');
  }
};

// 读取文件
const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.addEventListener('load', (ev) => {
      resolve(ev.target?.result as string);
    });
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

// 从 Excel 导入任务
const addTaskFromExcel = async (fileData: any[]) => {
  loading.value = true;
  try {
    await addExcelTaskApi({ taskExcelDataList: fileData });
    ElMessage.success('导入任务成功');
    await init();
    handleProjectChange(selectedProject.value);
  } catch (error) {
    ElMessage.error((error as Error).message || '导入任务失败');
  } finally {
    loading.value = false;
  }
};

// init 函数已在上面调用
</script>

<template>
  <Page title="任务管理" :auto-content-height="true">
    <div class="task-management-container">
      <!-- 固定头部区域 -->
      <div class="task-management-header">
        <!-- 项目选择区域 -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">项目名称：</span>
          <ElSelect
            v-model="selectedProject"
            placeholder="请选择项目"
            style="width: 200px"
            @change="handleProjectChange"
          >
            <ElOption
              v-for="item in projectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </div>

        <!-- 操作按钮区域 -->
        <div class="mt-4 flex items-center justify-between">
          <ElSpace>
            <ElButton type="primary" @click="handleAddTask">
              添加任务
            </ElButton>
            <ElButton @click="handleModifyTask"> 修改任务 </ElButton>
          </ElSpace>
          <ElUpload
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :before-upload="beforeUpload"
          >
            <ElButton>新增项目导入</ElButton>
          </ElUpload>
        </div>
      </div>

      <!-- 可滚动的表格区域 -->
      <div
        ref="tableWrapperRef"
        class="task-management-table-wrapper"
        v-loading="loading"
      >
        <ElTableV2
          v-if="tableWidth > 0 && tableHeight > 0"
          :columns="columns"
          :data="tableData"
          :width="tableWidth"
          :height="tableHeight"
          row-key="taskId"
          fixed
        />
      </div>
    </div>

    <!-- 添加任务对话框 -->
    <ElDialog
      v-model="visibleAdd"
      title="添加任务"
      width="800px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="taskAddForm" label-width="120px">
        <ElFormItem label="项目名称" prop="projectId">
          <ElSelect
            v-model="taskAddForm.projectId"
            placeholder="请选择项目"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in projectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="WBS" prop="wbs">
          <ElInput v-model="taskAddForm.wbs" />
        </ElFormItem>
        <ElFormItem label="任务名称" prop="taskName">
          <ElInput v-model="taskAddForm.taskName" />
        </ElFormItem>
        <ElFormItem label="任务优先级" prop="taskPriority">
          <ElInput v-model="taskAddForm.taskPriority" />
        </ElFormItem>
        <ElFormItem label="任务等级" prop="taskClass">
          <ElInput v-model="taskAddForm.taskClass" />
        </ElFormItem>
        <ElFormItem label="叶子任务标识" prop="isLeafTask">
          <ElInput v-model="taskAddForm.isLeafTask" />
        </ElFormItem>
        <ElFormItem label="父任务WBS" prop="parentTaskWbs">
          <ElInput v-model="taskAddForm.parentTaskWbs" />
        </ElFormItem>
        <ElFormItem label="最大计划工期" prop="planTimeUb">
          <ElInput v-model="taskAddForm.planTimeUb" />
        </ElFormItem>
        <ElFormItem label="最小计划工期" prop="planTimeLb">
          <ElInput v-model="taskAddForm.planTimeLb" />
        </ElFormItem>
        <ElFormItem label="目标计划工期" prop="planTimeTarget">
          <ElInput v-model="taskAddForm.planTimeTarget" />
        </ElFormItem>
        <ElFormItem label="前置任务WBS" prop="prepositionTaskId">
          <ElSelect
            v-model="taskAddForm.prepositionTaskId"
            multiple
            placeholder="请选择前置任务"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in prepositionTaskIdOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="延隔时间" prop="delayTime">
          <ElInput v-model="taskAddForm.delayTime" />
        </ElFormItem>
        <ElFormItem label="前置类型" prop="prepositionType">
          <ElSelect
            v-model="taskAddForm.prepositionType"
            placeholder="请选择前置类型"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in prepositionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="资源设备" prop="resource">
          <ElSelect
            v-model="taskAddForm.resource"
            multiple
            placeholder="请选择资源设备"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in resourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleAddTaskOK">确定</ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 修改任务对话框 -->
    <ElDialog
      v-model="visibleEdit"
      title="修改任务"
      width="800px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="taskEditForm" label-width="120px">
        <ElFormItem label="项目名称" prop="projectId">
          <ElSelect
            v-model="taskEditForm.projectId"
            placeholder="请选择项目"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in projectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="WBS" prop="wbs">
          <ElInput v-model="taskEditForm.wbs" />
        </ElFormItem>
        <ElFormItem label="任务名称" prop="taskName">
          <ElInput v-model="taskEditForm.taskName" />
        </ElFormItem>
        <ElFormItem label="任务优先级" prop="taskPriority">
          <ElInput v-model="taskEditForm.taskPriority" />
        </ElFormItem>
        <ElFormItem label="任务等级" prop="taskClass">
          <ElInput v-model="taskEditForm.taskClass" />
        </ElFormItem>
        <ElFormItem label="叶子任务标识" prop="isLeafTask">
          <ElInput v-model="taskEditForm.isLeafTask" />
        </ElFormItem>
        <ElFormItem label="父任务WBS" prop="parentTaskWbs">
          <ElInput v-model="taskEditForm.parentTaskWbs" />
        </ElFormItem>
        <ElFormItem label="最大计划工期" prop="planTimeUb">
          <ElInput v-model="taskEditForm.planTimeUb" />
        </ElFormItem>
        <ElFormItem label="最小计划工期" prop="planTimeLb">
          <ElInput v-model="taskEditForm.planTimeLb" />
        </ElFormItem>
        <ElFormItem label="目标计划工期" prop="planTimeTarget">
          <ElInput v-model="taskEditForm.planTimeTarget" />
        </ElFormItem>
        <ElFormItem label="前置任务WBS" prop="prepositionTaskId">
          <ElSelect
            v-model="taskEditForm.prepositionTaskId"
            multiple
            placeholder="请选择前置任务"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in prepositionTaskIdOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="延隔时间" prop="delayTime">
          <ElInput v-model="taskEditForm.delayTime" />
        </ElFormItem>
        <ElFormItem label="前置类型" prop="prepositionType">
          <ElSelect
            v-model="taskEditForm.prepositionType"
            placeholder="请选择前置类型"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in prepositionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="资源设备" prop="resource">
          <ElSelect
            v-model="taskEditForm.resource"
            multiple
            placeholder="请选择资源设备"
            style="width: 100%"
            clearable
          >
            <ElOption
              v-for="item in resourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleEditTaskOK">确定</ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.task-management-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.task-management-header {
  flex-shrink: 0;
  padding-bottom: 16px;
}

.task-management-table-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.task-management-table-wrapper :deep(.el-auto-resizer) {
  height: 100%;
}

.task-management-table-wrapper :deep(.el-table-v2) {
  height: 100%;
}
</style>
