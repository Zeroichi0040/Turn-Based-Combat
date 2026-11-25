export const TILE_SIZE=32;
export const terrain=Object.freeze({grass:Object.freeze({id:'grass',name:'Grass',sprite:'grass'})});
export const units=Object.freeze({swordsman:Object.freeze({id:'swordsman',name:'Swordsman',sprite:'swordsman',movement:2,trainingTurns:1})});
export const buildings=Object.freeze({
  townHall:Object.freeze({id:'townHall',name:'Town Hall',sprite:'townHall',garrisonCapacity:4,trainable:Object.freeze([])}),
  barracks:Object.freeze({id:'barracks',name:'Barracks',sprite:'barracks',garrisonCapacity:2,trainable:Object.freeze(['swordsman'])})
});
