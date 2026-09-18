import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "./hooks/useAuth";


function App() {
  // Window error listener for Stale/Old Chunk Error
  window.addEventListener('error', (event) => {
    const isChunkError =
      /loading chunk/i.test(event.message) ||
      /loading CSS chunk/i.test(event.message) ||
      /failed to fetch dynamically imported module/i.test(event.message);

    if (isChunkError) {
      // Prevent infinite loop using SessionStorage
      const isReloaded = sessionStorage.getItem('chunk_reload');
      if (!isReloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload(true); // Force reload to fetch latest index.html
      }
    }
  });

  // Clear reload flag on successful load
  window.addEventListener('DOMContentLoaded', () => {
    sessionStorage.removeItem('chunk_reload');
  });
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
