
import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole, Team, CurrentUser, PlayerStats, SocialConnection } from '../types';
import {
   Camera, Edit2, MapPin, Calendar, Mail, Shield, Crown, Save, X, Activity, Heart, ArrowLeft, Lock, AlertTriangle, Moon, Sun, ChevronDown
} from 'lucide-react';
import { ROLE_DESCRIPTIONS } from '../constants';

interface UserProfileViewProps {
   viewingUser: UserAccount;
   currentUser: CurrentUser;
   teams: Team[];
   socialGraph: SocialConnection[];
   onClose: () => void;
   onUpdateProfile: (updatedUser: UserAccount) => void;
   onFollow: (targetId: string) => void;
   onTeamClick: (teamId: string) => void;
   onDeleteUser?: (userId: string) => void;
   onUploadImage: (file: File) => Promise<string | null>;
   onTogglePlayerRole?: (userId: string, teamId: string, shouldBePlayer: boolean) => void;
   theme: string;
   toggleTheme: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
   viewingUser, currentUser, teams, socialGraph, onClose, onUpdateProfile, onFollow, onTeamClick, onDeleteUser, onUploadImage, onTogglePlayerRole, theme, toggleTheme
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

   // Check if director is also in roster of the ACTIVE team
   const activeTeam = activeTeamId ? teams.find(t => t.id === activeTeamId) : null;
   const isAlsoPlayer = activeTeam ? activeTeam.roster.some(p => p.userId === viewingUser.id) : false;

   const [isEditing, setIsEditing] = useState(false);
   const [isUploading, setIsUploading] = useState(false); // New Loading State

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

   // Calculate Player Stats if applicable for the ACTIVE team
   const getPlayerStats = (): PlayerStats | null => {
      if (viewingUser.role === UserRole.PLAYER && activeTeam) {
         const player = activeTeam.roster.find(p => p.userId === viewingUser.id || p.id === viewingUser.relatedPlayerId);
         if (!player) return activeTeam.roster[0]?.stats || null; // Fallback
         return player?.stats || null;
      }
      return null;
   };

   const playerStats = getPlayerStats();

   // Sync activeTeamId when viewingUser changes
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
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20 pt-32 md:pt-0 relative z-30">
         <button onClick={onClose} className="absolute top-4 left-4 md:static flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 transition z-50 bg-white/50 backdrop-blur md:bg-transparent rounded-full px-3 py-1">
            <ArrowLeft size={16} /> Voltar
         </button>

         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">

            {/* COVER PHOTO */}
            <div className="h-48 md:h-64 bg-slate-200 relative group">
               {formData.cover ? (
                  <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-slate-800"></div>
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
                              {formData.role !== viewingUser.role && (
                                 <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Permissões serão alteradas.
                                 </span>
                              )}
                           </div>
                        ) : (
                           <>
                              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                                 {viewingUser.name}
                                 {viewingUser.role === UserRole.DIRECTOR && <Crown size={20} className="text-amber-500" />}
                                 {viewingUser.role === UserRole.REFEREE && <Shield size={20} className="text-purple-500" />}
                              </h1>
                              <p className="text-slate-500 font-medium">{ROLE_DESCRIPTIONS[viewingUser.role].split(',')[0]}</p>
                              {isSelf && viewingUser.role === UserRole.DIRECTOR && onTogglePlayerRole && viewingUser.teamId && (
                                 <div className="mt-2 flex items-center gap-2">
                                    <label className="flex items-center cursor-pointer relative">
                                       <input
                                          type="checkbox"
                                          className="sr-only peer"
                                          checked={isAlsoPlayer}
                                          onChange={(e) => onTogglePlayerRole(viewingUser.id, viewingUser.teamId!, e.target.checked)}
                                       />
                                       <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                       <span className="ml-3 text-xs font-bold text-slate-600">Atuar como Jogador</span>
                                    </label>
                                 </div>
                              )}
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
                           {isDirector && onDeleteUser && (
                              <button
                                 onClick={() => onDeleteUser(viewingUser.id)}
                                 className="px-3 py-2 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition"
                                 title="Excluir Usuário"
                              >
                                 <X size={16} />
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* LEFT COL: INFO */}
                  <div className="md:col-span-2 space-y-8">

                     {/* BIO SECTION */}
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">Sobre</h3>
                        {isEditing ? (
                           <textarea
                              value={formData.bio}
                              onChange={(e) => handleChange('bio', e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                              rows={4}
                              placeholder="Conte um pouco sobre você..."
                           />
                        ) : (
                           <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                              {viewingUser.bio || <span className="italic text-slate-400">Este usuário ainda não escreveu uma bio.</span>}
                           </p>
                        )}

                        <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                           <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-slate-400" />
                              {isEditing ? (
                                 <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    className="border-b border-slate-300 bg-transparent focus:outline-none w-48"
                                    placeholder="Cidade, UF"
                                 />
                              ) : (
                                 viewingUser.location || 'Localização não definida'
                              )}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Mail size={14} className="text-slate-400" />
                              {viewingUser.email}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400" /> Membro desde 2024
                           </div>
                        </div>
                     </div>

                     {/* SECURITY SECTION (Edit Only) */}
                     {isEditing && (
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                           <h3 className="font-bold text-yellow-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              <Lock size={14} /> Segurança
                           </h3>
                           <div>
                              <label className="block text-xs font-bold text-yellow-700 uppercase mb-1">Nova Senha</label>
                              <input
                                 type="password"
                                 value={formData.password}
                                 onChange={(e) => handleChange('password', e.target.value)}
                                 className="w-full p-2 border border-yellow-200 rounded text-sm focus:outline-none focus:border-yellow-500"
                              />
                           </div>
                        </div>
                     )}

                     {/* STATS SECTION (Player Only) */}
                     {playerStats && !isEditing && (
                        <div className="animate-in fade-in">
                           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Activity size={18} className="text-emerald-500" /> Estatísticas da Temporada {activeTeam && <span className="text-slate-400 text-xs">({activeTeam.name})</span>}
                           </h3>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-emerald-600">{playerStats.goals}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Gols</div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-blue-600">{playerStats.assists}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Assists</div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-slate-800">{playerStats.matchesPlayed}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Jogos</div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                 <div className="text-3xl font-bold text-yellow-500">{playerStats.yellowCards}</div>
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Cartões</div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* RIGHT COL: SIDEBAR */}
                  <div className="space-y-6">

                     {/* SETTINGS CARD (Theme) - Only for Self */}
                     {isSelf && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors duration-300">
                           <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                              Configurações
                           </h3>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                 {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                 Modo Escuro
                              </span>
                              <button
                                 onClick={toggleTheme}
                                 className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              >
                                 <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </button>
                           </div>
                        </div>
                     )}

                     {/* TEAM CARD */}
                     <div>
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">
                              {viewingUser.role === UserRole.FAN ? 'Time do Coração' : 'Vínculo / Times'}
                           </h3>
                           {allUserTeams.length > 1 && !isEditing && (
                              <div className="relative">
                                 <select
                                    value={activeTeamId || ''}
                                    onChange={(e) => setActiveTeamId(e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-1 pr-8 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                 >
                                    {allUserTeams.map(t => (
                                       <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-2 top-1.5 text-slate-400 pointer-events-none" />
                              </div>
                           )}
                        </div>

                        {isEditing && canEditTeam ? (
                           <select
                              value={formData.teamId}
                              onChange={(e) => handleChange('teamId', e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm mb-2"
                           >
                              <option value="">Nenhum time selecionado</option>
                              {teams.map(t => (
                                 <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                           </select>
                        ) : (
                           activeTeam ? (
                              <div onClick={() => onTeamClick(activeTeam.id)} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                                    <Crown size={48} />
                                 </div>
                                 <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{ backgroundColor: activeTeam.logoColor }}>
                                       {activeTeam.shortName}
                                    </div>
                                    <div>
                                       <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">{activeTeam.name}</div>
                                       <div className="text-xs text-slate-500 dark:text-slate-400">{activeTeam.city}</div>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-400 italic text-center">
                                 Nenhum time vinculado.
                              </div>
                           )
                        )}
                        {isEditing && !canEditTeam && activeTeam && (
                           <p className="text-[10px] text-slate-400 mt-2">
                              * O vínculo do time para Diretores, Técnicos e Jogadores é estrutural e não pode ser alterado aqui. Saia do time atual para entrar em outro.
                           </p>
                        )}
                     </div>

                     {/* SOCIAL STATS */}
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">Comunidade</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="text-center">
                              <div className="text-xl font-bold text-slate-900 dark:text-white">{socialGraph.filter(s => s.targetId === viewingUser.id).length}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold">Seguidores</div>
                           </div>
                           <div className="text-center">
                              <div className="text-xl font-bold text-slate-900 dark:text-white">{socialGraph.filter(s => s.followerId === viewingUser.id).length}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-bold">Seguindo</div>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>
         </div>
      </div >
   );
};

export default UserProfileView;
