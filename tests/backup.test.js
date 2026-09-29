const {test}=require('node:test');const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const C=require('../core.js');
const B=require('../backup.js');
const S=require('../store.js');
test('내보내기→검증→병합은 현재 ID를 유지한다',async()=>{
 global.indexedDB=new IDBFactory();
 const a=C.makeItem('우유','buy','a',1),newer={...a,name:'다른 우유'},b=C.makeItem('빵','want','b',2);
 const blob=B.exportBackup([newer,b]);
 assert.deepEqual(C.validateBackup(JSON.parse(blob)),[newer,b]);
 const result=await B.restoreBackup(JSON.parse(blob),'merge',{all:async()=>[a],replaceAll:async items=>{assert.deepEqual(items,[a,b]);}});
 assert.deepEqual(result,{added:1,skipped:1,total:2});
});
test('잘못된 백업은 저장소를 변경하지 않는다',async()=>{
 let writes=0;
 await assert.rejects(()=>B.restoreBackup({version:2,items:[]},'replace',{all:async()=>[],replaceAll:async()=>writes++}),/버전/);
 assert.equal(writes,0);
});
test('전체 교체는 없는 ID를 제거한 목록으로 한 번에 저장한다',async()=>{
 const item=C.makeItem('새 목록','buy','n',4);let calls=0;
 await B.restoreBackup({version:1,items:[item]},'replace',{all:async()=>[C.makeItem('옛 목록','buy','old',1)],replaceAll:async xs=>{calls++;assert.deepEqual(xs,[item]);}});
 assert.equal(calls,1);
});
