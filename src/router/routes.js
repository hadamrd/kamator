import Accounts from "components/Accounts.vue";
import Sessions from "src/components/SessionsHome.vue";
import PathsList from "components/PathsList.vue";
import Dashboard from "components/Dashboard.vue";
import Notifications from "components/Notifications.vue";
import DofusMap from "components/widgets/DofusMap.vue";
import LogViewer from "components/widgets/LogViewer.vue";
import SessionRunDetails from "components/SessionRunDetails.vue";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", redirect: { name: "SessionsHome" } },
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
      {
        name: "LogViewer",
        props: true,
        path: "/logs/:botName",
        component: LogViewer,
      },
      {
        name: "SessionRunDetails",
        props: true,
        path: "/session/:sessionId/sessionRun/:sessionRunId",
        component: SessionRunDetails,
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
