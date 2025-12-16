import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      // 管理图标
      icon: 'lucide:calendar',
      order: -4,
      title: $t('page.calendar.title'),
    },
    name: 'Calendar',
    path: '/calendar',
    component: () => import('#/views/resourceCalendar/index.vue'),
  },
];

export default routes;
