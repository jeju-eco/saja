(function(root){'use strict';
let dbPromise;
function open(){if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
 const request=indexedDB.open('saja-v1',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('items',{keyPath:'id'});
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error);
 });return dbPromise;}
async function transaction(mode,work){const db=await open();return new Promise((resolve,reject)=>{
 const tx=db.transaction('items',mode),store=tx.objectStore('items');let result;
 tx.oncomplete=()=>resolve(result);
 tx.onerror=()=>reject(tx.error||Error('저장 실패'));
 tx.onabort=()=>reject(tx.error||Error('저장 실패'));
 try{result=work(store);}catch(e){tx.abort();reject(e);}
 });}
async function all(){const db=await open();return new Promise((resolve,reject)=>{
 const tx=db.transaction('items','readonly'),req=tx.objectStore('items').getAll();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });}
const put=item=>transaction('readwrite',s=>s.put(item));
const remove=id=>transaction('readwrite',s=>s.delete(id));
const replaceAll=items=>transaction('readwrite',s=>{s.clear();items.forEach(x=>s.put(x));});
const api={open,all,put,remove,replaceAll};root.SajaStore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
