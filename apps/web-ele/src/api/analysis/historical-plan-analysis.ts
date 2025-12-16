import type { PlanTableItem } from './project-plan-analysis';

import axios from 'axios';

// Spring Boot 后端地址
const SPRING_BOOT_BASE_URL = 'http://localhost:9999/shengu';

export interface HistoryPlanTableItem {
  planId: string;
  totalCompletionTime: number;
  projectNum: number;
  taskNum: number;
  startDate: string;
  endDate: string;
}

export interface PlanOption {
  label: string;
  value?: unknown;
}

export interface HistoryPlanAnalysisData {
  tableList: HistoryPlanTableItem[];
  ganttOptions: PlanOption[];
  projectGanttList: PlanTableItem[];
}

// 后端返回的 Result 格式
interface Result<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * 获取历史计划分析数据
 */
export async function getHistoryPlanAnalysisApi(): Promise<HistoryPlanAnalysisData> {
  try {
    const res = await axios.get<Result<HistoryPlanAnalysisData>>(
      `${SPRING_BOOT_BASE_URL}/historyPlanAnalysis/getHistoryPlanAnalysisList`,
    );

    if (res.data && res.data.status === 200) {
      return res.data.data;
    }

    throw new Error(res.data?.statusText || '获取历史计划分析数据失败');
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.statusText ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取历史计划分析数据失败';
    throw new Error(errorMsg);
  }
}
