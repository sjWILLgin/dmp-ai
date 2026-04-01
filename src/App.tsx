import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import DataMapPage from './pages/DataMapPage'
import AssetListPage from './pages/AssetListPage'
import GovernanceCenterPage from './pages/GovernanceCenterPage'
import TagsPortraitPage from './pages/TagsPortraitPage'
import ApplicationDeliveryPage from './pages/ApplicationDeliveryPage'
import ValueOpsPage from './pages/ValueOpsPage'
import MonitoringPage from './pages/MonitoringPage'
import MetricsPage from './pages/MetricsPage'
import MdmCenterPage from './pages/MdmCenterPage'
import RegistryPage from './pages/RegistryPage'
import SourceRegistryPage from './pages/SourceRegistryPage'
import ReportOverviewPage from './pages/ReportOverviewPage'


export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<DataMapPage />} />
        <Route path="/assets" element={<AssetListPage />} />
  <Route path="/registry" element={<Navigate to="/source-registry" replace />} />
        <Route path="/mdm" element={<MdmCenterPage />} />
        <Route path="/source-registry" element={<SourceRegistryPage />} />
  <Route path="/reports" element={<ReportOverviewPage />} />


        <Route path="/governance" element={<GovernanceCenterPage />} />
        <Route path="/tags" element={<TagsPortraitPage />} />
        <Route path="/delivery" element={<ApplicationDeliveryPage />} />
        <Route path="/value" element={<ValueOpsPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </AppLayout>
  )
}
