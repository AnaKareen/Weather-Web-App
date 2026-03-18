let nodes=[],edges=[],selectedType='start',nodeIdCounter=0;
const TYPE_COLORS={start:'#111110',end:'#dc2626',process:'#1a56db',decision:'#d97706',io:'#16a34a'};
const TYPE_LABELS={start:'INICIO',end:'FIN',process:'PROCESO',decision:'DECISIÓN',io:'E/S'};

function selectType(type){
  selectedType=type;
  document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('t-'+type)?.classList.add('active');
  document.getElementById('branches-box').classList.toggle('visible',type==='decision');
}

let selectedConnectFromSet=new Set();

function updateConnectSection(){
  const section=document.getElementById('connect-section');
  const tagsEl=document.getElementById('connect-tags');
  if(nodes.length===0){section.style.display='none';return;}
  section.style.display='block';
  tagsEl.innerHTML='';
  nodes.forEach(n=>{
    const sel=selectedConnectFromSet.has(n.id);
    const tag=document.createElement('div');
    tag.className='connect-tag'+(sel?' selected':'');
    const shortLabel=n.label.length>22?n.label.slice(0,22)+'…':n.label;
    tag.innerHTML=`<div class="connect-checkbox">${sel?'✓':''}</div><div class="connect-dot" style="background:${TYPE_COLORS[n.type]}"></div><div class="connect-name">${shortLabel}</div><div class="connect-type-badge">${TYPE_LABELS[n.type]}</div>`;
    tag.onclick=()=>{selectedConnectFromSet.has(n.id)?selectedConnectFromSet.delete(n.id):selectedConnectFromSet.add(n.id);updateConnectSection();};
    tagsEl.appendChild(tag);
  });
}

function addNode(){
  const label=document.getElementById('node-label').value.trim();
  if(!label){showToast('Escribe una etiqueta primero');return;}
  const id='n'+(++nodeIdCounter);
  nodes.push({id,type:selectedType,label});
  if(selectedConnectFromSet.size>0){
    selectedConnectFromSet.forEach(fromId=>edges.push({from:fromId,to:id,label:''}));
    if(selectedConnectFromSet.size>1)showToast(`Merge: ${selectedConnectFromSet.size} ramas unidas`);
  }
  if(selectedType==='decision'){
    const yL=document.getElementById('branch-yes').value.trim();
    const nL=document.getElementById('branch-no').value.trim();
    if(yL){const yId='n'+(++nodeIdCounter);nodes.push({id:yId,type:'process',label:yL});edges.push({from:id,to:yId,label:'Sí'});}
    if(nL){const nId='n'+(++nodeIdCounter);nodes.push({id:nId,type:'process',label:nL});edges.push({from:id,to:nId,label:'No'});}
    document.getElementById('branch-yes').value='';
    document.getElementById('branch-no').value='';
  }
  selectedConnectFromSet=new Set([id]);
  document.getElementById('node-label').value='';
  if(selectedType==='start')selectType('process');
  renderAll();
  showToast('Nodo agregado');
}

function deleteNode(id){
  nodes=nodes.filter(n=>n.id!==id);
  edges=edges.filter(e=>e.from!==id&&e.to!==id);
  selectedConnectFromSet.delete(id);
  renderAll();
}

function clearAll(){
  if(!confirm('¿Limpiar todo?'))return;
  nodes=[];edges=[];selectedConnectFromSet=new Set();nodeIdCounter=0;
  renderAll();
}

let connectExistingTarget=null;

function toggleConnectExisting(){
  const panel=document.getElementById('connect-existing-panel');
  const btn=document.getElementById('btn-connect-existing');
  if(panel.style.display!=='none'){cancelConnectExisting();return;}
  panel.style.display='block';btn.classList.add('active');btn.textContent='✕ Cancelar';
  buildConnectExistingTargets();
}

function buildConnectExistingTargets(){
  const el=document.getElementById('connect-existing-targets');
  connectExistingTarget=null;el.innerHTML='';
  nodes.forEach(n=>{
    const div=document.createElement('div');div.className='connect-existing-target';
    const s=n.label.length>24?n.label.slice(0,24)+'…':n.label;
    div.innerHTML=`<div class="connect-dot" style="background:${TYPE_COLORS[n.type]}"></div><span style="flex:1">${s}</span><span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--ink3)">${TYPE_LABELS[n.type]}</span>`;
    div.onclick=()=>{document.querySelectorAll('.connect-existing-target').forEach(d=>d.classList.remove('selected'));div.classList.add('selected');connectExistingTarget=n.id;};
    el.appendChild(div);
  });
}

function confirmConnectExisting(){
  if(selectedConnectFromSet.size===0){showToast('Marca el nodo origen arriba');return;}
  if(!connectExistingTarget){showToast('Selecciona el nodo destino');return;}
  let created=0;
  selectedConnectFromSet.forEach(fromId=>{
    if(!edges.some(e=>e.from===fromId&&e.to===connectExistingTarget)&&fromId!==connectExistingTarget){
      edges.push({from:fromId,to:connectExistingTarget,label:''});created++;
    }
  });
  cancelConnectExisting();renderAll();
  showToast(created>0?'↩ Flecha creada':'Esa conexión ya existe');
}

function cancelConnectExisting(){
  document.getElementById('connect-existing-panel').style.display='none';
  const btn=document.getElementById('btn-connect-existing');
  btn.classList.remove('active');btn.textContent='→ Conectar a existente';
  connectExistingTarget=null;
}

function renderAll(){
  updateNodeList();updateConnectSection();
  const btn=document.getElementById('btn-connect-existing');
  if(btn)btn.style.display=nodes.length>=2?'block':'none';
  document.getElementById('counter').textContent=nodes.length+' nodo'+(nodes.length!==1?'s':'');
  renderFlowchart();
}

function updateNodeList(){
  const el=document.getElementById('node-list-items');
  if(nodes.length===0){el.innerHTML='<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--ink3)">Ninguno aún</div>';return;}
  el.innerHTML=nodes.map(n=>`<div class="node-item"><div class="node-item-dot" style="background:${TYPE_COLORS[n.type]}"></div><div class="node-item-label" title="${n.label}">${n.label}</div><div class="node-item-type">${TYPE_LABELS[n.type]}</div><button class="btn-delete" onclick="deleteNode('${n.id}')">×</button></div>`).join('');
}

function layoutNodes(){
  if(nodes.length===0)return{};
  const adj={},inDeg={};
  nodes.forEach(n=>{adj[n.id]=[];inDeg[n.id]=0;});
  edges.forEach(e=>{if(adj[e.from])adj[e.from].push(e.to);if(inDeg[e.to]!==undefined)inDeg[e.to]++;});
  const levels={};
  const queue=nodes.filter(n=>inDeg[n.id]===0).map(n=>n.id);
  queue.forEach(id=>{levels[id]=0;});
  if(queue.length===0&&nodes.length>0){queue.push(nodes[0].id);levels[nodes[0].id]=0;}
  let qi=0;const MAX=nodes.length*nodes.length+10;
  while(qi<queue.length&&qi<MAX){
    const cur=queue[qi++];const cl=levels[cur]||0;
    for(const next of(adj[cur]||[])){
      if(levels[next]===undefined){levels[next]=cl+1;queue.push(next);}
      else if(levels[next]<cl+1){levels[next]=cl+1;}
    }
  }
  nodes.forEach(n=>{if(levels[n.id]===undefined)levels[n.id]=0;});
  const byLevel={};
  nodes.forEach(n=>{const l=levels[n.id];if(!byLevel[l])byLevel[l]=[];byLevel[l].push(n.id);});
  const cx=400,positions={};
  Object.keys(byLevel).map(Number).sort((a,b)=>a-b).forEach(lvl=>{
    const group=byLevel[lvl];
    group.forEach((id,i)=>{
      const x=group.length===1?cx:cx+(i-(group.length-1)/2)*210;
      positions[id]={x,y:60+lvl*120};
    });
  });
  return positions;
}

function getNodeDims(node){
  if(!node)return{w:170,h:52};
  if(node.type==='start'||node.type==='end')return{w:150,h:44};
  if(node.type==='decision')return{w:175,h:80};
  return{w:170,h:52};
}

function renderFlowchart(){
  const canvas=document.getElementById('canvas');
  if(nodes.length===0){canvas.innerHTML=`<div class="empty-state"><div class="empty-icon">◇</div><div class="empty-title">Sin diagrama aún</div><div class="empty-sub">Agrega tu primer nodo desde el panel izquierdo</div></div>`;return;}
  const positions=layoutNodes();
  const vals=Object.values(positions);
  const maxY=Math.max(...vals.map(p=>p.y));
  const maxX=Math.max(...vals.map(p=>p.x));
  const minX=Math.min(...vals.map(p=>p.x));
  const svgW=Math.max(700,maxX-minX+260);
  const svgH=maxY+130;
  const offsetX=(svgW-(maxX+minX))/2;
  Object.keys(positions).forEach(id=>{positions[id].x+=offsetX;});

  let svg=`<svg id="flow-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" width="${Math.min(svgW,820)}" style="display:block">
  <defs>
    <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#b0b0ad"/></marker>
    <marker id="arr-loop" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#ea580c"/></marker>
    <filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#00000012"/></filter>
  </defs>
  <rect width="${svgW}" height="${svgH}" fill="#f7f7f5"/>`;

  for(const edge of edges){
    const fp=positions[edge.from],tp=positions[edge.to];
    if(!fp||!tp)continue;
    const fn=nodes.find(n=>n.id===edge.from),tn=nodes.find(n=>n.id===edge.to);
    const fd=getNodeDims(fn),td=getNodeDims(tn);
    const isBack=fp.y>=tp.y-20;
    if(isBack){
      const x1=fp.x+fd.w/2,y1=fp.y,x2=tp.x+td.w/2,y2=tp.y;
      const lx=Math.max(fp.x,tp.x)+120;
      svg+=`<path d="M ${x1} ${y1} C ${lx} ${y1}, ${lx} ${y2}, ${x2} ${y2}" fill="none" stroke="#fed7aa" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#arr-loop)"/>`;
      if(edge.label){const tw=edge.label.length*6.5+12,mlx=lx+18,mly=(y1+y2)/2;svg+=`<rect x="${mlx-tw/2}" y="${mly-9}" width="${tw}" height="16" rx="4" fill="white" stroke="#fed7aa"/><text x="${mlx}" y="${mly+3}" text-anchor="middle" font-size="10" font-family="'DM Mono',monospace" fill="#ea580c">${esc(edge.label)}</text>`;}
    }else{
      const x1=fp.x,y1=fp.y+fd.h/2,x2=tp.x,y2=tp.y-td.h/2,my=(y1+y2)/2;
      const d=Math.abs(x1-x2)<5?`M ${x1} ${y1} L ${x2} ${y2}`:`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      svg+=`<path d="${d}" fill="none" stroke="#d4d4d0" stroke-width="1.5" marker-end="url(#arr)"/>`;
      if(edge.label){const lx=(x1+x2)/2,ly=(y1+y2)/2,tw=edge.label.length*6.5+12;svg+=`<rect x="${lx-tw/2}" y="${ly-9}" width="${tw}" height="16" rx="4" fill="white" stroke="#e8e8e5"/><text x="${lx}" y="${ly+3}" text-anchor="middle" font-size="10" font-family="'DM Mono',monospace" fill="#6b6b68">${esc(edge.label)}</text>`;}
    }
  }

  for(const node of nodes){
    const p=positions[node.id];if(!p)continue;
    svg+=drawNode(node,p.x,p.y);
  }
  svg+='</svg>';
  canvas.innerHTML=svg;
}

function drawNode(node,cx,cy){
  const color=TYPE_COLORS[node.type];
  const lines=wrapText(node.label,node.type==='decision'?13:17);
  const lineH=17;
  if(node.type==='start'||node.type==='end'){
    const w=150,h=44,ty=cy-((lines.length-1)*lineH)/2;
    return`<rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="white" stroke="${color}" stroke-width="1.5" filter="url(#sh)"/>${lines.map((l,i)=>`<text x="${cx}" y="${ty+i*lineH}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="600" font-family="'DM Sans',sans-serif" fill="${color}">${esc(l)}</text>`).join('')}`;
  }
  if(node.type==='decision'){
    const dw=175,dh=80,ty=cy-((lines.length-1)*lineH)/2;
    return`<polygon points="${cx},${cy-dh/2} ${cx+dw/2},${cy} ${cx},${cy+dh/2} ${cx-dw/2},${cy}" fill="white" stroke="${color}" stroke-width="1.5" filter="url(#sh)"/>${lines.map((l,i)=>`<text x="${cx}" y="${ty+i*lineH}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="600" font-family="'DM Sans',sans-serif" fill="${color}">${esc(l)}</text>`).join('')}`;
  }
  const w=170,h=52,ty=cy-((lines.length-1)*lineH)/2;
  return`<rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="6" fill="white" stroke="${color}" stroke-width="1.5" filter="url(#sh)"/>${lines.map((l,i)=>`<text x="${cx}" y="${ty+i*lineH}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="500" font-family="'DM Sans',sans-serif" fill="${color}">${esc(l)}</text>`).join('')}`;
}

function wrapText(text,max){
  if(text.length<=max)return[text];
  const words=text.split(' '),lines=[];let cur='';
  for(const w of words){if((cur+' '+w).trim().length<=max)cur=(cur+' '+w).trim();else{if(cur)lines.push(cur);cur=w;}}
  if(cur)lines.push(cur);return lines.slice(0,3);
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function exportSVG(){
  const svg=document.getElementById('flow-svg');
  if(!svg){showToast('Genera un diagrama primero');return;}
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([svg.outerHTML],{type:'image/svg+xml'}));
  a.download='diagrama.svg';a.click();showToast('SVG exportado');
}

function showToast(msg){
  document.querySelector('.toast')?.remove();
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2200);
}

document.getElementById('node-label').addEventListener('keydown',e=>{if(e.key==='Enter')addNode();});
renderAll();
