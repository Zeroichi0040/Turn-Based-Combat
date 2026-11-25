import {buildings,units} from '../content/definitions.js';
import {sprite} from '../rendering/sprites.js';
import {assignProduction} from '../game/production.js';

/** Nested modal; the parent garrison remains open underneath it. */
export function createProductionDialog({getSession,onAssigned}){
  const dialog=document.querySelector('#production-dialog');
  const choices=document.querySelector('#production-choices');
  const status=document.querySelector('#production-status');
  let buildingId=null,selected=null;
  document.querySelector('#close-production').addEventListener('click',()=>dialog.close());
  return {
    open(id){
      const session=getSession(),building=session?.buildings.get(id);
      if(!building||building.production||!buildings[building.type].trainable.length||dialog.open)return;
      buildingId=id;selected=null;choices.replaceChildren();
      status.textContent='';
      for(const typeId of buildings[building.type].trainable){
        const type=units[typeId],button=document.createElement('button');
        button.type='button';button.className='training-choice';
        button.setAttribute('aria-label',type.name);button.setAttribute('aria-pressed','false');
        const image=document.createElement('img');
        image.src=sprite(type.sprite).toDataURL();image.alt='';image.width=48;image.height=48;
        const label=document.createElement('span');label.textContent=type.name;
        const detail=document.createElement('small');detail.textContent=type.trainingTurns+' turn'+(type.trainingTurns===1?'':'s');
        button.append(image,label,detail);
        button.addEventListener('click',()=>{
          if(selected===typeId){
            if(assignProduction(getSession(),buildingId,typeId)){dialog.close();onAssigned();}
            return;
          }
          selected=typeId;
          for(const choice of choices.querySelectorAll('button'))choice.setAttribute('aria-pressed',String(choice===button));
          status.textContent=type.name+' selected.';
        });
        choices.append(button);
      }
      dialog.showModal();
    },
    close(){if(dialog.open)dialog.close();},
  };
}
