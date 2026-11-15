/* cspell:disable */
import { useState, useEffect, useCallback } from 'react';

type Tab = 'inicio' | 'escalas' | 'territorios' | 'relatorios';

interface TimeSession {
  id: string;
  memberId?: string;
  date: string;
  durationSec: number;
  revisitas: number;
  estudos: number;
  synced?: boolean;
}

interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: string;
  monthlyGoal: number;
  serviceGroup: string;
  timeLogs?: TimeSession[];
}

interface TerritoryItem {
  id: string;
  nome: string;
  quadras: number;
  status: string;
  responsavel: string;
  lat: number;
  lng: number;
}

const API_URL = 'http://localhost:3000/api';

function lerCronometroDoUtilizador(userId: string) {
  const savedTimer = localStorage.getItem(`@horto:timer_${userId}`);
  if (savedTimer) {
    try {
      const { running, startTimestamp, accumulated } = JSON.parse(savedTimer);
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
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<MemberProfile | null>(null);
  const [territorios, setTerritorios] = useState<TerritoryItem[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [darkMode, setDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingDb, setLoadingDb] = useState(true);

  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('PUBLICADOR');
  const [newGoal, setNewGoal] = useState(0);
  const [newGroup, setNewGroup] = useState('Grupo 1 - Horto');

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [revisitas, setRevisitas] = useState(2);
  const [estudos, setEstudos] = useState(1);

  const [sessions, setSessions] = useState<TimeSession[]>(() => {
    return JSON.parse(localStorage.getItem('@horto:offline_queue') || '[]');
  });

  const [escalas, setEscalas] = useState([
    { id: 1, cargo: 'Indicador de Entrada', data: 'Domingo, 15 Nov • 10:00', responsavel: 'Taylyson', status: 'pendente' },
    { id: 2, cargo: 'Operador de Áudio e Vídeo', data: 'Quinta, 19 Nov • 19:30', responsavel: 'Wdeyverson', status: 'confirmado' },
    { id: 3, cargo: 'Microfone Volante', data: 'Domingo, 22 Nov • 10:00', responsavel: 'Taylyson', status: 'pendente' },
    { id: 4, cargo: 'Leitor do Estudo', data: 'Domingo, 22 Nov • 10:40', responsavel: 'Marcos Silva', status: 'confirmado' },
  ]);

  const aplicarUtilizador = useCallback((u: MemberProfile | null) => {
    setCurrentUser(u);
    if (u) {
      localStorage.setItem('@horto:current_user_id', u.id);
      const estado = lerCronometroDoUtilizador(u.id);
      setIsRunning(estado.running);
      setElapsedSeconds(estado.seconds);
    } else {
      setIsRunning(false);
      setElapsedSeconds(0);
    }
  }, []);

  const carregarDadosDoBanco = useCallback(async () => {
    try {
      const [resMembers, resTerritories] = await Promise.all([
        fetch(`${API_URL}/members`),
        fetch(`${API_URL}/territories`),
      ]);

      if (resMembers.ok && resTerritories.ok) {
        const listaMembros: MemberProfile[] = await resMembers.json();
        const listaTerritorios: TerritoryItem[] = await resTerritories.json();

        setMembers(listaMembros);
        setTerritorios(listaTerritorios);

        const savedUserId = localStorage.getItem('@horto:current_user_id');
        const encontrado =
          listaMembros.find((m) => m.id === savedUserId) ||
          listaMembros.find((m) => m.name === 'Taylyson') ||
          listaMembros[0];

        if (encontrado) {
          aplicarUtilizador(encontrado);
        }
      }
    } catch (err) {
      console.warn('Modo Offline: a usar cache local.', err);
    } finally {
      setLoadingDb(false);
    }
  }, [aplicarUtilizador]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDadosDoBanco();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDadosDoBanco]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      carregarDadosDoBanco();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [carregarDadosDoBanco]);

  // Motor do Cronómetro Persistente
  useEffect(() => {
    if (!currentUser) return;
    const storageKey = `@horto:timer_${currentUser.id}`;
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      const startTimestamp = Math.floor(Date.now() / 1000) - elapsedSeconds;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running: true, startTimestamp, accumulated: elapsedSeconds })
      );
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        setElapsedSeconds(now - startTimestamp);
      }, 1000);
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running: false, startTimestamp: null, accumulated: elapsedSeconds })
      );
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedSeconds, currentUser]);

  const formatTime = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const finalizarSessao = async () => {
    if (!currentUser) return;
    setIsRunning(false);

    const novoRegistro: TimeSession = {
      id: crypto.randomUUID(),
      memberId: currentUser.id,
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      durationSec: elapsedSeconds,
      revisitas,
      estudos,
      synced: false,
    };

    const novaFila = [novoRegistro, ...sessions];
    setSessions(novaFila);
    localStorage.setItem('@horto:offline_queue', JSON.stringify(novaFila));
    setElapsedSeconds(0);
    localStorage.removeItem(`@horto:timer_${currentUser.id}`);

    try {
      const res = await fetch(`${API_URL}/timelogs/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.id,
          logs: [novoRegistro],
        }),
      });

      if (res.ok) {
        const filaAtualizada = novaFila.map((s) =>
          s.id === novoRegistro.id ? { ...s, synced: true } : s
        );
        setSessions(filaAtualizada);
        localStorage.setItem('@horto:offline_queue', JSON.stringify(filaAtualizada));
        await carregarDadosDoBanco();
        alert(`✅ Sessão de ${currentUser.name} gravada no banco PostgreSQL (Neon)!`);
        return;
      }
    } catch {
      // Sem ligação, mantém guardado localmente
    }

    alert(`⚡ Modo Offline: Sessão guardada no aparelho de ${currentUser.name}!`);
  };

  const assumirTerritorioNoBanco = async (territorioId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/territories/${territorioId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel: currentUser.name,
          status: 'Em andamento',
        }),
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Sem ligação ao servidor de momento.');
    }
  };

  const cadastrarNovoMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          pin: '1234',
          role: newRole,
          monthlyGoal: newGoal,
          serviceGroup: newGroup,
        }),
      });

      if (res.ok) {
        const criado: MemberProfile = await res.json();
        await carregarDadosDoBanco();
        aplicarUtilizador(criado);
        setShowNewMemberForm(false);
        setNewName('');
        setNewPhone('');
        alert(`🎉 Membro "${criado.name}" registado com sucesso no PostgreSQL!`);
      }
    } catch {
      alert('Erro ao registar membro. Verifique se o backend está a correr.');
    }
  };

  const selecionarUsuario = (u: MemberProfile) => {
    aplicarUtilizador(u);
    setActiveTab('inicio');
  };

  const cardStyle = darkMode
    ? 'bg-[#1A261C] border-[#2F4231] text-[#EAECE9]'
    : 'bg-[#F4F5F0] border-[#D5DDD3] text-[#1C281D]';

  if (!currentUser) {
    return (
      <div className="bg-[#121A13] text-[#EAECE9] min-h-screen flex items-center justify-center p-5 font-sans">
        <div className="max-w-sm w-full bg-[#1A261C] border border-[#2F4231] rounded-3xl p-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#253526] border border-[#4A634C] flex items-center justify-center text-2xl mb-3">
            🌿
          </div>
          <h1 className="text-xl font-extrabold text-center uppercase tracking-wider">
            Horto Florestal <span className="text-xs bg-[#8FA38B] text-[#121A13] px-1.5 py-0.5 rounded">APP</span>
          </h1>
          <p className="text-xs text-center text-[#A5B8A3] mt-1 mb-5">
            {loadingDb ? 'A ligar ao PostgreSQL...' : 'Escolha o seu nome ou registe-se na congregação:'}
          </p>

          {!showNewMemberForm ? (
            <>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {members.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selecionarUsuario(u)}
                    className="w-full p-3.5 rounded-xl bg-[#233325] hover:bg-[#2F4432] border border-[#3A523D] flex justify-between items-center text-left transition cursor-pointer"
                  >
                    <div>
                      <strong className="text-sm block text-white">{u.name}</strong>
                      <span className="text-[11px] text-[#A5B8A3]">{u.serviceGroup}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-[#466044] text-white">
                      {u.role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewMemberForm(true)}
                className="mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
              >
                + Cadastrar Novo Membro no Banco
              </button>
            </>
          ) : (
            <form onSubmit={cadastrarNovoMembro} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lucas Oliveira"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 68999991234"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Modalidade:</label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value);
                    if (e.target.value === 'PIONEIRO_REGULAR') setNewGoal(50);
                    else if (e.target.value === 'PIONEIRO_AUXILIAR') setNewGoal(30);
                    else setNewGoal(0);
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                >
                  <option value="PUBLICADOR">Publicador</option>
                  <option value="PIONEIRO_AUXILIAR">Pioneiro Auxiliar (30h)</option>
                  <option value="PIONEIRO_REGULAR">Pioneiro Regular (50h)</option>
                  <option value="ADMIN">Administrador / Secretário</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Grupo de Campo:</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMemberForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#4A634C] text-[#EAECE9] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg font-bold bg-[#466044] text-white cursor-pointer"
                >
                  Salvar no Banco
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const logsDoBanco = currentUser.timeLogs || [];
  const segundosNoBanco = logsDoBanco.reduce((acc, item) => acc + item.durationSec, 0);
  const horasSalvas = +(18 + segundosNoBanco / 3600).toFixed(2);
  const metaMensal = currentUser.monthlyGoal || 50;
  const progressoPercentual = Math.min(Math.round((horasSalvas / metaMensal) * 100), 100);

  return (
    <div className={darkMode ? 'bg-[#121A13] text-[#EAECE9] min-h-screen' : 'bg-[#2C3A2B] text-white min-h-screen'}>
      <div className="max-w-md mx-auto p-5 flex flex-col justify-between min-h-screen font-sans">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 px-3 rounded-full bg-[#1E2B20] border border-[#3A4D3C] text-xs font-medium cursor-pointer text-white"
            >
              {darkMode ? '🌙 Noturno' : '☀️ Claro'}
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isOnline
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                    : 'bg-[#253226] border-[#526953] text-[#B7C9B5]'
                }`}
              >
                {isOnline ? '🗄️ PostgreSQL Online' : '⚡ Offline'}
              </span>

              <button
                onClick={() => aplicarUtilizador(null)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2C3E2E] border border-[#4A634C] text-[#EAECE9] cursor-pointer"
              >
                👤 Trocar ({members.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#253526] border border-[#4A634C] flex items-center justify-center font-bold text-lg">
              🌿
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider uppercase leading-tight">
                Horto Florestal <span className="text-[10px] bg-[#8FA38B] text-[#121A13] px-1.5 py-0.5 rounded">APP</span>
              </h1>
              <p className="text-sm text-[#A5B8A3]">
                Olá, <strong className="text-white">{currentUser.name}</strong>! • <span className="text-xs">{currentUser.serviceGroup}</span>
              </p>
            </div>
          </div>

          {activeTab === 'inicio' && (
            <div>
              <div
                onClick={() => setActiveTab('escalas')}
                className={`rounded-2xl p-3.5 mb-4 border cursor-pointer flex justify-between items-center ${cardStyle}`}
              >
                <div>
                  <span className="text-[11px] uppercase tracking-wider opacity-75 block">Escala da Congregação:</span>
                  <strong className="text-sm">Indicador de Entrada • Domingo, 10h</strong>
                </div>
                <span className="text-xs bg-[#466044] text-white px-2.5 py-1 rounded-lg font-semibold">Escalas →</span>
              </div>

              <div className={`rounded-2xl p-6 text-center shadow-lg border ${cardStyle}`}>
                <div className="w-44 h-44 mx-auto rounded-full border-8 border-[#4A6B4D] flex flex-col items-center justify-center mb-5">
                  <span className="text-4xl font-mono font-extrabold tracking-tight">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-[11px] opacity-75 mt-1">
                    {isRunning ? 'Gravando tempo...' : 'Pausado'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="py-3 px-4 rounded-xl font-bold uppercase text-sm bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                  >
                    {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
                  </button>
                  <button
                    onClick={finalizarSessao}
                    disabled={elapsedSeconds === 0}
                    className="py-3 px-4 rounded-xl font-bold uppercase text-sm bg-[#EAECE9] text-[#1A261C] disabled:opacity-40 cursor-pointer"
                  >
                    ⏹ Salvar no BD
                  </button>
                </div>
              </div>

              {currentUser.monthlyGoal > 0 && (
                <div className={`mt-4 rounded-2xl p-4 border ${cardStyle}`}>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span>Meta do Mês ({currentUser.role.replace('_', ' ')})</span>
                    <span>{horasSalvas}h de {metaMensal}h ({progressoPercentual}%)</span>
                  </div>
                  <div className="w-full h-3 bg-[#101711] rounded-full overflow-hidden">
                    <div className="h-full bg-[#648C61]" style={{ width: `${progressoPercentual}%` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-sm font-semibold">Revisitas: {revisitas}</span>
                  <button onClick={() => setRevisitas(revisitas + 1)} className="w-8 h-8 rounded-lg bg-[#466044] text-white font-bold cursor-pointer">+</button>
                </div>
                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-sm font-semibold">Estudos: {estudos}</span>
                  <button onClick={() => setEstudos(estudos + 1)} className="w-8 h-8 rounded-lg bg-[#466044] text-white font-bold cursor-pointer">+</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escalas' && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                Quadro Geral de Designações
              </h2>
              {escalas.map((item) => {
                const isMine = item.responsavel === currentUser.name;
                return (
                  <div key={item.id} className={`rounded-2xl p-4 border ${cardStyle} ${isMine ? 'ring-2 ring-[#648C61]' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{item.cargo}</h3>
                        <p className="text-xs opacity-80">{item.data}</p>
                        <p className="text-xs font-semibold text-[#8FA38B] mt-1">
                          Designado: {item.responsavel} {isMine && '(Você)'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#253526] text-[#A5B8A3]">
                        {item.status}
                      </span>
                    </div>
                    {isMine && (
                      <button
                        onClick={() => setEscalas(escalas.map((e) => (e.id === item.id ? { ...e, status: 'confirmado' } : e)))}
                        className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-[#466044] text-white cursor-pointer"
                      >
                        ✓ Confirmar Minha Presença
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'territorios' && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                Territórios no Banco de Dados ({territorios.length})
              </h2>
              {territorios.map((t) => (
                <div key={t.id} className={`rounded-2xl p-4 border ${cardStyle}`}>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold bg-[#466044] text-white px-2 py-0.5 rounded">{t.id}</span>
                    <span className="text-xs opacity-80">{t.status}</span>
                  </div>
                  <h3 className="font-bold text-sm mt-1.5">{t.nome}</h3>
                  <p className="text-xs opacity-75">Responsável atual: <strong>{t.responsavel}</strong> ({t.quadras} quadras)</p>
                  {t.status === 'Disponível' && (
                    <button
                      onClick={() => assumirTerritorioNoBanco(t.id)}
                      className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-[#466044] text-white cursor-pointer"
                    >
                      Assumir Território ({currentUser.name})
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold mb-3">
                Relatório Mensal • {currentUser.name}
              </h2>
              <div className={`rounded-2xl p-4 border mb-4 ${cardStyle}`}>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="p-2 rounded-xl bg-[#121A13]/40">
                    <span className="text-xs opacity-75 block">Horas</span>
                    <strong className="text-lg">{horasSalvas}h</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121A13]/40">
                    <span className="text-xs opacity-75 block">Revisitas</span>
                    <strong className="text-lg">{revisitas}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121A13]/40">
                    <span className="text-xs opacity-75 block">Estudos</span>
                    <strong className="text-lg">{estudos}</strong>
                  </div>
                </div>
              </div>

              {currentUser.role === 'ADMIN' && (
                <div className={`rounded-2xl p-4 border mb-4 border-emerald-700/60 ${cardStyle}`}>
                  <h3 className="text-xs font-extrabold uppercase text-emerald-400 mb-2">
                    🛡️ Painel do Secretário • Membros no PostgreSQL ({members.length})
                  </h3>
                  <div className="space-y-2 text-xs">
                    {members.map((m) => (
                      <div key={m.id} className="flex justify-between items-center p-2 rounded-lg bg-[#121A13]/40">
                        <div>
                          <strong>{m.name}</strong>
                          <span className="block text-[10px] opacity-70">{m.serviceGroup} • {m.role}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">
                          {(m.timeLogs || []).length} sessões no BD
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-xs uppercase tracking-widest text-[#8FA38B] mb-2 font-bold">
                Sessões Gravadas no PostgreSQL ({logsDoBanco.length})
              </h3>
              <div className="space-y-2">
                {logsDoBanco.map((s) => (
                  <div key={s.id} className={`rounded-xl p-3 border flex justify-between items-center text-xs ${cardStyle}`}>
                    <div>
                      <strong className="block">{s.date}</strong>
                      <span className="opacity-75">Duração: {formatTime(s.durationSec)}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">
                      🗄️ Salvo no Neon DB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="mt-6 bg-[#1A261C] border border-[#2F4231] rounded-2xl p-2.5 flex justify-around text-xs text-[#A5B8A3]">
          <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'inicio' ? 'text-white font-bold bg-[#28382A]' : ''}`}>🏠<span>Início</span></button>
          <button onClick={() => setActiveTab('escalas')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'escalas' ? 'text-white font-bold bg-[#28382A]' : ''}`}>📅<span>Escalas</span></button>
          <button onClick={() => setActiveTab('territorios')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'territorios' ? 'text-white font-bold bg-[#28382A]' : ''}`}>🗺️<span>Territórios</span></button>
          <button onClick={() => setActiveTab('relatorios')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'relatorios' ? 'text-white font-bold bg-[#28382A]' : ''}`}>📊<span>Relatórios</span></button>
        </nav>
      </div>
    </div>
  );
}