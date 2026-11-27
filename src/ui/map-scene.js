import {renderOccupants} from '../editor/map.js';
import {bindMapInput} from './map-input.js';
import {createStroke} from '../editor/stroke.js';
import {centerCameraOnBounds,zoomAt,clampCamera,screenToTile} from '../rendering/camera.js';
import {createRenderScheduler} from '../rendering/render-scheduler.js';
import {drawWorld} from '../rendering/world.js';
import {bindCameraKeyboard} from '../rendering/keyboard-pan.js';
import {mountDrawer} from './editor-drawer.js';
import {createGarrisonDialog} from './garrison-dialog.js';
import {createSession,renderSession,endTurn} from '../game/session.js';
import {selectTile,selectionOverlay} from '../game/selection.js';

export function createMapScene({onSave,onCopy,onExit,onChange}) {
const screen=document.querySelector('#map-screen');
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),coordinate=document.querySelector('#coordinate');
const menu=document.querySelector('#editor-menu');
const turnDialog=document.querySelector('#end-turn-dialog');
const turnButton=document.querySelector('#end-turn');
const turnLabel=document.querySelector('#turn-label');
let map=null,mode='edit',session=null,selection=null,saving=false;
const terrainState=()=>session??map;
const blocked=()=>Boolean(document.querySelector('dialog[open]'));
const garrisonDialog=createGarrisonDialog({
  getSession:()=>session,
  onDeploy(id){selection={kind:'unit',id};status.textContent='Deployment selected';canvas.focus({preventScroll:true});render();},
  onClose(){if(session&&!screen.hidden&&!blocked())canvas.focus({preventScroll:true});render();},
});
function updateTurn(){turnLabel.textContent=session?'Turn '+session.turn:'';}
let camera=null,width=0,height=0,ratio=1,hover=null;
let tool={mode:'place',category:'tiles',id:'grass'};
let lastPointer=null;
function stats() {
  const el=document.querySelector('#map-stats');
  if(el)el.textContent=map.grass.size+' grass · '+map.occupants.size+' occupants';
}
function tileAt(clientX,clientY) {
  const rect=canvas.getBoundingClientRect();
  return screenToTile(camera,clientX-rect.left,clientY-rect.top);
}
let cachedOverlay=null,overlaySession=null,overlayRevision=-1,overlaySelection=null;
function overlay(){
  if(!session)return null;
  if(overlaySession!==session||overlayRevision!==session.revision||overlaySelection!==selection){
    cachedOverlay=selectionOverlay(session,selection);overlaySession=session;overlayRevision=session.revision;overlaySelection=selection;
  }
  return cachedOverlay;
}
const scheduler=createRenderScheduler(draw);
function render() {
  if(!map||!camera||screen.hidden)return;
  // Freeze camera transform while painting; clamp to updated bounds at stroke end.
  if(!input.painting)camera=clampCamera(camera,width,height,terrainState().bounds);
  if(lastPointer) {
    hover=tileAt(lastPointer.x,lastPointer.y);
    coordinate.textContent=hover.x+', '+hover.y;
  } else {hover=null;coordinate.textContent='—';}
  scheduler.request();
}
function draw(){
  if(!map||!camera||screen.hidden)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  drawWorld(ctx,width,height,camera,terrainState().grass,visible=>session?renderSession(session,visible):renderOccupants(map,visible),mode==='edit'&&hover&&!blocked()?{...hover,mode:tool.mode}:null,overlay());
}
function reset() {if(!map||input.active||screen.hidden)return;camera=centerCameraOnBounds(width,height,terrainState().bounds);render();}
function resize() {
  if(!map||screen.hidden)return;
  const rect=canvas.getBoundingClientRect(),oldW=width,oldH=height,nextRatio=window.devicePixelRatio||1;
  if(camera&&rect.width===width&&rect.height===height&&nextRatio===ratio)return;
  if(input.active)input.end();
  width=rect.width;height=rect.height;ratio=nextRatio;
  canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
  if(!camera){reset();return;}
  camera={...camera,x:camera.x+(width-oldW)/2,y:camera.y+(height-oldH)/2};render();
}
const input=bindMapInput(canvas,{
  enabled:()=>Boolean(map&&camera&&!screen.hidden&&!blocked()),
  playing:()=>Boolean(session),
  makeStroke:()=>createStroke(map,tool),
  tileAt,
  paint(stroke,tile){
    const result=stroke.visit(tile);
    if(result.last)status.textContent=result.last.message;
    if(result.changed){stats();onChange();}
  },
  select(tile){
    const result=selectTile(session,selection,tile.x,tile.y);
    selection=result.selection;status.textContent=result.message;
    if(result.openBuildingId)garrisonDialog.open(result.openBuildingId);
  },
  hover(event){
    lastPointer=event?{x:event.clientX,y:event.clientY}:null;
    if(!map||!camera||screen.hidden)return;
    const next=event?tileAt(event.clientX,event.clientY):null;
    const changed=next?.x!==hover?.x||next?.y!==hover?.y;
    hover=next;
    if(changed){coordinate.textContent=next?next.x+', '+next.y:'—';if(mode==='edit')scheduler.request();}
  },
  pan(dx,dy){camera={...camera,x:camera.x+dx,y:camera.y+dy};},
  zoom(e){
    const rect=canvas.getBoundingClientRect(),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);
    camera=zoomAt(camera,e.clientX-rect.left,e.clientY-rect.top,Math.exp(-delta*.001));
  },
  redraw:render,
});
bindCameraKeyboard({
   enabled:()=>Boolean(map&&!screen.hidden&&!blocked()),
  move(dx,dy){if(map&&camera&&!screen.hidden&&!input.active&&!blocked()){
    const next=clampCamera({...camera,x:camera.x+dx,y:camera.y+dy},width,height,terrainState().bounds);
    if(next.x!==camera.x||next.y!==camera.y){camera=next;render();}
  }},
  reset(){if(map&&!screen.hidden&&!blocked())reset();}
});
document.querySelector('#reset').addEventListener('click',()=>{reset();canvas.focus({preventScroll:true});});
document.querySelector('#menu').addEventListener('click',()=>{if(!map||screen.hidden)return;input.end();menu.showModal();render();});
turnButton.addEventListener('click',()=>{if(!session||screen.hidden||blocked())return;input.end();turnDialog.showModal();render();});
document.querySelector('#confirm-end-turn').addEventListener('click',()=>{
  if(!session||!turnDialog.open)return;
  const completed=endTurn(session);selection=null;updateTurn();
  status.textContent='Turn '+session.turn+' — units are ready.'+(completed.length?' '+completed.length+' unit'+(completed.length===1?'':'s')+' trained.':'');
  turnDialog.close();render();
});
document.querySelector('#cancel-end-turn').addEventListener('click',()=>turnDialog.close());
turnDialog.addEventListener('close',()=>{if(session&&!screen.hidden)canvas.focus({preventScroll:true});render();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&session&&!screen.hidden&&!blocked()){selection=null;status.textContent='Selection cleared.';render();}});
document.querySelector('#resume').addEventListener('click',()=>menu.close());
menu.addEventListener('close',()=>{if(!screen.hidden&&map&&!document.querySelector('dialog[open]'))canvas.focus({preventScroll:true});render();});
new ResizeObserver(resize).observe(canvas);
document.querySelector('#save-map').addEventListener('click',async()=>{if(await onSave())menu.close();});
 document.querySelector('#save-copy').addEventListener('click',async()=>{if(await onCopy())menu.close();});
 for(const dialog of [menu,document.querySelector('#unsaved-dialog')])dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
document.querySelector('#exit-map').addEventListener('click',()=>{menu.close();onExit();});
return {
  open(nextMap,nextMode,name){
    input.end();this.setConflict(false);document.querySelector('#menu-error').textContent='';map=nextMap;mode=nextMode;session=mode==='play'?createSession(map):null;selection=null;camera=null;lastPointer=null;hover=null;
    turnButton.hidden=!session;turnLabel.hidden=!session;updateTurn();
    screen.hidden=false;
    document.querySelector('#scene-title').textContent=mode==='edit'?'Map Editor':'Battlefield';
    document.querySelector('#scene-name').textContent=name;
    document.querySelector('#menu-title').textContent=mode==='edit'?'Map Editor':'Battlefield';
    document.querySelector('#menu').setAttribute('aria-label',mode==='edit'?'Editor menu':'Game menu');
    document.querySelector('#resume').textContent=mode==='edit'?'Resume':'Continue';
    document.querySelector('#save-map').hidden=mode!=='edit';
    document.querySelector('#drawer').hidden=mode!=='edit';
    document.querySelector('#drawer').replaceChildren();
    if(mode==='edit')mountDrawer(document.querySelector('#drawer'),next=>{
      input.end();lastPointer=null;tool=next;canvas.dataset.tool=tool.mode;stats();render();
    });
    status.textContent='';
    canvas.dataset.mode=mode;
    resize();canvas.focus({preventScroll:true});
  },
  close(){input.end();scheduler.cancel();screen.hidden=true;if(menu.open)menu.close();if(turnDialog.open)turnDialog.close();garrisonDialog.close();session=null;selection=null;map=null;camera=null;lastPointer=null;overlaySession=null;cachedOverlay=null;overlaySelection=null;},
  setName(name){document.querySelector('#scene-name').textContent=name;},
  setConflict(conflict){for(const id of ['save-copy','exit-copy'])document.querySelector('#'+id).hidden=!conflict;},
  setSaving(value){saving=value;for(const id of ['resume','save-map','exit-map','save-copy','exit-save','exit-copy','exit-discard','exit-cancel'])document.querySelector('#'+id).disabled=value;},
  getMap(){return map;},
  setStatus(message){status.textContent=message;},
};
}

