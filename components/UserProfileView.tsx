
import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, Team, CurrentUser, PlayerStats, SocialConnection, Match, PlayerEvaluation, MatchStatus, Trophy as TrophyType } from '../types';
import {
   Camera, Edit2, MapPin, Calendar, Mail, Shield, Crown, Save, X, Activity, Heart, ArrowLeft, Lock, AlertTriangle, Moon, Sun, ChevronDown, Trash2, Trophy
} from 'lucide-react';
import { ROLE_DESCRIPTIONS } from '../constants';

interface UserProfileViewProps {
   viewingUser: UserAccount;
   currentUser: CurrentUser;
   teams: Team[];
   socialGraph: SocialConnection[];
   matches: Match[];
   evaluations: PlayerEvaluation[];
   trophies: TrophyType[];
   onClose: () => void;
   onUpdateProfile: (updatedUser: UserAccount) => void;
   onFollow: (targetId: string) => void;
   onTeamClick: (teamId: string) => void;
   onDeleteUser?: (userId: string) => void;
   onUploadImage: (file: File) => Promise<string | null>;
   onTogglePlayerRole?: (userId: string, teamId: string, shouldBePlayer: boolean) => void;
   theme: string;
   toggleTheme: () => void;
   onDeleteEvaluation?: (id: string) => void;
   onResetEvaluations?: (playerId: string) => void;
   onSaveTrophy?: (trophy: Omit<TrophyType, 'id'>) => void;
   onDeleteTrophy?: (id: string) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
   viewingUser, currentUser, teams, socialGraph, matches, evaluations, trophies, onClose, onUpdateProfile, onFollow, onTeamClick, onDeleteUser, onUploadImage, onTogglePlayerRole, theme, toggleTheme, onDeleteEvaluation, onResetEvaluations, onSaveTrophy, onDeleteTrophy
}) => {
   const isSelf = currentUser.id === viewingUser.id;
   const isFollowing = socialGraph.some(s => s.followerId === currentUser.id && s.targetId === viewingUser.id);
   const isDirector = currentUser.role === UserRole.DIRECTOR;

   // Get all teams user is part of (Roster or Primary Link)
   const allUserTeams = teams.filter(t =>
      t.id === viewingUser.teamId ||
      t.roster.some(p => p.userId === viewingUser.id)
   );

   // Local state for which team to view details for
   const [activeTeamId, setActiveTeamId] = useState<string | null>(viewingUser.teamId || (allUserTeams.length > 0 ? allUserTeams[0].id : null));

   const activeTeam = activeTeamId ? teams.find(t => t.id === activeTeamId) : null;
   const isAlsoPlayer = activeTeam ? activeTeam.roster.some(p => p.userId === viewingUser.id) : false;

   const [isEditing, setIsEditing] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
   const [showAllEvaluations, setShowAllEvaluations] = useState(false);

   // Form State
   const [formData, setFormData] = useState({
      name: viewingUser.name,
      email: viewingUser.email,
      password: viewingUser.password,
      role: viewingUser.role,
      location: viewingUser.location || '',
      bio: viewingUser.bio || '',
      avatar: viewingUser.avatar || '',
      cover: viewingUser.cover || '',
      teamId: viewingUser.teamId || ''
   });

   const getPlayerStats = (): PlayerStats | null => {
      if (activeTeam) {
         const player = activeTeam.roster.find(p => p.userId === viewingUser.id || p.id === viewingUser.relatedPlayerId);
         if (player) {
            return player.stats || { goals: 0, assists: 0, matchesPlayed: 0, yellowCards: 0, redCards: 0 };
         }
      }
      return null;
   };

   const playerStats = getPlayerStats();
   const targetPlayerId = viewingUser.relatedPlayerId || activeTeam?.roster.find(p => p.userId === viewingUser.id)?.id;
   const userEvaluations = evaluations.filter(e => e.playerId === targetPlayerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

   const recentMatches = activeTeamId
      ? matches
         .filter(m => (m.homeTeamId === activeTeamId || m.awayTeamId === activeTeamId) && m.status === MatchStatus.FINISHED)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 5)
      : [];

   useEffect(() => {
      if (viewingUser.teamId) setActiveTeamId(viewingUser.teamId);
      else if (allUserTeams.length > 0) setActiveTeamId(allUserTeams[0].id);
   }, [viewingUser.id, allUserTeams.length]);

   const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateProfile({
         ...viewingUser,
         ...formData
      });
      setIsEditing(false);
   };

   const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
   };

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover') => {
      const file = e.target.files?.[0];
      if (file) {
         setIsUploading(true);
         try {
            const url = await onUploadImage(file);
            if (url) {
               handleChange(field, url);
            }
         } catch (error) {
            console.error("Upload failed", error);
            alert("Erro ao fazer upload da imagem.");
         } finally {
            setIsUploading(false);
         }
      }
   };

   const canEditTeam = viewingUser.role === UserRole.FAN;

   return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20 pt-2 md:pt-0 relative z-30">
         <button onClick={onClose} className="absolute top-4 left-4 md:static flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 transition z-50 bg-white/50 backdrop-blur md:bg-transparent rounded-full px-3 py-1">
            <ArrowLeft size={16} /> Voltar
         </button>

         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">

            {/* COVER PHOTO */}
            <div className="h-48 md:h-64 bg-slate-200 relative group">
               {formData.cover ? (
                  <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                  <div
                     className="w-full h-full transition-colors duration-500"
                     style={{
                        background: (activeTeam?.primaryColor || activeTeam?.logoColor)
                           ? `linear-gradient(135deg, ${activeTeam.primaryColor || activeTeam.logoColor}, ${activeTeam.secondaryColor || '#1f2937'})`
                           : undefined
                     }}
                  >
                     {(!activeTeam?.primaryColor && !activeTeam?.logoColor) && <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-slate-800"></div>}
                  </div>
               )}

               {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                     <div className="w-full max-w-xs px-4 text-center">
                        <label className="block text-white text-xs font-bold mb-2 shadow-black drop-shadow-md cursor-pointer bg-white/20 backdrop-blur px-4 py-2 rounded-full hover:bg-white/30 transition">
                           <Camera size={20} className="inline mr-2" /> Alterar Capa
                           <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'cover')}
                              className="hidden"
                           />
                        </label>
                        {isUploading && <span className="text-white text-xs font-bold animate-pulse">Enviando...</span>}
                     </div>
                  </div>
               )}
            </div>

            {/* PROFILE HEADER CONTENT */}
            <div className="px-6 md:px-8 pb-8">
               <div className="relative flex flex-col md:flex-row justify-between items-end -mt-16 md:-mt-12 mb-6 gap-4">

                  {/* AVATAR & NAME */}
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto">
                     <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg overflow-hidden">
                           {formData.avatar ? (
                              <img src={formData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                           ) : (
                              <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center text-4xl font-bold">
                                 {viewingUser.name.charAt(0)}
                              </div>
                           )}
                        </div>
                        {isEditing && (
                           <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden">
                              <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition">
                                 <span className="text-white text-[10px] font-bold">Alterar</span>
                                 <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'avatar')}
                                    className="hidden"
                                 />
                              </label>
                           </div>
                        )}
                        {isEditing && <div className="absolute -right-1 top-0 bg-emerald-500 text-white p-1.5 rounded-full shadow-sm pointer-events-none"><Camera size={14} /></div>}
                     </div>

                     <div className="mb-1 w-full md:w-auto">
                        {isEditing ? (
                           <div className="flex flex-col gap-2 w-full">
                              <input
                                 type="text"
                                 value={formData.name}
                                 onChange={(e) => handleChange('name', e.target.value)}
                                 className="text-2xl font-bold text-slate-900 border-b border-slate-300 focus:border-emerald-500 focus:outline-none bg-transparent w-full md:w-auto"
                              />
                              <select
                                 value={formData.role}
                                 onChange={(e) => handleChange('role', e.target.value)}
                                 className="text-sm border rounded p-1 font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              >
                                 <option value={UserRole.FAN}>Torcedor</option>
                                 <option value={UserRole.PLAYER}>Jogador</option>
                                 <option value={UserRole.COACH}>Técnico</option>
                                 <option value={UserRole.DIRECTOR}>Diretor</option>
                                 <option value={UserRole.REFEREE}>Árbitro</option>
                              </select>
                           </div>
                        ) : (
                           <>
                              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                                 {viewingUser.name}
                                 {viewingUser.role === UserRole.DIRECTOR && <Crown size={20} className="text-amber-500" />}
                                 {viewingUser.role === UserRole.REFEREE && <Shield size={20} className="text-purple-500" />}
                              </h1>
                              <p className="text-slate-500 font-medium">{ROLE_DESCRIPTIONS[viewingUser.role].split(',')[0]}</p>
                           </>
                        )}
                     </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                     {isSelf ? (
                        isEditing ? (
                           <>
                              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold text-sm transition flex items-center gap-2">
                                 <X size={16} /> Cancelar
                              </button>
                              <button onClick={handleSave} className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-200">
                                 <Save size={16} /> Salvar
                              </button>
                           </>
                        ) : (
                           <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm transition flex items-center gap-2 shadow-sm">
                              <Edit2 size={16} /> Editar Perfil
                           </button>
                        )
                     ) : (
                        <div className="flex gap-2">
                           <button
                              onClick={() => onFollow(viewingUser.id)}
                              className={`px-6 py-2 rounded-full font-bold transition shadow flex items-center gap-2 ${isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500' : 'bg-slate-900 text-white hover:bg-slate-800'
                                 }`}
                           >
                              <Heart size={16} className={isFollowing ? 'fill-current' : ''} />
                              {isFollowing ? 'Seguindo' : 'Seguir'}
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                     {/* INFO SECTION */}
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">Sobre</h3>
                        {isEditing ? (
                           <textarea
                              value={formData.bio}
                              onChange={(e) => handleChange('bio', e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                              rows={4}
                           />
                        ) : (
                           <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                              {viewingUser.bio || <span className="italic text-slate-400">Este usuário ainda não escreveu uma bio.</span>}
                           </p>
                        )}
                        <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                           <div className="flex items-center gap-1.5"><MapPin size={14} /> {viewingUser.location || 'Localização não definida'}</div>
                           <div className="flex items-center gap-1.5"><Mail size={14} /> {viewingUser.email}</div>
                        </div>
                     </div>

                     {/* STATS SECTION */}
                     {playerStats && !isEditing && (
                        <div className="animate-in fade-in">
                           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                              <Activity size={18} className="text-emerald-500" /> Estatísticas
                           </h3>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-emerald-600">{playerStats.goals}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Gols</div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-blue-600">{playerStats.assists}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Assis.</div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{playerStats.matchesPlayed}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Jogos</div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-yellow-500">{playerStats.yellowCards}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Cartões</div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* EVALUATIONS */}
                     {!isEditing && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wide">
                                 <Activity size={16} className="text-emerald-500" /> Avaliações
                              </h3>
                           </div>
                           {userEvaluations.length > 0 ? (
                              <div className="space-y-4">
                                 {userEvaluations.slice(0, 3).map(ev => (
                                    <div key={ev.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                                       <div className="flex justify-between items-center mb-2">
                                          <div className="text-xs font-bold text-slate-400">{new Date(ev.createdAt).toLocaleDateString()}</div>
                                          <div className="bg-emerald-500 text-white px-2 py-0.5 rounded text-xs font-bold">{ev.rating.toFixed(1)}</div>
                                       </div>
                                       <p className="text-xs italic text-slate-600 dark:text-slate-300">"{ev.comments}"</p>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <p className="text-xs text-slate-400 italic">Nenhuma avaliação ainda.</p>
                           )}
                        </div>
                     )}
                  </div>

                  <div className="space-y-6">
                     {/* SETTINGS (Theme) */}
                     {isSelf && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Modo Escuro</span>
                              <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition ${theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                 <div className={`w-4 h-4 rounded-full bg-white transition ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                              </button>
                           </div>
                        </div>
                     )}

                     {/* TEAM CARD */}
                     {activeTeam && (
                        <div onClick={() => onTeamClick(activeTeam.id)} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-emerald-500 transition">
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Time Atual</h3>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: activeTeam.logoColor }}>
                                 {activeTeam.shortName}
                              </div>
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{activeTeam.name}</div>
                           </div>
                        </div>
                     )}

                     {/* COMMUNITY STATS */}
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Comunidade</h3>
                        <div className="flex justify-around">
                           <div className="text-center">
                              <div className="text-lg font-bold text-slate-900 dark:text-white">{socialGraph.filter(s => s.targetId === viewingUser.id).length}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Seguidores</div>
                           </div>
                           <div className="text-center">
                              <div className="text-lg font-bold text-slate-900 dark:text-white">{socialGraph.filter(s => s.followerId === viewingUser.id).length}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Seguindo</div>
                           </div>
                        </div>
                     </div>

                     {/* ACHIEVEMENTS CARD */}
                     <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition"><Trophy size={48} /></div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-xs uppercase tracking-wide flex items-center gap-2">
                           <Trophy size={14} className="text-amber-500" /> Conquistas
                        </h3>

                        <div className="space-y-2">
                           {trophies.filter(tr => tr.playerId === viewingUser.id || (targetPlayerId && tr.playerId === targetPlayerId)).length > 0 ? (
                              trophies.filter(tr => tr.playerId === viewingUser.id || (targetPlayerId && tr.playerId === targetPlayerId)).map(tr => (
                                 <div key={tr.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/60 dark:bg-white/5 border border-amber-100 dark:border-amber-900/20 group/trophy">
                                    <div className="flex items-center gap-2 min-w-0">
                                       <Trophy size={12} className="text-amber-500" />
                                       <div className="min-w-0">
                                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{tr.name}</div>
                                       </div>
                                    </div>
                                    {isDirector && onDeleteTrophy && (
                                       <button onClick={() => { if (confirm("Remover conquista?")) onDeleteTrophy(tr.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/trophy:opacity-100 transition"><X size={12} /></button>
                                    )}
                                 </div>
                              ))
                           ) : (
                              <div className="py-4 text-center text-[10px] text-slate-400 italic">Sem conquistas ainda.</div>
                           )}


                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default UserProfileView;
