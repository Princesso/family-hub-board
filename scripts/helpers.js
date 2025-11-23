(function(){
  // Global namespace
  window.App = window.App || {};

  // Utility helpers and storage
  const KEY = 'familyHubBoard.v1';

  function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

  function today(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
  function toISO(d){ if(!d) return null; const dt = new Date(d); dt.setHours(0,0,0,0); return dt.toISOString(); }
  function fromISO(s){ return s ? new Date(s) : null; }
  function fmtDate(d){ const dt = new Date(d); return dt.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'}); }
  function daysDiff(a,b){ const d1 = new Date(a); const d2 = new Date(b); return Math.round((d2 - d1)/(1000*60*60*24)); }
  function inRange(d, start, end){ const x = new Date(d).getTime(); return x >= new Date(start).getTime() && x <= new Date(end).getTime(); }

  const defaultState = ()=>({
    householdId: uid('home'),
    householdName: 'Your Household',
    createdAt: toISO(today()),
    members: [],
    chores: [],
    foodPlan: null,
    birthdayReminders: [],
    openBoard: [],
    wishlist: [],
    holidays: [],
    timeOff: [],
    rules: [
      { id: uid('rule'), title: 'We speak with kindness', detail: 'Use calm voices, no name-calling. Listen fully, then respond.' },
      { id: uid('rule'), title: 'We settle scores with hugs + honesty', detail: 'When hurt, we give a hug first, then say what happened and how it felt.' },
      { id: uid('rule'), title: 'We share responsibilities', detail: 'Everyone helps according to age; we cheer each other on.' },
      { id: uid('rule'), title: 'We respect quiet time', detail: 'After 9pm, low noise and screens off for kids.' }
    ],
    traditions: [
      { id: uid('trad'), title: 'Sunday family check-in', detail: '15 minutes to reflect, appreciate, and plan the week.' },
      { id: uid('trad'), title: 'Friday game night', detail: 'Cards, board games, or charades together.' },
      { id: uid('trad'), title: 'Monthly gratitude jar', detail: 'Write one thank-you note per person; read at month end.' }
    ],
    archives: { chores:[], openBoard:[], wishlist:[], birthdays:[], holidays:[], timeOff:[], rules:[], traditions:[] },
    invites: { token: uid('invite'), createdById: null, createdAt: toISO(new Date()) }
  });

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw){ const st = defaultState(); save(st); return st; }
      return JSON.parse(raw);
    } catch(e){ console.error('Load failed', e); const st = defaultState(); save(st); return st; }
  }

  function save(state){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){ console.error('Save failed', e); } }
  function reset(){ localStorage.removeItem(KEY); }

  function ensureArray(arr){ return Array.isArray(arr) ? arr : []; }

  function archiveItem(category, item){ const s = load(); s.archives[category] = ensureArray(s.archives[category]); s.archives[category].unshift({...item, archivedAt: toISO(new Date())}); save(s); }
  function restoreItem(category, id){ const s = load(); s.archives[category] = ensureArray(s.archives[category]); const idx = s.archives[category].findIndex(x=>x.id===id); if(idx>-1){ const it = s.archives[category].splice(idx,1)[0]; // restore into live
      if(category==='chores') s.chores.unshift(it);
      if(category==='openBoard') s.openBoard.unshift(it);
      if(category==='wishlist') s.wishlist.unshift(it);
      if(category==='birthdays') s.birthdayReminders.unshift(it);
      if(category==='holidays') s.holidays.unshift(it);
      if(category==='timeOff') s.timeOff.unshift(it);
      if(category==='rules') s.rules.unshift(it);
      if(category==='traditions') s.traditions.unshift(it);
      save(s);
    }
  }

  // Meal plan generation for Nigerian dishes
  const DISHES = {
    breakfast: [
      'Oatmeal with banana and peanuts',
      'Pap with moi moi',
      'Yam with egg sauce',
      'Plantain pancakes with fruit',
      'Whole wheat bread with omelette',
      'Akara with custard',
      'Smoothie bowl with tiger nut milk'
    ],
    mainsA: [ // two-week set A
      'Jollof rice + grilled chicken + coleslaw',
      'Efo riro with fish + semovita',
      'Beans porridge + ripe plantain',
      'Ofada rice + light ayamase + cucumber',
      'Okra soup + wheat swallow + turkey',
      'Sweet potato + egg sauce + veggies',
      'Moi moi + garri with milk and nuts',
      'Afang soup + fufu + fish',
      'Brown rice stir-fry + veggies + shrimp',
      'Egusi light oil + eba + steamed spinach',
      'Fish pepper soup + boiled plantain',
      'Garden egg sauce + boiled yam',
      'Tuwo shinkafa + veg soup + grilled fish',
      'Beans and corn (adalu) + salad'
    ],
    mainsB: [ // two-week set B
      'Fried rice + grilled turkey + salad',
      'Okazi soup + fufu + fish',
      'Jollof spaghetti + sautéed veggies',
      'Ogbono soup + semovita + chicken',
      'Vegetable yam porridge + prawns',
      'Steamed plantain + beans and avocado',
      'Ofada rice + tomato stew + eggs',
      'Okra and ogbono mix + eba + fish',
      'Coconut rice + grilled fish + carrots',
      'Banga soup light + starch or eba',
      'Chicken suya salad + sweet potato',
      'Peppered snail + sautéed spinach + rice',
      'Beans cake (moi moi) + peppered fish',
      'Catfish pepper soup + Irish potatoes'
    ],
    snacks: [
      'Fruit bowl', 'Greek yogurt + honey', 'Groundnuts + banana', 'Boiled eggs', 'Carrot sticks + hummus', 'Tiger nut drink', 'Kulikuli + fruit'
    ]
  };

  function shuffle(arr){ return arr.map(v=>[Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }

  function generateFoodPlan(state, baseMonth){
    // baseMonth is Date for the first day of month
    const monthStart = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
    const weeks = [];
    const setA = shuffle(DISHES.mainsA).slice(0,14);
    const setB = shuffle(DISHES.mainsB).slice(0,14);
    const breakfasts = shuffle(DISHES.breakfast);
    const snacks = shuffle(DISHES.snacks);

    // Two 2-week menus: days 1-14 from setA, 15-28 from setB
    for(let w=0; w<4; w++){
      const days = [];
      for(let d=1; d<=7; d++){
        const dayIndex = w*7 + d; // 1..28
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayIndex);
        const breakfast = breakfasts[(dayIndex-1)%breakfasts.length];
        const main = (dayIndex<=14) ? setA[(dayIndex-1)%setA.length] : setB[(dayIndex-15)%setB.length];
        const batch = (dayIndex===1 || dayIndex===15);
        const snacksForHusband = [ snacks[(dayIndex-1)%snacks.length], snacks[(dayIndex)%snacks.length] ];
        days.push({ date: toISO(date), meals: { breakfast, lunch: main, dinner: main, husbandSnacks: snacksForHusband }, batchCook: batch });
      }
      weeks.push({ days });
    }
    return { startDate: toISO(monthStart), month: monthStart.getMonth(), year: monthStart.getFullYear(), weeks, version: 1 };
  }

  function getCurrentMonthPlan(state){
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if(!state.foodPlan || new Date(fromISO(state.foodPlan.startDate)).getMonth() !== monthStart.getMonth() || new Date(fromISO(state.foodPlan.startDate)).getFullYear() !== monthStart.getFullYear()){
      state.foodPlan = generateFoodPlan(state, monthStart);
      save(state);
    }
    return state.foodPlan;
  }

  function setMonthPlan(state, date){ state.foodPlan = generateFoodPlan(state, date); save(state); }

  // Expose helpers
  window.App.Helpers = {
    uid, load, save, reset, archiveItem, restoreItem, fmtDate, toISO, fromISO, today, daysDiff, inRange,
    generateFoodPlan, getCurrentMonthPlan, setMonthPlan, DISHES
  };
})();
