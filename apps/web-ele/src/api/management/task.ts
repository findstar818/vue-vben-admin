import axios from 'axios';

// Spring Boot 后端地址
const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

// 下拉选项类型
export interface Option {
  label: string;
  value: string;
}

// 任务数据
export interface TaskData {
  projectId: string;
  taskId: string;
  taskSequence: string;
  wbs: string;
  taskName: string;
  taskPriority: string;
  taskClass: string;
  isLeafTask: string;
  parentTaskWbs: string;
  planTimeUb: string;
  planTimeLb: string;
  planTimeTarget: string;
  prepositionTaskId: string[];
  delayTime: string;
  prepositionType: string;
  resource: string[];
}

// 任务显示数据
export interface TaskDataDisplay {
  projectId: string;
  projectName: string;
  wbs: string;
  taskId: string;
  taskName: string;
  taskClass: string;
  perWbs: string;
  planTimeUb: string;
  planTimeLb: string;
  planTimeTarget: string;
  resourceName: string;
}

// Excel 导入数据
export interface TaskExcel {
  taskExcelDataList: any[];
}

// 后端返回的 Result 格式
interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * 获取项目名称下拉选项
 */
export async function getProjectNameOptionsApi(): Promise<Option[]> {
  try {
    const res = await axios.get<Result<Option[]>>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/getProjectNameOptions`,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取项目名称选项失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取项目名称选项失败';
    throw new Error(errorMsg);
  }
}

/**
 * 获取资源设备下拉选项
 */
export async function getResourceOptionsApi(): Promise<Option[]> {
  try {
    const res = await axios.get<Result<Option[]>>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/getResourceOptions`,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取资源选项失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取资源选项失败';
    throw new Error(errorMsg);
  }
}

/**
 * 获取任务列表
 */
export async function getTaskListApi(): Promise<TaskDataDisplay[]> {
  try {
    const res = await axios.get<Result<TaskDataDisplay[]>>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/getTaskList`,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取任务列表失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取任务列表失败';
    throw new Error(errorMsg);
  }
}

/**
 * 新增任务
 */
export async function addTaskApi(data: TaskData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/addTask`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '新增任务失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '新增任务失败';
    throw new Error(errorMsg);
  }
}

/**
 * 修改任务
 */
export async function editTaskApi(data: TaskData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/editTask`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '修改任务失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '修改任务失败';
    throw new Error(errorMsg);
  }
}

/**
 * Excel 导入任务
 */
export async function addExcelTaskApi(data: TaskExcel): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/taskManagement/addExcelTask`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '导入任务失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '导入任务失败';
    throw new Error(errorMsg);
  }
}
