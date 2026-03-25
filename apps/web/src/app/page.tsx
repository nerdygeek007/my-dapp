"use client";

import { useState, useEffect } from 'react';

// Mock Data structure reflecting our Rust Stylus Contract
type CharacterClass = "Novice" | "Warrior" | "Mage" | "Rogue";

interface CharacterStats {
  level: number;
  xp: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  stamina: number;
  charClass: CharacterClass;
  minted: boolean;
  inventory: number[];
  equippedWeapon: number | null;
  equippedArmor: number | null;
  activeAvatar: string;
  unlockedAvatars: string[];
}

// Global Item Database
export const ITEMS = {
  1: { name: "Rusty Sword", type: "weapon", bonusStr: 2, bonusAgi: 0, bonusInt: 0, bonusVit: 0, rarity: "Common" },
  2: { name: "Apprentice Wand", type: "weapon", bonusStr: 0, bonusAgi: 0, bonusInt: 2, bonusVit: 0, rarity: "Common" },
  3: { name: "Leather Tunic", type: "armor", bonusStr: 0, bonusAgi: 1, bonusInt: 0, bonusVit: 2, rarity: "Common" },
  4: { name: "Mythic Blade", type: "weapon", bonusStr: 20, bonusAgi: 5, bonusInt: 0, bonusVit: 0, rarity: "Legendary" },
  5: { name: "Shadow Cloak", type: "armor", bonusStr: 0, bonusAgi: 15, bonusInt: 0, bonusVit: 5, rarity: "Rare" },
};

const INITIAL_STATS: CharacterStats = {
  level: 1,
  xp: 0,
  strength: 10,
  agility: 10,
  intelligence: 10,
  vitality: 10,
  stamina: 100,
  charClass: "Novice",
  minted: false,
  inventory: [],
  equippedWeapon: null,
  equippedArmor: null,
  activeAvatar: "default",
  unlockedAvatars: ["default"],
};

const QUESTS = [
  { id: "q1", name: "The Shadow Labyrinth", reqLevel: 3, reqStat: "agility", reqStatAmount: 15, rewardAvatar: "shadow_assassin", rewardName: "Shadow Assassin", desc: "Requires immense speed to navigate without triggering traps." },
  { id: "q2", name: "The Arcane Spire", reqLevel: 5, reqStat: "intelligence", reqStatAmount: 25, rewardAvatar: "arch_mage", rewardName: "Arch Mage", desc: "Requires deep intellect to decipher the entrance runes." },
  { id: "q3", name: "World Boss: Ancient Dragon", reqLevel: 8, reqStat: "strength", reqStatAmount: 40, rewardAvatar: "dragon_slayer", rewardName: "Dragon Slayer", desc: "A brutal raid requiring raw physical power to crack its scales." }
];

const MAX_STAMINA = 100;
const XP_FOR_NEXT_LEVEL = (level: number) => level * level * 50;

export default function Home() {
  const [stats, setStats] = useState<CharacterStats>(INITIAL_STATS);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "arena" | "collections" | "quests">("dashboard");

  // Arena State
  const [arenaLog, setArenaLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState(false);

  // --- SAVE SYSTEM (Local Storage) ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dsi_rpg_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStats(prev => ({
          ...prev,
          ...parsed,
          unlockedAvatars: parsed.unlockedAvatars || ["default"],
          activeAvatar: parsed.activeAvatar || "default"
        }));
      }
    } catch (e) {
        console.error("Failed to load save file.");
    }
  }, []);

  useEffect(() => {
    if (stats.minted) {
      localStorage.setItem('dsi_rpg_save', JSON.stringify(stats));
    }
  }, [stats]);
  // -----------------------------------

  // Stamina Regeneration Simulation (Boosted for DEV Testing)
  useEffect(() => {
    if (!stats.minted) return;
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        stamina: Math.min(prev.stamina + 5, MAX_STAMINA)
      }));
    }, 250); // +5 Stamina every 250ms (20 Stamina per second) for fast testing
    return () => clearInterval(interval);
  }, [stats.minted]);

  const addLog = (msg: string) => {
    setActionLog(prev => [msg, ...prev].slice(0, 5));
  };

  const mintIdentity = () => {
    setIsMinting(true);
    setTimeout(() => {
      setStats({ ...INITIAL_STATS, minted: true });
      setIsMinting(false);
      addLog("Identity Soulbound to your Wallet!");
    }, 1500);
  };

  const trainStat = (statName: 'strength' | 'agility' | 'intelligence' | 'vitality') => {
    if (stats.stamina < 10) {
      addLog("Not enough stamina to train!");
      return;
    }

    addLog(`Trained ${statName}. +1 ${statName.toUpperCase()}, +20 XP`);

    setStats(prev => {
      let newStats = { ...prev, stamina: prev.stamina - 10, xp: prev.xp + 20 };
      newStats[statName] += 1;
      
      // Level Up Logic
      const required = XP_FOR_NEXT_LEVEL(newStats.level);
      if (newStats.xp >= required) {
        newStats.level += 1;
        setTimeout(() => addLog(`LEVEL UP! You are now level ${newStats.level}!`), 0);
      }

      // Class Evolution Logic
      const { strength: s, agility: a, intelligence: i } = newStats;
      if (s > a && s > i && s > 15) newStats.charClass = "Warrior";
      else if (a > s && a > i && a > 15) newStats.charClass = "Rogue";
      else if (i > s && i > a && i > 15) newStats.charClass = "Mage";

      return newStats;
    });
  };

  const explore = () => {
    if (stats.stamina < 20) {
      addLog("Not enough stamina to explore!");
      return;
    }

    const isWin = Math.random() > 0.4;
    const isLootDrop = Math.random() > 0.7;
    const xpGain = Math.floor(Math.random() * 30 + 10);
    
    let droppedItemId: number | null = null;
    let droppedItemData: any = null;
    
    if (isWin) {
        addLog(`Encounter Won! Gained ${xpGain} XP.`);
        if (isLootDrop) {
            const possibleItems = [1, 2, 3, 4, 5];
            droppedItemId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            droppedItemData = ITEMS[droppedItemId as keyof typeof ITEMS];
            addLog(`🎊 LOOT DROP! Found: ${droppedItemData.name} (${droppedItemData.rarity})`);
        }
    } else {
        addLog(`Encounter Lost. The monster escaped.`);
    }
    
    setStats(prev => {
      const newStats = { ...prev, stamina: prev.stamina - 20 };
      
      if (isWin) {
        newStats.xp += xpGain;
        
        if (droppedItemId !== null) {
            newStats.inventory = [...newStats.inventory, droppedItemId];
        }

        const required = XP_FOR_NEXT_LEVEL(newStats.level);
        if (newStats.xp >= required) {
          newStats.level += 1;
          setTimeout(() => addLog(`LEVEL UP! You are now level ${newStats.level}!`), 0);
        }
      }
      return newStats;
    });
  };

  const equipItem = (itemId: number) => {
    const item = ITEMS[itemId as keyof typeof ITEMS];
    setStats(prev => {
      let newStats = { ...prev };
      if (item.type === "weapon") newStats.equippedWeapon = itemId;
      if (item.type === "armor") newStats.equippedArmor = itemId;
      addLog(`Equipped ${item.name}!`);
      return newStats;
    });
  };

  const unequipItem = (itemId: number) => {
    const item = ITEMS[itemId as keyof typeof ITEMS];
    setStats(prev => {
      let newStats = { ...prev };
      if (item.type === "weapon" && prev.equippedWeapon === itemId) newStats.equippedWeapon = null;
      if (item.type === "armor" && prev.equippedArmor === itemId) newStats.equippedArmor = null;
      addLog(`Unequipped ${item.name}.`);
      return newStats;
    });
  };

  const discardItem = (itemId: number) => {
    setStats(prev => {
      const idx = prev.inventory.indexOf(itemId);
      if (idx === -1) return prev; // Not found
      
      const newInventory = [...prev.inventory];
      newInventory.splice(idx, 1);
      
      let w = prev.equippedWeapon;
      let a = prev.equippedArmor;
      if (w === itemId && !newInventory.includes(itemId)) w = null;
      if (a === itemId && !newInventory.includes(itemId)) a = null;
      
      addLog(`Discarded item into the void.`);
      return { ...prev, inventory: newInventory, equippedWeapon: w, equippedArmor: a };
    });
  };

  // Calculate Effective Stats
  const getEffectiveStat = (statName: 'strength' | 'agility' | 'intelligence' | 'vitality') => {
    let bonus = 0;
    if (stats.equippedWeapon) {
        const wep = ITEMS[stats.equippedWeapon as keyof typeof ITEMS];
        if (statName === 'strength') bonus += wep.bonusStr;
        if (statName === 'agility') bonus += wep.bonusAgi;
        if (statName === 'intelligence') bonus += wep.bonusInt;
        if (statName === 'vitality') bonus += wep.bonusVit;
    }
    if (stats.equippedArmor) {
        const arm = ITEMS[stats.equippedArmor as keyof typeof ITEMS];
        if (statName === 'strength') bonus += arm.bonusStr;
        if (statName === 'agility') bonus += arm.bonusAgi;
        if (statName === 'intelligence') bonus += arm.bonusInt;
        if (statName === 'vitality') bonus += arm.bonusVit;
    }
    return stats[statName] + bonus;
  };

  // --- ARENA LOGIC ---
  const fightInArena = () => {
    if (stats.stamina < 30) {
      setArenaLog(prev => ["Not enough stamina to enter the Arena! (Cost: 30)", ...prev]);
      return;
    }

    setIsFighting(true);
    setArenaLog(["Searching for an opponent on-chain..."]);

    setTimeout(() => {
        // Generate Opponent based on Player level to ensure fair-ish fight
        const oppLevel = Math.max(1, stats.level + Math.floor(Math.random() * 3) - 1);
        const baseStatPool = oppLevel * 10;
        const oppStr = Math.floor(baseStatPool * Math.random());
        const oppAgi = Math.floor((baseStatPool - oppStr) * Math.random());
        const oppInt = Math.floor((baseStatPool - oppStr - oppAgi) * Math.random());
        const oppVit = baseStatPool - oppStr - oppAgi - oppInt;
        
        setArenaLog(prev => [`Match Found! Opponent Level ${oppLevel} (STR:${oppStr} AGI:${oppAgi} INT:${oppInt} VIT:${oppVit})`, ...prev]);
        
        // Consume Stamina
        setStats(prev => ({...prev, stamina: prev.stamina - 30}));

        let playerHP = getEffectiveStat('vitality') * 10;
        let oppHP = oppVit * 10;
        
        const pStr = getEffectiveStat('strength');
        const pAgi = getEffectiveStat('agility');
        
        let round = 1;
        const combatLog: string[] = [];

        while (playerHP > 0 && oppHP > 0 && round < 20) {
            // Player Attack
            let hitChance = 0.7 + (pAgi - oppAgi) * 0.05;
            if (Math.random() < hitChance) {
                let dmg = Math.floor(pStr * (1 + Math.random() * 0.5));
                oppHP -= dmg;
                combatLog.push(`Round ${round}: You hit for ${dmg} DMG! (Opponent HP: ${Math.max(0, oppHP)})`);
            } else {
                combatLog.push(`Round ${round}: You swing and MISS!`);
            }

            if (oppHP <= 0) break;

            // Opponent Attack
            let oppHitChance = 0.7 + (oppAgi - pAgi) * 0.05;
            if (Math.random() < oppHitChance) {
                let dmg = Math.floor(oppStr * (1 + Math.random() * 0.5));
                playerHP -= dmg;
                combatLog.push(`Round ${round}: Opponent hits you for ${dmg} DMG! (Your HP: ${Math.max(0, playerHP)})`);
            } else {
                combatLog.push(`Round ${round}: Opponent MISSED you!`);
            }
            round++;
        }

        const isWin = playerHP > 0;
        
        let logDelay = 0;
        combatLog.forEach((msg, idx) => {
            logDelay += 500;
            setTimeout(() => {
                setArenaLog(prev => [msg, ...prev]);
            }, logDelay);
        });

        setTimeout(() => {
            setIsFighting(false);
            if (isWin) {
                const xpReward = oppLevel * 50;
                setArenaLog(prev => [`🏆 VICTORY! You absorbed ${xpReward} XP from your opponent!`, ...prev]);
                setStats(prev => {
                    let next = {...prev, xp: prev.xp + xpReward};
                    const required = XP_FOR_NEXT_LEVEL(next.level);
                    if (next.xp >= required) {
                        next.level += 1;
                        setArenaLog(p => [`LEVEL UP! You are now Level ${next.level}!`, ...p]);
                    }
                    return next;
                });
            } else {
                setArenaLog(prev => [`💀 DEFEAT! You were knocked out in the Arena.`, ...prev]);
            }
        }, logDelay + 500);

    }, 1000);
  };
  // -------------------

  // --- QUEST LOGIC ---
  const attemptQuest = (questId: string) => {
    const q = QUESTS.find(x => x.id === questId);
    if (!q) return;

    if (stats.level < q.reqLevel) {
        addLog(`Quest Failed: Requires Level ${q.reqLevel}`);
        return;
    }
    
    // Check specific stat
    const effStat = getEffectiveStat(q.reqStat as 'strength'|'agility'|'intelligence'|'vitality');
    if (effStat < q.reqStatAmount) {
        addLog(`Quest Failed: Requires ${q.reqStatAmount} ${q.reqStat.toUpperCase()} (You have ${effStat})`);
        return;
    }

    // Success! Unlock Avatar
    setStats(prev => {
        if (prev.unlockedAvatars.includes(q.rewardAvatar)) {
            addLog(`You have already completed ${q.name}!`);
            return prev;
        }
        addLog(`🏆 QUEST COMPLETE: ${q.name}! Unlocked Avatar: ${q.rewardName}`);
        return {
            ...prev,
            unlockedAvatars: [...prev.unlockedAvatars, q.rewardAvatar],
            activeAvatar: q.rewardAvatar
        };
    });
  };

  const equipAvatar = (avatarId: string) => {
    setStats(prev => ({ ...prev, activeAvatar: avatarId }));
    addLog(`Equipped new Avatar Soul!`);
  };

  // ---------------- Render Helpers ----------------
  const renderStatBar = (label: string, base: number, effective: number, colorClass: string) => {
    const bonus = effective - base;
    const displayVal = bonus > 0 ? `${base} +${bonus}` : `${base}`;
    const percent = Math.min((effective / 50) * 100, 100);
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs font-mono mb-1 text-forge-text">
          <span>{label}</span>
          <span>{displayVal}</span>
        </div>
        <div className="h-2 w-full bg-forge-elevated rounded-full overflow-hidden border border-forge-border">
          <div 
            className={`h-full ${colorClass} stat-bar-fill`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  const getAvatarGradient = () => {
    if (stats.activeAvatar === "shadow_assassin") return "from-purple-900 to-black shadow-purple-900/80 border-purple-500";
    if (stats.activeAvatar === "arch_mage") return "from-indigo-600 to-cyan-500 shadow-cyan-500/80 border-cyan-300";
    if (stats.activeAvatar === "dragon_slayer") return "from-red-700 to-orange-900 shadow-orange-600/80 border-orange-500";

    switch (stats.charClass) {
      case "Warrior": return "from-red-500 to-orange-500 shadow-red-500/50 border-forge-bg";
      case "Mage": return "from-blue-500 to-purple-500 shadow-blue-500/50 border-forge-bg";
      case "Rogue": return "from-green-500 to-emerald-500 shadow-emerald-500/50 border-forge-bg";
      default: return "from-gray-400 to-slate-400 shadow-slate-500/50 border-forge-bg";
    }
  };

  const getAvatarEmoji = () => {
    if (stats.activeAvatar === "shadow_assassin") return "🥷";
    if (stats.activeAvatar === "arch_mage") return "🧙‍♂️";
    if (stats.activeAvatar === "dragon_slayer") return "🐉";
    
    if (stats.charClass === "Warrior") return "⚔️";
    if (stats.charClass === "Mage") return "🔮";
    if (stats.charClass === "Rogue") return "🗡️";
    return "👤";
  };

  // ---------------- Main Render ----------------
  return (
    <main className="min-h-screen bg-grid-magic flex items-center justify-center p-6 relative">
      
      {!stats.minted ? (
        // Landing / Mint UI
        <div className="glass-panel p-10 rounded-2xl max-w-lg w-full text-center animate-glow">
          <h1 className="text-4xl font-bold mb-4 font-sans text-gradient">Dynamic Soulbound Identity</h1>
          <p className="text-forge-muted mb-8 text-sm">
            Forge your on-chain RPG identity powered by Arbitrum Stylus. 
            Level up, train stats, and evolve your class natively on-chain.
          </p>
          <button 
            onClick={mintIdentity}
            disabled={isMinting}
            className="w-full py-4 rounded-xl font-bold font-mono tracking-widest text-forge-bg bg-accent-cyan hover:bg-white transition-all btn-shimmer disabled:opacity-50"
          >
            {isMinting ? "AWAKENING SOUL..." : "MINT IDENTITY"}
          </button>
        </div>
      ) : (
        // The RPG Dashboard HUD
        <div className="max-w-6xl w-full flex flex-col gap-6 relative z-10">
          
          {/* Navigation Header */}
          <div className="glass-panel p-4 rounded-xl flex justify-between items-center w-full">
             <div className="flex gap-4">
                 <button 
                    onClick={() => setCurrentView("dashboard")}
                    className={`font-mono text-sm tracking-widest px-6 py-2 rounded transition-colors ${currentView === 'dashboard' ? 'bg-accent-cyan text-forge-bg font-bold' : 'text-forge-muted hover:text-white'}`}
                 >
                     DASHBOARD
                 </button>
                 <button 
                    onClick={() => setCurrentView("collections")}
                    className={`font-mono text-sm tracking-widest px-4 py-2 rounded transition-colors ${currentView === 'collections' ? 'bg-accent-purple text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-forge-muted hover:text-purple-400'}`}
                 >
                     COLLECTIONS
                 </button>
                 <button 
                    onClick={() => setCurrentView("quests")}
                    className={`font-mono text-sm tracking-widest px-4 py-2 rounded transition-colors ${currentView === 'quests' ? 'bg-accent-amber text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-forge-muted hover:text-amber-400'}`}
                 >
                     QUESTS & RAIDS
                 </button>
                 <button 
                    onClick={() => setCurrentView("arena")}
                    className={`font-mono text-sm tracking-widest px-4 py-2 rounded transition-colors ${currentView === 'arena' ? 'bg-red-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-forge-muted hover:text-red-400'}`}
                 >
                     ARENA
                 </button>
             </div>
             <div className="text-right flex items-center gap-4">
                 <div className="flex flex-col text-right">
                     <span className="text-[10px] font-mono text-forge-muted tracking-widest">STAMINA</span>
                     <span className="font-bold text-accent-lime font-mono">{stats.stamina}/100</span>
                 </div>
                 <div className="h-8 w-1 bg-forge-border"></div>
                 <div className="flex flex-col text-right">
                     <span className="text-[10px] font-mono text-forge-muted tracking-widest">IDENTITY</span>
                     <span className="font-bold text-white font-mono">LVL {stats.level} {stats.charClass.toUpperCase()}</span>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {currentView === "dashboard" && (
                <>
                {/* Avatar & Core Profile (Left Column) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center">
                    {/* Magic Avatar Circle */}
                    <div className={`w-32 h-32 rounded-full mb-6 bg-gradient-to-br ${getAvatarGradient()} shadow-lg animate-float flex items-center justify-center border-4 relative`}>
                        <span className="text-5xl opacity-90 drop-shadow-md">
                          {getAvatarEmoji()}
                        </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white tracking-wide">Level {stats.level}</h2>
                    <div className="text-accent-cyan font-mono text-sm uppercase tracking-widest mb-4">
                        {stats.charClass}
                    </div>

                    {/* XP Bar */}
                    <div className="w-full mt-2">
                        <div className="flex justify-between text-xs font-mono text-forge-muted mb-1">
                        <span>EXPERIENCE</span>
                        <span>{stats.xp} / {XP_FOR_NEXT_LEVEL(stats.level)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-forge-elevated rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-accent-cyan stat-bar-fill shadow-[0_0_10px_rgba(0,212,255,0.8)]" 
                            style={{ width: `${Math.min((stats.xp / XP_FOR_NEXT_LEVEL(stats.level)) * 100, 100)}%` }}
                        />
                        </div>
                    </div>
                    </div>

                    {/* Action Log Widget */}
                    <div className="glass-panel p-4 rounded-2xl flex-grow">
                    <h3 className="text-xs font-mono text-forge-muted mb-3 uppercase tracking-widest">On-Chain Events</h3>
                    <div className="space-y-2">
                        {actionLog.map((log, i) => (
                        <div key={i} className={`text-sm font-mono ${i === 0 ? 'text-white' : 'text-forge-muted'}`}>
                            <span className="text-accent-cyan mr-2">&gt;</span>{log}
                        </div>
                        ))}
                        {actionLog.length === 0 && <div className="text-sm font-mono text-forge-elevated">Awaiting interface sync...</div>}
                    </div>
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Main Stats Grid */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-sm font-mono text-forge-muted mb-6 uppercase tracking-widest">Base Attributes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {renderStatBar("STRENGTH", stats.strength, getEffectiveStat('strength'), "bg-red-500")}
                            {renderStatBar("AGILITY", stats.agility, getEffectiveStat('agility'), "bg-green-500")}
                            {renderStatBar("INTELLIGENCE", stats.intelligence, getEffectiveStat('intelligence'), "bg-blue-500")}
                            {renderStatBar("VITALITY", stats.vitality, getEffectiveStat('vitality'), "bg-yellow-500")}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                            <div className="mb-4 text-sm text-forge-muted">
                            Consume 10 stamina to train a specific attribute. Influences class evolution.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => trainStat('strength')} className="bg-forge-elevated hover:bg-forge-border border border-forge-border p-2 rounded text-xs font-mono text-white transition-colors">TRAIN STR</button>
                            <button onClick={() => trainStat('agility')} className="bg-forge-elevated hover:bg-forge-border border border-forge-border p-2 rounded text-xs font-mono text-white transition-colors">TRAIN AGI</button>
                            <button onClick={() => trainStat('intelligence')} className="bg-forge-elevated hover:bg-forge-border border border-forge-border p-2 rounded text-xs font-mono text-white transition-colors">TRAIN INT</button>
                            <button onClick={() => trainStat('vitality')} className="bg-forge-elevated hover:bg-forge-border border border-forge-border p-2 rounded text-xs font-mono text-white transition-colors">TRAIN VIT</button>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-xl border border-accent-cyan/20 flex flex-col justify-between bg-gradient-to-br from-transparent to-accent-cyan/5">
                            <div className="mb-4 text-sm text-forge-muted">
                            Consume 20 stamina to explore the Wilds. Battle monsters on-chain for massive XP.
                            </div>
                            <button 
                            onClick={explore}
                            className="w-full py-3 rounded-lg font-bold font-mono tracking-widest text-white border border-accent-cyan hover:bg-accent-cyan/20 transition-all btn-shimmer"
                            >
                            EXPLORE {'>'}
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-sm font-mono text-forge-muted mb-4 uppercase tracking-widest flex items-center justify-between">
                            <span>Soulbound Inventory</span>
                            <span className="text-accent-cyan text-xs">ERC-1155 LOOT</span>
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="px-4 py-2 border border-forge-border rounded bg-forge-bg shadow-inner flex flex-col justify-center items-center flex-1">
                                <span className="text-xs text-forge-muted mb-1">Weapon</span>
                                <span className={`text-sm font-bold ${stats.equippedWeapon ? 'text-accent-amber' : 'text-forge-muted'}`}>
                                    {stats.equippedWeapon ? ITEMS[stats.equippedWeapon as keyof typeof ITEMS].name : 'None'}
                                </span>
                            </div>
                            <div className="px-4 py-2 border border-forge-border rounded bg-forge-bg shadow-inner flex flex-col justify-center items-center flex-1">
                                <span className="text-xs text-forge-muted mb-1">Armor</span>
                                <span className={`text-sm font-bold ${stats.equippedArmor ? 'text-accent-purple' : 'text-forge-muted'}`}>
                                    {stats.equippedArmor ? ITEMS[stats.equippedArmor as keyof typeof ITEMS].name : 'None'}
                                </span>
                            </div>
                        </div>

                        {stats.inventory.length === 0 ? (
                            <div className="text-center py-4 text-forge-muted text-sm font-mono">
                            Inventory is empty. Explore to find loot!
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {Object.entries(
                                stats.inventory.reduce((acc, itemId) => {
                                acc[itemId] = (acc[itemId] || 0) + 1;
                                return acc;
                                }, {} as Record<number, number>)
                            ).map(([idStr, count]) => {
                                const itemId = parseInt(idStr);
                                const item = ITEMS[itemId as keyof typeof ITEMS];
                                const isEquipped = stats.equippedWeapon === itemId || stats.equippedArmor === itemId;
                                return (
                                    <div key={itemId} className={`p-3 border rounded flex flex-col justify-between relative ${isEquipped ? 'border-accent-cyan bg-accent-cyan/10' : 'border-forge-border bg-forge-elevated hover:border-forge-text'}`}>
                                        {count > 1 && (
                                            <div className="absolute -top-2 -right-2 bg-forge-bg border border-forge-border text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold text-forge-muted shadow-lg">
                                                {count}
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white mb-2 pr-3">{item.name}</span>
                                        <span className="text-[10px] text-forge-muted mb-3">{item.rarity} {item.type}</span>
                                        {!isEquipped && (
                                            <button 
                                                onClick={() => equipItem(itemId)}
                                                className="w-full py-1 text-[10px] bg-forge-border hover:bg-white hover:text-black rounded transition-colors mt-2"
                                            >
                                                EQUIP
                                            </button>
                                        )}
                                        {isEquipped && (
                                            <div className="flex flex-col gap-1 mt-2">
                                                <span className="text-[10px] text-accent-cyan font-bold text-center">EQUIPPED</span>
                                                <button 
                                                    onClick={() => unequipItem(itemId)}
                                                    className="w-full py-1 text-[10px] bg-forge-elevated hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors"
                                                >
                                                    UNEQUIP
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>
                </div>
                </>
              )}

              {currentView === "collections" && (
                <div className="lg:col-span-12 glass-panel p-8 rounded-2xl flex flex-col min-h-[600px] border-t-4 border-t-accent-purple bg-gradient-to-b from-accent-purple/5 to-transparent">
                    
                    <div className="flex justify-between items-center mb-8 border-b border-forge-border pb-4">
                        <div>
                            <h2 className="text-3xl font-bold font-sans text-white mb-1">Soulbound Collection</h2>
                            <p className="text-forge-muted text-sm">View, inspect, and manage your on-chain inventory items.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono text-accent-cyan">{stats.inventory.length} ITEMS</p>
                        </div>
                    </div>

                    {stats.inventory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-forge-muted font-mono opacity-50 py-20">
                            <span className="text-4xl mb-4 text-accent-cyan">📦</span>
                            <span>Your collection is totally empty.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(
                                stats.inventory.reduce((acc, itemId) => {
                                acc[itemId] = (acc[itemId] || 0) + 1;
                                return acc;
                                }, {} as Record<number, number>)
                            ).map(([idStr, count]) => {
                                const itemId = parseInt(idStr);
                                const item = ITEMS[itemId as keyof typeof ITEMS];
                                const isEquipped = stats.equippedWeapon === itemId || stats.equippedArmor === itemId;
                                return (
                                    <div key={itemId} className={`p-5 border rounded-xl flex flex-col relative ${isEquipped ? 'border-accent-cyan bg-accent-cyan/10' : 'border-forge-border bg-forge-elevated hover:border-forge-text'} transition-colors`}>
                                        {count > 1 && (
                                            <div className="absolute top-4 right-4 bg-forge-bg border border-forge-border text-xs rounded-full w-8 h-8 flex items-center justify-center font-bold text-white shadow-lg">
                                                x{count}
                                            </div>
                                        )}
                                        
                                        <div className="mb-4 pb-4 border-b border-forge-border">
                                          <h4 className="text-lg font-bold text-white mb-1">{item.name}</h4>
                                          <span className="text-xs text-forge-muted uppercase tracking-widest">{item.rarity} {item.type}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-forge-muted mb-6">
                                            {item.bonusStr > 0 && <span className="text-red-400">+{item.bonusStr} STR</span>}
                                            {item.bonusAgi > 0 && <span className="text-green-400">+{item.bonusAgi} AGI</span>}
                                            {item.bonusInt > 0 && <span className="text-blue-400">+{item.bonusInt} INT</span>}
                                            {item.bonusVit > 0 && <span className="text-yellow-400">+{item.bonusVit} VIT</span>}
                                            {item.bonusStr === 0 && item.bonusAgi === 0 && item.bonusInt === 0 && item.bonusVit === 0 && <span>No Combat Stats</span>}
                                        </div>
                                        
                                        {/* Metadata History Mock */}
                                        <div className="bg-forge-bg p-3 rounded-md border border-forge-border mb-6">
                                          <p className="text-[10px] text-forge-muted font-mono break-words leading-relaxed">
                                            <span className="text-accent-purple font-bold block mb-1">ON-CHAIN METADATA</span>
                                            Minted by: {stats.charClass.toUpperCase()} (LVL {stats.level})<br/>
                                            Token Standard: ERC-1155<br/>
                                            Block: {Math.floor(Math.random() * 10000) + 18000000}
                                          </p>
                                        </div>

                                        <div className="mt-auto grid grid-cols-2 gap-3">
                                            {isEquipped ? (
                                                <>
                                                  <span className="col-span-1 flex items-center justify-center text-[10px] text-accent-cyan font-bold bg-accent-cyan/20 rounded">EQUIPPED</span>
                                                  <button onClick={() => unequipItem(itemId)} className="col-span-1 py-2 text-[10px] bg-forge-elevated hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors font-bold tracking-widest">
                                                      UNEQUIP
                                                  </button>
                                                </>
                                            ) : (
                                                <button onClick={() => equipItem(itemId)} className="col-span-2 py-2 text-[10px] bg-forge-border hover:bg-white hover:text-black rounded transition-colors font-bold tracking-widest">
                                                    EQUIP INSTANCE
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                          <button onClick={() => alert("Favorited this item! (Mock)")} className="col-span-1 py-1 text-[10px] text-forge-muted hover:text-white border border-forge-border rounded transition-colors font-bold tracking-widest flex items-center justify-center">
                                            🤍 LIKE
                                          </button>
                                          <button onClick={() => discardItem(itemId)} className="col-span-1 py-1 text-[10px] text-forge-muted hover:bg-red-900/50 hover:text-red-400 hover:border-red-900 border border-forge-border rounded transition-colors font-bold tracking-widest">
                                            🗑️ DISCARD
                                          </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
              )}

              {currentView === "quests" && (
                <div className="lg:col-span-12 glass-panel p-8 rounded-2xl flex flex-col min-h-[600px] border-t-4 border-t-accent-amber bg-gradient-to-b from-accent-amber/5 to-transparent">
                    <div className="flex justify-between items-center mb-8 border-b border-forge-border pb-4">
                        <div>
                            <h2 className="text-3xl font-bold font-sans text-white mb-1">World Events & Quests</h2>
                            <p className="text-forge-muted text-sm">Complete high-level stat constraints to unlock unique Avatar Souls.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {QUESTS.map((q) => {
                            const isCompleted = stats.unlockedAvatars.includes(q.rewardAvatar);
                            const effStat = getEffectiveStat(q.reqStat as any);
                            const meetsLevel = stats.level >= q.reqLevel;
                            const meetsStat = effStat >= q.reqStatAmount;

                            return (
                                <div key={q.id} className={`p-6 border rounded-xl flex flex-col ${isCompleted ? 'border-accent-amber/50 bg-accent-amber/5' : 'border-forge-border bg-forge-elevated'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-white leading-tight">{q.name}</h4>
                                        {isCompleted && <span className="text-xl">🏆</span>}
                                    </div>
                                    <p className="text-xs text-forge-muted mb-6 flex-grow">{q.desc}</p>
                                    
                                    <div className="bg-forge-bg rounded p-3 mb-6 border border-forge-border font-mono text-xs">
                                        <div className="text-[10px] text-forge-muted mb-2 tracking-widest uppercase">Requirements</div>
                                        <div className={`flex justify-between mb-1 ${meetsLevel ? 'text-green-400' : 'text-red-400'}`}>
                                            <span>Level {q.reqLevel}</span>
                                            <span>{meetsLevel ? '✓' : '✗'}</span>
                                        </div>
                                        <div className={`flex justify-between ${meetsStat ? 'text-green-400' : 'text-red-400'}`}>
                                            <span>{q.reqStatAmount} {q.reqStat.toUpperCase()}</span>
                                            <span>{meetsStat ? '✓' : '✗'}</span>
                                        </div>
                                    </div>

                                    {isCompleted ? (
                                        stats.activeAvatar === q.rewardAvatar ? (
                                            <button className="w-full py-3 bg-accent-amber/20 text-accent-amber font-bold font-mono text-xs rounded border border-accent-amber cursor-default">
                                                SOUL EQUIPPED
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => equipAvatar(q.rewardAvatar)}
                                                className="w-full py-3 bg-forge-border hover:bg-white hover:text-black font-bold font-mono text-xs text-white rounded transition-colors"
                                            >
                                                EQUIP {q.rewardName.toUpperCase()}
                                            </button>
                                        )
                                    ) : (
                                        <button 
                                            onClick={() => attemptQuest(q.id)}
                                            disabled={!meetsLevel || !meetsStat}
                                            className="w-full py-3 bg-accent-amber hover:bg-yellow-400 disabled:bg-forge-bg disabled:text-forge-muted disabled:border disabled:border-forge-border text-black font-bold font-mono text-xs rounded transition-colors"
                                        >
                                            ATTEMPT QUEST
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
              )}

              {currentView === "arena" && (
                <div className="lg:col-span-12 glass-panel p-8 rounded-2xl flex flex-col min-h-[600px] border-t-4 border-t-red-500 bg-gradient-to-b from-red-500/5 to-transparent">
                    
                    <div className="flex justify-between items-center mb-8 border-b border-forge-border pb-4">
                        <div>
                            <h2 className="text-3xl font-bold font-sans text-white mb-1">The Proving Grounds</h2>
                            <p className="text-forge-muted text-sm">On-Chain PvP Server Arena (Cost: 30 Stamina)</p>
                        </div>
                        <button 
                            onClick={fightInArena}
                            disabled={isFighting || stats.stamina < 30}
                            className="px-8 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:bg-forge-elevated text-white font-bold tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        >
                            {isFighting ? "SIMULATING COMBAT..." : "FIND OPPONENT"}
                        </button>
                    </div>

                    <div className="flex-grow flex flex-col-reverse bg-forge-bg rounded-xl border border-forge-border p-6 overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(transparent 95%, #ef4444 100%), linear-gradient(90deg, transparent 95%, #ef4444 100%)', backgroundSize: '40px 40px'}}></div>
                        
                        <div className="z-10 flex flex-col gap-2 overflow-y-auto">
                            {arenaLog.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-forge-muted font-mono opacity-50">
                                    <span className="text-4xl mb-4">⚔️</span>
                                    <span>Awaiting challengers...</span>
                                </div>
                            ) : (
                                arenaLog.map((log, i) => {
                                    let colorClass = "text-forge-muted";
                                    if (log.includes("You hit")) colorClass = "text-green-400";
                                    if (log.includes("Opponent hits")) colorClass = "text-red-400";
                                    if (log.includes("VICTORY")) colorClass = "text-yellow-400 font-bold text-lg";
                                    if (log.includes("DEFEAT")) colorClass = "text-red-600 font-bold text-lg";
                                    if (log.includes("Match Found")) colorClass = "text-accent-cyan font-bold";

                                    return (
                                        <div key={i} className={`font-mono text-sm ${colorClass} bg-forge-elevated/50 p-2 rounded backdrop-blur-sm`}>
                                            <span className="opacity-50 select-none mr-2">[{new Date().toISOString().substring(11, 19)}]</span>
                                            {log}
                                            {i === 0 && isFighting && <span className="animate-pulse ml-2 inline-block">_</span>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
              )}
          </div>

        </div>
      )}
    </main>
  );
}