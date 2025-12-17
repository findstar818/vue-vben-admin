import axios from 'axios';

const SPRING_BOOT_BASE_URL = 'http://localhost:9999/liming';

export interface PlanTableItem {
  id: string;
  startTime: string;
  endTime: string;
  color: string;
  text: string;
  planId: string;
  planTotalCompletionTime: number;
  plannedConstructionPeriod: string;
  projectId: string;
  taskId: string;
  taskName: string;
  start_date: string;
  end_date: string;
  todo1: null | string;
  todo2: null | string;
  todo3: null | string;
  todo4: null | string;
  todo5: null | string;
  wbs: null | string;
}

export interface ProjectGanttLink {
  id: number;
  source: string;
  target: string;
  type: string;
}

export interface ProjectGanttResponse {
  projectGanttList: PlanTableItem[];
  projectGanttLinks: ProjectGanttLink[];
}

interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export async function getProjectGanttDataApi(): Promise<ProjectGanttResponse> {
  try {
    const res = await axios.get<Result<ProjectGanttResponse>>(
      `${SPRING_BOOT_BASE_URL}/projectGantt/getProjectGanttList`,
    );

    if (res.data && res.data.status === 200) {
      return res.data.data;
    }

    throw new Error(res.data?.statusText || '获取项目甘特图数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取项目甘特图数据失败';
    throw new Error(errorMsg);
  }
}
