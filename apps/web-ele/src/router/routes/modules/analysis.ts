import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layers',
      order: -2,
      title: $t('page.analysis.title'),
    },
    name: 'Analysis',
    path: '/analysis',
    children: [
      {
        name: 'ProjectPlanAnalysis',
        path: '/project-plan-analysis',
        component: () =>
          import('#/views/analysis/project-plan-analysis/index.vue'),
        meta: {
          // affixTab 是否固定在标签页中
          // 如果为 true，则该路由的标签页会被固定在标签页中，不会被关闭
          // affixTab: true,
          icon: 'lucide:file-text',
          title: $t('page.analysis.projectPlanAnalysis'),
        },
      },
      {
        name: 'HistoricalPlanAnalysis',
        path: '/historical-plan-analysis',
        component: () =>
          import('#/views/analysis/historical-plan-analysis/index.vue'),
        meta: {
          // affixTab: true,
          icon: 'lucide:file-code',
          title: $t('page.analysis.historicalPlanAnalysis'),
        },
      },
    ],
  },
];

export default routes;
