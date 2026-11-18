// 产品卡截图切换：没有 JS 时，标签就是指向原图的普通链接；点图片在新标签页打开当前原图。
document.querySelectorAll('[data-shots]').forEach(box=>{
 const img=box.querySelector('img'),open=box.querySelector('.shot-open'),tabs=[...box.querySelectorAll('.shot-tabs a')];
 const warm=()=>tabs.forEach(t=>{const i=new Image();i.decoding='async';i.src=t.href;});
 box.addEventListener('pointerenter',warm,{once:true});box.addEventListener('focusin',warm,{once:true});
 tabs.forEach(tab=>tab.addEventListener('click',event=>{
  event.preventDefault();if(tab.getAttribute('aria-current')==='true')return;
  img.src=tab.href;img.alt=tab.dataset.alt;if(open)open.href=tab.href;
  tabs.forEach(t=>t===tab?t.setAttribute('aria-current','true'):t.removeAttribute('aria-current'));
 }));
});
