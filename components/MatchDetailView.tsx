
import React, { useState, useEffect, useRef } from 'react';
import { Match, Team, MatchEventType, UserRole, Player, MatchStatus, TacticalPosition, CurrentUser, MatchMedia, Arena } from '../types';
import {
  Timer, X, Flag, AlertTriangle, ShieldAlert, Goal,
  User, Activity, List, MessageCircle, Send, Lock, CornerUpRight, Play, Square, Eye,
  Video, Image as ImageIcon, Plus, MapPin, ChevronDown, ChevronUp, Pause, Clock, StopCircle, RefreshCw,
  ExternalLink, Map as MapIcon, BarChart3, Users, Upload, Sparkles, Copy, FileText, Newspaper, Save
} from 'lucide-react';
import TacticsBoard from './TacticsBoard';
import { AIService } from '../services/gemini';

interface MatchDetailViewProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  arena?: Arena | null;
  currentUser: CurrentUser;
  onClose: () => void;
  onAddEvent: (type: MatchEventType, teamId: string | null, playerId: string | null, minute: number) => void;
  onViewPlayer: (player: Player, teamName: string) => void;
  onSendMessage: (matchId: string, text: string) => void;
  onSaveMatchTactics: (matchId: string, teamId: string, tactics: TacticalPosition[]) => void;
  onAddMedia: (matchId: string, type: 'IMAGE' | 'VIDEO', content: string | File) => void;
  onFinishMatch: (matchId: string) => void;
  onUpdateStreams: (matchId: string, streams: { id: string; provider: 'YOUTUBE' | 'TWITCH' | 'AGORA' | 'OTHER'; identifier: string; label: string; }[]) => void;
  onStartBroadcast: () => void;
  onUpdateStatus: (matchId: string, status: MatchStatus) => void;
  onPostNews?: (content: string, matchId: string) => void;
}

const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  match, homeTeam, awayTeam, arena, currentUser, onClose, onAddEvent, onViewPlayer, onSendMessage, onSaveMatchTactics, onAddMedia, onFinishMatch, onUpdateStreams, onStartBroadcast, onUpdateStatus, onPostNews
}) => {
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'LINEUPS' | 'STATS' | 'CHAT' | 'TRANSMISSION' | 'MEDIA' | 'LOCATION'>('TIMELINE');

  // --- AI STATE ---
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleGenerateNews = async () => {
    setIsLoadingAI(true);
    setShowAIModal(true);
    setAiContent("Conectando ao correspondente virtual...");
    try {
      const news = await AIService.generateMatchNews(match, homeTeam, awayTeam, arena?.name);
      setAiContent(news);
    } catch (error) {
      console.error("Erro na UI ao gerar notícia:", error);
      setAiContent("Não foi possível gerar a notícia. Erro de conexão com a IA.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const [consoleOpen, setConsoleOpen] = useState(false);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<MatchEventType | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [eventMinute, setEventMinute] = useState(0); // Start at 0
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Game Timer & Period Logic
  const [gameTimer, setGameTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [matchPeriod, setMatchPeriod] = useState<1 | 2>(1);

  // Sync Timer State with Match Status (Basic assumption)
  useEffect(() => {
    if (match.status === MatchStatus.LIVE) {
      // Logic to resume timer if we had persisted start time would go here.
      // For now, we rely on manual control for simplicity in this session.
      // If just opened and LIVE, maybe we shouldn't auto-run 0 unless we know real start time.
    }
  }, [match.status]);

  // Formatting Helper
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setGameTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && gameTimer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameTimer]);

  const handleGameFlowAction = () => {
    if (match.status === MatchStatus.SCHEDULED) {
      if (confirm("Iniciar a partida?")) {
        onUpdateStatus(match.id, MatchStatus.LIVE);
        setIsTimerRunning(true);
        setMatchPeriod(1);
      }
    } else if (match.status === MatchStatus.LIVE) {
      if (matchPeriod === 1) {
        if (confirm("Encerrar o 1º Tempo?")) {
          setIsTimerRunning(false);
          setMatchPeriod(2);
          setGameTimer(0); // Optional: Reset for 2nd half or keep running total? Usually reset for display 0-45 again or continue 45-90. Let's reset for simplicity 00:00.
        }
      } else if (matchPeriod === 2) {
        if (!isTimerRunning) {
          if (confirm("Iniciar o 2º Tempo?")) {
            setIsTimerRunning(true);
          }
        } else {
          if (confirm("Encerrar a Partida?")) {
            setIsTimerRunning(false);
            onUpdateStatus(match.id, MatchStatus.FINISHED);
            onFinishMatch(match.id);
          }
        }
      }
    }
  };

  const isMatchLive = match.status === MatchStatus.LIVE;
  const canChat = true; // allow chat always for now

  // --- STREAMING LOGIC ---
  const extractVideoId = (url: string): { provider: 'YOUTUBE' | 'TWITCH' | 'OTHER', id: string } | null => {
    // YouTube Support: share links, embed, watch, and LIVE links
    // Regex for standard IDs (11 chars)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch) return { provider: 'YOUTUBE', id: ytMatch[1] };

    if (url.includes('twitch.tv/')) {
      const parts = url.split('twitch.tv/');
      return parts[1] ? { provider: 'TWITCH', id: parts[1].split(/[?\/]/)[0] } : null;
    }
    return null;
  };

  const handleAddStreamClick = () => {
    const url = prompt("Cole o LINK da transmissão (YouTube ou Twitch):");
    if (!url) return;
    const extraction = extractVideoId(url);
    if (!extraction) {
      alert("Link não reconhecido. Certifique-se que é YouTube ou Twitch validos.");
      return;
    }
    const label = prompt("Nome da Câmera (Ex: Câmera Principal):", `Opção ${(match.streams?.length || 0) + 1}`);
    const newStream = {
      id: crypto.randomUUID(),
      provider: extraction.provider,
      identifier: extraction.id,
      label: label || `Opção ${(match.streams?.length || 0) + 1}`
    };
    onUpdateStreams(match.id, [...(match.streams || []), newStream]);
  };

  const handleRemoveStreamClick = () => {
    if (!match.streams || match.streams.length === 0) return;
    if (confirm("Remover esta transmissão?")) {
      const updatedStreams = match.streams.filter((_, idx) => idx !== activeStreamIndex);
      onUpdateStreams(match.id, updatedStreams);
      setActiveStreamIndex(0);
    }
  };

  // --- MEDIA UPLOAD ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const type = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      onAddMedia(match.id, type, file);
    }
  };

  // --- PERMISSION LOGIC ---
  const canControl = (
    currentUser.role === UserRole.REFEREE ||
    (currentUser.teamId === '9eb92f07-f9cf-493f-8628-7d2f66195e80') || // USER 1
    ((currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.COACH) &&
      (String(currentUser.teamId) === String(homeTeam.id) || String(currentUser.teamId) === String(awayTeam.id)))
  );

  const handleConsoleAction = (type: MatchEventType) => {
    setSelectedEventType(type);
    setConsoleOpen(true);
    // Calc minute
    const currentMin = Math.floor(gameTimer / 60) + (matchPeriod === 2 ? 0 : 0); // Raw timer is fine for now
    setEventMinute(currentMin);
  };

  const handleSubmitEvent = () => {
    if (selectedEventType && selectedTeamId) {
      onAddEvent(selectedEventType, selectedTeamId, null, eventMinute);
      setConsoleOpen(false);
      setSelectedEventType(null);
      setSelectedTeamId(null);
    }
  };

  // Helpers
  const getEventIcon = (type: MatchEventType) => {
    switch (type) {
      case MatchEventType.GOAL: return { icon: Goal, color: 'text-emerald-500', bg: 'bg-emerald-100' };
      case MatchEventType.YELLOW_CARD: return { icon: ShieldAlert, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case MatchEventType.RED_CARD: return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-100' };
      case MatchEventType.FOUL: return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100' };
      default: return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-100' };
    }
  };

  const renderGameFlowButton = () => {
    let label = "";
    let icon = Play;
    let style = "bg-emerald-600 hover:bg-emerald-500 text-white";

    if (match.status === MatchStatus.SCHEDULED) {
      label = "Iniciar Jogo";
    } else if (match.status === MatchStatus.LIVE) {
      if (matchPeriod === 1) {
        label = "Fim 1º Tempo";
        icon = Pause;
        style = "bg-amber-500 hover:bg-amber-400 text-white";
      } else {
        if (!isTimerRunning) {
          label = "Iniciar 2º Tempo";
        } else {
          label = "Encerrar Partida";
          icon = StopCircle;
          style = "bg-red-600 hover:bg-red-500 text-white";
        }
      }
    } else {
      return null; // Finished
    }

    const Icon = icon;
    return (
      <button onClick={handleGameFlowAction} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 ${style}`}>
        <Icon size={20} fill="currentColor" /> {label}
      </button>
    );
  };

  const renderLiveConsole = () => {
    if (!isConsoleMinimized) {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800">Console de Jogo</h4>
            <button onClick={() => setIsConsoleMinimized(true)} className="p-2 text-slate-400 hover:text-slate-600"><ChevronDown /></button>
          </div>

          {/* QUICK ACTIONS */}
          {match.status === MatchStatus.LIVE && isTimerRunning && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[MatchEventType.GOAL, MatchEventType.FOUL, MatchEventType.YELLOW_CARD, MatchEventType.RED_CARD].map(type => (
                <button key={type} onClick={() => handleConsoleAction(type)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition whitespace-nowrap overflow-hidden text-ellipsis border border-transparent hover:border-slate-300">
                  {type === MatchEventType.GOAL ? 'GOL' : type === MatchEventType.YELLOW_CARD ? 'AMARELO' : type === MatchEventType.RED_CARD ? 'VERMELHO' : 'FALTA'}
                </button>
              ))}
            </div>
          )}

          {/* EVENT MODAL */}
          {consoleOpen && selectedEventType && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 animate-in fade-in zoom-in-95">
              <p className="text-sm font-bold mb-2 text-slate-600">Para qual time?</p>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedTeamId(homeTeam.id); handleSubmitEvent() }} className="flex-1 p-3 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 font-bold rounded-lg shadow-sm">{homeTeam.name}</button>
                <button onClick={() => { setSelectedTeamId(awayTeam.id); handleSubmitEvent() }} className="flex-1 p-3 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 font-bold rounded-lg shadow-sm">{awayTeam.name}</button>
              </div>
            </div>
          )}

          {/* TIMER & FLOW CONTROLS */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-mono font-black text-slate-800 w-28">{formatTime(gameTimer)}</div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Tempo</span>
                <span className="text-sm font-bold text-emerald-600">{matchPeriod}º</span>
              </div>
            </div>
            <div className="flex gap-2">
              {renderGameFlowButton()}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="fixed bottom-4 right-4 z-40">
          <button onClick={() => setIsConsoleMinimized(false)} className="bg-slate-900 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold animate-bounce cursor-pointer hover:bg-slate-800">
            <Activity size={20} /> <span className="text-sm">{formatTime(gameTimer)}</span>
          </button>
        </div>
      )
    }
  };

  // Stat Calculations for Stats Tab
  const getTeamStats = (teamId: string) => {
    const teamEvents = match.events.filter(e => e.teamId === teamId);
    return {
      goals: teamEvents.filter(e => e.type === MatchEventType.GOAL).length,
      yellowCards: teamEvents.filter(e => e.type === MatchEventType.YELLOW_CARD).length,
      redCards: teamEvents.filter(e => e.type === MatchEventType.RED_CARD).length,
      fouls: teamEvents.filter(e => e.type === MatchEventType.FOUL).length,
      corners: teamEvents.filter(e => e.type === MatchEventType.CORNER).length,
    }
  };

  const homeStats = getTeamStats(homeTeam.id);
  const awayStats = getTeamStats(awayTeam.id);

  // NEW LINEUPS STATE
  const [viewingLineupTeamId, setViewingLineupTeamId] = useState(homeTeam.id);
  const [homeTeamTactics, setHomeTeamTactics] = useState<TacticalPosition[]>(match.homeTactics || homeTeam.tacticalFormation);
  const [awayTeamTactics, setAwayTeamTactics] = useState<TacticalPosition[]>(match.awayTactics || awayTeam.tacticalFormation);

  // Update tactics state if match prop updates (e.g. real-time sync)
  useEffect(() => {
    if (match.homeTactics) setHomeTeamTactics(match.homeTactics);
    if (match.awayTactics) setAwayTeamTactics(match.awayTactics);
  }, [match.homeTactics, match.awayTactics]);

  const handleTogglePlayer = (player: Player) => {
    const isHome = viewingLineupTeamId === homeTeam.id;
    const currentList = isHome ? homeTeamTactics : awayTeamTactics;
    const setList = isHome ? setHomeTeamTactics : setAwayTeamTactics;

    const exists = currentList.some(p => p.playerId === player.id);
    if (exists) {
      setList(currentList.filter(p => p.playerId !== player.id));
    } else {
      setList([...currentList, { playerId: player.id, x: 50, y: 50 }]);
    }
  };

  const handleSaveLineup = () => {
    const isHome = viewingLineupTeamId === homeTeam.id;
    const tactics = isHome ? homeTeamTactics : awayTeamTactics;
    onSaveMatchTactics(match.id, viewingLineupTeamId, tactics);
    alert("Escalação salva com sucesso!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 pb-12 relative overflow-hidden shrinkage-header">
        <div className="flex justify-between items-start relative z-10 mb-4">
          <button onClick={onClose} className="flex items-center gap-1 text-slate-400 hover:text-white transition"><X size={20} /> Fechar</button>
          <div className="flex items-center gap-2">
            <button onClick={handleGenerateNews} className="flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-1 px-3 rounded-full hover:shadow-lg transition animate-pulse"><Sparkles size={14} /> IA Resenha</button>
            <button onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} className="flex items-center gap-1 text-xs font-bold bg-slate-800 py-1 px-3 rounded-full">{isHeaderCollapsed ? 'Expandir' : 'Compactar'} <div className={isHeaderCollapsed ? "rotate-180" : ""}><ChevronUp size={14} /></div></button>
          </div>
        </div>
        <div className={`flex justify-between items-center transition-all duration-300 ${isHeaderCollapsed ? 'scale-75 origin-top -mt-8 mb-0' : 'mb-4'}`}>
          <div className="text-center w-1/3">
            <div className={`mx-auto rounded-full overflow-hidden border-4 border-white/10 shadow-lg mb-2 relative ${isHeaderCollapsed ? 'w-16 h-16' : 'w-20 h-20'}`}>
              {homeTeam.profilePicture ? <img src={homeTeam.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-2xl uppercase">{homeTeam.shortName?.substring(0, 2).toUpperCase() || homeTeam.name.substring(0, 2).toUpperCase()}</div>}
            </div>
            <h2 className="font-black text-lg leading-tight truncate">{homeTeam.name}</h2>
          </div>
          <div className="text-center flex-1">
            <div className="text-5xl font-black tracking-tighter flex items-center justify-center gap-4 mb-2 filter drop-shadow-2xl">
              <span>{match.homeScore}</span>
              <span className="text-slate-600 text-4xl">:</span>
              <span>{match.awayScore}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${isMatchLive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              {match.status === MatchStatus.SCHEDULED ? 'AGENDADO' : isMatchLive ? 'AO VIVO' : 'ENCERRADO'}
            </span>
          </div>
          <div className="text-center w-1/3">
            <div className={`mx-auto rounded-full overflow-hidden border-4 border-white/10 shadow-lg mb-2 relative ${isHeaderCollapsed ? 'w-16 h-16' : 'w-20 h-20'}`}>
              {awayTeam.profilePicture ? <img src={awayTeam.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-2xl uppercase">{awayTeam.shortName?.substring(0, 2).toUpperCase() || awayTeam.name.substring(0, 2).toUpperCase()}</div>}
            </div>
            <h2 className="font-black text-lg leading-tight truncate">{awayTeam.name}</h2>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="-mt-8 mx-2 bg-white rounded-xl shadow-lg border border-slate-100 flex flex-col flex-1 relative z-20 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {['TIMELINE', 'TRANSMISSION', 'ESCALAÇÕES', 'MÍDIA', 'LOCAL', 'STATS', 'CHAT'].map((tab) => {
            const key = tab === 'ESCALAÇÕES' ? 'LINEUPS' : tab === 'MÍDIA' ? 'MEDIA' : tab === 'LOCAL' ? 'LOCATION' : tab;
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key as any)} className={`px-4 py-3 text-[10px] font-bold tracking-wider uppercase border-b-2 transition whitespace-nowrap flex items-center gap-1 ${isActive ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {tab === 'TRANSMISSION' && <Video size={12} />}
                {tab === 'MÍDIA' && <ImageIcon size={12} />}
                {tab === 'LOCAL' && <MapPin size={12} />}
                {tab === 'STATS' && <BarChart3 size={12} />}
                {tab.replace('TRANSMISSION', 'Transmissão').replace('MEDIA', 'Mídia').replace('LOCATION', 'Local').replace('LINEUPS', 'Escalações')}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto bg-white pb-20">

          {/* TIMELINE TAB */}
          {activeTab === 'TIMELINE' && (
            <div className="p-4 relative">
              {match.events.length === 0 ? (
                <div className="text-center py-12 opacity-50 flex flex-col items-center">
                  <Flag className="mb-2" />
                  <p>Início de jogo</p>
                  <p className="text-xs">Eventos na linha do tempo</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Central Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 rounded-full"></div>

                  {(() => {
                    // Pre-process events to determine Period (1T/2T)
                    let currentPeriod = 0;
                    const chronEvents = [...match.events].map(e => {
                      if (e.type === MatchEventType.START) currentPeriod++;
                      return { ...e, period: currentPeriod || 1 };
                    });

                    // Render in Reverse (Newest Top)
                    return chronEvents.reverse().map((event, index) => {
                      const isHome = event.teamId === homeTeam.id;
                      const isAway = event.teamId === awayTeam.id;
                      const isCenter = !isHome && !isAway;

                      const cfg = getEventIcon(event.type);
                      const Icon = cfg.icon;

                      // Translate
                      let label = event.type as string;
                      if (event.type === MatchEventType.GOAL) label = 'GOL';
                      else if (event.type === MatchEventType.YELLOW_CARD) label = 'AMARELO';
                      else if (event.type === MatchEventType.RED_CARD) label = 'VERMELHO';
                      else if (event.type === MatchEventType.FOUL) label = 'FALTA';
                      else if (event.type === MatchEventType.START) label = 'INÍCIO';
                      else if (event.type === MatchEventType.END) label = 'FIM';

                      return (
                        <div key={event.id} className="relative flex items-center justify-between mb-6 animate-in slide-in-from-bottom-2">

                          {/* LEFT SIDE (Home) */}
                          <div className="flex-1 pr-8 flex justify-end">
                            {isHome && (
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                  <span className="font-black text-sm text-slate-800 uppercase tracking-widest">{label}</span>
                                  <div className={`p-1.5 rounded-full ${cfg.bg} ${cfg.color} shadow-sm`}><Icon size={14} /></div>
                                </div>
                                <div className="text-xs text-slate-600 font-bold">{event.playerName || homeTeam.shortName}</div>
                              </div>
                            )}
                          </div>

                          {/* CENTER AXIS (Time & Period) */}
                          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                            <div className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white w-10 text-center">
                              {event.minute}'
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 mt-0.5 bg-white px-1 rounded">
                              {event.period}T
                            </div>
                          </div>

                          {/* RIGHT SIDE (Away) */}
                          <div className="flex-1 pl-8 flex justify-start">
                            {isAway && (
                              <div className="text-left">
                                <div className="flex items-center justify-start gap-2 mb-1">
                                  <div className={`p-1.5 rounded-full ${cfg.bg} ${cfg.color} shadow-sm`}><Icon size={14} /></div>
                                  <span className="font-black text-sm text-slate-800 uppercase tracking-widest">{label}</span>
                                </div>
                                <div className="text-xs text-slate-600 font-bold">{event.playerName || awayTeam.shortName}</div>
                              </div>
                            )}
                          </div>

                          {/* CENTER EVENT (Start/End) */}
                          {isCenter && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-8 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm z-20 whitespace-nowrap">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Icon size={12} /> {label} do {event.period}º Tempo
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TRANSMISSION TAB */}
          {activeTab === 'TRANSMISSION' && (
            <div className="p-4">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Fontes de Vídeo</h3>
                <button onClick={() => window.location.reload()} className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600">
                  <RefreshCw size={12} /> Atualizar
                </button>
              </div>

              {match.streams && match.streams.length > 0 ? (
                <>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {match.streams.map((s, i) => (
                      <button key={s.id} onClick={() => setActiveStreamIndex(i)} className={`px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap ${activeStreamIndex === i ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const activeStream = match.streams![activeStreamIndex];
                    if (activeStream) {
                      return (
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
                          {activeStream.provider === 'YOUTUBE' && <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${activeStream.identifier}`} frameBorder="0" allowFullScreen />}
                          {activeStream.provider === 'TWITCH' && <iframe width="100%" height="100%" src={`https://player.twitch.tv/?channel=${activeStream.identifier}&parent=${window.location.hostname}`} frameBorder="0" allowFullScreen />}
                          {activeStream.provider === 'AGORA' && (
                            <div className="flex items-center justify-center h-full text-white">Transmissão Nativa Desativada</div>
                          )}
                        </div>
                      )
                    }
                    return null;
                  })()}
                </>
              ) : (
                <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <Video size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma transmissão ativa</p>
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                {canControl && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleAddStreamClick} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
                      <Plus size={14} /> Link Externo
                    </button>
                    <button onClick={handleRemoveStreamClick} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition">
                      <X size={14} /> Remover
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LINEUPS TAB */}
          {activeTab === 'LINEUPS' && (
            <div className="p-4 pb-20">
              {/* Team Selector Checkbox/Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setViewingLineupTeamId(homeTeam.id)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${viewingLineupTeamId === homeTeam.id ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: homeTeam.logoColor }}></div>
                  {homeTeam.name}
                </button>
                <button
                  onClick={() => setViewingLineupTeamId(awayTeam.id)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${viewingLineupTeamId === awayTeam.id ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: awayTeam.logoColor }}></div>
                  {awayTeam.name}
                </button>
              </div>

              {(() => {
                const isHome = viewingLineupTeamId === homeTeam.id;
                const activeTeam = isHome ? homeTeam : awayTeam;
                const activeTactics = isHome ? homeTeamTactics : awayTeamTactics;
                const setActiveTactics = isHome ? setHomeTeamTactics : setAwayTeamTactics;

                const isTeamEditable = (
                  currentUser.role === UserRole.REFEREE ||
                  (currentUser.teamId === '9eb92f07-f9cf-493f-8628-7d2f66195e80') ||
                  ((currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.COACH) &&
                    (String(currentUser.teamId) === String(activeTeam.id) || currentUser.id === activeTeam.createdBy))
                );

                return (
                  <div key={activeTeam.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Tactics Board */}
                    <div className="mb-6 mx-auto max-w-sm">
                      <TacticsBoard
                        team={activeTeam}
                        isEditable={isTeamEditable}
                        positions={activeTactics}
                        onPositionsChange={setActiveTactics}
                        onSave={(newPos) => {
                          setActiveTactics(newPos);
                          onSaveMatchTactics(match.id, activeTeam.id, newPos);
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Jogadores Relacionados</h4>
                        {isTeamEditable && (
                          <button onClick={handleSaveLineup} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-full hover:bg-emerald-500 shadow-sm flex items-center gap-1">
                            <Save size={12} /> Salvar Escalação
                          </button>
                        )}
                      </div>

                      {(activeTeam.roster && activeTeam.roster.length > 0) ? activeTeam.roster.map(player => {
                        const isOnField = activeTactics.some(p => p.playerId === player.id);
                        return (
                          <div
                            key={player.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition group ${isOnField ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-70 hover:opacity-100'}`}
                          >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition ${isOnField ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {player.number}
                            </span>
                            <div className='flex flex-col flex-1'>
                              <span className={`font-bold ${isOnField ? 'text-emerald-900' : 'text-slate-600'}`}>{player.name}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{player.position}</span>
                            </div>

                            {isTeamEditable && (
                              <button
                                onClick={() => handleTogglePlayer(player)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${isOnField ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                              >
                                {isOnField ? 'Banco' : 'Titular'}
                              </button>
                            )}
                          </div>
                        );
                      }) : (
                        <div className="text-center py-8">
                          <Users className="mx-auto mb-2 text-slate-300" size={24} />
                          <p className="text-xs text-slate-400">Sem jogadores</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === 'MEDIA' && (
            <div className="p-4">
              {match.media && match.media.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {match.media.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      {item.type === 'IMAGE' ? (
                        <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ImageIcon className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma foto ou vídeo.</p>
                </div>
              )}
              {canControl && (
                <div className="mt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 p-3 bg-slate-100 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition">
                    <Plus size={16} /> Adicionar Foto/Vídeo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LOCAL TAB */}
          {activeTab === 'LOCATION' && (
            <div className="p-4">
              {arena ? (
                <div className="space-y-4">
                  {/* Map Embed */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-64 bg-slate-100 relative">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(arena.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      title="Mapa da Arena"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold shadow-sm pointer-events-none text-slate-500">
                      Google Maps
                    </div>
                  </div>

                  <a
                    href={arena.googleMapsUrl || `https://maps.google.com/?q=${arena.name} ${arena.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-emerald-500 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-emerald-700 transition">{arena.name}</h3>
                        <p className="text-sm text-slate-600 mb-0 flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> {arena.address}</p>
                      </div>
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div className="mt-4 text-center text-xs font-bold text-emerald-600">
                      Abrir no App de Mapas
                    </div>
                  </a>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <MapIcon className="mx-auto mb-2 opacity-50" />
                  <p>Local não definido.</p>
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'STATS' && (
            <div className="p-4">
              <div className="space-y-6">
                {/* Goals */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-10 text-left">{homeTeam.shortName?.substring(0, 3)}</span>
                    <span>Gols</span>
                    <span className="w-10 text-right">{awayTeam.shortName?.substring(0, 3)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl w-8 text-center text-slate-800">{homeStats.goals}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${match.homeScore + match.awayScore > 0 ? (match.homeScore / (match.homeScore + match.awayScore)) * 100 : 50}%` }} className="bg-emerald-500 h-full" />
                    </div>
                    <span className="font-black text-xl w-8 text-center text-slate-800">{match.awayScore}</span>
                  </div>
                </div>

                {/* Fouls */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-10 text-left">{homeStats.fouls}</span>
                    <span>Faltas</span>
                    <span className="w-10 text-right">{awayStats.fouls}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${homeStats.fouls + awayStats.fouls > 0 ? (homeStats.fouls / (homeStats.fouls + awayStats.fouls)) * 100 : 50}%` }} className="bg-amber-400 h-full" />
                  </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-400 mb-2 truncate">{homeTeam.name} - Cartões</div>
                    <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-6 bg-yellow-400 rounded-sm mb-1 shadow-sm" />
                        <span className="font-bold text-slate-800">{homeStats.yellowCards}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-6 bg-red-500 rounded-sm mb-1 shadow-sm" />
                        <span className="font-bold text-slate-800">{homeStats.redCards}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-400 mb-2 truncate">{awayTeam.name} - Cartões</div>
                    <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-6 bg-yellow-400 rounded-sm mb-1 shadow-sm" />
                        <span className="font-bold text-slate-800">{awayStats.yellowCards}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-6 bg-red-500 rounded-sm mb-1 shadow-sm" />
                        <span className="font-bold text-slate-800">{awayStats.redCards}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'CHAT' && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 space-y-4 mb-4">
                {match.chatMessages?.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.userId === currentUser.id ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <p className="font-bold text-xs opacity-70 mb-1">{msg.userName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {canChat ? (
                <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) { onSendMessage(match.id, chatInput); setChatInput("") } }} className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Comente algo..." className="flex-1 bg-slate-100 rounded-full px-4 text-sm" />
                  <button type="submit" className="p-3 bg-slate-900 text-white rounded-full"><Send size={16} /></button>
                </form>
              ) : <p className="text-center text-xs text-slate-400">Chat disponível durante o jogo.</p>}
            </div>
          )}
        </div>
      </div>

      {/* CONSOLE OVERLAY */}
      {canControl && renderLiveConsole()}

      {/* AI NEWS MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">LocalLegends AI</h3>
                  <p className="text-xs text-slate-500 font-medium">Correspondente Virtual</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {isLoadingAI ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <div className="animate-spin text-purple-600"><RefreshCw size={32} /></div>
                  <p className="text-slate-500 font-medium animate-pulse">Escrevendo a matéria...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-slate-700">
                  <div className="whitespace-pre-line leading-relaxed">{aiContent}</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 justify-end bg-white">
              <button
                onClick={() => { navigator.clipboard.writeText(aiContent); alert("Copiado!"); }}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm transition"
              >
                <Copy size={16} /> Copiar Texto
              </button>
              {onPostNews && (
                <button
                  onClick={() => { onPostNews(aiContent, match.id); setShowAIModal(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-500 rounded-lg text-sm transition shadow-lg shadow-emerald-200"
                >
                  <Newspaper size={16} /> Postar no App
                </button>
              )}
              <button
                onClick={() => setShowAIModal(false)}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailView;
