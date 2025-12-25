import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-text',
      order: -4,
      title: $t('page.selection.title'), // 菜单显示文字
    },
    name: 'NewSelection',
    path: '/newSelection',
    component: () => import('#/views/newSelection/index.vue'),
  },
];

export default routes;
