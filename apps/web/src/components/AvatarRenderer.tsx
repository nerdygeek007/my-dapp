import React from 'react';

export interface AvatarTraits {
  background: string;
  primaryColor: string;
  secondaryColor: string;
  headpiece: string; // 'hood' | 'mask' | 'horns' | 'crown' | 'helmet' | 'none'
  weapon: string; // 'shuriken' | 'kunai' | 'staff' | 'spellbook' | 'sword' | 'axe' | 'none'
  auraType: 'smooth' | 'spiked' | 'runic' | 'none';
  weather: 'rain' | 'snow' | 'embers' | 'none';
  familiar: 'wyvern' | 'wisp' | 'crow' | 'none';
}

interface Props {
  baseType: string;
  traits: AvatarTraits;
  size?: number;
  className?: string;
  isMythic?: boolean;
  level?: number;
}

export const AvatarRenderer: React.FC<Props> = ({ baseType, traits, size = 100, className = '', isMythic = false, level = 1 }) => {
  const viewBox = "0 0 100 100";
  const center = 50;

  // Shared Aura Layer
  const renderAura = () => {
    switch (traits.auraType) {
      case 'smooth': return <circle cx={center} cy={center} r={44} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={6} />;
      case 'spiked': return <path d="M50 2 L55 15 L75 10 L65 25 L85 35 L70 45 L85 55 L65 65 L75 80 L55 75 L50 90 L45 75 L25 80 L35 65 L15 55 L30 45 L15 35 L35 25 L25 10 L45 15 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />;
      case 'runic': return <circle cx={center} cy={center} r={46} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="5, 15, 10, 5" className="animate-[spin_20s_linear_infinite]" />;
      default: 
        // Shadow Assassin Evolution: Shadow Tendrils at Level 25+
        if (baseType === 'shadow_assassin' && (level || 0) >= 25) {
          return (
            <g className="animate-pulse opacity-40">
                <path d="M50 5 Q 70 0 90 20 T 70 80 Q 50 100 30 80 T 10 20 Q 30 0 50 5" fill="none" stroke={traits.primaryColor} strokeWidth={1} />
                <path d="M50 15 Q 65 10 80 25 T 65 75 Q 50 90 35 75 T 20 25 Q 35 10 50 15" fill="none" stroke={traits.primaryColor} strokeWidth={0.5} strokeDasharray="2,4" />
            </g>
          );
        }
        return null;
    }
  };

  // 5. Familiars Layer (Floating SVG Companions)
  const renderFamiliar = () => {
    switch(traits.familiar) {
        case 'wyvern':
            return (
                <g className="animate-float" transform="translate(15, 30)">
                    <path d="M 0 0 L 5 10 L 0 20 L -5 10 Z" fill="#b91c1c" />
                    <circle cx="0" cy="5" r="2" fill="#facc15" />
                    <path d="M -5 5 Q -15 0 -5 15 Z" fill="#991b1b" />
                    <path d="M 5 5 Q 15 0 5 15 Z" fill="#991b1b" />
                </g>
            );
        case 'wisp':
            return (
                <g className="animate-pulse" transform="translate(20, 25)">
                    <circle cx="0" cy="0" r="6" fill="#60a5fa" />
                    <circle cx="0" cy="0" r="10" fill="#93c5fd" opacity="0.4" />
                    <circle cx="0" cy="0" r="15" fill="#bfdbfe" opacity="0.2" />
                </g>
            );
        case 'crow':
            return (
                <g className="animate-float" transform="translate(80, 20)">
                    <ellipse cx="0" cy="0" rx="6" ry="4" fill="#111827" />
                    <polygon points="-6,0 -12,-5 -5,-2" fill="#111827" />
                    <polygon points="6,0 12,5 5,2" fill="#111827" />
                    <circle cx="-2" cy="-1" r="1" fill="#dc2626" />
                </g>
            );
        default: return null;
    }
  };

  // 6. Weather FX Layer (Post-Processing)
  const renderWeather = () => {
      switch(traits.weather) {
          case 'rain':
              return (
                  <g className="opacity-40">
                      {[...Array(20)].map((_, i) => (
                          <line key={i} x1={Math.random()*120} y1={-20} x2={Math.random()*100 - 20} y2={120} stroke="#93c5fd" strokeWidth="1" strokeDasharray="10,20" />
                      ))}
                  </g>
              );
          case 'snow':
              return (
                  <g className="opacity-60">
                      {[...Array(15)].map((_, i) => (
                          <circle key={i} cx={Math.random()*100} cy={Math.random()*100} r={Math.random()*1.5 + 0.5} fill="#ffffff" />
                      ))}
                  </g>
              );
          case 'embers':
              return (
                  <g className="animate-pulse opacity-70">
                      {[...Array(12)].map((_, i) => (
                          <circle key={i} cx={Math.random()*100} cy={Math.random()*100} r={Math.random()*2} fill="#f87171" className="animate-pulse" />
                      ))}
                  </g>
              );
          default: return null;
      }
  };

  // --- COLLECTION 1: SHADOW ASSASSINS ---
  const renderAssassin = () => {
    return (
      <g>
        {/* Assassin Shoulders & Gi */}
        <path d="M20 90 L30 55 L50 45 L70 55 L80 90 Z" fill={traits.primaryColor} />
        {/* V-neck fold */}
        <path d="M40 50 L50 65 L60 50 Z" fill={traits.secondaryColor} opacity={0.8} />
        {/* Head Shape */}
        <circle cx={50} cy={35} r={18} fill="#111827" />
        {/* Ninja Mask Wrap */}
        {traits.headpiece === 'mask' && (
           <path d="M30 35 Q50 45 70 35 L65 45 Q50 55 35 45 Z" fill={traits.primaryColor} />
        )}
        {traits.headpiece === 'hood' && (
           <path d="M28 35 C 28 5, 72 5, 72 35 C 72 45, 60 55, 50 55 C 40 55, 28 45, 28 35 Z" fill={traits.primaryColor} opacity={0.9} />
        )}
        {/* Slit Eyes */}
        <rect x={38} y={30} width={24} height={6} fill="#000" />
        <circle cx={43} cy={33} r={1.5} fill="#fff" />
        <circle cx={57} cy={33} r={1.5} fill="#fff" />
        {/* Shadow Assassin Evolution: Void-tears at Level 10+ */}
        {(level || 0) >= 10 && (
           <g>
              <rect x={42} y={35} width={1} height={6} fill="#60a5fa" opacity={0.6} />
              <rect x={57} y={35} width={1} height={6} fill="#60a5fa" opacity={0.6} />
           </g>
        )}
        {/* Assassin Weapon */}
        {traits.weapon === 'shuriken' && <path d="M75 60 L80 65 L90 65 L85 70 L90 80 L80 75 L75 85 L70 75 L60 80 L65 70 L60 65 L70 65 Z" fill="#94a3b8" />}
        {traits.weapon === 'kunai' && <path d="M85 50 L88 65 L85 70 L82 65 Z" fill="#cbd5e1" />}
      </g>
    );
  };

  // --- COLLECTION 2: ARCH MAGES ---
  const renderMage = () => {
    return (
      <g>
        {/* Mage Robes */}
        <path d="M15 95 C 20 60, 35 40, 50 35 C 65 40, 80 60, 85 95 Z" fill={traits.primaryColor} />
        {/* Inner Robe Trim */}
        <path d="M40 35 L45 95 L55 95 L60 35 Z" fill={traits.secondaryColor} opacity={0.6} />
        {/* Floating Collar */}
        <path d="M35 40 Q50 50 65 40 L60 48 Q50 55 40 48 Z" fill={traits.primaryColor} stroke="#fff" strokeWidth="1" />
        {/* Glowing Head / True Void */}
        <circle cx={50} cy={28} r={15} fill="#000" />
        {/* Mage Hats */}
        {traits.headpiece === 'hood' && (
           <path d="M30 30 C 30 0, 70 0, 70 30 L65 40 C 50 15, 35 40, 30 30 Z" fill={traits.secondaryColor} />
        )}
        {traits.headpiece === 'crown' && (
           <path d="M35 15 L40 5 L50 10 L60 5 L65 15 L60 20 L40 20 Z" fill="#fbbf24" />
        )}
        {/* Glowing Orb Eyes */}
        <circle cx={45} cy={28} r={4} fill={traits.secondaryColor} className="animate-pulse" />
        <circle cx={55} cy={28} r={4} fill={traits.secondaryColor} className="animate-pulse" />
        {/* Mage Weapon */}
        {traits.weapon === 'staff' && (
          <g transform="translate(15, 45) rotate(-10)">
            <rect x={-3} y={-30} width={6} height={60} fill="#78350f" />
            <circle cx={0} cy={-35} r={10} fill={traits.secondaryColor} className="animate-pulse" />
            <path d="M-8 -35 Q 0 -50 8 -35 Q 0 -20 -8 -35 Z" fill="rgba(255,255,255,0.5)" />
          </g>
        )}
        {traits.weapon === 'spellbook' && (
          <g transform="translate(15, 60)">
            <rect x={-10} y={-15} width={20} height={25} fill="#1e3a8a" rx={2} />
            <rect x={-8} y={-12} width={16} height={19} fill="#fff" opacity={0.8} />
            <line x1={-5} y1={-5} x2={5} y2={-5} stroke="#000" strokeWidth={1} />
            <line x1={-5} y1={0} x2={5} y2={0} stroke="#000" strokeWidth={1} />
          </g>
        )}
      </g>
    );
  };

  // --- COLLECTION 3: DRAGON SLAYERS ---
  const renderDragon = () => {
    return (
      <g>
        {/* Heavy Armor Body */}
        <path d="M20 90 C 25 65, 30 50, 50 45 C 70 50, 75 65, 80 90 Z" fill={traits.primaryColor} />
        {/* Chest Plates / Scales */}
        <path d="M35 60 L50 75 L65 60 L50 50 Z" fill={traits.secondaryColor} opacity={0.7} />
        <path d="M30 75 L50 90 L70 75 L50 65 Z" fill={traits.secondaryColor} opacity={0.7} />
        {/* Head Shape (Bulky) */}
        <rect x={35} y={15} width={30} height={32} rx={6} fill={traits.primaryColor} />
        {/* Dragon Slayers Helmets */}
        {traits.headpiece === 'helmet' && (
           <path d="M32 20 C 32 5, 68 5, 68 20 L68 35 L60 25 L50 35 L40 25 L32 35 Z" fill="#94a3b8" />
        )}
        {traits.headpiece === 'horns' && (
           <g>
             <path d="M38 18 Q 25 5 20 15 Q 30 18 35 25 Z" fill="#facc15" />
             <path d="M62 18 Q 75 5 80 15 Q 70 18 65 25 Z" fill="#facc15" />
           </g>
        )}
        {/* Reptilian / Fierce Eyes */}
        <rect x={38} y={28} width={24} height={8} fill="#000" rx={2} />
        <circle cx={43} cy={32} r={3} fill="#ef4444" />
        <circle cx={57} cy={32} r={3} fill="#ef4444" />
        {/* Weapon */}
        {traits.weapon === 'sword' && (
          <g transform="translate(80, 55) rotate(15)">
            <rect x={-4} y={-45} width={8} height={50} fill="#cbd5e1" />
            <rect x={-12} y={5} width={24} height={6} fill="#b45309" />
            <rect x={-3} y={11} width={6} height={15} fill="#1e293b" />
          </g>
        )}
        {traits.weapon === 'axe' && (
          <g transform="translate(80, 60) rotate(25)">
            <rect x={-3} y={-40} width={6} height={60} fill="#78350f" />
            <path d="M 3 -30 Q 20 -35 20 -20 Q 20 -5 3 -10 Z" fill="#cbd5e1" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${traits.background} ${isMythic ? 'shadow-[0_0_30px_rgba(255,255,255,0.4)] border-4 border-white/50' : 'border-2 border-forge-border'} ${className}`}
    >
      <svg width="100%" height="100%" viewBox={viewBox} className="absolute inset-0 z-10 drop-shadow-xl">
        {renderAura()}
        {renderFamiliar()}
        {baseType === 'shadow_assassin' && renderAssassin()}
        {baseType === 'arch_mage' && renderMage()}
        {baseType === 'dragon_slayer' && renderDragon()}
        {/* Fallback Legacy renderer for generic base */}
        {!['shadow_assassin', 'arch_mage', 'dragon_slayer'].includes(baseType) && (
            <g>
               <path d="M25 80 C 25 50, 40 30, 50 30 C 60 30, 75 50, 75 80 Z" fill={traits.primaryColor} />
               <circle cx={50} cy={40} r={22} fill={traits.primaryColor} />
               <rect x={35} y={35} width={30} height={10} fill="#111" rx={2} />
               <circle cx={40} cy={40} r={2} fill="#fff" />
               <circle cx={60} cy={40} r={2} fill="#fff" />
            </g>
        )}
        {renderWeather()}
      </svg>
      {isMythic && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
             <div className="w-full h-full animate-[spin_10s_linear_infinite] opacity-30">
                 <svg width="100%" height="100%" viewBox="0 0 100 100">
                     <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" fill="#fff" />
                 </svg>
             </div>
          </div>
      )}
    </div>
  );
};
