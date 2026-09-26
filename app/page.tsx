'use client';

import { Fragment, useEffect, useState } from 'react';
import PlanPreview from '@/app/components/PlanPreview';
import Dashboard from '@/app/components/Dashboard';
import { ActiveProtocol, clearProtocol, loadProtocol, parsePlan, replaceDay, saveProtocol, todayISO } from '@/lib/protocol';
import { TIMEFRAME_OPTIONS, effectiveTimeframe, isRealistic, minimumWeeks } from '@/lib/timeframe';
import { STREAM_ERROR_MARKER } from '@/lib/constants';

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
    weight: '75',
    weightUnit: 'kg' as 'kg' | 'lb',
    height: '180',
    heightFt: '5',
    heightIn: '11',
    heightUnit: 'cm' as 'cm' | 'ft',
    goal: 'Explosiveness & Power',
    targetDistance: 'Marathon (42.2 km)',
    cyclingTarget: 'FTP & Threshold Power',
    swimmingTarget: 'Long Distance Endurance & Open Water',
    triathlonTarget: 'Olympic Distance',
    gymTargetZones: ['Whole Body / Balanced'],
    gymStrengthGoal: 'Hypertrophy & Muscle Growth',
    daysPerWeek: '4 Days / Wk',
    timeframe: '12 Weeks',
    equipment: ['Full Commercial Gym'] as string[],
    injuries: '',
    additionalRequests: '',
  });

  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  const [isConfirmedPlan, setIsConfirmedPlan] = useState<boolean>(false);

  // Refinement: the survey is frozen at generation time, every applied change is kept.
  const [lockedSurvey, setLockedSurvey] = useState<string>('');
  const [planHistory, setPlanHistory] = useState<string[]>([]);
  const [changeLog, setChangeLog] = useState<{ request: string; summary: string }[]>([]);
  const [refineInput, setRefineInput] = useState<string>('');
  const [refining, setRefining] = useState<boolean>(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [targetWeeks, setTargetWeeks] = useState<number>(0);

  // Active protocol saved on this device, and whether the daily dashboard is showing.
  const [activeProtocol, setActiveProtocol] = useState<ActiveProtocol | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [editingActive, setEditingActive] = useState<boolean>(false);

  // Device storage only exists in the browser, so it is read once after the first render.
  useEffect(() => {
    const saved = loadProtocol();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveProtocol(saved);
      setShowDashboard(true);
    }
  }, []);

  const updateProtocol = (p: ActiveProtocol) => {
    setActiveProtocol(p);
    saveProtocol(p);
  };

  const confirmAndActivate = () => {
    if (!workout || !selectedSportKey) return;
    const keepHistory = editingActive && activeProtocol && activeProtocol.sport === selectedSportKey;
    if (!keepHistory && activeProtocol && !window.confirm('This will replace your current active protocol and its history. Continue?')) {
      return;
    }
    const base: ActiveProtocol = keepHistory
      ? { ...activeProtocol!, plan: workout, changeLog }
      : {
          v: 1,
          sport: selectedSportKey,
          survey: lockedSurvey,
          plan: workout,
          weightUnit: formData.weightUnit,
          targetWeeks,
          startedAt: todayISO(),
          changeLog,
          sessions: [],
          drafts: {},
          originalDays: {},
          adaptations: {},
        };
    updateProtocol(base);
    setIsConfirmedPlan(true);
    setEditingActive(true); // the plan on screen is now the active one
    setShowDashboard(true);
    window.scrollTo({ top: 0 });
  };

  const openFullProtocol = () => {
    if (!activeProtocol) return;
    setSelectedSportKey(activeProtocol.sport);
    setWorkout(activeProtocol.plan);
    setLockedSurvey(activeProtocol.survey);
    setChangeLog(activeProtocol.changeLog ?? []);
    setPlanHistory([]);
    setRefineInput('');
    setRefineError(null);
    setIsConfirmedPlan(true);
    setEditingActive(true);
    setShowDashboard(false);
    window.scrollTo({ top: 0 });
  };

  const startNewProtocol = () => {
    clearProtocol();
    setActiveProtocol(null);
    setShowDashboard(false);
    setEditingActive(false);
    setSelectedSportKey(null);
    setWorkout(null);
    setStep(1);
    setIsConfirmedPlan(false);
    setEditingActive(false);
    resetRefinement();
  };

  const resetRefinement = () => {
    setPlanHistory([]);
    setChangeLog([]);
    setRefineInput('');
    setRefineError(null);
  };

  const activeSport = selectedSportKey ? SPORTS_DATA[selectedSportKey] : DEFAULT_SPORT;

  const handleEnterApp = () => {
    setIsOpening(true);
    setTimeout(() => {
      setHasEntered(true);
    }, 900);
  };

  const KG_PER_LB = 0.45359237;
  const CM_PER_IN = 2.54;

  const round1 = (n: number) => Math.round(n * 10) / 10;

  const heightInCm = (): number | null => {
    if (formData.heightUnit === 'cm') {
      const cm = parseFloat(formData.height);
      return isNaN(cm) ? null : cm;
    }
    const ft = parseFloat(formData.heightFt) || 0;
    const inch = parseFloat(formData.heightIn) || 0;
    const total = ft * 12 + inch;
    return total > 0 ? total * CM_PER_IN : null;
  };

  const switchWeightUnit = (unit: 'kg' | 'lb') => {
    if (unit === formData.weightUnit) return;
    const w = parseFloat(formData.weight);
    const converted = isNaN(w)
      ? formData.weight
      : String(round1(unit === 'lb' ? w / KG_PER_LB : w * KG_PER_LB));
    setFormData((prev) => ({ ...prev, weightUnit: unit, weight: converted }));
  };

  const switchHeightUnit = (unit: 'cm' | 'ft') => {
    if (unit === formData.heightUnit) return;
    const cm = heightInCm();
    if (unit === 'ft') {
      if (cm === null) {
        setFormData((prev) => ({ ...prev, heightUnit: unit }));
        return;
      }
      const totalIn = Math.round(cm / CM_PER_IN);
      setFormData((prev) => ({
        ...prev,
        heightUnit: unit,
        heightFt: String(Math.floor(totalIn / 12)),
        heightIn: String(totalIn % 12),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        heightUnit: unit,
        height: cm === null ? prev.height : String(Math.round(cm)),
      }));
    }
  };

  // Always give the coach both unit systems so nothing is misread.
  const describeWeight = (): string => {
    const w = parseFloat(formData.weight);
    if (isNaN(w)) return 'Not provided';
    const kg = formData.weightUnit === 'kg' ? w : w * KG_PER_LB;
    const lb = formData.weightUnit === 'lb' ? w : w / KG_PER_LB;
    return `${round1(kg)} kg (${Math.round(lb)} lb)`;
  };

  const describeHeight = (): string => {
    const cm = heightInCm();
    if (cm === null) return 'Not provided';
    const totalIn = Math.round(cm / CM_PER_IN);
    return `${Math.round(cm)} cm (${Math.floor(totalIn / 12)} ft ${totalIn % 12} in)`;
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

  // The goal option the timeframe is judged against.
  const currentGoalKey = (): string => {
    if (activeSport.isRunningSpecial) return formData.targetDistance;
    if (activeSport.isCyclingSpecial) return formData.cyclingTarget;
    if (activeSport.isSwimmingSpecial) return formData.swimmingTarget;
    if (activeSport.isTriathlonSpecial) return formData.triathlonTarget;
    if (activeSport.isGymSpecial) return formData.gymStrengthGoal;
    return formData.goal;
  };
  const minTimeframeWeeks = minimumWeeks(currentGoalKey(), formData.level);
  const timeframe = effectiveTimeframe(formData.timeframe, minTimeframeWeeks);

  const describeTimeframe = (): string => {
    if (timeframe.weeks === 0) return 'No fixed deadline (progress at a sustainable pace)';
    const target = new Date();
    target.setDate(target.getDate() + timeframe.weeks * 7);
    return `${timeframe.weeks} weeks (target around ${target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})`;
  };

  const handleGenerateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSportKey) return;
    setLoading(true);
    setWorkout(null);
    setIsConfirmedPlan(false);
    setEditingActive(false);
    resetRefinement();

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

    const surveySummary = [
      `- Primary Sport: ${selectedSportKey}`,
      `- Experience Level: ${formData.level}`,
      `- Biometrics: Weight: ${describeWeight()}, Height: ${describeHeight()}`,
      `- Specific Goal / Focus: ${goalSummary}`,
      `- Goal Timeframe: ${describeTimeframe()}`,
      `- Training Frequency: EXACTLY ${formData.daysPerWeek}`,
      `- Available Equipment / Setting: ${formData.equipment.join(', ')}`,
      `- Injury Constraints / Limitations: ${formData.injuries || 'None'}`,
      `- Additional Requests: ${formData.additionalRequests || 'None'}`,
    ].join('\n');
    setLockedSurvey(surveySummary);
    setTargetWeeks(timeframe.weeks);

    const fullPrompt = `
    Act as a world-class elite athletic coach (${activeSport.coachName}).
    Design a precise, realistic, professional training program for an athlete in ${selectedSportKey}, based strictly on this survey: the detailed plan for week 1, plus a roadmap to reach the goal within the timeframe.

    STRICT ATHLETE SURVEY PARAMETERS:
${surveySummary}

    You MUST generate exactly ${formData.daysPerWeek} training days. No more, no less. Every other day of the week is a rest day.

    CRITICAL FORMATTING RULES (UNBREAKABLE):
    1. Start with a "Coach's Mindset & Tactical Briefing" paragraph that explains, in 3-5 sentences, how this week is built around the survey answers and what is realistically achievable in the timeframe.
    2. Then a line "Weekly Layout:" listing Monday to Sunday, each with its session focus or "Rest".
    3. For EVERY training day, use this EXACT markdown template, with the weekday from the Weekly Layout:

    Day [Number] - [Weekday]: [Focus Area]
    | Exercise / Workout Block | Sets x Reps / Distance / Duration | Rest / Pace / Power Zone | Key Coaching Cue | Video Tutorial | How To Perform |
    |---|---|---|---|---|---|
    | Barbell Back Squat | 4 x 6 @ RIR 2 | 2-3 min | Brace before descending | [Watch Guide](https://www.youtube.com/results?search_query=barbell+back+squat+proper+form) | Set the bar on your upper back and grip it just outside the shoulders ; Feet shoulder-width, toes slightly out ; Brace your core and sit down between your hips, knees tracking over toes ; Drive up through the whole foot, keeping the chest up |
    | Easy aerobic run | 6 km (3.7 mi) | Z2, RPE 4 | Conversational pace | — | — |

    4. VIDEO TUTORIAL column: add a link ONLY for a single, universally named exercise or drill (e.g. Barbell Bench Press, Romanian Deadlift, A-Skip, Catch-Up Drill) where the first YouTube result will clearly show exactly that movement. The search query must be the exact standard exercise name followed by "proper form" (words joined with +). For generic or combined blocks (dynamic mobility, warm-up, easy run, intervals, circuits, cool-down) write "—".
    5. HOW TO PERFORM column: for every gym/strength exercise, plyometric, technique drill or mobility exercise, give 3-5 short execution steps separated by " ; " (setup, movement, key form points, common mistake to avoid). For plain endurance blocks (easy run, steady ride, swim set) write "—". Never use the "|" character inside a cell.
    6. After the last day, add a "Progression & Roadmap" section: the phases from week 1 to the end of the timeframe (week ranges, focus and how volume/intensity progress), plus 2-3 sentences on recovery.
    7. You must use the pipe symbols exactly as shown above.
    8. Absolutely NO emojis.
    `;

    let text = '';
    try {
      const response = await fetch(`${window.location.origin}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Server Error');
        return;
      }

      // Show the plan while it is being written.
      setStreaming(true);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastPaint = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastPaint > 120) {
          lastPaint = now;
          setWorkout(text.split(STREAM_ERROR_MARKER)[0]);
        }
      }
      text += decoder.decode();

      const [plan, error] = text.split(STREAM_ERROR_MARKER);
      if (error !== undefined && plan.trim().length < 200) {
        setWorkout(null);
        alert('The coach could not finish your protocol. Please try again.');
        return;
      }
      setWorkout(plan.trim() || null);
    } catch (error) {
      console.error(error);
      if (!text) alert('Connection error. Please try again.');
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  };

  const handleRefinePlan = async () => {
    const request = refineInput.trim();
    if (!request || !workout || refining) return;
    setRefining(true);
    setRefineError(null);

    try {
      const response = await fetch(`${window.location.origin}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'refine',
          survey: lockedSurvey,
          currentPlan: workout,
          previousChanges: changeLog.map((c) => c.request),
          request,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setRefineError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Apply only the days that changed; everything else stays byte-for-byte identical.
      const existing = new Set(parsePlan(workout).map((d) => d.number));
      let updated = workout;
      for (const d of (data.days ?? []) as { number: number; block: string }[]) {
        if (existing.has(d.number)) updated = replaceDay(updated, d.number, d.block);
      }
      if (data.layout) {
        updated = updated.replace(/^.*Weekly Layout.*$/m, data.layout);
      }

      if (updated === workout) {
        setRefineError(data.summary ? `No changes applied: ${data.summary}` : 'No changes could be applied. Try rephrasing your request.');
        return;
      }

      setPlanHistory((prev) => [...prev, workout]);
      setChangeLog((prev) => [...prev, { request, summary: data.summary || 'Plan updated.' }]);
      setWorkout(updated);
      setRefineInput('');
    } catch (error) {
      console.error(error);
      setRefineError('Connection error. Please try again.');
    } finally {
      setRefining(false);
    }
  };

  const handleUndoRefine = () => {
    if (planHistory.length === 0 || refining) return;
    setWorkout(planHistory[planHistory.length - 1]);
    setPlanHistory((prev) => prev.slice(0, -1));
    setChangeLog((prev) => prev.slice(0, -1));
    setRefineError(null);
  };

  const renderFormattedWorkout = (text: string) => {
    if (!text) return null;

    const normalizedText = text.replace(/\|\|/g, '\n|').replace(/---\s*\|/g, '---|\n|');
    const lines = normalizedText.split('\n');
    
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];

    const flushTable = (key: number) => {
      if (tableRows.length === 0) return null;

      const validRows = tableRows.filter(r => r.includes('|'));
      if (validRows.length === 0) {
        tableRows = [];
        return null;
      }

      const parseRow = (row: string) =>
        row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

      const headers = parseRow(validRows[0]);
      const dataRows = validRows
        .slice(1)
        .filter((row) => !/^\|?\s*:?-{3,}/.test(row.trim()))
        .map(parseRow)
        .filter((row) => row.some(Boolean));

      if (headers.length === 0 || dataRows.length === 0) {
        tableRows = [];
        return null;
      }

      const tableElement = <PlanTable key={`table-${key}`} headers={headers} rows={dataRows} />;
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

      const isDayHeading = /^(\*\*)?\s*Day\s+\d+/i.test(trimmed) && trimmed.length < 90;
      if (isDayHeading || trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
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

      {/* MAIN CONTENT */}
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
              {workout && !(activeProtocol && showDashboard) && (
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    focusMode ? 'bg-white text-black border-white' : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
                </button>
              )}
              {activeProtocol && !showDashboard && (
                <button
                  onClick={() => { setShowDashboard(true); setFocusMode(false); window.scrollTo({ top: 0 }); }}
                  className="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition font-medium text-xs tracking-wide"
                >
                  Today&apos;s Training
                </button>
              )}
              {!(activeProtocol && showDashboard) && (
              <button 
                onClick={() => { setSelectedSportKey(null); setWorkout(null); setStep(1); setFocusMode(false); setIsConfirmedPlan(false); setEditingActive(false); resetRefinement(); }}
                className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition font-medium text-xs tracking-wide"
              >
                {selectedSportKey ? 'Back to Sport Selection' : 'Reset Protocol'}
              </button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="pt-16">
          
          {activeProtocol && showDashboard ? (
            <Dashboard
              protocol={activeProtocol}
              onChange={updateProtocol}
              onViewPlan={openFullProtocol}
              onNewProtocol={startNewProtocol}
            />
          ) : !selectedSportKey ? (
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
                          setWorkout(null);
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
                          setWorkout(null);
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
            
            /* CONFIGURATION FORM */
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
                    <span className="text-zinc-400 text-xs font-light tracking-wide">{activeSport.ratingText}</span>
                  </div>
                </div>

                {/* FORM CARD */}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">Body Weight</label>
                              <UnitToggle
                                options={['kg', 'lb']}
                                value={formData.weightUnit}
                                onChange={(u) => switchWeightUnit(u as 'kg' | 'lb')}
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.1"
                                value={formData.weight}
                                onChange={(e) => handleSelect('weight', e.target.value)}
                                placeholder={formData.weightUnit === 'kg' ? 'e.g. 75' : 'e.g. 165'}
                                className={`${UNIT_INPUT_CLASS} pr-10`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">{formData.weightUnit}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-medium">Height</label>
                              <UnitToggle
                                options={['cm', 'ft']}
                                value={formData.heightUnit}
                                onChange={(u) => switchHeightUnit(u as 'cm' | 'ft')}
                              />
                            </div>
                            {formData.heightUnit === 'cm' ? (
                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  value={formData.height}
                                  onChange={(e) => handleSelect('height', e.target.value)}
                                  placeholder="e.g. 180"
                                  className={`${UNIT_INPUT_CLASS} pr-10`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">cm</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={formData.heightFt}
                                    onChange={(e) => handleSelect('heightFt', e.target.value)}
                                    placeholder="5"
                                    className={`${UNIT_INPUT_CLASS} pr-8`}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">ft</span>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    max="11"
                                    value={formData.heightIn}
                                    onChange={(e) => handleSelect('heightIn', e.target.value)}
                                    placeholder="11"
                                    className={`${UNIT_INPUT_CLASS} pr-8`}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">in</span>
                                </div>
                              </div>
                            )}
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
                          <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">Goal Timeframe</label>
                          <p className="text-[11px] text-zinc-500 mb-3 font-light">
                            By when do you want to reach your goal?
                            {minTimeframeWeeks > 4 && (
                              <>
                                {' '}For a {formData.level.split(' ')[0].toLowerCase()} athlete targeting {currentGoalKey()}, the shortest realistic timeframe is{' '}
                                <span className="text-zinc-300">{Number.isFinite(minTimeframeWeeks) ? `${minTimeframeWeeks} weeks` : 'longer than 24 weeks'}</span>.
                              </>
                            )}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {TIMEFRAME_OPTIONS.map((opt) => {
                              const realistic = isRealistic(opt.weeks, minTimeframeWeeks);
                              const selected = timeframe.label === opt.label;
                              return (
                                <button
                                  type="button"
                                  key={opt.label}
                                  disabled={!realistic}
                                  title={realistic ? undefined : 'Not realistic for your level and goal'}
                                  onClick={() => handleSelect('timeframe', opt.label)}
                                  className={`py-3 px-2 rounded-xl text-[11px] font-medium text-center border transition ${
                                    selected
                                      ? 'bg-zinc-100 text-black border-white'
                                      : realistic
                                        ? 'bg-zinc-800/40 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                                        : 'bg-zinc-900/40 text-zinc-600 border-zinc-900 line-through cursor-not-allowed'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          {timeframe.label !== formData.timeframe && (
                            <p className="text-[11px] text-amber-400/90 mt-2">
                              {formData.timeframe} is too short for this goal at your level, so {timeframe.label.toLowerCase()} was selected.
                            </p>
                          )}
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
                            onClick={() => setStep(1)}
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
            
            /* PROTOCOL RESULT & CONFIRMATION */
            <div className={`max-w-4xl mx-auto px-6 py-12 transition-all duration-500 ${focusMode ? 'max-w-5xl py-6' : ''}`}>
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800">
                <div>
                  <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-1">
                    {isConfirmedPlan ? 'Active Elite Protocol' : 'Irrevocable Standard'}
                  </span>
                  <h2 className="text-xl font-light text-white">{selectedSportKey} — Elite Protocol</h2>
                </div>
                <div className="flex items-center gap-3">
                  {!streaming && <PlanPreview initialPlan={workout} />}
                  <button
                    onClick={() => { setWorkout(null); setIsConfirmedPlan(false); resetRefinement(); }}
                    className="px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
                  >
                    Edit Profile & Inputs
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-10 shadow-2xl space-y-6">
                
                {/* Formatted Workout Rendering */}
                {renderFormattedWorkout(workout)}

                {streaming && (
                  <div className="flex items-center gap-3 pt-4 text-xs text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Your coach is writing your protocol…
                  </div>
                )}

                {/* REFINE SECTION */}
                {!isConfirmedPlan && !streaming && (
                  <div className="mt-10 pt-8 border-t border-zinc-800">
                    <div className="bg-zinc-900/90 border border-zinc-700/60 rounded-xl p-6 space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-1">Refine Your Protocol</h4>
                        <p className="text-xs text-zinc-400 font-light leading-relaxed">
                          Want to adjust anything? Describe it below in English. Only what you ask for will change.
                          Your survey answers and any changes already applied stay locked.
                        </p>
                      </div>

                      {changeLog.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Applied Changes</p>
                          <ol className="space-y-2">
                            {changeLog.map((c, i) => (
                              <li key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
                                <p className="text-zinc-200">
                                  <span className="text-zinc-500 mr-2">{String(i + 1).padStart(2, '0')}</span>
                                  {c.request}
                                </p>
                                <p className="text-zinc-500 mt-1 font-light">{c.summary}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {[
                          'Add more stretching on Day 2',
                          'Swap the rest day from Wednesday to Thursday',
                          'Move leg training to a different day',
                        ].map((example) => (
                          <button
                            type="button"
                            key={example}
                            onClick={() => setRefineInput(example)}
                            disabled={refining}
                            className="px-3 py-1.5 rounded-full border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition disabled:opacity-50"
                          >
                            {example}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRefinePlan();
                        }}
                        maxLength={1000}
                        rows={3}
                        disabled={refining}
                        placeholder="e.g. More mobility work on Day 3, and make Saturday a rest day instead of Sunday."
                        className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none disabled:opacity-60"
                      />

                      {refineError && <p className="text-xs text-red-400">{refineError}</p>}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={handleRefinePlan}
                          disabled={refining || !refineInput.trim()}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition font-semibold text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {refining ? 'Updating Protocol…' : 'Apply Changes ↗'}
                        </button>
                        {planHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={handleUndoRefine}
                            disabled={refining}
                            className="w-full sm:w-auto px-5 py-3 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-xs tracking-wider uppercase disabled:opacity-40"
                          >
                            Undo Last Change
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONFIRMATION SECTION */}
                {!streaming && (
                <div className="mt-10 pt-8 border-t border-zinc-800 space-y-6">
                  {!isConfirmedPlan ? (
                    <div className="bg-zinc-900/90 border border-zinc-700/60 rounded-xl p-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-1">Finalize Your Protocol</h4>
                        <p className="text-xs text-zinc-400 font-light">
                          Review your protocol above. Confirm it to save it as your active standard.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                          onClick={confirmAndActivate}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black hover:bg-zinc-200 transition font-semibold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                          Confirm Final & Activate Plan ↗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex items-center justify-between">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-white">Status: Active Protocol Locked & Saved</p>
                        <p className="text-zinc-400">Your routine is officially active in system memory.</p>
                      </div>
                      <div className="flex gap-2">
                      {activeProtocol && (
                        <button
                          onClick={() => { setShowDashboard(true); window.scrollTo({ top: 0 }); }}
                          className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold transition"
                        >
                          Today&apos;s Training ↗
                        </button>
                      )}
                      <button
                        onClick={() => setIsConfirmedPlan(false)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[11px] transition"
                      >
                        Unlock / Edit Plan
                      </button>
                      </div>
                    </div>
                  )}
                </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

const UNIT_INPUT_CLASS =
  'w-full bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (unit: string) => void;
}) {
  return (
    <div className="flex rounded-full border border-zinc-800 bg-zinc-900/60 p-0.5">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider transition ${
            value === opt ? 'bg-zinc-100 text-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const EMPTY_CELL = /^[-—–\s]*$/;

// Links the model uses as a placeholder are not trustworthy, so they are hidden.
const isUsefulVideoLink = (url: string) =>
  /^https:\/\/(www\.)?youtube\.com\/results\?search_query=/.test(url) &&
  !/search_query=(exercise\+)?(tutorial|exercise)(\+tutorial)?$/i.test(url);

function PlanTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [openRow, setOpenRow] = useState<number | null>(null);
  const howToIndex = headers.findIndex((h) => /how\s*to/i.test(h));
  const visible = headers.map((_, i) => i).filter((i) => i !== howToIndex);

  const renderCell = (cell: string, cIndex: number, tip: string | null, rIndex: number) => {
    const clean = (cell || '').replace(/\*\*/g, '');
    const linkMatch = clean.match(/\[(.*?)\]\((.*?)\)/);

    if (linkMatch) {
      if (!isUsefulVideoLink(linkMatch[2])) {
        return <td key={cIndex} className="py-3 px-4 text-zinc-600">—</td>;
      }
      return (
        <td key={cIndex} className="py-3 px-4 text-zinc-300 whitespace-nowrap">
          <a href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-white underline underline-offset-4 font-medium hover:text-zinc-400">
            {linkMatch[1]} ↗
          </a>
        </td>
      );
    }

    if (cIndex === 0 && tip) {
      const isOpen = openRow === rIndex;
      return (
        <td key={cIndex} className="py-3 px-4 text-zinc-300">
          <div className="flex items-start gap-2">
            <span>{clean}</span>
            <button
              type="button"
              onClick={() => setOpenRow(isOpen ? null : rIndex)}
              aria-expanded={isOpen}
              className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider transition ${
                isOpen ? 'bg-white text-black border-white' : 'border-zinc-600 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Tip
            </button>
          </div>
        </td>
      );
    }

    return (
      <td key={cIndex} className={`py-3 px-4 ${EMPTY_CELL.test(clean) ? 'text-zinc-600' : 'text-zinc-300'}`}>
        {EMPTY_CELL.test(clean) ? '—' : clean}
      </td>
    );
  };

  return (
    <div className="overflow-x-auto my-6 border border-zinc-800 rounded-xl bg-zinc-950 shadow-xl">
      <table className="w-full text-left border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-zinc-900 text-zinc-300 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-800">
            {visible.map((i) => (
              <th key={i} className="py-3 px-4">{headers[i]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {rows.map((row, rIndex) => {
            const rawTip = howToIndex >= 0 ? (row[howToIndex] || '').replace(/\*\*/g, '') : '';
            const tip = EMPTY_CELL.test(rawTip) ? null : rawTip;
            const steps = tip ? tip.split(/\s*;\s*/).filter(Boolean) : [];
            return (
              <Fragment key={rIndex}>
                <tr className="hover:bg-zinc-900/50 transition-colors">
                  {visible.map((i) => renderCell(row[i], i, tip, rIndex))}
                </tr>
                {tip && openRow === rIndex && (
                  <tr className="bg-zinc-900/70">
                    <td colSpan={visible.length} className="px-4 py-4">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">How to perform</p>
                      <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-xs md:text-sm leading-relaxed">
                        {steps.map((step, sIndex) => (
                          <li key={sIndex}>{step}</li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
