import AuthProvider from './Context/AuthContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <div>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  );
}

export default App;
