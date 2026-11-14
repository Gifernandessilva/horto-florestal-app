/* cspell:disable */
import { useState, useEffect } from 'react';

// Função auxiliar para carregar o estado salvo no telemóvel/computador sem causar erro no useEffect
function carregarEstadoInicial() {
  const savedState = localStorage.getItem('@horto:timer_state');
  if (savedState) {
    try {
      const { running, startTimestamp, accumulated } = JSON.parse(savedState);
      if (running && startTimestamp) {
        const now = Math.floor(Date.now() / 1000);
        return { running: true, seconds: accumulated + (now - startTimestamp) };
      }
      return { running: false, seconds: accumulated || 0 };
    } catch {
      return { running: false, seconds: 0 };
    }
  }
  return { running: false, seconds: 0 };
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Inicializa o cronómetro lendo direto do armazenamento local
  const [isRunning, setIsRunning] = useState(() => carregarEstadoInicial().running);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => carregarEstadoInicial().seconds);
  const [revisitas, setRevisitas] = useState(2);
  const [estudos, setEstudos] = useState(1);

  const [savedHoursMonth, setSavedHoursMonth] = useState(18);
  const metaMensal = 50;

  // 1. Monitorizar apenas a ligação à internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Motor do Cronómetro
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      const startTimestamp = Math.floor(Date.now() / 1000) - elapsedSeconds;
      localStorage.setItem(
        '@horto:timer_state',
        JSON.stringify({ running: true, startTimestamp, accumulated: elapsedSeconds })
      );

      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        setElapsedSeconds(now - startTimestamp);
      }, 1000);
    } else {
      localStorage.setItem(
        '@horto:timer_state',
        JSON.stringify({ running: false, startTimestamp: null, accumulated: elapsedSeconds })
      );
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedSeconds]);

  const formatTime = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const finalizarSessao = () => {
    setIsRunning(false);
    const novoRegistro = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      durationSec: elapsedSeconds,
      revisitas,
      estudos,
      synced: isOnline,
    };

    const filaOffline = JSON.parse(localStorage.getItem('@horto:offline_queue') || '[]');
    filaOffline.push(novoRegistro);
    localStorage.setItem('@horto:offline_queue', JSON.stringify(filaOffline));

    const horasAdicionais = +(elapsedSeconds / 3600).toFixed(2);
    setSavedHoursMonth((prev) => +(prev + horasAdicionais).toFixed(1));
    setElapsedSeconds(0);
    localStorage.removeItem('@horto:timer_state');

    alert(
      isOnline
        ? 'Relatório guardado e sincronizado!'
        : 'Modo Offline: Relatório guardado no dispositivo! Sincronizará quando houver internet.'
    );
  };

  const progressoPercentual = Math.min(Math.round((savedHoursMonth / metaMensal) * 100), 100);

  return (
    <div className={darkMode ? 'bg-[#121A13] text-[#EAECE9] min-h-screen' : 'bg-[#2C3A2B] text-white min-h-screen'}>
      <div className="max-w-md mx-auto p-5 flex flex-col justify-between min-h-screen font-sans">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 px-3 rounded-full bg-[#1E2B20] border border-[#3A4D3C] text-xs font-medium cursor-pointer"
            >
              {darkMode ? '🌙 Modo Noturno' : '☀️ Modo Claro'}
            </button>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                isOnline
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                  : 'bg-[#253226] border-[#526953] text-[#B7C9B5]'
              }`}
            >
              {isOnline ? '☁️ Online' : '⚡ Offline • Guardando local'}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#253526] border border-[#4A634C] flex items-center justify-center font-bold text-lg">
              🌿
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wider uppercase leading-tight">
                Horto Florestal <span className="text-xs bg-[#8FA38B] text-[#121A13] px-1.5 py-0.5 rounded">APP</span>
              </h1>
              <p className="text-sm text-[#A5B8A3]">Olá, Taylyson!</p>
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-[#8FA38B] mt-4 mb-2">
            Cronómetro de Atividade • Modo Pioneiro
          </p>

          <div className={`rounded-2xl p-6 text-center shadow-lg border ${
            darkMode ? 'bg-[#1A261C] border-[#2F4231]' : 'bg-[#F4F5F0] text-[#1C281D] border-[#D5DDD3]'
          }`}>
            <div className="w-48 h-48 mx-auto rounded-full border-8 border-[#4A6B4D] flex flex-col items-center justify-center mb-5">
              <span className="text-4xl font-mono font-extrabold tracking-tight">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-[11px] opacity-75 mt-1">
                {isRunning ? 'Em andamento...' : 'Pausado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="py-3 px-4 rounded-xl font-bold uppercase text-sm bg-[#466044] hover:bg-[#537150] text-white transition cursor-pointer"
              >
                {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
              </button>
              <button
                onClick={finalizarSessao}
                disabled={elapsedSeconds === 0}
                className="py-3 px-4 rounded-xl font-bold uppercase text-sm bg-[#EAECE9] text-[#1A261C] hover:bg-white disabled:opacity-40 transition cursor-pointer"
              >
                ⏹ Finalizar
              </button>
            </div>
          </div>

          <div className={`mt-4 rounded-2xl p-4 border ${
            darkMode ? 'bg-[#1A261C] border-[#2F4231]' : 'bg-[#F4F5F0] text-[#1C281D]'
          }`}>
            <div className="flex justify-between text-sm font-bold mb-1">
              <span>Meta do Mês</span>
              <span>{savedHoursMonth}h de {metaMensal}h ({progressoPercentual}%)</span>
            </div>
            <div className="w-full h-3 bg-[#101711] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#648C61] transition-all duration-300"
                style={{ width: `${progressoPercentual}%` }}
              />
            </div>
            <p className="text-xs opacity-75 mt-1.5">
              Pioneiro: acompanhe o seu objetivo mensal em tempo real
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#1A261C] border border-[#2F4231] rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Revisitas: {revisitas}</span>
              <button
                onClick={() => setRevisitas(revisitas + 1)}
                className="w-8 h-8 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="bg-[#1A261C] border border-[#2F4231] rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Estudos: {estudos}</span>
              <button
                onClick={() => setEstudos(estudos + 1)}
                className="w-8 h-8 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <nav className="mt-6 bg-[#1A261C] border border-[#2F4231] rounded-2xl p-3 flex justify-around text-xs text-[#A5B8A3]">
          <button className="flex flex-col items-center text-white font-bold cursor-pointer">🏠<span>Início</span></button>
          <button className="flex flex-col items-center cursor-pointer">📅<span>Escalas</span></button>
          <button className="flex flex-col items-center cursor-pointer">🗺️<span>Territórios</span></button>
          <button className="flex flex-col items-center cursor-pointer">📊<span>Relatórios</span></button>
        </nav>
      </div>
    </div>
  );
}