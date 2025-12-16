
import React, { useState, useEffect, useRef } from 'react';
import { Match, Team, MatchEventType, UserRole, Player, MatchStatus, TacticalPosition, CurrentUser, MatchMedia, Arena } from '../types';
import {
  Timer, X, Flag, AlertTriangle, ShieldAlert, Goal,
  User, Activity, List, MessageCircle, Send, Lock, CornerUpRight, Play, Square, Eye,
  Video, Image as ImageIcon, Plus, MapPin, ChevronDown, ChevronUp, Pause, Clock, StopCircle, RefreshCw
} from 'lucide-react';
import TacticsBoard from './TacticsBoard';

interface MatchDetailViewProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  arena?: Arena;
  currentUser: CurrentUser;
  onClose: () => void;
  onAddEvent: (type: MatchEventType, teamId: string | null, playerId: string | null, minute: number) => void;
  onViewPlayer: (player: Player, teamName: string) => void;
  onSendMessage: (matchId: string, text: string) => void;
  onSaveMatchTactics: (matchId: string, teamId: string, tactics: TacticalPosition[]) => void;
  onAddMedia: (matchId: string, type: 'IMAGE' | 'VIDEO', content: string | File) => void;
  onFinishMatch: (matchId: string) => void;
}

const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  match, homeTeam, awayTeam, arena, currentUser, onClose, onAddEvent, onViewPlayer, onSendMessage, onSaveMatchTactics, onAddMedia, onFinishMatch
}) => {
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'LINEUPS' | 'STATS' | 'CHAT' | 'TRANSMISSION' | 'MEDIA' | 'LOCATION'>('TIMELINE');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false); // Collapsible Scoreboard State
  const [selectedEventType, setSelectedEventType] = useState<MatchEventType | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [eventMinute, setEventMinute] = useState(90);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Game Timer State
  const [gameTimer, setGameTimer] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [matchPeriod, setMatchPeriod] = useState<'1T' | 'INT' | '2T' | 'FIM'>('1T');
  const [periodDuration, setPeriodDuration] = useState(20); // default minutes per half

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setGameTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGameControl = (action: 'START' | 'PAUSE' | 'RESUME' | 'NEXT_PERIOD' | 'END_GAME') => {
    if (action === 'START') {
      const durationStr = prompt("Tempo de jogo por tempo (minutos):", "20");
      if (durationStr) {
        setPeriodDuration(parseInt(durationStr));
        setIsTimerRunning(true);
        // If not live, make it live (in a real app, call API)
        // match.status = MatchStatus.LIVE; // Local simulation
      }
    } else if (action === 'PAUSE') {
      setIsTimerRunning(false);
    } else if (action === 'RESUME') {
      setIsTimerRunning(true);
    } else if (action === 'NEXT_PERIOD') {
      setIsTimerRunning(false);
      if (matchPeriod === '1T') {
        setMatchPeriod('INT');
      } else if (matchPeriod === 'INT') {
        setMatchPeriod('2T');
        // Usually 2nd half starts from 0 or continues? 
        // Let's reset for Sport types that reset (Futsal) or continue (Football). 
        setGameTimer(0);
      }
    } else if (action === 'END_GAME') {
      setIsTimerRunning(false);
      setMatchPeriod('FIM');
      // match.status = MatchStatus.FINISHED;
      onFinishMatch(match.id);
    }
  };

  // Tactics State
  const [viewingTacticsTeamId, setViewingTacticsTeamId] = useState<string>(homeTeam.id);

  // Check if user is eligible to chat
  const isMatchLive = match.status === MatchStatus.LIVE;
  const isFanOfPlayingTeam = currentUser.role === UserRole.FAN && (currentUser.teamId === homeTeam.id || currentUser.teamId === awayTeam.id);
  const canChat = isMatchLive && (isFanOfPlayingTeam || currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.REFEREE);

  // Auto scroll chat
  useEffect(() => {
    if (activeTab === 'CHAT' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [match.chatMessages, activeTab]);

  const getStats = (teamId: string) => {
    const teamEvents = match.events.filter(e => e.teamId === teamId);
    return {
      goals: teamEvents.filter(e => e.type === MatchEventType.GOAL).length,
      yellowCards: teamEvents.filter(e => e.type === MatchEventType.YELLOW_CARD).length,
      redCards: teamEvents.filter(e => e.type === MatchEventType.RED_CARD).length,
      fouls: teamEvents.filter(e => e.type === MatchEventType.FOUL).length,
      offsides: teamEvents.filter(e => e.type === MatchEventType.OFFSIDE).length,
      corners: teamEvents.filter(e => e.type === MatchEventType.CORNER).length,
    };
  };

  const homeStats = getStats(homeTeam.id);
  const awayStats = getStats(awayTeam.id);

  const possessionSkew = (homeStats.goals - awayStats.goals) * 3;
  const rawHomePossession = 50 + possessionSkew;
  const homePossession = Math.max(30, Math.min(70, rawHomePossession));
  const awayPossession = 100 - homePossession;

  const canControl = (currentUser.role === UserRole.REFEREE || currentUser.role === UserRole.DIRECTOR);

  const handleConsoleAction = (type: MatchEventType) => {
    setSelectedEventType(type);
    setConsoleOpen(true);
    // Use current game timer converted to minutes, ensuring at least 1st minute
    const currentMin = Math.floor(gameTimer / 60) + 1;
    setEventMinute(currentMin);
    setSelectedTeamId(null);
  };

  const submitEvent = (playerId: string | null) => {
    if (selectedEventType) {
      onAddEvent(selectedEventType, selectedTeamId, playerId, eventMinute);
      setConsoleOpen(false);
      setSelectedEventType(null);
      setSelectedTeamId(null);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && canChat) {
      onSendMessage(match.id, chatInput);
      setChatInput("");
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddVideoClick = () => {
    const url = prompt("Cole o link do vídeo (YouTube, mp4):");
    if (!url) return;
    onAddMedia(match.id, 'VIDEO', url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddMedia(match.id, 'IMAGE', file);
    }
  };

  const getEventConfig = (type: MatchEventType) => {
    switch (type) {
      case MatchEventType.GOAL: return { icon: Goal, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Gol' };
      case MatchEventType.YELLOW_CARD: return { icon: ShieldAlert, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Cartão Amarelo' };
      case MatchEventType.RED_CARD: return { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100', label: 'Cartão Vermelho' };
      case MatchEventType.FOUL: return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Falta' };
      case MatchEventType.OFFSIDE: return { icon: Flag, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Impedimento' };
      case MatchEventType.CORNER: return { icon: CornerUpRight, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Escanteio' };
      case MatchEventType.START: return { icon: Play, color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Início de Jogo' };
      case MatchEventType.END: return { icon: Square, color: 'text-slate-700', bg: 'bg-slate-200', label: 'Fim de Jogo' };
      default: return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Evento' };
    }
  };

  const renderLiveConsole = () => {
    const actionBtnBase = "flex flex-col items-center justify-center h-14 w-full rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-95 hover:scale-105 border border-white/10";

    return (
      <div className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 transition-all duration-300 shadow-2xl ${isConsoleMinimized ? 'h-10 overflow-hidden' : 'p-4 pb-8'}`}>
        <div
          className={`absolute top-0 left-0 right-0 h-10 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition ${isConsoleMinimized ? 'w-full' : 'opacity-50 hover:opacity-100'}`}
          onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
        >
          {isConsoleMinimized ? (
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
              <ChevronUp size={16} /> Abrir Console de Jogo
            </div>
          ) : (
            <div className="w-12 h-1 bg-slate-600 rounded-full mb-6"></div>
          )}
        </div>

        {!isConsoleMinimized && (
          <div className="pt-2">
            {!consoleOpen ? (
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Game Control Bar */}
                {canControl && (
                  <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl border border-slate-700 mx-1">
                    <div className="flex items-center gap-3 pl-2">
                      <div className={`text-2xl font-mono font-bold w-20 text-center bg-black/40 rounded p-1 transition-colors ${gameTimer > periodDuration * 60 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {formatTime(gameTimer)}
                      </div>
                      <div className="text-xs font-bold text-slate-400 uppercase">
                        {matchPeriod === '1T' ? '1º Tempo' : matchPeriod === '2T' ? '2º Tempo' : matchPeriod === 'INT' ? 'Intervalo' : 'Fim'}
                        {gameTimer > periodDuration * 60 && <span className="block text-[10px] text-red-500 font-extrabold animate-pulse">ACRÉSCIMO</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!isTimerRunning && matchPeriod === '1T' && gameTimer === 0 ? (
                        <button onClick={() => handleGameControl('START')} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-bold">
                          <Play size={16} fill="white" /> Iniciar Partida
                        </button>
                      ) : (
                        <>
                          {isTimerRunning ? (
                            <button onClick={() => handleGameControl('PAUSE')} className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-lg text-xs font-bold" title="Pausar">
                              <Pause size={16} fill="white" />
                            </button>
                          ) : (
                            matchPeriod !== 'FIM' && <button onClick={() => handleGameControl('RESUME')} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold" title="Retomar">
                              <Play size={16} fill="white" />
                            </button>
                          )}

                          {matchPeriod === '1T' && (
                            <button onClick={() => handleGameControl('NEXT_PERIOD')} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg text-xs font-bold whitespace-nowrap">
                              Encerrar 1ºT
                            </button>
                          )}

                          {matchPeriod === 'INT' && (
                            <button onClick={() => handleGameControl('NEXT_PERIOD')} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg text-xs font-bold whitespace-nowrap">
                              Iniciar 2ºT
                            </button>
                          )}

                          {(matchPeriod === '2T' || matchPeriod === 'INT') && (
                            <button onClick={() => handleGameControl('END_GAME')} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg text-xs font-bold whitespace-nowrap">
                              Encerrar Jogo
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Event Buttons - Compact Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <button onClick={() => handleConsoleAction(MatchEventType.GOAL)} className={`${actionBtnBase} bg-emerald-600 hover:bg-emerald-500 text-white`}>
                    <Goal size={20} /> <span className="text-[10px] font-bold mt-1">GOL</span>
                  </button>
                  <button onClick={() => handleConsoleAction(MatchEventType.YELLOW_CARD)} className={`${actionBtnBase} bg-yellow-400 hover:bg-yellow-300 text-slate-900`}>
                    <ShieldAlert size={20} /> <span className="text-[10px] font-bold mt-1">AMARELO</span>
                  </button>
                  <button onClick={() => handleConsoleAction(MatchEventType.RED_CARD)} className={`${actionBtnBase} bg-red-600 hover:bg-red-500 text-white`}>
                    <ShieldAlert size={20} /> <span className="text-[10px] font-bold mt-1">VERMELHO</span>
                  </button>
                  <button onClick={() => handleConsoleAction(MatchEventType.FOUL)} className={`${actionBtnBase} bg-slate-700 hover:bg-slate-600 text-white`}>
                    <X size={20} /> <span className="text-[10px] font-bold mt-1">FALTA</span>
                  </button>
                  <button onClick={() => handleConsoleAction(MatchEventType.CORNER)} className={`${actionBtnBase} bg-blue-600 hover:bg-blue-500 text-white`}>
                    <CornerUpRight size={20} /> <span className="text-[10px] font-bold mt-1">ESCANT.</span>
                  </button>
                  <button onClick={() => handleConsoleAction(MatchEventType.OFFSIDE)} className={`${actionBtnBase} bg-slate-600 hover:bg-slate-500 text-white`}>
                    <Flag size={20} /> <span className="text-[10px] font-bold mt-1">IMPED.</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto text-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    {selectedEventType === MatchEventType.GOAL && <Goal className="text-emerald-500" />}
                    {selectedEventType === MatchEventType.YELLOW_CARD && <ShieldAlert className="text-yellow-500" />}
                    {selectedEventType === MatchEventType.RED_CARD && <ShieldAlert className="text-red-500" />}
                    Registrar {selectedEventType}
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="text-slate-400" />
                      <input
                        type="number"
                        value={eventMinute}
                        onChange={(e) => setEventMinute(parseInt(e.target.value))}
                        className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center font-mono"
                      />
                      <span className="text-sm text-slate-400">min</span>
                    </div>
                    <button onClick={() => setConsoleOpen(false)} className="bg-slate-800 p-1 rounded-full hover:bg-slate-700"><X size={20} /></button>
                  </div>
                </div>

                {!selectedTeamId ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setSelectedTeamId(homeTeam.id)} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 border border-slate-600 flex flex-col items-center gap-2 transition">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-slate-900" style={{ backgroundColor: homeTeam.logoColor }}>{homeTeam.shortName}</div>
                      <span className="font-bold">{homeTeam.name}</span>
                    </button>
                    <button onClick={() => setSelectedTeamId(awayTeam.id)} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 border border-slate-600 flex flex-col items-center gap-2 transition">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-slate-900" style={{ backgroundColor: awayTeam.logoColor }}>{awayTeam.shortName}</div>
                      <span className="font-bold">{awayTeam.name}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setSelectedTeamId(null)} className="text-xs text-slate-400 hover:text-white underline">Voltar para seleção de time</button>
                    {selectedEventType !== MatchEventType.CORNER ? (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {(selectedTeamId === homeTeam.id ? homeTeam : awayTeam).roster.map(player => (
                          <button
                            key={player.id}
                            onClick={() => submitEvent(player.id)}
                            className="bg-slate-800 hover:bg-emerald-600 p-2 rounded border border-slate-700 flex flex-col items-center gap-1 transition"
                          >
                            <span className="font-bold text-lg">{player.number}</span>
                            <span className="text-[10px] truncate w-full text-center">{player.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="mb-4 text-slate-400 text-sm">Escanteios não são atribuídos a jogadores específicos.</p>
                        <button
                          onClick={() => submitEvent(null)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold"
                        >
                          Confirmar Escanteio
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 text-white p-4 shadow-md flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <button onClick={onClose} className="text-slate-400 hover:text-white flex items-center gap-2 transition text-sm font-bold">
              <X size={18} /> Fechar
            </button>

            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition text-xs font-bold bg-slate-800 px-3 py-1 rounded-full"
            >
              {isHeaderCollapsed ? (
                <> <ChevronDown size={14} /> Expandir Placar </>
              ) : (
                <> <ChevronUp size={14} /> Compactar </>
              )}
            </button>
          </div>

          {!isHeaderCollapsed ? (
            <div className="flex justify-between items-center mb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col items-center w-1/3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-slate-700 mb-2 overflow-hidden" style={{ backgroundColor: homeTeam.logoColor }}>
                  {homeTeam.profilePicture ? (
                    <img src={homeTeam.profilePicture} alt={homeTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                  ) : homeTeam.shortName.toUpperCase()}
                </div>
                <h3 className="font-bold text-center leading-tight text-lg">{homeTeam.name}</h3>
              </div>

              <div className="flex flex-col items-center w-1/3">
                <div className="text-5xl font-bold font-mono tracking-widest mb-1 flex gap-2">
                  <span>{match.homeScore}</span>
                  <span className="text-slate-600">:</span>
                  <span>{match.awayScore}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${match.status === MatchStatus.LIVE ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                  {match.status === MatchStatus.LIVE ? 'Ao Vivo' : match.status === MatchStatus.FINISHED ? 'Fim de Jogo' : 'Agendado'}
                </span>
                <span className="text-slate-400 text-xs mt-2 flex items-center gap-1"><MapPin size={10} /> {arena ? arena.name : match.arenaId}</span>
              </div>

              <div className="flex flex-col items-center w-1/3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-slate-700 mb-2 overflow-hidden" style={{ backgroundColor: awayTeam.logoColor }}>
                  {awayTeam.profilePicture ? (
                    <img src={awayTeam.profilePicture} alt={awayTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                  ) : awayTeam.shortName.toUpperCase()}
                </div>
                <h3 className="font-bold text-center leading-tight text-lg">{awayTeam.name}</h3>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-4 px-4 py-2 bg-slate-800 rounded-xl animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-slate-600 overflow-hidden" style={{ backgroundColor: homeTeam.logoColor }}>
                  {homeTeam.profilePicture ? (
                    <img src={homeTeam.profilePicture} alt={homeTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                  ) : homeTeam.shortName.toUpperCase()}
                </div>
                <span className="font-bold text-xl">{match.homeScore}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${match.status === MatchStatus.LIVE ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {match.status === MatchStatus.LIVE ? 'Ao Vivo' : 'Fim'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{eventMinute > 0 ? `${eventMinute}'` : ''}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-xl">{match.awayScore}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-slate-600 overflow-hidden" style={{ backgroundColor: awayTeam.logoColor }}>
                  {awayTeam.profilePicture ? (
                    <img src={awayTeam.profilePicture} alt={awayTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                  ) : awayTeam.shortName.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          <div className="flex border-b border-slate-700 overflow-x-auto">
            <button onClick={() => setActiveTab('TIMELINE')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'TIMELINE' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Timeline</button>
            <button onClick={() => setActiveTab('TRANSMISSION')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'TRANSMISSION' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <Video size={14} /> Transmissão
            </button>
            <button onClick={() => setActiveTab('LINEUPS')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'LINEUPS' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Escalações</button>
            <button onClick={() => setActiveTab('MEDIA')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'MEDIA' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <ImageIcon size={14} /> Mídia
            </button>
            <button onClick={() => setActiveTab('LOCATION')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex items-center justify-center gap-1 whitespace-nowrap ${activeTab === 'LOCATION' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <MapPin size={14} /> Local
            </button>
            <button onClick={() => setActiveTab('STATS')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'STATS' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Stats</button>
            <button onClick={() => setActiveTab('CHAT')} className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition flex justify-center items-center gap-1 whitespace-nowrap ${activeTab === 'CHAT' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              Chat {isMatchLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto bg-slate-100 p-4 ${canControl ? 'pb-28' : ''}`}>
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm min-h-[400px]">

          {/* TIMELINE TAB */}
          {activeTab === 'TIMELINE' && (
            <div className="p-6">
              {match.events.length === 0 ? (
                <div className="text-center py-10 text-slate-400">A partida ainda não começou ou nenhum evento foi registrado.</div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-px before:w-0.5 before:bg-slate-200">
                  {match.events.slice().sort((a, b) => a.minute - b.minute).map(event => {
                    const config = getEventConfig(event.type);
                    const EventIcon = config.icon;
                    const isCenter = event.type === MatchEventType.START || event.type === MatchEventType.END;
                    const isAway = event.teamId === awayTeam.id;

                    if (isCenter) {
                      return (
                        <div key={event.id} className="flex items-center justify-center relative z-10 py-4">
                          <div className="bg-slate-100 text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 ring-4 ring-white">
                            <EventIcon size={12} />
                            {event.description || config.label}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={event.id} className={`flex items-center gap-4 ${isAway ? 'flex-row-reverse text-right' : ''}`}>
                        <div className={`flex-1 ${isAway ? 'pr-8 flex justify-end' : 'pl-8 flex justify-start'}`}>
                          <div className={`bg-white p-3 rounded-lg border border-slate-100 shadow-sm max-w-[220px] ${isAway ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isAway ? 'flex-row-reverse' : ''}`}>
                              <div className={`p-1.5 rounded-full ${config.bg} ${config.color}`}>
                                <EventIcon size={14} />
                              </div>
                              <span className={`text-xs font-bold uppercase ${config.color}`}>{config.label}</span>
                            </div>
                            <div className="text-sm font-medium text-slate-700">{event.playerName || event.description}</div>
                          </div>
                        </div>
                        <div className="relative z-10 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white border-2 border-slate-200 shadow-sm">
                          {event.minute}'
                        </div>
                        <div className="flex-1"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TRANSMISSION (YOUTUBE) TAB */}
          {activeTab === 'TRANSMISSION' && (
            <div className="p-4">
              {match.youtubeVideoId ? (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${match.youtubeVideoId}?autoplay=1`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <Video size={48} className="mb-2 opacity-50" />
                  <p>Nenhuma transmissão vinculada a este jogo.</p>
                </div>
              )}
              {isMatchLive && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
                  <div className="text-sm">
                    <p className="font-bold">Partida Ao Vivo</p>
                    <p>Acompanhe os lances em tempo real no chat.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEDIA GALLERY TAB */}
          {activeTab === 'MEDIA' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="text-emerald-500" size={20} /> Galeria da Partida
                </h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 transition"
                  >
                    <ImageIcon size={16} /> Foto
                  </button>
                  <button
                    onClick={handleAddVideoClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600 transition"
                  >
                    <Video size={16} /> Vídeo
                  </button>
                </div>
              </div>

              {match.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {match.media.map((item) => (
                    <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-200 border border-slate-300 cursor-pointer">
                      {item.type === 'IMAGE' ? (
                        <img src={item.url} alt="Media" className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <Video className="text-white opacity-50" size={32} />
                          <span className="text-xs text-white absolute bottom-2 left-2">Vídeo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                        <p className="text-white text-[10px]">Enviado por {item.uploadedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nenhuma foto ou vídeo adicionado ainda.</p>
                </div>
              )}
            </div>
          )}

          {/* LOCATION TAB */}
          {activeTab === 'LOCATION' && (
            <div className="p-6 space-y-4">
              {arena ? (
                <>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="text-emerald-500" size={20} />
                    {arena.name}
                  </h3>
                  <p className="text-slate-500 text-sm">{arena.address}</p>
                  {arena.googleMapsUrl && (
                    <a href={arena.googleMapsUrl} target="_blank" rel="noreferrer" className="text-emerald-600 text-sm underline hover:text-emerald-500 mb-4 block">
                      Abrir no Google Maps
                    </a>
                  )}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 shadow-md border border-slate-200">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(arena.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Arena não informada ou não encontrada.</p>
                  <p className="text-xs font-mono">{match.arenaId}</p>
                </div>
              )}
            </div>
          )}

          {/* LINEUPS / TACTICS TAB */}
          {activeTab === 'LINEUPS' && (
            <div className="flex flex-col h-full">
              {/* Team Switcher for Tactics */}
              <div className="flex bg-slate-100 p-1 rounded-t-xl border-b border-slate-200">
                <button
                  onClick={() => setViewingTacticsTeamId(homeTeam.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition ${viewingTacticsTeamId === homeTeam.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeTeam.logoColor }}></span>
                  {homeTeam.name}
                </button>
                <button
                  onClick={() => setViewingTacticsTeamId(awayTeam.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition ${viewingTacticsTeamId === awayTeam.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayTeam.logoColor }}></span>
                  {awayTeam.name}
                </button>
              </div>

              <div className="p-4 bg-slate-50 flex-1">
                {/* Logic to determine if editable */}
                {(() => {
                  const isCoachOfViewingTeam = currentUser.role === UserRole.COACH && currentUser.teamId === viewingTacticsTeamId;
                  const viewingTeam = viewingTacticsTeamId === homeTeam.id ? homeTeam : awayTeam;
                  // Use Match Specific Tactics if available, otherwise fallback to team default
                  const matchSpecificTactics = viewingTacticsTeamId === homeTeam.id ? match.homeTactics : match.awayTactics;
                  const tacticsToDisplay = matchSpecificTactics || viewingTeam.tacticalFormation;

                  // Modify the viewingTeam object temporarily to pass the correct tactics to the board
                  const teamWithTactics = { ...viewingTeam, tacticalFormation: tacticsToDisplay };

                  return (
                    <div className="space-y-4">
                      {isCoachOfViewingTeam ? (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Modo Técnico: Você está editando a tática especificamente para este jogo.
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                          <Eye size={16} />
                          Modo Visualização: Tática definida pelo técnico.
                        </div>
                      )}

                      <TacticsBoard
                        team={teamWithTactics}
                        isEditable={isCoachOfViewingTeam}
                        onSave={(newPos) => onSaveMatchTactics(match.id, viewingTeam.id, newPos)}
                        onPlayerClick={(player) => onViewPlayer(player, viewingTeam.name)}
                      />

                      {/* Basic List View Fallback/Addition */}
                      <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
                        <h5 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Lista de Jogadores</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {viewingTeam.roster.map(p => (
                            <div key={p.id} onClick={() => onViewPlayer(p, viewingTeam.name)} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer border border-transparent hover:border-slate-100 transition">
                              <span className="font-mono font-bold w-5 text-slate-400 text-right text-xs">{p.number}</span>
                              <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                              {p.stats.goals > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">⚽ {p.stats.goals}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'STATS' && (
            <div className="p-8 space-y-8">
              {/* Possession Bar */}
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
                  <span>{homePossession}%</span>
                  <span>Posse de Bola (Est.)</span>
                  <span>{awayPossession}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                  <div className="bg-slate-800 transition-all duration-1000" style={{ width: `${homePossession}%` }}></div>
                  <div className="bg-slate-300 transition-all duration-1000" style={{ width: `${awayPossession}%` }}></div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Gols', h: homeStats.goals, a: awayStats.goals, icon: Goal },
                  { label: 'Escanteios', h: homeStats.corners, a: awayStats.corners, icon: CornerUpRight },
                  { label: 'Cartões Amarelos', h: homeStats.yellowCards, a: awayStats.yellowCards, icon: ShieldAlert },
                  { label: 'Cartões Vermelhos', h: homeStats.redCards, a: awayStats.redCards, icon: ShieldAlert },
                  { label: 'Faltas', h: homeStats.fouls, a: awayStats.fouls, icon: AlertTriangle },
                  { label: 'Impedimentos', h: homeStats.offsides, a: awayStats.offsides, icon: Flag },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-bold text-slate-500 mb-1">
                      <span>{stat.h}</span>
                      <span className="flex items-center gap-1"><stat.icon size={14} /> {stat.label}</span>
                      <span>{stat.a}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-slate-800 transition-all duration-500" style={{ width: `${(stat.h / (stat.h + stat.a || 1)) * 100}%` }}></div>
                      <div className="bg-slate-300 transition-all duration-500" style={{ width: `${(stat.a / (stat.h + stat.a || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                <h4 className="text-emerald-800 font-bold mb-2">Previsão da IA</h4>
                <p className="text-sm text-emerald-600">Com base no momento atual, o {match.homeScore > match.awayScore ? homeTeam.name : awayTeam.name} tem 75% de chance de manter a vantagem.</p>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'CHAT' && (
            <div className="flex flex-col h-[500px]">
              {canChat ? (
                <>
                  <div id="chat-container" className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {match.chatMessages.length === 0 && (
                      <div className="text-center text-slate-400 text-sm mt-10">Nenhuma mensagem ainda. Seja o primeiro a comentar!</div>
                    )}
                    {match.chatMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.userId === 'me' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.userId === 'me'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                          }`}>
                          <span className="block text-[10px] font-bold opacity-70 mb-0.5">{msg.userName}</span>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef}></div>
                  </div>
                  <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button type="submit" disabled={!chatInput.trim()} className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-600 mb-2">Chat Indisponível</h4>
                  <p className="text-sm max-w-xs">
                    O chat só está disponível durante partidas <strong>Ao Vivo</strong> e para torcedores registrados dos times em campo.
                  </p>
                  {!isMatchLive && <span className="inline-block mt-4 text-xs font-bold bg-slate-200 px-2 py-1 rounded">A partida não está ao vivo</span>}
                  {isMatchLive && !isFanOfPlayingTeam && currentUser.role === UserRole.FAN && (
                    <span className="inline-block mt-4 text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Você não segue estes times</span>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {canControl && renderLiveConsole()}
    </div>
  );
};

export default MatchDetailView;
