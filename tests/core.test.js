const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
test('이름 정리와 빈 이름 거부',()=>{
 assert.equal(C.normalizeName('  우유   2개 '),'우유 2개');
 assert.throws(()=>C.makeItem('  ','buy','a',1),/이름/);
});
test('구매 후 원래 목록으로 복원',()=>{
 let item=C.makeItem('책','want','a',1);
 item=C.transition(item,'done',2);
 assert.equal(item.previousList,'want');
 item=C.transition(item,'restore',3);
 assert.equal(item.list,'want');
 assert.equal(item.previousList,null);
});
test('위시리스트에서 장보기로 이동',()=>{
 assert.equal(C.transition(C.makeItem('책','want','a',1),'buy',2).list,'buy');
});
test('백업은 버전·중복 ID·목록을 검증',()=>{
 const item=C.makeItem('우유','buy','a',1);
 assert.deepEqual(C.validateBackup({version:1,items:[item]}),[item]);
 assert.throws(()=>C.validateBackup({version:2,items:[]}),/버전/);
 assert.throws(()=>C.validateBackup({version:1,items:[item,item]}),/중복/);
 assert.throws(()=>C.validateBackup({version:1,items:[{...item,list:'bad'}]}),/목록/);
});
test('병합은 기존 ID를 보존하고 건너뛴다',()=>{
 const old=C.makeItem('우유','buy','a',1), newer=C.makeItem('새 우유','want','a',2), extra=C.makeItem('빵','buy','b',2);
 const out=C.mergeItems([old],[newer,extra]);
 assert.deepEqual(out,{items:[old,extra],skipped:1});
});
