import {test,expect} from '@playwright/test';
test('legacy maps migrate, corrupt records stay exportable and backup remains',async({page})=>{
 const raw=JSON.stringify({version:1,maps:[{id:'legacy-good',name:'Legacy good',grass:['0,0'],occupants:[]},{id:'legacy-bad',name:'Legacy bad',grass:['0,0','2,0'],occupants:[]}]});
 await page.addInitScript(raw=>localStorage.setItem('turn-based-combat.maps',raw),raw);
 await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();
 await expect(page.locator('.saved-map')).toHaveCount(2);
 const bad=page.locator('.saved-map').filter({hasText:'Legacy bad'});
 await expect(bad).toContainText('Unreadable map');
 const download=page.waitForEvent('download');await bad.getByRole('button',{name:'Export'}).click();expect((await download).suggestedFilename()).toBe('map-backup.json');
 const good=page.locator('.saved-map').filter({hasText:'Legacy good'});
 await good.getByRole('button',{name:'Edit',exact:true}).click();
 await expect(page.locator('#map-stats')).toHaveText('1 grass · 0 occupants');
 expect(await page.evaluate(()=>localStorage.getItem('turn-based-combat.maps'))).toBe(raw);
});
