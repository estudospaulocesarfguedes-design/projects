/* ---------------------------
   app.js (lógica principal)
   --------------------------- */
/* Utilities */
const money = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2});
const MONTHS = ['M1','M2','M3','M4','M5','M6'];
const MONTH_COUNT = 6;

/* Initial state */
let state = {
  revenues: [
    { name: 'Pizzas Tradicionais', values: [22000,21000,23500,24000,25500,26000] },
    { name: 'Pizzas Especiais',    values: [15000,14000,15800,16200,17000,17500] },
    { name: 'Bebidas',             values: [8000,7800,8600,8900,9200,9500] },
    { name: 'Sobremesas',          values: [3500,3300,3700,3900,4000,4200] }
  ],
  varExpenses: [
    { name: 'Ingredientes', values: [11300,10900,11800,12000,12300,12500] },
    { name: 'Embalagens',  values: [1050,1000,1100,1150,1200,1250] },
    { name: 'Taxas Delivery', values: [2300,2200,2350,2400,2450,2500] }
  ],
  fixExpenses: [
    { name: 'Salários', values: [9000,9000,9000,9000,9000,9000] },
    { name: 'Aluguel',  values: [3500,3500,3500,3500,3500,3500] },
    { name: 'Energia',  values: [1650,1600,1700,1750,1800,1850] },
    { name: 'Água e Gás', values: [450,450,450,450,450,450] },
    { name: 'Marketing', values: [500,400,550,600,450,500] },
    { name: 'Manutenção', values: [300,200,250,300,250,300] }
  ],
  charts: {}
};

/* DOM helper */
function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k === 'text') { e.textContent = v; return; }
    if (k === 'html') { e.innerHTML = v; return; }
    e.setAttribute(k, v);
  });
  children.forEach(c=>e.appendChild(c));
  return e;
}

/* Render tables */
function renderAllTables(){
  // Revenues
  const tbodyRev = document.querySelector('#tableRevenues tbody');
  tbodyRev.innerHTML = '';
  state.revenues.forEach((r, idx) => {
    tbodyRev.appendChild(createRow('revenues', idx, r));
  });

  // Var expenses
  const tbodyVar = document.querySelector('#tableVar tbody');
  tbodyVar.innerHTML = '';
  state.varExpenses.forEach((r, idx) => {
    tbodyVar.appendChild(createRow('varExpenses', idx, r));
  });

  // Fix expenses
  const tbodyFix = document.querySelector('#tableFix tbody');
  tbodyFix.innerHTML = '';
  state.fixExpenses.forEach((r, idx) => {
    tbodyFix.appendChild(createRow('fixExpenses', idx, r));
  });
}

/* Create row */
function createRow(section, idx, row){
  const tr = el('tr');
  // name cell
  const tdName = el('td');
  const nameInput = el('input', { type: 'text', value: row.name });
  nameInput.style.width = '220px';
  nameInput.addEventListener('change', ()=> {
    row.name = nameInput.value;
  });
  tdName.appendChild(nameInput);
  tr.appendChild(tdName);

  // months
  for (let m=0;m<MONTH_COUNT;m++){
    const td = el('td');
    const n = el('input', { type: 'number', value: row.values[m] || 0, min: 0 });
    n.addEventListener('change', ()=> {
      row.values[m] = Number(n.value || 0);
    });
    n.style.width = '100px';
    td.appendChild(n);
    tr.appendChild(td);
  }

  // actions
  const tdAct = el('td');
  const btnRemove = el('button', { type: 'button', class: 'removeBtn' });
  btnRemove.textContent = 'Remover';
  btnRemove.addEventListener('click', ()=> {
    if (!confirm('Remover esta linha?')) return;
    if (section === 'revenues') state.revenues.splice(idx,1);
    if (section === 'varExpenses') state.varExpenses.splice(idx,1);
    if (section === 'fixExpenses') state.fixExpenses.splice(idx,1);
    renderAllTables();
    computeAndRender();
  });
  tdAct.appendChild(btnRemove);
  tr.appendChild(tdAct);

  return tr;
}

/* Add new rows */
document.addEventListener('DOMContentLoaded', ()=> {
  document.getElementById('addRevenue').addEventListener('click', ()=> {
    state.revenues.push({name:'Nova Receita', values: Array(MONTH_COUNT).fill(0)});
    renderAllTables();
  });
  document.getElementById('addVar').addEventListener('click', ()=> {
    state.varExpenses.push({name:'Nova Despesa Var', values: Array(MONTH_COUNT).fill(0)});
    renderAllTables();
  });
  document.getElementById('addFix').addEventListener('click', ()=> {
    state.fixExpenses.push({name:'Nova Despesa Fixa', values: Array(MONTH_COUNT).fill(0)});
    renderAllTables();
  });
});

/* Compute and render */
function computeAndRender(){
  // sync inputs to state
  ['revenues','varExpenses','fixExpenses'].forEach(section => {
    const tableId = section === 'revenues' ? '#tableRevenues' : (section === 'varExpenses' ? '#tableVar' : '#tableFix');
    const rows = document.querySelectorAll(tableId + ' tbody tr');
    rows.forEach((tr, i) => {
      const textInput = tr.querySelector('input[type=text]');
      if (textInput) state[section][i].name = textInput.value;
      const numInputs = tr.querySelectorAll('input[type=number]');
      numInputs.forEach((ni, m) => state[section][i].values[m] = Number(ni.value || 0));
    });
  });

  // totals
  const totalEntr = Array(MONTH_COUNT).fill(0);
  state.revenues.forEach(r => r.values.forEach((v,i)=> totalEntr[i]+=Number(v||0)));

  const subtotalVars = Array(MONTH_COUNT).fill(0);
  state.varExpenses.forEach(r => r.values.forEach((v,i)=> subtotalVars[i]+=Number(v||0)));

  const subtotalFix = Array(MONTH_COUNT).fill(0);
  state.fixExpenses.forEach(r => r.values.forEach((v,i)=> subtotalFix[i]+=Number(v||0)));

  const totalDespesas = subtotalVars.map((v,i)=> v + subtotalFix[i]);
  const lucro = totalEntr.map((v,i)=> v - totalDespesas[i]);

  // acumulado
  const acumulado = [];
  lucro.reduce((acc, cur, i) => {
    acumulado[i] = acc + cur;
    return acumulado[i];
  }, 0);

  // KPIs
  const receitaTotal = totalEntr.reduce((a,b)=>a+b,0);
  const despesaTotal = totalDespesas.reduce((a,b)=>a+b,0);
  const lucroTotal = lucro.reduce((a,b)=>a+b,0);
  const receitaMedia = receitaTotal / MONTH_COUNT;
  const varMedia = subtotalVars.reduce((a,b)=>a+b,0)/MONTH_COUNT;
  const fixMedia = subtotalFix.reduce((a,b)=>a+b,0)/MONTH_COUNT;
  const contribution = receitaMedia - varMedia;
  const contributionRate = receitaMedia ? (contribution/receitaMedia) : 0;
  const pontoEquilibrio = contributionRate>0 ? (fixMedia / contributionRate) : Infinity;

  // ticket médio
  const pizzaEntry = state.revenues.find(r => /pizza/i.test(r.name));
  const pizzaRevenue = pizzaEntry ? pizzaEntry.values.reduce((a,b)=>a+b,0) : receitaTotal*0.7;
  const unidades = pizzaRevenue / 45;
  const pedidos = unidades / 1.8 || 1;
  const ticketMedio = receitaTotal / pedidos;

  // update DOM
  document.getElementById('kReceita').innerText = money(receitaTotal);
  document.getElementById('kDespesa').innerText = money(despesaTotal);
  document.getElementById('kLucro').innerText = money(lucroTotal);
  document.getElementById('kTicket').innerText = money(ticketMedio);
  document.getElementById('kPe').innerText = isFinite(pontoEquilibrio) ? money(pontoEquilibrio) : '—';
  document.getElementById('kMargem').innerText = receitaMedia ? (((lucroTotal / MONTH_COUNT) / receitaMedia * 100).toFixed(1) + '%') : '—';

  // resumo mensal
  const tbody = document.querySelector('#resumoTable tbody');
  tbody.innerHTML = '';
  for (let i=0;i<MONTH_COUNT;i++){
    const tr = el('tr');
    tr.innerHTML = `<td>Mês ${i+1}</td>
      <td>${money(totalEntr[i])}</td>
      <td>${money(totalDespesas[i])}</td>
      <td>${money(lucro[i])}</td>
      <td>${money(acumulado[i])}</td>`;
    tbody.appendChild(tr);
  }

  // charts
  updateCharts(totalEntr, totalDespesas, lucro, subtotalVars, subtotalFix);

  return { receitaTotal, despesaTotal, lucroTotal, pontoEquilibrio, ticketMedio, totalEntr, totalDespesas, lucro, acumulado };
}

/* Charts */
function initCharts(){
  const ctxRevExp = document.getElementById('chartRevExp').getContext('2d');
  if (state.charts.revExp) state.charts.revExp.destroy();
  state.charts.revExp = new Chart(ctxRevExp, {
    type: 'bar',
    data: { labels: MONTHS, datasets: [
      { label:'Receita', data:[], backgroundColor:'#1F77B4' },
      { label:'Despesa', data:[], backgroundColor:'#D62728' }
    ]},
    options: { responsive:true, plugins:{legend:{position:'top'}} }
  });

  const ctxPie = document.getElementById('chartPie').getContext('2d');
  if (state.charts.pie) state.charts.pie.destroy();
  state.charts.pie = new Chart(ctxPie, {
    type: 'pie',
    data: { labels: ['Ingredientes','Embalagens','Taxas Delivery','Salários','Aluguel','Energia','Água e Gás','Marketing','Manutenção'],
            datasets: [{ data:[], backgroundColor: ['#FF4C4C','#FFD700','#4CB5FF','#44C767','#8A2BE2','#FF8C00','#00CED1','#D9534F','#708090'], borderColor:'#fff', borderWidth:2 }] },
    options: { responsive:true, plugins:{legend:{position:'bottom', labels:{font:{size:12}}}} }
  });

  const ctxLucro = document.getElementById('chartLucro').getContext('2d');
  if (state.charts.lucro) state.charts.lucro.destroy();
  state.charts.lucro = new Chart(ctxLucro, {
    type: 'line',
    data: { labels: MONTHS, datasets: [{ label:'Lucro Líquido', data:[], borderColor:'#b30000', fill:false, tension:0.2 }] },
    options: { responsive:true }
  });
}

function avgOf(arr, idx) {
  if (!arr || !arr.length) return 0;
  if (!arr[idx]) return 0;
  return arr[idx].values.reduce((a,b)=>a+b,0)/arr[idx].values.length;
}

function updateCharts(totalEntr, totalDespesas, lucro, subtotalVars, subtotalFix){
  state.charts.revExp.data.labels = MONTHS;
  state.charts.revExp.data.datasets[0].data = totalEntr;
  state.charts.revExp.data.datasets[1].data = totalDespesas;
  state.charts.revExp.update();

  const comps = [
    avgOf(state.varExpenses, 0),
    avgOf(state.varExpenses, 1),
    avgOf(state.varExpenses, 2),
    avgOf(state.fixExpenses, 0),
    avgOf(state.fixExpenses, 1),
    avgOf(state.fixExpenses, 2),
    avgOf(state.fixExpenses, 3),
    avgOf(state.fixExpenses, 4),
    avgOf(state.fixExpenses, 5)
  ].map(v => Number(v.toFixed(2)));

  state.charts.pie.data.datasets[0].data = comps;
  state.charts.pie.update();

  state.charts.lucro.data.labels = MONTHS;
  state.charts.lucro.data.datasets[0].data = lucro;
  state.charts.lucro.update();
}

/* Convert logo.svg (file) to dataURL for PDF */
async function getLogoDataUrl(){
  try {
    const resp = await fetch('img/logo.svg');
    const svgText = await resp.text();
    const blob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const p = new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
    });
    img.src = url;
    return await p;
  } catch(e) {
    console.warn('Erro ao converter logo.svg', e);
    return null;
  }
}

/* Generate PDF */
async function generatePDF(){
  const { jsPDF } = window.jspdf;
  const results = computeAndRender();

  const doc = new jsPDF({unit:'pt', format:'a4'});
  let y = 40;

  let logoDataUrl = await getLogoDataUrl();

  // Header
  if (logoDataUrl) {
    const imgProps = doc.getImageProperties(logoDataUrl);
    const h = 50;
    const w = imgProps.width * (h / imgProps.height);
    doc.addImage(logoDataUrl, 'PNG', 40, y, w, h);
    doc.setFontSize(18);
    doc.setTextColor('#b30000');
    doc.text('Pizzaria A Boa Fatia', 40 + w + 12, y + 20);
    y += 70;
  } else {
    doc.setFontSize(18);
    doc.setTextColor('#b30000');
    doc.text('Pizzaria A Boa Fatia', 40, y);
    y += 30;
  }

  doc.setFontSize(11);
  doc.setTextColor('#000');
  doc.text(`Período: ${MONTH_COUNT} meses`, 40, y); y += 14;
  doc.text(`Receita total (6 meses): ${money(results.receitaTotal)}`, 40, y); y += 12;
  doc.text(`Despesa total (6 meses): ${money(results.despesaTotal)}`, 40, y); y += 12;
  doc.text(`Lucro total (6 meses): ${money(results.lucroTotal)}`, 40, y); y += 16;

  // analysis
  const margem = results.receitaTotal ? ((results.lucroTotal / results.receitaTotal) * 100).toFixed(1) : 0;
  const situacao = results.lucroTotal > 0 ? 'POSITIVA' : 'NEGATIVA';
  let analisetext = `Análise resumida: A saúde financeira da Pizzaria A Boa Fatia no período avaliado é ${situacao}. `;
  if (results.lucroTotal > 0) {
    analisetext += 'A operação apresentou lucro acumulado, com possibilidade de otimizar ainda mais as margens mediante controle de custos variáveis.';
  } else {
    analisetext += 'A operação apresentou resultado negativo; recomenda-se revisar preços, margens e custos de ingredientes.';
  }
  analisetext += ` Margem média observada: ${margem}%. Ponto de equilíbrio mensal estimado: ${money(results.pontoEquilibrio)}. Ticket médio estimado: ${money(results.ticketMedio)}.`;

  doc.setFontSize(12);
  doc.setTextColor('#b30000');
  doc.text('Análise de desempenho', 40, y); y += 16;
  doc.setFontSize(10);
  doc.setTextColor('#222');
  const wrapped = doc.splitTextToSize(analisetext, 520);
  wrapped.forEach(line => { if (y > 740) { doc.addPage(); y = 40; } doc.text(line, 40, y); y += 12; });
  y += 10;

  // resumo mensal
  if (y > 520) { doc.addPage(); y = 40; }
  doc.setFontSize(10);
  doc.text('Resumo Mensal', 40, y); y += 14;
  const colX = [40, 140, 260, 380, 500];
  doc.text('Mês', colX[0], y);
  doc.text('Entradas', colX[1], y);
  doc.text('Saídas', colX[2], y);
  doc.text('Lucro', colX[3], y);
  doc.text('Saldo Acum.', colX[4], y);
  y += 10;
  for (let i=0;i<MONTH_COUNT;i++){
    if (y > 720) { doc.addPage(); y = 40; }
    doc.text(`M${i+1}`, colX[0], y);
    doc.text(money(results.totalEntr[i]), colX[1], y);
    doc.text(money(results.totalDespesas[i]), colX[2], y);
    doc.text(money(results.lucro[i]), colX[3], y);
    doc.text(money(results.acumulado[i]), colX[4], y);
    y += 12;
  }

  // charts
  const chartIds = ['chartRevExp','chartPie','chartLucro'];
  for (const id of chartIds){
    const canvas = document.getElementById(id);
    if (!canvas) continue;
    if (y > 520) { doc.addPage(); y = 40; }
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const w = doc.internal.pageSize.getWidth() - 80;
      const imgProps = doc.getImageProperties(dataUrl);
      const h = (imgProps.height * w) / imgProps.width;
      doc.addImage(dataUrl, 'PNG', 40, y, w, h);
      y += h + 12;
    } catch(e) {
      console.warn('Erro ao inserir gráfico', e);
    }
  }

  doc.save('Relatorio_A_Boa_Fatia.pdf');
}

/* Init */
function boot(){
  renderAllTables();
  initCharts();
  computeAndRender();

  document.getElementById('btnCalc').addEventListener('click', computeAndRender);
  document.getElementById('btnPdf').addEventListener('click', ()=> {
    document.getElementById('btnPdf').innerText = 'Gerando PDF...';
    document.getElementById('btnPdf').disabled = true;
    setTimeout(async ()=> {
      await generatePDF();
      document.getElementById('btnPdf').disabled = false;
      document.getElementById('btnPdf').innerText = 'Gerar PDF';
    }, 200);
  });
}

/* start when DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
