/**
 * Gantt 实例管理器
 * 用于管理多个页面共享同一个 gantt 单例实例，避免相互影响
 *
 * 由于 dhtmlx-gantt 是单例模式，多个页面会共享同一个实例。
 * 这个管理器通过跟踪每个页面的状态，确保：
 * 1. 销毁时不会影响其他正在使用的页面
 * 2. 重新初始化时不会覆盖其他页面的配置
 */

import { gantt } from 'dhtmlx-gantt';

type GanttInstance = typeof gantt;

interface GanttInstanceInfo {
  id: string;
  container: HTMLElement | null;
  isActive: boolean;
  initialized: boolean;
}

class GanttInstanceManager {
  private currentActiveId: null | string = null;
  private instances = new Map<string, GanttInstanceInfo>();
  private sharedInstance: GanttInstance | null = null;

  /**
   * 清理实例数据（但不销毁实例）
   */
  clearInstance(instanceId: string): void {
    const info = this.instances.get(instanceId);
    if (!info || !this.sharedInstance) {
      return;
    }

    // 只有当这是当前活跃实例时才清理
    if (this.currentActiveId === instanceId) {
      try {
        this.sharedInstance.clearAll();
      } catch (error) {
        console.warn(
          `[GanttInstanceManager] Error clearing instance ${instanceId}:`,
          error,
        );
      }
    }
  }

  /**
   * 销毁实例（标记为非活跃，但不调用 destructor）
   */
  destroyInstance(instanceId: string): void {
    const info = this.instances.get(instanceId);
    if (!info) {
      return;
    }

    // 清理数据
    this.clearInstance(instanceId);

    // 标记为非活跃
    info.isActive = false;
    info.initialized = false;
    info.container = null;

    // 如果这是当前活跃实例，清除活跃标记
    if (this.currentActiveId === instanceId) {
      this.currentActiveId = null;
    }

    // 注意：永远不要调用 destructor()，因为可能还有其他实例在使用
    // 即使所有实例都被销毁，也不调用 destructor，因为可能很快会有新实例

    // 从管理器中移除（可选，保留信息用于调试）
    // this.instances.delete(instanceId);
  }

  /**
   * 获取所有活跃的实例ID
   */
  getActiveInstanceIds(): string[] {
    return [...this.instances.values()]
      .filter((info) => info.isActive)
      .map((info) => info.id);
  }

  /**
   * 获取当前活跃的实例ID
   */
  getCurrentActiveId(): null | string {
    return this.currentActiveId;
  }

  /**
   * 获取共享的 gantt 实例
   * @param instanceId 实例唯一标识
   * @returns gantt 实例
   */
  getInstance(instanceId: string): GanttInstance {
    // 首先尝试从 window.Gantt 获取（如果存在多实例支持）
    const globalObj = window as typeof window & {
      Gantt?: { getGanttInstance?: () => GanttInstance };
    };
    if (globalObj.Gantt?.getGanttInstance) {
      return globalObj.Gantt.getGanttInstance();
    }

    // 使用共享的单例实例
    if (!this.sharedInstance) {
      this.sharedInstance = gantt;
    }

    // 注册或更新实例信息
    if (this.instances.has(instanceId)) {
      const info = this.instances.get(instanceId)!;
      info.isActive = true;
    } else {
      this.instances.set(instanceId, {
        id: instanceId,
        container: null,
        isActive: true,
        initialized: false,
      });
    }

    return this.sharedInstance;
  }

  /**
   * 检查实例是否存在且活跃
   */
  isInstanceActive(instanceId: string): boolean {
    const info = this.instances.get(instanceId);
    return info?.isActive ?? false;
  }

  /**
   * 准备初始化（清理其他实例的数据，为新实例做准备）
   * 注意：gantt.init() 只能绑定一个容器，所以新初始化会覆盖之前的绑定
   */
  prepareInitialization(instanceId: string): void {
    // 检查是否有其他已初始化的实例
    const otherInitializedInstances = [...this.instances.values()].filter(
      (info) => info.id !== instanceId && info.isActive && info.initialized,
    );

    // 如果有其他实例，清理它们的数据（但不销毁）
    // 这样可以确保新实例可以安全初始化
    if (otherInitializedInstances.length > 0 && this.sharedInstance) {
      try {
        // 清理所有数据，为新实例做准备
        this.sharedInstance.clearAll();
        // 标记其他实例为未初始化（因为它们的数据已被清理，容器绑定也会被覆盖）
        otherInitializedInstances.forEach((info) => {
          info.initialized = false;
          info.container = null;
        });
      } catch (error) {
        console.warn(
          '[GanttInstanceManager] Error preparing initialization:',
          error,
        );
      }
    }
  }

  /**
   * 设置实例的容器并标记为已初始化
   */
  setContainer(instanceId: string, container: HTMLElement | null): void {
    const info = this.instances.get(instanceId);
    if (info) {
      info.container = container;
      if (container) {
        info.initialized = true;
        this.currentActiveId = instanceId;
      }
    }
  }
}

// 导出单例管理器
export const ganttInstanceManager = new GanttInstanceManager();

/**
 * 生成唯一的实例ID
 */
export function generateGanttInstanceId(prefix = 'gantt'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
