import { useAuthStore } from 'src/stores/useAuthStore'
import Accounts from "components/Accounts.vue"
import Sessions from "src/components/SessionsHome.vue"
import PathsList from "components/PathsList.vue"
import Dashboard from "components/Dashboard.vue"
import Notifications from "components/Notifications.vue"
import DofusMap from "components/widgets/DofusMap.vue"
import LogViewer from "components/widgets/LogViewer.vue"
import SessionRunDetails from "components/SessionRunDetails.vue"

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
        meta: { requiresAuth: true }
      },
      {
        name: "SessionsHome",
        path: "/sessions",
        component: Sessions,
        meta: { requiresAuth: true }
      },
      {
        name: "PathsHome",
        path: "/paths",
        component: PathsList,
        meta: { requiresAuth: true }
      },
      {
        name: "DashboardHome",
        path: "/dashboard",
        component: () => Promise.resolve(Dashboard),
        meta: { requiresAuth: true }
      },
      {
        name: "NotificationsCenter",
        path: "/notifications",
        component: () => Promise.resolve(Notifications),
        meta: { requiresAuth: true }
      },
      {
        name: "DofusMap",
        path: "/dofusMap",
        component: () => Promise.resolve(DofusMap),
        meta: { requiresAuth: true }
      },
      {
        name: "LogViewer",
        props: true,
        path: "/logs/:botName",
        component: LogViewer,
        meta: { requiresAuth: true }
      },
      {
        name: "SessionRunDetails",
        props: true,
        path: "/session/:sessionId/sessionRun/:sessionRunId",
        component: SessionRunDetails,
        meta: { requiresAuth: true }
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('pages/LoginPage.vue'),
        meta: { guestOnly: true }
      },
      // Profile and Settings routes
      {
        name: "Profile",
        path: "/profile",
        component: () => import("pages/ProfilePage.vue"),
        meta: { requiresAuth: true }
      },
      {
        name: "Settings",
        path: "/settings",
        component: () => import("pages/SettingsPage.vue"),
        meta: { requiresAuth: true }
      }
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
]

export default routes
