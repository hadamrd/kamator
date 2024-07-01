import Accounts from "components/Accounts.vue";
import Sessions from "components/Sessions.vue";
import PathsList from "components/PathsList.vue";
import Dashboard from "components/Dashboard.vue";
import Notifications from "components/Notifications.vue";
import DofusMap from "components/widgets/DofusMap.vue";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "AccountsHome",
        path: "/accounts",
        component: Accounts,
      },
      {
        name: "SessionsHome",
        path: "/sessions",
        component: Sessions,
      },
      {
        name: "PathsHome",
        path: "/paths",
        component: PathsList,
      },
      {
        name: "DashboardHome",
        path: "/dashboard",
        component: () => Promise.resolve(Dashboard),
      },
      {
        name: "NotificationsCenter",
        path: "/notifications",
        component: () => Promise.resolve(Notifications),
      },
      {
        name: "DofusMap",
        path: "/dofusMap",
        component: () => Promise.resolve(DofusMap),
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
