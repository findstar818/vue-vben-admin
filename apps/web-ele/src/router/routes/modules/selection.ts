import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-text',
      order: -4,
      title: $t('page.selection.title'), // 菜单显示文字
    },
    name: 'Selection',
    path: '/selection',
    component: () => import('#/views/selection/index.vue'),
  },
];

export default routes;
