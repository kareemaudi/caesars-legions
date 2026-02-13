import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { ChatView } from './components/chat/ChatView';
import { LeadsView } from './components/leads/LeadsView';
import { CMOView } from './components/cmo/CMOView';
import { CSView } from './components/cs/CSView';
import { CFOView } from './components/cfo/CFOView';
import { WebsiteView } from './components/website/WebsiteView';
import { SettingsView } from './components/settings/SettingsView';
import { AgentsView } from './components/agents/AgentsView';
import { I18nProvider } from './lib/i18n';

function App() {
  return (
    <I18nProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<LoginPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/chat" replace />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="leads" element={<LeadsView />} />
          <Route path="cmo" element={<CMOView />} />
          <Route path="cs" element={<CSView />} />
          <Route path="cfo" element={<CFOView />} />
          <Route path="website" element={<WebsiteView />} />
          <Route path="agents" element={<AgentsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
