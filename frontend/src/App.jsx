import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import NavBarAfterLogging from "./components/NavbarAfterLogging";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ForgetPassword from "./components/ForgetPassword";
import VerificationCode from "./components/VerificationCode";
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminDashboard from "./components/AdminDashboard";
import CashierDashboard from "./components/CashierDashboard"
import ImageUploadPage from "./pages/ImageUploadPage";
import ProductManagement from "./pages/ProductManagement";
import InventoryManagement from "./pages/InventoryManagement";
import PurchaseManagement from "./pages/PurchaseManagement";
import InventoryStock from "./pages/InventoryStock";
import RecipeManagement from "./pages/RecipeManagement";
import ProductStore from "./pages/ProductStore";
import Checkout from "./pages/Checkout";
import ProductionOrder from "./pages/ProductionOrder";
import ProductionOrderAtShop from "./pages/ProductionOrderAtShop";
import InventoryRelease from "./pages/InventoryRelease";
import ProductInventoryRelease from "./pages/ProductInventoryRelease";
import ProductLog from "./pages/ProductLog";
import POSSystem from "./pages/POSSystem";
import SalesDashboard from "./pages/admin/SalesDashboard";
import SaleDetails from "./pages/admin/SaleDetails";
import PaymentDetails from "./pages/admin/PaymentDetails";
import PaymentReports from "./pages/PaymentReports";
import SalesReports from "./pages/SalesReports";
import OrderReports from "./pages/OrderReports";
import About from "./pages/About";
import Services from "./pages/Services";
import Feedback from "./pages/Feedback";
import Orders from "./pages/Orders";
import Sales from "./pages/Sales";
import Anttable from "./pages/Anttable";
import UserManagement from "../src/components/UserManagement";
import Menu from "./pages/Menu";
import HomeAfterLogging from "./components/HomeAfterLogging";
import FeedbackAdmin from "./pages/AdminFeedback";
import PredictSales from "./pages/SalesPredictor";
import AIPrediction from "./pages/AIPrediction";
import AdminLayout from "./components/AdminLayout";
import CashierLayout from "./components/CashierLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  // Update the paths where no navbar should be shown
  const hideNavbarPaths = [
    "/login",
    "/signup",
    "/forget-password",
    "/verify-code",
    "/reset-password",
    "/order-confirmation",
    "/admin",
    "/cashier",
    "/menu"
  ];

  // Function to check if current path matches any of the patterns
  const matchesPattern = (path, patterns) => {
    return patterns.some(pattern => path.startsWith(pattern));
  };

  const shouldHideNavbar = matchesPattern(location.pathname, hideNavbarPaths);

  // Wrap component with AdminLayout for admin routes
  const withAdminLayout = (Component) => {
    return (
      <AdminLayout>
        <Component />
      </AdminLayout>
    );
  };

  // Wrap component with CashierLayout for cashier routes
  const withCashierLayout = (Component) => {
    return (
      <CashierLayout>
        <Component />
      </CashierLayout>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1d24]">
      {/* Show appropriate navbar based on user login status */}
      {!shouldHideNavbar && (
        user ? <NavBarAfterLogging /> : <Navbar />
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/verify-code" element={<VerificationCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/product-store" element={<ProductStore />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/production-order" element={<ProductionOrder />} />
        <Route path="/production-order-at-shop" element={<ProductionOrderAtShop />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/homeafterlogging" element={<HomeAfterLogging />} />

        {/* Legacy route redirects */}
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/cashier-dashboard" element={<Navigate to="/cashier/dashboard" replace />} />
        <Route path="/sales-reports" element={<Navigate to="/admin/sales-reports" replace />} />
        <Route path="/payment-reports" element={<Navigate to="/admin/payment-reports" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={withAdminLayout(AdminDashboard)} />
        <Route path="/admin/image-upload" element={withAdminLayout(ImageUploadPage)} />
        <Route path="/admin/products" element={withAdminLayout(ProductManagement)} />
        <Route path="/admin/inventory" element={withAdminLayout(InventoryManagement)} />
        <Route path="/admin/purchases" element={withAdminLayout(PurchaseManagement)} />
        <Route path="/admin/inventory-stock" element={withAdminLayout(InventoryStock)} />
        <Route path="/admin/recipes" element={withAdminLayout(RecipeManagement)} />
        <Route path="/admin/inventory-release" element={withAdminLayout(InventoryRelease)} />
        <Route path="/admin/production-release" element={withAdminLayout(ProductInventoryRelease)} />
        <Route path="/admin/product-log" element={withAdminLayout(ProductLog)} />
        <Route path="/admin/pos" element={withAdminLayout(POSSystem)} />
        <Route path="/admin/sales-dashboard" element={withAdminLayout(SalesDashboard)} />
        <Route path="/admin/sale/:id" element={withAdminLayout(SaleDetails)} />
        <Route path="/admin/payment/:payment_id" element={withAdminLayout(PaymentDetails)} />
        <Route path="/admin/payment-reports" element={withAdminLayout(PaymentReports)} />
        <Route path="/admin/sales-reports" element={withAdminLayout(SalesReports)} />
        <Route path="/admin/order-reports" element={withAdminLayout(OrderReports)} />
        <Route path="/admin/orders" element={withAdminLayout(Orders)} />
        <Route path="/admin/sales" element={withAdminLayout(Sales)} />
        <Route path="/admin/table" element={withAdminLayout(Anttable)} />
        <Route path="/admin/users" element={withAdminLayout(UserManagement)} />
        <Route path="/admin/feedback" element={withAdminLayout(FeedbackAdmin)} />
        <Route path="/admin/predict-sales" element={withAdminLayout(PredictSales)} />
        <Route path="/admin/ai-prediction" element={withAdminLayout(AIPrediction)} />

        {/* Cashier Routes */}
        <Route path="/cashier/dashboard" element={withCashierLayout(CashierDashboard)} />
        <Route path="/cashier/pos" element={withCashierLayout(POSSystem)} />
        <Route path="/cashier/orders" element={withCashierLayout(Orders)} />
        <Route path="/cashier/sales" element={withCashierLayout(Sales)} />
        <Route path="/cashier/product-log" element={withCashierLayout(ProductLog)} />
        <Route path="/cashier/sales-dashboard" element={withCashierLayout(SalesDashboard)} />
        <Route path="/cashier/sales-reports" element={withCashierLayout(SalesReports)} />
        <Route path="/cashier/payment-reports" element={withCashierLayout(PaymentReports)} />
        <Route path="/cashier/order-reports" element={withCashierLayout(OrderReports)} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default App;
