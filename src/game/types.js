/** @typedef {import('../core/grid.js').Point} Point */
/** @typedef {keyof typeof import('../content/definitions.js').units} UnitType */
/** @typedef {keyof typeof import('../content/definitions.js').buildings} BuildingType */
/** @typedef {{id:string,type:UnitType,position:Point|null,spent:boolean}} Unit */
/** @typedef {{unitType:UnitType,remaining:number}} ProductionOrder */
/** @typedef {{id:string,type:BuildingType,position:Point,garrison:string[],production:ProductionOrder|null,displayedUnitId:string|null}} Building */
/** @typedef {{kind:'unit',id:string}|{kind:'building',id:string}} Occupancy */
/** @typedef {{kind:'unit',entity:Unit}|{kind:'building',entity:Building}} EntityLookup */
/** @typedef {{minX:number,minY:number,maxX:number,maxY:number}} Bounds */
/** @typedef {{grass:Set<string>,bounds:Bounds|null,units:Map<string,Unit>,buildings:Map<string,Building>,occupancy:Map<string,Occupancy>,membership:Map<string,string>,revision:number,turn:number,nextId:number}} Session */
/** @typedef {{kind:'unit',id:string,destination?:string}|{kind:'building',id:string}} Selection */
/** @typedef {{selection:Selection|null,message:string,openBuildingId?:string}} SelectionResult */
/** @typedef {{selected:Point,reachable:Set<string>,path:Point[]|null,deployment:(Point & {sprite:string})|null}} SelectionOverlay */
/** @typedef {{category:'units',id:UnitType}|{category:'buildings',id:BuildingType}} EditorOccupant */
/** @typedef {{grass:Set<string>,occupants:Map<string,EditorOccupant>}} Scenario */
export {};
