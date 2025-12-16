import axios from 'axios';

// Spring Boot 后端地址
const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

export interface ProjectData {
  projectNo: string;
  projectName: string;
  deliveryDate: string;
  note: string;
  taskNum?: string;
}

export interface ProjectNoList {
  projectNoList: string[];
}

// 后端返回的 Result 格式
interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * 获取项目信息
 */
export async function getProjectDataApi(): Promise<ProjectData[]> {
  try {
    const res = await axios.get<Result<ProjectData[]>>(
      `${SPRING_BOOT_BASE_URL}/projectManagement/get`,
    );

    // 后端返回格式：{ data: [...], status: 200, statusText: "success" }
    if (res.data && res.data.status === 200) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    throw new Error(res.data?.statusText || '获取项目数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取项目数据失败';
    throw new Error(errorMsg);
  }
}

/**
 * 新增项目
 */
export async function insertProjectDataApi(data: ProjectData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/projectManagement/add`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '新增项目失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '新增项目失败';
    throw new Error(errorMsg);
  }
}

/**
 * 修改项目
 */
export async function updateProjectDataApi(data: ProjectData): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/projectManagement/update`,
      data,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '修改项目失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '修改项目失败';
    throw new Error(errorMsg);
  }
}

/**
 * 排产
 */
export async function schedulingApi(
  projectNoList: ProjectNoList,
): Promise<Result> {
  try {
    const res = await axios.post<Result>(
      `${SPRING_BOOT_BASE_URL}/projectManagement/scheduling`,
      projectNoList,
    );

    if (res.data && res.data.status === 200) {
      return res.data;
    }

    throw new Error(res.data?.statusText || '排产失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '排产失败';
    throw new Error(errorMsg);
  }
}
