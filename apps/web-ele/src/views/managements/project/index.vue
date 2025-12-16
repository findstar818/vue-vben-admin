<!-- 页面组成：Page头  项目列表，新增项目，修改项目 
项目列表： 选择框，项目号，项目名称，任务数，交货期 ，备注
最下方按钮：排产
-->
<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import type { ProjectData } from '#/api/management/project';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSpace,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getProjectDataApi,
  insertProjectDataApi,
  schedulingApi,
  updateProjectDataApi,
} from '#/api/management/project';

// 表格数据
const tableData = ref<ProjectData[]>([]);

// 加载状态
const loading = ref(false);

// 选中的行
const selectedRows = ref<ProjectData[]>([]);

// 新增/修改对话框显示状态
const visibleAdd = ref(false);
const visibleChange = ref(false);

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const form = ref<ProjectData>({
  projectNo: '',
  projectName: '',
  deliveryDate: '',
  note: '',
  taskNum: '',
});

// 查询数据
const queryData = async () => {
  loading.value = true;
  try {
    const res = await getProjectDataApi();
    tableData.value = res || [];
  } catch (error) {
    ElMessage.error((error as Error).message || '获取项目数据失败');
  } finally {
    loading.value = false;
  }
};

// 新增项目按钮点击事件
const handleShowAdd = () => {
  form.value = {
    projectNo: '',
    projectName: '',
    deliveryDate: '',
    note: '',
    taskNum: '',
  };
  visibleAdd.value = true;
};

// 修改项目按钮点击事件
const handleShowChange = () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行修改');
    return;
  }
  const selectedItem = selectedRows.value[0];
  if (!selectedItem) return;

  form.value = {
    projectNo: selectedItem.projectNo,
    projectName: selectedItem.projectName,
    deliveryDate: selectedItem.deliveryDate,
    note: selectedItem.note,
    taskNum: selectedItem.taskNum || '',
  };
  visibleChange.value = true;
};

// 新增项目确定按钮点击事件
const handleAdd = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await insertProjectDataApi(form.value);
      ElMessage.success('新增项目成功');
      visibleAdd.value = false;
      queryData();
    } catch (error) {
      ElMessage.error((error as Error).message || '新增项目失败');
    } finally {
      loading.value = false;
    }
  });
};

// 修改项目确定按钮点击事件
const handleChange = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await updateProjectDataApi(form.value);
      ElMessage.success('修改项目成功');
      visibleChange.value = false;
      selectedRows.value = [];
      queryData();
    } catch (error) {
      ElMessage.error((error as Error).message || '修改项目失败');
    } finally {
      loading.value = false;
    }
  });
};

// 关闭对话框
const handleCancel = () => {
  visibleAdd.value = false;
  visibleChange.value = false;
  formRef.value?.resetFields();
};

// 排产按钮点击事件
const handleSchedule = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行排产');
    return;
  }

  loading.value = true;
  try {
    const projectNoList = selectedRows.value.map((item) => item.projectNo);
    await schedulingApi({ projectNoList });
    ElMessage.success('项目排产成功');
    selectedRows.value = [];
    queryData();
  } catch (error) {
    ElMessage.error((error as Error).message || '排产失败');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  queryData();
});
</script>

<template>
  <Page title="项目管理" :auto-content-height="true">
    <div class="project-management-container">
      <!-- 固定头部区域 -->
      <div class="project-management-header">
        <!-- 标题和操作按钮区域 -->
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">项目列表</h2>
          <ElSpace>
            <ElButton type="primary" @click="handleShowAdd">
              新增项目
            </ElButton>
            <ElButton
              type="primary"
              @click="handleShowChange"
              :disabled="selectedRows.length !== 1"
            >
              修改项目
            </ElButton>
          </ElSpace>
        </div>
      </div>

      <!-- 可滚动的表格区域 -->
      <div class="project-management-table-wrapper">
        <ElTable
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          @selection-change="selectedRows = $event"
          row-key="projectNo"
        >
          <ElTableColumn type="selection" width="55" fixed="left" />
          <ElTableColumn
            prop="projectNo"
            label="项目号"
            width="150"
            align="center"
          />
          <ElTableColumn
            prop="projectName"
            label="项目名称"
            width="300"
            align="center"
          />
          <ElTableColumn
            prop="taskNum"
            label="任务数"
            width="150"
            align="center"
          />
          <ElTableColumn
            prop="deliveryDate"
            label="交货期"
            width="300"
            align="center"
          />
          <ElTableColumn prop="note" label="备注" align="center" />
        </ElTable>
      </div>

      <!-- 排产按钮 -->
      <div class="project-management-footer">
        <div class="flex justify-end">
          <ElButton
            type="primary"
            :disabled="selectedRows.length === 0"
            size="large"
            @click="handleSchedule"
          >
            排产
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 新增项目对话框 -->
    <ElDialog
      v-model="visibleAdd"
      title="新增项目"
      width="500px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="form" label-width="80px">
        <ElFormItem
          label="项目号"
          prop="projectNo"
          :rules="[
            { required: true, message: '请输入项目号', trigger: 'blur' },
          ]"
        >
          <ElInput v-model="form.projectNo" />
        </ElFormItem>
        <ElFormItem
          label="项目名称"
          prop="projectName"
          :rules="[
            { required: true, message: '请输入项目名称', trigger: 'blur' },
          ]"
        >
          <ElInput v-model="form.projectName" />
        </ElFormItem>
        <ElFormItem label="交货期" prop="deliveryDate">
          <ElDatePicker
            v-model="form.deliveryDate"
            type="date"
            placeholder="选择交货期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="备注" prop="note">
          <ElInput v-model="form.note" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleAdd" :loading="loading">
            确定
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 修改项目对话框 -->
    <ElDialog
      v-model="visibleChange"
      title="修改项目"
      width="500px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="form" label-width="80px">
        <ElFormItem label="项目号" prop="projectNo">
          <ElInput v-model="form.projectNo" disabled />
        </ElFormItem>
        <ElFormItem
          label="项目名称"
          prop="projectName"
          :rules="[
            { required: true, message: '请输入项目名称', trigger: 'blur' },
          ]"
        >
          <ElInput v-model="form.projectName" />
        </ElFormItem>
        <ElFormItem label="交货期" prop="deliveryDate">
          <ElDatePicker
            v-model="form.deliveryDate"
            type="date"
            placeholder="选择交货期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="备注" prop="note">
          <ElInput v-model="form.note" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleChange" :loading="loading">
            确定
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.project-management-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.project-management-header {
  flex-shrink: 0;
  padding-bottom: 16px;
}

.project-management-table-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.project-management-table-wrapper :deep(.el-table) {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.project-management-table-wrapper :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto;
}

.project-management-footer {
  flex-shrink: 0;
  padding-top: 16px;
}
</style>
