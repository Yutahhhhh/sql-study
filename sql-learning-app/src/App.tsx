import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Home } from './pages/Home';

// SQLエディタ/パーサー/エンジンを含むページはHomeバンドルから分離する
const GuidePage = lazy(() => import('./pages/GuidePage').then((m) => ({ default: m.GuidePage })));
const ChallengePage = lazy(() => import('./pages/ChallengePage').then((m) => ({ default: m.ChallengePage })));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage').then((m) => ({ default: m.PlaygroundPage })));

const routerBasename =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '');

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-500">
    <Loader2 size={20} className="animate-spin mr-2" />
    読み込み中...
  </div>
);

function App() {
  return (
    <Router basename={routerBasename}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guides/:slug" element={<GuidePage />} />
          <Route path="/challenges/:slug" element={<ChallengePage />} />
          <Route path="/playground/:slug" element={<PlaygroundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
