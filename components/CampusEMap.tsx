'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
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
const TOP_Z=2.38, LEFT_X=5.72, RIGHT_X=7.82;
const baseNodes:P[]=[[.6,TOP_Z],[1.3,TOP_Z],[4.2,TOP_Z],[LEFT_X,TOP_Z],[6.45,TOP_Z],[RIGHT_X,TOP_Z],[LEFT_X,1.42],[LEFT_X,3.6],[6.55,3.6],[RIGHT_X,3.6],[RIGHT_X,4.6],[RIGHT_X,4.9],[LEFT_X,5.25],[6.5,5.25],[RIGHT_X,5.25],[LEFT_X,6.15],[RIGHT_X,6.15]];
const same=(a:number,b:number)=>Math.abs(a-b)<.03;
const connected=(a:P,b:P)=>{
  if(same(a[1],TOP_Z)&&same(b[1],TOP_Z))return true;
  if(same(a[0],LEFT_X)&&same(b[0],LEFT_X))return true;
  if(same(a[0],RIGHT_X)&&same(b[0],RIGHT_X))return true;
  return [3.6,5.25,6.15].some(z=>same(a[1],z)&&same(b[1],z)&&a[0]>=LEFT_X&&b[0]>=LEFT_X);
};
const approach=(p:P):P=>p[1]<=2.65?[p[0],TOP_Z]:p[0]>=8?[RIGHT_X,p[1]]:[LEFT_X,p[1]];
const dist=(a:P,b:P)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function corridorPath(from:P,to:P):P[]{
  const a=approach(from),b=approach(to),nodes=[...baseNodes,a,b];const n=nodes.length;const d=Array(n).fill(Infinity),prev=Array(n).fill(-1),seen=Array(n).fill(false);d[n-2]=0;
  for(let k=0;k<n;k++){let u=-1;for(let i=0;i<n;i++)if(!seen[i]&&(u<0||d[i]<d[u]))u=i;if(u<0||!isFinite(d[u]))break;seen[u]=true;for(let v=0;v<n;v++){if(u===v||!connected(nodes[u],nodes[v]))continue;const nd=d[u]+dist(nodes[u],nodes[v]);if(nd<d[v]){d[v]=nd;prev[v]=u}}}
  const idx:number[]=[];for(let at=n-1;at>=0;at=prev[at]){idx.push(at);if(at===n-2)break;if(prev[at]<0)break}idx.reverse();const path=[from,a,...idx.slice(1,-1).map(i=>nodes[i]),b,to];return path.filter((p,i)=>i===0||dist(p,path[i-1])>.02);
}
const pathLength=(p:P[])=>p.slice(1).reduce((s,v,i)=>s+dist(p[i],v),0);
function routeFor(start:Place,dest:Room):RouteData {
  if(start.floor===dest.floor) return {mode:'WALK',floors:[dest.floor],paths:{[dest.floor]:corridorPath(start.point,dest.door)},steps:[`Rời ${start.label}`,`Đi theo hành lang ${FLOOR_LABELS[dest.floor]} và theo hướng mũi tên`, `Dừng ngay trước cửa ${dest.id}`]};
  const liftStops=[0,4,5,6,7],choices:{mode:'CT1'|'CT2'|'LIFT';point:P;score:number}[]=[{mode:'CT1',point:CORES.CT1,score:0}];
  if(start.floor<7&&dest.floor<7)choices.push({mode:'CT2',point:CORES.CT2,score:0});
  if(liftStops.includes(start.floor)&&liftStops.includes(dest.floor))choices.push({mode:'LIFT',point:CORES.LIFT,score:0});
  choices.forEach(c=>c.score=pathLength(corridorPath(start.point,c.point))+pathLength(corridorPath(c.point,dest.door))+Math.abs(dest.floor-start.floor)*(c.mode==='LIFT'?.7:1.25));
  const best=choices.sort((a,b)=>a.score-b.score)[0],mode=best.mode,core=best.point;
  return {mode,floors:[start.floor,dest.floor],paths:{[start.floor]:corridorPath(start.point,core),[dest.floor]:corridorPath(core,dest.door)},steps:[`Từ ${start.label}, theo mũi tên trên hành lang đến ${mode==='LIFT'?'thang máy':`cầu thang ${mode}`}`,mode==='LIFT'?`Đi thang máy đến ${FLOOR_LABELS[dest.floor]}`:`Theo hai vế thang và chiếu nghỉ đến ${FLOOR_LABELS[dest.floor]}`,`Ra sảnh tầng ${FLOOR_LABELS[dest.floor]} và tiếp tục theo mũi tên`, `Dừng ngay trước cửa ${dest.id}`]};
}

function labelSprite(text:string, accent=false){
  const c=document.createElement('canvas'); c.width=420;c.height=116; const x=c.getContext('2d')!;
  x.fillStyle=accent?'#f36b21':'rgba(20,24,27,.94)'; x.beginPath();x.roundRect(5,5,410,106,18);x.fill();
  x.strokeStyle=accent?'#ffb27f':'#59636a';x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.font='600 38px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,210,59);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(1.75,.48,1);s.renderOrder=20;return s;
}

function buildScene(host:HTMLDivElement, opts:{exploded:boolean;floor:number|null;showAll:boolean;dest:string;start:Place;route:RouteData}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#101416');scene.fog=new THREE.Fog('#101416',18,37);
  const shownFloors=opts.floor!==null?[opts.floor]:opts.showAll?FLOOR_LABELS.map((_,i)=>i):[...new Set(opts.route.floors)].sort((a,b)=>a-b);const spacing=opts.exploded?1.42:.48;const floorY=(f:number)=>opts.floor!==null?0:Math.max(0,shownFloors.indexOf(f))*spacing;
  const camera=new THREE.PerspectiveCamera(38,1,.1,100); camera.position.set(opts.showAll?15:13,opts.showAll?11:7.5,opts.showAll?21:16);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xdde8ea,0x1a1410,2.1)); const sun=new THREE.DirectionalLight(0xffe5d2,3.4);sun.position.set(8,15,10);sun.castShadow=true;scene.add(sun);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.rotateSpeed=.34;controls.zoomSpeed=.48;controls.enablePan=false;controls.target.set(5.1,opts.floor===null?(shownFloors.length-1)*spacing/2:.3,3.6);controls.minDistance=7;controls.maxDistance=27;
  const root=new THREE.Group();root.rotation.y=-.12;root.position.x=-4.6;scene.add(root);
  const mat=(color:number,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.04,transparent:opacity<1,opacity});
  const addBox=(parent:THREE.Object3D,size:[number,number,number],pos:[number,number,number],material:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  FLOOR_LABELS.forEach((fl,f)=>{
    if(!shownFloors.includes(f))return; const y=floorY(f);
    const g=new THREE.Group();g.position.y=y;root.add(g);
    const involved=opts.route.floors.includes(f);addBox(g,[10.35,.055,7.4],[5.1,0,3.6],mat(involved?0xe5e4df:0x757b7d,involved?.96:.48));
    ROOMS.filter(r=>r.floor===f).forEach(r=>{const [x1,z1,x2,z2]=r.box;const selected=r.id===opts.dest;const m=addBox(g,[x2-x1-.08,.16,z2-z1-.08],[(x1+x2)/2,.12,(z1+z2)/2],mat(selected?0xf36b21:(r.kind==='class'?0x69aee7:0x5e9ed1),involved?.93:.38));m.userData.room=r.id;
      addBox(g,[.32,.018,.07],[r.door[0],.225,r.door[1]],mat(0xffd2ad));
      const l=labelSprite(r.id,selected);l.scale.multiplyScalar(selected?.72:.46);l.position.set((x1+x2)/2,selected?.72:.42,(z1+z2)/2);g.add(l);
    });
    const stepMat=mat(0xd27b47,involved?.95:.42);
    const ct1=new THREE.Group();for(let i=0;i<7;i++){addBox(ct1,[.42,.025,.14],[-.27,.04+i*.025,-.46+i*.14],stepMat);addBox(ct1,[.42,.025,.14],[.27,.2-i*.025,.46-i*.14],stepMat)}ct1.position.set(CORES.CT1[0],.08,CORES.CT1[1]);g.add(ct1);
    if(f<7){const ct2=new THREE.Group();for(let i=0;i<7;i++){addBox(ct2,[.14,.025,.42],[-.46+i*.14,.04+i*.025,-.25],stepMat);addBox(ct2,[.14,.025,.42],[.46-i*.14,.2-i*.025,.25],stepMat)}ct2.position.set(CORES.CT2[0],.08,CORES.CT2[1]);g.add(ct2)}
    const amenity=(text:string,p:P,color:number)=>{addBox(g,[.72,.12,.62],[p[0],.1,p[1]],mat(color,involved?.92:.4));const s=labelSprite(text);s.scale.multiplyScalar(.38);s.position.set(p[0],.45,p[1]);g.add(s)};
    amenity('CT1',CORES.CT1,0xb96335);if(f<7)amenity('CT2',CORES.CT2,0xb96335);amenity([0,4,5,6,7].includes(f)?'LIFT':'LIFT · NO STOP',CORES.LIFT,[0,4,5,6,7].includes(f)?0x2d8e70:0x704048);amenity('WC NAM',[6.15,6.25],0x687176);amenity('WC NỮ',[7.15,6.25],0x687176);
    const fs=labelSprite(fl,true);fs.scale.multiplyScalar(.58);fs.position.set(-.35,.34,3.55);g.add(fs);
  });
  const movingArrows:{mesh:THREE.Mesh;a:THREE.Vector3;b:THREE.Vector3;phase:number}[]=[];const visibleFloors=opts.floor===null?opts.route.floors:[opts.floor];
  for(const f of visibleFloors){const pts=opts.route.paths[f];if(!pts)continue;const y=floorY(f)+.34;const lineMat=new THREE.MeshBasicMaterial({color:0xff6418});for(let i=1;i<pts.length;i++){const a=new THREE.Vector3(pts[i-1][0],y,pts[i-1][1]),b=new THREE.Vector3(pts[i][0],y,pts[i][1]);if(a.distanceTo(b)<.03)continue;const curve=new THREE.LineCurve3(a,b);root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,8,.045,7,false),lineMat));const dir=b.clone().sub(a).normalize();for(let q=0;q<2;q++){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.105,.25,9),new THREE.MeshBasicMaterial({color:0xfff0e6}));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);root.add(arrow);movingArrows.push({mesh:arrow,a,b,phase:q*.5+i*.13})}}}
  if(opts.floor===null&&opts.route.floors.length===2){const core=CORES[opts.route.mode as keyof typeof CORES];const [a,b]=opts.route.floors;const ya=floorY(a)+.34,yb=floorY(b)+.34;const geo=new THREE.CylinderGeometry(.045,.045,Math.abs(yb-ya),10);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xff6418}));m.position.set(core[0],(ya+yb)/2,core[1]);root.add(m)}
  const addPin=(point:P,floor:number,text:string,color:number)=>{if(!shownFloors.includes(floor))return;const y=floorY(floor);const pin=new THREE.Group();const ball=new THREE.Mesh(new THREE.SphereGeometry(.13,14,10),new THREE.MeshBasicMaterial({color}));ball.position.y=.57;pin.add(ball);const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.035,8,20),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.34;pin.add(ring);pin.position.set(point[0],y,point[1]);root.add(pin);const label=labelSprite(text,color===0xf04438);label.scale.multiplyScalar(.58);label.position.set(point[0],y+.95,point[1]);root.add(label)};
  addPin(opts.start.point,opts.start.floor,'BẠN ĐANG Ở ĐÂY',0xf04438);const destination=ROOMS.find(r=>r.id===opts.dest)!;addPin(destination.door,destination.floor,`ĐẾN · ${opts.dest}`,0xf36b21);
  const grid=new THREE.GridHelper(36,36,0x374046,0x252b2f);grid.position.y=-.2;scene.add(grid);
  let id=0;const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(host);
  const started=performance.now();const animate=()=>{id=requestAnimationFrame(animate);const t=(performance.now()-started)/1000;movingArrows.forEach(a=>a.mesh.position.copy(a.a).lerp(a.b,(t*.42+a.phase)%1));controls.update();renderer.render(scene,camera)};animate();
  let pointerStart:P=[0,0];const down=(e:PointerEvent)=>{pointerStart=[e.clientX,e.clientY]};const click=(e:PointerEvent)=>{if(Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(root.children,true).find(x=>x.object.userData.room);if(hit)window.dispatchEvent(new CustomEvent('campus-room',{detail:hit.object.userData.room}))};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',click);
  return ()=>{cancelAnimationFrame(id);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',click);controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();const material=(o as THREE.Mesh).material;if(material){(Array.isArray(material)?material:[material]).forEach(x=>x.dispose())}});renderer.dispose();renderer.domElement.remove()};
}

function MiniPlan({floor,dest,route}:{floor:number;dest:string;route:RouteData}){
  return <svg viewBox="0 0 840 620" className="mini-plan" aria-label={`Mặt bằng ${FLOOR_LABELS[floor]}`}>
    <defs><marker id="route-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#fff4eb"/></marker></defs>
    <rect x="18" y="18" width="804" height="584" rx="12" className="plan-shell"/><path d="M70 203H620M460 100V535M620 203V535M460 295H620M460 419H620M460 486H620" className="plan-corridor"/>
    {ROOMS.filter(r=>r.floor===floor).map(r=>{const [x1,z1,x2,z2]=r.box;return <g key={r.id}><rect x={25+x1*76} y={25+z1*75} width={(x2-x1)*76} height={(z2-z1)*75} rx="5" className={r.id===dest?'plan-room selected':'plan-room'}/><text x={25+(x1+x2)*38} y={25+(z1+z2)*37.5}>{r.id}</text><circle cx={25+r.door[0]*76} cy={25+r.door[1]*75} r="6" className="door"/></g>})}
    <rect x={25+5.95*76} y={25+3.12*75} width={1.2*76} height={.95*75} className="core"/><text x={25+6.55*76} y={25+3.65*75}>CT1</text>{floor<7&&<><rect x={25+.78*76} y={25+.98*75} width={1.45*76} height={.84*75} className="core"/><text x={25+1.5*76} y={25+1.46*75}>CT2 ↔</text></>}<rect x={25+6.08*76} y={25+4.88*75} width={.84*76} height={.75*75} className="lift"/><text x={25+6.5*76} y={25+5.3*75}>LIFT</text><text x={25+6.15*76} y={25+6.35*75} className="facility-label">WC NAM</text><text x={25+7.35*76} y={25+6.35*75} className="facility-label">WC NỮ</text>
    {route.paths[floor]&&<polyline points={route.paths[floor].map(([x,z])=>`${25+x*76},${25+z*75}`).join(' ')} className="plan-route" markerMid="url(#route-arrow)" markerEnd="url(#route-arrow)"/>}
  </svg>
}

export default function CampusEMap(){
  const host=useRef<HTMLDivElement>(null);const [startId,setStartId]=useState('ENTRY');const [destId,setDestId]=useState('E101');const [exploded,setExploded]=useState(true);const [oneFloor,setOneFloor]=useState<number|null>(null);const [showAll,setShowAll]=useState(true);
  const start=STARTS.find(p=>p.id===startId)!;const dest=ROOMS.find(r=>r.id===destId)!;const route=useMemo(()=>routeFor(start,dest),[start,dest]);
  useEffect(()=>{const f=(e:Event)=>{const id=(e as CustomEvent<string>).detail;setDestId(id);setOneFloor(ROOMS.find(r=>r.id===id)?.floor??null)};window.addEventListener('campus-room',f);return()=>window.removeEventListener('campus-room',f)},[]);
  useEffect(()=>{if(!host.current)return;return buildScene(host.current,{exploded,floor:oneFloor,showAll,dest:destId,start,route})},[exploded,oneFloor,showAll,destId,start,route]);
  return <main className="app-shell">
    <header className="topbar"><img src={`${import.meta.env.BASE_URL}tch-logo-lockup.png`} alt="Technology Convergence Hub" width={152} height={48}/><div><span>WAYFINDING PROTOTYPE</span><b>CAMPUS E · UEH</b></div><div className="status"><i/> LIVE PROTOTYPE</div></header>
    <section className="intro"><div><small>01 / DIGITAL CAMPUS</small><h1>Đi đúng cửa.<br/><em>Đúng tầng.</em></h1></div><p>Mô hình thử nghiệm được dựng lại từ mặt bằng Cơ sở E: phòng có màu, cửa vào, hai lõi thang CT1–CT2 và thang máy theo đúng tầng dừng.</p></section>
    <section className="workspace">
      <aside className="panel controls-panel"><div className="panel-title"><LocateFixed/> CHỌN HÀNH TRÌNH</div><label>Vị trí hiện tại<select value={startId} onChange={e=>{setStartId(e.target.value);setOneFloor(null);setShowAll(false)}}><optgroup label="Lối vào">{PLACES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</optgroup><optgroup label="Các phòng">{STARTS.slice(PLACES.length).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</optgroup></select></label><label>Phòng cần đến<select value={destId} onChange={e=>{setDestId(e.target.value);setOneFloor(null);setShowAll(false)}}>{allDestinations.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <div className="room-card"><span>{FLOOR_LABELS[dest.floor]}</span><div><small>PHÒNG ĐÃ CHỌN</small><strong>{dest.id}</strong><p>{dest.name}</p></div></div>
        <div className="legend"><b>CHÚ THÍCH</b><span><i className="lab"/>Phòng LAB</span><span><i className="class"/>Phòng học</span><span><i className="stair"/>CT1 / CT2</span><span><i className="lift"/>Thang máy</span><span><i className="wc"/>WC Nam / Nữ</span><span><i className="selected"/>Điểm đến</span><span><i className="route"/>Tuyến có mũi tên</span></div>
      </aside>
      <div className="map-stage"><div className="stage-tools"><button className={showAll&&oneFloor===null?'active':''} onClick={()=>{setOneFloor(null);setShowAll(true)}}><Building2/>Toàn bộ tòa nhà</button><button className={!showAll&&oneFloor===null?'active':''} onClick={()=>{setOneFloor(null);setShowAll(false)}}><Route/>Tầng của tuyến</button><button onClick={()=>setExploded(v=>!v)}><Layers3/>{exploded?'Gộp tầng':'Tách tầng'}</button><span><Rotate3D/> Kéo nhẹ để xoay · cuộn để thu phóng</span></div><div ref={host} className="three-host"/><nav className="floor-rail">{FLOOR_LABELS.map((f,i)=><button key={f} className={oneFloor===i?'active':''} onClick={()=>{setOneFloor(i);setShowAll(false)}}>{f}</button>)}</nav></div>
      <aside className="panel route-panel"><div className="panel-title"><Route/> TUYẾN ĐƯỜNG</div><h2>{start.label}<ChevronRight/>{dest.id}</h2><div className="route-mode"><Navigation/>{route.mode==='LIFT'?'THANG MÁY':route.mode==='WALK'?'CÙNG TẦNG':`CẦU THANG ${route.mode}`}</div><ol>{route.steps.map((s,i)=><li key={s}><b>{String(i+1).padStart(2,'0')}</b><span>{s}</span></li>)}</ol><div className="mini-head"><Map/> MẶT BẰNG ĐÍCH · {FLOOR_LABELS[dest.floor]}</div><MiniPlan floor={dest.floor} dest={dest.id} route={route}/></aside>
    </section>
    <footer><Footprints/> Tuyến chỉ mang tính định hướng; không thay thế sơ đồ thoát hiểm hoặc chỉ dẫn an toàn tại công trình. <span>PDF SOURCE · CAMPUS E</span></footer>
  </main>
}
