import React, { useState } from 'react';
import { UserAccount, UserRole, SocialConnection, CurrentUser } from '../types';
import { Search, MapPin, UserPlus, UserCheck, Filter, Star, Globe } from 'lucide-react';

interface PlayerDirectoryProps {
    users: UserAccount[];
    currentUser: CurrentUser;
    socialGraph: SocialConnection[];
    onFollow: (targetId: string) => void;
    onViewProfile: (userId: string) => void;
}

const PlayerDirectory: React.FC<PlayerDirectoryProps> = ({
    users, currentUser, socialGraph, onFollow, onViewProfile
}) => {
    const [filterMode, setFilterMode] = useState<'ALL' | 'CITY' | 'FOLLOWING'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Filter Base: Only Players and Coaches (exclude Fans maybe? or include all?)
    // Let's include everyone but emphasize Players.
    // Requirement: "Transfer market" vibe -> Players.
    const allPlayers = users.filter(u => u.role === UserRole.PLAYER || u.role === UserRole.COACH);

    // 2. Apply Filters
    const filteredList = allPlayers.filter(user => {
        // Search Term
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Tabs
        if (filterMode === 'FOLLOWING') {
            return socialGraph.some(s => s.followerId === currentUser.id && s.targetId === user.id);
        }
        if (filterMode === 'CITY') {
            const myCity = currentUser.location || '';
            return user.location === myCity;
        }

        return true; // ALL
    });

    const getFollowStatus = (targetId: string) => {
        return socialGraph.some(s => s.followerId === currentUser.id && s.targetId === targetId);
    };

    return (
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-4">
            {/* HEADER COMPONENT */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">Mercado da Bola</h1>

                {/* SEARCH & FILTER BAR */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar atleta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                        />
                    </div>
                </div>

                {/* TABS */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilterMode('ALL')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${filterMode === 'ALL' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Globe size={14} /> Explorar
                    </button>
                    <button
                        onClick={() => setFilterMode('CITY')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${filterMode === 'CITY' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <MapPin size={14} /> Na Região
                    </button>
                    <button
                        onClick={() => setFilterMode('FOLLOWING')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${filterMode === 'FOLLOWING' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Star size={14} /> Seguindo
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredList.length > 0 ? filteredList.map(user => {
                    const isFollowing = getFollowStatus(user.id);
                    const isMe = user.id === currentUser.id;

                    return (
                        <div key={user.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center relative group hover:border-emerald-500 transition-colors h-full justify-between">

                            <div className="flex flex-col items-center w-full">
                                {/* Header Image/Badge Placeholder */}
                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-t-2xl z-0"></div>

                                <div
                                    onClick={() => onViewProfile(user.id)}
                                    className="relative z-10 w-20 h-20 rounded-full border-4 border-white dark:border-slate-900 shadow-md mb-3 cursor-pointer overflow-hidden bg-slate-200"
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl bg-slate-100">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <h3 onClick={() => onViewProfile(user.id)} className="font-bold text-slate-900 dark:text-white truncate w-full cursor-pointer hover:text-emerald-600 mb-1 z-10 relative">
                                    {user.name}
                                </h3>

                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase z-10 relative mb-4">
                                    <MapPin size={10} /> {user.location || 'Sem Local'}
                                </div>
                            </div>

                            {!isMe && (
                                <button
                                    onClick={() => onFollow(user.id)}
                                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition z-10 relative ${isFollowing
                                        ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-none'
                                        }`}
                                >
                                    {isFollowing ? <><UserCheck size={14} /> Seguindo</> : <><UserPlus size={14} /> Seguir</>}
                                </button>
                            )}
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-12 text-center text-slate-400 opacity-60">
                        <Filter className="mx-auto mb-2" />
                        <p>Nenhum jogador encontrado com estes filtros.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerDirectory;
