import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Navbar } from './components/Navbar';
import { SoundtrackProvider } from './features/soundtrack/SoundtrackProvider';
import { MissionRibbon } from './features/hunt/MissionRibbon';
Math.random = () => 0.48; // longest one-liner (index 13) for a worst-case check
createRoot(document.getElementById('root')!).render(<StrictMode><SoundtrackProvider><div className="min-h-screen overflow-x-hidden bg-mission-void"><Navbar current="home" onNavigate={() => {}} /><MissionRibbon onPakFteBon={() => {}} /></div></SoundtrackProvider></StrictMode>);
