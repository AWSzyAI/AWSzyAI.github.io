/* Continuous-state figure: acquisition, spectrogram, hypnogram and latent states. Illustrative; see RESEARCH_VISUALS.md. */
(() => {
'use strict';
const M=window.ResearchModels,TAU=Math.PI*2;
const mint='#b9eed0',amber='#e2ba77',rem='#e2ba77';
const STAGES=['W','REM','N1','N2','N3'];
const wrap=h=>((h%24)+24)%24;

// Sleep stage from the sample schedule: NREM depth deepens mid-segment early in the night.
function nremSegment(h){
 const s=M.schedule;let i=0;s.forEach((e,k)=>{if(h>=e[0])i=k;});
 const start=i===0?s[s.length-1][0]-24:s[i][0],end=i===s.length-1?24+s[1][0]:s[i+1][0];
 return [start,end];
}
function recordedStage(t){
 const h=wrap(t),key=M.stateAt(h).key;
 if(key==='rem')return 1;
 if(key==='drowsy')return 2;
 if(key==='nrem'){const [a,b]=nremSegment(h);return Math.min(h-a,b-h)>.35&&(h<4.6||h>21)?4:3;}
 return 0;
}
function futureStage(t,plan,v){
 if(v.arousal>=.55)return 0;
 if(v.arousal>=.36)return 2;
 const canonical=recordedStage(t-Number(plan.sleep)+22);
 return canonical===0?3:canonical;
}
// Relative band weights: delta, theta, alpha, sigma (spindles), beta.
function bandWeights(t){
 const stage=recordedStage(t),attention=M.stateAt(wrap(t)).attention;
 if(stage===4)return [1,.25,.06,.12,.04];
 if(stage===3)return [.62,.3,.08,.55,.06];
 if(stage===1)return [.18,.72,.08,0,.2];
 if(stage===2)return [.24,.46,.62,.04,.12];
 return [.1,.16,.12+.36*(1-attention),.02,.24+.46*attention];
}
const bands=[[2,1.3],[6,1.4],[10,1.2],[13,.9],[21,5.5]];
function power(weights,f,noise){
 let p=.32/(1+f*.16);
 weights.forEach((w,i)=>{const [c,width]=bands[i];p+=w*Math.exp(-Math.pow((f-c)/width,2));});
 return p*(.85+noise*.3);
}
const stops=[[13,42,31],[30,86,60],[79,155,108],[185,238,208],[243,227,176]];
function colormap(v){
 v=M.clamp(v,0,1)*(stops.length-1);const i=Math.min(stops.length-2,Math.floor(v)),t=v-i;
 return stops[i].map((c,k)=>Math.round(c+(stops[i+1][k]-c)*t));
}
let spectrogram=null;
function buildSpectrogram(){
 const cols=360,rows=64,canvas=document.createElement('canvas');canvas.width=cols;canvas.height=rows;
 const c=canvas.getContext('2d'),image=c.createImageData(cols,rows),random=M.randomSource(4127);
 for(let x=0;x<cols;x++){
  const weights=bandWeights(x/cols*30);
  for(let y=0;y<rows;y++){
   const f=.5+(rows-1-y)/(rows-1)*29.5,value=Math.log10(power(weights,f,random())*10)/1.15;
   const [r,g,b]=colormap(value),k=(y*cols+x)*4;
   image.data[k]=r;image.data[k+1]=g;image.data[k+2]=b;image.data[k+3]=255;
  }
 }
 c.putImageData(image,0,0);return canvas;
}
// Synthetic traces whose rhythm follows the current state; not recorded EEG.
function eegSample(w,tau,channel){
 const ph=channel*1.7;
 return w[0]*(Math.sin(TAU*1.6*tau+ph)+.5*Math.sin(TAU*.9*tau+ph*2))
  +w[1]*.6*Math.sin(TAU*6.2*tau+ph)
  +w[2]*.75*Math.sin(TAU*10.2*tau+ph)*(.6+.4*Math.sin(TAU*.4*tau+channel))
  +w[3]*.9*Math.sin(TAU*13*tau)*Math.exp(-Math.pow(((tau*.45+channel*.1)%1-.5)/.11,2))
  +w[4]*.32*(Math.sin(TAU*19*tau+ph)+.6*Math.sin(TAU*27.3*tau+ph*3)+.4*Math.sin(TAU*34.1*tau+ph));
}
function ppg(tau,bpm){const p=(tau*bpm/60)%1;return Math.exp(-Math.pow((p-.15)/.07,2))+.35*Math.exp(-Math.pow((p-.45)/.1,2));}
function acc(tau,activity){return activity*(Math.sin(tau*13.1)*Math.sin(tau*3.7)+.6*Math.sin(tau*29.3+1)*Math.sin(tau*1.3))+.03*Math.sin(tau*71);}
// Seven-point average removes sub-sampling aliasing of the fast model fluctuations.
function smoothed(fn,t){let a=0,b=0,u=0;for(let k=-3;k<=3;k++){const v=fn(t+k*.05);a+=v.arousal;b+=v.attention;u+=v.uncertainty||0;}return {arousal:a/7,attention:b/7,uncertainty:u/7};}

const montage={Fp1:[-.3,-.84],Fp2:[.3,-.84],F7:[-.7,-.46],F3:[-.36,-.42],Fz:[0,-.4],F4:[.36,-.42],F8:[.7,-.46],T3:[-.86,0],C3:[-.43,0],Cz:[0,0],C4:[.43,0],T4:[.86,0],T5:[-.7,.46],P3:[-.36,.42],Pz:[0,.4],P4:[.36,.42],T6:[.7,.46],O1:[-.3,.84],O2:[.3,.84]};
function head(s,x,y,r){
 const c=s.ctx;
 c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=s.ink(.45);c.lineWidth=.9;c.stroke();
 c.beginPath();c.moveTo(x-r*.13,y-r*.99);c.lineTo(x,y-r*1.15);c.lineTo(x+r*.13,y-r*.99);c.stroke();
 for(const side of [-1,1]){c.beginPath();c.ellipse(x+side*r*1.04,y,r*.07,r*.2,0,0,TAU);c.stroke();}
 for(const [name,[u,v]] of Object.entries(montage)){
  const active=name==='Fz'||name==='Cz'||name==='Pz';
  s.circle(x+u*r,y+v*r,active?2.6:1.3,active?1:.38,active?mint:null);
  if(active)s.text(name,x+u*r+5,y+v*r+3,8,.85);
 }
}
function axisLabel(s,label,x,y){const c=s.ctx;c.save();c.translate(x,y);c.rotate(-Math.PI/2);s.text(label,0,0,9,.55,'center');c.restore();}

function draw(s){
 const c=s.ctx,w=s.w,h=s.h,mobile=w<721,pad=mobile?18:Math.max(34,w*.045);
 const origin=s.hour,plan=s.plan,end=30,text=s.textBox||{bottom:mobile?150:h*.36,right:w*.36};
 const stackBottom=h-(mobile?172:156);

 // a · Multimodal acquisition.
 const ax=mobile?pad:Math.max(text.right+40,w*.4),ay=mobile?text.bottom+18:34,aw=w-pad-ax;
 const ah=mobile?Math.min(150,h*.2):M.clamp(text.bottom-60,170,215);
 s.panelLabel('a','多模态采集',ax,ay);
 const watchH=Math.min(ah-18,mobile?132:230),watchW=watchH*.64;
 window.WatchDisplay.draw(s,ax+watchW/2,ay+18+watchH/2-8,watchH);
 const headR=mobile?0:Math.min(ah*.2,40);
 const tx0=ax+watchW+(mobile?16:34),tx1=w-pad-(headR?headR*2+70:46),rowsTop=ay+22,rowH=(ah-30)/5;
 if(headR)head(s,w-pad-headR-6,ay+22+headR*1.4,headR),s.text('10–20 导联',w-pad-headR-6,ay+38+headR*2.6,9,.55,'center');
 const st=M.stateSignal(origin),weights=bandWeights(origin),bpm=Math.round(48+st.arousal*42);
 const rows=[['Fz',ch=>tau=>eegSample(weights,tau,0)],['Cz',()=>tau=>eegSample(weights,tau,1)],['Pz',()=>tau=>eegSample(weights,tau,2)],['PPG',()=>tau=>ppg(tau,bpm)*1.4-.7],['ACC',()=>tau=>acc(tau,Math.max(0,st.arousal-.3)*1.6)]];
 const labelW=mobile?30:36,window4=4;
 rows.forEach(([label,make],i)=>{
  const mid=rowsTop+rowH*(i+.5),fn=make(),color=i<3?mint:i===3?amber:s.ink(.6);
  s.text(label,tx0,mid+3,mobile?9:10,.7);
  if(i===3)s.text(`${bpm} bpm`,tx1+6,mid+3,9,.6);
  c.beginPath();
  const x0=tx0+labelW,span=tx1-x0;
  for(let px=0;px<=span;px+=1.5){const tau=s.time-window4+px/span*window4,v=fn(tau);const y=mid-v*rowH*.34;px?c.lineTo(x0+px,y):c.moveTo(x0+px,y);}
  c.strokeStyle=color;c.lineWidth=1;c.stroke();
 });
 const sx=tx1-(tx1-tx0-labelW)/window4,sy=rowsTop+rowH*5+2;
 s.line(sx,sy,tx1,sy,.6,1);s.text('1 s',(sx+tx1)/2,sy+11,8,.55,'center');
 // Vertical EEG amplitude bar beside Pz: one model unit ≈ 50 µV.
 const pz=rowsTop+rowH*2.5;s.line(tx1+5,pz,tx1+5,pz-rowH*.34,.6,1);s.text('50 µV',tx1+9,pz-rowH*.08,8,.55);

 // Shared time axis for b–d.
 const x0=pad+(mobile?22:30),x1=w-pad,px=t=>x0+t/end*(x1-x0),now=px(origin);
 const top=Math.max(ay+ah+(mobile?52:44),mobile?0:text.bottom+40),avail=stackBottom-top-(mobile?60:84);
 const bH=avail*.28,cH=avail*.24,dH=avail*.48,gap=mobile?26:32;
 const bY=top,cY=bY+bH+gap,dY=cY+cH+gap;

 // b · Spectrogram of the recorded segment.
 s.panelLabel('b','脑电时频图',pad,bY-8);
 spectrogram=spectrogram||buildSpectrogram();
 c.save();c.beginPath();c.rect(x0,bY,Math.max(0,now-x0),bH);c.clip();
 c.imageSmoothingEnabled=true;c.globalAlpha=.92;c.drawImage(spectrogram,x0,bY,x1-x0,bH);c.restore();
 c.save();c.beginPath();c.rect(now,bY,x1-now,bH);c.clip();
 for(let k=-bH;k<x1-now;k+=7)s.line(now+k,bY+bH,now+k+bH,bY,.05,.7);c.restore();
 for(const f of [0,10,20,30])s.text(String(f),x0-6,bY+bH-f/30*bH+3,8,.5,'right');
 axisLabel(s,'Hz',pad+2,bY+bH/2);

 // c · Hypnogram, with REM marked as a thicker amber bar.
 s.panelLabel('c','睡眠分期',pad,cY-8);
 const level=k=>cY+k/4*cH;
 STAGES.forEach((name,k)=>{s.text(name,x0-6,level(k)+3,8,.55,'right');s.line(x0,level(k),x1,level(k),.06,.6);});
 const step=.05,future=t=>M.forecastSignal(t,origin,plan);
 for(const predicted of [false,true]){
  const from=predicted?origin:0,to=predicted?end:origin;let prev=null;
  c.beginPath();
  for(let t=from;t<=to+1e-9;t+=step){
   const k=predicted?futureStage(t,plan,future(t)):recordedStage(t),x=px(t),y=level(k);
   if(prev===null)c.moveTo(x,y);else if(prev!==k){c.lineTo(x,level(prev));c.lineTo(x,y);}
   prev=k;
  }
  c.lineTo(px(to),level(prev));
  c.strokeStyle=predicted?s.ink(.45):s.ink(.85);c.lineWidth=1.1;c.setLineDash(predicted?[4,3]:[]);c.stroke();c.setLineDash([]);
  for(let t=from;t<to;t+=step){
   const k=predicted?futureStage(t,plan,future(t)):recordedStage(t);
   if(k===1){c.fillStyle=predicted?'#e2ba7766':rem;c.fillRect(px(t),level(1)-1.6,px(Math.min(to,t+step))-px(t)+.4,3.2);}
  }
 }

 // d · Latent arousal and attention with forecast interval.
 s.panelLabel('d','觉醒 / 注意（潜变量）',pad,dY-8);
 const py=v=>dY+dH-v*dH;
 for(const v of [0,.5,1]){s.line(x0,py(v),x1,py(v),.08,.6);s.text(v.toFixed(1),x0-6,py(v)+3,8,.5,'right');}
 axisLabel(s,'归一化',pad+2,dY+dH/2);
 const N=mobile?160:300,rec=t=>M.stateSignal(wrap(t)),fut=t=>t<=origin?{...rec(t),uncertainty:0}:future(t);
 const later={coffee:17,meal:21,sleep:24};
 c.beginPath();for(let i=0;i<=N/2;i++){const t=origin+(end-origin)*i/(N/2),v=smoothed(u=>M.forecastSignal(u,origin,later),t);const x=px(t),y=py(v.arousal);i?c.lineTo(x,y):c.moveTo(x,y);}
 c.strokeStyle=s.ink(.32);c.lineWidth=1;c.setLineDash([1.5,4]);c.stroke();c.setLineDash([]);
 for(const [key,color] of [['arousal',mint],['attention',amber]]){
  const samples=[];for(let i=0;i<=N/2;i++){const t=origin+(end-origin)*i/(N/2);samples.push([px(t),smoothed(fut,t)]);}
  c.beginPath();samples.forEach(([x,v])=>c.lineTo(x,py(M.clamp(v[key]+v.uncertainty*1.6,0,1))));
  for(let i=samples.length-1;i>=0;i--){const [x,v]=samples[i];c.lineTo(x,py(M.clamp(v[key]-v.uncertainty*1.6,0,1)));}
  c.closePath();c.fillStyle=key==='arousal'?'#b9eed01c':'#e2ba7718';c.fill();
  c.beginPath();samples.forEach(([x,v],i)=>i?c.lineTo(x,py(v[key])):c.moveTo(x,py(v[key])));
  c.strokeStyle=color;c.lineWidth=1.4;c.setLineDash([5,4]);c.stroke();c.setLineDash([]);
  c.beginPath();for(let i=0;i<=N;i++){const t=origin*i/N,v=smoothed(rec,t);i?c.lineTo(px(t),py(v[key])):c.moveTo(px(t),py(v[key]));}
  c.strokeStyle=color;c.lineWidth=1.6;c.setLineDash(key==='attention'?[2.5,2.5]:[]);c.stroke();c.setLineDash([]);
  s.circle(now,py(smoothed(rec,origin)[key]),2.8,1,color);
 }
 // Legend inside panel d.
 const legend=[['觉醒',mint,[]],['注意',amber,[2.5,2.5]],['情景预测 ±95%',s.ink(.7),[5,4]],['较晚日程',s.ink(.4),[1.5,4]]];
 let lx=x1;
 c.font='9px -apple-system, BlinkMacSystemFont, "LXGWWenKai", sans-serif';
 for(let i=legend.length-1;i>=0;i--){
  const [label,color,dash]=legend[i],tw=c.measureText(label).width;lx-=tw;s.text(label,lx,dY-8,9,.7);
  c.beginPath();c.moveTo(lx-22,dY-11);c.lineTo(lx-6,dY-11);c.strokeStyle=color;c.lineWidth=1.4;c.setLineDash(dash);c.stroke();c.setLineDash([]);lx-=mobile?30:38;
  if(mobile&&i===2)break;
 }

 // Cursor through b–d and the time axis.
 s.line(now,bY-4,now,dY+dH+4,.7,.9);
 const minute=Math.floor(origin*60),clock=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
 s.text(clock,now,bY-10,9,.9,'center');
 if(now-x0>80)s.text('← 记录',now-26,bY-10,8,.55,'right');
 if(x1-now>90)s.text('情景预测 →',now+26,bY-10,8,.55);
 const axisY=dY+dH+16;
 for(let t=0;t<=end;t+=3){
  const x=px(t),major=t%6===0;s.line(x,dY+dH,x,dY+dH+(major?5:3),major?.5:.3,.8);
  if(major&&(!mobile||t%12===0))s.text(t===30?'次日 06:00':`${String(t%24).padStart(2,'0')}:00`,x,axisY+2,9,.6,t===0?'left':t===30?'right':'center');
 }
}
window.StateExperience={draw};
})();
