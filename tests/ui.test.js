const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');
const base=path.resolve(__dirname,'..');
async function boot(factory){
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/saja/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.indexedDB=factory;w.IDBKeyRange=IDBKeyRange;w.crypto=require('node:crypto').webcrypto;
 for(const name of ['core.js','store.js','app.js']) w.eval(fs.readFileSync(path.join(base,name),'utf8'));
 await w.SajaApp.ready;
 return w;
}
async function tick(){await new Promise(r=>setTimeout(r,35));}
test('입력→이동→구매→복원→새로고침에도 유지',async()=>{
 const db=new IDBFactory();let w=await boot(db);
 w.document.querySelector('#name').value='  우유 ';
 w.document.querySelector('#add').click();await tick();
 assert.match(w.document.querySelector('#items').textContent,/우유/);
 w.document.querySelector('[data-action="move"]').click();await tick();
 w.document.querySelector('[data-tab="want"]').click();
 assert.match(w.document.querySelector('#items').textContent,/우유/);
 w.document.querySelector('[data-action="done"]').click();await tick();
 w.document.querySelector('[data-tab="done"]').click();
 assert.match(w.document.querySelector('#items').textContent,/우유/);
 w.document.querySelector('[data-action="restore"]').click();await tick();
 w.close();w=await boot(db);w.document.querySelector('[data-tab="want"]').click();
 assert.match(w.document.querySelector('#items').textContent,/우유/);w.close();
});
test('저장 실패 시 목록에 성공한 척 표시하지 않는다',async()=>{
 const w=await boot(new IDBFactory());
 w.SajaStore.put=async()=>{throw Error('디스크 실패');};
 w.document.querySelector('#name').value='빵';w.document.querySelector('#add').click();await tick();
 assert.doesNotMatch(w.document.querySelector('#items').textContent,/빵/);
 assert.match(w.document.querySelector('#status').textContent,/저장 실패/);w.close();
});
test('같은 이름을 추가하면 중복 안내가 남는다',async()=>{
 const w=await boot(new IDBFactory());
 w.document.querySelector('#name').value='우유';w.document.querySelector('#add').click();await tick();
 w.document.querySelector('#name').value='우유';w.document.querySelector('#add').click();await tick();
 assert.match(w.document.querySelector('#status').textContent,/이미 있는 이름/);
 w.close();
});
