import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './socket/SocketProvider';
import { GameStateProvider } from './state/GameStateContext';
import LandingPage from './pages/LandingPage';
import HostPage from './pages/HostPage';
import PlayPage from './pages/PlayPage';
import WatchPage from './pages/WatchPage';
import AdminPage from './pages/AdminPage';

export default function App() {
    return (
        <SocketProvider>
            <GameStateProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/host" element={<HostPage />} />
                    <Route path="/play" element={<PlayPage />} />
                    <Route path="/watch" element={<WatchPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </GameStateProvider>
        </SocketProvider>
    );
}
