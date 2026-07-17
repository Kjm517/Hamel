import { Navigate, createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { BrandsPage } from "./pages/BrandsPage";
import { WhyHamelPage } from "./pages/WhyHamelPage";
import { ContactPage } from "./pages/ContactPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { CoolDealsPage } from "./pages/CoolDealsPage";
import { ComparePage } from "./pages/ComparePage";
import { PromoLandingPage } from "./pages/PromoLandingPage";
import { AdminRoot } from "./admin/AdminRoot";
import { AdminRequireAuth } from "./admin/components/AdminRequireAuth";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminForgotPasswordPage } from "./admin/pages/AdminForgotPasswordPage";
import { AdminResetPasswordPage } from "./admin/pages/AdminResetPasswordPage";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { AdminPagesHub } from "./admin/pages/AdminPagesHub";
import { AdminPromoEventPage } from "./admin/pages/AdminPromoEventPage";
import { AdminProductsPage } from "./admin/pages/AdminProductsPage";
import { AddEditProductPage } from "./admin/pages/AddEditProductPage";
import { AdminRequireManager } from "./admin/components/AdminRequireManager";
import { AdminEmployeesPage } from "./admin/pages/AdminEmployeesPage";
import { AdminTagsPage } from "./admin/pages/AdminTagsPage";
import { AdminInstallmentsPage } from "./admin/pages/AdminInstallmentsPage";
import { AdminPromoPopupPage } from "./admin/pages/AdminPromoPopupPage";
import { AdminVouchersPage } from "./admin/pages/AdminVouchersPage";
import { AdminInquiriesPage } from "./admin/pages/AdminInquiriesPage";
import { AdminCustomersPage } from "./admin/pages/AdminCustomersPage";
import { AdminMessagesPage } from "./admin/pages/AdminMessagesPage";
import { AdminAnalyticsPage } from "./admin/pages/AdminAnalyticsPage";
import { AdminPromotionsPage } from "./admin/pages/AdminPromotionsPage";
import { AdminStoreSettingsPage } from "./admin/pages/AdminStoreSettingsPage";
import { AdminProfilePage } from "./admin/pages/AdminProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "products", Component: ProductsPage },
      { path: "brands", Component: BrandsPage },
      { path: "cool-deals", Component: CoolDealsPage },
      { path: "product/:id", Component: ProductDetailPage },
      { path: "compare", Component: ComparePage },
      { path: "why-hamel", Component: WhyHamelPage },
      { path: "contact", Component: ContactPage },
      { path: "privacy-policy", Component: PrivacyPolicyPage },
      { path: "promo/:slug", Component: PromoLandingPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminRoot,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "login", Component: AdminLoginPage },
      { path: "forgot-password", Component: AdminForgotPasswordPage },
      { path: "reset-password", Component: AdminResetPasswordPage },
      {
        Component: AdminRequireAuth,
        children: [
          {
            Component: AdminLayout,
            children: [
              { path: "dashboard", Component: DashboardPage },
              { path: "pages", Component: AdminPagesHub },
              { path: "promo-event", Component: AdminPromoEventPage },
              { path: "banners", element: <Navigate to="/admin/pages?tab=home" replace /> },
              { path: "promo-pages", element: <Navigate to="/admin/pages?tab=promo" replace /> },
              { path: "cool-deals", element: <Navigate to="/admin/pages?tab=cool-deals" replace /> },
              { path: "tags", Component: AdminTagsPage },
              { path: "installments", Component: AdminInstallmentsPage },
              { path: "promo-popup", Component: AdminPromoPopupPage },
              { path: "vouchers", Component: AdminVouchersPage },
              { path: "products", Component: AdminProductsPage },
              { path: "products/new", Component: AddEditProductPage },
              { path: "products/:id/edit", Component: AddEditProductPage },
              { path: "products/edit/:id", Component: AddEditProductPage },
              { path: "inquiries", Component: AdminInquiriesPage },
              { path: "customers", Component: AdminCustomersPage },
              { path: "messages", Component: AdminMessagesPage },
              { path: "analytics", Component: AdminAnalyticsPage },
              { path: "promos", Component: AdminPromotionsPage },
              {
                path: "employees",
                Component: AdminRequireManager,
                children: [{ index: true, Component: AdminEmployeesPage }],
              },
              { path: "settings", Component: AdminStoreSettingsPage },
              { path: "profile", Component: AdminProfilePage },
            ],
          },
        ],
      },
    ],
  },
]);
