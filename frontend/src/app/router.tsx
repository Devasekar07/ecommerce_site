import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AccountPage } from "../features/account/pages/AccountPage";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { BasketPage } from "../features/cart/pages/BasketPage";
import { DepartmentPage } from "../features/catalog/pages/DepartmentPage";
import { HomePage } from "../features/catalog/pages/HomePage";
import { NotFoundPage } from "../features/catalog/pages/NotFoundPage";
import { ProductDetailPage } from "../features/catalog/pages/ProductDetailPage";
import { ProductListingPage } from "../features/catalog/pages/ProductListingPage";
import { SearchPage } from "../features/catalog/pages/SearchPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "search", element: <SearchPage /> },
      { path: "departments/:departmentSlug", element: <DepartmentPage /> },
      { path: "departments/:departmentSlug/:categorySlug", element: <ProductListingPage /> },
      { path: "products/:productSlug", element: <ProductDetailPage /> },
      { path: "basket", element: <BasketPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: "account", element: <AccountPage /> }]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
