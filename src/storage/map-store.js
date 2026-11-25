import {newTerrain,key,point,cardinal,terrainBounds} from '../core/grid.js';
import {categories} from '../editor/map.js';

export const STORAGE_KEY='turn-based-combat.maps';
export const SAVE_VERSION=1;
const validCoord=n=>Number.isSafeInteger(n);
const fail=message=>{throw new Error(message);};

export function normalizeName(value) {
  if(typeof value!=='string')fail('Invalid map name.');
  const name=value.trim();
  if(name.length>100)fail('Map name must be at most 100 characters.');
  return name;
}
export function defaultMapName(records) {
  const used=new Set(records.map(r=>r.name.toLowerCase()));
  let n=1;while(used.has('new map '+n))n++;
  return 'New Map '+n;
}

/** Validate persisted input before creating independent runtime state. */
export function hydrateMap(record) {
  if(!record||!Array.isArray(record.grass)||!Array.isArray(record.occupants))fail('Invalid map data.');
  const grass=new Set();
  for(const k of record.grass) {
    if(typeof k!=='string')fail('Invalid terrain coordinate.');
    const {x,y}=point(k);
    if(!validCoord(x)||!validCoord(y)||key(x,y)!==k||grass.has(k))fail('Invalid or duplicate terrain coordinate.');
    grass.add(k);
  }
  if(!grass.size)fail('A map needs at least one grass tile.');
  const start=grass.values().next().value,seen=new Set([start]),queue=[start];
  for(let i=0;i<queue.length;i++){
    const {x,y}=point(queue[i]);
    for(const [a,b] of cardinal(x,y)){
      const k=key(a,b);
      if(grass.has(k)&&!seen.has(k)){seen.add(k);queue.push(k);}
    }
  }
  if(seen.size!==grass.size)fail('Map terrain is disconnected.');
  const occupants=new Map();
  for(const o of record.occupants){
    if(!o||!validCoord(o.x)||!validCoord(o.y)||!['buildings','units'].includes(o.category)
      ||typeof o.id!=='string'||!Object.hasOwn(categories[o.category],o.id))fail('Invalid map occupant.');
    const k=key(o.x,o.y);
    if(!grass.has(k)||occupants.has(k))fail('Occupant is off terrain or duplicated.');
    occupants.set(k,{category:o.category,id:o.id});
  }
  return {grass,occupants,bounds:terrainBounds(grass),revision:0};
}
export function serializeMap(map){
  return {grass:[...map.grass],occupants:[...map.occupants].map(([k,o])=>({...point(k),category:o.category,id:o.id}))};
}
function validateRecord(record) {
  if(!record||typeof record.id!=='string'||!record.id||!normalizeName(record.name)||record.name!==record.name.trim())fail('Invalid saved map metadata.');
  hydrateMap(record);
}
export function createMapStore(storage,{makeId=()=>crypto.randomUUID()}={}){
  function list(){
    const raw=storage.getItem(STORAGE_KEY);
    if(raw===null)return [];
    let data;try{data=JSON.parse(raw);}catch{fail('Saved maps are unreadable. Existing data has not been changed.');}
    if(data?.version!==SAVE_VERSION||!Array.isArray(data.maps))fail('Unsupported map save format. Existing data has not been changed.');
    const ids=new Set();
    for(const record of data.maps){validateRecord(record);if(ids.has(record.id))fail('Duplicate map identifier.');ids.add(record.id);}
    return data.maps;
  }
  function write(records){
    for(const record of records)validateRecord(record);
    storage.setItem(STORAGE_KEY,JSON.stringify({version:SAVE_VERSION,maps:records}));
  }
  function find(records,id){const record=records.find(r=>r.id===id);if(!record)fail('Map no longer exists.');return record;}
  return {
    list,
    get(id){return find(list(),id);},
    create(name){
      const records=list(),id=makeId();
      if(!id||records.some(r=>r.id===id))fail('Could not generate a unique map identifier.');
      const record={id,name:normalizeName(name)||defaultMapName(records),grass:[...newTerrain()],occupants:[]};
      write([...records,record]);return record;
    },
    rename(id,name){
      const records=list(),old=find(records,id),next=normalizeName(name);
      if(!next)fail('Enter a map name.');
      const record={...old,name:next};
      write(records.map(r=>r.id===id?record:r));return record;
    },
    save(id,map){
      const records=list(),old=find(records,id),record={...old,...serializeMap(map)};
      write(records.map(r=>r.id===id?record:r));return record;
    },
    remove(id){const records=list();find(records,id);write(records.filter(r=>r.id!==id));},
  };
}
