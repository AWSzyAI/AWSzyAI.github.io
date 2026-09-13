/* Wearable + EEG visual narrative. Planning curves are qualitative scenarios; see RESEARCH_VISUALS.md. */
(() => {
'use strict';
const M=window.ResearchModels,TAU=Math.PI*2;
const mint='#b9eed0',amber='#e2ba77';
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function pulse(s,x,y,w,h,color,phase=0){const c=s.ctx;c.beginPath();for(let i=0;i<=w;i+=2){const t=i/w*5+s.time*.65+phase;const p=t%1;const a=Math.sin(t*8)*.08+Math.exp(-Math.pow((p-.42)/.04,2))*.7-Math.exp(-Math.pow((p-.49)/.045,2))*.38;const yy=y-a*h;i?c.lineTo(x+i,yy):c.moveTo(x+i,yy);}c.strokeStyle=color;c.lineWidth=1.15;c.stroke();}
function eeg(s,x,y,r){
 const c=s.ctx;c.save();c.translate(x,y);
 // A head-cap contour with connected electrode sites and a traveling acquisition arc.
 c.beginPath();c.ellipse(0,0,r*.77,r,0,0,TAU);c.strokeStyle='#91cda46b';c.lineWidth=1;c.stroke();
 c.beginPath();c.moveTo(-r*.12,-r*.98);c.lineTo(0,-r*1.12);c.lineTo(r*.12,-r*.98);c.stroke();
 for(const side of [-1,1]){c.beginPath();c.ellipse(side*r*.79,0,r*.10,r*.23,0,0,TAU);c.stroke();}
 const sites=[];
 for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){if(Math.hypot(col*.34,row*.34)>.76)continue;sites.push({x:col*r*.30,y:row*r*.34});}
 c.lineWidth=.55;c.strokeStyle='#83c49c29';for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++)if(Math.hypot(sites[i].x-sites[j].x,sites[i].y-sites[j].y)<r*.5){c.beginPath();c.moveTo(sites[i].x,sites[i].y);c.lineTo(sites[j].x,sites[j].y);c.stroke();}
 sites.forEach((p,i)=>{const a=.3+.7*Math.max(0,Math.sin(s.time*1.3-i*.8));s.circle(p.x,p.y,3+a*2,.2,`rgba(161,231,182,${a*.18})`);s.circle(p.x,p.y,1.7,.9);});
 c.beginPath();c.ellipse(0,0,r*1.1,r*1.18,-.15,s.time*.3,s.time*.3+2);c.strokeStyle='#b0e9c44f';c.stroke();
 c.restore();s.text('EEG · 脑电',x,y+r*1.42,12,.85,'center');
 pulse(s,x-r,y+r*1.72,r*2,r*.12,'#a9dcb89c',2);
}
function draw(s){
 const c=s.ctx,w=s.w,h=s.h,mobile=w<721,pad=mobile?22:Math.max(34,w*.045);
 const watchHeight=mobile?Math.min(240,h*.295,w*.67):Math.min(400,h*.40,w*.49);
 const wr=watchHeight/4.2,wx=mobile?w*.29:w*.55,wy=mobile?138+watchHeight/2:h*.235;
 const er=mobile?wr*.84:wr*.85,ex=mobile?w*.75:w*.83,ey=mobile?wy:wy-wr*.12;
 const top=mobile?h*.535:h*.50,bottom=mobile?h-292:h-280;
 // Long layered signal fibers tie acquisition to one shared state space.
 for(let i=0;i<24;i++){c.beginPath();c.moveTo(wx+watchHeight*.34,wy+watchHeight*.32+i*1.2);c.bezierCurveTo(w*.68,wy+watchHeight*.43+i,w*.74,top-35+i*2,w-pad,top+(bottom-top)*i/24);c.strokeStyle=`rgba(143,215,164,${.035+i%3*.012})`;c.lineWidth=.65;c.stroke();}
 window.WatchDisplay.draw(s,wx,wy,watchHeight);eeg(s,ex,ey,er);
 const x0=pad,x1=w-pad,span=x1-x0,start=0,end=30,origin=s.hour;
 const px=t=>x0+(t-start)/(end-start)*span,py=v=>bottom-v*Math.max(70,bottom-top);
 s.text('连续意识状态',x0,top-25,mobile?12:14,.9);
 s.text('样例日程 · 记录 → 情景预测',x1,top-25,10,.6,'right');
 for(let i=0;i<3;i++)s.line(x0,py(i/2),x1,py(i/2),.10,.65);
 const now=px(origin);const shade=c.createLinearGradient(now,0,x1,0);shade.addColorStop(0,'#a9dcb809');shade.addColorStop(1,'#a9dcb818');c.fillStyle=shade;c.fillRect(now,top,x1-now,bottom-top);
 const future=t=>M.forecastSignal(t,origin,s.plan);
 const basePlan={coffee:17,meal:21,sleep:24};
 // A subdued reference makes the effect of moving the same day’s events visible.
 c.beginPath();for(let i=0;i<=150;i++){const t=origin+(end-origin)*i/150,x=px(t),y=py(M.forecastSignal(t,origin,basePlan).arousal);i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#d7e4d350';c.lineWidth=1;c.setLineDash([2,5]);c.stroke();c.setLineDash([]);
 for(const [key,color] of [['arousal',mint],['attention',amber]]){
  c.beginPath();for(let i=0;i<=100;i++){const t=origin+(end-origin)*i/100,v=future(t);c.lineTo(px(t),py(M.clamp(v[key]+v.uncertainty,0,1)));}for(let i=100;i>=0;i--){const t=origin+(end-origin)*i/100,v=future(t);c.lineTo(px(t),py(M.clamp(v[key]-v.uncertainty,0,1)));}c.closePath();c.fillStyle=key==='arousal'?'#b9eed013':'#e2ba7710';c.fill();
  for(const predicted of [false,true]){const from=predicted?origin:0,to=predicted?end:origin;c.beginPath();for(let i=0;i<=250;i++){const t=from+(to-from)*i/250,v=predicted?future(t):M.stateSignal(t%24);const x=px(t),y=py(v[key]);i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle=color;c.lineWidth=predicted?1.7:2;c.setLineDash(predicted?[5,4]:key==='attention'?[2,3]:[]);c.shadowColor=color;c.shadowBlur=predicted?0:7;c.stroke();c.shadowBlur=0;c.setLineDash([]);}
  s.circle(now,py(M.stateSignal(origin)[key]),3,1,color);
 }
 s.line(now,top-8,now,bottom+10,.65,.9);s.text('当前',now,top-10,9,.8,'center');
 const bands=[];
 for(let t=0;t<end;t+=.1){
  const v=future(t),recorded=t<=origin;
  const label=recorded?M.states[M.stateAt(t%24).key].short:v.arousal<.24?'睡眠':v.arousal<.50?'困倦':v.attention>.8?'专注':v.attention<.34?'脑雾':'清醒';
  const last=bands[bands.length-1];if(last&&last[2]===label)last[1]=Math.min(end,t+.1);else bands.push([t,Math.min(end,t+.1),label]);
 }
 bands.forEach(([from,to,label],i)=>{c.fillStyle=from>=origin?'#badcc519':i%2?'#b9eed018':'#b9eed026';c.fillRect(px(from),bottom+12,Math.max(0,px(to)-px(from)-2),18);if(px(to)-px(from)>25)s.text(label,(px(from)+px(to))/2,bottom+25,9,.65,'center');});
 for(const t of [0,6,12,18,24,30])s.text(t===30?'次日 06:00':`${String(t%24).padStart(2,'0')}:00`,px(t),bottom+47,9,.6,t===0?'left':t===30?'right':'center');

}
window.StateExperience={draw};
})();
