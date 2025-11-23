(function(){
  window.App = window.App || {};
  const H = window.App.Helpers;

  function showModal(sel){ $('#overlay').removeClass('hidden'); $(sel).removeClass('hidden'); }
  function hideModal(sel){ $(sel).addClass('hidden'); if($('.fixed.inset-0:not(.hidden)').length<=1){ $('#overlay').addClass('hidden'); } }

  function populateMemberSelects(state){
    const optionsAll = state.members.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
    $('#choreAssignee').html(`<option value="">Unassigned</option>${optionsAll}`);
    const kids = state.members.filter(m=>m.role==='Kid');
    $('#wishChild').html(kids.map(m=>`<option value="${m.id}">${m.name}</option>`).join(''));
    const adults = state.members.filter(m=>m.role==='Adult');
    $('#timeoffMember').html(adults.map(m=>`<option value="${m.id}">${m.name}</option>`).join(''));

    // Filter dropdown
    $('#choreMemberFilter').html(`<option value="">All members</option>${optionsAll}`);
  }

  function renderChores(){
    const s = H.load();
    const freqFilter = $('.filter-chip.active').data('freq') || '';
    const memberFilter = $('#choreMemberFilter').val() || '';

    const items = s.chores.filter(c=>{
      const byFreq = !freqFilter || c.frequency===freqFilter;
      const byMember = !memberFilter || c.assignedToId===memberFilter;
      return byFreq && byMember;
    });

    const list = $('#choreList').empty();
    if(items.length===0){ list.append(`<div class="text-sm text-[#64748B]">No chores yet. Click Add chore to create one.</div>`); return; }

    items.forEach(ch=>{
      const member = s.members.find(m=>m.id===ch.assignedToId);
      const due = ch.dueDate ? `Due ${H.fmtDate(ch.dueDate)}` : ch.frequency.charAt(0).toUpperCase()+ch.frequency.slice(1);
      const card = $(`
        <div class="item-card card-hover flex flex-col gap-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold">${ch.title}</div>
              <div class="text-xs text-[#64748B]">${due}${member?` • ${member.name}`:''}</div>
            </div>
            <div class="row-actions">
              <label class="inline-flex items-center gap-2 text-xs"><input type="checkbox" ${ch.status==='done'?'checked':''} data-act="toggle" data-id="${ch.id}"><span>Done</span></label>
              <button class="btn-ghost" data-act="edit" data-id="${ch.id}">Edit</button>
            </div>
          </div>
          ${ch.details?`<div class="text-sm text-[#334155]">${ch.details}</div>`:''}
        </div>
      `);
      list.append(card);
    });
  }

  function renderFood(plan){
    const container = $('#foodGrid').empty();
    const monthLabel = new Date(plan.year, plan.month, 1).toLocaleDateString(undefined, { month:'long', year:'numeric' });
    $('#foodMonthLabel').text(monthLabel);

    // Build 4-week horizontal grid
    let dayNum = 1;
    plan.weeks.forEach((w,i)=>{
      const col = $(`<div class="w-[260px] inline-flex flex-col gap-3"> <div class="font-semibold text-[#0F172A]" style="font-family: Oswald;">Week ${i+1}</div></div>`);
      w.days.forEach(d=>{
        const dt = new Date(d.date);
        const tile = $(`
          <div class="food-tile card-hover" data-batch="${d.batchCook}">
            <div class="flex items-center justify-between">
              <div class="day">${dt.toLocaleDateString(undefined,{weekday:'short'})} ${dayNum}</div>
              ${d.batchCook?`<span class="badge" title="Batch cook">Cook</span>`:''}
            </div>
            <div class="meal mt-1"><span class="font-medium text-[#0F172A]">Breakfast:</span> ${d.meals.breakfast}</div>
            <div class="meal"><span class="font-medium text-[#0F172A]">Lunch:</span> ${d.meals.lunch}</div>
            <div class="meal"><span class="font-medium text-[#0F172A]">Dinner:</span> ${d.meals.dinner}</div>
            <div class="meal text-[#1E90A8]"><span class="font-medium text-[#0F172A]">Husband snacks:</span> ${d.meals.husbandSnacks.join(' • ')}</div>
          </div>
        `);
        col.append(tile);
        dayNum++;
      });
      container.append(col);
    });
  }

  function renderBirthdays(){
    const s = H.load();
    const list = $('#birthdayList').empty();
    const items = s.birthdayReminders.slice();
    const now = new Date();
    const thisMonth = now.getMonth();

    // Birthdays this month highlight
    const monthItems = items.filter(b=>{ const d=new Date(b.date); return d.getMonth()===thisMonth; })
                            .sort((a,b)=> new Date(a.date).getDate() - new Date(b.date).getDate());
    const $month = $('#birthdaysThisMonth').empty();
    if(monthItems.length){
      const parts = monthItems.map(b=>{ const d=new Date(b.date); return `${b.name} (${d.getDate()})`; });
      $month.append(`<div class="p-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl text-sm">Birthdays this month: <span class="font-medium">${parts.join(', ')}</span></div>`);
    }

    if(items.length===0){ list.append('<div class="text-sm text-[#64748B]">No reminders yet.</div>'); return; }
    items.sort((a,b)=> new Date(a.date) - new Date(b.date));

    items.forEach(b=>{
      const yr = now.getFullYear();
      const next = new Date(b.date);
      const bd = new Date(b.date);
      next.setFullYear(yr);
      if(next < now){ next.setFullYear(yr+1); }
      const days = Math.max(0, Math.ceil((next - now)/(1000*60*60*24)));
      const isToday = (bd.getMonth()===now.getMonth() && bd.getDate()===now.getDate());
      const card = $(`
        <div class="item-card card-hover ${isToday?'border-2 border-[#FF6B3D]/60 bg-[#FF6B3D]/10':''}">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold">${b.name} ${isToday?'<span class="badge">Today 🎉</span>':''}</div>
              <div class="text-xs text-[#64748B]">${H.fmtDate(b.date)} • ${days} day${days!==1?'s':''} to go</div>
            </div>
            <div class="row-actions">
              <button class="btn-ghost" data-act="edit-birthday" data-id="${b.id}">Edit</button>
            </div>
          </div>
        </div>
      `);
      list.append(card);
    });
  }

  function renderOpenBoard(){
    const s = H.load();
    const list = $('#openBoardList').empty();
    if(s.openBoard.length===0){ list.append('<div class="text-sm text-[#64748B]">No items yet.</div>'); return; }
    s.openBoard.forEach(it=>{
      const who = s.members.find(m=>m.id===it.createdById);
      const card = $(`
        <div class="item-card card-hover">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2"><span class="chip">${it.type}</span><div class="font-semibold">${it.title}</div></div>
              <div class="text-sm mt-1">${it.detail || ''}</div>
              <div class="text-xs text-[#64748B] mt-1">By ${who?who.name:'Unknown'} on ${H.fmtDate(it.createdAt)}</div>
            </div>
            <div class="row-actions">
              <button class="btn-ghost" data-act="edit-open" data-id="${it.id}">Edit</button>
            </div>
          </div>
        </div>
      `);
      list.append(card);
    });
  }

  function renderWishlist(){
    const s = H.load();
    const wrap = $('#wishlist').empty();
    if(s.wishlist.length===0){ wrap.append('<div class="text-sm text-[#64748B]">No wishes yet.</div>'); return; }
    s.wishlist.forEach(w=>{
      const child = s.members.find(m=>m.id===w.childId);
      const card = $(`
        <div class="item-card card-hover">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold">${w.item} ${w.purchased?'<span class="badge">Purchased</span>':''}</div>
              <div class="text-xs text-[#64748B]">${child?child.name:''} • Priority ${w.priority}${w.price?` • ₦${Number(w.price).toLocaleString()}`:''}</div>
              ${w.link?`<a class="text-[#1E90A8] text-sm underline" href="${w.link}" target="_blank" rel="noopener">View link</a>`:''}
            </div>
            <div class="row-actions">
              <button class="btn-ghost" data-act="toggle-purchased" data-id="${w.id}">${w.purchased?'Unmark':'Purchased'}</button>
              <button class="btn-ghost" data-act="edit-wish" data-id="${w.id}">Edit</button>
            </div>
          </div>
        </div>
      `);
      wrap.append(card);
    });
  }

  function renderHolidays(){
    const s = H.load();
    const strip = $('#holidayStrip').empty();
    if(s.holidays.length===0){ strip.append('<div class="text-sm text-[#64748B]">No holidays planned.</div>'); return; }
    s.holidays.forEach(h=>{
      const card = $(`
        <div class="item-card min-w-[260px]">
          <div class="flex items-center justify-between"><div class="font-semibold">${h.title}</div><button class="btn-ghost" data-act="edit-holiday" data-id="${h.id}">Edit</button></div>
          <div class="text-xs text-[#64748B]">${h.destination || 'Anywhere'} • ${H.fmtDate(h.start)} to ${H.fmtDate(h.end)}</div>
          ${h.budget?`<div class="text-sm mt-1">Budget: ₦${Number(h.budget).toLocaleString()}</div>`:''}
          ${h.notes?`<div class="text-sm mt-1">${h.notes}</div>`:''}
        </div>
      `);
      strip.append(card);
    });
  }

  function renderTimeoff(){
    const s = H.load();
    const body = $('#timeoffTable').empty();
    if(s.timeOff.length===0){ body.append('<tr><td colspan="5" class="p-3 text-[#64748B]">No time off yet.</td></tr>'); return; }
    s.timeOff.forEach(t=>{
      const adult = s.members.find(m=>m.id===t.memberId);
      const row = $(`
        <tr class="border-b border-black/5">
          <td class="p-3">${adult?adult.name:''}</td>
          <td class="p-3">${H.fmtDate(t.start)}</td>
          <td class="p-3">${H.fmtDate(t.end)}</td>
          <td class="p-3">${t.reason || ''}</td>
          <td class="p-3">
            <div class="row-actions">
              <button class="btn-ghost" data-act="edit-timeoff" data-id="${t.id}">Edit</button>
            </div>
          </td>
        </tr>
      `);
      body.append(row);
    });
  }

  function renderRules(){
    const s = H.load();
    const rl = $('#rulesList').empty();
    const tr = $('#traditionsList').empty();
    if(!s.rules || s.rules.length===0){ rl.append('<div class="text-sm text-[#64748B]">No rules yet.</div>'); }
    if(!s.traditions || s.traditions.length===0){ tr.append('<div class="text-sm text-[#64748B]">No traditions yet.</div>'); }
    (s.rules||[]).forEach(r=>{
      const card = $(`
        <div class="item-card card-hover">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold">${r.title}</div>
              ${r.detail?`<div class="text-sm mt-1">${r.detail}</div>`:''}
            </div>
            <div class="row-actions">
              <button class="btn-ghost" data-act="edit-rule" data-id="${r.id}">Edit</button>
            </div>
          </div>
        </div>
      `);
      rl.append(card);
    });
    (s.traditions||[]).forEach(t=>{
      const card = $(`
        <div class="item-card card-hover">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold">${t.title}</div>
              ${t.detail?`<div class="text-sm mt-1">${t.detail}</div>`:''}
            </div>
            <div class="row-actions">
              <button class="btn-ghost" data-act="edit-tradition" data-id="${t.id}">Edit</button>
            </div>
          </div>
        </div>
      `);
      tr.append(card);
    });
  }

  function bindRuleActions(){
    $('#addRuleBtn').off('click').on('click', function(){ $('#ruleId').val(''); $('#ruleTitle').val(''); $('#ruleDetail').val(''); $('#deleteRuleBtn').addClass('hidden'); $('#ruleModalTitle').text('Add rule'); $('#overlay').removeClass('hidden'); $('#ruleModal').removeClass('hidden'); });
    $('#saveRuleBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#ruleId').val(); const title=$('#ruleTitle').val().trim(); if(!title){ alert('Title required'); return; } const obj={ id:id||H.uid('rule'), title, detail: $('#ruleDetail').val().trim() }; if(id){ const i=(s.rules||[]).findIndex(x=>x.id===id); if(i>-1) s.rules[i]=obj; } else { s.rules = s.rules||[]; s.rules.unshift(obj);} H.save(s); $('[data-close="#ruleModal"]').trigger('click'); $('#overlay').addClass('hidden'); $('#ruleModal').addClass('hidden'); renderRules(); });
    $('#rulesList').on('click','[data-act="edit-rule"]', function(){ const s=H.load(); const id=$(this).data('id'); const it=(s.rules||[]).find(x=>x.id===id); if(!it) return; $('#ruleId').val(it.id); $('#ruleTitle').val(it.title); $('#ruleDetail').val(it.detail||''); $('#deleteRuleBtn').removeClass('hidden'); $('#ruleModalTitle').text('Edit rule'); $('#overlay').removeClass('hidden'); $('#ruleModal').removeClass('hidden'); });
    $('#deleteRuleBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#ruleId').val(); const i=(s.rules||[]).findIndex(x=>x.id===id); if(i>-1){ const [it]=s.rules.splice(i,1); H.archiveItem('rules', it); H.save(s); } $('[data-close="#ruleModal"]').trigger('click'); $('#overlay').addClass('hidden'); $('#ruleModal').addClass('hidden'); renderRules(); });
  }

  function bindTraditionActions(){
    $('#addTraditionBtn').off('click').on('click', function(){ $('#traditionId').val(''); $('#traditionTitle').val(''); $('#traditionDetail').val(''); $('#deleteTraditionBtn').addClass('hidden'); $('#traditionModalTitle').text('Add tradition'); $('#overlay').removeClass('hidden'); $('#traditionModal').removeClass('hidden'); });
    $('#saveTraditionBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#traditionId').val(); const title=$('#traditionTitle').val().trim(); if(!title){ alert('Title required'); return; } const obj={ id:id||H.uid('trad'), title, detail: $('#traditionDetail').val().trim() }; if(id){ const i=(s.traditions||[]).findIndex(x=>x.id===id); if(i>-1) s.traditions[i]=obj; } else { s.traditions = s.traditions||[]; s.traditions.unshift(obj);} H.save(s); $('[data-close="#traditionModal"]').trigger('click'); $('#overlay').addClass('hidden'); $('#traditionModal').addClass('hidden'); renderRules(); });
    $('#traditionsList').on('click','[data-act="edit-tradition"]', function(){ const s=H.load(); const id=$(this).data('id'); const it=(s.traditions||[]).find(x=>x.id===id); if(!it) return; $('#traditionId').val(it.id); $('#traditionTitle').val(it.title); $('#traditionDetail').val(it.detail||''); $('#deleteTraditionBtn').removeClass('hidden'); $('#traditionModalTitle').text('Edit tradition'); $('#overlay').removeClass('hidden'); $('#traditionModal').removeClass('hidden'); });
    $('#deleteTraditionBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#traditionId').val(); const i=(s.traditions||[]).findIndex(x=>x.id===id); if(i>-1){ const [it]=s.traditions.splice(i,1); H.archiveItem('traditions', it); H.save(s); } $('[data-close="#traditionModal"]').trigger('click'); $('#overlay').addClass('hidden'); $('#traditionModal').addClass('hidden'); renderRules(); });
  }
  function renderArchives(){
    const s = H.load();
    function renderList(target, arr, cat){
      const el = $(target).empty();
      if(!arr || arr.length===0){ el.append('<div class="text-xs text-[#64748B]">Empty</div>'); return; }
      arr.forEach(x=>{
        const item = $(`
          <div class="item-card flex items-center justify-between">
            <div class="text-sm">${x.title || x.name || x.item || x.destination || x.reason || 'Item'} <span class="text-xs text-[#64748B]">archived</span></div>
            <button class="btn-secondary" data-restore="${cat}" data-id="${x.id}">Restore</button>
          </div>
        `);
        el.append(item);
      });
    }
    renderList('#archChores', s.archives.chores, 'chores');
    renderList('#archOpen', s.archives.openBoard, 'openBoard');
    renderList('#archWish', s.archives.wishlist, 'wishlist');
    renderList('#archBirthdays', s.archives.birthdays, 'birthdays');
    renderList('#archHolidays', s.archives.holidays, 'holidays');
    renderList('#archTimeoff', s.archives.timeOff, 'timeOff');
    renderList('#archRules', s.archives.rules, 'rules');
    renderList('#archTraditions', s.archives.traditions, 'traditions');
  }

  function updateHouseholdHeader(){
    const s = H.load();
    $('#householdName').text(s.householdName || 'Your Household');
    $('#householdLabel').text('Family Hub');
  }

  function bindTabs(){
    $('.tab-link').off('click').on('click', function(){
      const target = $(this).data('target');
      $('section[id^="section-"]').hide();
      $(target).show();
      $('.tab-link').removeClass('bg-black/5');
      $(this).addClass('bg-black/5');
    });
    // Default
    $('.tab-link').first().trigger('click');
  }

  function seedBirthdaysFromMembers(){
    const s = H.load();
    const existingNames = new Set(s.birthdayReminders.map(b=>b.name));
    s.members.forEach(m=>{
      if(m.birthday && !existingNames.has(m.name)){
        s.birthdayReminders.push({ id:H.uid('bd'), name:m.name, date:m.birthday });
      }
    });
    H.save(s);
  }

  function onboardingNeeded(){
    const s = H.load();
    return !s.members || s.members.length===0;
  }

  function setupOnboarding(){
    const s = H.load();
    const $wrap = $('#memberInputs');
    function addMemberField(name='', role='Adult', birthday=''){
      const id = H.uid('memField');
      $wrap.append(`
        <div class="grid sm:grid-cols-4 gap-2 items-end" data-id="${id}">
          <div class="sm:col-span-2"><input class="field mem-name" placeholder="Name" value="${name}"></div>
          <div><select class="field mem-role"><option ${role==='Adult'?'selected':''}>Adult</option><option ${role==='Kid'?'selected':''}>Kid</option></select></div>
          <div><input type="date" class="field mem-bday" value="${birthday}"></div>
        </div>`);
    }
    // Add 4 fields by default
    if($wrap.children().length===0){ for(let i=0;i<4;i++) addMemberField(); }

    $('#addMemberField').off('click').on('click', function(){ addMemberField(); });

    $('#startBoardBtn').off('click').on('click', function(){
      const s = H.load();
      const name = $('#householdInput').val().trim() || 'Your Household';
      const members = [];
      $('#memberInputs > div[data-id]').each(function(){
        const nm = $(this).find('.mem-name').val().trim();
        const rl = $(this).find('.mem-role').val();
        const bd = $(this).find('.mem-bday').val();
        if(nm){
          members.push({ id: H.uid('mem'), name: nm, role: rl, isHusband: false, eats: rl==='Adult'?3:3, birthday: bd || null });
        }
      });
      s.members = members;
      H.save(s);
      seedBirthdaysFromMembers();
      updateHouseholdHeader();
      // Generate initial food plan for current month
      H.getCurrentMonthPlan(s);
      hideModal('#onboardModal');
      // Offer invite immediately
      $('#inviteBtn').trigger('click');
      renderAll();
    });

    $('#skipOnboard').off('click').on('click', function(){ hideModal('#onboardModal'); });
  }

  function setupInvites(){
    $('#inviteBtn').off('click').on('click', function(){
      const s = H.load();
      const url = new URL(window.location.href);
      url.searchParams.set('household', s.householdId);
      url.searchParams.set('invite', s.invites.token);
      $('#inviteLink').val(url.toString());
      showModal('#inviteModal');
    });
    $('#copyInvite').off('click').on('click', function(){
      const el = document.getElementById('inviteLink'); el.select(); el.setSelectionRange(0, 99999);
      document.execCommand('copy');
      $(this).text('Copied').delay(1000).queue(function(next){ $(this).text('Copy link'); next(); });
    });
    $('[data-close]').on('click', function(){ hideModal($(this).data('close')); });
  }

  function checkInviteLink(){
    const params = new URLSearchParams(window.location.search);
    const hh = params.get('household'); const tk = params.get('invite');
    if(hh && tk){ showModal('#joinModal'); }

    $('#doJoin').off('click').on('click', function(){
      const name = $('#joinName').val().trim(); const role = $('#joinRole').val();
      if(!name){ alert('Enter your name'); return; }
      const s = H.load();
      // For demo, we accept any token. Real-world would validate.
      if(s.householdId !== hh){
        // Create local stub if different household, but adopt their id
        s.householdId = hh; s.householdName = s.householdName || 'Family Household'; s.members = s.members || [];
        H.save(s);
      }
      const member = { id:H.uid('mem'), name, role, isHusband:false, eats: role==='Adult'?3:3, birthday:null };
      s.members.push(member); H.save(s);
      seedBirthdaysFromMembers();
      hideModal('#joinModal');
      // Cleanup URL
      const clean = new URL(window.location.href); clean.searchParams.delete('household'); clean.searchParams.delete('invite'); window.history.replaceState({}, document.title, clean.toString());
      renderAll();
    });
  }

  function bindChoreActions(){
    $('#addChoreBtn').off('click').on('click', function(){ $('#choreId').val(''); $('#choreTitle').val(''); $('#choreDetails').val(''); $('#choreFreq').val('daily'); $('#choreAssignee').val(''); $('#choreDue').val(''); $('#deleteChoreBtn').addClass('hidden'); $('#choreModalTitle').text('New chore'); showModal('#choreModal'); });

    $('#saveChoreBtn').off('click').on('click', function(){
      const s = H.load();
      const id = $('#choreId').val();
      const obj = { id: id || H.uid('chore'), title: $('#choreTitle').val().trim(), details: $('#choreDetails').val().trim(), frequency: $('#choreFreq').val(), assignedToId: $('#choreAssignee').val()||null, dueDate: $('#choreDue').val()||null, status: 'open', createdAt: H.toISO(new Date()) };
      if(!obj.title){ alert('Title is required'); return; }
      if(id){ const idx = s.chores.findIndex(c=>c.id===id); if(idx>-1) s.chores[idx] = {...s.chores[idx], ...obj}; } else { s.chores.unshift(obj); }
      H.save(s); hideModal('#choreModal'); renderChores();
    });

    $('#choreList').on('click', '[data-act="edit"]', function(){
      const id = $(this).data('id'); const s = H.load(); const ch = s.chores.find(c=>c.id===id);
      if(!ch) return;
      $('#choreId').val(ch.id); $('#choreTitle').val(ch.title); $('#choreDetails').val(ch.details||''); $('#choreFreq').val(ch.frequency); $('#choreAssignee').val(ch.assignedToId||''); $('#choreDue').val(ch.dueDate||''); $('#deleteChoreBtn').removeClass('hidden'); $('#choreModalTitle').text('Edit chore'); showModal('#choreModal');
    });

    $('#deleteChoreBtn').off('click').on('click', function(){ const id = $('#choreId').val(); const s = H.load(); const idx = s.chores.findIndex(c=>c.id===id); if(idx>-1){ const [it] = s.chores.splice(idx,1); H.archiveItem('chores', it); H.save(s); hideModal('#choreModal'); renderChores(); }});

    $('#choreList').on('change', 'input[type="checkbox"][data-act="toggle"]', function(){ const id = $(this).data('id'); const s = H.load(); const ch = s.chores.find(c=>c.id===id); if(ch){ ch.status = this.checked?'done':'open'; H.save(s); $(this).closest('.item-card').css('animation','highlight .8s ease'); }});

    $('.filter-chip').off('click').on('click', function(){ $('.filter-chip').removeClass('bg-black/10'); $('.filter-chip').removeClass('active'); $(this).addClass('active bg-black/10'); renderChores(); });
    $('#choreMemberFilter').off('change').on('change', renderChores);
  }

  function bindFoodActions(){
    $('#regenFood').off('click').on('click', function(){ const s = H.load(); const base = new Date(s.foodPlan.year, s.foodPlan.month, 1); s.foodPlan = H.generateFoodPlan(s, base); H.save(s); renderFood(s.foodPlan); $('#foodScroller').animate({scrollLeft:0}, 300); });
    $('#prevMonth').off('click').on('click', function(){ const s = H.load(); const d = new Date(s.foodPlan.year, s.foodPlan.month-1, 1); H.setMonthPlan(s, d); renderFood(s.foodPlan); $('#foodScroller').animate({scrollLeft:0}, 300); });
    $('#nextMonth').off('click').on('click', function(){ const s = H.load(); const d = new Date(s.foodPlan.year, s.foodPlan.month+1, 1); H.setMonthPlan(s, d); renderFood(s.foodPlan); $('#foodScroller').animate({scrollLeft:0}, 300); });
  }

  function bindBirthdayActions(){
    $('#addBirthdayBtn').off('click').on('click', function(){ $('#birthdayId').val(''); $('#birthdayName').val(''); $('#birthdayDate').val(''); $('#deleteBirthdayBtn').addClass('hidden'); $('#birthdayModalTitle').text('Add birthday'); showModal('#birthdayModal'); });
    $('#saveBirthdayBtn').off('click').on('click', function(){ const s = H.load(); const id = $('#birthdayId').val(); const name = $('#birthdayName').val().trim(); const date = $('#birthdayDate').val(); if(!name||!date){ alert('Name and date required'); return; } const obj = { id: id||H.uid('bd'), name, date }; if(id){ const i = s.birthdayReminders.findIndex(x=>x.id===id); if(i>-1) s.birthdayReminders[i]=obj; } else { s.birthdayReminders.push(obj);} H.save(s); hideModal('#birthdayModal'); renderBirthdays(); });
    renderRules();
    $('#birthdayList').on('click', '[data-act="edit-birthday"]', function(){ const s=H.load(); const id=$(this).data('id'); const b=s.birthdayReminders.find(x=>x.id===id); if(!b) return; $('#birthdayId').val(b.id); $('#birthdayName').val(b.name); $('#birthdayDate').val(b.date); $('#deleteBirthdayBtn').removeClass('hidden'); $('#birthdayModalTitle').text('Edit birthday'); showModal('#birthdayModal'); });
    $('#deleteBirthdayBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#birthdayId').val(); const i=s.birthdayReminders.findIndex(x=>x.id===id); if(i>-1){ const [it]=s.birthdayReminders.splice(i,1); H.archiveItem('birthdays', it); H.save(s); hideModal('#birthdayModal'); renderBirthdays(); }});
  }

  function bindOpenBoardActions(){
    $('#addOpenItemBtn').off('click').on('click', function(){ $('#openItemId').val(''); $('#openType').val('grievance'); $('#openTitle').val(''); $('#openDetail').val(''); $('#deleteOpenItemBtn').addClass('hidden'); $('#openItemModalTitle').text('Add item'); showModal('#openItemModal'); });
    $('#saveOpenItemBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#openItemId').val(); const obj={ id: id||H.uid('open'), type: $('#openType').val(), title: $('#openTitle').val().trim(), detail: $('#openDetail').val().trim(), createdAt: H.toISO(new Date()), createdById: (s.members[0]&&s.members[0].id)||null, resolved:false }; if(!obj.title){ alert('Title required'); return; } if(id){ const i=s.openBoard.findIndex(x=>x.id===id); if(i>-1) s.openBoard[i]=obj; } else { s.openBoard.unshift(obj);} H.save(s); hideModal('#openItemModal'); renderOpenBoard(); });
    $('#openBoardList').on('click','[data-act="edit-open"]', function(){ const s=H.load(); const id=$(this).data('id'); const it=s.openBoard.find(x=>x.id===id); if(!it) return; $('#openItemId').val(it.id); $('#openType').val(it.type); $('#openTitle').val(it.title); $('#openDetail').val(it.detail||''); $('#deleteOpenItemBtn').removeClass('hidden'); $('#openItemModalTitle').text('Edit item'); showModal('#openItemModal'); });
    $('#deleteOpenItemBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#openItemId').val(); const i=s.openBoard.findIndex(x=>x.id===id); if(i>-1){ const [it]=s.openBoard.splice(i,1); H.archiveItem('openBoard', it); H.save(s); hideModal('#openItemModal'); renderOpenBoard(); }});
  }

  function bindWishlistActions(){
    $('#addWishBtn').off('click').on('click', function(){ $('#wishId').val(''); $('#wishChild').val(''); $('#wishItem').val(''); $('#wishPrice').val(''); $('#wishLink').val(''); $('#wishPriority').val('3'); $('#deleteWishBtn').addClass('hidden'); $('#wishModalTitle').text('Add wish'); showModal('#wishModal'); });
    $('#saveWishBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#wishId').val(); const childId=$('#wishChild').val(); const item=$('#wishItem').val().trim(); if(!childId){ alert('Choose a child'); return; } if(!item){ alert('Item required'); return; } const obj={ id:id||H.uid('wish'), childId, item, price: $('#wishPrice').val()||null, link: $('#wishLink').val()||'', priority: parseInt($('#wishPriority').val(),10)||3, purchased:false }; if(id){ const i=s.wishlist.findIndex(x=>x.id===id); if(i>-1) s.wishlist[i]=obj; } else { s.wishlist.unshift(obj);} H.save(s); hideModal('#wishModal'); renderWishlist(); });
    $('#wishlist').on('click','[data-act="edit-wish"]', function(){ const s=H.load(); const id=$(this).data('id'); const w=s.wishlist.find(x=>x.id===id); if(!w) return; $('#wishId').val(w.id); $('#wishChild').val(w.childId); $('#wishItem').val(w.item); $('#wishPrice').val(w.price||''); $('#wishLink').val(w.link||''); $('#wishPriority').val(w.priority||3); $('#deleteWishBtn').removeClass('hidden'); $('#wishModalTitle').text('Edit wish'); showModal('#wishModal'); });
    $('#wishlist').on('click','[data-act="toggle-purchased"]', function(){ const s=H.load(); const id=$(this).data('id'); const w=s.wishlist.find(x=>x.id===id); if(w){ w.purchased=!w.purchased; H.save(s); renderWishlist(); }});
    $('#deleteWishBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#wishId').val(); const i=s.wishlist.findIndex(x=>x.id===id); if(i>-1){ const [it]=s.wishlist.splice(i,1); H.archiveItem('wishlist', it); H.save(s); hideModal('#wishModal'); renderWishlist(); }});
  }

  function bindHolidayActions(){
    $('#addHolidayBtn').off('click').on('click', function(){ $('#holidayId').val(''); $('#holidayTitle').val(''); $('#holidayDestination').val(''); $('#holidayStart').val(''); $('#holidayEnd').val(''); $('#holidayBudget').val(''); $('#holidayNotes').val(''); $('#deleteHolidayBtn').addClass('hidden'); $('#holidayModalTitle').text('Add plan'); showModal('#holidayModal'); });
    $('#saveHolidayBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#holidayId').val(); const title=$('#holidayTitle').val().trim(); const start=$('#holidayStart').val(); const end=$('#holidayEnd').val(); if(!title||!start||!end){ alert('Title, start, and end required'); return; } const obj={ id:id||H.uid('hol'), title, destination: $('#holidayDestination').val().trim(), start, end, budget: $('#holidayBudget').val()||null, notes: $('#holidayNotes').val().trim() }; if(id){ const i=s.holidays.findIndex(x=>x.id===id); if(i>-1) s.holidays[i]=obj; } else { s.holidays.push(obj);} H.save(s); hideModal('#holidayModal'); renderHolidays(); });
    $('#holidayStrip').on('click','[data-act="edit-holiday"]', function(){ const s=H.load(); const id=$(this).data('id'); const h=s.holidays.find(x=>x.id===id); if(!h) return; $('#holidayId').val(h.id); $('#holidayTitle').val(h.title); $('#holidayDestination').val(h.destination||''); $('#holidayStart').val(h.start); $('#holidayEnd').val(h.end); $('#holidayBudget').val(h.budget||''); $('#holidayNotes').val(h.notes||''); $('#deleteHolidayBtn').removeClass('hidden'); $('#holidayModalTitle').text('Edit plan'); showModal('#holidayModal'); });
    $('#deleteHolidayBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#holidayId').val(); const i=s.holidays.findIndex(x=>x.id===id); if(i>-1){ const [it]=s.holidays.splice(i,1); H.archiveItem('holidays', it); H.save(s); hideModal('#holidayModal'); renderHolidays(); }});
  }

  function bindTimeoffActions(){
    $('#addTimeOffBtn').off('click').on('click', function(){ $('#timeoffId').val(''); $('#timeoffMember').val(''); $('#timeoffStart').val(''); $('#timeoffEnd').val(''); $('#timeoffReason').val(''); $('#deleteTimeoffBtn').addClass('hidden'); $('#timeoffModalTitle').text('Add time off'); showModal('#timeoffModal'); });
    $('#saveTimeoffBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#timeoffId').val(); const memberId=$('#timeoffMember').val(); const start=$('#timeoffStart').val(); const end=$('#timeoffEnd').val(); if(!memberId||!start||!end){ alert('Adult, start, and end required'); return; } const obj={ id:id||H.uid('toff'), memberId, start, end, reason: $('#timeoffReason').val().trim() }; if(id){ const i=s.timeOff.findIndex(x=>x.id===id); if(i>-1) s.timeOff[i]=obj; } else { s.timeOff.push(obj);} H.save(s); hideModal('#timeoffModal'); renderTimeoff(); });
    $('#timeoffTable').on('click','[data-act="edit-timeoff"]', function(){ const s=H.load(); const id=$(this).data('id'); const t=s.timeOff.find(x=>x.id===id); if(!t) return; $('#timeoffId').val(t.id); $('#timeoffMember').val(t.memberId); $('#timeoffStart').val(t.start); $('#timeoffEnd').val(t.end); $('#timeoffReason').val(t.reason||''); $('#deleteTimeoffBtn').removeClass('hidden'); $('#timeoffModalTitle').text('Edit time off'); showModal('#timeoffModal'); });
    $('#deleteTimeoffBtn').off('click').on('click', function(){ const s=H.load(); const id=$('#timeoffId').val(); const i=s.timeOff.findIndex(x=>x.id===id); if(i>-1){ const [it]=s.timeOff.splice(i,1); H.archiveItem('timeOff', it); H.save(s); hideModal('#timeoffModal'); renderTimeoff(); }});
  }

  function bindArchives(){
    $('#archivesBtn').off('click').on('click', function(){ renderArchives(); showModal('#archivesModal'); });
    $('#archivesModal').on('click','[data-restore]', function(){ const cat=$(this).data('restore'); const id=$(this).data('id'); H.restoreItem(cat, id); renderArchives(); renderAll(); });
  }

  function renderAll(){
    const s = H.load();
    populateMemberSelects(s);
    updateHouseholdHeader();
    const plan = s.foodPlan ? s.foodPlan : H.getCurrentMonthPlan(s);
    renderFood(plan);
    renderChores();
    renderBirthdays();
    renderOpenBoard();
    renderWishlist();
    renderHolidays();
    renderTimeoff();
  }

  // Public API
  window.App.init = function(){
    // Set fonts for headings
    $('h1,h2,h3,h4,h5').css('font-family','Oswald, Inter');

    // Tabs and interactions
    bindTabs();
    setupOnboarding();
    setupInvites();
    bindChoreActions();
    bindFoodActions();
    bindBirthdayActions();
    bindOpenBoardActions();
    bindRuleActions();
    bindTraditionActions();
    bindWishlistActions();
    bindHolidayActions();
    bindTimeoffActions();
    bindArchives();

    // Populate selects with members
    populateMemberSelects(H.load());

    // Show onboarding if needed
    if(onboardingNeeded()){ showModal('#onboardModal'); }

  };
  window.App.render = function(){ renderAll(); };
})();
