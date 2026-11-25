import {buildings,units} from '../content/definitions.js';
import {sprite} from '../rendering/sprites.js';
import {selectStoredUnit} from '../game/garrison.js';

export function createGarrisonDialog({getSession,onDeploy,onClose}){
  const dialog=document.querySelector('#garrison-dialog');
  const heading=document.querySelector('#garrison-title'),slots=document.querySelector('#garrison-slots');
  const status=document.querySelector('#garrison-status'),count=document.querySelector('#garrison-count');
  let buildingId=null,selectedId=null;
  function render(){
    const session=getSession(),building=session?.buildings.get(buildingId);
    if(!building)return;
    const definition=buildings[building.type];
    heading.textContent=definition.name;
    count.textContent=building.garrison.length+' / '+definition.garrisonCapacity+' garrisoned';
    slots.replaceChildren();
    for(let i=0;i<definition.garrisonCapacity;i++){
      const id=building.garrison[i],unit=session.units.get(id);
      const button=document.createElement('button');button.type='button';button.className='garrison-slot';
      button.dataset.slot=String(i+1);
      if(!unit){
        button.disabled=true;button.setAttribute('aria-label','Empty slot '+(i+1));button.textContent='Empty';
      }else{
        const type=units[unit.type],image=document.createElement('img');
        image.src=sprite(type.sprite).toDataURL();image.alt='';image.width=48;image.height=48;
        if(unit.spent)button.classList.add('spent');
        button.setAttribute('aria-label',type.name+' slot '+(i+1)+(unit.spent?' (spent)':' (ready)'));
        button.setAttribute('aria-pressed',String(selectedId===id));
        const label=document.createElement('span');label.textContent=unit.spent?'Spent':'Ready';
        button.append(image,label);
        button.addEventListener('click',()=>{
          const result=selectStoredUnit(session,buildingId,selectedId,id);
          selectedId=result.selectedId;
          if(result.deploy){dialog.close();onDeploy(id);return;}
          status.textContent=unit.spent?type.name+' has already moved this turn.':type.name+' selected. Click again to deploy.';
          // Keep the same DOM buttons and keyboard focus during inspection.
          for(const slot of slots.querySelectorAll('button[aria-pressed]'))slot.setAttribute('aria-pressed',String(slot===button));
        });
      }
      slots.append(button);
    }
  }
  document.querySelector('#close-garrison').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!dialog.open){buildingId=null;selectedId=null;onClose();}});
  return {
    open(id){
      if(!getSession()?.buildings.has(id))return;
      buildingId=id;selectedId=null;status.textContent='Select a stored unit to inspect it.';render();
      dialog.showModal();
    },
    close(){if(dialog.open)dialog.close();},
  };
}
