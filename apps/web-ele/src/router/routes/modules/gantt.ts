import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:chart-gantt',
      order: -3,
      title: $t('page.gantt.title'),
    },
    name: 'Gantt',
    path: '/gantt',
    children: [
      {
        name: 'ResourceGantt',
        path: '/resource-gantt',
        component: () => import('#/views/gantt/resource-gantt/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.gantt.resourceGantt'),
        },
      },
      {
        name: 'ProjectGantt',
        path: '/project-gantt',
        component: () => import('#/views/gantt/project-gantt/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.gantt.projectGantt'),
        },
      },
    ],
  },
];

export default routes;
