import axios from 'axios';

// Spring Boot 后端地址
const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

// 下拉选项类型
export interface Option {
  label: string;
  value: string;
}

// 资源数据
export interface ResourceData {
  resourceId: string;
  resourceSequence: null | number;
  resourceGroup: string;
  resourceName: string;
  resourceAcronym: string;
  resourceType: string;
  materialUnit: string;
  maximumUnit: string;
  standardRate: string;
  overtimeRate: string;
  useCost: string;
  costAccumulationMode: string;
  shutdownDate: null | string;
  shutdownReason: string;
  projectRemarks: string;
  editShutdownDate: null | string;
}

// 资源查询条件
export interface ResourceCondition {
  resourceSequence: string;
  startDate: null | string;
  endDate: null | string;
}

// 资源表格显示数据
export interface ResourceTableData {
  resourceSequence: string;
  resourceName: string;
  days: string;
  usableDays: string;
  shutdownDate: string;
  projectRemarks: string;
  shutdownReason?: string;
}

//  问题 1 ：  日期范围发生改动后  下方日历日期不改变
//  问题2  ：  修改资源设置  选定后不自动填充信息

// 后端返回的 Result 格式
interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * 获取资源名称列表
 */
export async function getResourceNameListApi(): Promise<Option[]> {
  try {
    const res = await axios.get<Result<Option[]>>(
      `${SPRING_BOOT_BASE_URL}/resourceManagement/searchResourceNameList`,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取资源名称列表失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取资源名称列表失败';
    throw new Error(errorMsg);
  }
}

/**
 * 根据条件查询资源数据
 */
export async function searchResourceDataApi(
  condition: ResourceCondition,
): Promise<ResourceTableData[]> {
  try {
    const res = await axios.post<Result<ResourceTableData[]>>(
      `${SPRING_BOOT_BASE_URL}/resourceManagement/searchResourceConditionList`,
      condition,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '查询资源数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '查询资源数据失败';
    throw new Error(errorMsg);
  }
}

/**
 * 根据资源名称获取停工日期列表
 */
export async function getShutdownDateListByResourceNameApi(
  resourceSequence: string,
): Promise<Option[]> {
  try {
    const res = await axios.post<Result<Option[]>>(
      `${SPRING_BOOT_BASE_URL}/resourceManagement/selectByName`,
      resourceSequence,
    );

    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取停工日期列表失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取停工日期列表失败';
    throw new Error(errorMsg);
  }
}

/**
 * 新增资源
 */
export async function addResourceApi(data: ResourceData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/resourceManagement/add`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '新增资源失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '新增资源失败';
    throw new Error(errorMsg);
  }
}

/**
 * 修改资源
 */
export async function updateResourceApi(data: ResourceData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/resourceManagement/edit`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '修改资源失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '修改资源失败';
    throw new Error(errorMsg);
  }
}
