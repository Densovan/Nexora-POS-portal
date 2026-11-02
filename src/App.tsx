import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@nexora/auth';
import { RegisterProvider } from './registers/RegisterProvider';
import { PosLayout } from './components/PosLayout';
import { RequireFeature } from './components/RequireFeature';
import { PosLoginPage } from './features/auth/PosLoginPage';
import { RegisterSelectionPage } from './features/register/RegisterSelectionPage';
import { SalePage } from './features/sale/SalePage';
import { ShiftPage } from './features/shift/ShiftPage';
import { ShiftHistoryPage } from './features/shift/ShiftHistoryPage';
import { ShiftDetailPage } from './features/shift/ShiftDetailPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { ReceiptPage } from './features/transactions/ReceiptPage';
import { DailyReportPage } from './features/reports/DailyReportPage';
import { PosProfilePage } from './features/profile/PosProfilePage';
import { NotFoundPage } from './features/NotFoundPage';

export function App() {
  return (
    <RegisterProvider>
      <Routes>
        <Route path="/login" element={<PosLoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <RequireFeature feature="POS">
                <PosLayout />
              </RequireFeature>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/sale" replace />} />
          <Route path="/register" element={<RegisterSelectionPage />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/shift" element={<ShiftPage />} />
          <Route path="/shift/history" element={<ShiftHistoryPage />} />
          <Route path="/shift/:shiftId" element={<ShiftDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:saleId" element={<ReceiptPage />} />
          <Route path="/reports" element={<DailyReportPage />} />
          <Route path="/profile" element={<PosProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </RegisterProvider>
  );
}
