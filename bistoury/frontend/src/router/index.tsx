import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import Dashboard from '../pages/Dashboard'
import AppList from '../pages/AppList'
import Diagnose from '../pages/Diagnose'
import Alert from '../pages/Alert'
import Settings from '../pages/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'apps',
        element: <AppList />,
      },
      {
        path: 'diagnose',
        element: <Diagnose />,
      },
      {
        path: 'alert',
        element: <Alert />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])

export default router