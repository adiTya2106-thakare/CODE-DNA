import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Landing from './pages/Landing';
import CodeLab from './pages/CodeLab';
import TimeMachine from './pages/TimeMachine';
import BugAutopsy from './pages/BugAutopsy';
import WhatIf from './pages/WhatIf';
import ImpactGraph from './pages/ImpactGraph';
import Learning from './pages/Learning';
import DNADashboard from './pages/DNADashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-deep)' }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/lab" element={<CodeLab />} />
            <Route path="/time-machine" element={<TimeMachine />} />
            <Route path="/bug-autopsy" element={<BugAutopsy />} />
            <Route path="/what-if" element={<WhatIf />} />
            <Route path="/impact-graph" element={<ImpactGraph />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/dna-dashboard" element={<DNADashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
