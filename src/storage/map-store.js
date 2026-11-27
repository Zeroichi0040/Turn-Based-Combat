import {newTerrain,key,point,cardinal,terrainBounds} from '../core/grid.js';
import {categories} from '../editor/map.js';
import {openDatabase,transaction,request} from './database.js';

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
function metadata(record){
  return {id:record.id,name:record.name,grassCount:record.grass.length,occupantCount:record.occupants.length,revision:record.revision};
}
function validateRecord(record){
  if(!record||typeof record.id!=='string'||!record.id||!normalizeName(record.name)||record.name!==record.name.trim())fail('Invalid saved map metadata.');
  hydrateMap(record);
}
export class MapConflict extends Error{
  constructor(){super('This map changed in another tab or was deleted. Save as Copy to keep your edits.');this.name='MapConflict';}
}
/** Transactional per-map records. Legacy storage is kept untouched as a backup.
 * Corrupt records are catalogued separately and can be exported without loading.
 */
export function createMapStore(storage,{factory=globalThis.indexedDB,dbName,makeId=()=>crypto.randomUUID()}={}){
  let ready;
  const stores=['maps','catalog','settings'];
  async function initialize(){
    if(!factory)fail('IndexedDB is unavailable.');
    const db=await openDatabase(factory,dbName);
    try{
      await transaction(db,stores,'readwrite',async ({maps,catalog,settings})=>{
        if(await request(settings.get('legacy-imported')))return;
        const raw=storage?.getItem(STORAGE_KEY);
        if(raw!=null){
          let data;try{data=JSON.parse(raw);}catch{fail('Legacy maps are unreadable. Export the legacy backup before recovery.');}
          if(data?.version!==SAVE_VERSION||!Array.isArray(data.maps))fail('Unsupported legacy save format. Original data is preserved.');
          const seen=new Set();
          for(const [i,item] of data.maps.entries()){
            try{
              validateRecord(item);
              if(seen.has(item.id))fail('Duplicate map identifier.');
            }catch(err){
              const id='quarantine-'+makeId();
              await request(maps.add({id,raw:item}));
              await request(catalog.add({id,name:typeof item?.name==='string'?item.name:'Corrupt map '+(i+1),corrupt:true,error:err.message}));
              continue;
            }
            seen.add(item.id);
            const record={...item,revision:1};
            await request(maps.add(record));await request(catalog.add(metadata(record)));
          }
        }
        await request(settings.add({id:'legacy-imported',version:1}));
      });
      return db;
    }catch(err){db.close();throw err;}
  }
  const db=()=>ready??=initialize();
  const read=async(names,fn)=>transaction(await db(),names,'readonly',fn);
  const write=async(names,fn)=>transaction(await db(),names,'readwrite',fn);
  async function find(store,id){
    const record=await request(store.get(id));if(!record)fail('Map no longer exists.');return record;
  }
  async function insert(name,map){
    const content=serializeMap(map);
    hydrateMap(content);
    return write(['maps','catalog'],async({maps,catalog})=>{
      const id=makeId(),records=await request(catalog.getAll());
      const record={id,name:normalizeName(name)||defaultMapName(records),revision:1,...content};
      await request(maps.add(record));await request(catalog.add(metadata(record)));return record;
    });
  }
  return {
    list(){return read(['catalog'],async({catalog})=>request(catalog.getAll()));},
    async get(id){
      return read(['maps'],async({maps})=>{const record=await find(maps,id);validateRecord(record);return record;});
    },
    create(name){return insert(name,{grass:newTerrain(),occupants:new Map()});},
    copy(name,map){return insert(name,map);},
    rename(id,name,expectedRevision){
      const next=normalizeName(name);if(!next)fail('Enter a map name.');
      return write(['maps','catalog'],async({maps,catalog})=>{
        const old=await find(maps,id);validateRecord(old);
        if(expectedRevision!==undefined&&old.revision!==expectedRevision)throw new MapConflict();
        const record={...old,name:next,revision:old.revision+1};
        await request(maps.put(record));await request(catalog.put(metadata(record)));return record;
      });
    },
    save(id,map,expectedRevision){
      const content=serializeMap(map);hydrateMap(content);
      return write(['maps','catalog'],async({maps,catalog})=>{
        const old=await request(maps.get(id));
        if(!old||old.revision!==expectedRevision)throw new MapConflict();
        const record={...old,...content,revision:old.revision+1};
        await request(maps.put(record));await request(catalog.put(metadata(record)));return record;
      });
    },
    remove(id,expectedRevision){
      return write(['maps','catalog'],async({maps,catalog})=>{
        const old=await find(catalog,id);
        if(!old.corrupt&&old.revision!==expectedRevision)throw new MapConflict();
        await request(maps.delete(id));await request(catalog.delete(id));
      });
    },
    exportRecord(id){return read(['maps'],async({maps})=>find(maps,id));},
    legacyBackup(){return storage?.getItem(STORAGE_KEY)??null;},
    async close(){(await db()).close();},
  };
}
