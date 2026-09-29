(function(w){'use strict';
const C=w.SajaCore,S=w.SajaStore,$=s=>document.querySelector(s);
let items=[],tab='buy',editing=null,busy=false;
const status=(text,backup=false)=>{(backup?$('#backupStatus'):$('#status')).textContent=text;};
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function render(){
 for(const list of ['buy','want','done']){$(`[data-count="${list}"]`).textContent=items.filter(x=>x.list===list).length;}
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));});
 $('#name').placeholder=tab==='want'?'뭐가 갖고 싶어?':'뭐가 필요해?';
 $('#form').hidden=tab==='done';
 const visible=items.filter(x=>x.list===tab).sort((a,b)=>b.updatedAt-a.updatedAt);
 const box=$('#items');box.replaceChildren();
 if(!visible.length){const p=document.createElement('p');p.className='empty';p.textContent=tab==='done'?'산 물건이 아직 없어요.':tab==='want'?'사고 싶은 것을 담아보세요.':'필요한 것을 담아보세요.';box.append(p);return;}
 for(const item of visible){
  const card=document.createElement('article');card.className='card';card.dataset.id=item.id;
  const buttons=item.list==='done'?'<button data-action="restore" class="primary">↶ 되돌리기</button>':`<button data-action="done" class="primary">✓ 샀음</button><button data-action="move">${item.list==='buy'?'♡ 사고 싶지':'＋ 사야 하지'}</button>`;
  card.innerHTML=`<div class="card-row"><span class="item-name"></span></div><span class="meta"></span><div class="actions">${buttons}<button data-action="edit">수정</button><button data-action="delete" class="danger">삭제</button></div>`;
  card.querySelector('.item-name').textContent=item.name;
  card.querySelector('.meta').textContent=[item.price,item.note].filter(Boolean).join(' · ');
  if(item.link&&C.safeLink(item.link)){const a=document.createElement('a');a.textContent=' 링크 ↗';a.href=item.link;a.target='_blank';a.rel='noopener noreferrer';card.querySelector('.meta').append(a);}
  if(editing===item.id){const form=document.createElement('form');form.className='edit';form.innerHTML='<input name="name" aria-label="물건 이름" maxlength="100" required><input name="price" aria-label="예상 가격" placeholder="가격 (선택)"><input name="link" aria-label="상품 링크" placeholder="링크 (선택)"><textarea name="note" aria-label="메모" placeholder="메모 (선택)"></textarea><button type="submit">수정 반영</button>';
   for(const k of ['name','price','link','note'])form.elements[k].value=item[k];card.append(form);
  }
  box.append(card);
 }
}
async function mutate(op,successMessage=''){if(busy)return;busy=true;try{await op();items=await S.all();render();status(successMessage);}catch(e){status('저장 실패: '+e.message);}finally{busy=false;}}
const ready=(async()=>{try{items=await S.all();render();}catch(e){status('저장 실패: '+e.message);$('#add').disabled=true;}})();
w.SajaApp={ready,getItems:()=>items.slice()};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;editing=null;render();});
$('#form').onsubmit=e=>{e.preventDefault();const field=$('#name'),name=C.normalizeName(field.value);if(!name)return;
 const duplicate=items.some(x=>x.list===tab&&C.normalizeName(x.name)===name);
 const item=C.makeItem(name,tab,w.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,Date.now());
 mutate(async()=>{await S.put(item);field.value='';},duplicate?'같은 목록에 이미 있는 이름입니다. 별도 항목으로 추가했습니다.':'');};
$('#items').onclick=e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;
 const card=btn.closest('[data-id]'),item=items.find(x=>x.id===card.dataset.id);if(!item)return;
 const action=btn.dataset.action;
 if(action==='edit'){editing=editing===item.id?null:item.id;render();return;}
 if(action==='delete'){if(!w.confirm(`“${item.name}”을(를) 삭제할까요?`))return;mutate(()=>S.remove(item.id));return;}
 const to=action==='move'?(item.list==='buy'?'want':'buy'):action==='done'?'done':'restore';
 mutate(()=>S.put(C.transition(item,to,Date.now())));
};
$('#items').onsubmit=e=>{if(!e.target.matches('form.edit'))return;e.preventDefault();
 const item=items.find(x=>x.id===e.target.closest('[data-id]').dataset.id),f=e.target.elements;
 const name=C.normalizeName(f.name.value),link=f.link.value.trim();if(!name){status('이름을 입력하세요');return;}
 if(link&&!C.safeLink(link)){status('http 또는 https 링크만 넣을 수 있습니다');return;}
 const updated={...item,name,price:f.price.value.trim(),link,note:f.note.value.trim(),updatedAt:Date.now()};
 mutate(async()=>{await S.put(updated);editing=null;});};
$('#export').onclick=async()=>{try{
 const data=w.SajaBackup.exportBackup(await S.all());
 const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='saja-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 status('백업 파일을 내려받았습니다.',true);
 }catch(e){status('백업 실패: '+e.message,true);}};
$('#import').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>5_000_000)throw Error('파일이 너무 큽니다 (최대 5MB)');
  const raw=JSON.parse(await file.text()),incoming=C.validateBackup(raw),current=await S.all();
  const preview=C.mergeItems(current,incoming);
  status(`가져올 항목 ${incoming.length}개 · 새 항목 ${incoming.length-preview.skipped}개 · 기존과 같은 ID ${preview.skipped}개`,true);
  if(!w.confirm(`백업 ${incoming.length}개 중 새 항목 ${incoming.length-preview.skipped}개를 현재 목록에 합칠까요? 기존 항목은 유지됩니다.`))return;
  const replace=w.confirm('전체 교체를 원하나요?\n확인: 현재 목록을 지우고 백업으로 교체\n취소: 기존 목록과 병합');
  const result=await w.SajaBackup.restoreBackup(raw,replace?'replace':'merge',S);
  items=await S.all();render();status(`복원 완료: ${result.total}개 (건너뜀 ${result.skipped}개)`,true);
 }catch(err){status('복원 실패: '+err.message,true);}finally{e.target.value='';}};
if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('sw.js').catch(()=>{});
})(window);
