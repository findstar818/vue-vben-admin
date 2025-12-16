import axios from 'axios';

const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

export interface ResourceGanttItem {
  planId: string;
  projectId: string;
  taskId: string;
  sortId: string;
  id: string;
  resourceName: string;
  resourceOccupancyRate: string;
  start_date: string;
  end_date: string;
  text: string;
  render: string;
  type: string;
  progress: number;
  parent: string;
  projectName: string;
  taskName: string;
}

export type ResourceGanttPayload =
  | ResourceGanttItem[]
  | {
      data?: ResourceGanttItem[];
      resourceGanttList?: ResourceGanttItem[];
    };

interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export async function getResourceGanttDataApi(): Promise<ResourceGanttPayload> {
  try {
    const res = await axios.get<Result<ResourceGanttPayload>>(
      `${SPRING_BOOT_BASE_URL}/resourceGantt/getResourceGanttList`,
    );

    if (res.data && res.data.status === 200) {
      return res.data.data ?? [];
    }

    throw new Error(res.data?.statusText || '获取资源甘特图数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取资源甘特图数据失败';
    throw new Error(errorMsg);
  }
}
