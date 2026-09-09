import * as THREE from 'three';

// PDF page 3: 658.08 drawing points correspond to the dimensioned 21.10 m.
// Furniture dimensions are estimates from Scenes 134–143, not surveyed measurements.
export const ROOM104 = { width: 273.12 / (658.08 / 21.1), depth: 158.64 / (658.08 / 21.1), height: 3 };
export type RoomObstacle = { x: number; z: number; w: number; d: number };
export const ROOM_ITEMS = [
  { name: 'Khu bàn học', x: -2.15, z: .9, title: 'Bàn đôi mặt gỗ · ghế khung thép', description: 'Cụm bàn học hướng về màn hình di động, với lối đi dọc bên dãy kệ. Tái dựng 5 bàn đôi và 10 ghế theo các góc render.', action: 'Xem khu bàn học' },
  { name: 'Màn hình di động', x: .05, z: 1.03, title: 'Màn hình trình chiếu trên chân bánh xe', description: 'Màn hình lớn đặt giữa khu bàn học và khu làm việc. Nhấn nút để bật / tắt nội dung trình chiếu mẫu.', action: 'Bật / tắt màn hình' },
  { name: 'Dãy kệ trưng bày', x: -2.15, z: -2.27, title: 'Ba khoang kệ kim loại màu đen', description: 'Kệ mở nhiều tầng chạy dọc tường, dành cho trưng bày vật mẫu và học liệu. Các ngăn được để trống như ảnh thiết kế.', action: 'Xem dãy kệ' },
  { name: 'Tủ hồ sơ', x: .05, z: -2.25, title: 'Tủ trắng · ngăn mở và cánh đóng', description: 'Tủ cao kết hợp ngăn sách, hồ sơ và khoang lưu trữ đóng. Nhấn nút để thử mở / đóng hai cánh tủ dưới.', action: 'Mở / đóng tủ' },
  { name: 'Quầy cà phê', x: 1.48, z: -2.18, title: 'Quầy gỗ · máy pha cà phê', description: 'Khu tiện ích có máy pha, cốc và kệ phía trên, cạnh bàn cao. Nhấn nút để chạy hiệu ứng pha cà phê minh họa.', action: 'Thử pha cà phê' },
  { name: 'Bàn cao', x: 3.05, z: -2.18, title: 'Bàn mặt gỗ · khung thép đen', description: 'Bàn cao nối tiếp quầy cà phê, có hai khay đặt trên mặt bàn và giữ khoảng trống trước cửa cuối phòng.', action: 'Xem bàn cao' },
  { name: 'Khu máy tính', x: 2.45, z: .65, title: 'Ba máy tính · bàn làm việc đối diện', description: 'Hai máy tính phía ghế trắng, một máy phía ghế tựa cao. Màn hình, bàn phím và đèn bàn dựng theo ảnh; chưa gán cấu hình thiết bị thực tế.', action: 'Bật / tắt máy tính' },
  { name: 'Tủ thấp & cây xanh', x: .95, z: .64, title: 'Tủ thấp chia ngăn · chậu cây dài', description: 'Tủ thấp đặt ở đầu cụm bàn làm việc, phía trên có chậu cây, ngăn nhẹ khu máy tính với khu trình chiếu.', action: 'Xem tủ và cây' },
] as const;

export function createRoom104(scene: THREE.Scene, furnished: boolean, openings: 'render' | 'pdf') {
  const { width: w, depth: d, height: h } = ROOM104;
  const obstacles: RoomObstacle[] = [], interactables: THREE.Object3D[] = [];
  const materials: THREE.Material[] = [], textures: THREE.Texture[] = [];
  const mat = (color: number, opacity = 1) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .72, transparent: opacity < 1, opacity, depthWrite: opacity === 1 }); materials.push(m); return m; };
  const white = mat(0xf2f0e9), metal = mat(0x272d2e), steel = mat(0x9c9d98), glass = mat(0xafd6d9, .21), wood = mat(0xc39868), darkWood = mat(0x655242), black = mat(0x12191c), green = mat(0x447445);
  const box = (a: number, b: number, c: number, x: number, y: number, z: number, material: THREE.Material, parent: THREE.Object3D = scene) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(a,b,c), material); mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const cylinder = (r: number, length: number, x: number, y: number, z: number, material: THREE.Material, parent: THREE.Object3D) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,10),material); mesh.position.set(x,y,z); parent.add(mesh); return mesh; };
  // Subtle procedural wood grain and ceramic joints; these are material textures.
  const timber = document.createElement('canvas'); timber.width = 512; timber.height = 256;
  const ctx = timber.getContext('2d')!;ctx.fillStyle='#c59b6f';ctx.fillRect(0,0,512,256);
  for(let i=0;i<140;i++){ctx.strokeStyle=`rgba(91,59,32,${.04+(i%7)*.014})`;ctx.lineWidth=.4+(i%3)*.35;ctx.beginPath();for(let x=0;x<=512;x+=8){const y=i*2+Math.sin(x*.016+i)*1.6;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
  const grain=new THREE.CanvasTexture(timber);grain.colorSpace=THREE.SRGBColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;textures.push(grain);wood.map=grain;
  const floor=box(w,.12,d,0,-.06,0,mat(0xe8e5df));floor.userData.walkable=true;
  const joint=mat(0xc9c9c2);for(let x=-w/2+.6;x<w/2;x+=.6)box(.006,.002,d,x,.002,0,joint);for(let z=-d/2+.6;z<d/2;z+=.6)box(w,.002,.006,0,.002,z,joint);
  const walls: { group: THREE.Group; normal: THREE.Vector3 }[]=[];
  const overhead=new THREE.Group();scene.add(overhead);
  const makeWall=(normal:THREE.Vector3)=>{const group=new THREE.Group();scene.add(group);walls.push({group,normal});return group};
  const back=makeWall(new THREE.Vector3(0,0,-1)),front=makeWall(new THREE.Vector3(0,0,1));
  box(w,h,.12,0,h/2,-d/2,white.clone(),back);box(w,h,.12,0,h/2,d/2,white.clone(),front);
  box(w,.075,.04,0,.04,-d/2+.07,steel,back);box(w,.075,.04,0,.04,d/2-.07,steel,front);
  const s=658.08/21.1;
  const pdfDoors=[{from:(160.76-122.12)/s,to:(192.68-122.12)/s},{from:(127.04-122.12)/s,to:(162.2-122.12)/s}];
  const doorRanges=openings==='pdf'?pdfDoors:[{from:.64,to:1.92},{from:.52,to:1.80}];
  for(let side=0;side<2;side++){
    const x=side===0?-w/2:w/2,group=makeWall(new THREE.Vector3(side===0?-1:1,0,0));
    const windows=openings==='pdf'?(side===1?[{from:(170.96-122.12)/s,to:(221.48-122.12)/s},{from:(224.6-122.12)/s,to:(271.4-122.12)/s}]:[]):(side===0?[{from:2.17,to:3.65}]:[]);
    const apertures=[{...doorRanges[side],bottom:0,top:2.25,door:true},...windows.map(o=>({...o,bottom:1.02,top:2.25,door:false}))].sort((a,b)=>a.from-b.from);
    const wallMat=white.clone();let cursor=0;
    const segment=(from:number,to:number,bottom:number,top:number,material:THREE.Material)=>{if(to>from&&top>bottom)box(.12,top-bottom,to-from,x,(bottom+top)/2,-d/2+(from+to)/2,material,group)};
    for(const o of apertures){segment(cursor,o.from,0,h,wallMat);segment(o.from,o.to,0,o.bottom,wallMat);segment(o.from,o.to,o.top,h,wallMat);
      segment(o.from,o.to,o.bottom+.05,o.top-.05,glass);segment(o.from-.035,o.from+.035,o.bottom,o.top,metal);segment(o.to-.035,o.to+.035,o.bottom,o.top,metal);segment(o.from,o.to,o.top-.045,o.top,metal);segment(o.from,o.to,o.bottom,o.bottom+.045,metal);
      const mid=(o.from+o.to)/2;segment(mid-.028,mid+.028,o.bottom,o.top,metal);
      if(o.door){segment(o.from,o.to,.42,.47,metal);for(const offset of [-.09,.09])box(.08,.25,.025,x+(side===0?.06:-.06),1,-d/2+mid+offset,steel,group)}
      cursor=o.to;
    }segment(cursor,d,0,h,wallMat);
  }
  const addObstacle=(x:number,z:number,a:number,c:number)=>obstacles.push({x,z,w:a,d:c});
  const groups=ROOM_ITEMS.map((_,i)=>{const group=new THREE.Group();group.userData.station=i;scene.add(group);if(furnished)interactables.push(group);return group});
  const screens:THREE.MeshStandardMaterial[]=[];const cabinetDoors:THREE.Group[]=[];const steam:THREE.Mesh[]=[];
  const screenMat=()=>{const m=mat(0x142127);m.emissive.set(0x247f8b);m.emissiveIntensity=.08;screens.push(m);return m};
  function chair(x:number,z:number,angle:number,office=false,executive=false,parent:THREE.Object3D=scene){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);
    const seat=office?(executive?mat(0x92969a):white):wood;
    box(.43,.065,.43,0,.46,0,seat,g);box(.44,executive?.78:.36,.055,0,executive?.85:.69,.2,seat,g);
    if(office){cylinder(.035,.38,0,.23,0,steel,g);for(let i=0;i<5;i++){const leg=box(.035,.035,.29,0,.07,.14,metal,g);leg.rotation.y=i*Math.PI*.4;leg.position.set(Math.sin(i*Math.PI*.4)*.13,.07,Math.cos(i*Math.PI*.4)*.13);cylinder(.035,.05,Math.sin(i*Math.PI*.4)*.26,.04,Math.cos(i*Math.PI*.4)*.26,metal,g)}}
    else{for(const a of [-.17,.17]){box(.035,.42,.035,a,.23,-.15,steel,g);box(.035,.7,.035,a,.37,.17,steel,g);box(.035,.035,.48,a,.04,0,steel,g)}}
    addObstacle(x,z,.46,.48);
  }
  if(furnished){
    // Three rows, 2+2+1 double desks, all facing the presentation screen (+X).
    for(const [row,x] of [-3.45,-2.30,-1.15].entries())for(const [col,z] of [.07,1.44].entries()){
      if(row===2&&col===0)continue;const g=groups[0];box(.48,.055,1.2,x,.74,z,wood,g);box(.36,.13,1.1,x,.65,z,white,g);addObstacle(x,z,.5,1.22);
      for(const dz of [-.5,.5]){box(.065,.70,.065,x,.35,z+dz,steel,g);box(.55,.055,.065,x,.04,z+dz,steel,g)}
      for(const dz of [-.31,.31])chair(x-.43,z+dz,Math.PI/2,false,false,g);
    }
    // Open black display shelves, three bays, eleven fine shelves each.
    for(const x of [-3.45,-2.30,-1.15]){const g=groups[2];for(const dx of [-.53,.53])for(const dz of [-.2,.2])box(.035,2.48,.035,x+dx,1.24,-2.25+dz,metal,g);for(let y=.16;y<2.5;y+=.225)box(1.1,.028,.44,x,y,-2.25,metal,g);addObstacle(x,-2.25,1.1,.44)}
    const cabinet=groups[3];box(1.13,2.52,.05,.08,1.26,-2.46,white,cabinet);for(const dx of [-.55,.55])box(.04,2.52,.48,.08+dx,1.26,-2.23,white,cabinet);for(const y of [.12,.88,1.3,1.72,2.13,2.5])box(1.14,.035,.49,.08,y,-2.23,white,cabinet);
    for(const [i,x] of [-.22,.35].entries()){const sign=i?-1:1,pivot=new THREE.Group();pivot.position.set(x-sign*.275,.47,-1.97);cabinet.add(pivot);box(.54,.72,.04,sign*.27,0,0,white,pivot);box(.025,.14,.035,sign*.48,.02,.035,metal,pivot);cabinetDoors.push(pivot)}
    const bookColors=[0x557678,0xd2c0a0,0x747b84,0x8d583d];for(let i=0;i<17;i++){const level=i<8?1.34:1.77;box(.035+(i%3)*.012,.19+(i%4)*.02,.22,-.4+(i%8)*.095,level+.12,-2.13,mat(bookColors[i%4]),cabinet)}addObstacle(.08,-2.23,1.14,.5);
    const pantry=groups[4];box(1.55,.88,.59,1.46,.44,-2.2,darkWood,pantry);box(1.60,.045,.66,1.46,.91,-2.17,white,pantry);box(1.55,1.52,.05,1.46,1.73,-2.47,darkWood,pantry);for(const x of [.68,2.24])box(.04,1.55,.4,x,1.72,-2.27,darkWood,pantry);for(const y of [1.63,2.1,2.49])box(1.6,.035,.42,1.46,y,-2.28,white,pantry);
    for(let i=0;i<12;i++)box(.014,.79,.014,.74+i*.125,.46,-1.894,wood,pantry);
    box(.48,.64,.44,1.75,1.25,-2.11,metal,pantry);box(.24,.18,.025,1.75,1.43,-1.88,screenMat(),pantry);box(.34,.025,.30,1.75,.96,-1.86,steel,pantry);cylinder(.105,.16,1.75,1.65,-2.14,glass,pantry);
    for(const x of [.97,1.25,1.57,1.90])cylinder(.045,.12,x,1.72,-2.2,white,pantry);cylinder(.045,.075,1.75,1.015,-1.85,white,pantry);
    for(let i=0;i<5;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),mat(0xffffff,.3));puff.position.set(1.75,1.08+i*.08,-1.85);puff.visible=false;pantry.add(puff);steam.push(puff)}addObstacle(1.46,-2.17,1.6,.66);
    const bar=groups[5];box(1.7,.045,.45,3.15,1.0,-2.2,wood,bar);for(const x of [2.35,3.95])for(const z of [-2.37,-2.03])box(.035,.98,.035,x,.49,z,metal,bar);for(const x of [2.73,3.56]){box(.48,.025,.3,x,1.04,-2.2,metal,bar);box(.42,.008,.24,x,1.056,-2.2,white,bar)}addObstacle(3.15,-2.2,1.7,.45);
    const tv=groups[1];box(.075,1.12,1.95,.05,1.57,1.03,metal,tv);box(.012,1.04,1.86,-.0,1.57,1.03,screenMat(),tv);for(const z of [.47,1.59]){box(.055,.91,.055,.05,.50,z,metal,tv);box(.64,.065,.06,.05,.09,z,metal,tv);for(const x of [-.22,.32])cylinder(.045,.045,x,.045,z,steel,tv)}addObstacle(.05,1.03,.66,1.95);
    const work=groups[6];for(const z of [.2,1.18]){box(2.7,.055,.73,2.64,.75,z,wood,work);for(const x of [1.35,3.93])for(const dz of [-.28,.28])box(.04,.72,.04,x,.36,z+dz,metal,work);addObstacle(2.64,z,2.7,.73)}
    for(const [x,z,rotation] of [[2.0,.20,0],[3.25,.20,0],[2.7,1.18,Math.PI]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;work.add(g);box(.60,.40,.045,0,1.08,0,white,g);box(.55,.32,.012,0,1.1,-.03,screenMat(),g);box(.06,.18,.07,0,.84,.04,steel,g);box(.24,.02,.16,0,.785,.04,white,g);box(.34,.015,.12,0,.79,-.25,white,g);for(let i=0;i<8;i++)box(.003,.002,.09,-.145+i*.04,.799,-.25,steel,g)}
    chair(2.0,-.46,Math.PI,true,false,work);chair(3.25,-.46,Math.PI,true,false,work);chair(2.7,1.92,0,true,true,work);
    box(.45,.54,.48,2.60,.27,-.1,white,work);box(2.5,.53,.28,2.64,.265,2.30,darkWood,work);addObstacle(2.64,2.30,2.5,.28);
    const divider=groups[7];for(const y of [.22,.9])box(.38,.04,1.13,.92,y,.64,white,divider);for(const z of [.09,.45,.84,1.19])box(.38,.65,.025,.92,.56,z,white,divider);box(.03,.7,1.14,.73,.56,.64,white,divider);for(const z of [.12,1.16])box(.035,.23,.035,.92,.115,z,metal,divider);box(.35,.19,.87,.92,1.015,.64,white,divider);addObstacle(.92,.64,.40,1.15);
    for(let i=0;i<42;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.11,7,5),green);leaf.scale.set(.65,.30,1);leaf.position.set(.92+Math.sin(i*2.4)*(.08+(i%3)*.06),1.14+Math.sin(i*1.7)*.10,.64+Math.cos(i*2.4)*(.12+(i%4)*.10));leaf.rotation.set(i*.23,i*.81,.2);divider.add(leaf)}
    // Wall-mounted split ACs and ceiling tracks are visible in the supplied renders.
    for(const x of [-1.9,2.4]){box(1.0,.29,.21,x,2.56,d/2-.15,white,front);box(.85,.045,.025,x,2.46,d/2-.27,steel,front)}
    for(const x of [-2.8,0,2.8])for(const z of [-1.25,1.25]){box(1.1,.035,.045,x,2.89,z,metal,overhead);for(const offset of [-.42,0,.42]){const light=cylinder(.045,.12,x+offset,2.8,z,metal,overhead);light.rotation.z=.36}}
  }
  const selection=new THREE.BoxHelper(new THREE.Object3D(),0xed742d);selection.visible=false;scene.add(selection);
  let selected=-1,cabinetOpen=false,coffeeUntil=0;const displayState={tv:false,computers:false};
  const highlight=(i:number)=>{selected=i;selection.visible=i>=0&&furnished;if(selection.visible)selection.setFromObject(groups[i])};
  const activate=(i:number)=>{if(i===1||i===6){const key=i===1?'tv':'computers';displayState[key]=!displayState[key];const enabled=displayState[key];(i===1?screens.slice(1,2):screens.slice(2)).forEach(m=>{m.color.set(enabled?0x176d80:0x142127);m.emissiveIntensity=enabled?.8:.08})}if(i===3)cabinetOpen=!cabinetOpen;if(i===4)coffeeUntil=performance.now()+4500;};
  const update=(time:number,dt:number,camera:THREE.Camera,top:boolean)=>{
    overhead.visible=!top;
    walls.forEach(({group,normal})=>{const facing=camera.position.clone().normalize().dot(normal)>.1;group.visible=!top;group.traverse(o=>{if(o instanceof THREE.Mesh&&o.material!==glass){const m=o.material as THREE.MeshStandardMaterial;if(m===white||m===steel||m===metal)return;m.transparent=facing;m.opacity=facing?.12:1;m.depthWrite=!facing}})});
    cabinetDoors.forEach((g,i)=>{g.rotation.y=THREE.MathUtils.damp(g.rotation.y,cabinetOpen?(i?1:-1)*1.2:0,9,dt)});
    steam.forEach((p,i)=>{p.visible=time<coffeeUntil;p.position.y=1.10+((time*.00017+i*.06)%.40);p.scale.setScalar(1+(p.position.y-1.1)*2)});
    if(selected>=0&&selection.visible)selection.update();
  };
  return {floor,obstacles,interactables,highlight,activate,update,start:new THREE.Vector3(-w/2+.55,0,-d/2+(doorRanges[0].from+doorRanges[0].to)/2),textures};
}

export function createStudent(scene:THREE.Scene){
  const root=new THREE.Group(),model=new THREE.Group();root.add(model);scene.add(root);
  const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.8});
  const teal=mat(0x008c8b),orange=mat(0xff813b),skin=mat(0xdca77e),hair=mat(0x242323),pants=mat(0xb4bac2),shoe=mat(0xf4f1e9);
  const ellipsoid=(x:number,y:number,z:number,a:number,b:number,c:number,m:THREE.Material,parent:THREE.Object3D=model)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),m);mesh.position.set(x,y,z);mesh.scale.set(a,b,c);parent.add(mesh);mesh.castShadow=true;return mesh};
  ellipsoid(0,1.12,0,.23,.32,.135,teal);ellipsoid(0,.9,0,.21,.07,.13,teal);
  for(const x of [-.205,.205])ellipsoid(x,1.08,0,.035,.23,.126,orange);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.077,.08,.1,12),skin);neck.position.y=1.42;model.add(neck);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.094,.018,6,20),orange);collar.rotation.x=Math.PI/2;collar.position.y=1.405;model.add(collar);
  ellipsoid(0,1.61,0,.165,.205,.15,skin);ellipsoid(0,1.745,-.015,.174,.10,.151,hair);ellipsoid(-.065,1.7,.10,.10,.07,.065,hair);
  for(const x of [-.163,.163])ellipsoid(x,1.60,0,.029,.044,.035,skin);
  const eyeWhite=mat(0xffffff);for(const x of [-.062,.062]){ellipsoid(x,1.635,.133,.032,.021,.013,eyeWhite);ellipsoid(x,1.634,.145,.012,.015,.006,hair);const glasses=new THREE.Mesh(new THREE.TorusGeometry(.046,.0035,6,16),hair);glasses.position.set(x,1.632,.153);model.add(glasses);}
  ellipsoid(0,1.596,.148,.021,.029,.021,skin);ellipsoid(0,1.548,.137,.034,.005,.009,hair);
  const limbs:THREE.Group[]=[];
  for(const [x,y,isArm] of [[-.265,1.32,1],[.265,1.32,1],[-.105,.88,0],[.105,.88,0]]){const pivot=new THREE.Group();pivot.position.set(x,y,0);model.add(pivot);limbs.push(pivot);
    if(isArm){ellipsoid(0,-.11,0,.095,.15,.093,teal,pivot);ellipsoid(0,-.24,0,.086,.024,.085,orange,pivot);ellipsoid(0,-.37,0,.062,.14,.061,skin,pivot);ellipsoid(0,-.50,0,.066,.07,.06,skin,pivot)}
    else{ellipsoid(0,-.33,0,.095,.37,.099,pants,pivot);ellipsoid(0,-.76,.035,.108,.075,.16,shoe,pivot)}}
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d')!;c.fillStyle='#008c8b';c.fillRect(0,0,256,128);c.fillStyle='white';c.font='bold 72px Arial';c.textAlign='center';c.fillText('UEH',128,77);c.fillStyle='#ff813b';c.font='bold 20px Arial';c.fillText('UNIVERSITY',128,106);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const badge=new THREE.Mesh(new THREE.PlaneGeometry(.14,.07),new THREE.MeshBasicMaterial({map:texture}));badge.position.set(-.09,1.29,.139);model.add(badge);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.27,24),new THREE.MeshBasicMaterial({color:0x284144,transparent:true,opacity:.20,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;root.add(shadow);
  let velocity=0,height=0;
  return {root,jump:()=>{if(height===0)velocity=3.9},update:(dt:number,moving:boolean,time:number)=>{velocity-=10.5*dt;height=Math.max(0,height+velocity*dt);if(height===0)velocity=0;model.position.y=height;limbs.forEach((part,i)=>part.rotation.x=height>0?(i<2?-.55:.25):moving?Math.sin(time+(i%2?Math.PI:0))*.5:0);shadow.scale.setScalar(1-height*.2)},dispose:()=>texture.dispose()};
}

