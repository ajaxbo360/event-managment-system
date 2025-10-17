import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import AppRoutes from "./routes/AppRoutes.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
