import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-text',
      order: -4,
      title: $t('page.process.title'),
      hideInMenu: true, // 在菜单中隐藏，但保留 BasicLayout 和面包屑
    },
    name: 'Process',
    path: '/process',
    component: () => import('#/views/process/index.vue'),
  },
];

export default routes;
