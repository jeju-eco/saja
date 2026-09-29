(function(root){
'use strict';
const lists=['buy','want','done'];
function normalizeName(name){return String(name??'').trim().replace(/\s+/g,' ');}
function makeItem(name,list,id,now){
 name=normalizeName(name);
 if(!name) throw Error('이름을 입력하세요');
 if(!['buy','want'].includes(list)) throw Error('목록이 올바르지 않습니다');
 if(typeof id!=='string'||!id) throw Error('ID가 없습니다');
 return {id,name,list,previousList:null,note:'',price:'',link:'',createdAt:now,updatedAt:now};
}
function transition(item,to,now){
 if(!lists.includes(item.list)) throw Error('목록이 올바르지 않습니다');
 if(to==='restore'){
  if(item.list!=='done'||!['buy','want'].includes(item.previousList)) throw Error('되돌릴 목록이 없습니다');
  return {...item,list:item.previousList,previousList:null,updatedAt:now};
 }
 if(!lists.includes(to)||to===item.list) throw Error('이동할 목록이 올바르지 않습니다');
 return {...item,list:to,previousList:to==='done'?item.list:null,updatedAt:now};
}
function validateBackup(value){
 if(!value||value.version!==1||!Array.isArray(value.items)) throw Error('지원되지 않는 백업 버전 또는 형식');
 const ids=new Set();
 return value.items.map(x=>{
  if(!x||typeof x.id!=='string'||!x.id||ids.has(x.id)) throw Error('중복 또는 잘못된 ID');
  ids.add(x.id);
  if(typeof x.name!=='string'||!normalizeName(x.name)) throw Error('이름이 없습니다');
  if(!lists.includes(x.list)||x.list==='done'&&!['buy','want'].includes(x.previousList)||x.list!=='done'&&x.previousList!==null) throw Error('목록이 잘못되었습니다');
  if(!['note','price','link'].every(k=>typeof x[k]==='string')||!Number.isFinite(x.createdAt)||!Number.isFinite(x.updatedAt)) throw Error('항목 형식이 잘못되었습니다');
  if(x.link&&!safeLink(x.link)) throw Error('링크 형식이 잘못되었습니다');
  return {id:x.id,name:normalizeName(x.name),list:x.list,previousList:x.previousList,note:x.note,price:x.price,link:x.link,createdAt:x.createdAt,updatedAt:x.updatedAt};
 });
}
function safeLink(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol);}catch{return false;}}
function mergeItems(current,incoming){const ids=new Set(current.map(x=>x.id));const added=incoming.filter(x=>!ids.has(x.id));return {items:[...current,...added],skipped:incoming.length-added.length};}
const api={normalizeName,makeItem,transition,validateBackup,mergeItems,safeLink};
if(typeof module!=='undefined'&&module.exports) module.exports=api;
root.SajaCore=api;
})(typeof window!=='undefined'?window:globalThis);
