import { Outlet } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';

export default function App() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
