import { Navigate, Route, Routes } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { MetaProvider } from './context/MetaContext';
import { ImageAssetProvider } from './context/ImageAssetContext';
import MainMenu from './pages/MainMenu';
import ClassSelect from './pages/ClassSelect';
import ArtStudio from './pages/ArtStudio';
import ContentForge from './pages/ContentForge';
import BalanceLab from './pages/BalanceLab';
import ContinueView from './pages/ContinueView';
import MetaProgressView from './pages/MetaProgressView';
import RunGate from './pages/RunGate';

export default function App() {
  return (
    <MetaProvider>
      <ImageAssetProvider>
        <GameProvider>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/class-select" element={<ClassSelect />} />
              <Route path="/continue" element={<ContinueView />} />
              <Route path="/meta" element={<MetaProgressView />} />
              <Route path="/art-studio" element={<ArtStudio />} />
              <Route path="/content-forge" element={<ContentForge />} />
              <Route path="/balance-lab" element={<BalanceLab />} />
              <Route path="/run" element={<RunGate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </GameProvider>
      </ImageAssetProvider>
    </MetaProvider>
  );
}
