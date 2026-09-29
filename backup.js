(function(root){'use strict';
const C=root.SajaCore||(typeof require!=='undefined'?require('./core.js'):null);
function exportBackup(items){return JSON.stringify({version:1,items:C.validateBackup({version:1,items})},null,2);}
async function restoreBackup(value,mode,store){const incoming=C.validateBackup(value);
 if(!['merge','replace'].includes(mode))throw Error('복원 방식을 선택하세요');
 const current=await store.all();
 const result=mode==='merge'?C.mergeItems(current,incoming):{items:incoming,skipped:0};
 await store.replaceAll(result.items);
 return {added:mode==='merge'?incoming.length-result.skipped:incoming.length,skipped:result.skipped,total:result.items.length};
}
const api={exportBackup,restoreBackup};root.SajaBackup=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
