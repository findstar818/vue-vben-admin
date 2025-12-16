import axios from 'axios';

// Spring Boot 后端地址
const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

// 甘特图数据项
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
  todo1: string;
  todo2: string;
  todo3: string;
  todo4: string;
  todo5: string;
}

// 项目计划分析数据
export interface ProjectPlanAnalysisData {
  projectGanttList: PlanTableItem[];
  resourceName: string[];
  resourceOccupancyRate: string[];
}

// 后端返回的 Result 格式
interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * 获取项目计划分析数据
 */
export async function getProjectPlanAnalysisApi(): Promise<ProjectPlanAnalysisData> {
  try {
    const res = await axios.get<Result<ProjectPlanAnalysisData>>(
      `${SPRING_BOOT_BASE_URL}/projectPlanAnalysis/getProjectPlanAnalysisList`,
    );

    if (res.data && res.data.status === 200) {
      return res.data.data;
    }

    throw new Error(res.data?.statusText || '获取项目计划分析数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取项目计划分析数据失败';
    throw new Error(errorMsg);
  }
}
