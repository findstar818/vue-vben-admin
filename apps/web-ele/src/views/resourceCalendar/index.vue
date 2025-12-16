<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import type {
  Option,
  ResourceCondition,
  ResourceData,
  ResourceTableData,
} from '#/api/management/resource';

import { onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCalendar,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  addResourceApi,
  getResourceNameListApi,
  getShutdownDateListByResourceNameApi,
  searchResourceDataApi,
  updateResourceApi,
} from '#/api/management/resource';

// 加载状态
const loading = ref(false);

// 资源名称列表
const resourceOptions = ref<Option[]>([]);

// 选中的资源
const selectedResource = ref<string>('');

// 日期范围（字符串格式：YYYY-MM-DD）
const dateRange = ref<[string, string] | null>(null);

// 当前显示的日期（用于日历）
const currentDate = ref(new Date());

// 查询用的日期范围（用于日历显示，字符串格式）
const calendarValStart = ref<null | string>(null);
const calendarValEnd = ref<null | string>(null);

// 表格数据
const tableData = ref<ResourceTableData[]>([]);

// 新增资源对话框显示状态
const visibleAdd = ref(false);

// 修改资源对话框显示状态
const visibleEdit = ref(false);

// 表单引用
const formRef = ref<FormInstance>();

// 新增资源表单数据
const resourceAddForm = ref<ResourceData>({
  resourceId: '',
  resourceSequence: null,
  resourceGroup: '',
  resourceName: '',
  resourceAcronym: '',
  resourceType: '',
  materialUnit: '',
  maximumUnit: '',
  standardRate: '',
  overtimeRate: '',
  useCost: '',
  costAccumulationMode: '',
  shutdownDate: null,
  shutdownReason: '',
  projectRemarks: '',
  editShutdownDate: null,
});

// 修改资源表单数据
const resourceEditForm = ref<ResourceData>({
  resourceId: '',
  resourceSequence: null,
  resourceGroup: '',
  resourceName: '',
  resourceAcronym: '',
  resourceType: '',
  materialUnit: '',
  maximumUnit: '',
  standardRate: '',
  overtimeRate: '',
  useCost: '',
  costAccumulationMode: '',
  shutdownDate: null,
  shutdownReason: '',
  projectRemarks: '',
  editShutdownDate: null,
});

// 修改资源时选中的资源
const editSelectedResource = ref<null | Option>(null);

// 修改资源时选中的停工日期
const editSelectedShutdownDate = ref<string>('');

// 修改资源时的停工日期选项列表
const shutdownDateOptions = ref<Option[]>([]);

// 初始化数据
const init = async () => {
  loading.value = true;
  try {
    // 获取资源名称列表
    const resourceList = await getResourceNameListApi();
    resourceOptions.value = resourceList;
  } catch (error) {
    ElMessage.error((error as Error).message || '获取资源列表失败');
  } finally {
    loading.value = false;
  }
};

// 查询
const handleQuery = async () => {
  if (!selectedResource.value || !dateRange.value) {
    ElMessage.warning('请选择资源名称和日期范围');
    return;
  }

  loading.value = true;
  try {
    // dateRange 已经是 YYYY-MM-DD 格式的字符串（因为设置了 value-format）
    const condition: ResourceCondition = {
      resourceSequence: selectedResource.value,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
    };

    const result = await searchResourceDataApi(condition);
    tableData.value = result;

    // 设置日历显示的日期范围（字符串格式）
    // watch 会自动更新，但这里也设置以确保同步
    calendarValStart.value = dateRange.value[0];
    calendarValEnd.value = dateRange.value[1];

    // 更新日历显示的月份为日期范围的开始月份
    if (dateRange.value[0]) {
      currentDate.value = new Date(dateRange.value[0]);
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '查询失败');
  } finally {
    loading.value = false;
  }
};

// 新增资源设备
const handleAddResource = () => {
  // 重置表单
  resourceAddForm.value = {
    resourceId: '',
    resourceSequence: null,
    resourceGroup: '',
    resourceName: '',
    resourceAcronym: '',
    resourceType: '',
    materialUnit: '',
    maximumUnit: '',
    standardRate: '',
    overtimeRate: '',
    useCost: '',
    costAccumulationMode: '',
    shutdownDate: null,
    shutdownReason: '',
    projectRemarks: '',
    editShutdownDate: null,
  };
  visibleAdd.value = true;
};

// 新增资源确定
const handleAddResourceOK = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      await addResourceApi(resourceAddForm.value);
      ElMessage.success('新增资源成功');
      visibleAdd.value = false;
      await init();
    } catch (error) {
      ElMessage.error((error as Error).message || '新增资源失败');
    } finally {
      loading.value = false;
    }
  });
};

// 修改资源设置
const handleModifyResource = async () => {
  // 重置表单
  editSelectedResource.value = null;
  editSelectedShutdownDate.value = '';
  shutdownDateOptions.value = [];
  resourceEditForm.value = {
    resourceId: '',
    resourceSequence: null,
    resourceGroup: '',
    resourceName: '',
    resourceAcronym: '',
    resourceType: '',
    materialUnit: '',
    maximumUnit: '',
    standardRate: '',
    overtimeRate: '',
    useCost: '',
    costAccumulationMode: '',
    shutdownDate: null,
    shutdownReason: '',
    projectRemarks: '',
    editShutdownDate: null,
  };

  // 重新加载资源列表
  try {
    const resourceList = await getResourceNameListApi();
    resourceOptions.value = resourceList;
  } catch (error) {
    ElMessage.error((error as Error).message || '获取资源列表失败');
  }

  visibleEdit.value = true;
};

// 修改资源时，选择资源名称后加载停工日期列表
const handleEditResourceChange = async () => {
  if (!editSelectedResource.value) {
    shutdownDateOptions.value = [];
    editSelectedShutdownDate.value = '';
    return;
  }

  loading.value = true;
  try {
    const shutdownList = await getShutdownDateListByResourceNameApi(
      editSelectedResource.value.value,
    );
    shutdownDateOptions.value = shutdownList;
    editSelectedShutdownDate.value = '';
  } catch (error) {
    ElMessage.error((error as Error).message || '获取停工日期列表失败');
  } finally {
    loading.value = false;
  }
};

// 修改资源时，选择停工日期后加载资源数据
const handleEditShutdownDateChange = async () => {
  if (!editSelectedResource.value || !editSelectedShutdownDate.value) {
    return;
  }

  loading.value = true;
  try {
    // editSelectedShutdownDate.value 已经是 YYYY-MM-DD 格式的字符串
    const condition: ResourceCondition = {
      resourceSequence: editSelectedResource.value.value,
      startDate: editSelectedShutdownDate.value,
      endDate: editSelectedShutdownDate.value,
    };

    const result = await searchResourceDataApi(condition);
    if (result && result.length > 0) {
      const data = result[0] as any;
      if (data) {
        // 后端返回的是完整的 Resource 对象，包含所有字段
        resourceEditForm.value = {
          resourceId: data.resourceId || data.resourceSequence || '',
          resourceSequence: data.resourceSequence
            ? Number(data.resourceSequence)
            : null,
          resourceGroup: data.resourceGroup || '',
          resourceName:
            data.resourceName || editSelectedResource.value.label || '',
          resourceAcronym: data.resourceAcronym || '',
          resourceType: data.resourceType || '',
          materialUnit: data.materialUnit || '',
          maximumUnit: data.maximumUnit || '',
          standardRate: data.standardRate || '',
          overtimeRate: data.overtimeRate || '',
          useCost: data.useCost || '',
          costAccumulationMode: data.costAccumulationMode || '',
          shutdownDate: data.shutdownDate || null,
          shutdownReason: data.shutdownReason || '',
          projectRemarks: data.projectRemarks || '',
          editShutdownDate: null,
        };
      }
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '获取资源数据失败');
  } finally {
    loading.value = false;
  }
};

// 修改资源确定
const handleEditResourceOK = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      // 设置要修改的停工日期
      resourceEditForm.value.shutdownDate = editSelectedShutdownDate.value;
      await updateResourceApi(resourceEditForm.value);
      ElMessage.success('修改资源成功');
      visibleEdit.value = false;
      // 如果当前查询条件存在，重新查询
      if (selectedResource.value && dateRange.value) {
        await handleQuery();
      }
    } catch (error) {
      ElMessage.error((error as Error).message || '修改资源失败');
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

// 判断是否为停工日期
const checkShutDownDate = (day: Date | string): boolean => {
  if (!tableData.value || tableData.value.length === 0) {
    return false;
  }
  const dayStr = dayjs(day).format('YYYY-MM-DD');
  return tableData.value.some((item) => item.shutdownDate === dayStr);
};

// 获取停工原因
const getShutdownReason = (day: Date | string): string => {
  if (!tableData.value || tableData.value.length === 0) {
    return '';
  }
  const dayStr = dayjs(day).format('YYYY-MM-DD');
  const item = tableData.value.find((item) => item.shutdownDate === dayStr);
  return item?.shutdownReason || '';
};

// 判断日期是否在范围内
const isDateInRange = (day: Date | string): boolean => {
  if (!calendarValStart.value || !calendarValEnd.value) {
    return false;
  }
  const dayStr = dayjs(day).format('YYYY-MM-DD');
  // calendarValStart 和 calendarValEnd 已经是字符串格式
  return dayStr >= calendarValStart.value && dayStr <= calendarValEnd.value;
};

// 获取日历单元格的样式类
const getCalendarCellClass = (day: Date | string): string => {
  const isInRange = isDateInRange(day);
  const isShutdown = checkShutDownDate(day);

  if (isInRange && isShutdown) {
    return 'card-flag';
  } else if (isInRange && !isShutdown) {
    return 'card-group';
  } else {
    return 'card-none';
  }
};

// 监听日期范围变化，自动更新日历日期范围
watch(
  dateRange,
  (newVal) => {
    if (
      newVal &&
      Array.isArray(newVal) &&
      newVal.length === 2 &&
      newVal[0] &&
      newVal[1]
    ) {
      calendarValStart.value = newVal[0];
      calendarValEnd.value = newVal[1];
      // 更新日历显示的月份为日期范围的开始月份
      currentDate.value = new Date(newVal[0]);
    } else {
      calendarValStart.value = null;
      calendarValEnd.value = null;
    }
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  init();
});
</script>

<template>
  <Page class="calender-page" title="资源日历">
    <div class="flex flex-col gap-4" v-loading="loading">
      <div class="function-area">
        <!-- 查询条件区域 -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium"
              >资源名称：</span
            >
            <ElSelect
              v-model="selectedResource"
              placeholder="请选择资源"
              style="width: 200px"
              clearable
            >
              <ElOption
                v-for="item in resourceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>

          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-sm font-medium"
              >日期范围：</span
            >
            <ElDatePicker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>

          <ElButton type="primary" @click="handleQuery"> 查询 </ElButton>
        </div>

        <!-- 操作按钮区域 -->
        <div class="flex items-center justify-between">
          <ElSpace>
            <ElButton type="primary" @click="handleAddResource">
              新增资源设备
            </ElButton>
            <ElButton @click="handleModifyResource"> 修改资源设置 </ElButton>
          </ElSpace>
        </div>
      </div>

      <!-- 资源列表表格 -->
      <ElTable :data="tableData" style="width: 100%" border stripe>
        <ElTableColumn
          prop="resourceSequence"
          label="序号"
          width="80"
          align="center"
        />
        <ElTableColumn prop="resourceName" label="资源名称" align="center" />
        <ElTableColumn prop="days" label="选择天数" width="120" align="center">
          <template #default="{ row }">
            {{ row.days }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="usableDays"
          label="资源可使用天数"
          width="160"
          align="center"
        >
          <template #default="{ row }">
            {{ row.usableDays }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="shutdownDate"
          label="停工日期"
          width="120"
          align="center"
        />
        <ElTableColumn prop="projectRemarks" label="基准日历" align="center" />
      </ElTable>

      <!-- 日历区域 -->
      <div class="rounded-lg border p-4">
        <ElCalendar
          v-model="currentDate"
          :key="`${calendarValStart}-${calendarValEnd}`"
        >
          <template #date-cell="{ data }">
            <div v-if="data" :class="getCalendarCellClass(data.date)">
              <span>{{ dayjs(data.date).format('D') }}</span>
              <p
                v-if="isDateInRange(data.date) && checkShutDownDate(data.date)"
                class="shutdown-reason"
              >
                {{ getShutdownReason(data.date) }}
              </p>
            </div>
          </template>
        </ElCalendar>
      </div>
    </div>

    <!-- 新增资源对话框 -->
    <ElDialog
      v-model="visibleAdd"
      title="新增资源设备"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="resourceAddForm" label-width="120px">
        <ElFormItem label="资源大类" prop="resourceGroup">
          <ElInput v-model="resourceAddForm.resourceGroup" />
        </ElFormItem>
        <ElFormItem label="资源名称" prop="resourceName">
          <ElInput v-model="resourceAddForm.resourceName" />
        </ElFormItem>
        <ElFormItem label="资源缩写" prop="resourceAcronym">
          <ElInput v-model="resourceAddForm.resourceAcronym" />
        </ElFormItem>
        <ElFormItem label="资源类型" prop="resourceType">
          <ElInput v-model="resourceAddForm.resourceType" />
        </ElFormItem>
        <ElFormItem label="材料标签" prop="materialUnit">
          <ElInput v-model="resourceAddForm.materialUnit" />
        </ElFormItem>
        <ElFormItem label="最大单位" prop="maximumUnit">
          <ElInput v-model="resourceAddForm.maximumUnit" />
        </ElFormItem>
        <ElFormItem label="标准费率" prop="standardRate">
          <ElInput v-model="resourceAddForm.standardRate" />
        </ElFormItem>
        <ElFormItem label="加班费率" prop="overtimeRate">
          <ElInput v-model="resourceAddForm.overtimeRate" />
        </ElFormItem>
        <ElFormItem label="使用成本" prop="useCost">
          <ElInput v-model="resourceAddForm.useCost" />
        </ElFormItem>
        <ElFormItem label="成本类算" prop="costAccumulationMode">
          <ElInput v-model="resourceAddForm.costAccumulationMode" />
        </ElFormItem>
        <ElFormItem label="停工日期" prop="shutdownDate">
          <ElDatePicker
            v-model="resourceAddForm.shutdownDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="停工原因" prop="shutdownReason">
          <ElInput v-model="resourceAddForm.shutdownReason" />
        </ElFormItem>
        <ElFormItem label="基准日历" prop="projectRemarks">
          <ElInput v-model="resourceAddForm.projectRemarks" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleAddResourceOK">确定</ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 修改资源对话框 -->
    <ElDialog
      v-model="visibleEdit"
      title="修改资源设置"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <ElForm ref="formRef" :model="resourceEditForm" label-width="120px">
        <ElFormItem label="资源名称" prop="resourceName">
          <ElSelect
            v-model="editSelectedResource"
            placeholder="请选择资源"
            style="width: 100%"
            @change="handleEditResourceChange"
          >
            <ElOption
              v-for="item in resourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="修改前停工日期" prop="shutdownDate">
          <ElSelect
            v-model="editSelectedShutdownDate"
            placeholder="请选择停工日期"
            style="width: 100%"
            @change="handleEditShutdownDateChange"
          >
            <ElOption
              v-for="item in shutdownDateOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="修改后停工日期" prop="editShutdownDate">
          <ElDatePicker
            v-model="resourceEditForm.editShutdownDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="资源大类" prop="resourceGroup">
          <ElInput v-model="resourceEditForm.resourceGroup" />
        </ElFormItem>
        <ElFormItem label="资源缩写" prop="resourceAcronym">
          <ElInput v-model="resourceEditForm.resourceAcronym" />
        </ElFormItem>
        <ElFormItem label="资源类型" prop="resourceType">
          <ElInput v-model="resourceEditForm.resourceType" />
        </ElFormItem>
        <ElFormItem label="材料标签" prop="materialUnit">
          <ElInput v-model="resourceEditForm.materialUnit" />
        </ElFormItem>
        <ElFormItem label="最大单位" prop="maximumUnit">
          <ElInput v-model="resourceEditForm.maximumUnit" />
        </ElFormItem>
        <ElFormItem label="标准费率" prop="standardRate">
          <ElInput v-model="resourceEditForm.standardRate" />
        </ElFormItem>
        <ElFormItem label="加班费率" prop="overtimeRate">
          <ElInput v-model="resourceEditForm.overtimeRate" />
        </ElFormItem>
        <ElFormItem label="使用成本" prop="useCost">
          <ElInput v-model="resourceEditForm.useCost" />
        </ElFormItem>
        <ElFormItem label="成本类算" prop="costAccumulationMode">
          <ElInput v-model="resourceEditForm.costAccumulationMode" />
        </ElFormItem>
        <ElFormItem label="停工原因" prop="shutdownReason">
          <ElInput v-model="resourceEditForm.shutdownReason" />
        </ElFormItem>
        <ElFormItem label="基准日历" prop="projectRemarks">
          <ElInput v-model="resourceEditForm.projectRemarks" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElSpace>
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleEditResourceOK">确定</ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.function-area {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.card-flag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  background-color: #fcc2d7;
}

.card-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  background-color: #96f2d7;
}

.card-none {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.shutdown-reason {
  margin-top: 2px;
  font-size: 10px;
  line-height: 1.2;
  color: #666;
  word-break: break-all;
}
</style>
