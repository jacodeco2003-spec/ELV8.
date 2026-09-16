'use client';

import { useState, useEffect } from 'react';
import PlanPreview from '@/app/components/PlanPreview';

interface SportData {
  tag: string;
  title: string;
  subtitle: string;
  heroImage: string;
  coachName: string;
  ratingText: string;
  isRunningSpecial?: boolean;
  isGymSpecial?: boolean;
  isCyclingSpecial?: boolean;
  isTriathlonSpecial?: boolean;
  isSwimmingSpecial?: boolean;
}

const SPORTS_DATA: Record<string, SportData> = {
  'Running': {
    tag: 'Endurance & Race Kinetics',
    title: 'Conquer Every Distance',
    subtitle: 'Targeted race-specific training cycles combining pure mileage strategy, pacing, and strength integration to break your personal records.',
    heroImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Elena Rostova',
    ratingText: '250+ Marathoners & Distance Runners',
    isRunningSpecial: true,
  },
  'Cycling': {
    tag: 'Velo Power & Threshold Training',
    title: 'Crush Your FTP',
    subtitle: 'Optimize cadence, functional threshold power, and aerodynamic climbing endurance for serious cyclists.',
    heroImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Arnaud Mercier',
    ratingText: '180+ Road & Gravel Cyclists',
    isCyclingSpecial: true,
  },
  'Swimming': {
    tag: 'Hydro Dynamics & Swim Efficiency',
    title: 'Master The Water',
    subtitle: 'Improve stroke mechanics, hydrodynamic drag reduction, and high-intensity threshold sets for endurance swimmers.',
    heroImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Sarah Jenkins',
    ratingText: '110+ Endurance Swimmers',
    isSwimmingSpecial: true,
  },
  'Triathlon': {
    tag: 'Multi-Discipline Endurance',
    title: 'Master Swim, Bike, Run',
    subtitle: 'Balance multi-sport brick sessions, optimal recovery management, and endurance pacing for triathlon success.',
    heroImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Sarah Jenkins',
    ratingText: '110+ Ironman & Triathletes',
    isTriathlonSpecial: true,
  },
  'Gym & Fitness': {
    tag: 'Bodybuilding & Aesthetics Coach',
    title: 'Forge Your Physique',
    subtitle: 'Optimize hyper-targeted muscle hypertrophy, power, and targeted body zone development with specialized resistance protocols.',
    heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Viktor Vance',
    ratingText: '300+ Fitness & Aesthetic Clients',
    isGymSpecial: true,
  },
  'Soccer': {
    tag: 'Elite Football Conditioning',
    title: 'Level Up Your Performance',
    subtitle: 'Maximize your speed, agility, and match stamina with personalized elite training protocols designed for footballers.',
    heroImage: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Marcus Vance',
    ratingText: '120+ Professional & Collegiate Players',
  },
  'Tennis': {
    tag: 'High-Performance Tennis Coach',
    title: 'Master The Court',
    subtitle: 'Build court coverage, rotational power, and shoulder durability with strength routines tailored for competitive tennis players.',
    heroImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Stefan Holm',
    ratingText: '85+ Tournament Level Athletes',
  },
  'Basketball': {
    tag: 'Pro Hoops Strength & Vertical',
    title: 'Elevate Your Game',
    subtitle: 'Unlock vertical jump, reactive agility, and second-half endurance with targeted strength and mobility programming.',
    heroImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Devonte Shaw',
    ratingText: '150+ Division 1 & Pro Athletes',
  },
  'Volleyball': {
    tag: 'Explosive Jump & Court Speed',
    title: 'Rule Above The Net',
    subtitle: 'Develop shoulder stability, explosive vertical power, and lateral court movement for high-level competitive volleyball.',
    heroImage: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Lucas Silva',
    ratingText: '70+ National & Club Athletes',
  },
  'Track & Field': {
    tag: 'Sprint Mechanics & Speed',
    title: 'Unleash Top Speed',
    subtitle: 'Focus on acceleration mechanics, maximum velocity, and stride frequency for track athletes.',
    heroImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Andre Dupont',
    ratingText: '140+ Track & Field Athletes',
  },
  'Baseball': {
    tag: 'Rotational Power & Throwing Velocity',
    title: 'Maximize Your Exit Velo',
    subtitle: 'Build shoulder health, explosive rotational hip power, and sprint speed for high-performance ballplayers.',
    heroImage: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=1600&auto=format&fit=crop',
    coachName: 'Coach Tyler Reed',
    ratingText: '95+ Collegiate & Travel Ball Players',
  },
};

const DEFAULT_SPORT = SPORTS_DATA['Running'];

export default function Home() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [selectedSportKey, setSelectedSportKey] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  
  const [formData, setFormData] = useState({
    level: 'Intermediate',
    weight: '75 kg',
    height: '180 cm',
    goal: 'Explosiveness & Power',
    targetDistance: 'Marathon (42.2 km)',
    cyclingTarget: 'FTP & Threshold Power',
    swimmingTarget: 'Long Distance Endurance & Open Water',
    triathlonTarget: 'Olympic Distance',
    gymTargetZones: ['Whole Body / Balanced'],
    gymStrengthGoal: 'Hypertrophy & Muscle Growth',
    daysPerWeek: '4 Days / Wk',
    equipment: ['Full Commercial Gym'] as string[],
    injuries: '',
    additionalRequests: '',
  });

  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('elv8_workout') || null;
    }
    return null;
  });
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [auditSubmitted, setAuditSubmitted] = useState<boolean>(false);
  const [auditData, setAuditData] = useState({ rpe: '8 - Hard', notes: '' });

  // Stati per la conferma definitiva e la chat di modifica
  const [isConfirmedPlan, setIsConfirmedPlan] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('elv8_confirmed_plan');
    }
    return false;
  });
  const [isModifyingChatOpen, setIsModifyingChatOpen] = useState<boolean>(false);
  const [chatModifications, setChatModifications] = useState<string>('');

  useEffect(() => {
    if (workout) {
      localStorage.setItem('elv8_workout', workout);
    } else {
      localStorage.removeItem('elv8_workout');
    }
  }, [workout]);

  const activeSport = selectedSportKey ? SPORTS_DATA[selectedSportKey] : DEFAULT_SPORT;

  const handleEnterApp = () => {
    setIsOpening(true);
    setTimeout(() => {
      setHasEntered(true);
    }, 900);
  };

  const handleSelect = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (eq: string) => {
    setFormData((prev) => {
      const current = prev.equipment;
      let updated;
      if (current.includes(eq)) {
        updated = current.filter((item) => item !== eq);
      } else {
        updated = [...current, eq];
      }
      if (updated.length === 0) updated = [eq];
      return { ...prev, equipment: updated };
    });
  };

  const toggleGymZone = (zone: string) => {
    setFormData((prev) => {
      const current = prev.gymTargetZones;
      if (zone === 'Whole Body / Balanced') return { ...prev, gymTargetZones: ['Whole Body / Balanced'] };
      
      let updated = current.filter((z) => z !== 'Whole Body / Balanced');
      if (updated.includes(zone)) {
        updated = updated.filter((z) => z !== zone);
      } else {
        updated.push(zone);
      }
      if (updated.length === 0) updated = ['Whole Body / Balanced'];
      return { ...prev, gymTargetZones: updated };
    });
  };

  const handleGenerateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSportKey) return;
    setLoading(true);
    setWorkout(null);
    setAuditSubmitted(false);
    setIsConfirmedPlan(false);

    let goalSummary = formData.goal;
    if (activeSport.isRunningSpecial) {
      goalSummary = `Race Distance Target: ${formData.targetDistance}`;
    } else if (activeSport.isCyclingSpecial) {
      goalSummary = `Cycling Focus: ${formData.cyclingTarget}`;
    } else if (activeSport.isSwimmingSpecial) {
      goalSummary = `Swimming Focus: ${formData.swimmingTarget}`;
    } else if (activeSport.isTriathlonSpecial) {
      goalSummary = `Triathlon Focus: ${formData.triathlonTarget}`;
    } else if (activeSport.isGymSpecial) {
      goalSummary = `Gym Strength Goal: ${formData.gymStrengthGoal} | Target Body Zones: ${formData.gymTargetZones.join(', ')}`;
    }

    const fullPrompt = `
    Act as a world-class elite athletic coach (${activeSport.coachName}).
    Design an uncompromising, highly detailed, elite-tier professional training program for an athlete in ${selectedSportKey}.

    Athlete Profile:
    - Primary Sport: ${selectedSportKey}
    - Athlete Experience Level: ${formData.level}
    - Biometrics: Weight: ${formData.weight}, Height: ${formData.height}
    - Primary Goal / Focus: ${goalSummary}
    - Training Frequency: ${formData.daysPerWeek}
    - Equipment / Setting Access: ${formData.equipment.join(', ')}
    - Injury Notes / Limitations: ${formData.injuries || 'None'}
    - Additional Requests / Specifications: ${formData.additionalRequests || 'None'}

    Formatting & Content Guidelines:
    1. Start with an uncompromising "Coach's Mindset & Tactical Briefing" paragraph written directly by Coach ${activeSport.coachName}, focusing on psychological grit, discomfort management, and discipline.
    2. Structure each training day with clean Markdown Tables:
       | Exercise / Workout Block | Sets x Reps / Distance / Duration | Rest / Pace / Power Zone | Key Coaching Cue | Video Tutorial |
    3. Include YouTube video search links in the Video Tutorial column, formatted as: [Watch Guide](https://www.youtube.com/results?search_query=Exercise+Name+exercise+tutorial)
    4. Keep tone authoritative, professional, elite, and ultra-clean. Avoid artificial hype or excessive emojis.
    `;

    try {
      const response = await fetch(`${window.location.origin}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) {
        alert('Server Error');
        return;
      }

      const data = await response.json();
      if (data.result) {
        setWorkout(data.result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedWorkout = (text: string) => {
    if (!text) return null;

    const cleanText = text
      .replace(/\\n/g, '\n')
      .replace(/\|/g, ' | ')
      .replace(/\s+\|/g, ' |')
      .replace(/\|\s+/g, '| ');

    const lines = cleanText.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];

    const flushTable = (key: number) => {
      if (tableRows.length === 0) return null;
      
      const validRows = tableRows.filter(r => r.includes('|'));
      if (validRows.length === 0) {
        tableRows = [];
        return null;
      }

      const headers = validRows[0].split('|').map((h) => h.trim()).filter(Boolean);
      const dataRows = validRows.slice(2).map((row) => 
        row.split('|').map((c) => c.trim()).filter(Boolean)
      );

      const tableElement = (
        <div key={`table-${key}`} className="overflow-x-auto my-6 border border-zinc-800 rounded-xl bg-zinc-900/50 shadow-lg">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-300 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-700/60">
                {headers.map((h, i) => (
                  <th key={i} className="py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {dataRows.map((row, rIndex) => (
                <tr key={rIndex} className="hover:bg-zinc-800/35 transition-colors">
                  {row.map((cell, cIndex) => {
                    const linkMatch = cell.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                      return (
                        <td key={cIndex} className="py-3 px-4 text-zinc-300">
                          <a href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-white underline underline-offset-4 font-medium hover:text-zinc-400">
                            {linkMatch[1]} ↗
                          </a>
                        </td>
                      );
                    }
                    return (
                      <td key={cIndex} className="py-3 px-4 text-zinc-300">
                        {cell.replace(/\*\*/g, '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      return tableElement;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        tableRows.push(trimmed);
        return;
      }

      if (tableRows.length > 0) {
        elements.push(flushTable(index));
      }

      if (!trimmed) return;

      if (trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
        const titleText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        elements.push(
          <h3 key={index} className="text-lg md:text-xl font-medium tracking-tight text-white mt-8 mb-3 pb-2 border-b border-zinc-800">
            {titleText}
          </h3>
        );
        return;
      }

      elements.push(
        <p key={index} className="text-zinc-400 text-sm md:text-base leading-relaxed mb-2 font-light">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    });

    if (tableRows.length > 0) {
      elements.push(flushTable(lines.length));
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* SPLASH SCREEN */}
      {!hasEntered && (
        <div 
          onClick={handleEnterApp}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 cursor-pointer select-none overflow-hidden"
        >
          <div className={`absolute top-0 left-0 right-0 h-1/2 bg-zinc-950 border-b border-zinc-800/80 z-30 transition-transform duration-[900ms] ease-[cubic-bezier(0.77,0,0.175,1)] ${
            isOpening ? '-translate-y-full' : 'translate-y-0'
          }`} />

          <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-zinc-950 border-t border-zinc-800/80 z-30 transition-transform duration-[900ms] ease-[cubic-bezier(0.77,0,0.175,1)] ${
            isOpening ? 'translate-y-full' : 'translate-y-0'
          }`} />

          <div className={`absolute inset-0 z-10 transition-all duration-900 ease-out ${isOpening ? 'opacity-0 scale-110' : 'opacity-75 scale-100'}`}>
            <img 
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1600&auto=format&fit=crop" 
              alt="Elite Grit and Mindset" 
              className="w-full h-full object-cover object-center filter grayscale contrast-150 brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,rgba(9,9,11,0.85)_75%,rgba(9,9,11,0.98)_100%)]" />
          </div>

          <div className={`relative z-40 w-full md:w-[768px] max-w-3xl text-center space-y-4 md:space-y-6 px-4 transition-all duration-500 ease-out ${
            isOpening ? 'opacity-0 scale-95 -translate-y-6' : 'opacity-100 scale-100 translate-y-0'
          }`}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-zinc-600/60 bg-zinc-900/95 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_12px_#ffffff]" />
              <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-100 font-bold">
                High-Performance Intelligence
              </span>
            </div>
            
            <h1 className="text-3xl md:text-[12rem] font-light tracking-[0.22em] text-white uppercase leading-none font-mono drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">
              ELV8
            </h1>

            <p className="px-6 md:px-0 text-zinc-200 text-sm md:text-lg font-light tracking-wide max-w-xl mx-auto leading-relaxed drop-shadow-md">
              Excellence is not an act, it is a relentless mindset. Push past your absolute limits and engineer elite physical performance.
            </p>

            <div className="pt-6">
              <span className="inline-block w-full sm:w-auto px-6 py-3 rounded-full border border-zinc-500 bg-zinc-900/90 backdrop-blur-md text-[11px] uppercase tracking-[0.35em] text-white font-semibold hover:border-white transition shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                Touch the screen to continue ↗
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENUTO PRINCIPALE */}
      <div className={`transition-opacity duration-1000 delay-300 ${hasEntered ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* NAVBAR */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-6">
              <span className="font-light tracking-[0.15em] text-white uppercase text-lg font-mono">ELV8</span>
              <span className="hidden md:inline text-zinc-600">|</span>
              <nav className="hidden md:flex gap-6 text-zinc-400 font-medium">
                <span className="text-zinc-200">Elite Protocol</span>
                <span className="text-zinc-500">Irrevocable Standard</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {workout && (
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    focusMode ? 'bg-white text-black border-white' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {focusMode ? 'Exit Focus Mode' : 'Focus Mode ⚡'}
                </button>
              )}
              <button 
                onClick={() => { setSelectedSportKey(null); setWorkout(null); setStep(1); setFocusMode(false); setIsConfirmedPlan(false); }}
                className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition font-medium text-xs tracking-wide"
              >
                {selectedSportKey ? 'Back to Sport Selection' : 'Reset Protocol'}
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTAINER A SCHERMO INTERO */}
        <main className="pt-16">
          
          {!selectedSportKey ? (
            <div className="relative w-full h-[calc(100vh-4rem)] bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
              
              <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-30" preserveAspectRatio="none">
                <line x1="55%" y1="0" x2="45%" y2="100%" stroke="white" strokeWidth="4" style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.9))' }} />
                <line x1="55%" y1="0" x2="45%" y2="100%" stroke="white" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,1))' }} />
              </svg>

              {/* LEFT SECTION: ENDURANCE */}
              <div 
                className="relative md:absolute md:inset-0 w-full h-[50vh] md:h-full p-8 md:p-16 lg:p-20 flex flex-col justify-center group cursor-pointer z-10 md:[clip-path:polygon(0_0,55%_0,45%_100%,0_100%)]"
              >
                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none scale-105 bg-black">
                  <img src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1600&auto=format&fit=crop" alt="Endurance" className="w-full h-full object-cover filter grayscale contrast-125" />
                </div>
                
                <div className="relative z-10 w-full md:w-[40%] md:ml-12 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.3em] block mb-2">Path 01</span>
                    <h2 className="text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                      Endurance
                    </h2>
                    <p className="text-zinc-300 text-xs md:text-sm font-light mt-2 tracking-wide drop-shadow">
                      Stamina, threshold kinetics, and race performance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {['Running', 'Cycling', 'Swimming', 'Triathlon'].map((sport) => (
                      <button
                        key={sport}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSportKey(sport);
                          setStep(1);
                          if (sport === 'Cycling') setFormData(prev => ({ ...prev, equipment: ['Road Bike + Full Gym'] }));
                          else if (sport === 'Swimming') setFormData(prev => ({ ...prev, equipment: ['Swimming Pool (50m/25m)', 'Full Gym'] }));
                          else if (sport === 'Triathlon') setFormData(prev => ({ ...prev, equipment: ['Full-Gym', 'Road Bike'] }));
                          else setFormData(prev => ({ ...prev, equipment: ['Road & Strength Integration'] }));
                        }}
                        className="text-left py-2.5 px-4 rounded-xl border border-zinc-700/80 bg-zinc-900/90 hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center justify-between group/btn shadow-xl backdrop-blur-sm"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{sport}</span>
                        <span className="text-[10px] font-mono opacity-50 group-hover/btn:opacity-100">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:hidden w-full h-[2px] bg-white relative z-30 shrink-0" style={{ boxShadow: '0 0 15px rgba(255,255,255,0.9)' }} />

              {/* RIGHT SECTION: TEAM SPORTS & GYM */}
              <div 
                className="relative md:absolute md:inset-0 w-full h-[50vh] md:h-full p-8 md:p-16 lg:p-20 flex flex-col justify-center group cursor-pointer z-20 md:[clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)]"
              >
                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none scale-105 bg-black">
                  <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1600&auto=format&fit=crop" alt="Team Sports" className="w-full h-full object-cover filter grayscale contrast-125" />
                </div>

                <div className="relative z-10 w-full md:w-[40%] md:ml-auto md:mr-12 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.3em] block mb-2">Path 02</span>
                    <h2 className="text-3xl lg:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                      Team Sports & Gym
                    </h2>
                    <p className="text-zinc-300 text-xs md:text-sm font-light mt-2 tracking-wide drop-shadow">
                      Hypertrophy, court agility, and explosive field power.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {['Gym & Fitness', 'Soccer', 'Tennis', 'Basketball', 'Volleyball', 'Track & Field', 'Baseball'].map((sport) => (
                      <button
                        key={sport}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSportKey(sport);
                          setStep(1);
                          setFormData(prev => ({ ...prev, equipment: ['Full Commercial Gym'] }));
                        }}
                        className="text-left py-2.5 px-4 rounded-xl border border-zinc-700/80 bg-zinc-900/90 hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center justify-between group/btn shadow-xl backdrop-blur-sm"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{sport}</span>
                        <span className="text-[10px] font-mono opacity-50 group-hover/btn:opacity-100">↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : !workout ? (
            
            /* FORM DI CONFIGURAZIONE PROTOCOLLO */
            <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 md:p-12 overflow-hidden">
              
              <div className="absolute inset-0 z-0">
                <img 
                  key={selectedSportKey}
                  src={activeSport.heroImage} 
                  alt={activeSport.title} 
                  className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-125 transition-all duration-1000 ease-in-out scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
              </div>

              <div className="relative z-10 max-w-4xl w-full my-8">
                
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="h-px w-6 bg-zinc-400" />
                    <span className="text-zinc-300 text-xs md:text-sm uppercase tracking-widest font-medium">
                      {activeSport.tag}
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-4 leading-none">
                    {activeSport.title}
                  </h1>

                  <p className="text-zinc-300 text-sm md:text-lg max-w-xl font-light leading-relaxed mb-6">
                    {activeSport.subtitle}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="text-amber-400 text-xs tracking-widest">★★★★★</div>
                    <span className="text-zinc-400 text-xs font-light tracking-wide">{activeSport.ratingText}</span>
                  </div>
                </div>

                {/* CARD FORM */}
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
                  
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80 text-xs text-zinc-400 uppercase tracking-widest font-medium">
                    <span>Step 0{step} of 03</span>
                    <span>
                      {step === 1 ? 'Athletic Level & Biometrics' : step === 2 ? (activeSport.isRunningSpecial ? 'Race Target' : activeSport.isCyclingSpecial ? 'Cycling Focus' : activeSport.isSwimmingSpecial ? 'Swimming Focus' : activeSport.isTriathlonSpecial ? 'Triathlon Focus' : activeSport.isGymSpecial ? 'Aesthetics & Zones' : 'Goals & Focus') : 'Gear & Equipment'}
                    </span>
                  </div>

                  <form onSubmit={handleGenerateWorkout} className="space-y-6">
                    
                    {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Experience Level</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Beginner', 'Intermediate', 'Advanced / Elite'].map((lvl) => (
                              <button
                                type="button"
                                key={lvl}
                                onClick={() => handleSelect('level', lvl)}
                                className={`py-3 px-4 rounded-xl text-xs font-medium border transition ${
                                  formData.level === lvl
                                    ? 'bg-zinc-100 text-black border-white'
                                    : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Body Weight</label>
                            <input
                              type="text"
                              value={formData.weight}
                              onChange={(e) => handleSelect('weight', e.target.value)}
                              placeholder="e.g. 75 kg"
                              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Height</label>
                            <input
                              type="text"
                              value={formData.height}
                              onChange={(e) => handleSelect('height', e.target.value)}
                              placeholder="e.g. 180 cm"
                              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition font-medium text-xs tracking-wider uppercase flex items-center gap-2"
                          >
                            Next Step <span>↗</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        {activeSport.isRunningSpecial ? (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Target Race / Distance</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  '5K Sprint Race',
                                  '10K Road Race',
                                  'Half-Marathon (21.1 km)',
                                  'Marathon (42.2 km)',
                                  'Trail / Ultra Distance',
                                  'General Aerobic Base',
                                ].map((dist) => (
                                  <button
                                    type="button"
                                    key={dist}
                                    onClick={() => handleSelect('targetDistance', dist)}
                                    className={`py-3.5 px-4 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.targetDistance === dist
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {dist}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : activeSport.isCyclingSpecial ? (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Cycling Training Focus</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  'FTP & Threshold Power',
                                  'Climbing & Gran Fondo Prep',
                                  'Sprint & Anaerobic Power',
                                  'Endurance & Base Building',
                                ].map((cf) => (
                                  <button
                                    type="button"
                                    key={cf}
                                    onClick={() => handleSelect('cyclingTarget', cf)}
                                    className={`py-3 px-3 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.cyclingTarget === cf
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {cf}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : activeSport.isSwimmingSpecial ? (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Swimming Training Focus</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  'Long Distance Endurance & Open Water',
                                  'Threshold Pace & Interval Sets',
                                  'Sprint Speed & Stroke Mechanics',
                                  'Technique & Hydrodynamic Efficiency',
                                ].map((sf) => (
                                  <button
                                    type="button"
                                    key={sf}
                                    onClick={() => handleSelect('swimmingTarget', sf)}
                                    className={`py-3 px-3 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.swimmingTarget === sf
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {sf}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : activeSport.isTriathlonSpecial ? (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Triathlon Race Distance</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  'Sprint Distance',
                                  'Olympic Distance',
                                  'Half-Ironman (70.3)',
                                  'Full Ironman (140.6)',
                                ].map((tf) => (
                                  <button
                                    type="button"
                                    key={tf}
                                    onClick={() => handleSelect('triathlonTarget', tf)}
                                    className={`py-3 px-3 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.triathlonTarget === tf
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {tf}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : activeSport.isGymSpecial ? (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Primary Strength Goal</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  'Hypertrophy & Muscle Growth',
                                  'Maximum Heavy Strength',
                                  'Explosive Athletic Power',
                                  'Body Recomposition & Definition',
                                ].map((gg) => (
                                  <button
                                    type="button"
                                    key={gg}
                                    onClick={() => handleSelect('gymStrengthGoal', gg)}
                                    className={`py-3 px-3 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.gymStrengthGoal === gg
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {gg}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Target Muscle Zones</label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  'Whole Body / Balanced',
                                  'Chest & Push',
                                  'Back & Pull',
                                  'Legs & Squat',
                                  'Shoulders & Arms',
                                  'Core & Conditioning',
                                ].map((zone) => {
                                  const isSelected = formData.gymTargetZones.includes(zone);
                                  return (
                                    <button
                                      type="button"
                                      key={zone}
                                      onClick={() => toggleGymZone(zone)}
                                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                                        isSelected
                                          ? 'bg-zinc-100 text-black border-white'
                                          : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {zone}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Primary Goal / Focus</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  'Explosiveness & Power',
                                  'Strength & Hypertrophy',
                                  'Endurance & Conditioning',
                                  'Injury Prevention & Agility',
                                ].map((g) => (
                                  <button
                                    type="button"
                                    key={g}
                                    onClick={() => handleSelect('goal', g)}
                                    className={`py-3.5 px-4 rounded-xl text-xs font-medium text-left border transition ${
                                      formData.goal === g
                                        ? 'bg-zinc-100 text-black border-white'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {g}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-5 py-3 rounded-full border border-zinc-700 text-zinc-300 text-xs uppercase"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition font-medium text-xs tracking-wider uppercase flex items-center gap-2"
                          >
                            Next Step <span>↗</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">
                            Training Equipment & Setting (Multi-Select)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(selectedSportKey === 'Cycling'
                              ? [
                                  'Road Bike + Full Gym',
                                  'Road Bike Only',
                                  'Full Gym + Indoor Trainer',
                                  'Indoor Trainer + Home Gym'
                                ]
                              : selectedSportKey === 'Swimming'
                              ? [
                                  'Swimming Pool (50m/25m)',
                                  'Resistance Bands & Paddles',
                                  'Open Water Setup',
                                  'Dryland Gym Integration'
                                ]
                              : selectedSportKey === 'Triathlon'
                              ? [
                                  'Full-Gym',
                                  'Road Bike',
                                  'Outdoor Track',
                                  'Swimming Pool'
                                ]
                              : [
                                  'Full Commercial Gym',
                                  'Home Gym / Minimal Equipment',
                                  'Outdoor / Track / Field',
                                  'Road & Strength Integration'
                                ]
                            ).map((eq) => {
                              const isSelected = formData.equipment.includes(eq);
                              return (
                                <button
                                  type="button"
                                  key={eq}
                                  onClick={() => toggleEquipment(eq)}
                                  className={`py-3.5 px-4 rounded-xl text-xs font-medium text-left border transition flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-zinc-100 text-black border-white'
                                      : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                  }`}
                                >
                                  <span>{eq}</span>
                                  <span className="text-[10px] font-mono">{isSelected ? '[SELECTED]' : '[+]'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-3 font-medium">Training Frequency</label>
                          <div className="grid grid-cols-4 gap-3">
                            {['2 Days / Wk', '3 Days / Wk', '4 Days / Wk', '5 Days / Wk'].map((freq) => (
                              <button
                                type="button"
                                key={freq}
                                onClick={() => handleSelect('daysPerWeek', freq)}
                                className={`py-3 px-2 rounded-xl text-xs font-medium text-center border transition ${
                                  formData.daysPerWeek === freq
                                    ? 'bg-zinc-100 text-black border-white'
                                    : 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                }`}
                              >
                                {freq}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Injury Notes / Constraints</label>
                            <input
                              type="text"
                              value={formData.injuries}
                              onChange={(e) => handleSelect('injuries', e.target.value)}
                              placeholder="e.g. Mild left knee soreness"
                              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Additional Requests / Specifications</label>
                            <input
                              type="text"
                              value={formData.additionalRequests}
                              onChange={(e) => handleSelect('additionalRequests', e.target.value)}
                              placeholder="e.g. Focus heavily on aerobic base & core stability"
                              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-5 py-3 rounded-full border border-zinc-700 text-zinc-300 text-xs uppercase"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 transition font-medium text-xs tracking-wider uppercase disabled:opacity-50"
                          >
                            {loading ? 'Engineering Protocol...' : 'Generate Protocol ↗'}
                          </button>
                        </div>
                      </div>
                    )}

                  </form>
                </div>

              </div>
            </div>
          ) : (
            
            /* RISULTATO PROTOCOLLO, CONFERMA, CHAT E AUDIT */
            <div className={`max-w-4xl mx-auto px-6 py-12 transition-all duration-500 ${focusMode ? 'max-w-5xl py-6' : ''}`}>
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800">
                <div>
                  <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-1">
                    {isConfirmedPlan ? 'Active Elite Protocol ✓' : 'Irrevocable Standard'}
                  </span>
                  <h2 className="text-xl font-light text-white">{selectedSportKey} — Elite Protocol</h2>
                </div>
                <div className="flex items-center gap-3">
                  <PlanPreview initialPlan={workout} />
                  <button
                    onClick={() => { setWorkout(null); setIsConfirmedPlan(false); }}
                    className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
                  >
                    Edit Profile & Inputs
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-10 shadow-2xl space-y-6">
                
                {/* 1. Rendering del Workout Formattato con Tabelle */}
                {renderFormattedWorkout(workout)}

                {/* 2. SEZIONE CONFERMA DEFINITIVA E CHAT DI MODIFICA (ESATTAMENTE QUI) */}
                <div className="mt-10 pt-8 border-t border-zinc-800 space-y-6">
                  {!isConfirmedPlan ? (
                    <div className="bg-zinc-900/90 border border-zinc-700/60 rounded-xl p-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-1">Finalize Your Protocol</h4>
                        <p className="text-xs text-zinc-400 font-light">
                          Review your protocol above. Confirm it to save it as your active standard, or request specific adjustments through the coach assistant.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Pulsante Conferma Definitiva */}
                        <button
                          onClick={() => {
                            setIsConfirmedPlan(true);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('elv8_confirmed_plan', workout);
                            }
                          }}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition font-semibold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          Confirm Final & Activate Plan ↗
                        </button>

                        {/* Pulsante Apri Chat di Modifica */}
                        <button
                          onClick={() => setIsModifyingChatOpen(!isModifyingChatOpen)}
                          className="w-full sm:w-auto px-6 py-3 rounded-full border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 transition font-medium text-xs tracking-wider uppercase"
                        >
                          {isModifyingChatOpen ? 'Close Modify Chat' : 'Modify Your Plan (Chat) 💬'}
                        </button>
                      </div>

                      {/* Box Interattivo per la Chat di Modifica */}
                      {isModifyingChatOpen && (
                        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                          <label className="block text-xs uppercase tracking-wider text-zinc-300 font-medium">
                            Tell the Coach what you want to change:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={chatModifications}
                              onChange={(e) => setChatModifications(e.target.value)}
                              placeholder="e.g., I prefer more chest exercises on Day 1..."
                              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white"
                            />
                            <button
                              type="button"
                              disabled={loading || !chatModifications.trim()}
                              onClick={async () => {
                                setLoading(true);
                                const modificationPrompt = `
                                  Refine the previous training plan based on this user feedback: "${chatModifications}".
                                  Keep the same elite formatting, Markdown tables, and structure, but adapt the content according to the requested preference.
                                `;
                                try {
                                  const response = await fetch(`${window.location.origin}/api/generate`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ prompt: modificationPrompt }),
                                  });
                                  const data = await response.json();
                                  if (data.result) {
                                    setWorkout(data.result);
                                    setChatModifications('');
                                    setIsModifyingChatOpen(false);
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="px-5 py-3 rounded-xl bg-zinc-200 text-black hover:bg-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50"
                            >
                              {loading ? 'Updating...' : 'Apply Changes'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex items-center justify-between">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-white">Status: Active Protocol Locked & Saved ✓</p>
                        <p className="text-zinc-400">Your routine is officially active in local storage system memory.</p>
                      </div>
                      <button
                        onClick={() => setIsConfirmedPlan(false)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[11px] transition"
                      >
                        Unlock / Edit Plan
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. AUDIT SECTION */}
                <div className="mt-12 pt-8 border-t border-zinc-800">
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h4 className="text-sm font-medium text-white tracking-wide uppercase">Weekly Session Audit & RPE Log</h4>
                    {!auditSubmitted ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Session Rate of Perceived Exertion (RPE)</label>
                          <select 
                            value={auditData.rpe}
                            onChange={(e) => setAuditData({ ...auditData, rpe: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none"
                          >
                            <option value="6 - Moderate">6 - Moderate (Comfortable pace)</option>
                            <option value="7 - Challenging">7 - Challenging (Controlled discomfort)</option>
                            <option value="8 - Hard">8 - Hard (High intensity push)</option>
                            <option value="9 - Maximal">9 - Maximal (Severe grit required)</option>
                            <option value="10 - Absolute Limit">10 - Absolute Limit (Empty the tank)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-2 font-medium">Performance Notes / Fatigue Observations</label>
                          <input 
                            type="text"
                            value={auditData.notes}
                            onChange={(e) => setAuditData({ ...auditData, notes: e.target.value })}
                            placeholder="e.g. Felt great on intervals, slight tightness in right hamstring"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setAuditSubmitted(true)}
                          className="px-5 py-2.5 rounded-full bg-zinc-100 text-black hover:bg-white text-xs font-semibold uppercase tracking-wider transition"
                        >
                          Submit Weekly Audit
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/50 text-xs text-zinc-300 space-y-1">
                        <p className="font-semibold text-white">Audit Logged Successfully ✓</p>
                        <p>RPE Registered: <span className="text-zinc-100">{auditData.rpe}</span></p>
                        <p className="text-zinc-400">System parameters updated based on your audit metrics.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}