/* Apple-provided product artwork; source and display notes: devices/README.md. */
(() => {
'use strict';
const M=window.ResearchModels;
const bezel=new Image();
let frame=null,lastScene=null;
// This public Apple sprite has a neutral preview matte. Recover its alpha once;
// preserve the product pixels, proportions and complete silhouette when compositing.
bezel.onload=()=>{
 const crop=document.createElement('canvas');crop.width=568;crop.height=888;
 const c=crop.getContext('2d',{willReadFrequently:true});
 c.drawImage(bezel,1216,184,568,888,0,0,568,888);
 const data=c.getImageData(0,0,568,888),p=data.data,matte=171;
 for(let i=0;i<p.length;i+=4){
  const originalAlpha=p[i+3],alpha=Math.max(0,(originalAlpha-matte)/(255-matte));
  if(alpha<.015){p[i+3]=0;continue;}
  for(let j=0;j<3;j++)p[i+j]=Math.max(0,Math.min(255,(p[i+j]*originalAlpha-127*matte*(1-alpha))/(255*alpha)));
  p[i+3]=Math.round(alpha*255);
 }
 c.putImageData(data,0,0);frame=crop;
 if(lastScene?.mode==='waves')lastScene.draw('waves',lastScene.w,lastScene.h);
};
bezel.src='/assets/devices/apple-watch-series-11-bezels.png';
function rounded(c,x,y,w,h,r,color){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();}
function text(c,value,x,y,size,color,weight=400,align='left'){
 c.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`;
 c.fillStyle=color;c.textAlign=align;c.fillText(value,x,y);
}
function draw(s,x,y,height){
 lastScene=s;const c=s.ctx,scale=height/888,compact=s.w<721;
 c.save();c.translate(x-284*scale,y-height/2);c.scale(scale,scale);
 // The UI sits under the original bezel. Only screen content changes with time.
 rounded(c,61,188,422,506,99,'#080c0c');
 c.save();c.beginPath();c.roundRect(65,194,414,496,96);c.clip();
 const top=c.createLinearGradient(0,194,0,690);top.addColorStop(0,'#13231e');top.addColorStop(.45,'#080d0c');top.addColorStop(1,'#080c0c');
 c.fillStyle=top;c.fillRect(65,194,414,496);
 const minute=Math.floor(s.hour*60),clock=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
 text(c,'状态',101,239,compact?29:25,'#a6cfbb',600);
 text(c,clock,443,239,compact?29:25,'#e5ebe7',500,'right');
 text(c,'当下',101,292,compact?28:25,'#84948c');
 text(c,M.states[M.stateAt(s.hour).key].short,99,355,60,'#f2f5f1',600);
 // A compact pair of labeled trajectories uses the same features as the large chart.
 const signal=M.stateSignal(s.hour),rows=[['arousal','觉醒','#aee6c8'],['attention','注意','#e4bb7c']];
 for(let row=0;row<2;row++){
  const [key,label,color]=rows[row],yy=406+row*82;
  text(c,label,101,yy,compact?28:24,color,500);
  const v=signal[key],level=v>.8?'高':v>.55?'较高':v>.3?'中':'低';
  text(c,level,443,yy,compact?28:24,'#b5c1b9',400,'right');
  c.beginPath();
  for(let i=0;i<=100;i++){
   const hour=(s.hour-2+i/50+24)%24,value=M.stateSignal(hour)[key],px=103+i*3.38,py=yy+42-value*30;
   i?c.lineTo(px,py):c.moveTo(px,py);
  }
  c.strokeStyle=color;c.lineWidth=3;c.lineJoin='round';c.lineCap='round';c.stroke();
  const endY=yy+42-signal[key]*30;
  c.beginPath();c.arc(441,endY,4.3,0,Math.PI*2);c.fillStyle=color;c.fill();
 }
 rounded(c,92,558,360,92,28,'#18241f');
 const future=M.forecastSignal(Math.min(30,s.hour+2),s.hour,s.plan);
 const next=future.arousal<.24?'睡眠':future.arousal<.50?'困倦':future.attention>.8?'专注':future.attention<.34?'脑雾':'清醒';
 text(c,'接下来',115,591,compact?26:23,'#8da898',500);
 text(c,next,115,626,compact?34:30,'#dceadf',500);
 text(c,'+2 h',428,616,compact?27:24,'#9cafa1',400,'right');
 c.restore();
 if(frame)c.drawImage(frame,0,0);
 else { // A quiet screen remains readable while the product artwork loads.
  c.beginPath();c.roundRect(60,188,424,507,99);c.strokeStyle='#65766c';c.lineWidth=3;c.stroke();
 }
 c.restore();
 s.text('Apple Watch',x,y+height/2+15,compact?11:12,.85,'center');
}
window.WatchDisplay={draw};
})();
