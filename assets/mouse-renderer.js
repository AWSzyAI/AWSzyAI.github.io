/* Smooth shaded mouse and enrichment objects, sharing the behavior model's coordinates. */
(() => {
'use strict';
const TAU=Math.PI*2;
class MouseRenderer {
 constructor(){
  this.canvas=document.createElement('canvas');this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
  this.ready=false;if(!this.gl)return;
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;});
  this.canvas.addEventListener('webglcontextrestored',()=>this.init());this.init();
 }
 init(){
  try{
   const gl=this.gl;
   const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
   const vs=compile(gl.VERTEX_SHADER,`precision highp float;
    attribute vec3 position,normal;uniform vec3 center,extent;uniform mat3 rotation;uniform vec4 camera;uniform vec2 scale,offset;
    varying vec3 n,local;varying float height;
    void main(){vec3 p=center+rotation*(position*extent);n=normalize(rotation*(normal/extent));local=position; height=p.z;
     vec2 ground=p.xy-vec2(.5);float u=ground.x*camera.x-ground.y*camera.y,v=ground.x*camera.y+ground.y*camera.x;
     gl_Position=vec4(vec2(u,v*camera.z-p.z*camera.w)*scale+offset,-(v*camera.w+p.z*camera.z)*.65,1.);
    }`);
   const fs=compile(gl.FRAGMENT_SHADER,`precision highp float;
    uniform vec3 color;uniform float material;uniform vec4 camera;varying vec3 n,local;varying float height;
    void main(){vec3 N=normalize(n),L=normalize(vec3(-.45,-.65,1.5)),V=vec3(camera.y*camera.w,camera.x*camera.w,camera.z);
     float diffuse=max(0.,dot(N,L));float fill=max(0.,dot(N,normalize(vec3(.7,.4,.8))));
     float ambient=.43+.15*(N.z*.5+.5);float shade=ambient+.35*diffuse+.10*fill;
     float spec=pow(max(0.,dot(N,normalize(L+V))),material>1.5?70.:25.);
     float grain=sin(local.x*240.+sin(local.y*127.)*2.0)*sin(local.z*192.+local.y*61.)*.012;
     vec3 base=color*(shade+(material<.5?grain:0.));base+=vec3(.88,.96,.88)*spec*(material>1.5?.5:material>.5?.07:.025);
     gl_FragColor=vec4(base,1.);
    }`);
   this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
   this.u={};for(const key of ['center','extent','rotation','camera','scale','offset','color','material'])this.u[key]=gl.getUniformLocation(this.program,key);
   this.a={};for(const key of ['position','normal'])this.a[key]=gl.getAttribLocation(this.program,key);
   this.sphere=this.sphereMesh(48,32,0);this.body=this.sphereMesh(64,40,1);this.head=this.sphereMesh(48,32,2);
   this.cylinder=this.cylinderMesh(72);this.block=this.boxMesh();this.ready=true;
  }catch(error){this.ready=false;console.warn('Mouse renderer fallback:',error.message);}
 }
 upload(vertices,normals,indices){
  const gl=this.gl,buffer=(target,data)=>{const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;};
  return {position:buffer(gl.ARRAY_BUFFER,new Float32Array(vertices)),normal:buffer(gl.ARRAY_BUFFER,new Float32Array(normals)),indices:buffer(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices)),count:indices.length};
 }
 sphereMesh(segments,rings,shape){
  const v=[],n=[],indices=[];
  const point=(lat,lon)=>{const x=Math.cos(lat)*Math.cos(lon),y=Math.cos(lat)*Math.sin(lon),z=Math.sin(lat);const taper=shape===1?1-.17*x:shape===2?1-.38*x:1;return [x,y*taper,z*(shape===1?1-.07*x:taper)];};
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
   const lat=-Math.PI/2+j/rings*Math.PI,lon=i/segments*TAU,p=point(lat,lon),a=point(lat+.0001,lon),b=point(lat,lon+.0001);
   const u=a.map((x,k)=>x-p[k]),w=b.map((x,k)=>x-p[k]);let normal=[w[1]*u[2]-w[2]*u[1],w[2]*u[0]-w[0]*u[2],w[0]*u[1]-w[1]*u[0]];
   if(Math.abs(Math.cos(lat))<.001)normal=[0,0,Math.sign(lat)];
   const length=Math.hypot(...normal)||1;v.push(...p);n.push(...normal.map(x=>x/length));
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+1,d=a+segments+1,e=d+1;indices.push(a,b,e,a,e,d);}
  return this.upload(v,n,indices);
 }
 cylinderMesh(count){
  const v=[],n=[],idx=[];
  // Rounded shoulder profile gives a finished, machined edge instead of a hard polygon rim.
  const profile=[[.94,0],[1,.06],[1,.94],[.94,1],[0,1]];
  profile.forEach(([radius,z],row)=>{for(let i=0;i<=count;i++){const a=i/count*TAU,top=row>=3;v.push(Math.cos(a)*radius,Math.sin(a)*radius,z);n.push(Math.cos(a)*(top?0:1),Math.sin(a)*(top?0:1),top?1:row===2?.25:0);}});
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<count;i++){const a=j*(count+1)+i,b=a+1,d=a+count+1,e=d+1;idx.push(a,b,e,a,e,d);}return this.upload(v,n,idx);
 }
 boxMesh(){
  const v=[],n=[],idx=[],steps=12,r=.10;
  for(let face=0;face<6;face++){
   const axis=Math.floor(face/2),side=face%2?1:-1,a=(axis+1)%3,b=(axis+2)%3,start=v.length/3;
   for(let j=0;j<=steps;j++)for(let i=0;i<=steps;i++){
    const p=[0,0,0];p[axis]=side;p[a]=i/steps*2-1;p[b]=j/steps*2-1;const q=p.map(x=>Math.max(-1+r,Math.min(1-r,x))),d=p.map((x,k)=>x-q[k]),len=Math.hypot(...d);const normal=d.map(x=>x/len);v.push(...q.map((x,k)=>x+normal[k]*r));n.push(...normal);
   }
   for(let j=0;j<steps;j++)for(let i=0;i<steps;i++){const a=start+j*(steps+1)+i,b=a+1,d=a+steps+1,e=d+1;idx.push(a,b,e,a,e,d);}
  }return this.upload(v,n,idx);
 }
 draw(ctx,view,m,size){
  if(!this.ready)return false;
  const {width,height,unit,cx,cy,yaw,tilt}=view,gl=this.gl,u=this.u,lift=Math.sqrt(1-tilt*tilt),dpr=Math.min(devicePixelRatio||1,2);
  const pw=Math.round(width*dpr),ph=Math.round(height*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;}
  gl.viewport(0,0,pw,ph);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.useProgram(this.program);
  gl.uniform4f(u.camera,Math.cos(yaw),Math.sin(yaw),tilt,lift);gl.uniform2f(u.scale,unit*2/width,-unit*2/height);gl.uniform2f(u.offset,cx*2/width-1,1-cy*2/height);
  const rotation=(angle,roll=0)=>{const ca=Math.cos(angle),sa=Math.sin(angle),cr=Math.cos(roll),sr=Math.sin(roll);return [ca,sa,0,-sa*cr,ca*cr,sr,sa*sr,-ca*sr,cr];};
  const part=(mesh,center,extent,angle,color,material=0,roll=0)=>{
   for(const key of ['position','normal']){gl.bindBuffer(gl.ARRAY_BUFFER,mesh[key]);gl.enableVertexAttribArray(this.a[key]);gl.vertexAttribPointer(this.a[key],3,gl.FLOAT,false,0,0);}
   gl.uniform3fv(u.center,center);gl.uniform3fv(u.extent,extent);gl.uniformMatrix3fv(u.rotation,false,rotation(angle,roll));gl.uniform3fv(u.color,color);gl.uniform1f(u.material,material);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indices);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  };
  for(const o of m.obstacles){const block=o.shape==='block';part(block?this.block:this.cylinder,[o.x,o.y,block?o.height/2:0],block?[o.r/Math.sqrt(2),o.r/Math.sqrt(2),o.height/2]:[o.r,o.r,o.height],0,[.42,.52,.43],1);}
  const angle=m.heading,headAngle=angle+m.head,moving=Math.min(1,m.speed/.045),bob=Math.sin(m.gait*2)*.018*moving+Math.sin(m.time*3.7)*.009;
  const local=(a,b,z,rotation=angle,origin=[m.x,m.y])=>[origin[0]+(a*Math.cos(rotation)-b*Math.sin(rotation))*size,origin[1]+(a*Math.sin(rotation)+b*Math.cos(rotation))*size,z*size];
  const bodyPart=(mesh,p,radii,rotation,color,mat=0,roll=0)=>part(mesh,p,radii.map(x=>x*size),rotation,color,mat,roll);
  const coat=[.80,.82,.78],skin=[.75,.57,.54];
  // Low ankles, long delicate hind feet and individual toes.
  for(const side of [-1,1])for(const front of [false,true]){
   const phase=m.gait+(front?0:Math.PI)+side*Math.PI/2,stride=Math.sin(phase)*.18*moving;
   let a=(front?.42:-.73)+stride,b=side*(front?.28:.37),z=.045+Math.max(0,Math.cos(phase))*.095*moving;
   if(front&&m.action==='groom'){a=.86;b=side*.13;z=.41+Math.sin(m.time*11)*.06;}
   bodyPart(this.sphere,local(a,b,z),[front?.17:.23,.080,.042],angle,skin,1);
   for(let toe=0;toe<4;toe++)bodyPart(this.sphere,local(a+.105+(toe===1||toe===2?.028:0),b+(toe-1.5)*.038,z-.005),[.087,.019,.017],angle,skin,1);
   if(!front)bodyPart(this.sphere,local(a-.04,b*.72,.25+bob),[.31,.25,.24],angle,coat);
  }
  bodyPart(this.body,local(-.27,0,.44+bob),[1.03,.48,.40],angle,coat);
  const neck=local(.38,0,0),head=(a,b,z)=>local(a,b,z,headAngle,neck);
  bodyPart(this.head,head(.24,0,.49+bob),[.62,.30,.28],headAngle,[.83,.84,.80]);
  for(const side of [-1,1]){
   // Thin pinnae tilt outwards; inset tissue follows exactly the same orientation.
   bodyPart(this.sphere,head(-.015,side*.255,.78+bob),[.23,.058,.255],headAngle,[.78,.77,.72],1,-side*.30);
   bodyPart(this.sphere,head(.005,side*.298,.795+bob),[.178,.022,.196],headAngle,[.79,.63,.60],1,-side*.30);
   bodyPart(this.sphere,head(.32,side*.240,.585+bob),[.059,.035,.061],headAngle,[.028,.037,.031],2);
  }
  bodyPart(this.sphere,head(.856,0,.45+bob),[.048,.058,.038],headAngle,[.70,.45,.44],1);
  // Tail segments overlap as tapered ellipsoids, eliminating angular joins.
  const tail=m.tail.map((p,i)=>[m.x+(p.x-m.x)*size/.055,m.y+(p.y-m.y)*size/.055,size*(.19*Math.exp(-i*.5)+.025)]);
  for(let i=1;i<tail.length;i++){
   const a=tail[i-1],b=tail[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),r=size*(.052*(1-i/11));
   part(this.sphere,a.map((v,k)=>(v+b[k])/2),[length*.66,r,r],Math.atan2(dy,dx),[.68,.54,.50],1);
  }
  ctx.drawImage(this.canvas,0,0,width,height);
  // Fine whiskers remain crisp at small sizes without thick geometric tubes.
  const project=p=>{const u=(p[0]-.5)*Math.cos(yaw)-(p[1]-.5)*Math.sin(yaw),v=(p[0]-.5)*Math.sin(yaw)+(p[1]-.5)*Math.cos(yaw);return [cx+u*unit,cy+(v*tilt-p[2]*lift)*unit];};
  ctx.save();ctx.strokeStyle='rgba(204,213,200,.52)';ctx.lineWidth=.55;
  for(const side of [-1,1])for(let i=0;i<4;i++){const a=project(head(.70,side*.07,.46+bob)),b=project(head(.92+(i-1.5)*.09,side*(.34+i*.045),.45+bob+Math.sin(m.time*7+i)*.007));ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-1.3,...b);ctx.stroke();}ctx.restore();
  return true;
 }
}
window.MouseRenderer=MouseRenderer;
})();
