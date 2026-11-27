import './styles.css';
import {createMapStore,MapConflict} from './storage/map-store.js';
import {createMapScene} from './ui/map-scene.js';

const nav=document.querySelector('#navigation'),heading=document.querySelector('#nav-title');
const actions=document.querySelector('#nav-actions'),list=document.querySelector('#map-list');
const error=document.querySelector('#nav-error');
const formDialog=document.querySelector('#map-dialog'),form=document.querySelector('#map-form');
const formTitle=document.querySelector('#form-title'),nameField=document.querySelector('#map-name');
const nameLabel=document.querySelector('#name-label'),formMessage=document.querySelector('#form-message');
const formError=document.querySelector('#form-error'),confirmButton=document.querySelector('#form-confirm');
const exitDialog=document.querySelector('#unsaved-dialog'),exitError=document.querySelector('#exit-error');
let route='home',active=null,savedRevision=0,dialogAction=null,busy=false,navGeneration=0;
let store;
try{store=createMapStore(window.localStorage);}catch{error.textContent='Browser storage is unavailable.';}
const dirty=()=>active?.mode==='edit'&&scene.getMap()?.revision!==savedRevision;
function warnUnload(event){if(dirty()){event.preventDefault();event.returnValue='';}}
function updateDirty(){window.removeEventListener('beforeunload',warnUnload);if(dirty())window.addEventListener('beforeunload',warnUnload);}
const scene=createMapScene({onSave:saveActive,onCopy:saveCopy,onExit:requestExit,onChange:updateDirty});
function button(label,fn){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;
}
function report(target,err){target.textContent=err instanceof Error?err.message:'Operation failed.';}
async function renderNav(next=route){
  const generation=++navGeneration;
  route=next;nav.dataset.route=next;nav.hidden=false;heading.textContent=next==='home'?'Turn-Based Combat':next==='edit'?'Manage Maps':'Select Map';
  actions.replaceChildren();list.replaceChildren();error.textContent='';
  if(next==='home'){
    actions.append(button('Start',()=>renderNav('start')),button('Edit',()=>renderNav('edit')));
    return;
  }
  actions.append(button('Back',()=>{if(!busy)renderNav('home');}));
  if(next==='edit')actions.append(button('New Map',()=>openForm('create')));
  try{
    if(!store)throw new Error('Browser storage is unavailable.');
    const records=await store.list();
    if(generation!==navGeneration||nav.hidden)return;
    if(!records.length){const p=document.createElement('p');p.textContent=next==='edit'?'No saved maps. Create one to begin.':'No saved maps. Create one in Edit first.';list.append(p);}
    for(const record of records){
      const row=document.createElement('article');row.className='saved-map';row.dataset.mapId=record.id;
      const details=document.createElement('div'),title=document.createElement('h3'),meta=document.createElement('p');
      title.textContent=record.name;meta.textContent=record.corrupt?'Unreadable map: '+record.error:record.grassCount+' grass · '+record.occupantCount+' occupants';details.append(title,meta);
      const buttons=document.createElement('div');buttons.className='map-row-actions';
      if(record.corrupt){buttons.append(button('Export',()=>exportRecord(record.id)),button('Delete',()=>openForm('delete',record)));}
      else if(next==='edit')buttons.append(button('Edit',()=>openMap(record.id,'edit')),button('Rename',()=>openForm('rename',record)),button('Delete',()=>openForm('delete',record)));
      else buttons.append(button('Play',()=>openMap(record.id,'play')));
      row.append(details,buttons);list.append(row);
    }
  }catch(err){if(generation===navGeneration){report(error,err);if(store?.legacyBackup())actions.append(button('Export backup',()=>download('legacy-maps.json',store.legacyBackup())));}}
}
function download(name,raw){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function exportRecord(id){try{download('map-backup.json',JSON.stringify(await store.exportRecord(id),null,2));}catch(err){report(error,err);}}
async function openMap(id,mode){
  if(busy)return;busy=true;
  try{
    const {record,map}=await store.load(id);
    active={id,mode,baseline:record};savedRevision=map.revision;nav.hidden=true;
    scene.open(map,mode,record.name);updateDirty();
  }catch(err){scene.close();active=null;updateDirty();await renderNav();report(error,err);}finally{busy=false;}
}
async function saveActive(){
  if(active?.mode!=='edit'||busy)return false;
  busy=true;scene.setSaving(true);
  try{
    active.baseline=await store.save(active.id,scene.getMap(),active.baseline.revision);savedRevision=scene.getMap().revision;
    updateDirty();scene.setStatus('Map saved.');scene.setConflict(false);document.querySelector('#menu-error').textContent='';exitError.textContent='';return true;
  }catch(err){report(exitDialog.open?exitError:document.querySelector('#menu-error'),err);scene.setConflict(err instanceof MapConflict);return false;}finally{busy=false;scene.setSaving(false);}
}
async function saveCopy(){
  if(busy||active?.mode!=='edit')return false;busy=true;scene.setSaving(true);
  try{const record=await store.copy((active.baseline.name.slice(0,93)+' (copy)'),scene.getMap());active.id=record.id;active.baseline=record;savedRevision=scene.getMap().revision;updateDirty();scene.setName(record.name);scene.setConflict(false);scene.setStatus('Map saved.');document.querySelector('#menu-error').textContent='';exitError.textContent='';return true;}
  catch(err){report(exitDialog.open?exitError:document.querySelector('#menu-error'),err);return false;}finally{busy=false;scene.setSaving(false);}
}
function closeScene(){
  if(exitDialog.open)exitDialog.close();scene.close();active=null;updateDirty();renderNav();
}
function requestExit(){
  if(busy)return;
  if(dirty()){exitError.textContent='';exitDialog.showModal();}
  else closeScene();
}
function openForm(kind,record){
  if(busy)return;
  dialogAction={kind,record};
  formTitle.textContent=kind==='create'?'New Map':kind==='rename'?'Rename Map':'Delete Map?';
  nameLabel.hidden=kind==='delete';nameField.disabled=kind==='delete';
  nameField.value=kind==='rename'?record.name:'';
  nameField.placeholder=kind==='create'?'New Map (optional)':'Map name';
  formMessage.textContent=kind==='delete'?'Delete “'+record.name+'”? This cannot be undone.':'';
  confirmButton.textContent=kind==='create'?'Create':kind==='rename'?'Rename':'Delete';
  formError.textContent='';formDialog.showModal();
  (kind==='delete'?document.querySelector('#form-cancel'):nameField).focus();
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!dialogAction||busy)return;busy=true;confirmButton.disabled=true;
  const {kind,record}=dialogAction;
  try{
    if(!store)throw new Error('Browser storage is unavailable.');
    if(kind==='create'){const created=await store.create(nameField.value);formDialog.close();busy=false;await openMap(created.id,'edit');}
    else if(kind==='rename'){await store.rename(record.id,nameField.value,record.revision);formDialog.close();await renderNav();}
    else {await store.remove(record.id,record.revision);formDialog.close();await renderNav();}
  }catch(err){report(formError,err);}finally{busy=false;confirmButton.disabled=false;}
});
formDialog.addEventListener('close',()=>{if(!formDialog.open)dialogAction=null;});
formDialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
document.querySelector('#form-cancel').addEventListener('click',()=>{if(!busy)formDialog.close();});
document.querySelector('#exit-save').addEventListener('click',async()=>{if(await saveActive())closeScene();});
document.querySelector('#exit-copy').addEventListener('click',async()=>{if(await saveCopy())closeScene();});
document.querySelector('#exit-discard').addEventListener('click',()=>{if(!busy)closeScene();});
document.querySelector('#exit-cancel').addEventListener('click',()=>exitDialog.close());
exitDialog.addEventListener('close',()=>{if(active&&!document.querySelector('#map-screen').hidden)document.querySelector('#world').focus({preventScroll:true});});
renderNav('home');
