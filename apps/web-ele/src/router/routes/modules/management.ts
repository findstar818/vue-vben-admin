import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layers',
      order: -5,
      title: $t('page.management.title'),
    },
    name: 'Management',
    path: '/management',
    children: [
      {
        name: 'ProjectManagement',
        path: '/project',
        component: () => import('#/views/managements/project/index.vue'),
        meta: {
          // affixTab 是否固定在标签页中
          // 如果为 true，则该路由的标签页会被固定在标签页中，不会被关闭
          // affixTab: true,
          icon: 'lucide:file-text',
          title: $t('page.management.project'),
        },
      },
      {
        name: 'TaskManagement',
        path: '/task',
        component: () => import('#/views/managements/task/index.vue'),
        meta: {
          // affixTab: true,
          icon: 'lucide:file-code',
          title: $t('page.management.task'),
        },
      },
    ],
  },
];

export default routes;
