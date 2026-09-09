'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createRoom104, createStudent, ROOM104, ROOM_ITEMS } from './room104-scene';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Building2, ChevronRight, Footprints, Layers3, LocateFixed, Map, Navigation, Route, Rotate3D } from 'lucide-react';

type P = [number, number];
type Room = { id:string; name:string; floor:number; box:[number,number,number,number]; door:P; kind:'lab'|'class'|'support' };
type Place = { id:string; label:string; floor:number; point:P; type:'entry'|'stair'|'lift'|'lobby' };
type RouteData = { mode:'WALK'|'CT1'|'CT2'|'LIFT'; floors:number[]; paths:Record<number,P[]>; steps:string[] };

const FLOOR_LABELS = ['GF','F1','F2','F3','F4','F5','F6','F7'];
const names: Record<string,string> = {
  E001:'Precision Mechanics & Equipment Lab', E002:'Hologram Printing Lab',
  E101:'Human-Centered AI Innovation Lab', E102:'Immersive Technology Exhibition & Post Production Room', E103:'Class room', E104:'Immersive Technology Convergence Center',
  E201:'Phòng học thông minh', E202:'Phòng nghiên cứu chuyên gia', E203:'Robotics & Automation Lab', E204:'Logistics Lab',
  E301:'Phòng nghiên cứu', E302:'Ocean Technology Lab', E303:'Marine Data Lab', E304:'IoT Systems Lab',
  'E402+E403':'AI & Big Data Convergence Lab', E404:'Cyber Security Lab', E401:'Innovation Studio',
  E501:'Phòng học', E502:'Phòng học', E503:'Phòng học', E504:'Phòng học',
  'E602+E603':'Immersive Media Lab', E604:'Material Technology Lab', E601:'Phòng nghiên cứu',
  E701:'Không gian đổi mới sáng tạo', E702:'Không gian hội thảo',
};

function floorRooms(floor:number):Room[] {
  if (floor===0) return [
    {id:'E002',name:names.E002,floor,box:[.35,2.62,3.1,6.95],door:[3.1,5.15],kind:'lab'},
    {id:'E001',name:names.E001,floor,box:[3.25,2.62,5.38,6.95],door:[5.38,5.15],kind:'lab'},
  ];
  const sets = [[],['E103','E102','E104','E101'],['E203','E202','E204','E201'],['E303','E302','E304','E301'],['E402+E403','E404','E401'],['E503','E502','E504','E501'],['E602+E603','E604','E601'],['E702','E701']] as string[][];
  const boxes = sets[floor].length===4
    ? [[.35,2.62,2.55,6.95],[2.72,2.62,5.38,6.95],[6.45,.25,9.85,2.18],[8.18,2.62,9.85,6.95]]
    : floor===7 ? [[.35,2.62,5.38,6.95],[8.18,2.62,9.85,6.95]]
    : [[.35,2.62,5.38,6.95],[6.45,.25,9.85,2.18],[8.18,2.62,9.85,6.95]];
  const doors4:P[]=[[1.3,2.62],[4.2,2.62],[6.45,1.42],[8.18,4.6]];
  const doors3:P[]=[[4.2,2.62],[6.45,1.42],[8.18,4.6]];
  const doors7:P[]=[[4.2,2.62],[8.18,4.6]];
  const doors=sets[floor].length===4?doors4:floor===7?doors7:doors3;
  return sets[floor].map((id,i)=>({id,name:names[id],floor,box:boxes[i] as Room['box'],door:doors[i],kind: floor===5||id.endsWith('03')?'class':'lab'}));
}
const ROOMS = FLOOR_LABELS.flatMap((_,i)=>floorRooms(i));
const PLACES:Place[] = [
  {id:'ENTRY',label:'Sảnh chính · Tầng trệt',floor:0,point:[9.9,4.9],type:'entry'},
];
const allDestinations = ROOMS.map(r=>({id:r.id,label:`${r.id} · ${r.name}`}));
const STARTS:Place[] = [...PLACES,...ROOMS.map(r=>({id:`ROOM-${r.id}`,label:`${r.id} · ${r.name}`,floor:r.floor,point:r.door,type:'lobby' as const}))];

const CORES={CT1:[6.55,3.6] as P,CT2:[1.5,1.4] as P,LIFT:[6.5,5.25] as P};
const TOP_Z=2.38, LEFT_X=5.72, RIGHT_X=7.82, CT1_FRONT_Z=4.55;
// Circulation follows the PDF: S4 stops at the west side of CT1. There is no
// corridor behind/above CT1; S4 connects to S5 by going around its south side.
const CORE_ACCESS={CT1:[6.55,CT1_FRONT_Z] as P,CT2:[1.5,TOP_Z] as P,LIFT:[LEFT_X,5.25] as P};
const baseNodes:P[]=[
  [.6,TOP_Z],[1.3,TOP_Z],[4.2,TOP_Z],[LEFT_X,TOP_Z],
  [LEFT_X,1.42],[LEFT_X,CT1_FRONT_Z],[6.55,CT1_FRONT_Z],[RIGHT_X,CT1_FRONT_Z],
  [RIGHT_X,4.6],[RIGHT_X,4.9],[LEFT_X,5.25],[RIGHT_X,5.25],[LEFT_X,6.15],[RIGHT_X,6.15],
];
const same=(a:number,b:number)=>Math.abs(a-b)<.03;
const inRange=(v:number,a:number,b:number)=>v>=Math.min(a,b)-.03&&v<=Math.max(a,b)+.03;
const connected=(a:P,b:P)=>{
  if(same(a[1],TOP_Z)&&same(b[1],TOP_Z)&&inRange(a[0],.6,LEFT_X)&&inRange(b[0],.6,LEFT_X))return true;
  if(same(a[0],LEFT_X)&&same(b[0],LEFT_X)&&inRange(a[1],1.42,6.15)&&inRange(b[1],1.42,6.15))return true;
  if(same(a[1],CT1_FRONT_Z)&&same(b[1],CT1_FRONT_Z)&&inRange(a[0],LEFT_X,RIGHT_X)&&inRange(b[0],LEFT_X,RIGHT_X))return true;
  return same(a[0],RIGHT_X)&&same(b[0],RIGHT_X)&&inRange(a[1],CT1_FRONT_Z,6.15)&&inRange(b[1],CT1_FRONT_Z,6.15);
};
const approach=(p:P):P=>{
  if(same(p[0],6.45)&&p[1]<2.2)return [LEFT_X,p[1]]; // E104/E204/... open to S4 on their west side
  if(p[1]<=2.65&&p[0]<LEFT_X)return [p[0],TOP_Z];
  if(p[0]>=8)return [RIGHT_X,p[1]];
  return [LEFT_X,p[1]];
};
const dist=(a:P,b:P)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function corridorPath(from:P,to:P):P[]{
  const a=approach(from),b=approach(to),nodes=[...baseNodes,a,b];const n=nodes.length;const d=Array(n).fill(Infinity),prev=Array(n).fill(-1),seen=Array(n).fill(false);d[n-2]=0;
  for(let k=0;k<n;k++){let u=-1;for(let i=0;i<n;i++)if(!seen[i]&&(u<0||d[i]<d[u]))u=i;if(u<0||!isFinite(d[u]))break;seen[u]=true;for(let v=0;v<n;v++){if(u===v||!connected(nodes[u],nodes[v]))continue;const nd=d[u]+dist(nodes[u],nodes[v]);if(nd<d[v]){d[v]=nd;prev[v]=u}}}
  const idx:number[]=[];for(let at=n-1;at>=0;at=prev[at]){idx.push(at);if(at===n-2)break;if(prev[at]<0)break}idx.reverse();const path=[from,a,...idx.slice(1,-1).map(i=>nodes[i]),b,to];return path.filter((p,i)=>i===0||dist(p,path[i-1])>.02);
}
const pathLength=(p:P[])=>p.slice(1).reduce((s,v,i)=>s+dist(p[i],v),0);
const toCore=(from:P,mode:'CT1'|'CT2'|'LIFT')=>[...corridorPath(from,CORE_ACCESS[mode]),CORES[mode]].filter((p,i,a)=>i===0||dist(p,a[i-1])>.02);
const fromCore=(mode:'CT1'|'CT2'|'LIFT',to:P)=>[CORES[mode],...corridorPath(CORE_ACCESS[mode],to)].filter((p,i,a)=>i===0||dist(p,a[i-1])>.02);
function routeFor(start:Place,dest:Room):RouteData {
  if(start.floor===dest.floor) return {mode:'WALK',floors:[dest.floor],paths:{[dest.floor]:corridorPath(start.point,dest.door)},steps:[`Rời ${start.label}`,`Đi theo hành lang ${FLOOR_LABELS[dest.floor]} và theo hướng mũi tên`, `Dừng ngay trước cửa ${dest.id}`]};
  const liftStops=[0,4,5,6],choices:{mode:'CT1'|'CT2'|'LIFT';point:P;score:number}[]=[{mode:'CT1',point:CORES.CT1,score:0}];
  if(start.floor<7&&dest.floor<7)choices.push({mode:'CT2',point:CORES.CT2,score:0});
  if(liftStops.includes(start.floor)&&liftStops.includes(dest.floor))choices.push({mode:'LIFT',point:CORES.LIFT,score:0});
  choices.forEach(c=>c.score=pathLength(toCore(start.point,c.mode))+pathLength(fromCore(c.mode,dest.door))+Math.abs(dest.floor-start.floor)*(c.mode==='LIFT'?.7:1.25));
  const best=choices.sort((a,b)=>a.score-b.score)[0],mode=best.mode;
  return {mode,floors:[start.floor,dest.floor],paths:{[start.floor]:toCore(start.point,mode),[dest.floor]:fromCore(mode,dest.door)},steps:[`Từ ${start.label}, theo mũi tên trên hành lang đến ${mode==='LIFT'?'thang máy':`cầu thang ${mode}`}`,mode==='LIFT'?`Đi thang máy đến ${FLOOR_LABELS[dest.floor]}`:`Theo hai vế thang và chiếu nghỉ đến ${FLOOR_LABELS[dest.floor]}`,`Ra sảnh tầng ${FLOOR_LABELS[dest.floor]} và tiếp tục theo mũi tên`, `Dừng ngay trước cửa ${dest.id}`]};
}

function labelSprite(text:string, style:'room'|'selected'|'amenity'|'floor'|'pin'='room'){
  const selected=style==='selected';
  const c=document.createElement('canvas');c.width=selected?560:440;c.height=selected?170:128;const x=c.getContext('2d')!;
  const w=c.width,h=c.height;
  x.shadowColor=selected?'rgba(243,107,33,.5)':'rgba(0,0,0,.38)';x.shadowBlur=18;x.shadowOffsetY=7;
  x.fillStyle=selected?'#f36b21':style==='floor'?'#f36b21':'rgba(17,24,28,.96)';x.beginPath();x.roundRect(12,10,w-24,h-24,selected?22:17);x.fill();
  x.shadowColor='transparent';x.strokeStyle=selected?'#ffd1b5':style==='amenity'?'#738086':'#52758a';x.lineWidth=3;x.stroke();
  if(style==='room'){x.fillStyle='#69aee7';x.beginPath();x.roundRect(12,10,13,h-24,[17,0,0,17]);x.fill()}
  if(selected){x.fillStyle='rgba(255,255,255,.78)';x.font='700 19px Arial';x.textAlign='left';x.textBaseline='middle';x.fillText('PHÒNG ĐÃ CHỌN',42,48);x.font='700 54px Arial';x.fillStyle='#fff';x.fillText(text,42,108)}
  else{x.fillStyle='#fff';x.font=style==='floor'?'700 42px Arial':style==='amenity'?'600 29px Arial':'650 36px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearMipmapLinearFilter;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false}));
  s.scale.set(selected?2.7:style==='floor'?1.55:style==='amenity'?1.25:style==='pin'?2.2:1.4,selected?.82:style==='pin'?.62:.41,1);s.renderOrder=20;return s;
}

function restroomSprite(female:boolean){
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=112;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#f4f8fa';ctx.strokeStyle='#52758a';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(5,5,86,94,14);ctx.fill();ctx.stroke();
  ctx.fillStyle='#275571';ctx.beginPath();ctx.arc(48,26,9,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=7;ctx.lineCap='round';ctx.strokeStyle='#275571';ctx.beginPath();ctx.moveTo(37,43);ctx.lineTo(30,63);ctx.moveTo(59,43);ctx.lineTo(66,63);ctx.moveTo(41,65);ctx.lineTo(41,84);ctx.moveTo(55,65);ctx.lineTo(55,84);ctx.stroke();
  ctx.beginPath();if(female){ctx.moveTo(40,40);ctx.lineTo(56,40);ctx.lineTo(64,70);ctx.lineTo(32,70);ctx.closePath()}else{ctx.roundRect(37,39,22,31,5)}ctx.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,transparent:true}));sprite.scale.set(.42,.49,1);sprite.renderOrder=19;return sprite;
}

function buildScene(host:HTMLDivElement, opts:{exploded:boolean;floor:number|null;showAll:boolean;dest:string;start:Place;route:RouteData}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#101416');scene.fog=new THREE.Fog('#101416',18,37);
  const shownFloors=opts.floor!==null?[opts.floor]:opts.showAll?FLOOR_LABELS.map((_,i)=>i):[...new Set(opts.route.floors)].sort((a,b)=>a-b);const spacing=opts.exploded?1.42:.48;const floorY=(f:number)=>opts.floor!==null?0:Math.max(0,shownFloors.indexOf(f))*spacing;
  const camera=new THREE.PerspectiveCamera(38,1,.1,100); camera.position.set(opts.showAll?15:13,opts.showAll?11:7.5,opts.showAll?21:16);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xdde8ea,0x1a1410,2.1)); const sun=new THREE.DirectionalLight(0xffe5d2,3.4);sun.position.set(8,15,10);sun.castShadow=true;scene.add(sun);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.rotateSpeed=.34;controls.zoomSpeed=.48;controls.enablePan=true;controls.panSpeed=.65;controls.screenSpacePanning=true;controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};controls.target.set(.5,opts.floor===null?(shownFloors.length-1)*spacing/2:.3,3.6);controls.minDistance=7;controls.maxDistance=27;
  const root=new THREE.Group();root.position.x=-4.6;scene.add(root);
  const mat=(color:number,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.04,transparent:opacity<.999,opacity,depthWrite:opacity>.8});
  const addBox=(parent:THREE.Object3D,size:[number,number,number],pos:[number,number,number],material:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  FLOOR_LABELS.forEach((fl,f)=>{
    if(!shownFloors.includes(f))return; const y=floorY(f);
    const g=new THREE.Group();g.position.y=y;root.add(g);
    const involved=opts.route.floors.includes(f),stackIndex=shownFloors.indexOf(f),isUpper=stackIndex>0;
    const layerOpacity=opts.floor!==null?.98:opts.showAll?(involved?(isUpper?.58:.88):Math.max(.18,.34-stackIndex*.025)):(isUpper?.56:.94);
    addBox(g,[10.35,.055,7.4],[5.1,0,3.6],mat(involved?0xe5e4df:0x757b7d,Math.min(layerOpacity+.04,.96)));
    ROOMS.filter(r=>r.floor===f).forEach(r=>{const [x1,z1,x2,z2]=r.box;const selected=r.id===opts.dest;const roomOpacity=selected?.98:layerOpacity;const m=addBox(g,[x2-x1-.08,.16,z2-z1-.08],[(x1+x2)/2,.12,(z1+z2)/2],mat(selected?0xf36b21:(r.kind==='class'?0x69aee7:0x5e9ed1),roomOpacity));m.userData.room=r.id;
      addBox(g,[.32,.018,.07],[r.door[0],.225,r.door[1]],mat(0xffd2ad));
      if(selected){const l=labelSprite(r.id,'selected');l.position.set((x1+x2)/2,.82,(z1+z2)/2);g.add(l)}
    });
    const stepMat=mat(0xd27b47,Math.max(.42,layerOpacity));
    const ct1=new THREE.Group();for(let i=0;i<7;i++){addBox(ct1,[.42,.025,.14],[-.27,.04+i*.025,-.46+i*.14],stepMat);addBox(ct1,[.42,.025,.14],[.27,.2-i*.025,.46-i*.14],stepMat)}ct1.position.set(CORES.CT1[0],.08,CORES.CT1[1]);g.add(ct1);
    if(f<7){const ct2=new THREE.Group();for(let i=0;i<7;i++){addBox(ct2,[.14,.025,.42],[-.46+i*.14,.04+i*.025,-.25],stepMat);addBox(ct2,[.14,.025,.42],[.46-i*.14,.2-i*.025,.25],stepMat)}ct2.position.set(CORES.CT2[0],.08,CORES.CT2[1]);g.add(ct2)}
    const amenity=(text:string,p:P,color:number)=>{addBox(g,[.72,.12,.62],[p[0],.1,p[1]],mat(color,Math.max(.38,layerOpacity)));if(text.startsWith('WC')&&(involved||opts.floor!==null)){const s=restroomSprite(text==='WC NỮ');s.position.set(p[0],.48,p[1]);g.add(s)}};
    amenity('CT1',CORES.CT1,0xb96335);if(f<7){amenity('CT2',CORES.CT2,0xb96335);amenity([0,4,5,6].includes(f)?'LIFT':'LIFT · NO STOP',CORES.LIFT,[0,4,5,6].includes(f)?0x2d8e70:0x704048)}amenity('WC NAM',[6.15,6.25],0x687176);amenity('WC NỮ',[7.15,6.25],0x687176);
  });
  const movingArrows:{mesh:THREE.Mesh;a:THREE.Vector3;b:THREE.Vector3;phase:number}[]=[];const visibleFloors=opts.floor===null?opts.route.floors:[opts.floor];
  for(const f of visibleFloors){const pts=opts.route.paths[f];if(!pts)continue;const y=floorY(f)+.34;const lineMat=new THREE.MeshBasicMaterial({color:0xff6418});for(let i=1;i<pts.length;i++){const a=new THREE.Vector3(pts[i-1][0],y,pts[i-1][1]),b=new THREE.Vector3(pts[i][0],y,pts[i][1]);if(a.distanceTo(b)<.03)continue;const curve=new THREE.LineCurve3(a,b);root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,8,.045,7,false),lineMat));const dir=b.clone().sub(a).normalize();for(let q=0;q<2;q++){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.105,.25,9),new THREE.MeshBasicMaterial({color:0xfff0e6}));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);root.add(arrow);movingArrows.push({mesh:arrow,a,b,phase:q*.5+i*.13})}}}
  if(opts.floor===null&&opts.route.floors.length===2){const core=CORES[opts.route.mode as keyof typeof CORES];const [a,b]=opts.route.floors;const ya=floorY(a)+.34,yb=floorY(b)+.34;const geo=new THREE.CylinderGeometry(.045,.045,Math.abs(yb-ya),10);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xff6418}));m.position.set(core[0],(ya+yb)/2,core[1]);root.add(m);const from=new THREE.Vector3(core[0],ya,core[1]),to=new THREE.Vector3(core[0],yb,core[1]);const dir=to.clone().sub(from).normalize();for(let q=0;q<Math.max(3,Math.ceil(Math.abs(yb-ya)/.7));q++){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.105,.25,9),new THREE.MeshBasicMaterial({color:0xfff0e6}));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);root.add(arrow);movingArrows.push({mesh:arrow,a:from,b:to,phase:q/Math.max(3,Math.ceil(Math.abs(yb-ya)/.7))})}}
  const addPin=(point:P,floor:number,text:string,color:number)=>{if(!shownFloors.includes(floor))return;const y=floorY(floor);const pin=new THREE.Group();const ball=new THREE.Mesh(new THREE.SphereGeometry(.13,14,10),new THREE.MeshBasicMaterial({color}));ball.position.y=.57;pin.add(ball);const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.035,8,20),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.34;pin.add(ring);pin.position.set(point[0],y,point[1]);root.add(pin);if(color===0xf04438){const label=labelSprite(text,'pin');label.position.set(point[0],y+.95,point[1]);root.add(label)}};
  addPin(opts.start.point,opts.start.floor,'BẠN ĐANG Ở ĐÂY',0xf04438);const destination=ROOMS.find(r=>r.id===opts.dest)!;addPin(destination.door,destination.floor,`ĐẾN · ${opts.dest}`,0xf36b21);
  const grid=new THREE.GridHelper(36,36,0x374046,0x252b2f);grid.position.y=-.2;scene.add(grid);
  renderer.domElement.style.display='block';renderer.domElement.style.maxWidth='100%';
  let id=0;const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,true);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(host);
  const started=performance.now();const animate=()=>{id=requestAnimationFrame(animate);const t=(performance.now()-started)/1000;movingArrows.forEach(a=>a.mesh.position.copy(a.a).lerp(a.b,(t*.42+a.phase)%1));controls.update();renderer.render(scene,camera)};animate();
  let pointerStart:P=[0,0];const down=(e:PointerEvent)=>{pointerStart=[e.clientX,e.clientY]};const click=(e:PointerEvent)=>{if(e.button!==0||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(root.children,true).find(x=>x.object.userData.room);if(hit)window.dispatchEvent(new CustomEvent('campus-room',{detail:hit.object.userData.room}))};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',click);
  return ()=>{cancelAnimationFrame(id);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',click);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();const material=(o as THREE.Mesh).material;if(material){(Array.isArray(material)?material:[material]).forEach(x=>x.dispose())}});renderer.dispose();renderer.domElement.remove()};
}

function MiniPlan({floor,dest,route}:{floor:number;dest:string;route:RouteData}){
  return <svg viewBox="0 0 840 620" className="mini-plan" aria-label={`Mặt bằng ${FLOOR_LABELS[floor]}`}>
    <defs><marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="15" markerHeight="15" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L9 5L1 9Z" fill="#fff4eb"/></marker></defs>
    <rect x="18" y="18" width="804" height="584" rx="12" className="plan-shell"/><path d="M70 203H460M460 131V535M460 366H620M620 366V535M460 419H487" className="plan-corridor"/>
    {ROOMS.filter(r=>r.floor===floor).map(r=>{const [x1,z1,x2,z2]=r.box;return <g key={r.id}><rect x={25+x1*76} y={25+z1*75} width={(x2-x1)*76} height={(z2-z1)*75} rx="5" className={r.id===dest?'plan-room selected':'plan-room'}/><text x={25+(x1+x2)*38} y={25+(z1+z2)*37.5}>{r.id}</text><circle cx={25+r.door[0]*76} cy={25+r.door[1]*75} r="6" className="door"/></g>})}
    <rect x={25+5.95*76} y={25+3.12*75} width={1.2*76} height={.95*75} className="core"/><text x={25+6.55*76} y={25+3.65*75}>CT1</text>{floor<7&&<><rect x={25+.78*76} y={25+.98*75} width={1.45*76} height={.84*75} className="core"/><text x={25+1.5*76} y={25+1.46*75}>CT2 ↔</text></>}{floor<7&&<><rect x={25+6.08*76} y={25+4.88*75} width={.84*76} height={.75*75} className="lift"/><text x={25+6.5*76} y={25+5.3*75}>LIFT</text></>}<text x={25+6.15*76} y={25+6.35*75} className="facility-label">WC NAM</text><text x={25+7.35*76} y={25+6.35*75} className="facility-label">WC NỮ</text>
    {route.paths[floor]&&<polyline points={route.paths[floor].map(([x,z])=>`${25+x*76},${25+z*75}`).join(' ')} className="plan-route" markerMid="url(#route-arrow)" markerEnd="url(#route-arrow)"/>}
  </svg>
}

// E104: traced from PDF page 3; calibration 658.08 pt = 21.10 m.
// Inner wall faces: (602.88,122.12) to (876,280.76). Elevations remain assumptions.
const E104_PLAN={width:273.12/(658.08/21.1),depth:158.64/(658.08/21.1),area:45,height:3,
  doors:[{side:'left',from:(160.76-122.12)/(658.08/21.1),to:(192.68-122.12)/(658.08/21.1)},{side:'right',from:(127.04-122.12)/(658.08/21.1),to:(162.2-122.12)/(658.08/21.1)}],
  windows:[{from:(170.96-122.12)/(658.08/21.1),to:(221.48-122.12)/(658.08/21.1)},{from:(224.6-122.12)/(658.08/21.1),to:(271.4-122.12)/(658.08/21.1)}]};
type Obstacle={x:number;z:number;w:number;d:number};
const ROOM_STATIONS=[{x:-1.8,z:-.35},{x:1.5,z:-.35},{x:-1.8,z:1.35},{x:1.5,z:1.35}];
function roomFree(x:number,z:number,obstacles:Obstacle[]){
  const radius=.24;
  return Math.abs(x)<E104_PLAN.width/2-radius&&Math.abs(z)<E104_PLAN.depth/2-radius&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
}
function roomWalkPath(from:P,to:P,obstacles:Obstacle[]):P[]{
  const step=.18,w=E104_PLAN.width,d=E104_PLAN.depth,nx=Math.ceil(w/step),nz=Math.ceil(d/step);
  const point=(id:number):P=>[-w/2+(id%nx+.5)*step,-d/2+(Math.floor(id/nx)+.5)*step];
  const cell=(p:P)=>Math.max(0,Math.min(nz-1,Math.floor((p[1]+d/2)/step)))*nx+Math.max(0,Math.min(nx-1,Math.floor((p[0]+w/2)/step)));
  if(!roomFree(...to,obstacles))return [];
  const begin=cell(from),end=cell(to),open=new Set([begin]),scores=new globalThis.Map([[begin,0]]),parents=new globalThis.Map<number,number>();
  while(open.size){let cur=-1,best=Infinity;for(const id of open){const p=point(id),v=(scores.get(id)??Infinity)+dist(p,point(end));if(v<best){best=v;cur=id}}
    if(cur===end){const path:P[]=[to];let at=end;while(at!==begin){path.push(point(at));at=parents.get(at)!}return path.reverse()}
    open.delete(cur);const x=cur%nx,z=Math.floor(cur/nx);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){if(x+dx<0||x+dx>=nx||z+dz<0||z+dz>=nz)continue;const next=(z+dz)*nx+x+dx,p=point(next);if(!roomFree(...p,obstacles))continue;const score=(scores.get(cur)??Infinity)+step;if(score<(scores.get(next)??Infinity)){scores.set(next,score);parents.set(next,cur);open.add(next)}}}
  return [];
}

function RoomPreview({room}:{room:Room}){
  const host=useRef<HTMLDivElement>(null),input=useRef(new Set<string>());
  const sceneApi=useRef<{highlight:(i:number)=>void;activate:(i:number)=>void;jump:()=>void}|null>(null);
  const [view,setView]=useState<'perspective'|'top'|'play'>('perspective');
  const [openings,setOpenings]=useState<'render'|'pdf'>('render');
  const [furnished,setFurnished]=useState(true),[selected,setSelected]=useState<number|null>(null);
  const [notice,setNotice]=useState('Bấm đồ vật để tìm hiểu'),[reset,setReset]=useState(0);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{sceneApi.current?.highlight(selected??-1)},[selected]);
  useEffect(()=>{
    input.current.clear();setSelected(null);
    if(room.id!=='E104'||!host.current)return;
    const el=host.current;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#dce3e4');
    const camera=new THREE.PerspectiveCamera(42,1,.1,80);
    camera.position.set(view==='top'?0:-5.8,view==='top'?10:6.9,view==='top'?.01:7.8);
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff,0x8c9598,2));
    const sun=new THREE.DirectionalLight(0xfff2df,2.6);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:22});sun.shadow.bias=-.002;scene.add(sun);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.6,0);
    controls.minDistance=2;controls.maxDistance=22;controls.maxPolarAngle=Math.PI*.48;controls.enableDamping=false;
    controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
    controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};controls.update();
    const built=createRoom104(scene,furnished,openings),avatar=createStudent(scene),person=avatar.root;
    person.position.copy(built.start);person.rotation.y=Math.PI/2;
    let dirty=true,animateUntil=0;
    const invalidate=()=>{dirty=true};controls.addEventListener('change',invalidate);
    sceneApi.current={highlight:i=>{built.highlight(i);dirty=true},activate:i=>{built.activate(i);animateUntil=performance.now()+5000;dirty=true},jump:()=>{avatar.jump();animateUntil=performance.now()+1000;dirty=true}};
    let path:P[]=[],frameId=0,last=0,visible=true,walkTime=0;
    const target=new THREE.Vector3();
    if(view==='play'){camera.position.copy(built.start).add(new THREE.Vector3(-3.6,4.5,5.6));controls.target.copy(built.start).add(new THREE.Vector3(0,.8,0));controls.update()}
    const keys=input.current;
    const interact=()=>{let closest=-1,best=2.2;ROOM_ITEMS.forEach((p,i)=>{const distance=Math.hypot(person.position.x-p.x,person.position.z-p.z);if(distance<best){best=distance;closest=i}});if(closest>=0&&furnished)setSelected(closest);else setNotice('Đến gần đồ vật rồi nhấn E để xem thông tin')};
    const down=(e:KeyboardEvent)=>{
      if(view!=='play')return;
      if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());path=[]}
      if(e.code==='Space'){e.preventDefault();if(!e.repeat)avatar.jump()}
      if(e.key==='Escape'){keys.clear();path=[]}
      if(e.key.toLowerCase()==='e')interact();
    };
    const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase()),blur=()=>{keys.clear();path=[]};
    el.addEventListener('keydown',down);el.addEventListener('keyup',up);window.addEventListener('blur',blur);
    let pointer:[number,number]=[0,0],dragged=false;
    const remember=(e:PointerEvent)=>{pointer=[e.clientX,e.clientY];dragged=false;el.focus({preventScroll:true})};
    const track=(e:PointerEvent)=>{if(e.buttons&&Math.hypot(e.clientX-pointer[0],e.clientY-pointer[1])>6)dragged=true};
    const pick=(e:PointerEvent)=>{
      if(e.button!==0||dragged)return;
      const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
      const hit=ray.intersectObjects(built.interactables,true)[0];
      if(hit){let object:THREE.Object3D|null=hit.object;while(object&&object.userData.station===undefined)object=object.parent;if(object){setSelected(object.userData.station);return}}
      if(view==='play'){const ground=ray.intersectObject(built.floor)[0];if(ground){path=roomWalkPath([person.position.x,person.position.z],[ground.point.x,ground.point.z],built.obstacles);setNotice(path.length?'Đang đi đến vị trí đã chọn':'Chọn khoảng sàn trống để di chuyển')}}
      else setSelected(null);
    };
    renderer.domElement.addEventListener('pointerdown',remember);renderer.domElement.addEventListener('pointermove',track);renderer.domElement.addEventListener('pointerup',pick);
    const resize=new ResizeObserver(()=>{const r=el.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dirty=true});resize.observe(el);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)blur()});observer.observe(el);
    const tick=(time:number)=>{
      frameId=requestAnimationFrame(tick);const dt=Math.min((time-last)/1000,.04);last=time;if(!visible||document.hidden)return;
      if(view!=='play'&&!dirty&&time>animateUntil)return;
      let mx=0,mz=0,moving=false;
      if(view==='play'){
        const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
        const right=new THREE.Vector3(-forward.z,0,forward.x);
        const f=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),r=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
        if(f||r){path=[];mx=forward.x*f+right.x*r;mz=forward.z*f+right.z*r}
        else if(path.length){const next=path[0];mx=next[0]-person.position.x;mz=next[1]-person.position.z;if(Math.hypot(mx,mz)<.07){path.shift();mx=0;mz=0;if(!path.length)setNotice('Đã đến · nhấn E hoặc chọn đồ vật để khám phá')}}
        const length=Math.hypot(mx,mz),before=person.position.clone();
        if(length>.001){
          const step=Math.min(dt*1.6,length);mx=mx/length*step;mz=mz/length*step;
          if(roomFree(person.position.x+mx,person.position.z,built.obstacles))person.position.x+=mx;
          if(roomFree(person.position.x,person.position.z+mz,built.obstacles))person.position.z+=mz;
          person.rotation.y=Math.atan2(mx,mz);
        }
        moving=before.distanceTo(person.position)>.001;walkTime+=moving?dt*8:0;
        target.copy(person.position).add(new THREE.Vector3(0,.8,0));
        const delta=target.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(target);controls.update();
      }
      avatar.update(dt,moving,walkTime);built.update(time,dt,camera,view==='top');renderer.render(scene,camera);dirty=false;
    };
    frameId=requestAnimationFrame(tick);
    setNotice(view==='play'?'Bấm vào phòng · WASD / mũi tên để đi · Space để nhảy · E để tìm hiểu':'Kéo để xoay · chuột phải để dịch chuyển · cuộn để thu phóng');
    return()=>{
      cancelAnimationFrame(frameId);keys.clear();sceneApi.current=null;observer.disconnect();resize.disconnect();
      el.removeEventListener('keydown',down);el.removeEventListener('keyup',up);window.removeEventListener('blur',blur);
      renderer.domElement.removeEventListener('pointerdown',remember);renderer.domElement.removeEventListener('pointermove',track);renderer.domElement.removeEventListener('pointerup',pick);
      controls.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
      scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);const map=(m as THREE.MeshStandardMaterial).map;if(map)textures.add(map)})}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());avatar.dispose();renderer.dispose();renderer.domElement.remove();
    };
  },[room.id,view,furnished,openings,reset]);
  if(room.id!=='E104')return <div className="room-pending"><small>MÔ HÌNH THEO BẢN VẼ</small><h3>{room.id}</h3><p>Phòng này chưa có mô hình chi tiết được đối chiếu đầy đủ cửa và cửa sổ. Bản tham quan hiện có tại E104.</p><button onClick={()=>window.dispatchEvent(new CustomEvent('campus-room',{detail:'E104'}))}>Mở phòng E104 →</button></div>;
  return <div className={'room-preview'+(expanded?' room-expanded':'')}>
    <div className="room-preview-tools"><span>E104 · KHÁM PHÁ KHÔNG GIAN</span><div>{(['perspective','top','play'] as const).map(v=><button key={v} className={view===v?'active':''} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='perspective'?'Góc 3D':v==='top'?'Mặt bằng':'Tham quan'}</button>)}<button aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Thu gọn':'Mở rộng'}</button></div></div>
    <div className="room-options"><button onClick={()=>setFurnished(v=>!v)}>{furnished?'Ẩn nội thất':'Hiện nội thất'}</button><button onClick={()=>setReset(v=>v+1)}>Về cửa vào</button><label>Cửa theo <select aria-label="Nguồn bố trí cửa" value={openings} onChange={e=>setOpenings(e.target.value as 'render'|'pdf')}><option value="render">Ảnh render</option><option value="pdf">PDF mặt bằng</option></select></label><span>≈ {ROOM104.width.toFixed(2)} × {ROOM104.depth.toFixed(2)} m</span></div>
    <div ref={host} tabIndex={0} role="application" className="room-canvas" aria-label="Khám phá E104: WASD để đi, Space nhảy, E tìm hiểu đồ vật"/>
    {view==='play'&&<div className="walk-controls" aria-label="Điều khiển nhân vật">{[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label,key])=><button key={key} aria-label={'Đi '+label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);input.current.add(key)}} onPointerUp={()=>input.current.delete(key)} onPointerCancel={()=>input.current.delete(key)}>{label}</button>)}<button className="jump-button" onClick={()=>sceneApi.current?.jump()}>Nhảy</button></div>}
    {selected!==null&&furnished&&<div className="station-detail" role="status"><button aria-label="Đóng thông tin đồ vật" onClick={()=>setSelected(null)}>×</button><small>{ROOM_ITEMS[selected].name}</small><h3>{ROOM_ITEMS[selected].title}</h3><p>{ROOM_ITEMS[selected].description}</p>{[1,3,4,6].includes(selected)&&<button className="object-action" onClick={()=>{sceneApi.current?.activate(selected);setNotice(selected===4?'Máy đang pha cà phê minh họa':selected===3?'Đã đổi trạng thái cánh tủ':'Đã đổi trạng thái màn hình')}}>{ROOM_ITEMS[selected].action}</button>}</div>}
    <div className="room-item-list" aria-label="Đồ vật trong phòng">{ROOM_ITEMS.map((item,i)=><button disabled={!furnished} key={item.name} aria-pressed={selected===i} className={selected===i?'active':''} onClick={()=>setSelected(i)}>{item.name}</button>)}</div>
    <div className="room-preview-caption">{notice}<span>Sinh viên UEH · 1,80 m</span></div>
    <p className="room-source-note">{openings==='render'?'Cửa và cửa sổ theo ảnh thiết kế; vị trí và kích thước ô mở ước lượng.':'Cửa và cửa sổ theo tỷ lệ mặt bằng PDF.'} Nội thất dựng từ 10 góc render. Chiều cao phòng 3 m là giả định.</p>
  </div>
}
function RoomProfile({room}:{room:Room}){
  const descriptions:Record<string,string>={
    E001:'Không gian thực hành cơ khí chính xác và thiết bị, phục vụ nghiên cứu và thử nghiệm kỹ thuật.',E002:'Không gian nghiên cứu, thử nghiệm và trình diễn công nghệ in hologram.',
    E101:'Không gian nghiên cứu và thử nghiệm ứng dụng trí tuệ nhân tạo lấy con người làm trung tâm.',E102:'Không gian trưng bày công nghệ nhập vai và thực hiện các công đoạn hậu kỳ nội dung.',E104:'Không gian kết nối, thử nghiệm và trình diễn các công nghệ nhập vai.',
    E201:'Không gian học tập có định hướng ứng dụng công nghệ và hỗ trợ tương tác trong giảng dạy.',E202:'Không gian làm việc và trao đổi chuyên môn dành cho hoạt động nghiên cứu.',E203:'Không gian thực hành, nghiên cứu robot và các giải pháp tự động hóa.',E204:'Không gian nghiên cứu và thử nghiệm các bài toán logistics.',
    E302:'Không gian nghiên cứu và ứng dụng công nghệ trong lĩnh vực biển.',E303:'Không gian nghiên cứu, xử lý và khai thác dữ liệu biển.',E304:'Không gian nghiên cứu và thử nghiệm các hệ thống Internet of Things.',
    'E402+E403':'Không gian kết nối nghiên cứu trí tuệ nhân tạo và khai thác dữ liệu lớn.',E404:'Không gian nghiên cứu và thực hành về an toàn thông tin.',E401:'Không gian làm việc sáng tạo, phát triển và thử nghiệm ý tưởng.',
    'E602+E603':'Không gian nghiên cứu và sáng tạo nội dung truyền thông nhập vai.',E604:'Không gian nghiên cứu và thử nghiệm công nghệ vật liệu.',
    E701:'Không gian trao đổi ý tưởng và phát triển các hoạt động đổi mới sáng tạo.',E702:'Không gian tổ chức hội thảo, trao đổi học thuật và chia sẻ kết quả nghiên cứu.'
  };
  return <section className="room-profile" aria-label="Hồ sơ phòng đã chọn"><div className="room-profile-copy"><small>02 / HỒ SƠ PHÒNG</small><div className="profile-id">{room.id}<span>{FLOOR_LABELS[room.floor]}</span></div><h2>{room.name}</h2><p>{descriptions[room.id]||(room.kind==='class'?'Không gian phục vụ hoạt động học tập và trao đổi kiến thức.':'Không gian phục vụ hoạt động nghiên cứu và trao đổi chuyên môn.')}</p><dl><div><dt>Tiếp cận</dt><dd>{room.floor===7?'Tầng 7 chỉ có cầu thang bộ CT1':`Theo tuyến đường đến cửa phòng tại ${FLOOR_LABELS[room.floor]}`}</dd></div><div><dt>Nội thất & thiết bị</dt><dd>{room.id==='E104'?'Bàn học đôi · màn hình di động · 3 máy tính · kệ trưng bày · tủ hồ sơ · quầy cà phê':'Chưa có bố trí đối chiếu'}</dd></div></dl><p className="profile-note">{room.id==='E104'?'PDF ghi 45 m². Đo theo tỷ lệ bản vẽ: lọt lòng khoảng 8,76 × 5,09 m (44,5 m²). Nội thất tái dựng từ 10 ảnh render bạn cung cấp; kích thước đồ vật là ước lượng. Ảnh render và PDF có khác biệt ô cửa: chọn nguồn bố trí cửa để đối chiếu.':'Mô tả gợi ý theo tên phòng. Chưa hiển thị khối 3D ước lệ để tránh nhầm với kích thước và các cửa thực tế.'}</p></div><RoomPreview room={room}/></section>
}

export default function CampusEMap(){
  const host=useRef<HTMLDivElement>(null);const [startId,setStartId]=useState('ENTRY');const [destId,setDestId]=useState('E104');const [exploded,setExploded]=useState(true);const [oneFloor,setOneFloor]=useState<number|null>(null);const [showAll,setShowAll]=useState(true);
  const start=STARTS.find(p=>p.id===startId)!;const dest=ROOMS.find(r=>r.id===destId)!;const route=useMemo(()=>routeFor(start,dest),[start,dest]);
  useEffect(()=>{const f=(e:Event)=>{const id=(e as CustomEvent<string>).detail;setDestId(id);setOneFloor(ROOMS.find(r=>r.id===id)?.floor??null)};window.addEventListener('campus-room',f);return()=>window.removeEventListener('campus-room',f)},[]);
  useEffect(()=>{if(!host.current)return;return buildScene(host.current,{exploded,floor:oneFloor,showAll,dest:destId,start,route})},[exploded,oneFloor,showAll,destId,start,route]);
  return <main className="app-shell">
    <header className="topbar"><img src={`${import.meta.env.BASE_URL}tch-logo-lockup.png`} alt="Technology Convergence Hub" width={152} height={48}/><div><span>WAYFINDING PROTOTYPE</span><b>CAMPUS E · UEH</b></div><div className="status"><i/> LIVE PROTOTYPE</div></header>
    <section className="intro"><div><small>01 / DIGITAL CAMPUS</small><h1><span>Đi đúng cửa.</span><em>Đúng tầng.</em></h1></div><p>Mô hình thử nghiệm được dựng lại từ mặt bằng Cơ sở E: phòng có màu, cửa vào, hai lõi thang CT1–CT2 và thang máy theo đúng <span className="keep-together">tầng dừng.</span></p></section>
    <section className="workspace">
      <aside className="panel controls-panel"><div className="panel-title"><LocateFixed/> CHỌN HÀNH TRÌNH</div><label>Vị trí hiện tại<select value={startId} onChange={e=>{setStartId(e.target.value);setOneFloor(null);setShowAll(false)}}><optgroup label="Lối vào">{PLACES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</optgroup><optgroup label="Các phòng">{STARTS.slice(PLACES.length).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</optgroup></select></label><label>Phòng cần đến<select value={destId} onChange={e=>{setDestId(e.target.value);setOneFloor(null);setShowAll(false)}}>{allDestinations.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <div className="room-card"><span>{FLOOR_LABELS[dest.floor]}</span><div><small>PHÒNG ĐÃ CHỌN</small><strong>{dest.id}</strong><p>{dest.name}</p></div></div>
        <div className="legend"><b>CHÚ THÍCH</b><span><i className="lab"/>Phòng LAB</span><span><i className="class"/>Phòng học</span><span><i className="stair"/>CT1 / CT2</span><span><i className="lift"/>Thang máy</span><span><i className="wc"/>WC Nam / Nữ</span><span><i className="selected"/>Điểm đến</span><span><i className="route"/>Tuyến đường di chuyển</span></div>
      </aside>
      <div className="map-stage"><div className="stage-tools"><button className={showAll&&oneFloor===null?'active':''} onClick={()=>{setOneFloor(null);setShowAll(true)}}><Building2/>Toàn bộ tòa nhà</button><button className={!showAll&&oneFloor===null?'active':''} onClick={()=>{setOneFloor(null);setShowAll(false)}}><Route/>Tầng của tuyến</button><button onClick={()=>setExploded(v=>!v)}><Layers3/>{exploded?'Gộp tầng':'Tách tầng'}</button><span><Rotate3D/> Kéo trái: di chuyển · kéo phải: xoay · cuộn: thu phóng</span></div><div ref={host} className="three-host"/><nav className="floor-rail">{FLOOR_LABELS.map((f,i)=><button key={f} className={oneFloor===i?'active':''} onClick={()=>{setOneFloor(i);setShowAll(false)}}>{f}</button>)}</nav></div>
      <aside className="panel route-panel"><div className="panel-title"><Route/> TUYẾN ĐƯỜNG</div><h2>{start.label}<ChevronRight/>{dest.id}</h2><div className="route-mode"><Navigation/>{route.mode==='LIFT'?'THANG MÁY':route.mode==='WALK'?'CÙNG TẦNG':`CẦU THANG ${route.mode}`}</div><ol>{route.steps.map((s,i)=><li key={s}><b>{String(i+1).padStart(2,'0')}</b><span>{s}</span></li>)}</ol><div className="mini-head"><Map/> MẶT BẰNG TẦNG · {FLOOR_LABELS[dest.floor]}</div><MiniPlan floor={dest.floor} dest={dest.id} route={route}/></aside>
    </section>
    <RoomProfile room={dest}/>
    <footer><Footprints/> Tuyến chỉ mang tính định hướng; không thay thế sơ đồ thoát hiểm hoặc chỉ dẫn an toàn tại công trình. <span>PDF SOURCE · CAMPUS E</span></footer>
  </main>
}

