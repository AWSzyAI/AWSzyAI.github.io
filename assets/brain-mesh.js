/* Human surface geometry: Anderson Winkler / Brainder, CC BY-SA 3.0.
   See brain/README.md. Animated signals are an original visual layer. */
(() => {
'use strict';
const source=new URL('brain/human-brain.json',document.currentScript.src);
class BrainMesh {
 constructor(onReady) {
  this.canvas=document.createElement('canvas');
  this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
  this.ready=false;
  if(!this.gl)return;
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;onReady();});
  this.canvas.addEventListener('webglcontextrestored',()=>this.load(onReady));
  this.load(onReady);
 }
 async load(onReady){
  try{
   const gl=this.gl;
   const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
   const vert=compile(gl.VERTEX_SHADER,`
    precision mediump float;
    attribute vec3 position,normal;
    uniform mat3 rotation; uniform vec2 scale,offset;
    uniform float time,stimulus,pass,dpr;
    varying float light,activity,front;
    void main(){
     vec3 p=(position-vec3(0.,-15.,-2.))/90.;
     vec3 v=rotation*p;vec3 n=rotation*normal;
     float wave=sin(p.y*5.0+p.z*2.5-time*.9);
     float response=exp(-pow((distance(p,vec3(-.55,.25,.3))-stimulus*.5)/.16,2.))*exp(-stimulus*.38);
     activity=clamp(pow(max(0.,wave),10.)*.55+response,0.,1.);
     light=.18+.6*max(0.,dot(n,normalize(vec3(-.4,-.6,.9))));
     front=abs(n.z);
     gl_Position=vec4(v.xy*scale+offset,-v.z*.45-(pass>0.5?.002:0.),1.);
     gl_PointSize=dpr*(1.5+activity*2.7);
    }`);
   const frag=compile(gl.FRAGMENT_SHADER,`
    precision mediump float;
    uniform vec3 color; uniform float pass,alpha;
    varying float light,activity,front;
    void main(){
     if(pass<.5){gl_FragColor=vec4(color*(light+.16),alpha);}
     else if(pass<1.5){gl_FragColor=vec4(mix(color,vec3(.88,.94,.74),activity*.8),alpha*(.36+light*.35+activity*.6));}
     else{float r=length(gl_PointCoord-vec2(.5));if(r>.5)discard;gl_FragColor=vec4(mix(color,vec3(1.,.9,.6),activity),alpha*(.2+activity*.8)*smoothstep(.5,.12,r));}
    }`);
   const p=gl.createProgram();gl.attachShader(p,vert);gl.attachShader(p,frag);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.deleteShader(vert);gl.deleteShader(frag);this.program=p;
   this.uniforms={};for(const k of ['rotation','scale','offset','time','stimulus','pass','dpr','color','alpha'])this.uniforms[k]=gl.getUniformLocation(p,k);
   this.attributes={position:gl.getAttribLocation(p,'position'),normal:gl.getAttribLocation(p,'normal')};
   const response=await fetch(source);if(!response.ok)throw Error('Brain geometry unavailable');const data=await response.json();
   const buffer=(target,array)=>{const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,array,gl.STATIC_DRAW);return b;};
   this.parts=data.map(part=>({name:part.name,
    position:buffer(gl.ARRAY_BUFFER,new Float32Array(part.vertices)),normal:buffer(gl.ARRAY_BUFFER,new Float32Array(part.normals)),
    faces:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(part.faces)),edges:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(part.edges)),
    points:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(Array.from({length:Math.ceil(part.vertices.length/3/47)},(_,i)=>i*47).filter(i=>i<part.vertices.length/3))),
    faceCount:part.faces.length,edgeCount:part.edges.length,pointCount:Math.ceil(part.vertices.length/3/47)
   }));this.ready=true;onReady();
  }catch(error){this.ready=false;console.warn('Brain surface fallback:',error.message);onReady();}
 }
 draw(ctx,w,h,time,rx,ry,depthMix,stimulus){
  if(!this.ready)return false;
  const gl=this.gl,u=this.uniforms,mobile=w<721,dpr=Math.min(devicePixelRatio||1,1.5);
  if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}
  const a=.33+Math.sin(time*.12)*.09+rx*.7,e=.17+ry*.5;
  const sa=Math.sin(a),ca=Math.cos(a),se=Math.sin(e),ce=Math.cos(e);
  const rotation=[sa,-ca*se,-ca*ce,-ca,-sa*se,-sa*ce,0,-ce,se];
  const size=mobile?Math.min(w*.46,h*.245):Math.min(w*.32,h*.40);
  const cx=mobile?w*.5:w*.68,cy=mobile?h*.57:h*.46;
  gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);gl.uniformMatrix3fv(u.rotation,false,rotation);gl.uniform2f(u.scale,size*2/w,-size*2/h);gl.uniform2f(u.offset,cx*2/w-1,1-cy*2/h);
  gl.uniform1f(u.time,time);gl.uniform1f(u.stimulus,stimulus);gl.uniform1f(u.dpr,dpr);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const bind=part=>{for(const name of ['position','normal']){gl.bindBuffer(gl.ARRAY_BUFFER,part[name]);gl.enableVertexAttribArray(this.attributes[name]);gl.vertexAttribPointer(this.attributes[name],3,gl.FLOAT,false,0,0);}};
  const render=(part,pass,alpha,color)=>{bind(part);gl.uniform1f(u.pass,pass);gl.uniform1f(u.alpha,alpha);gl.uniform3fv(u.color,color);const key=pass===0?'faces':pass===1?'edges':'points';gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,part[key]);gl.drawElements(pass===0?gl.TRIANGLES:pass===1?gl.LINES:gl.POINTS,part[pass===0?'faceCount':pass===1?'edgeCount':'pointCount'],gl.UNSIGNED_SHORT,0);};
  const exterior=this.parts.filter(p=>p.name.includes('pial')||p.name.includes('Cerebellum')||p.name==='Brain-Stem');
  const renderView=deep=>{
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  if(!deep){
   exterior.forEach(p=>render(p,0,1,[.19,.43,.31]));
   gl.depthMask(false);exterior.forEach(p=>render(p,1,.82,[.63,.9,.73]));
   exterior.forEach(p=>render(p,2,.94,[.69,.92,.77]));gl.depthMask(true);
  }else{
   const inner=this.parts.filter(p=>!p.name.includes('pial'));
   inner.forEach(p=>render(p,0,1,p.name.includes('Amygdala')?[.75,.48,.21]:p.name.includes('Hippocampus')?[.48,.7,.46]:[.22,.44,.34]));
   gl.depthMask(false);inner.forEach(p=>render(p,1,.8,[.78,.86,.62]));
   gl.disable(gl.DEPTH_TEST);this.parts.filter(p=>p.name.includes('pial')).forEach(p=>render(p,1,.24,[.62,.87,.71]));gl.depthMask(true);
  }
  };
  const mix=Math.max(0,Math.min(1,depthMix));
  ctx.save();
  if(mix<1){renderView(false);ctx.globalAlpha=1-mix;ctx.drawImage(this.canvas,0,0,w,h);}
  if(mix>0){renderView(true);ctx.globalAlpha=mix;ctx.drawImage(this.canvas,0,0,w,h);}
  if(mix>.1){ctx.globalAlpha=Math.max(0,(mix-.1)/.9);this.labels(ctx,rotation,size,cx,cy,mobile);}
  ctx.restore();
  return true;
 }
 labels(c,r,size,cx,cy,mobile){
  const labels=[['额叶',[-40,38,24],-1,-.68],['颞叶',[-55,-14,-22],-1,-.24],['杏仁核',[-25,-11,-30],-1,.21],['海马',[-26,-28,-22],-1,.62],['顶叶 · 皮质',[-35,-52,47],1,-.70],['枕叶',[-28,-87,11],1,-.30],['下丘脑区域',[-4,-5,-17],1,.10],['小脑',[-31,-64,-34],1,.46],['脑干',[0,-36,-42],1,.80]];
  c.save();c.font=`${mobile?9:11}px -apple-system,"LXGWWenKai",sans-serif`;c.lineWidth=.65;
  for(const [text,p,side,row] of labels){const v=[p[0]/90,(p[1]+15)/90,(p[2]+2)/90];const x=cx+size*(r[0]*v[0]+r[3]*v[1]+r[6]*v[2]),y=cy+size*(r[1]*v[0]+r[4]*v[1]+r[7]*v[2]);const tx=cx+size*side*(mobile?.83:.90),ty=cy+size*row;
   c.strokeStyle='rgba(182,216,182,.38)';c.beginPath();c.moveTo(x,y);c.lineTo(tx-side*12,ty);c.lineTo(tx,ty);c.stroke();c.fillStyle='#d6e4c8';c.textAlign=side<0?'left':'right';c.fillText(text,tx,ty-6);c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}
  c.restore();
 }
}
window.BrainMesh=BrainMesh;
})();
