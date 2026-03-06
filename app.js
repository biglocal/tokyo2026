/* ========== Navigation & Tabs Logic ========== */
const TABS = ['plan', 'guide', 'wallet', 'lists', 'info'];
const COLORS = ['text-draw-pink', 'text-draw-yellow', 'text-draw-green', 'text-draw-blue', 'text-draw-ink'];

function switchTab(tabId, el) {
  TABS.forEach(t => document.getElementById(`tab-${t}`).classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.className = btn.className.replace(/text-draw-\w+/g, 'text-draw-muted');
    btn.querySelector('span').classList.replace('font-black', 'font-bold');
  });

  el.classList.remove('text-draw-muted');
  el.classList.add(COLORS[TABS.indexOf(tabId)]);
  el.querySelector('span').classList.replace('font-bold', 'font-black');
  
  if(tabId === 'wallet') fetchGroupExpenses();
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function showDay(day) {
  for(let i=1; i<=6; i++) {
    document.getElementById(`day-${i}`).classList.add('hidden');
    let btn = document.getElementById(`btn-d${i}`);
    btn.classList.remove('bg-draw-pink', 'bg-draw-yellow', 'text-white');
    btn.classList.add('bg-white', 'text-draw-ink');
  }
  document.getElementById(`day-${day}`).classList.remove('hidden');
  let target = document.getElementById(`btn-d${day}`);
  target.classList.remove('bg-white', 'text-draw-ink');
  target.classList.add(day===1 ? 'bg-draw-pink' : 'bg-draw-yellow', 'text-white');
}

function openImg(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}
function closeImg() { document.getElementById('lightbox').classList.add('hidden'); }
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').innerText = msg;
  toast.classList.remove('opacity-0');
  setTimeout(() => toast.classList.add('opacity-0'), 1500);
}

/* ========== GUIDE Tab - 動態抓取 place 結合 schedule 標題 ========== */
async function loadPlaceSheet() {
  const listContainer = document.getElementById('guide-place-list');
  listContainer.innerHTML = '<div class="text-center text-draw-muted text-xs animate-pulse font-bold py-4"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在載入 Google 表單地點資料...</div>';
  
  try {
    const scheduleUrl = `https://docs.google.com/spreadsheets/d/16uetEwwxz6h9jG4iwl64O8KVmk7eFTIgQtOZ95R8Hmc/gviz/tq?tqx=out:json&sheet=schedule&_=${new Date().getTime()}`;
    const resSchedule = await fetch(scheduleUrl);
    const textSchedule = await resSchedule.text();
    const jsonSchedule = JSON.parse(textSchedule.substring(textSchedule.indexOf('{'), textSchedule.lastIndexOf('}') + 1));
    
    const dayTitles = {};
    jsonSchedule.table.rows.forEach(row => {
        if(row.c && row.c[0] && row.c[0].v !== null && row.c[1] && row.c[1].v !== null) {
            let dayNum = String(row.c[0].v).trim();
            let dayTitle = String(row.c[1].v).trim();
            dayTitles[dayNum] = dayTitle;
        }
    });

    const placeUrl = `https://docs.google.com/spreadsheets/d/16uetEwwxz6h9jG4iwl64O8KVmk7eFTIgQtOZ95R8Hmc/gviz/tq?tqx=out:json&headers=1&sheet=place&_=${new Date().getTime()}`;
    const resPlace = await fetch(placeUrl);
    const textPlace = await resPlace.text();
    const jsonPlace = JSON.parse(textPlace.substring(textPlace.indexOf('{'), textPlace.lastIndexOf('}') + 1));
    
    const rows = jsonPlace.table.rows;
    const days = {};

    rows.forEach((row, i) => {
        if(!row.c || !row.c[0] || !row.c[0].v) return;
        const title = String(row.c[0].v).trim();
        if(title === "標題" || title === "名稱" || title === "A" || title.toLowerCase().includes("name")) return;

        let category = row.c[1] && row.c[1].v ? String(row.c[1].v).trim() : '其他';
        let mapLink = row.c[2] && row.c[2].v ? String(row.c[2].v).trim() : '';
        let dayNum = row.c[3] && row.c[3].v ? String(row.c[3].v).trim() : '未分類';
        let ratingText = row.c[4] && row.c[4].v ? String(row.c[4].v).trim() : '';
        let notesText = row.c[5] && row.c[5].v ? String(row.c[5].v).trim() : ''; 
        
        let dayKey = dayNum === '未分類' ? '未分類' : `Day ${dayNum}`;
        if (!days[dayKey]) days[dayKey] = [];

        let icon = '<i class="fa-solid fa-location-dot text-draw-green"></i>';
        if(category.includes('景點')) icon = '<i class="fa-solid fa-camera-retro text-draw-pink"></i>';
        else if(category.includes('美食') || category.includes('餐廳')) icon = '<i class="fa-solid fa-utensils text-draw-yellow"></i>';
        else if(category.includes('逛街') || category.includes('購物')) icon = '<i class="fa-solid fa-bag-shopping text-draw-blue"></i>';

        let reviewHtml = '';
        if (ratingText && (category.includes('美食') || category.includes('餐廳') || category.includes('景點'))) {
            reviewHtml = `<div class="bg-draw-yellow text-draw-ink px-1.5 py-0.5 rounded border border-draw-ink shadow-sm text-[9px] font-black flex items-center justify-center whitespace-nowrap"><i class="fa-solid fa-star text-[8px] mr-0.5"></i>${ratingText}</div>`;
        }

        let mapHtml = '';
        if(mapLink) {
            mapHtml = `<a href="${mapLink}" target="_blank" class="bg-draw-green text-white px-1.5 py-0.5 rounded border border-draw-ink shadow-sm text-[9px] font-black click-effect shrink-0 flex items-center justify-center"><i class="fa-solid fa-map-location-dot text-[9px] mr-0.5"></i>地圖</a>`;
        }

        const sheetRowIndex = i + 2; 
        const editParams = new URLSearchParams({
            row: sheetRowIndex, title: title, cat: category, day: dayNum, link: mapLink, rating: ratingText, notes: notesText
        }).toString();

        let editBtnHtml = `<a href="edit_place.html?${editParams}" class="bg-white text-draw-ink w-5 h-5 rounded border border-draw-ink shadow-sm text-[9px] font-black click-effect shrink-0 flex items-center justify-center transition-transform active:scale-95"><i class="fa-solid fa-pen text-draw-blue"></i></a>`;

        let notesHtml = '';
        let introBtnHtml = '';
        let pureTextNotes = notesText;

        if (notesText) {
            const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
            pureTextNotes = pureTextNotes.replace(mdLinkRegex, function(match, btnTitle, url) {
                introBtnHtml += `<a href="${url}" target="_blank" class="bg-draw-blue text-white px-1.5 py-0.5 rounded border border-draw-ink shadow-sm text-[9px] click-effect font-black shrink-0 flex items-center justify-center"><i class="fa-solid fa-link text-[8px] mr-0.5"></i>${btnTitle}</a>`;
                return ''; 
            });

            const rawUrlRegex = /(https?:\/\/[^\s]+)/g;
            pureTextNotes = pureTextNotes.replace(rawUrlRegex, function(match, url) {
                introBtnHtml += `<a href="${url}" target="_blank" class="bg-draw-blue text-white px-1.5 py-0.5 rounded border border-draw-ink shadow-sm text-[9px] click-effect font-black shrink-0 flex items-center justify-center"><i class="fa-solid fa-link text-[8px] mr-0.5"></i>介紹</a>`;
                return '';
            });

            pureTextNotes = pureTextNotes.trim();
            if (pureTextNotes) {
                notesHtml = `<div class="text-[10px] font-bold text-gray-500 mt-1 pl-[26px] leading-snug break-words">${pureTextNotes.replace(/\n/g, '<br>')}</div>`;
            }
        }

        let itemHtml = `
        <div class="py-2.5 border-b border-gray-200 last:border-0 fade-in flex flex-col w-full">
            <div class="flex items-start justify-between w-full gap-1.5">
                <div class="flex items-start flex-1 min-w-[80px]">
                    <div class="w-5 text-center shrink-0 mr-1.5 text-[12px] pt-0.5">${icon}</div>
                    <span class="font-black text-xs text-draw-ink break-words leading-tight pt-1">${title}</span>
                </div>
                <div class="flex gap-1 shrink-0 items-center justify-end max-w-[65%] pt-0.5">
                    ${reviewHtml}
                    ${introBtnHtml}
                    ${mapHtml}
                    ${editBtnHtml}
                </div>
            </div>
            ${notesHtml}
        </div>`;

        days[dayKey].push(itemHtml);
    });

    let finalHtml = '';
    const sortedKeys = Object.keys(days).sort((a, b) => {
        if(a === '未分類') return 1;
        if(b === '未分類') return -1;
        return (parseInt(a.replace('Day ', '')) || 0) - (parseInt(b.replace('Day ', '')) || 0);
    });

    sortedKeys.forEach(key => {
        let displayTitle = key; 
        if (key !== '未分類') {
            let dNum = key.replace('Day ', ''); 
            if (dayTitles[dNum]) { 
                displayTitle = `Day ${dNum} - ${dayTitles[dNum]}`; 
            }
        } else {
            displayTitle = '未分類備用景點';
        }

        finalHtml += `
        <details class="mb-3 group outline-none bg-white border-2 border-draw-ink rounded-xl shadow-sm overflow-hidden" ${key === 'Day 1' ? 'open' : ''}>
            <summary class="font-black p-3 cursor-pointer flex justify-between items-center text-draw-ink text-xs select-none bg-gray-50 transition-colors group-open:border-b-2 group-open:border-draw-ink">
                <div class="flex items-center">
                    <i class="fa-solid fa-calendar-day text-draw-pink mr-2 text-sm"></i>
                    <span>${displayTitle}</span>
                </div>
                <i class="fa-solid fa-chevron-down transition-transform group-open:rotate-180 text-draw-muted"></i>
            </summary>
            <div class="px-3">
                ${days[key].join('')}
            </div>
        </details>
        `;
    });

    listContainer.innerHTML = finalHtml || '<p class="text-center text-draw-muted text-xs font-bold py-4">目前沒有景點資料喔！</p>';
    showToast("地點已更新");

  } catch (err) {
    listContainer.innerHTML = '<div class="p-3 text-center text-draw-pink text-xs font-bold border-2 border-draw-pink rounded-xl bg-pink-50">連線失敗，請檢查網路</div>';
  }
}

/* ========== INFO Tab - Google Sheet Fetch ========== */
function loadInfoSheet() {
  document.getElementById('info-sheet-content').innerHTML = '<div class="text-center text-draw-muted text-xs animate-pulse py-6 font-bold"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在載入試算表資料...</div>';
  const url = `https://docs.google.com/spreadsheets/d/16uetEwwxz6h9jG4iwl64O8KVmk7eFTIgQtOZ95R8Hmc/gviz/tq?tqx=out:json&sheet=fly_cat_hotels&_=${new Date().getTime()}`;
  fetch(url)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      const rows = json.table.rows;
      let html = '';
      
      rows.forEach((row, i) => {
        if(row.c && row.c[0] && row.c[0].v) {
          const title = String(row.c[0].v).trim();
          if(title === "標題" || title === "項目名稱" || title === "項目") return;

          let iconClass = 'fa-star text-draw-yellow'; 
          if (title.includes('機票') || title.includes('航班')) iconClass = 'fa-plane text-draw-blue';
          else if (title.includes('住宿') || title.includes('飯店') || title.includes('民宿') || title.toLowerCase().includes('airbnb')) iconClass = 'fa-hotel text-draw-green';
          else if (title.includes('迪士尼') || title.toLowerCase().includes('disney')) iconClass = 'fa-wand-magic-sparkles text-draw-pink';
          else if (title.includes('車') || title.includes('接送')) iconClass = 'fa-car text-draw-yellow';
          else if (title.toLowerCase().includes('wifi') || title.toLowerCase().includes('esim') || title.includes('網')) iconClass = 'fa-wifi text-draw-blue';
          else if (title.includes('保險')) iconClass = 'fa-shield-halved text-draw-green';
          else if (title.includes('票')) iconClass = 'fa-ticket text-draw-pink';

          let detailsHtml = '';
          for(let j=1; j<row.c.length; j++) {
              if(row.c[j] && (row.c[j].v || row.c[j].f)) {
                  const val = String(row.c[j].f || row.c[j].v); 
                  if(val.startsWith('http')) {
                      detailsHtml += `<a href="${val}" target="_blank" class="inline-block bg-draw-blue text-white px-4 py-2.5 rounded-xl border-2 border-draw-ink shadow-solid-sm mt-2 text-xs font-black click-effect w-full text-center"><i class="fa-solid fa-link mr-1"></i> 開啟相關連結</a><br>`;
                  } else {
                      detailsHtml += `<p class="mb-2 last:mb-0">${val.replace(/\n/g, '<br>')}</p>`;
                  }
              }
          }
          if(detailsHtml === '') detailsHtml = '<p class="text-draw-muted text-[10px]">無詳細說明</p>';

          html += `
            <details class="bg-white border-2 border-draw-ink rounded-2xl mb-3 group outline-none overflow-hidden shadow-solid-sm">
              <summary class="font-black p-4 border-b-2 border-transparent group-open:border-draw-ink cursor-pointer flex justify-between items-center text-draw-ink text-sm transition-colors hover:bg-yellow-50">
                <span><i class="fa-solid ${iconClass} mr-2 text-lg"></i> ${title}</span> 
                <i class="fa-solid fa-chevron-down transition-transform group-open:rotate-180 text-draw-muted"></i>
              </summary>
              <div class="p-4 text-xs bg-gray-50 leading-relaxed break-words text-draw-ink border-t-2 border-draw-ink font-bold">
                ${detailsHtml}
              </div>
            </details>`;
        }
      });
      document.getElementById('info-sheet-content').innerHTML = html || '<div class="text-center text-draw-muted text-xs">目前沒有預訂資料喔！</div>';
    })
    .catch(err => {
      document.getElementById('info-sheet-content').innerHTML = '<div class="text-center text-draw-pink text-xs font-bold border-2 border-draw-pink p-3 rounded-xl bg-pink-50"><i class="fa-solid fa-triangle-exclamation mr-1"></i> 預訂快訊載入失敗</div>';
    });
}

/* ========== WALLET Tab - 雲端公帳 ========== */
async function fetchGroupExpenses() {
    const sheetId = '16uetEwwxz6h9jG4iwl64O8KVmk7eFTIgQtOZ95R8Hmc';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Expense&_=${new Date().getTime()}`;
    const listContainer = document.getElementById('group-expense-body');
    listContainer.innerHTML = '<div class="text-center text-draw-muted text-[10px] py-6 font-bold animate-pulse">正在連線 Google Sheet...</div>';

    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        let html = '';
        let totalTWD = 0;

        rows.forEach((row, index) => {
            const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/"/g, '')) || [];
            if (cols.length < 3) return;

            const category = cols[0] || '';
            const item = cols[1] || '';
            const amount = cols[2] || '';
            const currency = cols[3] || '';
            const payer = cols[4] || '';
            const costPerHead = cols[5] || '';
            const timeStr = cols[6] || ''; 
            
            const cost = parseFloat(costPerHead) || 0;
            totalTWD += cost;

            const sheetRowIndex = index + 2; 

            const editParams = new URLSearchParams({
                row: sheetRowIndex,
                cat: category, item: item, amt: amount, curr: currency, payer: payer, perhead: costPerHead
            }).toString();

            const timeHtml = timeStr ? `<span class="text-gray-400 font-bold text-[9px] ml-2"><i class="fa-regular fa-clock"></i> ${timeStr}</span>` : '';

            html += `
            <details class="bg-gray-50 border-2 border-draw-ink rounded-xl mb-2 group outline-none overflow-hidden shadow-sm fade-in">
                <summary class="p-3 cursor-pointer flex justify-between items-center text-draw-ink transition-colors hover:bg-gray-100">
                    <div class="flex flex-col">
                        <div class="flex items-center">
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded border border-draw-ink shadow-sm w-fit cat-${category}">${category}</span>
                            ${timeHtml}
                        </div>
                        <span class="text-xs font-black text-draw-ink mt-1 flex items-center">
                            ${item} 
                            <i class="fa-solid fa-chevron-down ml-1 text-gray-400 transition-transform group-open:rotate-180 text-[10px]"></i>
                        </span>
                    </div>
                    <div class="text-right leading-tight">
                        <div class="text-[9px] font-bold text-draw-muted">人均</div>
                        <div class="text-xs font-black text-draw-pink">NT$ ${Math.round(cost).toLocaleString()}</div>
                    </div>
                </summary>
                <div class="p-3 bg-white border-t-2 border-dashed border-gray-300 text-xs font-bold space-y-2 text-draw-ink">
                    <div class="flex justify-between items-center">
                        <span class="text-draw-muted"><i class="fa-solid fa-coins w-4 text-center"></i> 總金額</span>
                        <span>${amount} ${currency}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-draw-muted"><i class="fa-solid fa-user-tag w-4 text-center"></i> 代墊人</span>
                        <span class="bg-blue-50 text-draw-blue px-2 py-0.5 rounded border border-blue-200 shadow-sm">${payer || '未填寫'}</span>
                    </div>
                    <div class="flex justify-end pt-2 mt-2 border-t border-gray-100">
                        <a href="edit_expense.html?${editParams}" class="bg-white text-draw-ink px-3 py-1.5 rounded-lg border-2 border-draw-ink shadow-solid-sm click-effect text-[10px] font-black flex items-center transition-transform active:scale-95">
                            <i class="fa-solid fa-pen text-draw-blue mr-1.5"></i>編輯此筆
                        </a>
                    </div>
                </div>
            </details>`;
        });

        listContainer.innerHTML = html || '<div class="text-center text-draw-muted text-[10px] py-6 font-bold">目前無公帳紀錄</div>';
        document.getElementById('group-total-twd').innerText = `NT$ ${Math.round(totalTWD).toLocaleString()}`;
    } catch (error) {
        listContainer.innerHTML = '<div class="text-center text-draw-pink text-[10px] py-6 font-bold">載入失敗，請檢查權限</div>';
    }
}

/* ========== WALLET Tab - 個人私帳 (LocalStorage) ========== */
let rate = parseFloat(localStorage.getItem('tk26_rate_st')) || 0.21;
let expenses = JSON.parse(localStorage.getItem('tk26_exp_st')) || [];
let b64 = null;

document.getElementById('rate-input').addEventListener('change', function() {
    rate = parseFloat(this.value) || 0.21;
    localStorage.setItem('tk26_rate_st', rate);
    renderExp();
    showToast("匯率已自動儲存！");
});

function previewImg(e) {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if(w > 500) { h *= 500/w; w = 500; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      b64 = canvas.toDataURL('image/jpeg', 0.6); 
      document.getElementById('img-preview').src = b64;
      document.getElementById('img-preview-box').classList.remove('hidden');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function removePreview() {
  b64 = null;
  document.getElementById('exp-img').value = '';
  document.getElementById('img-preview-box').classList.add('hidden');
}

function addExpense() {
  const name = document.getElementById('exp-name').value.trim();
  const mathStr = document.getElementById('exp-jpy').value.trim();
  if(!name || !mathStr) return alert("請輸入名稱和金額喔！");
  
  let jpy = 0;
  try { 
    const safeMath = mathStr.replace(/[^0-9+\-*/().]/g, '');
    if(safeMath === "") throw new Error();
    jpy = Math.round(new Function('return ' + safeMath)()); 
  } 
  catch(e) { return alert("金額算式格式錯誤~"); }
  
  expenses.unshift({ 
    id: Date.now(), name, jpy, img: b64, 
    date: new Date().toLocaleDateString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}) 
  });
  localStorage.setItem('tk26_exp_st', JSON.stringify(expenses));
  
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-jpy').value = '';
  removePreview();
  renderExp();
  showToast("金幣存入撲滿！💰");
}

function delExp(id) {
  if(confirm("確定要刪除這筆紀錄嗎？")) {
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem('tk26_exp_st', JSON.stringify(expenses));
    renderExp();
  }
}

function renderExp() {
  document.getElementById('rate-input').value = rate;
  const list = document.getElementById('expense-list');
  let twdTotal = 0;
  
  if(expenses.length === 0) {
    list.innerHTML = '<div class="text-center text-draw-muted text-xs py-10 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 font-bold"><i class="fa-solid fa-piggy-bank text-3xl mb-3 text-gray-300 block"></i>還沒有任何花費紀錄喔！</div>';
  } else {
    list.innerHTML = expenses.map(e => {
      const twd = Math.round(e.jpy * rate);
      twdTotal += twd;
      const imgTag = e.img 
        ? `<img src="${e.img}" onclick="openImg(this.src)" class="w-16 h-16 object-cover border-2 border-draw-ink rounded-xl cursor-zoom-in shrink-0">` 
        : `<div class="w-16 h-16 bg-gray-100 border-2 border-draw-ink rounded-xl flex items-center justify-center text-gray-400 shrink-0"><i class="fa-solid fa-receipt text-xl"></i></div>`;
      
      return `
        <div class="bg-white border-2 border-draw-ink shadow-solid-sm rounded-2xl p-3.5 flex gap-3.5 items-center fade-in">
          ${imgTag}
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <span class="font-black text-sm text-draw-ink truncate pr-2">${e.name}</span> 
              <button onclick="delExp(${e.id})" class="text-gray-300 hover:text-draw-pink transition-colors px-2"><i class="fa-solid fa-trash text-sm"></i></button>
            </div>
            <div class="flex justify-between items-end mt-1.5">
              <span class="text-[10px] text-gray-400 font-bold">${e.date}</span>
              <div class="text-right leading-tight">
                <span class="block text-[11px] font-black text-draw-muted">¥ ${e.jpy.toLocaleString()}</span> 
                <span class="block text-sm font-black text-draw-pink mt-0.5">NT$ ${twd.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  document.getElementById('total-twd').innerText = `NT$ ${twdTotal.toLocaleString()}`;
}

/* ========== LISTS & MEMO ========== */
const defaultChk = ["護照正本 (效期需滿6個月)", "日幣現金與信用卡 (JCB)", "網卡 / eSIM", "迪士尼門票 / 飯店訂單", "行動電源與充電線", "個人常備藥品", "輕便雨具", "好穿的運動鞋"];

function initLists() {
  const saved = JSON.parse(localStorage.getItem('tk26_chk_st')) || {};
  const html = defaultChk.map((item, i) => {
    const chk = saved[i] ? 'checked' : '';
    const line = saved[i] ? 'line-through text-draw-muted' : 'text-draw-ink';
    return `
      <label class="flex items-center gap-3 p-3 border-b-2 border-dashed border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors">
        <input type="checkbox" onchange="toggleChk(${i}, this)" ${chk} class="w-5 h-5 accent-draw-green border-2 border-draw-ink rounded">
        <span id="chk-txt-${i}" class="${line} transition-colors">${item}</span>
      </label>`;
  }).join('');
  document.getElementById('checklist-box').innerHTML = html;
  
  const memo = localStorage.getItem('tk26_memo_st') || '';
  document.getElementById('memo-input').value = memo;
  renderMemo(memo);
}

function toggleChk(i, el) {
  const saved = JSON.parse(localStorage.getItem('tk26_chk_st')) || {};
  saved[i] = el.checked;
  localStorage.setItem('tk26_chk_st', JSON.stringify(saved));
  const txt = document.getElementById(`chk-txt-${i}`);
  if(el.checked) {
      txt.classList.add('line-through', 'text-draw-muted');
      txt.classList.remove('text-draw-ink');
  } else {
      txt.classList.remove('line-through', 'text-draw-muted');
      txt.classList.add('text-draw-ink');
  }
}

function saveMemo() {
  const memo = document.getElementById('memo-input').value;
  localStorage.setItem('tk26_memo_st', memo);
  renderMemo(memo);
  showToast('筆記已儲存 📝');
}

function renderMemo(text) {
  const div = document.getElementById('memo-display');
  if(!text.trim()) { div.classList.add('hidden'); return; }
  div.classList.remove('hidden');
  
  const safeText = text.replace(/</g, '<').replace(/>/g, '>');
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  div.innerHTML = safeText.replace(urlRegex, function(url) {
      return `<a href="${url}" target="_blank" class="inline-block bg-draw-blue text-white px-3 py-1.5 rounded-lg border-2 border-draw-ink shadow-solid-sm my-1 text-[10px] click-effect font-black"><i class="fa-solid fa-link mr-1"></i> 前往連結</a>`;
  }).replace(/\n/g, '<br>');
}

/* ========== 頁面初始化 ========== */
window.onload = () => {
  loadInfoSheet();
  loadPlaceSheet(); 
  renderExp();
  fetchGroupExpenses(); 
  initLists();
};