import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users, Trophy as TrophyIcon, Calendar, Shield, Crown, Menu, X, Plus, CheckCircle, MapPin,
  Home, Newspaper, Layout, Map, ArrowLeft, Filter, Save, Trash2, User, Activity,
  MessageCircle, Settings, LogOut, Bell, Heart, UserPlus, Lock, ChevronDown, ChevronUp, ChevronRight, AlertTriangle, Mail, Key,
  Camera, Briefcase, Target, Grid, List as ListIcon, Play, Video, Image as ImageIcon, Award, Search
} from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  UserRole, Team, Match, Arena, MatchStatus, MatchType, AppView, Tournament, MatchEventType, Player, TacticalPosition, ChatMessage, CurrentUser, Notification, SocialConnection, UserAccount, PlayerStats, SportType, MatchMedia, PlayerEvaluation, NewsItem, FinancialTransaction, Trophy, MatchPrediction
} from './types';
import {
  INITIAL_ARENAS, INITIAL_MATCHES, INITIAL_TEAMS, INITIAL_TOURNAMENTS, MOCK_NEWS, ROLE_DESCRIPTIONS, DEFAULT_DIRECTOR_ID, INITIAL_NOTIFICATIONS, INITIAL_SOCIAL, MOCK_USERS, SAFE_TEAM, SPORT_TYPE_DETAILS
} from './constants';

import { generateUUID, uploadImage, extractYoutubeId } from './utils/helpers';
import { checkAndGrantAchievements } from './utils/achievementsSystem';
import { useAuth } from './hooks/useAuth';
import { CitySelect } from './components/CitySelect';
import { LoginScreen } from './components/LoginScreen';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import TacticsBoard from './components/TacticsBoard';
import MatchDetailView from './components/MatchDetailView';
import TournamentDetailView from './components/TournamentDetailView';
import UserProfileView from './components/UserProfileView';
import ArenasMapView from './components/ArenasMapView';
import ArenaDetailView from './components/ArenaDetailView';
import { RosterManager } from './components/RosterManager';
import PlayerDirectory from './components/PlayerDirectory';

// --- Safe Fallback Objects (Prevents crash when data is empty) ---
const SAFE_ARENA: Arena = {
  id: 'ghost',
  name: 'Local Indefinido',
  address: '',
  lat: 0,
  lng: 0
};

// --- Page Transition Component ---
// Replaced Lottie with pure CSS animation for robustness
const PageTransition = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
        <div className="relative w-32 h-32 flex items-center justify-center">
          <img
            src="/loading_logo.png"
            alt="Loading"
            className="w-full h-full object-contain animate-bounce transition-transform"
          />
        </div>
      </div>
      <p className="mt-8 text-emerald-800 dark:text-emerald-400 font-black tracking-[0.2em] text-sm animate-pulse uppercase">Carregando</p>
    </div>
  );
};


const App: React.FC = () => {
  // --- Hooks ---
  const {
    theme, toggleTheme, currentUser, setCurrentUser,
    handleLogin: authLogin, handleLogout: authLogout, handleUpdateProfile: authUpdateProfile
  } = useAuth();

  // --- Global State ---
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socialGraph, setSocialGraph] = useState<SocialConnection[]>([]);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [matchPredictions, setMatchPredictions] = useState<MatchPrediction[]>([]);
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS); // Initialize with Mock, then allow updates
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

  // Loading State
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('HOME');
  const [isLoading, setIsLoading] = useState(false); // Transition state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null); // New state for editing team

  // FETCH DATA FROM SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [usersRes, teamsRes, matchesRes, arenasRes, tournamentsRes, notifRes, socialRes, evalRes, trophiesRes, matchPredictionsRes] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('teams').select('*').eq('is_deleted', false),
          supabase.from('matches').select('*').eq('is_deleted', false),
          supabase.from('arenas').select('*'),
          supabase.from('tournaments').select('*').eq('is_deleted', false),
          supabase.from('notifications').select('*'),
          supabase.from('social_connections').select('*'),
          supabase.from('player_evaluations').select('*'),
          supabase.from('trophies').select('*'),
          supabase.from('match_predictions').select('*')
        ]);

        if (usersRes.data) setUserAccounts(usersRes.data.map((u: any) => ({ ...u, teamId: u.team_id, relatedPlayerId: u.related_player_id })));
        if (teamsRes.data) setTeams(teamsRes.data.map((t: any) => ({ ...t, logoColor: t.logo_color, primaryColor: t.primary_color, secondaryColor: t.secondary_color, tertiaryColor: t.tertiary_color, cover: t.cover, profilePicture: t.profile_picture, createdBy: t.created_by, isDeleted: t.is_deleted, goalsFor: t.goals_for, goalsAgainst: t.goals_against, shortName: t.short_name, tacticalFormation: t.tactical_formation })));
        if (matchesRes.data) setMatches(matchesRes.data.map((m: any) => ({ ...m, homeTeamId: m.home_team_id, awayTeamId: m.away_team_id, arenaId: m.arena_id, sportType: m.sport_type, tournamentId: m.tournament_id, homeScore: m.home_score, awayScore: m.away_score, youtubeVideoId: m.youtube_video_id, createdBy: m.created_by, isDeleted: m.is_deleted, chatMessages: m.chat_messages, homeTactics: m.home_tactics, awayTactics: m.away_tactics })));
        if (arenasRes.data) setArenas(arenasRes.data.map((a: any) => ({ ...a, googleMapsUrl: a.google_maps_url, profilePicture: a.profile_picture, coverPicture: a.cover_picture })));
        if (tournamentsRes.data) setTournaments(tournamentsRes.data.map((t: any) => ({ ...t, sportType: t.sport_type, currentRound: t.current_round, totalRounds: t.total_rounds, participatingTeamIds: t.participating_team_ids, createdBy: t.created_by, isDeleted: t.is_deleted })));
        if (notifRes.data) setNotifications(notifRes.data.map((n: any) => ({ ...n, fromId: n.from_id, fromName: n.from_name, toUserId: n.to_user_id, isRead: n.is_read })));
        if (socialRes.data) setSocialGraph(socialRes.data.map((s: any) => ({ ...s, followerId: s.follower_id, targetId: s.target_id, targetType: s.target_type })));
        if (evalRes.data) setEvaluations(evalRes.data.map((e: any) => ({ ...e, playerId: e.player_id, evaluatorId: e.evaluator_id, matchId: e.match_id, technicalScore: e.technical_score, tacticalScore: e.tactical_score, physicalScore: e.physical_score, mentalScore: e.mental_score, createdAt: e.created_at })));

        if (trophiesRes.data) setTrophies(trophiesRes.data.map((tr: any) => ({ ...tr, teamId: tr.team_id, playerId: tr.player_id, dateAchieved: tr.date_achieved })));
        if (matchPredictionsRes.data) setMatchPredictions(matchPredictionsRes.data.map((mp: any) => ({ ...mp, matchId: mp.match_id, userId: mp.user_id, predictedHomeScore: mp.predicted_home_score, predictedAwayScore: mp.predicted_away_score })));

      } catch (error) {
        console.error("Error fetching data from Supabase:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // --- AUTOMATIC ACHIEVEMENT SYSTEM ---
  useEffect(() => {
    if (isLoadingData) return;

    // Use a timeout to avoid blocking the main thread immediately after load/render
    const timeoutId = setTimeout(async () => {
      let newTrophiesToInsert: Omit<Trophy, 'id'>[] = [];

      // 1. Check Teams
      teams.forEach(team => {
        // Team Achievements
        const newTeamTrophies = checkAndGrantAchievements(trophies, team.id, team, 'TEAM');
        if (newTeamTrophies.length > 0) {
          // Ensure teamId and category are correct
          newTrophiesToInsert = [
            ...newTrophiesToInsert,
            ...newTeamTrophies.map(t => ({
              ...t,
              teamId: team.id,
              category: 'TEAM' as const
            }))
          ];
        }

        // 2. Check Players in Roster
        team.roster.forEach(player => {
          if (player.stats) {
            const newPlayerTrophies = checkAndGrantAchievements(trophies, player.id, player.stats, 'PLAYER');

            if (newPlayerTrophies.length > 0) {
              newTrophiesToInsert = [
                ...newTrophiesToInsert,
                ...newPlayerTrophies.map(t => ({
                  ...t,
                  playerId: player.id,
                  teamId: team.id,
                  category: 'INDIVIDUAL' as const
                }))
              ];
            }
          }
        });
      });

      if (newTrophiesToInsert.length > 0) {
        console.log(`Awarding ${newTrophiesToInsert.length} new achievements automatically.`);

        // Insert into Supabase
        const { data, error } = await supabase.from('trophies').insert(newTrophiesToInsert.map(t => ({
          team_id: t.teamId,
          player_id: t.playerId,
          name: t.name,
          description: t.description,
          category: t.category,
          date_achieved: t.dateAchieved
        }))).select();

        if (error) {
          console.error("Error auto-granting trophies:", error);
        } else if (data) {
          // Update local state by appending new trophies
          setTrophies(prev => [...prev, ...data.map((d: any) => ({
            id: d.id,
            teamId: d.team_id,
            playerId: d.player_id,
            name: d.name,
            description: d.description,
            category: d.category,
            dateAchieved: d.date_achieved
          }))]);
        }
      }
    }, 2000); // 2 second delay to let things settle

    return () => clearTimeout(timeoutId);

  }, [isLoadingData, teams, trophies.length]);

  // --- Automatic Cleanup of Orphaned Evaluations ---
  useEffect(() => {
    const cleanupOrphanedEvaluations = async () => {
      if (!isLoadingData && evaluations.length > 0 && teams.length > 0) {
        // Collect all player IDs from all active (non-deleted) teams
        const activePlayerIds = new Set<string>();
        teams.filter(t => !t.isDeleted).forEach(t => {
          t.roster.forEach(p => activePlayerIds.add(p.id));
        });

        // Find evaluations for players that are not in any active roster
        const orphaned = evaluations.filter(ev => !activePlayerIds.has(ev.playerId));

        if (orphaned.length > 0) {
          console.log(`DEBUG: Found ${orphaned.length} orphaned evaluations. Cleaning up...`);
          const orphanedIds = orphaned.map(ev => ev.id);

          const { error } = await supabase.from('player_evaluations').delete().in('id', orphanedIds);

          if (!error) {
            // Update local state by removing deleted evals
            setEvaluations(prev => prev.filter(ev => !orphanedIds.includes(ev.id)));
            console.log("DEBUG: Orphaned evaluations removed successfully from DB and local state.");
          } else {
            console.error("DEBUG: Failed to delete orphaned evaluations:", error);
          }
        }
      }
    };

    cleanupOrphanedEvaluations();
  }, [isLoadingData, teams, evaluations.length]);

  // --- Player Evaluation State ---
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedPlayerForEvaluation, setSelectedPlayerForEvaluation] = useState<{ player: Player, teamId: string } | null>(null);

  // --- HANDLERS ---
  const handleSaveEvaluation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlayerForEvaluation || !currentUser) return;
    const formData = new FormData(event.currentTarget);

    // Evaluation Object
    const newEval = {
      id: generateUUID(),
      player_id: selectedPlayerForEvaluation.player.id,
      evaluator_id: currentUser.id,
      rating: Number(formData.get('rating')),
      technical_score: Number(formData.get('technicalScore')),
      tactical_score: Number(formData.get('tacticalScore')),
      physical_score: Number(formData.get('physicalScore')),
      mental_score: Number(formData.get('mentalScore')),
      comments: formData.get('comments') as string
    };

    const { error } = await supabase.from('player_evaluations').insert(newEval);

    if (error) {
      console.error("Error saving evaluation:", error);
      alert("Erro ao salvar avaliação (Banco de dados pode estar desatualizado).");
    } else {
      alert("Avaliação salva com sucesso!");
      const mappedEval: PlayerEvaluation = {
        id: newEval.id,
        playerId: newEval.player_id,
        evaluatorId: newEval.evaluator_id,
        rating: newEval.rating,
        technicalScore: newEval.technical_score,
        tacticalScore: newEval.tactical_score,
        physicalScore: newEval.physical_score,
        mentalScore: newEval.mental_score,
        comments: newEval.comments,
        createdAt: new Date().toISOString()
      };
      setEvaluations(prev => [...prev, mappedEval]);
      setIsEvaluationModalOpen(false);
      setSelectedPlayerForEvaluation(null);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    const { error } = await supabase.from('player_evaluations').delete().eq('id', evaluationId);
    if (error) {
      console.error("Error deleting evaluation:", error);
      alert("Erro ao excluir avaliação.");
    } else {
      setEvaluations(prev => prev.filter(e => e.id !== evaluationId));
    }
  };

  const handleResetEvaluations = async (playerId: string) => {
    const { error } = await supabase.from('player_evaluations').delete().eq('player_id', playerId);
    if (error) {
      console.error("Error resetting evaluations:", error);
      alert("Erro ao zerar histórico.");
    } else {
      setEvaluations(prev => prev.filter(e => e.playerId !== playerId));
      alert("Histórico de avaliações zerado com sucesso!");
    }
  };




  const handleSaveTrophy = async (trophy: Omit<Trophy, 'id'>) => {
    const newTrophy = { ...trophy, id: generateUUID() };
    const { error } = await supabase.from('trophies').insert({
      id: newTrophy.id,
      team_id: newTrophy.teamId,
      player_id: newTrophy.playerId,
      name: newTrophy.name,
      description: newTrophy.description,
      category: newTrophy.category,
      date_achieved: newTrophy.dateAchieved
    });

    if (error) {
      console.error("Error saving trophy:", error);
      alert("Erro ao salvar conquista.");
    } else {
      setTrophies(prev => [...prev, newTrophy]);
    }
  };

  const handleDeleteTrophy = async (id: string) => {
    const { error } = await supabase.from('trophies').delete().eq('id', id);
    if (error) {
      console.error("Error deleting trophy:", error);
      alert("Erro ao excluir conquista.");
    } else {
      setTrophies(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSavePrediction = async (prediction: Omit<MatchPrediction, 'id'>) => {
    const newId = generateUUID();
    const dbPrediction = {
      id: newId,
      match_id: prediction.matchId,
      user_id: prediction.userId,
      predicted_home_score: prediction.predictedHomeScore,
      predicted_away_score: prediction.predictedAwayScore
    };

    const { error } = await supabase.from('match_predictions').upsert(dbPrediction, { onConflict: 'match_id,user_id' });

    if (error) {
      console.error("Error saving prediction:", error);
      alert("Erro ao salvar palpite.");
    } else {
      const savedPrediction: MatchPrediction = { ...prediction, id: newId };
      setMatchPredictions(prev => {
        const filtered = prev.filter(p => !(p.matchId === prediction.matchId && p.userId === prediction.userId));
        return [...filtered, savedPrediction];
      });
      alert("Palpite salvo com sucesso!");
    }
  };
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null); // New State
  const [isArenasMapMode, setIsArenasMapMode] = useState(false);

  // Home Feed Specific State
  const [homeFeedTournamentId, setHomeFeedTournamentId] = useState<string | null>(null);
  const [homeFeaturedStatus, setHomeFeaturedStatus] = useState<MatchStatus | 'ALL'>('ALL');

  // MATCH LIST FILTERS
  const [matchContextFilter, setMatchContextFilter] = useState<string>('ALL'); // Type/Tournament
  const [matchStatusFilter, setMatchStatusFilter] = useState<MatchStatus | 'ALL'>('ALL'); // Status
  const [showOtherGames, setShowOtherGames] = useState(false);

  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [previewTeamData, setPreviewTeamData] = useState<Team | null>(null); // Local Preview State
  const [isViewingFullRoster, setIsViewingFullRoster] = useState(false); // New State for Full Roster View

  // Sync Preview Data when entering edit mode
  useEffect(() => {
    if (isEditingTeam && viewingTeamId) {
      const team = teams.find(t => t.id === viewingTeamId);
      if (team) setPreviewTeamData(team);
    } else {
      setPreviewTeamData(null);
    }
  }, [isEditingTeam, viewingTeamId, teams]);

  const [teamMatchFilter, setTeamMatchFilter] = useState<'UPCOMING' | 'FINISHED'>('UPCOMING');

  // Modals / Detail Views State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false); // Arena Creation
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeamIdForInvite, setSelectedTeamIdForInvite] = useState<string | null>(null);
  const [inviteModalEmail, setInviteModalEmail] = useState<string | null>(null); // NEW STATE FOR PRE-FILLING EMAIL

  // FAB State
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'USER' } | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [broadcastingMatchId, setBroadcastingMatchId] = useState<string | null>(null); // Lifted state for persistent broadcast
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<{ player: Player, teamName: string } | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [dashboardTeamId, setDashboardTeamId] = useState<string | null>(null);

  // Refs
  const notificationRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync Dashboard Team with User Team initially
  useEffect(() => {
    if (currentUser?.teamId) {
      setDashboardTeamId(currentUser.teamId);
    }
  }, [currentUser]);

  // --- View Transition Handler ---
  const changeView = (newView: AppView) => {
    if (newView === currentView) return;
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView(newView);
      setSelectedTournamentId(null);
      setSelectedMatchId(null);
      setViewingTeamId(null);
      setIsLoading(false);
    }, 800); // 800ms fake load for effect
  };

  // --- Derived Data ---
  // Filter out deleted items (Soft Delete)
  const activeMatches = useMemo(() => matches.filter(m => !m.isDeleted), [matches]);
  const activeTeams = useMemo(() => teams.filter(t => !t.isDeleted), [teams]);
  const activeTournaments = useMemo(() => tournaments.filter(t => !t.isDeleted), [tournaments]);

  const upcomingMatches = useMemo(() =>
    activeMatches.filter(m => m.status !== MatchStatus.FINISHED).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [activeMatches]);

  const unreadNotifications = notifications.filter(n => n.toUserId === currentUser?.id && !n.isRead);

  // --- Helpers (Safe Accessors) ---
  const getTeam = (id: string) => teams.find(t => t.id === id) || { ...SAFE_TEAM, id: id };
  const getArena = (id: string) => arenas.find(a => a.id === id) || { ...SAFE_ARENA, id: id };
  const canManage = currentUser?.role === UserRole.DIRECTOR;

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // --- Session Management ---
  const handleLogin = (user: UserAccount) => {
    setIsLoading(true);
    setTimeout(() => {
      authLogin(user, (startView) => {
        setCurrentView(startView);
        setIsLoading(false);
      });
    }, 1000);
  };

  const handleRegister = async (newUser: UserAccount) => {
    const dbUser = {
      id: newUser.id,
      email: newUser.email,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role,
      team_id: newUser.teamId,
      location: newUser.location,
      avatar: newUser.avatar,
      related_player_id: newUser.relatedPlayerId
    };
    const { error } = await supabase.from('users').insert(dbUser);
    if (error) console.error("Register Error:", error);

    // Auto-add to Roster if Player/Coach with a team
    if ((newUser.role === UserRole.PLAYER || newUser.role === UserRole.COACH) && newUser.teamId) {
      const targetTeam = teams.find(t => t.id === newUser.teamId);
      if (targetTeam) {
        const newPlayer: Player = {
          id: `p-${newUser.id}`,
          name: newUser.name,
          number: 99, // Default
          position: 'Curinga',
          stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 },
          userId: newUser.id,

        };

        const updatedRoster = [...targetTeam.roster, newPlayer];

        // Update DB
        await supabase.from('teams').update({ roster: updatedRoster }).eq('id', targetTeam.id);

        // Update Local State
        setTeams(prev => prev.map(t => t.id === targetTeam.id ? { ...t, roster: updatedRoster } : t));
      }
    }

    setUserAccounts(prev => [...prev, newUser]);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      authLogout(() => {
        setSelectedMatchId(null);
        setCurrentView('HOME');
        setViewingProfileId(null);
        setHomeFeedTournamentId(null);
        setIsLoading(false);
      });
    }, 800);
  };

  const handleTeamClick = (teamId: string) => {
    setViewingTeamId(teamId);
    setCurrentView('TEAMS');
    setSelectedMatchId(null);
    setSelectedTournamentId(null);
    setIsEditingTeam(false);
  };

  const handleUpdateProfile = async (updatedUser: UserAccount) => {
    // 1. Update Local Users State
    setUserAccounts(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // 2. Update Auth State & DB
    try {
      await authUpdateProfile(updatedUser);
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      alert("Erro ao salvar perfil no banco de dados.");
    }
  };

  // --- Actions ---

  const handleTogglePlayerRole = async (userId: string, teamId: string, shouldBePlayer: boolean) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    let updatedRoster = [...team.roster];
    const user = userAccounts.find(u => u.id === userId);
    if (!user) return;

    if (shouldBePlayer) {
      // Add to roster if not exists
      if (!updatedRoster.some(p => p.userId === userId)) {
        const newPlayer: Player = {
          id: `p-${userId}`,
          name: user.name,
          number: 99,
          position: 'Curinga',
          stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 },
          userId: userId
        };
        updatedRoster.push(newPlayer);
      }
    } else {
      updatedRoster = updatedRoster.filter(p => p.userId !== userId);
    }

    const updatedTeam = { ...team, roster: updatedRoster };
    setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));

    await supabase.from('teams').update({ roster: updatedRoster }).eq('id', teamId);
    alert(shouldBePlayer ? "Você agora também é um jogador do elenco!" : "Você saiu do elenco de jogadores.");
  };

  const handleSaveMatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(event.currentTarget);
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const videoId = youtubeUrl ? extractYoutubeId(youtubeUrl) : undefined;

    // Handle Media Files
    const mediaFiles = formData.getAll('media') as File[];
    const newMediaItems: MatchMedia[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        if (file.size > 0 && file.type.startsWith('image/')) {
          const publicUrl = await uploadImage(file);
          if (publicUrl) {
            newMediaItems.push({
              id: `med-${Date.now()}-${Math.random()}`,
              type: 'IMAGE',
              url: publicUrl,
              uploadedBy: currentUser.name,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }

    const newMatchId = (editingMatch && editingMatch.id) ? editingMatch.id : generateUUID();
    console.log("DEBUG: Generated New Match ID:", newMatchId);

    const newMatch: Match = {
      id: newMatchId,
      createdBy: (editingMatch && editingMatch.createdBy) ? editingMatch.createdBy : currentUser.id,
      isDeleted: false,
      homeTeamId: formData.get('homeTeamId') as string,
      awayTeamId: formData.get('awayTeamId') as string,
      date: formData.get('date') as string,
      arenaId: formData.get('arenaId') as string,
      type: formData.get('type') as MatchType,
      sportType: formData.get('sportType') as SportType,
      status: (editingMatch && editingMatch.status) ? editingMatch.status : MatchStatus.SCHEDULED,
      tournamentId: formData.get('tournamentId') ? formData.get('tournamentId') as string : undefined,
      round: formData.get('round') as string,
      homeScore: editingMatch?.homeScore || 0,
      awayScore: editingMatch?.awayScore || 0,
      events: editingMatch?.events || [],
      chatMessages: editingMatch?.chatMessages || [],
      homeTactics: editingMatch?.homeTactics,
      awayTactics: editingMatch?.awayTactics,
      youtubeVideoId: videoId || editingMatch?.youtubeVideoId,
      media: editingMatch ? [...(editingMatch.media || []), ...newMediaItems] : newMediaItems
    };

    // }; removed from previous error
    // Removed setState logic placeholder comment

    const dbMatch = {
      id: newMatch.id,
      created_by: newMatch.createdBy,
      is_deleted: newMatch.isDeleted,
      home_team_id: newMatch.homeTeamId,
      away_team_id: newMatch.awayTeamId,
      date: newMatch.date,
      arena_id: newMatch.arenaId,
      type: newMatch.type,
      sport_type: newMatch.sportType,
      status: newMatch.status,
      tournament_id: newMatch.tournamentId,
      round: newMatch.round,
      home_score: newMatch.homeScore,
      away_score: newMatch.awayScore,
      events: newMatch.events,
      chat_messages: newMatch.chatMessages,
      home_tactics: newMatch.homeTactics,
      away_tactics: newMatch.awayTactics,
      youtube_video_id: newMatch.youtubeVideoId,
      media: newMatch.media
    };

    console.log("DEBUG: Saving Match Payload to Supabase:", dbMatch);

    const { error } = await supabase.from('matches').upsert(dbMatch);
    if (error) {
      console.error("Supabase Save Match Error:", error);
      alert("Erro ao salvar jogo no servidor.");
      return;
    }

    if (editingMatch) {
      setMatches(prev => prev.map(m => m.id === editingMatch.id ? newMatch : m));
    } else {
      setMatches(prev => [...prev, newMatch]);
    }

    setIsMatchModalOpen(false);
    setEditingMatch(null);
  };

  const handleAddMatchMedia = async (matchId: string, type: 'IMAGE' | 'VIDEO', content: string | File) => {
    if (!currentUser) return;

    let url = '';
    if (content instanceof File) {
      const uploadedUrl = await uploadImage(content);
      if (!uploadedUrl) return; // Upload failed
      url = uploadedUrl;
    } else {
      url = content;
    }

    const newMedia: MatchMedia = {
      id: `med-${Date.now()}`,
      type,
      url,
      uploadedBy: currentUser.name,
      createdAt: new Date().toISOString()
    };

    const updatedMatch = matches.find(m => m.id === matchId);
    if (updatedMatch) {
      const updatedMedia = [...updatedMatch.media, newMedia];
      supabase.from('matches').update({ media: updatedMedia }).eq('id', matchId).then(({ error }) => {
        if (error) console.error("Error adding match media:", error);
      });

      setMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          return { ...m, media: updatedMedia };
        }
        return m;
      }));
      alert("Mídia adicionada com sucesso!");
    }
  };

  const openDeleteModal = (id: string, type: 'MATCH' | 'TEAM' | 'TOURNAMENT' | 'USER') => {
    setItemToDelete({ id, type });
  };

  const executeDeletion = async () => {
    if (!itemToDelete || !currentUser) return;

    const { id, type } = itemToDelete;

    if (type === 'MATCH') {
      const item = matches.find(m => m.id === id);
      if (item && item.createdBy === currentUser.id) {
        supabase.from('matches').update({ is_deleted: true }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error deleting match:", error);
        });

        const updatedMatchesList = matches.map(m => m.id === id ? { ...m, isDeleted: true } : m);
        setMatches(updatedMatchesList);
        setSelectedMatchId(null);
        setIsMatchModalOpen(false);

        if (item.status === MatchStatus.FINISHED) {
          const activeMatches = updatedMatchesList.filter(m => !m.isDeleted);
          await recalculateTeamStats(item.homeTeamId, activeMatches, teams);
          await recalculateTeamStats(item.awayTeamId, activeMatches, teams);
        }
        alert("Jogo excluído.");
      } else {
        alert("Você não tem permissão para excluir este jogo.");
      }
    } else if (type === 'TOURNAMENT') {
      const item = tournaments.find(t => t.id === id);
      if (item && item.createdBy === currentUser.id) {
        supabase.from('tournaments').update({ is_deleted: true }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error deleting tournament:", error);
        });
        setTournaments(prev => prev.map(t => t.id === id ? { ...t, isDeleted: true } : t));
        setSelectedTournamentId(null);
      } else {
        alert("Você não tem permissão para excluir este campeonato.");
      }
    } else if (type === 'TEAM') {
      const team = teams.find(t => t.id === id);
      if (team && (team.createdBy === currentUser.id || currentUser.role === UserRole.DIRECTOR)) {
        const teamMatches = matches.filter(m => m.homeTeamId === id || m.awayTeamId === id);
        const teamMatchIds = teamMatches.map(m => m.id);

        if (teamMatchIds.length > 0) {
          await supabase.from('matches').update({ is_deleted: true }).in('id', teamMatchIds);
        }

        // Cleanup Player Evaluations for the roster
        const playerIds = team.roster.map(p => p.id);
        if (playerIds.length > 0) {
          await supabase.from('player_evaluations').delete().in('player_id', playerIds);
          setEvaluations(prev => prev.filter(e => !playerIds.includes(e.playerId)));
        }

        await supabase.from('teams').update({ is_deleted: true }).eq('id', id);

        // Cleanup Users (Set team_id to null)
        await supabase.from('users').update({ team_id: null }).eq('team_id', id);
        setUserAccounts(prev => prev.map(u => u.teamId === id ? { ...u, teamId: null } : u));
        if (currentUser.teamId === id) {
          setCurrentUser(prev => prev ? { ...prev, teamId: null } : null);
        }

        // Update Local State
        setTeams(prev => prev.filter(t => t.id !== id));
        const updatedMatches = matches.map(m => teamMatchIds.includes(m.id) ? { ...m, isDeleted: true } : m);
        setMatches(updatedMatches);

        setViewingTeamId(null);
        setIsTeamModalOpen(false);
        setViewingProfileId(null);

        const opponents = new Set<string>();
        teamMatches.forEach(m => {
          if (m.homeTeamId !== id) opponents.add(m.homeTeamId);
          if (m.awayTeamId !== id) opponents.add(m.awayTeamId);
        });

        const remainingTeams = teams.filter(t => t.id !== id);
        const activeMatches = updatedMatches.filter(m => !m.isDeleted);

        for (const oppId of Array.from(opponents)) {
          await recalculateTeamStats(oppId, activeMatches, remainingTeams);
        }
        alert("Time e todo o histórico de partidas relacionado foram excluídos com sucesso.");
      } else {
        alert("Permissão negada.");
      }
    } else if (type === 'USER') {
      if (currentUser.role === UserRole.DIRECTOR) {
        setUserAccounts(prev => prev.filter(u => u.id !== id));
        alert("Usuário removido.");
      }
    }
    setItemToDelete(null);
  };

  const handleUpdateScore = (matchId: string, homeScore: number, awayScore: number, status: MatchStatus) => {
    supabase.from('matches').update({ home_score: homeScore, away_score: awayScore, status }).eq('id', matchId).then(({ error }) => {
      if (error) console.error("Error updating score:", error);
    });

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, homeScore, awayScore, status };
      }
      return m;
    }));
  };

  const handleAddEvent = (type: MatchEventType, teamId: string | null, playerId: string | null, minute: number) => {
    if (!selectedMatchId) return;

    const matchToUpdate = matches.find(m => m.id === selectedMatchId);
    if (!matchToUpdate) return;

    const newEvent = {
      id: `evt-${Date.now()}`,
      type,
      minute,
      teamId: teamId || undefined,
      playerId: playerId || undefined,
      playerName: playerId ? teams.flatMap(t => t.roster).find(p => p.id === playerId)?.name : undefined,
      description: type === MatchEventType.START ? 'Início' : type === MatchEventType.END ? 'Fim' : undefined
    };

    let newHomeScore = matchToUpdate.homeScore;
    let newAwayScore = matchToUpdate.awayScore;

    if (type === MatchEventType.GOAL && teamId) {
      if (teamId === matchToUpdate.homeTeamId) newHomeScore++;
      if (teamId === matchToUpdate.awayTeamId) newAwayScore++;
    }

    setMatches(prev => prev.map(m => m.id === selectedMatchId ? {
      ...m,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      status: type === MatchEventType.START ? MatchStatus.LIVE : type === MatchEventType.END ? MatchStatus.FINISHED : MatchStatus.LIVE,
      events: [...m.events, newEvent]
    } : m));

    // Update Match in Supabase
    const updatedStatus = type === MatchEventType.START ? MatchStatus.LIVE : type === MatchEventType.END ? MatchStatus.FINISHED : MatchStatus.LIVE;
    const updatedEvents = [...matchToUpdate.events, newEvent];

    supabase.from('matches').update({
      home_score: newHomeScore,
      away_score: newAwayScore,
      status: updatedStatus,
      events: updatedEvents
    }).eq('id', selectedMatchId).then(({ error }) => {
      if (error) console.error("Error updating match event:", error);
    });

    if (playerId && teamId) {
      setTeams(prevTeams => prevTeams.map(team => {
        if (team.id !== teamId) return team;

        return {
          ...team,
          roster: team.roster.map(player => {
            if (player.id !== playerId) return player;
            const newStats = { ...player.stats };
            if (type === MatchEventType.GOAL) newStats.goals++;
            if (type === MatchEventType.YELLOW_CARD) newStats.yellowCards++;
            if (type === MatchEventType.RED_CARD) newStats.redCards++;
            if (type === MatchEventType.START) newStats.matchesPlayed++;
            return { ...player, stats: newStats };
          })
        };
      }));

      // Update Team Roster (Stats) in Supabase
      // We need to calculate the NEW roster state to send it.
      // Since setState is async, we can't trust 'teams' state immediately after setTeams for this calculation if we want to send it NOW.
      // Instead, let's recalculate it locally for the Supabase call.
      const teamToUpdate = teams.find(t => t.id === teamId);
      if (teamToUpdate) {
        const updatedRoster = teamToUpdate.roster.map(player => {
          if (player.id !== playerId) return player;
          const newStats = { ...player.stats };
          if (type === MatchEventType.GOAL) newStats.goals++;
          if (type === MatchEventType.YELLOW_CARD) newStats.yellowCards++;
          if (type === MatchEventType.RED_CARD) newStats.redCards++;
          if (type === MatchEventType.START) newStats.matchesPlayed++;
          return { ...player, stats: newStats };
        });

        supabase.from('teams').update({ roster: updatedRoster }).eq('id', teamId).then(({ error }) => {
          if (error) console.error("Error updating player stats:", error);
        });
      }
    }
  };

  const handleSendMessage = (matchId: string, text: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString(),
      teamId: currentUser.teamId || undefined
    };

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, chatMessages: [...m.chatMessages, newMessage] };
      }
      return m;
    }));
  };

  const handleSaveMatchTactics = (matchId: string, teamId: string, newPositions: TacticalPosition[]) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;

      if (teamId === m.homeTeamId) {
        return { ...m, homeTactics: newPositions };
      } else if (teamId === m.awayTeamId) {
        return { ...m, awayTactics: newPositions };
      }
      return m;
    }));
    alert("Tática salva para esta partida!");
  };

  const handleSaveTeamTactics = (teamId: string, newPositions: TacticalPosition[]) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, tacticalFormation: newPositions } : t));
    alert("Formação padrão atualizada!");
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este jogador do time?")) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedRoster = team.roster.filter(p => p.id !== playerId);

    // Optimistic Update
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, roster: updatedRoster } : t));

    // Update Supabase
    const { error } = await supabase.from('teams').update({ roster: updatedRoster }).eq('id', teamId);

    if (error) {
      console.error("Error removing player:", error);
      alert("Erro ao remover jogador.");
      // Revert on error would be ideal, but for now simple alert
      return;
    }
  };

  const handleUpdateRoster = async (teamId: string, updatedRoster: Player[]) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ roster: updatedRoster })
        .eq('id', teamId);

      if (error) throw error;

      // Update local state
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, roster: updatedRoster } : t
      ));
    } catch (err: any) {
      console.error('Error updating roster:', err);
      alert('Erro ao atualizar elenco: ' + err.message);
    }
  };

  const applyTacticalPreset = (teamId: string, formation: string) => {
    const team = getTeam(teamId);
    let newPositions: TacticalPosition[] = [];
    const rosterIds = team.roster.map(p => p.id);

    if (rosterIds.length === 0) return;

    const getPos = (idx: number, x: number, y: number) => {
      if (idx < rosterIds.length) newPositions.push({ playerId: rosterIds[idx], x, y });
    };

    // Always GK at (50, 90)
    getPos(0, 50, 90);

    // Soccer & General Large Formations
    if (formation === '4-4-2') {
      getPos(1, 15, 70); getPos(2, 40, 70); getPos(3, 60, 70); getPos(4, 85, 70);
      getPos(5, 15, 45); getPos(6, 40, 45); getPos(7, 60, 45); getPos(8, 85, 45);
      getPos(9, 35, 20); getPos(10, 65, 20);
    } else if (formation === '4-3-3') {
      getPos(1, 15, 70); getPos(2, 40, 70); getPos(3, 60, 70); getPos(4, 85, 70);
      getPos(5, 50, 50); getPos(6, 30, 40); getPos(7, 70, 40);
      getPos(8, 15, 20); getPos(9, 50, 20); getPos(10, 85, 20);
    } else if (formation === '3-5-2') {
      getPos(1, 30, 75); getPos(2, 50, 75); getPos(3, 70, 75);
      getPos(4, 15, 50); getPos(5, 35, 50); getPos(6, 50, 45); getPos(7, 65, 50); getPos(8, 85, 50);
      getPos(9, 40, 20); getPos(10, 60, 20);
    } else if (formation === '4-2-3-1') {
      getPos(1, 15, 75); getPos(2, 40, 75); getPos(3, 60, 75); getPos(4, 85, 75);
      getPos(5, 35, 60); getPos(6, 65, 60);
      getPos(7, 15, 35); getPos(8, 50, 35); getPos(9, 85, 35);
      getPos(10, 50, 15);
    }

    // FUTSAL (5v5)
    else if (formation === '1-2-1') {
      getPos(1, 50, 75); // Fixo
      getPos(2, 20, 50); // Ala Esq
      getPos(3, 80, 50); // Ala Dir
      getPos(4, 50, 25); // Pivô
    } else if (formation === '2-2') {
      getPos(1, 30, 70); getPos(2, 70, 70);
      getPos(3, 30, 30); getPos(4, 70, 30);
    } else if (formation === '3-1') {
      getPos(1, 20, 70); getPos(2, 50, 70); getPos(3, 80, 70);
      getPos(4, 50, 30);
    }

    // FUT7 (7v7)
    else if (formation === '2-3-1') {
      getPos(1, 30, 75); getPos(2, 70, 75);
      getPos(3, 15, 50); getPos(4, 50, 50); getPos(5, 85, 50);
      getPos(6, 50, 25);
    } else if (formation === '3-2-1') {
      getPos(1, 15, 75); getPos(2, 50, 75); getPos(3, 85, 75);
      getPos(4, 30, 45); getPos(5, 70, 45);
      getPos(6, 50, 20);
    } else if (formation === '3-3') {
      getPos(1, 20, 75); getPos(2, 50, 75); getPos(3, 80, 75);
      getPos(4, 20, 35); getPos(5, 50, 35); getPos(6, 80, 35);
    }

    // FUT6 (6v6)
    else if (formation === '2-2-1') {
      getPos(1, 30, 75); getPos(2, 70, 75);
      getPos(3, 30, 45); getPos(4, 70, 45);
      getPos(5, 50, 20);
    } else if (formation === '3-1-1') {
      getPos(1, 15, 75); getPos(2, 50, 75); getPos(3, 85, 75);
      getPos(4, 50, 45);
      getPos(5, 50, 20);
    } else if (formation === '2-1-2') {
      getPos(1, 30, 75); getPos(2, 70, 75);
      getPos(3, 50, 50);
      getPos(4, 30, 25); getPos(5, 70, 25);
    }

    // FUT8 (8v8)
    else if (formation === '3-3-1') {
      getPos(1, 20, 75); getPos(2, 50, 75); getPos(3, 80, 75);
      getPos(4, 20, 45); getPos(5, 50, 45); getPos(6, 80, 45);
      getPos(7, 50, 20);
    } else if (formation === '3-2-2') {
      getPos(1, 20, 75); getPos(2, 50, 75); getPos(3, 80, 75);
      getPos(4, 35, 45); getPos(5, 65, 45);
      getPos(6, 35, 20); getPos(7, 65, 20);
    } else if (formation === '2-4-1') {
      getPos(1, 35, 75); getPos(2, 65, 75);
      getPos(3, 10, 50); getPos(4, 35, 50); getPos(5, 65, 50); getPos(6, 90, 50);
      getPos(7, 50, 20);
    }

    handleSaveTeamTactics(teamId, newPositions);
  };

  // TEAM CRUD (Simplified for Director)
  const handleCreateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(event.currentTarget);
    const teamName = formData.get('teamName') as string;
    const shortName = formData.get('shortName') as string || teamName.substring(0, 3).toUpperCase();
    const city = formData.get('city') as string || 'Desconhecida';
    const sportType = formData.get('sportType') as SportType || SportType.FUT7;

    // New Color Logic
    const primaryColor = formData.get('primaryColor') as string || '#10b981';
    const secondaryColor = formData.get('secondaryColor') as string || '#0f172a';
    const tertiaryColor = formData.get('tertiaryColor') as string || '';

    // Image Logic
    const coverFile = formData.get('cover') as File;
    const profileFile = formData.get('profilePicture') as File;

    let coverUrl = 'https://picsum.photos/1200/400';
    if (coverFile && coverFile.size > 0) {
      const uploadedUrl = await uploadImage(coverFile);
      if (uploadedUrl) coverUrl = uploadedUrl;
    }

    let profileUrl = '';
    if (profileFile && profileFile.size > 0) {
      const uploadedUrl = await uploadImage(profileFile);
      if (uploadedUrl) profileUrl = uploadedUrl;
    }

    // Create new Team with Creator in Roster
    const creatorPlayer: Player = {
      id: `p-${currentUser.id}`, // Use user ID prefix
      name: currentUser.name,
      number: 10,
      position: 'Curinga',
      stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 },
      userId: currentUser.id
    };

    const newTeam: Team = {
      id: self.crypto.randomUUID(), // Use valid UUID to prevent type errors in Supabase
      name: teamName,
      shortName: shortName,
      city,
      logoColor: primaryColor,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      cover: coverUrl,
      profilePicture: profileUrl,
      sportType,
      wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
      roster: [creatorPlayer], // Add creator to roster
      tacticalFormation: [],
      createdBy: currentUser.id,
      isDeleted: false
    };

    const dbTeam = {
      id: newTeam.id,
      name: newTeam.name,
      short_name: newTeam.shortName,
      city: newTeam.city,
      logo_color: newTeam.logoColor,
      // Removed new color fields to fix schema error
      // primary_color: newTeam.primaryColor,
      // secondary_color: newTeam.secondaryColor,
      // tertiary_color: newTeam.tertiaryColor,
      // usage of non-existent columns
      // cover: newTeam.cover,
      // profile_picture: newTeam.profilePicture,
      wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0,
      roster: newTeam.roster, // Send roster with creator
      tactical_formation: [],
      created_by: newTeam.createdBy,
      is_deleted: false
    };

    // 1. Insert Team
    const { error: teamError } = await supabase.from('teams').insert(dbTeam);
    if (teamError) {
      console.error("Error creating team:", teamError);
      alert(`Erro ao criar time: ${teamError.message || teamError.details || JSON.stringify(teamError)}`);
      return;
    }

    // 2. Update User (Creator) to belong to this team AND set Role to DIRECTOR
    const { error: userError } = await supabase.from('users').update({ team_id: newTeam.id, role: UserRole.DIRECTOR }).eq('id', currentUser.id);
    if (userError) {
      console.error("Error updating user team:", userError);
    }

    // Update Local State
    setTeams([...teams, newTeam]);

    // Update Current User Context
    const updatedUser = { ...currentUser, teamId: newTeam.id, role: UserRole.DIRECTOR };
    setCurrentUser(updatedUser);
    setUserAccounts(prev => prev.map(u => u.id === currentUser.id ? { ...u, teamId: newTeam.id, role: UserRole.DIRECTOR } : u));

    setIsTeamModalOpen(false);
    alert("Time criado com sucesso! Você foi adicionado como jogador e diretor.");
  };

  const handlePostGeneratedNews = async (content: string, context: { matchId?: string, tournamentId?: string }) => {
    // Parse AI Content
    const lines = content.split('\n');
    const aiTitle = lines[0].replace(/[*#]/g, '').trim();
    const aiBody = lines.slice(1).join('\n').replace(/\*\*/g, '').replace(/^#+\s/gm, '').trim();

    let newItem: NewsItem;

    // CASE 1: MATCH NEWS
    if (context.matchId) {
      const match = matches.find(m => m.id === context.matchId);
      if (!match) return;

      const hTeam = getTeam(match.homeTeamId);
      const aTeam = getTeam(match.awayTeamId);

      // Determine Stream Link
      let streamLink: string | undefined = undefined;
      if (match.youtubeVideoId) {
        streamLink = `https://youtube.com/watch?v=${match.youtubeVideoId}`;
      } else if (match.streams && match.streams.length > 0) {
        const stream = match.streams[0];
        if (stream.provider === 'YOUTUBE') {
          streamLink = `https://youtube.com/watch?v=${stream.identifier}`;
        } else if (stream.provider === 'TWITCH') {
          streamLink = `https://twitch.tv/${stream.identifier}`;
        } else {
          streamLink = stream.identifier;
          if (!streamLink.startsWith('http')) {
            streamLink = `https://${streamLink}`;
          }
        }
      }

      newItem = {
        id: `news-${Date.now()}`,
        title: aiTitle.length > 5 ? aiTitle : `${hTeam.shortName} x ${aTeam.shortName}: Resenha do Jogo`,
        excerpt: aiBody.substring(0, 120) + (aiBody.length > 120 ? "..." : ""),
        content: aiBody || content,
        date: new Date().toISOString(),
        category: 'Resenha IA (Jogo)',
        author: 'IA LocalLegends',
        teamId: match.homeTeamId,
        tournamentId: match.tournamentId,
        media: match.media,
        externalLink: streamLink
      };

      // CASE 2: TOURNAMENT NEWS
    } else if (context.tournamentId) {
      const tournament = activeTournaments.find(t => t.id === context.tournamentId);
      if (!tournament) return;

      newItem = {
        id: `news-${Date.now()}`,
        title: aiTitle.length > 5 ? aiTitle : `Resenha da Rodada: ${tournament.name}`,
        excerpt: aiBody.substring(0, 120) + (aiBody.length > 120 ? "..." : ""),
        content: aiBody || content,
        date: new Date().toISOString(),
        category: 'Resenha IA (Camp)',
        author: 'IA LocalLegends',
        tournamentId: tournament.id
      };
    } else {
      return;
    }

    setNews(prev => [newItem, ...prev]);
    alert("Resenha postada na aba de Notícias!");
  };

  // --- STATS ENGINE ---
  const recalculateTeamStats = async (teamId: string, allMatches: Match[], currentTeams: Team[]) => {
    const team = currentTeams.find(t => t.id === teamId);
    if (!team) return;

    // Filter relevant matches: Active, Finished, involving this team
    const teamMatches = allMatches.filter(m =>
      (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
      m.status === MatchStatus.FINISHED &&
      !m.isDeleted
    );

    // Reset Team Stats
    const newTeamStats = {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };

    // Helper map for player stats
    const playerStatsMap: Record<string, PlayerStats> = {};
    // Initialize for current roster
    team.roster.forEach(p => {
      playerStatsMap[p.id] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 };
    });

    // Process Matches
    teamMatches.forEach(match => {
      const isHome = match.homeTeamId === teamId;
      const myScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      const opponentTeamId = isHome ? match.awayTeamId : match.homeTeamId;

      // 1. Team Stats
      newTeamStats.goalsFor += myScore;
      newTeamStats.goalsAgainst += oppScore;

      if (myScore > oppScore) {
        newTeamStats.wins++;
        newTeamStats.points += 3;
      } else if (myScore < oppScore) {
        newTeamStats.losses++;
      } else {
        newTeamStats.draws++;
        newTeamStats.points += 1;
      }

      // Check which players "played for opponent" in this match
      // A player is considered playing for opponent if they have an event logged for the opponent team
      const playersPlayingForOpponent = new Set<string>();
      match.events.forEach(ev => {
        if (ev.teamId === opponentTeamId && ev.playerId) {
          playersPlayingForOpponent.add(ev.playerId);
        }
      });

      // 2. Player Stats - Matches Played
      // Increment for everyone in current roster, UNLESS they played for the opponent in this specific match
      team.roster.forEach(p => {
        if (playerStatsMap[p.id]) {
          // Strict Check: If player is active for opponent, do not count match played for this team
          if (!playersPlayingForOpponent.has(p.id)) {
            playerStatsMap[p.id].matchesPlayed++;
          }
        }
      });

      // 3. Player Stats - Events
      match.events.forEach(ev => {
        // Strict Check: Event must belong to THIS team
        // We use ev.teamId. If missing (legacy), fallback to existing behavior but warn.
        // Assuming modern events have teamId (handleAddEvent ensures it).

        const belongsToThisTeam = ev.teamId === teamId;

        if (belongsToThisTeam && ev.playerId && playerStatsMap[ev.playerId]) {
          const pStats = playerStatsMap[ev.playerId];

          if (ev.type === MatchEventType.GOAL) pStats.goals++;
          if (ev.type === MatchEventType.YELLOW_CARD) pStats.yellowCards++;
          if (ev.type === MatchEventType.RED_CARD) pStats.redCards++;
        }
      });
    });

    // DB Updates
    const dbUpdates = {
      wins: newTeamStats.wins,
      draws: newTeamStats.draws,
      losses: newTeamStats.losses,
      goals_for: newTeamStats.goalsFor,
      goals_against: newTeamStats.goalsAgainst,
      points: newTeamStats.points
    };

    // Update Team Entity
    await supabase.from('teams').update(dbUpdates).eq('id', teamId);

    // Update Roster
    const newRoster = team.roster.map(p => ({
      ...p,
      stats: playerStatsMap[p.id] || p.stats
    }));

    await supabase.from('teams').update({ roster: newRoster }).eq('id', teamId);

    // Update Local State
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          ...newTeamStats,
          roster: newRoster
        };
      }
      return t;
    }));
  };

  const handleFinishMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    if (match.status === MatchStatus.FINISHED) return;

    // 1. Mark as Finished in DB and State first
    await supabase.from('matches').update({ status: MatchStatus.FINISHED }).eq('id', match.id);

    // Optimistic Update State for Match
    const updatedMatch = { ...match, status: MatchStatus.FINISHED };
    const updatedMatchesList = matches.map(m => m.id === matchId ? updatedMatch : m);
    setMatches(updatedMatchesList);
    setSelectedMatchId(null);

    // 2. Recalculate Stats for BOTH Teams
    // Pass the updated list so the calculation includes this match
    await recalculateTeamStats(match.homeTeamId, updatedMatchesList, teams);
    await recalculateTeamStats(match.awayTeamId, updatedMatchesList, teams);

    alert("Partida encerrada! Estatísticas recalculadas com sucesso.");
  };

  const handleStartBroadcast = (matchId: string) => {
    // console.log("Starting broadcast for match:", matchId);
    // setBroadcastingMatchId(matchId);
    alert("Transmissão nativa desativada temporariamente. Você pode adicionar links externos (YouTube/Twitch) na aba 'Transmissão' do jogo.");
  };

  const handleUpdateStreams = async (matchId: string, streams: any[]) => {
    // Optimistic Update
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, streams } : m));

    // Supabase Update
    // Assuming 'streams' column exists or we need to use 'detailed_stats' or similar if schema is strict.
    // For now try updating 'streams' column. If fails, we might need to migrate.
    // Given valid columns are usually snake_case in this DB: 'streams'
    const { error } = await supabase.from('matches').update({ streams: streams }).eq('id', matchId);

    if (error) {
      console.error("Error updating streams:", error);
      // alert("Erro ao salvar streams."); // Optional feedback
    }
  };

  const handleUpdateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || !editingTeam) return;

    const formData = new FormData(event.currentTarget);
    const teamName = formData.get('teamName') as string;
    const shortName = formData.get('shortName') as string;
    const city = formData.get('city') as string;
    const sportType = formData.get('sportType') as SportType;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const tertiaryColor = formData.get('tertiaryColor') as string || '';

    // Handle Image Uploads
    const coverFile = formData.get('cover') as File;
    const profileFile = formData.get('profilePicture') as File;

    let coverUrl = editingTeam.cover; // Default to existing
    // Check if file is actually uploaded (size > 0)
    if (coverFile && coverFile.size > 0) {
      const uploaded = await uploadImage(coverFile);
      if (uploaded) coverUrl = uploaded;
    }

    let profileUrl = editingTeam.profilePicture; // Default to existing
    if (profileFile && profileFile.size > 0) {
      const uploaded = await uploadImage(profileFile);
      if (uploaded) profileUrl = uploaded;
    }

    console.log("Saving Team Update:", {
      id: editingTeam.id,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      coverUrl, // Debug
      profileUrl // Debug
    });

    const updatedTeam: Team = {
      ...editingTeam,
      name: teamName,
      shortName,
      city,
      sportType,
      logoColor: primaryColor,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      cover: coverUrl,
      profilePicture: profileUrl
    };

    // Update Local State
    // Update Local State with new colors and images
    setTeams(prev => prev.map(t => t.id === editingTeam.id ? updatedTeam : t));

    // Update Supabase
    // Note: We are mapping primaryColor to logo_color for DB compatibility
    // Now saving styling columns to DB (requires migration_v4)
    const { error } = await supabase.from('teams').update({
      name: teamName,
      short_name: shortName,
      city,
      logo_color: primaryColor, // Map Primary to Logo Color (Legacy support)
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      tertiary_color: tertiaryColor,
      cover: coverUrl,
      profile_picture: profileUrl
    }).eq('id', editingTeam.id);

    if (error) {
      console.error("Error updating team:", error);
      alert("Erro ao atualizar time no banco de dados. " + error.message);
    } else {
      alert("Time atualizado com sucesso!");
    }

    setIsTeamModalOpen(false);
    setEditingTeam(null);
  };


  // ARENA CRUD
  const handleCreateArena = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Images
    const profileFile = formData.get('profilePicture') as File;
    const coverFile = formData.get('coverPicture') as File;
    const city = formData.get('city') as string; // Read City

    let profileUrl = '';
    if (profileFile && profileFile.size > 0) {
      const url = await uploadImage(profileFile);
      if (url) profileUrl = url;
    }

    let coverUrl = '';
    if (coverFile && coverFile.size > 0) {
      const url = await uploadImage(coverFile);
      if (url) coverUrl = url;
    }

    const newArena: Arena = {
      id: generateUUID(),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      lat: 0,
      lng: 0,
      googleMapsUrl: formData.get('googleMapsUrl') as string,
      profilePicture: profileUrl,
      coverPicture: coverUrl,
      city: city // Add to object
    };

    // Note: DB doesn't have cover_picture yet, so we omit it to prevent crash.
    // Also DB might not have google_maps_url or city or profile_picture depending on migration status.
    // Proceeding with safe subset or what we believe exists.
    const dbArena = {
      id: newArena.id,
      name: newArena.name,
      address: newArena.address,
      // city: newArena.city, // Commenting out potentially missing columns to be safe based on "cover_picture" error
      lat: newArena.lat,
      lng: newArena.lng,
      // google_maps_url: newArena.googleMapsUrl,
      // profile_picture: newArena.profilePicture,
      // cover_picture: newArena.coverPicture
    };

    const { error } = await supabase.from('arenas').insert(dbArena);

    if (error) {
      console.error("Error creating arena:", error);
      alert(`Erro ao criar arena: ${error.message}`);
      // Do not update local state if DB fails, to keep it consistent OR update and warn.
      // Better to fail fast.
      return;
    }

    setArenas([...arenas, newArena]);
    setIsArenaModalOpen(false);
    alert("Arena criada com sucesso!");
  };

  // TOURNAMENT CRUD
  const handleSaveTournament = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(event.currentTarget);
    const maxTeams = parseInt(formData.get('maxTeams') as string) || 4;
    const format = formData.get('format') as 'LEAGUE' | 'KNOCKOUT';
    const scope = formData.get('scope') as 'MUNICIPAL' | 'ESTADUAL' | 'NACIONAL' | 'PARTICULAR' || 'PARTICULAR';
    const city = formData.get('city') as string || '';

    // Auto-calculate rounds
    let calculatedRounds = 1;
    if (format === 'LEAGUE') {
      calculatedRounds = Math.max(1, maxTeams - 1); // Round Robin (Single)
    } else {
      calculatedRounds = Math.ceil(Math.log2(maxTeams)); // Knockout (Powers of 2)
    }

    const newTournament: Tournament = {
      id: `tour-${Date.now()}`,
      createdBy: currentUser.id,
      isDeleted: false,
      name: formData.get('name') as string,
      format: format,
      sportType: formData.get('sportType') as SportType,
      scope: scope,
      city: city,
      status: 'ACTIVE',
      currentRound: 1,
      totalRounds: calculatedRounds,
      maxTeams: maxTeams,
      participatingTeamIds: [] // Populate later
    };

    const dbTournament = {
      id: newTournament.id,
      name: newTournament.name,
      format: newTournament.format,
      sport_type: newTournament.sportType,
      status: newTournament.status,
      current_round: newTournament.currentRound,
      total_rounds: newTournament.totalRounds,
      participating_team_ids: newTournament.participatingTeamIds,
      created_by: newTournament.createdBy,
      is_deleted: newTournament.isDeleted,
      scope: newTournament.scope,
      city: newTournament.city
    };

    supabase.from('tournaments').insert(dbTournament).then(({ error }) => {
      if (error) console.error("Error creating tournament:", error);
    });

    setTournaments([...tournaments, newTournament]);
    setIsTournamentModalOpen(false);
  };

  const handleUpdateTournament = (updatedTournament: Tournament) => {
    const dbTournament = {
      name: updatedTournament.name,
      format: updatedTournament.format,
      sport_type: updatedTournament.sportType,
      status: updatedTournament.status,
      current_round: updatedTournament.currentRound,
      total_rounds: updatedTournament.totalRounds,
      participating_team_ids: updatedTournament.participatingTeamIds,
      // created_by: updatedTournament.createdBy, // usually immutable
      is_deleted: updatedTournament.isDeleted
    };

    supabase.from('tournaments').update(dbTournament).eq('id', updatedTournament.id).then(({ error }) => {
      if (error) console.error("Error updating tournament:", error);
    });

    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
    alert("Campeonato atualizado!");
  };

  // --- Social Logic ---
  const handleFollow = (targetId: string) => {
    if (!currentUser) return;
    const existing = socialGraph.find(s => s.followerId === currentUser.id && s.targetId === targetId);

    if (existing) {
      // Unfollow
      setSocialGraph(prev => prev.filter(s => s.id !== existing.id));
    } else {
      // Follow
      setSocialGraph(prev => [...prev, {
        id: `sc-${Date.now()}`,
        followerId: currentUser.id,
        targetId,
        targetType: 'TEAM' // Simplified for this demo
      }]);
    }
  };

  const handleSendInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || !selectedTeamIdForInvite) return;

    const formData = new FormData(event.currentTarget);
    const inviteEmail = formData.get('email') as string;

    // Mock check if user exists
    const targetUser = userAccounts.find(u => u.email === inviteEmail);
    const inviteTeam = getTeam(selectedTeamIdForInvite);

    if (targetUser) {
      const newNotif = {
        id: `not-${Date.now()}`,
        type: 'TEAM_INVITE',
        from_id: currentUser.id,
        from_name: currentUser.name,
        to_user_id: targetUser.id,
        data: { teamId: selectedTeamIdForInvite, teamName: inviteTeam.name },
        is_read: false
      };

      const { error } = await supabase.from('notifications').insert(newNotif);

      if (error) {
        console.error("Error sending invite:", error);
        alert("Erro ao enviar convite.");
      } else {
        const localNotif: Notification = {
          id: newNotif.id,
          type: 'TEAM_INVITE',
          fromId: currentUser.id,
          fromName: currentUser.name,
          toUserId: targetUser.id,
          data: newNotif.data,
          isRead: false,
          timestamp: new Date().toISOString()
        };
        // Close modal first for better UX
        setIsInviteModalOpen(false);
        setSelectedTeamIdForInvite(null);
        setInviteModalEmail(null);

        alert(`Convite enviado para ${targetUser.name}!`);
      }
    } else {
      alert("Usuário não encontrado (Simulação: Convite enviado por email).");
    }
  };






  const handleSendTournamentInvite = (tournamentId: string, teamId: string) => {
    if (!currentUser) return;

    const tournament = activeTournaments.find(t => t.id === tournamentId);
    const team = getTeam(teamId);

    // Find Team Owner (Director)
    const teamOwner = userAccounts.find(u => u.id === team.createdBy);

    if (teamOwner) {
      const newNotif: Notification = {
        id: `not-tour-${Date.now()}`,
        type: 'TOURNAMENT_INVITE',
        fromId: currentUser.id,
        fromName: currentUser.name,
        toUserId: teamOwner.id,
        data: {
          tournamentId: tournament?.id,
          tournamentName: tournament?.name,
          teamId: team.id,
          teamName: team.name
        },
        isRead: false,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [...prev, newNotif]);
      alert(`Convite enviado para o diretor do ${team.name}!`);
    } else {
      alert("Não foi possível encontrar o diretor deste time para enviar o convite.");
    }
  };

  const handleAcceptInvite = (notificationId: string) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif || !currentUser) return;

    if (notif.type === 'TEAM_INVITE') {
      // Simulate joining team
      setCurrentUser(prev => prev ? ({ ...prev, teamId: notif.data?.teamId || null }) : null);
      alert(`Você aceitou o convite para entrar no ${notif.data?.teamName}!`);
    } else if (notif.type === 'TOURNAMENT_INVITE') {
      // Add team to tournament
      if (notif.data?.tournamentId && notif.data?.teamId) {
        setTournaments(prev => prev.map(t => {
          if (t.id === notif.data?.tournamentId) {
            return { ...t, participatingTeamIds: [...t.participatingTeamIds, notif.data?.teamId as string] };
          }
          return t;
        }));
        alert(`O time ${notif.data.teamName} foi inscrito no ${notif.data.tournamentName}!`);
      }
    }

    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const handleDeclineInvite = (notificationId: string) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif) return;

    // Just mark as read (effectively declining by ignoring)
    // Optionally we could send a notification back to the sender
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    alert("Convite recusado.");
  };

  // --- Views Renders ---
  if (isLoadingData) return <PageTransition />;

  if (!currentUser) {
    if (isLoading) return <PageTransition />;
    return <LoginScreen users={userAccounts} teams={activeTeams} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Show transition if Loading
  if (isLoading) return <PageTransition />;

  // PROFILE VIEW (Replaces other views if set)
  // PROFILE VIEW (Replaces other views if set) - REMOVED to allow Modal behavior
  // if (viewingProfileId) { ... }



  const renderHomeView = () => {
    // 1. North Star Logic: Fan Feed
    let fanMatches = upcomingMatches;
    let fanNews = news;

    // Filter news/matches based on followed teams + user's team
    const followedTeamIds = socialGraph.filter(s => s.followerId === currentUser.id).map(s => s.targetId);
    if (currentUser.teamId) followedTeamIds.push(currentUser.teamId);

    if (currentUser.role === UserRole.FAN) {
      // 1. Filter Matches (Keep strict to following)
      if (followedTeamIds.length > 0) {
        fanMatches = upcomingMatches.filter(m => followedTeamIds.includes(m.homeTeamId) || followedTeamIds.includes(m.awayTeamId));
      }

      // 2. Filter News (Broaden for Local Championships)
      fanNews = news.filter(n => {
        // A. Team News (Match Reviews) -> Must follow team
        if (n.teamId) {
          return followedTeamIds.includes(n.teamId);
        }

        // B. Tournament News (Round Reviews) -> Local relevance OR Participation
        if (n.tournamentId) {
          const tournament = activeTournaments.find(t => t.id === n.tournamentId);
          // If tournament not found, hide
          if (!tournament) return false;

          // Is user following a participant?
          const isFollowingParticipant = tournament.participatingTeamIds.some(tid => followedTeamIds.includes(tid));
          if (isFollowingParticipant) return true;

          // Is it a Local/State Championship in user's city?
          // Defaulting user location to 'Taquara' if undefined for demo, or checking match
          const userCity = currentUser.location || 'Taquara';
          const isLocal = (tournament.scope === 'MUNICIPAL' || tournament.scope === 'ESTADUAL') && tournament.city === userCity;

          return isLocal;
        }

        return false;
      });
    }

    // FILTER FEATURED MATCH BY STATUS (NEW)
    const featuredMatchToDisplay = (fanMatches.length > 0 ? fanMatches : upcomingMatches).filter(m => {
      if (homeFeaturedStatus === 'ALL') return true;
      return m.status === homeFeaturedStatus;
    })[0];

    // 2. North Star Logic: Referee Insights
    const refereeAssignedMatches = currentUser.role === UserRole.REFEREE ? upcomingMatches.slice(0, 3) : []; // Simulate assignments

    const getTeamForm = (teamId: string) => {
      return matches
        .filter(m => m.status === MatchStatus.FINISHED && (m.homeTeamId === teamId || m.awayTeamId === teamId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .map(m => {
          const isHome = m.homeTeamId === teamId;
          const teamScore = isHome ? m.homeScore : m.awayScore;
          const oppScore = isHome ? m.awayScore : m.homeScore;
          if (teamScore > oppScore) return { res: 'W', color: 'bg-emerald-500' };
          if (teamScore < oppScore) return { res: 'L', color: 'bg-red-500' };
          return { res: 'D', color: 'bg-slate-500' };
        });
    };

    // 3. Dropdown for Championships (Context Aware)
    let visibleTournaments = activeTournaments;
    if (currentUser.teamId) {
      visibleTournaments = activeTournaments.filter(t => t.participatingTeamIds?.includes(currentUser.teamId!));
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-dark rounded-3xl p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r from-emerald-600/90 to-teal-800/90 interactive-card">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                Olá, {currentUser.name}
              </h2>
              <p className="opacity-90 mb-6 text-emerald-100 font-medium">{ROLE_DESCRIPTIONS[currentUser.role]}</p>

              {/* DASHBOARD TEAM SELECTOR */}
              {(() => {
                const allUserTeams = activeTeams.filter(t =>
                  t.id === currentUser.teamId ||
                  t.roster.some(p => p.userId === currentUser.id)
                );

                // If there are teams, show the Dashboard Card
                if (allUserTeams.length > 0) {
                  const activeDashboardTeamId = dashboardTeamId || allUserTeams[0].id; // Fallback
                  const activeDashboardTeam = allUserTeams.find(t => t.id === activeDashboardTeamId) || allUserTeams[0];

                  return (
                    <div className="mb-6 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors cursor-pointer interactive-card relative group">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Seu Time</span>
                        {allUserTeams.length > 1 && (
                          <div className="relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={activeDashboardTeam.id}
                              onChange={(e) => setDashboardTeamId(e.target.value)}
                              className="appearance-none bg-black/20 text-white border border-white/20 text-xs font-bold px-3 py-1 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer hover:bg-black/30 transition"
                            >
                              {allUserTeams.map(t => <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1.5 text-white/70 pointer-events-none" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2" onClick={() => handleTeamClick(activeDashboardTeam.id)}>
                        <div className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-xs font-bold text-white border-2 border-white/30 overflow-hidden" style={{ backgroundColor: activeDashboardTeam.logoColor || '#10b981' }}>
                          {activeDashboardTeam.profilePicture ? (
                            <img src={activeDashboardTeam.profilePicture} alt={activeDashboardTeam.shortName.toUpperCase()} className="w-full h-full object-cover" />
                          ) : activeDashboardTeam.shortName.toUpperCase()}
                        </div>
                        <span className="font-bold text-xl truncate">{activeDashboardTeam.name}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-4">
                <button onClick={() => changeView('MATCHES')} className="btn-feedback bg-white text-emerald-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-black/10 text-sm">
                  Ver Jogos
                </button>
                {canManage && (
                  <button onClick={() => setIsMatchModalOpen(true)} className="btn-feedback bg-emerald-700/50 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600/50 transition text-sm flex items-center gap-2 border border-emerald-400/30 backdrop-blur-md">
                    <Plus size={18} /> Criar Jogo
                  </button>
                )}
              </div>
            </div>
            {/* Background decoration */}
            <TrophyIcon className="absolute -bottom-8 -right-8 text-white opacity-10 rotate-12" size={240} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-[100px] opacity-30"></div>
          </div>

          {/* REFEREE INSIGHTS */}
          {currentUser.role === UserRole.REFEREE && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Shield className="text-purple-600 icon-hover" size={20} />
                Jogos Atribuídos & Insights
              </h3>
              {refereeAssignedMatches.length > 0 ? refereeAssignedMatches.map(match => (
                <div key={match.id} className="glass-panel p-5 rounded-2xl border-l-4 border-l-purple-500 relative overflow-hidden interactive-card">
                  <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl">Atribuído</div>
                  <div className="flex justify-between items-center mb-4 mt-2">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden" style={{ backgroundColor: getTeam(match.homeTeamId).logoColor }}>
                        {getTeam(match.homeTeamId).profilePicture ? (
                          <img src={getTeam(match.homeTeamId).profilePicture} alt={getTeam(match.homeTeamId).shortName.toUpperCase()} className="w-full h-full object-cover" />
                        ) : getTeam(match.homeTeamId).shortName.toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-center">{getTeam(match.homeTeamId).name}</span>
                      <div className="flex gap-1">
                        {getTeamForm(match.homeTeamId).map((f, i) => <div key={i} className={`w-2 h-2 rounded-full ${f.color}`}></div>)}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">VS</span>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden" style={{ backgroundColor: getTeam(match.awayTeamId).logoColor }}>
                        {getTeam(match.awayTeamId).profilePicture ? (
                          <img src={getTeam(match.awayTeamId).profilePicture} alt={getTeam(match.awayTeamId).shortName.toUpperCase()} className="w-full h-full object-cover" />
                        ) : getTeam(match.awayTeamId).shortName.toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-center">{getTeam(match.awayTeamId).name}</span>
                      <div className="flex gap-1">
                        {getTeamForm(match.awayTeamId).map((f, i) => <div key={i} className={`w-2 h-2 rounded-full ${f.color}`}></div>)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMatchId(match.id)} className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-700 transition btn-feedback">
                    Abrir Súmula Digital
                  </button>
                </div>
              )) : (
                <div className="p-6 glass-panel rounded-2xl text-slate-400 text-sm text-center">Nenhum jogo atribuído para hoje.</div>
              )}
            </div>
          )}

          {/* FEATURED MATCHES (Fan/Normal) */}
          {currentUser.role !== UserRole.REFEREE && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <Calendar className="text-emerald-500 icon-hover" size={24} />
                  {currentUser.role === UserRole.FAN && currentUser.teamId ? 'Próximo Jogo' : 'Destaque'}
                </h3>
                <select
                  value={homeFeaturedStatus}
                  onChange={(e) => setHomeFeaturedStatus(e.target.value as MatchStatus | 'ALL')}
                  className="text-xs border-none bg-white/50 backdrop-blur rounded-lg p-2 font-bold text-slate-600 shadow-sm focus:ring-0 cursor-pointer input-focus-effect"
                >
                  <option value="ALL">Todos</option>
                  <option value={MatchStatus.LIVE}>Ao Vivo</option>
                  <option value={MatchStatus.SCHEDULED}>Agendado</option>
                  <option value={MatchStatus.WAITING_ACCEPTANCE}>Pendente</option>
                </select>
              </div>

              {featuredMatchToDisplay ? (
                <div onClick={() => setSelectedMatchId(featuredMatchToDisplay.id)} className="cursor-pointer transition">
                  <MatchCard
                    match={featuredMatchToDisplay} homeTeam={getTeam(featuredMatchToDisplay.homeTeamId)} awayTeam={getTeam(featuredMatchToDisplay.awayTeamId)} arena={getArena(featuredMatchToDisplay.arenaId)}
                    userRole={currentUser.role} onUpdateScore={handleUpdateScore} onEditDetails={(m) => { setEditingMatch(m); setIsMatchModalOpen(true); }}
                    onTeamClick={handleTeamClick}
                  />
                </div>
              ) : (
                <div className="p-8 glass-panel rounded-2xl text-center text-slate-400 flex flex-col items-center">
                  <Calendar size={32} className="mb-2 opacity-50" />
                  Nenhum jogo encontrado com este status.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Context Aware Championship Dropdown */}
          <div className="glass-panel p-6 rounded-3xl interactive-card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <TrophyIcon size={20} className="text-amber-500 icon-hover" />
              Campeonatos
            </h3>
            {visibleTournaments.length > 0 ? (
              <>
                <div className="relative mb-4">
                  <select
                    className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-medium shadow-inner focus:ring-2 focus:ring-emerald-500 cursor-pointer input-focus-effect"
                    onChange={(e) => setHomeFeedTournamentId(e.target.value)}
                    value={homeFeedTournamentId || ''}
                  >
                    <option value="" className="text-slate-800">Selecione um campeonato...</option>
                    {visibleTournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>

                {/* STRICT LOGIC: ONLY SHOW TABLE IF ID IS SELECTED */}
                {homeFeedTournamentId ? (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="rounded-xl overflow-hidden shadow-sm">
                      <StandingsTable
                        teams={activeTeams.filter(t => activeTournaments.find(tour => tour.id === homeFeedTournamentId)?.participatingTeamIds.includes(t.id))}
                        matches={activeMatches.filter(m => m.tournamentId === homeFeedTournamentId)}
                        onTeamClick={handleTeamClick}
                      />
                    </div>
                    <button
                      onClick={() => { setSelectedTournamentId(homeFeedTournamentId); setCurrentView('TOURNAMENTS'); }}
                      className="w-full mt-3 py-2 text-xs text-center text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold transition btn-feedback"
                    >
                      Ver Campeonato Completo
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50/50 text-center text-slate-500 font-medium text-sm rounded-xl border border-dashed border-slate-200">
                    Selecione um campeonato acima para ver a tabela.
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-500 font-medium">Nenhum campeonato ativo.</div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl interactive-card">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <Newspaper size={20} className="text-blue-500 icon-hover" />
              Notícias
            </h3>
            <div className="space-y-4">
              {fanNews.length > 0 ? fanNews.slice(0, 3).map(news => (
                <div key={news.id} className="group cursor-pointer" onClick={() => setSelectedNewsItem(news)}>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-full">{news.category}</span>
                  <h4 className="font-bold text-sm text-white mt-1 group-hover:text-emerald-400 transition">{news.title}</h4>
                  <div className="h-px bg-slate-100 w-full mt-3 group-last:hidden"></div>
                </div>
              )) : (
                <div className="text-sm text-slate-500 font-medium">Nenhuma notícia recente.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamSection = (title: string, teams: Team[], icon: React.ElementType, emptyMsg: string) => (
    <div className="space-y-4">
      <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2 pb-2">
        <div className="bg-white p-2 rounded-lg shadow-sm">{React.createElement(icon, { size: 20, className: "text-emerald-600 icon-hover" })}</div>
        {title}
      </h3>
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => {
            const isFollowing = socialGraph.some(s => s.followerId === currentUser!.id && s.targetId === team.id);
            const isCreator = team.createdBy === currentUser!.id;
            const isMyCoachTeam = currentUser!.role === UserRole.COACH && currentUser!.teamId === team.id;
            const canInvite = isCreator || isMyCoachTeam;

            return (
              <div key={team.id} onClick={() => { changeView('TEAMS'); setViewingTeamId(team.id); }} className="glass-panel rounded-2xl overflow-hidden interactive-card cursor-pointer group">
                <div className="h-28 bg-slate-100 relative flex items-end p-4 overflow-hidden">
                  {team.cover ? (
                    <img src={team.cover} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700" />
                  ) : (
                    <div className="absolute top-0 bottom-0 left-0 right-0 opacity-20 bg-current" style={{ color: team.logoColor }}></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg border-4 border-white/20 backdrop-blur-md z-10 relative icon-hover" style={{ backgroundColor: team.logoColor }}>
                    {team.shortName}
                  </div>
                  {isCreator && <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 shadow-lg">ADMIN</div>}
                </div>
                <div className="p-5 pt-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">{team.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-1"><MapPin size={12} /> {team.city}</p>
                    </div>
                    {(currentUser!.role === UserRole.FAN || currentUser!.role === UserRole.REFEREE || currentUser!.role === UserRole.PLAYER) && !isCreator && (
                      <button onClick={(e) => { e.stopPropagation(); handleFollow(team.id); }} className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full btn-feedback">
                        <Heart size={20} className={isFollowing ? 'fill-red-500 text-red-500' : ''} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-lg font-black text-slate-800">{team.points}</div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Pts</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-lg font-black text-emerald-600">{team.wins}</div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Vit</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-lg font-black text-blue-600">{team.goalsFor}</div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold">GP</div>
                    </div>
                  </div>

                  {/* Management Actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                    {canInvite && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedTeamIdForInvite(team.id); setIsInviteModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition btn-feedback">
                        <UserPlus size={14} /> Convidar
                      </button>
                    )}
                    {isCreator && (
                      <button onClick={(e) => { e.stopPropagation(); openDeleteModal(team.id, 'TEAM'); }} className="text-slate-400 hover:text-red-600 transition p-1.5 hover:bg-red-50 rounded-lg btn-feedback" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-sm text-slate-400 glass-panel rounded-2xl italic text-center border-dashed border-2 border-slate-200">{emptyMsg}</div>
      )}
    </div>
  );

  const renderTeamsView = () => {
    // Case 0: Viewing a Specific Team (Detail Page) - Accessible by click
    if (viewingTeamId) {
      const myTeam = getTeam(viewingTeamId);
      const isMyManagedTeam = currentUser!.role === UserRole.COACH && currentUser!.teamId === viewingTeamId;
      const isDirectorOwner = currentUser!.role === UserRole.DIRECTOR && (myTeam.createdBy === currentUser!.id || currentUser!.teamId === myTeam.id);
      const isEditable = isMyManagedTeam || isDirectorOwner;

      // Calculate Leaderboards for this team
      const teamScorers = [...myTeam.roster].filter(p => p.stats.goals > 0).sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 3);
      const teamAssisters = [...myTeam.roster].filter(p => p.stats.assists > 0).sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 3);
      const teamYellowCards = [...myTeam.roster].filter(p => p.stats.yellowCards > 0).sort((a, b) => b.stats.yellowCards - a.stats.yellowCards).slice(0, 3);
      const teamRedCards = [...myTeam.roster].filter(p => p.stats.redCards > 0).sort((a, b) => b.stats.redCards - a.stats.redCards).slice(0, 3);

      // Filter Staff
      let staffMembers = userAccounts.filter(u => u.teamId === myTeam.id && (u.role === UserRole.DIRECTOR || u.role === UserRole.COACH));

      // Ensure current user is in staff list if they are the Director
      if (isDirectorOwner && !staffMembers.some(u => u.id === currentUser!.id)) {
        staffMembers.push({
          id: currentUser!.id,
          name: currentUser!.name,
          email: currentUser!.email || '',
          password: '',
          role: currentUser!.role,
          teamId: currentUser!.teamId,
          avatar: currentUser!.avatar
        } as UserAccount);
      }


      // Filter Matches
      const teamMatches = activeMatches.filter(m => m.homeTeamId === myTeam.id || m.awayTeamId === myTeam.id);
      const displayedMatches = teamMatchFilter === 'UPCOMING'
        ? teamMatches.filter(m => m.status !== MatchStatus.FINISHED).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : teamMatches.filter(m => m.status === MatchStatus.FINISHED).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Counts
      const fanCount = socialGraph.filter(s => s.targetId === myTeam.id).length;

      // Filter News for this team
      const teamNews = news.filter(n => n.teamId === myTeam.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (isViewingFullRoster && myTeam) {
        return (
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <RosterManager
              team={myTeam}
              isEditable={isEditable}
              onSaveRoster={(updated) => handleUpdateRoster(myTeam.id, updated)}
              onBack={() => setIsViewingFullRoster(false)}
              evaluations={evaluations}
              onEvaluatePlayer={(p) => {
                setSelectedPlayerForEvaluation({ player: p, teamId: myTeam.id });
                setIsEvaluationModalOpen(true);
              }}
              onSaveTactics={(pos) => handleSaveTeamTactics(myTeam.id, pos)}
              onApplyFormation={(form) => applyTacticalPreset(myTeam.id, form)}
            />
          </div>
        );
      }

      return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
          <button onClick={() => setViewingTeamId(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 btn-feedback bg-white px-4 py-2 rounded-full shadow-sm">
            <ArrowLeft size={16} /> Voltar
          </button>

          {/* HERO BANNER & HEADER */}
          <div className="glass-panel rounded-3xl overflow-hidden relative interactive-card">
            <div className="h-48 md:h-72 bg-slate-200 relative group">
              {isEditingTeam && previewTeamData && previewTeamData.cover ? (
                <img src={previewTeamData.cover} alt="Cover" className="w-full h-full object-cover transition-all" />
              ) : (myTeam.cover ? (
                <img src={myTeam.cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-slate-800" style={isEditingTeam && previewTeamData ? { background: `linear-gradient(to right, ${previewTeamData.primaryColor || '#10b981'}, ${previewTeamData.secondaryColor || '#0f172a'})` } : { background: (myTeam.primaryColor || myTeam.logoColor) ? `linear-gradient(to right, ${myTeam.primaryColor || myTeam.logoColor}, ${myTeam.secondaryColor || '#0f172a'})` : undefined }}></div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

              {isEditable && (
                <button onClick={() => setIsEditingTeam(true)} className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/40 transition btn-feedback">
                  <Camera size={18} />
                </button>
              )}
            </div>

            <div className="px-6 md:px-10 pb-6 relative z-10">
              {/* MOBILE LAYOUT: Logo Left, Buttons/Info Right, Name Below */}
              {/* DESKTOP LAYOUT: Logo Left, Name Right/Bottom */}
              <div className="flex flex-col md:flex-row md:items-end -mt-16 md:-mt-20 mb-4 gap-4 md:gap-6">

                <div className="flex justify-between items-end w-full md:w-auto">
                  {/* LOGO */}
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-2xl md:text-4xl font-bold text-white relative group bg-white overflow-hidden icon-hover shrink-0" style={{ backgroundColor: (isEditingTeam && previewTeamData) ? (previewTeamData.primaryColor || previewTeamData.logoColor) : myTeam.logoColor }}>
                    {(isEditingTeam && previewTeamData && previewTeamData.profilePicture) ? (
                      <img src={previewTeamData.profilePicture} alt={myTeam.shortName} className="w-full h-full object-cover" />
                    ) : (myTeam.profilePicture ? (
                      <img src={myTeam.profilePicture} alt={myTeam.shortName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{myTeam.shortName}</span>
                    ))}
                  </div>

                  {/* MOBILE BUTTONS (Visible only on mobile next to logo) */}
                  <div className="md:hidden flex gap-2 mb-2">
                    <button onClick={() => handleFollow(myTeam.id)} className="btn-feedback bg-slate-900 text-white p-2 rounded-xl shadow-lg">
                      <Heart size={20} className={socialGraph.some(s => s.followerId === currentUser!.id && s.targetId === myTeam.id) ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                    {canManage && (
                      <button onClick={() => { setSelectedTeamIdForInvite(myTeam.id); setIsInviteModalOpen(true); }} className="btn-feedback bg-emerald-600 text-white p-2 rounded-xl shadow-lg">
                        <UserPlus size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 mb-2 text-slate-900 md:pt-20 w-full">
                  {isEditingTeam && previewTeamData ? (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);

                      // Upload Images if changed
                      const coverFile = formData.get('cover') as File;
                      const profileFile = formData.get('profilePicture') as File;

                      let coverUrl = previewTeamData.cover;
                      if (coverFile && coverFile.size > 0) {
                        const u = await uploadImage(coverFile);
                        if (u) coverUrl = u;
                      }

                      let profileUrl = previewTeamData.profilePicture;
                      if (profileFile && profileFile.size > 0) {
                        const u = await uploadImage(profileFile);
                        if (u) profileUrl = u;
                      }

                      // Update DB
                      const updates = {
                        name: previewTeamData.name,
                        primary_color: previewTeamData.primaryColor,
                        secondary_color: previewTeamData.secondaryColor,
                        tertiary_color: previewTeamData.tertiaryColor,
                        logo_color: previewTeamData.primaryColor, // Keep logo_color in sync with primary_color
                        cover: coverUrl,
                        profile_picture: profileUrl
                      };

                      const { error } = await supabase.from('teams').update(updates).eq('id', myTeam.id);

                      if (error) {
                        console.error('Error updating team:', error);
                        alert('Erro ao salvar as alterações do time.');
                      } else {
                        // Update Global State
                        setTeams(prev => prev.map(t => t.id === myTeam.id ? { ...t, ...previewTeamData, cover: coverUrl, profilePicture: profileUrl, logoColor: previewTeamData.primaryColor } : t));
                        setIsEditingTeam(false);
                      }
                    }} className="flex flex-col gap-3 max-w-full w-full md:max-w-md bg-white p-4 rounded-xl shadow-lg mt-4 md:mt-0 relative z-20">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Nome do Time</label>
                        <input
                          type="text"
                          name="name"
                          value={previewTeamData.name}
                          onChange={(e) => setPreviewTeamData({ ...previewTeamData, name: e.target.value })}
                          className="w-full text-xl font-bold border-b border-slate-300 focus:outline-none bg-transparent text-slate-900 focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Cor Principal</label>
                          <input
                            type="color"
                            name="primaryColor"
                            value={previewTeamData.primaryColor || previewTeamData.logoColor}
                            onChange={(e) => setPreviewTeamData({ ...previewTeamData, primaryColor: e.target.value })}
                            className="h-8 w-full cursor-pointer rounded border border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Cor Secundária</label>
                          <input
                            type="color"
                            name="secondaryColor"
                            value={previewTeamData.secondaryColor || '#ffffff'}
                            onChange={(e) => setPreviewTeamData({ ...previewTeamData, secondaryColor: e.target.value })}
                            className="h-8 w-full cursor-pointer rounded border border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="useTertiary"
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                          checked={!!previewTeamData.tertiaryColor}
                          onChange={(e) => setPreviewTeamData({ ...previewTeamData, tertiaryColor: e.target.checked ? '#000000' : undefined })}
                        />
                        <label htmlFor="useTertiary" className="text-xs font-bold text-slate-500">Usar Terceira Cor</label>
                      </div>
                      {previewTeamData.tertiaryColor && (
                        <div id="tertiaryColorInput">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Cor Terciária</label>
                          <input
                            type="color"
                            name="tertiaryColor"
                            value={previewTeamData.tertiaryColor}
                            onChange={(e) => setPreviewTeamData({ ...previewTeamData, tertiaryColor: e.target.value })}
                            className="h-8 w-full cursor-pointer rounded border border-slate-200"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Escudo (Avatar)</label>
                          <input
                            type="file"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setPreviewTeamData({ ...previewTeamData, profilePicture: url });
                              }
                            }}
                            className="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-100 hover:file:bg-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Alterar Capa</label>
                          <input
                            type="file"
                            name="cover"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setPreviewTeamData({ ...previewTeamData, cover: url });
                              }
                            }}
                            className="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-100 hover:file:bg-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-500 transition">Salvar</button>
                          <button type="button" onClick={() => setIsEditingTeam(false)} className="px-3 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition">Cancelar</button>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openDeleteModal(myTeam.id, 'TEAM')}
                            className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Excluir Time
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("Isso irá recalcular todas as estatísticas (pontos, gols, etc.) do time baseando-se no histórico de partidas. Continuar?")) {
                              await recalculateTeamStats(myTeam.id, matches, teams);
                              alert("Estatísticas recalculadas com sucesso!");
                            }
                          }}
                          className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                        >
                          <Activity size={14} /> Recalcular Stats
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white break-words w-full">
                        {myTeam.name}
                      </h1>
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium mt-2 flex-wrap">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs shadow-sm text-slate-600 dark:text-slate-300"><MapPin size={14} /> {myTeam.city}</span>
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs shadow-sm text-slate-600 dark:text-slate-300"><Heart size={14} /> {fanCount} Torcedores</span>
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-xs shadow-sm text-slate-600 dark:text-slate-300"><Users size={14} /> {myTeam.roster.length} Jogadores</span>
                      </div>
                    </>
                  )}
                </div>

                {/* DESKTOP BUTTONS (Hidden on mobile) */}
                <div className="hidden md:flex mb-2 gap-3 self-end md:self-auto">
                  <button onClick={() => handleFollow(myTeam.id)} className="btn-feedback bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg">
                    <Heart size={18} className={socialGraph.some(s => s.followerId === currentUser!.id && s.targetId === myTeam.id) ? 'fill-red-500 text-red-500' : ''} />
                    {socialGraph.some(s => s.followerId === currentUser!.id && s.targetId === myTeam.id) ? 'Seguindo' : 'Seguir'}
                  </button>
                  {canManage && (
                    <button onClick={() => { setSelectedTeamIdForInvite(myTeam.id); setIsInviteModalOpen(true); }} className="btn-feedback bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-500 shadow-lg flex items-center gap-2">
                      <UserPlus size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* STAFF SECTION */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Briefcase size={14} /> Comissão Técnica & Diretoria
                </h4>
                <div className="flex flex-wrap gap-4">
                  {staffMembers.length > 0 ? staffMembers.map(staff => (
                    <div key={staff.id} className="flex items-center gap-3 bg-slate-50 p-2 pr-4 rounded-full border border-slate-100 shadow-sm interactive-card">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        {staff.avatar ? <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" /> : <User size={20} className="m-2.5 text-slate-400" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{staff.name}</div>
                        <div className="text-[10px] uppercase font-bold text-emerald-600">{staff.role === UserRole.DIRECTOR ? 'Diretor' : 'Técnico'}</div>
                      </div>
                    </div>
                  )) : (
                    <span className="text-sm text-slate-400 italic">Nenhum membro da comissão cadastrado.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COL: MATCHES */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel rounded-3xl p-6 interactive-card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500 icon-hover" /> Agenda
                  </h3>
                  <div className="relative">
                    <select
                      value={teamMatchFilter}
                      onChange={(e) => setTeamMatchFilter(e.target.value as any)}
                      className="text-xs border-none bg-slate-100 rounded-lg py-1 pl-2 pr-6 font-bold cursor-pointer appearance-none input-focus-effect"
                    >
                      <option value="UPCOMING">Próximos</option>
                      <option value="FINISHED">Anteriores</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {displayedMatches.length > 0 ? displayedMatches.map(m => (
                    <div key={m.id} onClick={() => setSelectedMatchId(m.id)} className="cursor-pointer hover:bg-emerald-50/50 p-3 rounded-xl border border-slate-100 transition group btn-feedback">
                      <div className="text-[10px] text-slate-400 mb-2 flex justify-between font-bold uppercase">
                        <span>{new Date(m.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${m.status === MatchStatus.FINISHED ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                          {m.status === MatchStatus.FINISHED ? 'Encerrado' : 'Agendado'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 w-[40%]">
                          {getTeam(m.homeTeamId).profilePicture ? (
                            <img src={getTeam(m.homeTeamId).profilePicture} alt={getTeam(m.homeTeamId).shortName.toUpperCase()} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 overflow-hidden">
                              {getTeam(m.homeTeamId).shortName.toUpperCase().substring(0, 2)}
                            </div>
                          )}
                          <span className="font-bold text-slate-800 truncate text-sm">{getTeam(m.homeTeamId).shortName.toUpperCase()}</span>
                          {m.status === MatchStatus.FINISHED && <span className="text-lg font-bold ml-auto">{m.homeScore}</span>}
                        </div>
                        <span className="text-slate-300 text-xs font-light">VS</span>
                        <div className="flex items-center gap-2 w-[40%] justify-end">
                          {m.status === MatchStatus.FINISHED && <span className="text-lg font-bold mr-auto">{m.awayScore}</span>}
                          <span className="font-bold text-slate-800 truncate text-sm">{getTeam(m.awayTeamId).shortName.toUpperCase()}</span>
                          {getTeam(m.awayTeamId).profilePicture && (
                            <img src={getTeam(m.awayTeamId).profilePicture} className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400 text-sm">Nenhum jogo encontrado.</div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COL: STATS & TACTICS */}
            <div className="lg:col-span-2 space-y-6">
              {/* TEAM STATS HIGHLIGHTS */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TOP SCORERS */}
                  <div className="glass-panel rounded-3xl p-6 hover:shadow-lg transition border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                      <Target size={18} className="text-red-500" /> Artilharia
                    </h3>
                    <div className="space-y-3">
                      {teamScorers.length > 0 ? teamScorers.map((p, idx) => (
                        <div key={p.id} onClick={() => setSelectedPlayerForProfile({ player: p, teamName: myTeam.name })} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-emerald-600">{p.name}</span>
                          </div>
                          <span className="text-lg font-black text-emerald-600">{p.stats.goals}</span>
                        </div>
                      )) : (
                        <div className="text-slate-400 text-xs italic py-2 text-center">Nenhum gol registrado.</div>
                      )}
                    </div>
                  </div>

                  {/* TOP ASSISTERS */}
                  <div className="glass-panel rounded-3xl p-6 hover:shadow-lg transition border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                      <Award size={18} className="text-blue-500" /> Assistências
                    </h3>
                    <div className="space-y-3">
                      {teamAssisters.length > 0 ? teamAssisters.map((p, idx) => (
                        <div key={p.id} onClick={() => setSelectedPlayerForProfile({ player: p, teamName: myTeam.name })} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer group">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-blue-400 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</span>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600">{p.name}</span>
                          </div>
                          <span className="text-lg font-black text-blue-600">{p.stats.assists}</span>
                        </div>
                      )) : (
                        <div className="text-slate-400 text-xs italic py-2 text-center">Nenhuma assistência.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DISCIPLINE SECTION (Ponto de Atenção) */}
                <div className="glass-panel rounded-3xl p-6 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                      <AlertTriangle size={20} className="text-amber-500" /> Disciplina & Ponto de Atenção
                    </h3>
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase">Fair Play</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Yellow Cards List */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></div> Amarelos
                      </h4>
                      <div className="space-y-2">
                        {teamYellowCards.length > 0 ? teamYellowCards.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">{p.name}</span>
                            <div className="flex items-center gap-1.5 min-w-[30px] justify-end">
                              <span className="font-bold text-slate-900 dark:text-white">{p.stats.yellowCards}</span>
                              <div className="w-1.5 h-2.5 bg-yellow-400 rounded-sm opacity-60"></div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-[10px] text-slate-400 italic">Time disciplinado! Nenhum amarelo.</div>
                        )}
                      </div>
                    </div>

                    {/* Red Cards List */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-2.5 h-3.5 bg-red-500 rounded-sm"></div> Vermelhos
                      </h4>
                      <div className="space-y-2">
                        {teamRedCards.length > 0 ? teamRedCards.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-red-600 dark:text-red-400 font-bold truncate max-w-[120px]">{p.name}</span>
                            <div className="flex items-center gap-1.5 min-w-[30px] justify-end">
                              <span className="font-bold text-red-600">{p.stats.redCards}</span>
                              <div className="w-1.5 h-2.5 bg-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-[10px] text-slate-400 italic">Limpo! Nenhum vermelho.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HALL OF FAME / TROPHIES */}
              <div className="glass-panel rounded-3xl p-6 hover:shadow-lg transition border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                    <TrophyIcon size={18} className="text-amber-500" /> Conquistas do Time
                  </h3>
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase">Galeria</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {trophies.filter(tr => tr.teamId === myTeam.id).length > 0 ? (
                    trophies.filter(tr => tr.teamId === myTeam.id).map(tr => (
                      <div key={tr.id} className="flex flex-col items-center text-center p-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 group relative">
                        <TrophyIcon size={24} className="text-amber-500 mb-1 group-hover:scale-110 transition" />
                        <div className="text-[9px] font-black text-amber-800 dark:text-amber-400 leading-tight uppercase">{tr.name}</div>
                        <div className="text-[8px] text-amber-600 opacity-60 font-bold">{tr.dateAchieved ? new Date(tr.dateAchieved).getFullYear() : '---'}</div>
                        {isDirectorOwner && (
                          <button onClick={() => handleDeleteTrophy(tr.id)} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={10} /></button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4 text-xs text-slate-400 italic">Galeria vazia. Conquiste títulos!</div>
                  )}
                </div>


              </div>

              {/* SQUAD LIST */}
              <div className="glass-panel rounded-3xl p-6 interactive-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                    <Users size={20} className="text-blue-500 icon-hover" /> Elenco Completo
                  </h3>
                  {isEditable && (
                    <button
                      onClick={() => setIsViewingFullRoster(true)}
                      className="text-[10px] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold hover:bg-emerald-100 transition btn-feedback shadow-sm"
                    >
                      Gerenciar Elenco
                    </button>
                  )}
                </div>
                {myTeam.roster.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {myTeam.roster.map(p => (
                      <div key={p.id} onClick={() => setSelectedPlayerForProfile({ player: p, teamName: myTeam.name })} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition group btn-feedback">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-400 text-sm group-hover:bg-emerald-200 group-hover:text-emerald-800 transition overflow-hidden">
                            {(function () {
                              const avatar = (p.userId === currentUser.id ? currentUser.avatar : null) || (p as any).avatar || (p as any).profilePicture;
                              return avatar ? <img src={avatar} alt={p.name} className="w-full h-full object-cover" /> : p.number;
                            })()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{p.name}</div>
                            <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">{p.position}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Nenhum jogador no elenco.</div>
                )}
              </div>
            </div>
          </div>

          {/* TEAM NEWS SECTION */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl">
                <Newspaper className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Notícias & Resenhas</h3>
                <p className="text-sm text-slate-500 font-medium font-inter">Fique por dentro do que acontece no {myTeam.shortName}</p>
              </div>
            </div>

            {teamNews.length > 0 ? (
              <div className="space-y-10">
                {/* Top 3 Featured */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {teamNews.slice(0, 3).map(item => (
                    <div key={item.id} onClick={() => setSelectedNewsItem(item)} className="glass-panel rounded-2xl overflow-hidden interactive-card cursor-pointer group flex flex-col border border-slate-100 hover:border-emerald-200">
                      <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        {item.media && item.media.length > 0 ? (
                          <img src={item.media[0].url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={item.title} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <Newspaper size={40} className="text-emerald-500/30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">{item.category}</span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col bg-white dark:bg-slate-900">
                        <span className="text-[10px] text-slate-400 font-bold mb-1">{new Date(item.date).toLocaleDateString()}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition truncate-2-lines leading-tight uppercase text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rest of News */}
                {teamNews.length > 3 && (
                  <div className="glass-panel rounded-3xl p-6 bg-white/40 dark:bg-slate-900/40">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-6 underline decoration-emerald-500 decoration-2 underline-offset-4 flex items-center gap-2">
                      <Activity size={18} className="text-emerald-500" />
                      Histórico de Notícias
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamNews.slice(3).map(item => (
                        <div key={item.id} onClick={() => setSelectedNewsItem(item)} className="flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-slate-800/80 rounded-2xl transition cursor-pointer group border border-transparent hover:border-slate-100 hover:shadow-sm">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                            {item.media && item.media.length > 0 ? (
                              <img src={item.media[0].url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><Newspaper size={20} className="text-slate-400" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">{item.category}</span>
                              <span className="text-[10px] text-slate-400 font-medium">• {new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition uppercase">{item.title}</h5>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 glass-panel rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
                <Newspaper size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm italic font-medium">Nenhuma notícia registrada para o {myTeam.shortName} ainda.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // === UNIFIED TEAM LIST VIEW ===
    const myTeams = activeTeams.filter(t =>
      t.createdBy === currentUser!.id ||
      t.id === currentUser!.teamId
    );
    const followedTeamIds = socialGraph.filter(s => s.followerId === currentUser!.id && s.targetType === 'TEAM').map(s => s.targetId);
    const followedTeams = activeTeams.filter(t => followedTeamIds.includes(t.id) && !myTeams.includes(t));
    const localTeams = activeTeams.filter(t => t.city.toLowerCase() === (currentUser!.location || '').toLowerCase() && !myTeams.includes(t) && !followedTeams.includes(t));
    const exploreTeams = activeTeams.filter(t => !myTeams.includes(t) && !followedTeams.includes(t) && !localTeams.includes(t));

    // --- Render Helper ---
    const renderTeamSection = (title: string, teamList: Team[], Icon: React.ElementType, emptyMsg: string) => (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 pl-2 border-l-4 border-emerald-500">
          <Icon size={20} className="text-emerald-500" /> {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamList.map(t => (
            <div
              key={t.id}
              onClick={() => { setViewingTeamId(t.id); setViewingProfileId(null); }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-emerald-200"
            >
              {/* Banner with Team Color */}
              <div className="h-24 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900"
                  style={{ background: (t.primaryColor || t.logoColor) ? `linear-gradient(135deg, ${t.primaryColor || t.logoColor}, ${t.secondaryColor || t.primaryColor || t.logoColor})` : '' }}
                ></div>
                {t.cover ? (
                  <img src={t.cover} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition duration-500" alt={t.name} />
                ) : (
                  <div className="absolute inset-0 bg-black/20 pattern-grid-lg opacity-30"></div>
                )}
                {/* City Badge */}
                <span className="absolute top-2 right-2 bg-black/40 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin size={10} /> {t.city}
                </span>
              </div>

              <div className="p-4 relative">
                {/* Avatar overlapping banner */}
                <div className="absolute -top-10 left-4 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden z-10">
                  {t.profilePicture ? (
                    <img src={t.profilePicture} className="w-full h-full object-cover" alt={t.shortName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl text-white" style={{ backgroundColor: t.primaryColor || t.logoColor || '#10b981' }}>
                      {t.shortName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="ml-20 min-h-[40px] flex flex-col justify-center">
                  <h4 className="font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition">{t.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.sportType}</span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-50 pt-3">
                  <span className="flex items-center gap-1"><Users size={14} className="text-emerald-500" /> {t.roster.length} Jogadores</span>
                  <span className="flex items-center gap-1"><TrophyIcon size={14} className="text-amber-500" /> {t.wins || 0} Vitórias</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {teamList.length === 0 && emptyMsg && (
          <div className="text-slate-400 text-sm italic py-4 pl-4 border-l-2 border-slate-100">{emptyMsg}</div>
        )}
      </div>
    );

    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Times</h2>
          {currentUser!.role === UserRole.DIRECTOR && (
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="btn-feedback bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              <Plus size={18} /> Novo Time
            </button>
          )}
        </div>


        {/* 1. My Teams */}
        {renderTeamSection("Meus Times", myTeams, Crown, "Você não gerencia nem participa de nenhum time.")}
        {/* 2. Followed Teams */}
        {renderTeamSection("Seguindo", followedTeams, Heart, "Você ainda não segue nenhum time.")}
        {/* 3. Local Teams */}
        {renderTeamSection(`Times em ${currentUser!.location || 'sua região'}`, localTeams, MapPin, "Nenhum time encontrado na sua cidade.")}
        {/* 4. Explore */}
        {renderTeamSection("Explorar", exploreTeams, Map, "Não há outros times para exibir.")}


      </div>
    );
  };

  const renderMatchesView = () => {
    // 1. FILTER LOGIC
    let filtered = activeMatches;
    if (matchStatusFilter !== 'ALL') {
      filtered = filtered.filter(m => m.status === matchStatusFilter);
    }
    if (matchContextFilter === 'FRIENDLY') {
      filtered = filtered.filter(m => m.type === MatchType.FRIENDLY);
    } else if (matchContextFilter !== 'ALL') {
      const tour = activeTournaments.find(t => t.name === matchContextFilter);
      if (tour) filtered = filtered.filter(m => m.tournamentId === tour.id);
    }

    // 2. PRIORITY SPLIT LOGIC
    let myMatches: Match[] = [];
    let otherMatches: Match[] = [];

    if (currentUser!.role === UserRole.REFEREE) {
      const assignmentCount = 3;
      myMatches = filtered.slice(0, assignmentCount);
      otherMatches = filtered.slice(assignmentCount);
    } else {
      // --- NEW LOGIC: FIND ALL USER TEAMS ---
      // 1. Get all teams where user is in roster OR is creator OR is current context
      const userTeamIds = activeTeams
        .filter(t =>
          t.id === currentUser!.teamId ||
          t.createdBy === currentUser!.id ||
          t.roster.some(p => p.userId === currentUser!.id)
        )
        .map(t => t.id);

      // 2. Split Matches
      myMatches = filtered.filter(m => userTeamIds.includes(m.homeTeamId) || userTeamIds.includes(m.awayTeamId));
      otherMatches = filtered.filter(m => !userTeamIds.includes(m.homeTeamId) && !userTeamIds.includes(m.awayTeamId));

      // 3. Add Followed Teams (for FANS who participate in one team but follow others)
      if (currentUser!.role === UserRole.FAN) {
        const followedTeamIds = socialGraph.filter(s => s.followerId === currentUser!.id).map(s => s.targetId);
        const followedMatches = otherMatches.filter(m => followedTeamIds.includes(m.homeTeamId) || followedTeamIds.includes(m.awayTeamId));

        // Merge unique matches
        const myMatchIds = new Set(myMatches.map(m => m.id));
        followedMatches.forEach(m => {
          if (!myMatchIds.has(m.id)) {
            myMatches.push(m);
            // Remove from otherMatches
            otherMatches = otherMatches.filter(om => om.id !== m.id);
          }
        });
      }
    }
    if (currentUser!.role === UserRole.DIRECTOR && matchStatusFilter === MatchStatus.WAITING_ACCEPTANCE) {
      myMatches = filtered;
      otherMatches = [];
    }
    myMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    otherMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header & Filters */}
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Jogos & Resultados</h2>

          {/* ROW 1: Context Filters (Tournaments/Friendly) */}
          {activeTournaments.length > 0 && (
            /* CATEGORY FILTERS */
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setMatchContextFilter('ALL')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition btn-feedback ${matchContextFilter === 'ALL' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Geral
              </button>
              <button
                onClick={() => setMatchContextFilter('FRIENDLY')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition btn-feedback ${matchContextFilter === 'FRIENDLY' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Amistosos
              </button>
              <button
                onClick={() => setMatchContextFilter((matchContextFilter !== 'ALL' && matchContextFilter !== 'FRIENDLY') ? matchContextFilter : activeTournaments[0]?.name || 'TOURNAMENTS')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition btn-feedback ${(matchContextFilter !== 'ALL' && matchContextFilter !== 'FRIENDLY') ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                Campeonatos
              </button>

              {/* TOURNAMENT SELECTOR (Only shows if "Campeonatos" is active) */}
              {(matchContextFilter !== 'ALL' && matchContextFilter !== 'FRIENDLY') && activeTournaments.length > 0 && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <select
                    value={activeTournaments.find(t => t.name === matchContextFilter)?.id || ''}
                    onChange={(e) => {
                      const found = activeTournaments.find(t => t.id === e.target.value);
                      if (found) setMatchContextFilter(found.name);
                    }}
                    className="pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  >
                    {activeTournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ROW 2: Status Filters */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setMatchStatusFilter('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm btn-feedback ${matchStatusFilter === 'ALL' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-white border-white text-slate-500 hover:text-slate-900'}`}>
              Todos
            </button>
            <button onClick={() => setMatchStatusFilter(MatchStatus.LIVE)} className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm flex items-center gap-2 btn-feedback ${matchStatusFilter === MatchStatus.LIVE ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-white text-slate-500 hover:text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${matchStatusFilter === MatchStatus.LIVE ? 'bg-white' : 'bg-red-500'} animate-pulse`}></div> Ao Vivo
            </button>
            <button onClick={() => setMatchStatusFilter(MatchStatus.SCHEDULED)} className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm btn-feedback ${matchStatusFilter === MatchStatus.SCHEDULED ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-white text-slate-500 hover:text-emerald-600'}`}>
              Agendados
            </button>
            <button onClick={() => setMatchStatusFilter(MatchStatus.FINISHED)} className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm btn-feedback ${matchStatusFilter === MatchStatus.FINISHED ? 'bg-slate-700 border-slate-800 text-white' : 'bg-white border-white text-slate-500 hover:text-slate-700'}`}>
              Encerrados
            </button>
            {currentUser!.role === UserRole.DIRECTOR && (
              <button onClick={() => setMatchStatusFilter(MatchStatus.WAITING_ACCEPTANCE)} className={`px-4 py-2 rounded-full text-xs font-bold border transition shadow-sm btn-feedback ${matchStatusFilter === MatchStatus.WAITING_ACCEPTANCE ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-white text-slate-500 hover:text-amber-600'}`}>
                Pendentes
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: PRIORITY GAMES ("My Games") */}
        {
          myMatches.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 pl-2 border-l-4 border-emerald-500">
                {currentUser!.role === UserRole.REFEREE ? 'Seus Jogos Atribuídos' : 'Seus Jogos & Times Seguidos'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myMatches.map(m => (
                  <div key={m.id} onClick={() => setSelectedMatchId(m.id)} className="cursor-pointer">
                    <MatchCard
                      match={m} homeTeam={getTeam(m.homeTeamId)} awayTeam={getTeam(m.awayTeamId)} arena={getArena(m.arenaId)}
                      userRole={currentUser!.role} onUpdateScore={handleUpdateScore} onEditDetails={(match) => { setEditingMatch(match); setIsMatchModalOpen(true); }}
                      onTeamClick={handleTeamClick}
                      currentUserId={currentUser?.id}
                      onSavePrediction={handleSavePrediction}
                      existingPrediction={matchPredictions.find(p => p.matchId === m.id && p.userId === currentUser?.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* SECTION 2: OTHER GAMES (Toggle) */}
        {
          otherMatches.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-200/50">
              {!showOtherGames ? (
                <button
                  onClick={() => setShowOtherGames(true)}
                  className="w-full py-4 glass-panel rounded-2xl text-slate-500 font-bold hover:text-emerald-600 transition flex items-center justify-center gap-2 hover:shadow-lg interactive-card"
                >
                  Ver Outros Jogos da Liga <ChevronDown size={18} />
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar size={18} className="text-slate-400" />
                      Outros Jogos
                    </h3>
                    <button onClick={() => setShowOtherGames(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm btn-feedback">
                      Ocultar <ChevronUp size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {otherMatches.map(m => (
                      <div key={m.id} onClick={() => setSelectedMatchId(m.id)} className="cursor-pointer">
                        <MatchCard
                          match={m} homeTeam={getTeam(m.homeTeamId)} awayTeam={getTeam(m.awayTeamId)} arena={getArena(m.arenaId)}
                          userRole={currentUser!.role} onUpdateScore={handleUpdateScore} onEditDetails={(match) => { setEditingMatch(match); setIsMatchModalOpen(true); }}
                          onTeamClick={handleTeamClick}
                          currentUserId={currentUser?.id}
                          onSavePrediction={handleSavePrediction}
                          existingPrediction={matchPredictions.find(p => p.matchId === m.id && p.userId === currentUser?.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }

        {
          myMatches.length === 0 && otherMatches.length === 0 && (
            <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-slate-300 interactive-card">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Nenhum jogo encontrado.</p>
              {canManage && (
                <button onClick={() => setIsMatchModalOpen(true)} className="mt-4 text-emerald-600 font-bold hover:underline btn-feedback">
                  Criar uma partida agora
                </button>
              )}
            </div>
          )
        }
      </div >
    );
  };

  const renderTournamentsView = () => {
    if (selectedTournamentId) {
      const tournament = activeTournaments.find(t => t.id === selectedTournamentId);
      if (!tournament) return null;

      return (
        <TournamentDetailView
          tournament={tournament}
          matches={activeMatches}
          teams={activeTeams}
          news={news}
          arenas={arenas}
          currentUser={currentUser!}
          onClose={() => setSelectedTournamentId(null)}
          onMatchClick={(id) => setSelectedMatchId(id)}
          onUpdateScore={handleUpdateScore}
          onEditMatch={(m) => { setEditingMatch(m); setIsMatchModalOpen(true); }}
          onTeamClick={handleTeamClick}
          onInviteTeam={handleSendTournamentInvite}
          onDeleteTournament={(id) => openDeleteModal(id, 'TOURNAMENT')}
          onUpdateTournament={handleUpdateTournament}
          onPostNews={handlePostGeneratedNews}
        />
      );
    }

    // Filter Logic
    const myTournaments = activeTournaments.filter(t =>
      t.createdBy === currentUser?.id ||
      (currentUser?.teamId && t.participatingTeamIds.includes(currentUser.teamId))
    );

    const otherTournaments = activeTournaments.filter(t => !myTournaments.find(mt => mt.id === t.id));

    const exploreTournaments = otherTournaments.filter(t => {
      // If legacy (no scope), show it
      if (!t.scope) return true;

      // Private: Hide unless invited (which would be in 'myTournaments' if accepted)
      if (t.scope === 'PARTICULAR') return false;

      if (t.scope === 'NACIONAL') return true;

      const userLocation = currentUser?.location || '';
      const [userCity, userState] = userLocation.includes(' - ') ? userLocation.split(' - ') : [userLocation, ''];

      const tourLocation = t.city || '';
      const [tourCity, tourState] = tourLocation.includes(' - ') ? tourLocation.split(' - ') : [tourLocation, ''];

      if (t.scope === 'ESTADUAL') {
        return userState && tourState && userState === tourState;
      }

      if (t.scope === 'MUNICIPAL') {
        return userCity && tourCity && userCity === tourCity;
      }

      return true;
    });

    const renderTournamentCard = (tour: Tournament) => {
      const isCreator = tour.createdBy === currentUser!.id;
      return (
        <div
          key={tour.id}
          onClick={() => setSelectedTournamentId(tour.id)}
          className="glass-panel p-6 rounded-3xl hover:shadow-2xl transition-all duration-300 transform cursor-pointer group relative overflow-hidden interactive-card"
        >
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition"></div>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition group-hover:scale-110 duration-500">
            <TrophyIcon size={80} />
          </div>

          <div className="relative z-10">
            <div className="flex gap-2 mb-4">
              <span className="text-[10px] font-bold text-white uppercase tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-1 rounded shadow-sm">
                {tour.format === 'LEAGUE' ? 'Liga' : 'Mata-Mata'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${tour.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {tour.status === 'ACTIVE' ? 'Ativo' : 'Encerrado'}
              </span>
              {tour.scope && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wide">
                  {tour.scope}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{tour.name}</h3>
            <div className="flex justify-between items-end mt-4">
              <div className="text-sm text-slate-500 font-medium bg-white/50 px-2 py-1 rounded-lg">
                {SPORT_TYPE_DETAILS[tour.sportType]?.label}
              </div>
              {isCreator && (
                <button
                  onClick={(e) => { e.stopPropagation(); openDeleteModal(tour.id, 'TOURNAMENT'); }}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition btn-feedback"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <span>Progresso</span>
                <span>{(tour.currentRound / tour.totalRounds * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(tour.currentRound / tour.totalRounds) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Campeonatos</h2>
          {canManage && (
            <button
              onClick={() => setIsTournamentModalOpen(true)}
              className="btn-feedback bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition flex items-center gap-2"
            >
              <Plus size={18} /> Novo
            </button>
          )}
        </div>
        {/* SECTION 1: MY TOURNAMENTS */}
        {myTournaments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-l-4 border-emerald-500 pl-3">Meus Campeonatos (Participando/Criado)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myTournaments.map(renderTournamentCard)}
            </div>
          </div>
        )}

        {/* SECTION 2: EXPLORE */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3">Explorar Campeonatos</h3>
          </div>

          {exploreTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {exploreTournaments.map(renderTournamentCard)}
            </div>
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400 glass-panel rounded-3xl border-dashed border-2 border-slate-200 interactive-card">
              <TrophyIcon size={48} className="mx-auto text-slate-300 mb-2 opacity-50" />
              <p>Nenhum campeonato encontrado na sua região.</p>
              <p className="text-xs mt-2 text-slate-500">({currentUser?.location || 'Localização desconhecida'})</p>
            </div>
          )}
        </div>
      </div >
    );
  };

  const renderArenasView = () => {
    if (selectedArenaId) {
      const arena = arenas.find(a => a.id === selectedArenaId) || SAFE_ARENA;
      return (
        <ArenaDetailView
          arena={arena}
          matches={matches}
          teams={teams}
          currentUserRole={currentUser?.role || UserRole.FAN}
          onClose={() => setSelectedArenaId(null)}
          onMatchClick={(matchId) => { setSelectedArenaId(null); setSelectedMatchId(matchId); }} // Close arena view when opening match
          onUpdateScore={handleUpdateScore}
          onEditMatch={(match) => { setEditingMatch(match); setIsMatchModalOpen(true); }}
          onTeamClick={handleTeamClick}
        />
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Arenas</h2>
            <div className="glass-panel p-1 rounded-xl flex text-xs font-bold shadow-sm interactive-card">
              <button
                onClick={() => setIsArenasMapMode(false)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition btn-feedback ${!isArenasMapMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <ListIcon size={14} /> Lista
              </button>
              <button
                onClick={() => setIsArenasMapMode(true)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition btn-feedback ${isArenasMapMode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Map size={14} /> Mapa
              </button>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setIsArenaModalOpen(true)}
              className="btn-feedback bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              <Plus size={18} /> Nova
            </button>
          )}
        </div>

        {isArenasMapMode ? (
          <ArenasMapView arenas={arenas} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {arenas.map(arena => (
              <div key={arena.id} onClick={() => setSelectedArenaId(arena.id)} className="glass-panel rounded-2xl overflow-hidden group hover:shadow-xl transition duration-300 interactive-card cursor-pointer">
                <div className="h-48 bg-slate-200 relative overflow-hidden">
                  <img src={arena.coverPicture || `https://picsum.photos/seed/${arena.id}/600/300`} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="Arena" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      {arena.name}
                    </h3>
                  </div>
                  <a
                    href={arena.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${arena.lat},${arena.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-emerald-500 transition btn-feedback"
                  >
                    <MapPin size={20} />
                  </a>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 text-sm flex items-start gap-2">
                    <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {arena.address}
                  </p>
                </div>
              </div>
            ))}
            {arenas.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 glass-panel rounded-xl border-dashed border-2 border-slate-200 interactive-card">Nenhuma arena cadastrada.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNewsView = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8 text-left">Notícias da Liga</h2>
      <div className="grid grid-cols-1 gap-6">
        {news.map(n => (
          <div key={n.id} className="glass-panel p-8 rounded-3xl hover:shadow-xl transition duration-300 cursor-pointer group interactive-card" onClick={() => setSelectedNewsItem(n)}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">{n.category}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{new Date(n.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-emerald-500 transition leading-tight">{n.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 text-sm">{n.excerpt}</p>
                <div className="mt-4 flex items-center text-emerald-600 font-bold text-sm opacity-100 transition">
                  Ler matéria completa <ArrowLeft className="rotate-180 ml-2" size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {news.length === 0 && (
        <div className="py-20 text-center text-slate-400 glass-panel rounded-3xl border-dashed border-2 border-slate-200 interactive-card">Nenhuma notícia.</div>
      )}
    </div>
  );

  // --- Main Render ---

  return (
    <div className="min-h-screen font-sans relative bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Navbar */}
      {currentUser && (
        <nav className="glass-panel dark:glass-panel-dark text-slate-900 dark:text-white sticky top-4 z-40 mx-4 rounded-2xl mb-6 shadow-2xl backdrop-blur-xl">
          <div className="px-6">
            <div className="flex justify-between items-center h-20">

              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => changeView('HOME')}>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-900/50 group-hover:scale-105 transition icon-hover">
                  <TrophyIcon size={22} className="text-white dark:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight leading-none">Clube<span className="text-emerald-600 dark:text-emerald-400">DoContra</span></span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Sports Manager</span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {[
                  { id: 'HOME', label: 'Início', icon: Home },
                  { id: 'TEAMS', label: 'Times', icon: Users },
                  { id: 'MATCHES', label: 'Jogos', icon: Calendar },
                  { id: 'TOURNAMENTS', label: 'Camp.', icon: TrophyIcon },
                  { id: 'ARENAS', label: 'Arenas', icon: MapPin },
                  { id: 'PLAYERS', label: 'Mercado', icon: Search },
                  { id: 'NEWS', label: 'Notícias', icon: Newspaper },
                ].map((item) => {
                  const isActive = currentView === item.id && !selectedMatchId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => changeView(item.id as AppView)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 btn-feedback ${isActive ? 'bg-emerald-600 text-white dark:bg-white dark:text-emerald-900 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10'
                        }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white dark:text-emerald-600' : ''} />
                      {item.label}
                    </button>
                  );
                })}

              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {/* Notification Bell */}
                  <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white p-2 rounded-full hover:bg-slate-900/5 dark:hover:bg-white/10 transition relative btn-feedback">
                      <Bell size={22} />
                      {unreadNotifications.length > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                      )}
                    </button>
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl text-slate-800 p-2 z-50 border border-white/20 animate-in zoom-in-95 origin-top-right">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 px-3 pt-2">Notificações</h4>
                        {unreadNotifications.length === 0 ? (
                          <div className="text-sm text-slate-500 text-center py-6">Nenhuma notificação nova</div>
                        ) : (
                          unreadNotifications.map(n => (
                            <div key={n.id} className="p-3 hover:bg-emerald-50/50 rounded-xl mb-1 border-b border-slate-100 last:border-0 transition">
                              <p className="text-sm font-bold text-slate-800">{n.fromName}</p>
                              {n.type === 'TEAM_INVITE' && (
                                <p className="text-xs text-slate-500 mb-3">Convidou você para entrar em <span className="font-bold text-emerald-600">{n.data?.teamName}</span></p>
                              )}
                              {n.type === 'TOURNAMENT_INVITE' && (
                                <p className="text-xs text-slate-500 mb-3">Convidou <span className="font-bold">{n.data?.teamName}</span> para o campeonato <span className="font-bold">{n.data?.tournamentName}</span></p>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => handleDeclineInvite(n.id)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs py-2 rounded-lg font-bold transition btn-feedback">
                                  Recusar
                                </button>
                                <button onClick={() => handleAcceptInvite(n.id)} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-lg font-bold shadow-md transition btn-feedback">
                                  Aceitar Convite
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 cursor-pointer p-1.5 pl-2 pr-4 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10 transition btn-feedback" onClick={() => setViewingProfileId(currentUser.id)}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-md overflow-hidden">
                      {currentUser.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-wider">{currentUser.role}</span>
                    </div>
                  </div>

                  <button onClick={handleLogout} className="hidden md:block p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition btn-feedback" title="Sair">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-24 md:pb-12 relative z-10">
        {currentView === 'HOME' && renderHomeView()}
        {currentView === 'TEAMS' && renderTeamsView()}
        {currentView === 'MATCHES' && renderMatchesView()}
        {currentView === 'TOURNAMENTS' && renderTournamentsView()}
        {currentView === 'ARENAS' && renderArenasView()}
        {currentView === 'NEWS' && renderNewsView()}
        {currentView === 'PLAYERS' && (
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <PlayerDirectory
              users={userAccounts}
              currentUser={currentUser!}
              socialGraph={socialGraph}
              onFollow={handleFollow}
              onViewProfile={(uid) => setViewingProfileId(uid)}
            />
          </div>
        )}
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      {currentUser && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-2 z-40 md:hidden flex justify-around items-center shadow-2xl safe-area-bottom">
          {[
            { id: 'HOME', label: 'Início', icon: Home },
            { id: 'TEAMS', label: 'Times', icon: Shield },
            { id: 'MATCHES', label: 'Jogos', icon: Calendar },
            { id: 'PLAYERS', label: 'Mercado', icon: Search },
            { id: 'TOURNAMENTS', label: 'Camp.', icon: TrophyIcon },
            { id: 'NEWS', label: 'Notícias', icon: Newspaper },
          ].map((item) => {
            const isActive = currentView === item.id && !selectedMatchId;
            return (
              <button
                key={item.id}
                onClick={() => changeView(item.id as AppView)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 btn-feedback ${isActive ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
              >
                <item.icon size={20} className={isActive ? 'fill-current' : ''} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}


          <button
            onClick={() => setViewingProfileId(currentUser.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 btn-feedback ${viewingProfileId ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </div>
      )}

      {/* --- Floating Action Button (Director) --- */}
      {canManage && !isMatchModalOpen && !isTournamentModalOpen && !selectedMatchId && !selectedTournamentId && currentUser && (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-30 flex flex-col items-end gap-3">
          {isFabMenuOpen && (
            <div className="flex flex-col gap-3 items-end animate-in slide-in-from-bottom-10 duration-300 mb-2">
              <button onClick={() => { setIsFabMenuOpen(false); setEditingMatch(null); setIsMatchModalOpen(true); }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-2 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-emerald-50 transition btn-feedback">
                <Calendar size={18} /> Novo Jogo
              </button>
              <button onClick={() => { setIsFabMenuOpen(false); setEditingTeam(null); setIsTeamModalOpen(true); }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-2 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-emerald-50 transition btn-feedback">
                <Users size={18} /> Novo Time
              </button>
              <button onClick={() => { setIsFabMenuOpen(false); setIsTournamentModalOpen(true); }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-2 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-emerald-50 transition btn-feedback">
                <TrophyIcon size={18} /> Novo Camp.
              </button>
              <button onClick={() => { setIsFabMenuOpen(false); setIsArenaModalOpen(true); }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-2 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-emerald-50 transition btn-feedback">
                <MapPin size={18} /> Nova Arena
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition duration-300 btn-feedback ${isFabMenuOpen ? 'bg-slate-700 rotate-45' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      {/* MATCH DETAIL VIEW OVERLAY */}
      {selectedMatchId && !isMatchModalOpen && (
        (() => {
          const m = matches.find(x => x.id === selectedMatchId);
          if (!m) return null;
          const hTeam = getTeam(m.homeTeamId);
          const aTeam = getTeam(m.awayTeamId);
          const arena = getArena(m.arenaId);

          return (
            <MatchDetailView
              match={m}
              homeTeam={hTeam}
              awayTeam={aTeam}
              arena={arena}
              currentUser={currentUser!}
              onClose={() => setSelectedMatchId(null)}
              onAddEvent={handleAddEvent}
              onViewPlayer={(p) => { if (p.userId) setViewingProfileId(p.userId); }}
              onSendMessage={handleSendMessage}
              onSaveMatchTactics={handleSaveMatchTactics}
              onAddMedia={handleAddMatchMedia}
              onFinishMatch={handleFinishMatch}
              onUpdateStreams={handleUpdateStreams}
              onStartBroadcast={() => handleStartBroadcast(m.id)}
              onUpdateStatus={(id, status) => handleUpdateScore(id, m.homeScore, m.awayScore, status)}
              onPostNews={handlePostGeneratedNews}
            />
          );
        })()
      )}

      {/* GLOBAL BROADCASTER OVERLAY (Persistent through navigation) */}
      {/* Agora Broadcaster Removed - Feature Disabled temporarily */}

      {/* --- MODALS --- */}

      {/* 1. MATCH MODAL */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel text-slate-900 mx-auto w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">{editingMatch ? 'Editar Jogo' : 'Novo Jogo'}</h2>
              <button onClick={() => setIsMatchModalOpen(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleSaveMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mandante</label>
                  <select
                    name="homeTeamId"
                    defaultValue={editingMatch?.homeTeamId}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                    required
                    onChange={(e) => {
                      // Force re-render to update away team filter
                      setEditingMatch(prev => ({ ...(prev || {} as any), homeTeamId: e.target.value }));
                    }}
                  >
                    <option value="" disabled selected={!editingMatch}>Selecione...</option>
                    {activeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visitante</label>
                  <select name="awayTeamId" defaultValue={editingMatch?.awayTeamId} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required>
                    <option value="" disabled selected={!editingMatch}>Selecione...</option>
                    {activeTeams
                      .filter(t => t.id !== (editingMatch?.homeTeamId || (document.querySelector('[name="homeTeamId"]') as HTMLSelectElement)?.value))
                      .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data e Hora</label>
                  <input type="datetime-local" name="date" defaultValue={editingMatch?.date} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Arena</label>
                  <select name="arenaId" defaultValue={editingMatch?.arenaId} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required>
                    {arenas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="hidden" name="type" value="FRIENDLY" />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Esporte</label>
                  <select name="sportType" defaultValue={editingMatch?.sportType || 'FUT7'} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {Object.entries(SPORT_TYPE_DETAILS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rodada</label>
                  <input type="text" name="round" defaultValue={editingMatch?.round || '1'} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="Ex: 1" />
                </div>
              </div>

              {/* Tournament Select Removed */}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vídeo Youtube (Link)</label>
                <input type="url" name="youtubeUrl" defaultValue={editingMatch?.youtubeVideoId ? `https://youtube.com/watch?v=${editingMatch.youtubeVideoId}` : ''} placeholder="https://..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fotos do Jogo</label>
                <input type="file" name="media" multiple accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>

              <div className="flex gap-3 pt-4">
                {editingMatch && (
                  <button type="button" onClick={() => openDeleteModal(editingMatch.id, 'MATCH')} className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition">Excluir</button>
                )}
                <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-200">Salvar Jogo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. TEAM MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel text-slate-900 mx-auto w-full max-w-md rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">{editingTeam ? 'Editar Time' : 'Criar Novo Time'}</h2>
              <button onClick={() => { setIsTeamModalOpen(false); setEditingTeam(null); }}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
            </div>
            <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Time</label>
                <input type="text" name="teamName" defaultValue={editingTeam?.name} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required placeholder="Ex: Rocket FC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sigla (3 letras)</label>
                  <input type="text" name="shortName" defaultValue={editingTeam?.shortName} maxLength={3} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 uppercase" required placeholder="ROC" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade Sede</label>
                  <CitySelect name="city" value={editingTeam?.city} onChange={() => { }} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modalidade Principal</label>
                <select name="sportType" defaultValue={editingTeam?.sportType || 'FUT7'} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {Object.entries(SPORT_TYPE_DETAILS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cores do Time</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400">Primária*</span>
                    <input type="color" name="primaryColor" defaultValue={editingTeam?.primaryColor || editingTeam?.logoColor || '#10b981'} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Secundária*</span>
                    <input type="color" name="secondaryColor" defaultValue={editingTeam?.secondaryColor || '#0f172a'} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Terciária</span>
                    <input type="color" name="tertiaryColor" defaultValue={editingTeam?.tertiaryColor || ''} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escudo (Avatar)</label>
                  <input type="file" name="profilePicture" accept="image/*" className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capa (Banner)</label>
                  <input type="file" name="cover" accept="image/*" className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {editingTeam && (
                  <button type="button" onClick={() => openDeleteModal(editingTeam.id, 'TEAM')} className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition">Excluir</button>
                )}
                <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-200">
                  {editingTeam ? 'Atualizar' : 'Criar Time'}
                </button>
              </div>
            </form>
          </div >
        </div >
      )}



      {/* 3. TOURNAMENT MODAL */}
      {
        isTournamentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-panel text-slate-900 mx-auto w-full max-w-md rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Novo Campeonato</h2>
                <button onClick={() => setIsTournamentModalOpen(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
              </div>
              <form onSubmit={handleSaveTournament} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Campeonato</label>
                  <input type="text" name="name" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required placeholder="Copa de Verão 2024" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Formato</label>
                  <select name="format" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="LEAGUE">Pontos Corridos</option>
                    <option value="KNOCKOUT">Mata-Mata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Esporte</label>
                  <select name="sportType" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="FUT7">Futebol Society (7)</option>
                    <option value="FUTSAL">Futsal (5)</option>
                    <option value="FUT6">Fut 6</option>
                    <option value="AMATEUR">Campo (11) Amador</option>
                    <option value="PROFESSIONAL">Campo (11) Profissional</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Abrangência</label>
                    <select name="scope" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="PARTICULAR">Particular</option>
                      <option value="MUNICIPAL">Municipal</option>
                      <option value="ESTADUAL">Estadual</option>
                      <option value="NACIONAL">Nacional</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade Sede</label>
                    <CitySelect name="city" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número de Times</label>
                  <input type="number" name="maxTeams" defaultValue={8} min={2} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required />
                  <p className="text-[10px] text-slate-400 mt-1">Rodadas e chaves serão calculadas automaticamente.</p>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-200 mt-2">Criar Campeonato</button>
              </form >
            </div >
          </div >
        )
      }

      {/* 4. ARENA MODAL */}
      {
        isArenaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-panel text-slate-900 mx-auto w-full max-w-md rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Nova Arena</h2>
                <button onClick={() => setIsArenaModalOpen(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
              </div>
              <form onSubmit={handleCreateArena} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Local</label>
                  <input type="text" name="name" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required placeholder="Arena Society..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                  <input type="text" name="address" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required placeholder="Rua X, 123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <CitySelect name="city" onChange={() => { }} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link do Google Maps</label>
                  <input type="url" name="googleMapsUrl" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="https://maps.google.com/..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Foto Principal</label>
                    <input type="file" name="profilePicture" accept="image/*" className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capa (Opcional)</label>
                    <input type="file" name="coverPicture" accept="image/*" className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-200 mt-2">Salvar Arena</button>
              </form>
            </div>
          </div>
        )
      }

      {/* 5. USER PROFILE MODAL */}
      {
        viewingProfileId && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4 bg-white md:bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <UserProfileView
              viewingUser={userAccounts.find(u => u.id === viewingProfileId) || currentUser!}
              currentUser={currentUser!}
              teams={teams}
              socialGraph={socialGraph}
              onClose={() => setViewingProfileId(null)}
              onUpdateProfile={handleUpdateProfile}
              onFollow={handleFollow}
              onTeamClick={(teamId) => { setViewingProfileId(null); setViewingTeamId(teamId); setCurrentView('TEAMS'); }}
              onBrowseTeams={() => { setViewingProfileId(null); setCurrentView('TEAMS'); }}
              onInviteToTeam={() => {
                const targetUser = userAccounts.find(u => u.id === viewingProfileId);

                // Robust Team Detection for Director
                let myTeamId = currentUser?.teamId;
                if (!myTeamId && currentUser?.role === UserRole.DIRECTOR) {
                  // Fallback: Check if I am the creator of any team
                  const ownedTeam = teams.find(t => t.createdBy === currentUser.id);
                  if (ownedTeam) myTeamId = ownedTeam.id;
                }

                if (myTeamId) {
                  setSelectedTeamIdForInvite(myTeamId);
                  setInviteModalEmail(targetUser?.email || '');
                  setIsInviteModalOpen(true);
                } else {
                  alert("Você precisa ser Diretor de um time para convidar. Verifique se você criou ou está vinculado a um time.");
                }
              }}

              onDeleteUser={(userId) => {
                if (confirm("Tem certeza que deseja remover este usuário?")) {
                  alert("Funcionalidade de exclusão de usuário a ser implementada completamente.");
                }
              }}
              onUploadImage={uploadImage}
              onTogglePlayerRole={handleTogglePlayerRole}
              theme={theme}
              toggleTheme={toggleTheme}
              evaluations={evaluations}
              matches={matches}
              trophies={trophies}
              onDeleteEvaluation={handleDeleteEvaluation}
              onResetEvaluations={handleResetEvaluations}
              onSaveTrophy={handleSaveTrophy}
              onDeleteTrophy={handleDeleteTrophy}
            />
          </div>
        )
      }

      {/* 5. INVITE MODAL is handled locally in Teams View, but we also have isInviteModalOpen logic used generally... 
          Wait, the generic isInviteModalOpen was used inside Team View in line 1539.
          But if we open it from elsewhere, we might need it globally? 
          Actually, line 1539 uses logic: {isInviteModalOpen && selectedTeamIdForInvite && (...)}.
          If selectedTeamIdForInvite is set, it renders. 
          So we don't need a top-level invite modal unless it's shared.
          But wait, line 1539 was inside renderTeamsView.
          If we are in another view and trigger invite?
          Likely renderTeamsView handles it.
          Let's assume it's covered there or not needed globally.
      */}

      {/* 6. EVALUATION MODAL */}
      {
        isEvaluationModalOpen && selectedPlayerForEvaluation && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="glass-panel text-slate-900 mx-auto w-full max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black">Avaliar Atleta</h2>
                  <p className="text-sm text-slate-500 font-bold">{selectedPlayerForEvaluation.player.name}</p>
                </div>
                <button onClick={() => setIsEvaluationModalOpen(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
              </div>
              <form onSubmit={handleSaveEvaluation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nota Geral (0-10)</label>
                  <input type="number" name="rating" min="0" max="10" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-center text-xl" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Técnica</label>
                    <input type="number" name="technicalScore" min="0" max="100" className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" placeholder="0-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tática</label>
                    <input type="number" name="tacticalScore" min="0" max="100" className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" placeholder="0-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Físico</label>
                    <input type="number" name="physicalScore" min="0" max="100" className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" placeholder="0-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mental</label>
                    <input type="number" name="mentalScore" min="0" max="100" className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" placeholder="0-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comentários / Feedback</label>
                  <textarea name="comments" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 h-24 resize-none" placeholder="Pontos fortes, pontos a melhorar..."></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-200 mt-2">Salvar Avaliação</button>
              </form>
            </div>
          </div>
        )
      }

      {/* GLOBAL NEWS MODAL */}
      {selectedNewsItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 mx-auto w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95">
            {/* Header - No Image, just Gradient */}
            <div className="h-48 relative bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-end p-6">
              <button
                onClick={() => setSelectedNewsItem(null)}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur text-white p-2 rounded-full hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
              <div>
                <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide mb-3 inline-block shadow-md">{selectedNewsItem.category}</span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">{selectedNewsItem.title}</h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedNewsItem.author || 'Redação LocalLegends'}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(selectedNewsItem.date).toLocaleDateString('pt-BR')} • Leitura de 2 min</div>
                  </div>
                </div>
              </div>

              {/* Main Text */}
              <div className="prose dark:prose-invert prose-emerald max-w-none">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                  {selectedNewsItem.content || selectedNewsItem.excerpt}
                </p>
              </div>

              {/* External Link / Stream */}
              {selectedNewsItem.externalLink && (
                <div className="my-6">
                  <a href={selectedNewsItem.externalLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/30 transition transform hover:scale-[1.02]">
                    <Video size={24} />
                    Assistir Transmissão / Vídeo
                  </a>
                </div>
              )}

              {/* Media Gallery */}
              {selectedNewsItem.media && selectedNewsItem.media.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><ImageIcon size={18} /> Galeria de Mídia</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedNewsItem.media.map((media, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden h-40 bg-slate-100 dark:bg-slate-800 relative group cursor-pointer" onClick={() => window.open(media.url, '_blank')}>
                        {media.type === 'VIDEO' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/10">
                            <Play size={32} className="text-white opacity-80" />
                          </div>
                        ) : (
                          <img src={media.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      {
        itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tem certeza?</h3>
                <p className="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita. O item será excluído permanentemente.</p>

                <div className="flex gap-3 w-full">
                  <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancelar</button>
                  <button onClick={executeDeletion} className="flex-1 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-lg shadow-red-200">Excluir</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* INVITE MODAL (Moved to end for z-index stacking) */}
      {isInviteModalOpen && selectedTeamIdForInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in zoom-in-95">
          <div className="glass-panel rounded-2xl p-8 max-w-sm w-full relative">
            <button onClick={() => { setIsInviteModalOpen(false); setSelectedTeamIdForInvite(null); setInviteModalEmail(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 btn-feedback"><X size={20} /></button>
            <h3 className="font-bold text-xl mb-2 text-slate-800">Convidar Membro</h3>
            <p className="text-sm text-slate-500 mb-6">Para <strong>{getTeam(selectedTeamIdForInvite).name}</strong></p>
            <form onSubmit={handleSendInvite}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email do Usuário</label>
              <input type="email" name="email" defaultValue={inviteModalEmail || ''} className="w-full border border-slate-300 rounded-xl p-3 text-sm mb-6 focus:ring-2 focus:ring-emerald-500 outline-none input-focus-effect" placeholder="exemplo@email.com" required />
              <button type="submit" className="btn-feedback w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200">Enviar Convite</button>
            </form>
          </div>
        </div>
      )}

      {/* END APP */}

    </div >
  );
};

export default App;