import fs from 'fs';

const BASE_URL = 'http://localhost:3000/api/generate';

// 1. Definiamo i parametri per generare 50 scenari unici
const SPORTS = [
  'Soccer / Football', 'Tennis', 'Basketball', 'Track & Field',
  'Volleyball', 'Combat Sports / MMA', 'Bodybuilding / Fitness',
  'Baseball / Softball', 'Swimming', 'Cycling', 'Rugby', 'CrossFit'
];

const GOALS = [
  'Explosiveness & Power',
  'Hypertrophy & Strength',
  'Endurance & Conditioning',
  'Mobility & Injury Prevention'
];

const INJURY_PROFILES = [
  { name: 'Sano / Nessuno', detail: 'None / Healthy' },
  { name: 'Infortunio ACL (Ginocchio)', detail: 'Previous ACL reconstruction on left knee, avoid high rotational impact' },
  { name: 'Conflitto Subacromiale (Spalla)', detail: 'Right shoulder rotator cuff impingement, limit overhead pressing' },
  { name: 'Problema Lombare (Schiena)', detail: 'L4/L5 disc bulge, strict axial loading limit' },
  { name: 'Distorsione Caviglia', detail: 'Chronic right ankle instability' }
];

// Genera 50 scenari variando sport, infortuni, obiettivi e livelli
const generate50Scenarios = () => {
  const scenarios = [];
  let id = 1;

  for (let i = 0; i < 50; i++) {
    const sport = SPORTS[i % SPORTS.length];
    const goal = GOALS[i % GOALS.length];
    const injury = INJURY_PROFILES[i % INJURY_PROFILES.length];
    const level = i % 3 === 0 ? 'Beginner' : i % 3 === 1 ? 'Intermediate' : 'Advanced / Athlete';
    const days = `${(i % 4) + 2} Days / Week`;
    const equipment = i % 2 === 0 ? 'Full Gym + Field/Pitch' : 'Freeweight / Home';

    scenarios.push({
      id,
      sport,
      goal,
      level,
      daysPerWeek: days,
      equipment,
      injuries: injury.detail,
      injuryType: injury.name,
    });
    id++;
  }
  return scenarios;
};

function buildPrompt(scenario) {
  return `
    Create an elite, highly compact training plan for an athlete:
    - Primary Sport: ${scenario.sport}
    - Primary Goal: ${scenario.goal}
    - Athlete Level: ${scenario.level}
    - Training Frequency: ${scenario.daysPerWeek}
    - Equipment Access: ${scenario.equipment}
    - Injury History / Limitations: ${scenario.injuries}
    - Additional Notes: Automated Agent Test Run #${scenario.id}

    Format Instructions:
    1. Provide a brief overview/summary section at the top.
    2. For EACH training day, create a clear, compact Markdown Table with these exact columns:
       | Exercise | Sets x Reps | Rest | Focus / Technique | Tutorial |
    3. In the "Tutorial" column, insert a markdown link searching YouTube for that exercise, like: [Watch](https://www.youtube.com/results?search_query=Exercise+Name+exercise+tutorial)
    4. Keep non-table explanations short and punchy.
  `;
}

function evaluateWorkout(scenario, markdown) {
  const checks = {
    hasTables: markdown.includes('| Exercise |') || markdown.includes('|---'),
    hasYoutubeLinks: markdown.includes('youtube.com/results?search_query='),
    hasSportMention: markdown.toLowerCase().includes(scenario.sport.split('/')[0].toLowerCase().trim()),
    aclCheckPassed: true,
    aclNotes: 'N/A'
  };

  // Verifica specifica per infortunio ACL
  if (scenario.injuryType.includes('ACL')) {
    const textLower = markdown.toLowerCase();
    const flagsHighRisk = textLower.includes('depth jump') || textLower.includes('heavy back squat');
    const mentionsACLPrecaution = textLower.includes('acl') || textLower.includes('knee') || textLower.includes('low-impact') || textLower.includes('modification') || textLower.includes('stability');
    
    if (flagsHighRisk && !mentionsACLPrecaution) {
      checks.aclCheckPassed = false;
      checks.aclNotes = 'FAIL: Prescritti esercizi ad alto impatto senza cautele per ACL.';
    } else {
      checks.aclCheckPassed = true;
      checks.aclNotes = 'PASS: Incluse modifiche per il ginocchio o adattamenti specifici.';
    }
  }

  const passedAll = checks.hasTables && checks.hasYoutubeLinks && checks.aclCheckPassed;
  return { ...checks, passedAll };
}

async function runAgent() {
  console.log('🚀 Avvio Agente di Test per Athlete AI (50 Scenari in corso...)...\n');
  const scenarios = generate50Scenarios();
  const results = [];

  for (const scenario of scenarios) {
    console.log(`[${scenario.id}/50] Test: ${scenario.sport} | Obiettivo: ${scenario.goal} | Infortunio: ${scenario.injuryType}`);
    const prompt = buildPrompt(scenario);
    
    const startTime = Date.now();
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        console.error(` ❌ Errore HTTP ${response.status}`);
        results.push({ id: scenario.id, sport: scenario.sport, injury: scenario.injuryType, status: 'HTTP ERROR', duration: `${duration}s` });
        continue;
      }

      const data = await response.json();
      const output = data.result || '';

      const evalData = evaluateWorkout(scenario, output);

      results.push({
        id: scenario.id,
        sport: scenario.sport,
        injury: scenario.injuryType,
        passed: evalData.passedAll ? 'PASSED' : 'FAILED',
        duration: `${duration}s`,
        hasTables: evalData.hasTables ? 'Sì' : 'No',
        hasLinks: evalData.hasYoutubeLinks ? 'Sì' : 'No',
        aclStatus: evalData.aclNotes
      });

      console.log(`    Esito: ${evalData.passedAll ? '✅ PASSED' : '❌ FAILED'} (${duration}s)\n`);

    } catch (err) {
      console.error(` ❌ Errore di connessione:`, err.message);
      results.push({ id: scenario.id, sport: scenario.sport, injury: scenario.injuryType, status: 'NETWORK ERROR', duration: '0s' });
    }
  }

  console.log('\n======================================================');
  console.log('                 REPORT FINALE TEST AGENT             ');
  console.log('======================================================\n');
  
  console.table(results);

  const passedCount = results.filter(r => r.passed === 'PASSED').length;
  console.log(`\nRisultato Finale: ${passedCount} / 50 Scenari Superati (${(passedCount / 50) * 100}%)`);

  fs.writeFileSync('agent-test-report.json', JSON.stringify(results, null, 2));
  console.log('\n📁 Report dettagliato salvato in agent-test-report.json');
}

runAgent();