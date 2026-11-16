
/* cspell:disable */
import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';

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

interface MonthlyReportItem {
  id: string;
  memberId: string;
  monthYear: string;
  totalHours: number;
  revisitas: number;
  estudos: number;
  observacoes?: string;
  status: string;
}

interface AssignmentItem {
  id: string;
  cargo: string;
  data: string;
  local: string;
  status: string;
  memberId: string;
  member?: {
    id: string;
    name: string;
  };
}

interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: string;
  monthlyGoal: number;
  yearlyGoal?: number;
  canUseTimer?: boolean;
  canViewAllHours?: boolean;
  canAssignParts?: boolean;
  serviceGroup: string;
  timeLogs?: TimeSession[];
  monthlyReports?: MonthlyReportItem[];
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const MES_ATUAL = '2026-11';

function isElderOrDev(user: MemberProfile | null) {
  if (!user) return false;
  return user.role === 'ANCIAO' || user.role === 'DESENVOLVEDOR' || user.role === 'ADMIN';
}

function canMemberUseTimer(user: MemberProfile | null) {
  if (!user) return false;
  return isElderOrDev(user) || user.canUseTimer === true;
}

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

function TerritoryMap({
  territorios,
  focoCoords,
  onSelectTerritory,
}: {
  territorios: TerritoryItem[];
  focoCoords: [number, number] | null;
  onSelectTerritory: (id: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-9.9508, -67.8248],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    layersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    territorios.forEach((t) => {
      const isDisponivel = t.status === 'Disponível';
      const cor = isDisponivel ? '#22c55e' : '#eab308';

      const deltaLat = 0.0014;
      const deltaLng = 0.0018;
      const bounds: L.LatLngTuple[] = [
        [t.lat - deltaLat, t.lat ? t.lng - deltaLng : -67.825],
        [t.lat + deltaLat, t.lng - deltaLng],
        [t.lat + deltaLat, t.lng + deltaLng],
        [t.lat - deltaLat, t.lng + deltaLng],
      ];

      const polygon = L.polygon(bounds, {
        color: cor,
        weight: 2,
        fillColor: cor,
        fillOpacity: 0.28,
      }).addTo(layerGroup);

      const badgeIcon = L.divIcon({
        className: 'custom-territory-pin',
        html: `<div style="
          background: ${isDisponivel ? '#15803d' : '#a16207'};
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.45);
          white-space: nowrap;
          text-align: center;
        ">${t.id}</div>`,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const marker = L.marker([t.lat, t.lng], { icon: badgeIcon }).addTo(layerGroup);

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 170px;">
          <strong style="font-size: 13px; color: #121A13;">${t.id} • ${t.nome}</strong>
          <p style="margin: 4px 0; font-size: 11px; color: #374151;">
            Status: <b>${t.status}</b><br/>
            Responsável: <b>${t.responsavel}</b><br/>
            Total: <b>${t.quadras} quadras</b>
          </p>
        </div>
      `;

      polygon.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      polygon.on('click', () => onSelectTerritory(t.id));
      marker.on('click', () => onSelectTerritory(t.id));
    });
  }, [territorios, onSelectTerritory]);

  useEffect(() => {
    if (mapInstanceRef.current && focoCoords) {
      mapInstanceRef.current.flyTo(focoCoords, 16, { duration: 0.8 });
    }
  }, [focoCoords]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2F4231] shadow-lg">
      <div ref={mapContainerRef} className="w-full h-64 z-0" />
      <div className="bg-[#152017] px-3 py-2 flex justify-between items-center text-[11px] border-t border-[#2F4231]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Disponível
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span> Em andamento
          </span>
        </div>
        <span className="text-[#8FA38B] font-semibold">Toque na quadra para detalhes</span>
      </div>
    </div>
  );
}

export default function App() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<MemberProfile | null>(null);
  const [territorios, setTerritorios] = useState<TerritoryItem[]>([]);
  const [escalas, setEscalas] = useState<AssignmentItem[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [darkMode, setDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingDb, setLoadingDb] = useState(true);

  const [focoMapa, setFocoMapa] = useState<[number, number] | null>(null);
  const [territorioDestacado, setTerritorioDestacado] = useState<string | null>(null);

  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('PUBLICADOR');
  const [newGoal, setNewGoal] = useState(0);
  const [newGroup, setNewGroup] = useState('Grupo 1 - Horto');

  // Estados para remoção protegida por senha (apenas Anciãos e Desenvolvedores)
  const [memberToDeleteId, setMemberToDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingMember, setDeletingMember] = useState(false);

  const [showNewAssignmentForm, setShowNewAssignmentForm] = useState(false);
  const [novoCargo, setNovoCargo] = useState('');
  const [novaDataEscala, setNovaDataEscala] = useState('');
  const [novoLocalEscala, setNovoLocalEscala] = useState('Salão Principal');
  const [membroDesignadoId, setMembroDesignadoId] = useState('');

  const [observacoesRelatorio, setObservacoesRelatorio] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [revisitas, setRevisitas] = useState(2);
  const [estudos, setEstudos] = useState(1);

  const [sessions, setSessions] = useState<TimeSession[]>(() => {
    return JSON.parse(localStorage.getItem('@horto:offline_queue') || '[]');
  });

  const aplicarUtilizador = useCallback((u: MemberProfile | null) => {
    setCurrentUser(u);
    setMemberToDeleteId(null);
    setDeletePassword('');
    if (u) {
      localStorage.setItem('@horto:current_user_id', u.id);
      if (!canMemberUseTimer(u)) {
        setIsRunning(false);
        setElapsedSeconds(0);
        return;
      }
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
      const [resMembers, resTerritories, resAssignments] = await Promise.all([
        fetch(`${API_URL}/members`),
        fetch(`${API_URL}/territories`),
        fetch(`${API_URL}/assignments`),
      ]);

      if (resMembers.ok && resTerritories.ok && resAssignments.ok) {
        const listaMembros: MemberProfile[] = await resMembers.json();
        const listaTerritorios: TerritoryItem[] = await resTerritories.json();
        const listaEscalas: AssignmentItem[] = await resAssignments.json();

        setMembers(listaMembros);
        setTerritorios(listaTerritorios);
        setEscalas(listaEscalas);

        if (listaMembros.length > 0 && !membroDesignadoId) {
          setMembroDesignadoId(listaMembros[0].id);
        }

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
  }, [aplicarUtilizador, membroDesignadoId]);

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

  const podeAtivarCronometro = canMemberUseTimer(currentUser);
  const podeVerTodasHoras = Boolean(currentUser && (currentUser.canViewAllHours || isElderOrDev(currentUser)));
  const podeEnviarDesignacoes = Boolean(currentUser && (currentUser.canAssignParts || isElderOrDev(currentUser)));
  const podeGerirPermissoes = isElderOrDev(currentUser);

  useEffect(() => {
    if (!currentUser || !podeAtivarCronometro) return;
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
  }, [isRunning, elapsedSeconds, currentUser, podeAtivarCronometro]);

  const formatTime = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const alternarCronometro = () => {
    if (!podeAtivarCronometro) {
      alert('🔒 O cronômetro está bloqueado para este perfil. Peça liberação a um Ancião ou Desenvolvedor.');
      return;
    }
    setIsRunning(!isRunning);
  };

  const finalizarSessao = async () => {
    if (!currentUser || !podeAtivarCronometro) {
      alert('🔒 O cronômetro está bloqueado para este perfil.');
      return;
    }
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
        const data = await res.json();
        if (data.error) {
          alert(`⚠️ ${data.error}`);
          return;
        }
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

  const atualizarTerritorioNoBanco = async (territorioId: string, novoStatus: string, novoResponsavel: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/territories/${territorioId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel: novoResponsavel,
          status: novoStatus,
        }),
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Sem ligação ao servidor de momento.');
    }
  };

  const confirmarEscalaNoBanco = async (escalaId: string) => {
    try {
      const res = await fetch(`${API_URL}/assignments/${escalaId}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao confirmar presença na escala.');
    }
  };

  const criarNovaEscalaNoBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviarDesignacoes || !novoCargo.trim() || !novaDataEscala.trim() || !membroDesignadoId) return;

    try {
      const res = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo: novoCargo,
          data: novaDataEscala,
          local: novoLocalEscala,
          memberId: membroDesignadoId,
          actorId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setNovoCargo('');
        setNovaDataEscala('');
        setShowNewAssignmentForm(false);
        await carregarDadosDoBanco();
        alert('📅 Nova designação / parte gravada no PostgreSQL!');
      }
    } catch {
      alert('Erro ao criar nova designação.');
    }
  };

  const alternarPermissaoMembro = async (
    targetMember: MemberProfile,
    campo: 'canUseTimer' | 'canViewAllHours' | 'canAssignParts'
  ) => {
    if (!currentUser || !podeGerirPermissoes) return;
    const valorAtual =
      campo === 'canUseTimer'
        ? Boolean(targetMember.canUseTimer)
        : campo === 'canViewAllHours'
        ? Boolean(targetMember.canViewAllHours)
        : Boolean(targetMember.canAssignParts);

    try {
      const res = await fetch(`${API_URL}/members/${targetMember.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          [campo]: !valorAtual,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          alert(`⚠️ ${data.error}`);
          return;
        }
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao atualizar permissão no banco.');
    }
  };

  const confirmarRemocaoMembro = async (targetMember: MemberProfile) => {
    if (!currentUser || !podeGerirPermissoes) {
      alert('🔒 Apenas Anciãos e Desenvolvedores podem remover membros.');
      return;
    }

    if (!deletePassword.trim()) {
      alert('🔑 Digite a sua senha para confirmar a remoção.');
      return;
    }

    setDeletingMember(true);
    try {
      const query = new URLSearchParams({
        actorId: currentUser.id,
        pin: deletePassword.trim(),
      });

      const res = await fetch(`${API_URL}/members/${targetMember.id}?${query.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.deleted === false) {
        alert(`⚠️ ${data.error || 'Não foi possível remover o membro.'}`);
        return;
      }

      setMemberToDeleteId(null);
      setDeletePassword('');
      await carregarDadosDoBanco();
      alert(`🗑️ Membro "${data.removedName || targetMember.name}" removido do PostgreSQL.`);
    } catch {
      alert('Erro de conexão ao tentar remover o membro.');
    } finally {
      setDeletingMember(false);
    }
  };

  const enviarRelatorioMensalNoBanco = async (horasTotais: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.id,
          monthYear: MES_ATUAL,
          totalHours: horasTotais,
          revisitas,
          estudos,
          observacoes: observacoesRelatorio,
        }),
      });

      if (res.ok) {
        await carregarDadosDoBanco();
        alert(`📊 Relatório de Novembro/2026 de ${currentUser.name} enviado ao Secretário e salvo no PostgreSQL!`);
      }
    } catch {
      alert('Sem conexão para enviar o relatório no momento.');
    }
  };

  const localizarMeuGps = () => {
    if (!navigator.geolocation) {
      alert('GPS não suportado neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFocoMapa([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setFocoMapa([-9.9482, -67.8285]);
      }
    );
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
          yearlyGoal: newGoal * 12,
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
                <label className="block mb-1 text-[#A5B8A3]">Cargo / Modalidade:</label>
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
                  <option value="ANCIAO">Ancião</option>
                  <option value="DESENVOLVEDOR">Desenvolvedor</option>
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

  const meuRelatorioMes = (currentUser.monthlyReports || []).find((r) => r.monthYear === MES_ATUAL);
  const minhaProximaEscala = escalas.find((e) => e.memberId === currentUser.id) || escalas[0];

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
                Olá, <strong className="text-white">{currentUser.name}</strong>! • <span className="text-xs">{currentUser.role.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {activeTab === 'inicio' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8FA38B] font-bold block">
                    Novembro 2026 • Hourglass
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {podeAtivarCronometro
                      ? isElderOrDev(currentUser)
                        ? 'Cronômetro Liberado (Ancião / Dev)'
                        : 'Cronômetro Liberado pelo Ancião/Dev'
                      : 'Bloqueado (Requer liberação de Ancião/Dev)'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    podeAtivarCronometro
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950/70 text-amber-300 border-amber-700'
                  }`}
                >
                  {podeAtivarCronometro ? '🔓 Liberado' : '🔒 Bloqueado'}
                </span>
              </div>

              <div className={`rounded-3xl p-6 text-center shadow-xl border ${cardStyle}`}>
                <div
                  className={`w-48 h-48 mx-auto rounded-full border-[10px] flex flex-col items-center justify-center mb-5 transition ${
                    podeAtivarCronometro
                      ? isRunning
                        ? 'border-emerald-500 shadow-[0_0_24px_rgba(34,197,94,0.22)]'
                        : 'border-[#4A6B4D]'
                      : 'border-[#39473A] opacity-85'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
                    {isRunning ? 'Em andamento' : podeAtivarCronometro ? 'Pronto para iniciar' : 'Bloqueado'}
                  </span>
                  <span className="text-4xl font-mono font-extrabold tracking-tight">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-[11px] text-[#8FA38B] font-semibold mt-1.5">
                    Mês: {horasSalvas}h
                  </span>
                </div>

                {podeAtivarCronometro ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={alternarCronometro}
                      className="py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                    >
                      {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
                    </button>
                    <button
                      onClick={finalizarSessao}
                      disabled={elapsedSeconds === 0}
                      className="py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider bg-[#EAECE9] text-[#1A261C] disabled:opacity-40 cursor-pointer"
                    >
                      ⏹ Salvar
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl p-3.5 bg-[#121A13]/60 border border-[#2F4231] text-left">
                    <p className="text-xs font-bold text-amber-300">
                      🔒 Cronômetro bloqueado para este membro
                    </p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Um Ancião ou Desenvolvedor pode liberar o cronômetro na aba Relatórios. Você ainda pode acompanhar suas revisitas, estudos e escalas.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                  <span className="text-[10px] uppercase opacity-70 block">Horas Mês</span>
                  <strong className="text-base font-extrabold">{horasSalvas}h</strong>
                </div>
                <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                  <span className="text-[10px] uppercase opacity-70 block">Revisitas</span>
                  <strong className="text-base font-extrabold">{revisitas}</strong>
                </div>
                <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                  <span className="text-[10px] uppercase opacity-70 block">Estudos</span>
                  <strong className="text-base font-extrabold">{estudos}</strong>
                </div>
              </div>

              {currentUser.monthlyGoal > 0 && (
                <div className={`rounded-2xl p-3.5 border ${cardStyle}`}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>Meta Mensal ({currentUser.role.replace('_', ' ')})</span>
                    <span>{horasSalvas}h / {metaMensal}h ({progressoPercentual}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#101711] rounded-full overflow-hidden">
                    <div className="h-full bg-[#648C61]" style={{ width: `${progressoPercentual}%` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-xs font-semibold">Revisitas: {revisitas}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRevisitas(Math.max(0, revisitas - 1))}
                      className="w-7 h-7 rounded-lg bg-[#253526] text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setRevisitas(revisitas + 1)}
                      className="w-7 h-7 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-xs font-semibold">Estudos: {estudos}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEstudos(Math.max(0, estudos - 1))}
                      className="w-7 h-7 rounded-lg bg-[#253526] text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setEstudos(estudos + 1)}
                      className="w-7 h-7 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('escalas')}
                className={`rounded-2xl p-3.5 border cursor-pointer flex justify-between items-center ${cardStyle}`}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider opacity-75 block">Próxima Escala / Parte:</span>
                  <strong className="text-xs">
                    {minhaProximaEscala ? `${minhaProximaEscala.cargo} • ${minhaProximaEscala.data}` : 'Ver Escalas da Congregação'}
                  </strong>
                </div>
                <span className="text-xs bg-[#466044] text-white px-2.5 py-1 rounded-lg font-semibold">Ver →</span>
              </div>
            </div>
          )}

          {activeTab === 'escalas' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                  Escalas e Designações ({escalas.length})
                </h2>
                {podeEnviarDesignacoes ? (
                  <button
                    onClick={() => setShowNewAssignmentForm(!showNewAssignmentForm)}
                    className="text-[11px] bg-[#466044] hover:bg-[#537150] text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    {showNewAssignmentForm ? '✕ Fechar' : '+ Nova Designação'}
                  </button>
                ) : (
                  <span className="text-[10px] opacity-70">Somente autorizados enviam partes</span>
                )}
              </div>

              {showNewAssignmentForm && podeEnviarDesignacoes && (
                <form onSubmit={criarNovaEscalaNoBanco} className={`rounded-2xl p-4 border space-y-2.5 text-xs ${cardStyle}`}>
                  <h3 className="font-bold text-sm text-emerald-400">Nova Escala / Discurso / Parte</h3>
                  <div>
                    <label className="block mb-1 opacity-80">Discurso, Parte ou Função:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Discurso Público • Fé nas Promessas"
                      value={novoCargo}
                      onChange={(e) => setNovoCargo(e.target.value)}
                      className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 opacity-80">Dia e Horário:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Quinta, 26 Nov • 19:30"
                        value={novaDataEscala}
                        onChange={(e) => setNovaDataEscala(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">Local:</label>
                      <input
                        type="text"
                        value={novoLocalEscala}
                        onChange={(e) => setNovoLocalEscala(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 opacity-80">Membro Designado:</label>
                    <select
                      value={membroDesignadoId}
                      onChange={(e) => setMembroDesignadoId(e.target.value)}
                      className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.serviceGroup})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg font-bold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  >
                    💾 Salvar Designação no PostgreSQL
                  </button>
                </form>
              )}

              {escalas.map((item) => {
                const nomeResponsavel = item.member?.name || 'Membro';
                const isMine = item.memberId === currentUser.id;
                const isConfirmado = item.status === 'confirmado';
                return (
                  <div key={item.id} className={`rounded-2xl p-4 border ${cardStyle} ${isMine ? 'ring-2 ring-[#648C61]' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{item.cargo}</h3>
                        <p className="text-xs opacity-80">{item.data} • {item.local}</p>
                        <p className="text-xs font-semibold text-[#8FA38B] mt-1">
                          Designado: <strong className="text-white">{nomeResponsavel}</strong> {isMine && '(Você)'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isConfirmado
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    {isMine && !isConfirmado && (
                      <button
                        onClick={() => confirmarEscalaNoBanco(item.id)}
                        className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                      >
                        ✓ Confirmar Minha Presença no BD
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'territorios' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                  Mapa de Territórios • Horto ({territorios.length})
                </h2>
                <button
                  onClick={localizarMeuGps}
                  className="text-[11px] bg-[#253526] hover:bg-[#314733] border border-[#4A634C] text-white px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                >
                  📍 Centralizar no Horto
                </button>
              </div>

              <TerritoryMap
                territorios={territorios}
                focoCoords={focoMapa}
                onSelectTerritory={(id) => setTerritorioDestacado(id)}
              />

              {territorios.map((t) => {
                const isDisponivel = t.status === 'Disponível';
                const isDestacado = territorioDestacado === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl p-4 border transition ${cardStyle} ${
                      isDestacado ? 'ring-2 ring-emerald-400' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                          isDisponivel ? 'bg-emerald-700' : 'bg-yellow-700'
                        }`}
                      >
                        {t.id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDisponivel
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm mt-1.5">{t.nome}</h3>
                    <p className="text-xs opacity-75">
                      Responsável atual: <strong>{t.responsavel}</strong> • {t.quadras} quadras
                    </p>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setTerritorioDestacado(t.id);
                          setFocoMapa([t.lat, t.lng]);
                        }}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#253526] hover:bg-[#2F4432] border border-[#4A634C] text-white cursor-pointer"
                      >
                        🔍 Focar no Mapa
                      </button>

                      {isDisponivel ? (
                        <button
                          onClick={() => atualizarTerritorioNoBanco(t.id, 'Em andamento', currentUser.name)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                        >
                          ✋ Assumir ({currentUser.name})
                        </button>
                      ) : (
                        (t.responsavel === currentUser.name || isElderOrDev(currentUser)) && (
                          <button
                            onClick={() => atualizarTerritorioNoBanco(t.id, 'Disponível', 'Livre')}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            ✓ Concluir / Devolver
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                  Relatório Novembro/2026 • {currentUser.name}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    meuRelatorioMes
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                  }`}
                >
                  {meuRelatorioMes ? '✅ Entregue no BD' : '⏳ Pendente de envio'}
                </span>
              </div>

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

                <input
                  type="text"
                  placeholder="Observações para o Secretário (opcional)..."
                  value={observacoesRelatorio}
                  onChange={(e) => setObservacoesRelatorio(e.target.value)}
                  className="w-full p-2.5 mb-2.5 rounded-xl bg-[#121A13] border border-[#3A523D] text-xs text-white"
                />

                <button
                  onClick={() => enviarRelatorioMensalNoBanco(horasSalvas)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                >
                  {meuRelatorioMes
                    ? '🔄 Atualizar Relatório de Novembro no Banco'
                    : '📤 Enviar Relatório de Novembro ao Secretário'}
                </button>
              </div>

              {podeVerTodasHoras ? (
                <div className={`rounded-2xl p-4 border mb-4 border-emerald-700/60 ${cardStyle}`}>
                  <h3 className="text-xs font-extrabold uppercase text-emerald-400 mb-2">
                    🛡️ Horas e Permissões Nov/2026 ({members.length} membros)
                  </h3>
                  <div className="space-y-2 text-xs">
                    {members.map((m) => {
                      const relatorioEntregue = (m.monthlyReports || []).find((r) => r.monthYear === MES_ATUAL);
                      const segMembro = (m.timeLogs || []).reduce((acc, l) => acc + l.durationSec, 0);
                      const horasMembro = relatorioEntregue
                        ? relatorioEntregue.totalHours
                        : +(18 + segMembro / 3600).toFixed(2);
                      const timerLiberado = canMemberUseTimer(m);
                      const confirmandoRemocao = memberToDeleteId === m.id;

                      return (
                        <div key={m.id} className="p-2.5 rounded-lg bg-[#121A13]/40 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <strong>{m.name}</strong>
                              <span className="block text-[10px] opacity-75">
                                {m.role.replace('_', ' ')} • Total: <strong>{horasMembro}h</strong>
                              </span>
                            </div>
                            {relatorioEntregue ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                                ✅ {relatorioEntregue.totalHours}h • {relatorioEntregue.estudos} est.
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-yellow-950/70 text-yellow-300 border border-yellow-800 text-[10px]">
                                ⏳ Aguardando
                              </span>
                            )}
                          </div>

                          {podeGerirPermissoes && m.id !== currentUser.id && (
                            <>
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#2F4231]">
                                <button
                                  onClick={() => alternarPermissaoMembro(m, 'canUseTimer')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    timerLiberado
                                      ? 'bg-emerald-900/70 text-emerald-200'
                                      : 'bg-red-950/80 text-red-300'
                                  }`}
                                >
                                  {timerLiberado ? '⏱️ Cronômetro Liberado' : '🔒 Liberar Cronômetro'}
                                </button>

                                <button
                                  onClick={() => alternarPermissaoMembro(m, 'canViewAllHours')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    m.canViewAllHours
                                      ? 'bg-emerald-900/70 text-emerald-200'
                                      : 'bg-[#233325] text-[#A5B8A3]'
                                  }`}
                                >
                                  {m.canViewAllHours ? '👁️ Vê Todas Horas' : '👁️‍🗨️ Só Próprias Horas'}
                                </button>

                                <button
                                  onClick={() => alternarPermissaoMembro(m, 'canAssignParts')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    m.canAssignParts
                                      ? 'bg-emerald-900/70 text-emerald-200'
                                      : 'bg-[#233325] text-[#A5B8A3]'
                                  }`}
                                >
                                  {m.canAssignParts ? '📋 Envia Designações' : '🚫 Não Envia Partes'}
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirmandoRemocao) {
                                      setMemberToDeleteId(null);
                                      setDeletePassword('');
                                    } else {
                                      setMemberToDeleteId(m.id);
                                      setDeletePassword('');
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 cursor-pointer"
                                >
                                  {confirmandoRemocao ? '✕ Cancelar' : '🗑️ Remover'}
                                </button>
                              </div>

                              {confirmandoRemocao && (
                                <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/70 space-y-1.5">
                                  <p className="text-[10px] text-red-200 font-semibold">
                                    🔑 Digite a senha de {currentUser.name} para remover <strong>{m.name}</strong>:
                                  </p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="password"
                                      placeholder="Sua senha (PIN)"
                                      value={deletePassword}
                                      onChange={(e) => setDeletePassword(e.target.value)}
                                      className="flex-1 px-2 py-1 rounded bg-[#121A13] border border-red-800 text-white text-[11px]"
                                    />
                                    <button
                                      disabled={deletingMember}
                                      onClick={() => confirmarRemocaoMembro(m)}
                                      className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold disabled:opacity-50 cursor-pointer"
                                    >
                                      {deletingMember ? '...' : 'Confirmar'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-3.5 border mb-4 text-xs opacity-80 ${cardStyle}`}>
                  🔒 A visualização do total de horas de todos os membros é restrita a usuários autorizados.
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