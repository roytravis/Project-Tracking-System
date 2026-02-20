import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ProjectTrack <span>— Sistem Pelacakan Proyek</span></h1>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}
