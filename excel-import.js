// FITCORE v2 — Excel import module. Lazy-loaded only for admins.
(() => {
  const EXCELJS_CDN = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  const state = {
    busy: false,
    busyText: '',
    file: null,
    fileName: '',
    fileHash: '',
    rows: [],
    issues: [],
    decisions: {},
    aliases: [],
    parseWarnings: [],
    result: null,
  };

  function esc(v) {
    try { return escapeHtml(v); } catch { return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  }
  function rerender() { try { render(); } catch (e) { console.error(e); } }
  function xl(uz, ru) {
    try { return (window.fitcoreGetLang?.() === 'ru') ? ru : uz; } catch { return uz; }
  }
  function norm(v) {
    return String(v ?? '').trim().toLocaleLowerCase('uz')
      .replace(/[ʻʼ’`]/g, "'").replace(/\s+/g, ' ');
  }
  function pathKey(parts) { return (parts || []).map(norm).filter(Boolean).join('\u001f'); }
  function parentKey(v) { return v === null || v === undefined ? '' : String(v); }

  function levenshtein(a, b) {
    a = norm(a); b = norm(b);
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = Array.from({length: b.length + 1}, (_,i) => i);
    const cur = new Array(b.length + 1);
    for (let i=1;i<=a.length;i++) {
      cur[0]=i;
      for (let j=1;j<=b.length;j++) cur[j]=Math.min(cur[j-1]+1, prev[j]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1));
      for (let j=0;j<=b.length;j++) prev[j]=cur[j];
    }
    return prev[b.length];
  }
  function similarity(a,b) {
    const aa=norm(a), bb=norm(b); if (!aa && !bb) return 1;
    return 1 - levenshtein(aa,bb) / Math.max(aa.length,bb.length,1);
  }

  function ensureExcelJS() {
    if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
    if (window.__fitcoreExcelJsPromise) return window.__fitcoreExcelJsPromise;
    window.__fitcoreExcelJsPromise = new Promise((resolve,reject) => {
      const sc=document.createElement('script'); sc.src=EXCELJS_CDN; sc.async=true;
      sc.onload=()=>window.ExcelJS?resolve(window.ExcelJS):reject(new Error(xl('ExcelJS yuklanmadi','ExcelJS не загрузился')));
      sc.onerror=()=>reject(new Error(xl('ExcelJS CDN bilan ulanishda xato','Ошибка подключения к ExcelJS CDN')));
      document.head.appendChild(sc);
    });
    return window.__fitcoreExcelJsPromise;
  }

  function categoryPath(cat) {
    const out=[]; let cur=cat; const seen=new Set();
    while (cur && !seen.has(String(cur.id))) {
      seen.add(String(cur.id)); out.unshift(cur);
      cur=categories.find(c => String(c.id) === String(cur.parentId));
    }
    return out;
  }
  function allCategoryPaths() {
    return categories.map(c => categoryPath(c)).filter(p => p.length).sort((a,b)=>
      a.map(x=>x.name).join(' / ').localeCompare(b.map(x=>x.name).join(' / '),'uz'));
  }

  async function downloadTemplate() {
    state.busy=true; state.busyText=xl('Excel shablon tayyorlanmoqda...','Подготавливается шаблон Excel...'); rerender();
    try {
      const ExcelJS=await ensureExcelJS();
      const wb=new ExcelJS.Workbook();
      wb.creator='FITCORE'; wb.created=new Date();
      const paths=allCategoryPaths();
      const maxExistingDepth=Math.max(1,...paths.map(p=>p.length));
      const depth=Math.min(10, Math.max(6, maxExistingDepth+2));
      const catHeaders=['Bosh katalog', ...Array.from({length:depth-1},(_,i)=>`Katalog${i+1}`)];
      const headers=['NO',...catHeaders,'Tovar nomi','Tovar nomi RU (ixtiyoriy)','Tovar narxi','Eski narxi','Soni','Izohi','Izohi RU (ixtiyoriy)','O\'lchami','Rang'];

      const ws=wb.addWorksheet('Tovarlar',{views:[{state:'frozen',ySplit:1,xSplit:1}]});
      ws.addRow(headers);
      ws.getRow(1).height=28;
      ws.getRow(1).eachCell(cell=>{
        cell.font={bold:true,color:{argb:'FFFFFFFF'}};
        cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1E3A5F'}};
        cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};
      });
      const widths=[7,...catHeaders.map(()=>20),28,28,16,16,12,32,32,24,42];
      widths.forEach((w,i)=>ws.getColumn(i+1).width=w);

      // 1000 rows: left-side category cells may be blank; importer inherits last path.
      for (let r=2;r<=1001;r++) {
        ws.getCell(r,1).value=r-1;
        ws.getCell(r,1).alignment={horizontal:'center'};
      }
      ws.autoFilter={from:{row:1,column:1},to:{row:1001,column:headers.length}};

      // Examples that match the new universal variant format.
      const firstProductCol=2+catHeaders.length;
      const ex1=['Sport ozuqalari','Protein','Whey',...Array(depth-3).fill(''),'Whey protein','',250000,350000,15,'Zo\'r protein','','',''];
      const ex2=['Kiyimlar','Erkaklar kiyimlari','Ustki kiyimlar','Futbolka',...Array(Math.max(0,depth-4)).fill(''),'Futbolka','',50000,150000,'','Oq/qora futbolka','','48/50/52',"48,Qizil-1,Qora-1/50,Qizil-3,Ko'k-3/52,Qora-15,Oq-2"];
      const ex3=[...Array(depth).fill(''),'Adidas futbolka','',70000,'',8,'Chapdagi kataloglar bo\'sh — yuqoridagi Futbolka katalogiga tushadi','','48,3/50,5',''];
      [ex1,ex2,ex3].forEach((arr,idx)=>{
        const row=ws.getRow(2+idx);
        // arr excludes NO; write starting col 2
        arr.forEach((v,j)=>row.getCell(2+j).value=v);
      });

      // Visible canonical catalogue sheet.
      const cats=wb.addWorksheet('Kataloglar',{views:[{state:'frozen',ySplit:1}]});
      const catSheetHeaders=['To\'liq katalog yo\'li',...catHeaders,'Ruscha nomi (mavjud bo\'lsa)'];
      cats.addRow(catSheetHeaders);
      cats.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF334155'}};});
      for (const p of paths) {
        const row=[p.map(x=>x.name).join(' / '),...Array.from({length:depth},(_,i)=>p[i]?.name||''),p[p.length-1]?.nameRu||''];
        cats.addRow(row);
      }
      cats.getColumn(1).width=52; for(let i=2;i<=depth+1;i++)cats.getColumn(i).width=21; cats.getColumn(depth+2).width=28;

      // Hidden dictionary supplies dropdowns per depth. Manual new names are still allowed.
      const dict=wb.addWorksheet("Lug'at");
      for(let d=0;d<depth;d++){
        const names=[...new Set(paths.map(p=>p[d]?.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uz'));
        dict.getCell(1,d+1).value=catHeaders[d];
        names.forEach((n,i)=>dict.getCell(i+2,d+1).value=n);
        const colLetter=dict.getColumn(d+1).letter;
        if(names.length){
          for(let r=2;r<=1001;r++){
            ws.getCell(r,2+d).dataValidation={
              type:'list', allowBlank:true, showErrorMessage:false,
              formulae:[`'Lug\'at'!$${colLetter}$2:$${colLetter}$${names.length+1}`]
            };
          }
        }
      }
      dict.state='veryHidden';

      // Number validations.
      const priceCol=firstProductCol+2, oldPriceCol=firstProductCol+3, stockCol=firstProductCol+4;
      for(let r=2;r<=1001;r++){
        ws.getCell(r,priceCol).dataValidation={type:'decimal',operator:'greaterThanOrEqual',formulae:[0],allowBlank:true};
        ws.getCell(r,oldPriceCol).dataValidation={type:'decimal',operator:'greaterThanOrEqual',formulae:[0],allowBlank:true};
        ws.getCell(r,stockCol).dataValidation={type:'whole',operator:'greaterThanOrEqual',formulae:[0],allowBlank:true};
      }

      const guide=wb.addWorksheet("Qo'llanma");
      guide.columns=[{width:28},{width:85}];
      guide.addRows([
        ['QOIDA','TUSHUNTIRISH'],
        ['Katalogni takrorlamang','Bir xil katalogdagi keyingi tovarlarda chapdagi katalog ustunlarini bo\'sh qoldiring. Tizim yuqoridagi oxirgi katalog yo\'lini davom ettiradi.'],
        ['Mavjud katalog','Dropdown orqali tanlash tavsiya qilinadi. Qo\'lda yozsangiz ham import oldidan xato/yaqin nom tekshiriladi.'],
        ['Yangi katalog','Dropdownda yo\'q nomni qo\'lda yozish mumkin. Import previewda alohida tasdiqlamaguningizcha yangi katalog yaratilmaydi.'],
        ['Oddiy tovar','O\'lcham va Rang bo\'sh. Soni ustuniga umumiy qoldiq yoziladi.'],
        ['Faqat o\'lcham','O\'lchami: 48,2/50,5/52,17. Rang bo\'sh.'],
        ['Faqat rang','Rang: Qizil-3/Qora-2. O\'lchami bo\'sh.'],
        ['O\'lcham + rang',"O'lchami: 48/50/52. Rang: 48,Qizil-1,Qora-1/50,Qizil-3,Ko'k-3/52,Qora-15,Oq-2. Umumiy Soni avtomatik hisoblanadi."],
        ['Rasm','Excel orqali rasm yuklanmaydi. Importdan keyin “rasmi yo\'q” tovarlarga admin qo\'lda rasm qo\'yadi.'],
        ['Ruscha matn','RU nom/izoh ixtiyoriy. Kiritilmasa ruscha rejimda o\'zbekcha original ko\'rsatiladi.'],
      ]);
      guide.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F766E'}};});
      guide.eachRow(r=>{r.alignment={vertical:'top',wrapText:true};});

      const buffer=await wb.xlsx.writeBuffer();
      const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url=URL.createObjectURL(blob); const a=document.createElement('a');
      a.href=url; a.download='FITCORE_tovar_import_shablon.xlsx'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    } catch(e) {
      console.error(e); alert(xl('❌ Excel shablonni yaratishda xatolik: ','❌ Ошибка создания шаблона Excel: ')+(e.message||e));
    } finally { state.busy=false; state.busyText=''; rerender(); }
  }

  function cellText(cell) {
    const v=cell?.value;
    if(v===null||v===undefined)return '';
    if(typeof v==='object'){
      if(Array.isArray(v.richText))return v.richText.map(x=>x.text||'').join('');
      if('result' in v && v.result!==undefined)return String(v.result??'');
      if('text' in v)return String(v.text??'');
      if('hyperlink' in v && v.text)return String(v.text);
    }
    return String(v).trim();
  }
  function numValue(v) {
    if(typeof v==='number')return v;
    const s=String(v??'').replace(/\s/g,'').replace(/,/g,'.').replace(/[^0-9.\-]/g,'');
    const n=Number(s); return Number.isFinite(n)?n:NaN;
  }
  function parseVariants(sizeText,colorText) {
    try { return parseVariantInputs(sizeText,colorText,0); } catch {}
    return [];
  }
  async function sha256(file) {
    const buf=await file.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',buf);
    return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  function buildCategoryMaps() {
    const byParent=new Map();
    for(const c of categories){
      const k=parentKey(c.parentId);
      if(!byParent.has(k))byParent.set(k,[]);
      byParent.get(k).push(c);
    }
    const byId=new Map(categories.map(c=>[String(c.id),c]));
    const aliasMap=new Map((state.aliases||[]).map(a=>[`${parentKey(a.parent_category_id)}|${norm(a.alias_normalized)}`,String(a.target_category_id)]));
    return {byParent,byId,aliasMap};
  }

  function analyzeIssues(rows) {
    const {byParent,byId,aliasMap}=buildCategoryMaps();
    const issues=new Map();
    const paths=[...new Map(rows.map(r=>[pathKey(r.categoryPath),r.categoryPath])).values()];

    for(const rawPath of paths){
      let parentId=null; let virtualParent=null;
      for(let i=0;i<rawPath.length;i++){
        const rawName=rawPath[i]; const rawPrefix=rawPath.slice(0,i+1); const key=pathKey(rawPrefix);
        const decision=state.decisions[key];
        if(decision){
          if(decision.type==='existing'){ parentId=String(decision.targetCategoryId); virtualParent=null; }
          else { virtualParent='new:'+key; parentId=null; }
          continue;
        }
        if(virtualParent){
          issues.set(key,{key,type:'NEW',rawName,rawPath:rawPrefix,parentId:null,parentVirtual:virtualParent});
          virtualParent='new:'+key; parentId=null; continue;
        }
        const siblings=byParent.get(parentKey(parentId))||[];
        const exact=siblings.find(c=>norm(c.name)===norm(rawName));
        if(exact){ parentId=String(exact.id); continue; }
        const aliasTarget=aliasMap.get(`${parentKey(parentId)}|${norm(rawName)}`);
        if(aliasTarget && byId.get(aliasTarget)){ parentId=aliasTarget; continue; }
        let best=null,score=0;
        for(const c of siblings){const sc=similarity(rawName,c.name);if(sc>score){score=sc;best=c;}}
        if(best && score>=0.82){
          issues.set(key,{key,type:'TYPO',rawName,rawPath:rawPrefix,parentId,targetCategoryId:String(best.id),targetName:best.name,score});
          // tentative suggestion so child levels can still be checked
          parentId=String(best.id);
        }else{
          issues.set(key,{key,type:'NEW',rawName,rawPath:rawPrefix,parentId});
          virtualParent='new:'+key; parentId=null;
        }
      }
    }
    state.issues=[...issues.values()];
  }

  function resolveCanonicalPath(rawPath) {
    const {byParent,byId,aliasMap}=buildCategoryMaps();
    let parentId=null; let virtualParent=false; const canonical=[]; const newPaths=[]; const aliases=[];
    for(let i=0;i<rawPath.length;i++){
      const rawName=rawPath[i]; const key=pathKey(rawPath.slice(0,i+1)); const decision=state.decisions[key];
      if(decision?.type==='existing'){
        const target=byId.get(String(decision.targetCategoryId));
        if(!target)throw new Error(`Katalog topilmadi: ${decision.targetName||rawName}`);
        canonical.push(target.name);
        if(!virtualParent && norm(rawName)!==norm(target.name)) aliases.push({alias:rawName,parentCategoryId:parentId,targetCategoryId:String(target.id)});
        parentId=String(target.id); virtualParent=false; continue;
      }
      if(decision?.type==='new'){
        canonical.push(rawName); newPaths.push([...canonical]); parentId=null; virtualParent=true; continue;
      }
      if(virtualParent)throw new Error(`Yangi katalog tasdiqlanmagan: ${rawName}`);
      const siblings=byParent.get(parentKey(parentId))||[];
      const exact=siblings.find(c=>norm(c.name)===norm(rawName));
      if(exact){canonical.push(exact.name);parentId=String(exact.id);continue;}
      const aliasTarget=aliasMap.get(`${parentKey(parentId)}|${norm(rawName)}`);
      const aliasCat=aliasTarget?byId.get(aliasTarget):null;
      if(aliasCat){canonical.push(aliasCat.name);parentId=String(aliasCat.id);continue;}
      throw new Error(`Katalog qarori yetishmaydi: ${rawName}`);
    }
    return {canonical,newPaths,aliases};
  }

  async function handleFile(event) {
    const file=event?.target?.files?.[0]; if(!file)return;
    state.busy=true;state.busyText=xl('Excel tekshirilmoqda...','Excel проверяется...');state.result=null;rerender();
    try{
      const ExcelJS=await ensureExcelJS();
      const aliasPromise=callApi('get_category_aliases',{}).catch(()=>({aliases:[]}));
      const [hash,arrayBuffer,aliasData]=await Promise.all([sha256(file),file.arrayBuffer(),aliasPromise]);
      state.aliases=aliasData.aliases||[]; state.file=file; state.fileName=file.name; state.fileHash=hash;
      const wb=new ExcelJS.Workbook(); await wb.xlsx.load(arrayBuffer);
      const ws=wb.getWorksheet('Tovarlar')||wb.worksheets[0]; if(!ws)throw new Error(xl("Excel ichida Tovarlar varag'i topilmadi",'В Excel не найден лист Tovarlar'));

      const headerMap=new Map();
      ws.getRow(1).eachCell((cell,col)=>{headerMap.set(norm(cellText(cell)),col);});
      const catCols=[];
      for(const [h,col] of headerMap.entries()){
        if(h==='bosh katalog')catCols.push({depth:0,col});
        else {const m=h.match(/^katalog\s*(\d+)$/);if(m)catCols.push({depth:Number(m[1]),col});}
      }
      catCols.sort((a,b)=>a.depth-b.depth);
      if(!catCols.length)throw new Error(xl('Bosh katalog / Katalog1 ustunlari topilmadi','Не найдены столбцы Bosh katalog / Katalog1'));
      const findCol=(...names)=>{for(const n of names){const c=headerMap.get(norm(n));if(c)return c;}return null;};
      const cols={
        name:findCol('Tovar nomi'), nameRu:findCol('Tovar nomi RU (ixtiyoriy)','Tovar nomi RU'),
        price:findCol('Tovar narxi','Narxi'), oldPrice:findCol('Eski narxi'), stock:findCol('Soni'),
        desc:findCol('Izohi','Izoh'), descRu:findCol('Izohi RU (ixtiyoriy)','Izohi RU','Izoh RU'),
        size:findCol("O'lchami","O‘lchami"), color:findCol('Rang')
      };
      if(!cols.name||!cols.price)throw new Error(xl('Tovar nomi yoki Tovar narxi ustuni topilmadi','Не найден столбец названия или цены товара'));

      let lastPath=[]; const rows=[]; const warnings=[];
      for(let r=2;r<=ws.rowCount;r++){
        const row=ws.getRow(r); const catVals=catCols.map(x=>cellText(row.getCell(x.col)));
        const anyCat=catVals.some(Boolean); let effective;
        if(!anyCat) effective=[...lastPath];
        else{
          const deepest=catVals.reduce((m,v,i)=>v?i:m,-1); effective=[...lastPath];
          for(let i=0;i<=deepest;i++){if(catVals[i])effective[i]=catVals[i]; else if(!effective[i])effective[i]='';}
          effective=effective.slice(0,deepest+1).filter(Boolean); lastPath=[...effective];
        }
        const name=cellText(row.getCell(cols.name));
        const priceRaw=cellText(row.getCell(cols.price));
        const other=[cols.stock,cols.desc,cols.size,cols.color].filter(Boolean).map(c=>cellText(row.getCell(c))).join('');
        if(!name && !priceRaw && !other)continue;
        if(!name){warnings.push(xl(`Qator ${r}: tovar nomi yo'q`,`Строка ${r}: нет названия товара`));continue;}
        const price=numValue(row.getCell(cols.price).value); if(!Number.isFinite(price)){warnings.push(xl(`Qator ${r}: narx noto'g'ri`,`Строка ${r}: неверная цена`));continue;}
        const oldPrice=cols.oldPrice?numValue(row.getCell(cols.oldPrice).value):NaN;
        const stock=cols.stock?numValue(row.getCell(cols.stock).value):0;
        const sizeText=cols.size?cellText(row.getCell(cols.size)):'';
        const colorText=cols.color?cellText(row.getCell(cols.color)):'';
        const variants=parseVariants(sizeText,colorText);
        const finalStock=variants.length?variants.reduce((s,v)=>s+(Number(v.qty)||0),0):(Number.isFinite(stock)?Math.max(0,Math.trunc(stock)):0);
        rows.push({
          excelRow:r,categoryPath:effective,name,nameRu:cols.nameRu?cellText(row.getCell(cols.nameRu)):'',price,
          oldPrice:Number.isFinite(oldPrice)?oldPrice:null,stock:finalStock,desc:cols.desc?cellText(row.getCell(cols.desc)):'',
          descRu:cols.descRu?cellText(row.getCell(cols.descRu)):'',variants,sizeText,colorText
        });
      }
      if(!rows.length)throw new Error(xl('Import qilinadigan tovar topilmadi','Товары для импорта не найдены'));
      state.rows=rows;state.parseWarnings=warnings;state.decisions={};analyzeIssues(rows);
    }catch(e){console.error(e);alert(xl("❌ Excelni o'qishda xatolik: ",'❌ Ошибка чтения Excel: ')+(e.message||e));state.rows=[];state.issues=[];}
    finally{state.busy=false;state.busyText='';rerender();}
  }

  function acceptSuggestion(key) {
    const issue=state.issues.find(x=>x.key===key); if(!issue||!issue.targetCategoryId)return;
    state.decisions[key]={type:'existing',targetCategoryId:issue.targetCategoryId,targetName:issue.targetName};
    analyzeIssues(state.rows);rerender();
  }
  function approveNew(key) {
    const issue=state.issues.find(x=>x.key===key); if(!issue)return;
    state.decisions[key]={type:'new',name:issue.rawName}; analyzeIssues(state.rows);rerender();
  }
  function reset() {
    Object.assign(state,{busy:false,busyText:'',file:null,fileName:'',fileHash:'',rows:[],issues:[],decisions:{},parseWarnings:[],result:null});rerender();
  }

  async function doImport() {
    if(!state.rows.length)return alert(xl('Avval Excel faylni tanlang.','Сначала выберите файл Excel.'));
    analyzeIssues(state.rows);
    if(state.issues.length)return alert(`⚠️ ${state.issues.length} ${xl('ta katalog masalasini avval hal qiling.','вопросов по каталогам: сначала решите их.')}`);
    state.busy=true;state.busyText=xl('Tovarlar import qilinmoqda...','Товары импортируются...');state.result=null;rerender();
    let batchId=null;
    try{
      const prepared=[]; const approvedMap=new Map(); const aliasMap=new Map();
      for(const r of state.rows){
        const resolved=resolveCanonicalPath(r.categoryPath);
        for(const p of resolved.newPaths)approvedMap.set(pathKey(p),p);
        for(const a of resolved.aliases)aliasMap.set(`${parentKey(a.parentCategoryId)}|${norm(a.alias)}`,a);
        prepared.push({categoryPath:resolved.canonical,name:r.name,nameRu:r.nameRu||null,price:r.price,oldPrice:r.oldPrice,stock:r.stock,desc:r.desc,descRu:r.descRu||null,variants:r.variants});
      }
      const chunks=[];for(let i=0;i<prepared.length;i+=100)chunks.push(prepared.slice(i,i+100));
      const started=await callApi('start_import_batch',{fileName:state.fileName,fileHash:state.fileHash,totalRows:prepared.length});
      batchId=Number(started.batchId);
      if(!batchId)throw new Error('import_batch_start_failed');
      let imported=0; const createdCats=[]; const importedProducts=[];
      for(let i=0;i<chunks.length;i++){
        const data=await callApi('bulk_import_products',{
          rows:chunks[i],approvedNewPaths:[...approvedMap.values()],aliases:[...aliasMap.values()],
          batchId,isFinal:i===chunks.length-1
        });
        batchId=data.batchId; imported+=Number(data.imported)||0;
        (data.categories||[]).forEach(c=>{createdCats.push(c);try{upsertLocalCategory(c);}catch{}});
        (data.products||[]).forEach(p=>{importedProducts.push(p);try{upsertLocalProduct(p);}catch{}});
      }
      try{saveCatalogCache();}catch{}
      state.result={ok:true,batchId,imported,createdCategories:createdCats.length,rasmsiz:importedProducts.filter(p=>!p.img).length};
    }catch(e){
      console.error(e);
      if(batchId){try{await callApi('rollback_import_batch',{batchId});}catch(re){console.error('auto rollback failed',re);}}
      state.result={ok:false,batchId,error:e.message||String(e),rolledBack:!!batchId};
    }finally{state.busy=false;state.busyText='';rerender();}
  }

  async function rollbackBatch() {
    const id=state.result?.batchId; if(!id)return;
    if(!confirm(xl(`Import #${id} bekor qilinsinmi? Shu importdagi tovarlar o'chiriladi.`,`Отменить импорт #${id}? Товары из этого импорта будут удалены.`)))return;
    state.busy=true;state.busyText=xl('Import bekor qilinmoqda...','Импорт отменяется...');rerender();
    try{await callApi('rollback_import_batch',{batchId:id});state.result={...state.result,rolledBack:true,ok:false,error:xl('Import admin tomonidan bekor qilindi','Импорт отменён администратором')};await loadCatalog();}
    catch(e){alert(xl('❌ Bekor qilishda xato: ','❌ Ошибка отмены: ')+(e.message||e));}
    finally{state.busy=false;state.busyText='';rerender();}
  }

  function renderModal() {
    const issueHtml=state.issues.map(issue=>{
      if(issue.type==='TYPO')return `
        <div class="border border-amber-300 bg-amber-50 rounded-2xl p-3 space-y-2">
          <p class="font-bold text-amber-900">⚠️ ${xl("O'xshash katalog topildi",'Найден похожий каталог')}</p>
          <p><b>${esc(issue.rawName)}</b> → <b class="text-blue-700">${esc(issue.targetName)}</b> <span class="text-gray-400">(${Math.round(issue.score*100)}%)</span></p>
          <p class="text-[10px] text-gray-500">${xl("Yo'l",'Путь')}: ${esc(issue.rawPath.join(' / '))}</p>
          <div class="flex gap-2"><button onclick="FitcoreExcel.acceptSuggestion('${issue.key}')" class="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold">✅ ${xl('Mavjud katalog','Существующий каталог')}</button><button onclick="FitcoreExcel.approveNew('${issue.key}')" class="flex-1 bg-white border border-amber-400 text-amber-800 py-2 rounded-xl font-bold">➕ ${xl('Yangi yaratish','Создать новый')}</button></div>
        </div>`;
      return `
        <div class="border border-blue-200 bg-blue-50 rounded-2xl p-3 space-y-2">
          <p class="font-bold text-blue-900">🆕 ${xl('Yangi katalog topildi','Найден новый каталог')}</p>
          <p><b>${esc(issue.rawName)}</b></p><p class="text-[10px] text-gray-500">${xl("Yo'l",'Путь')}: ${esc(issue.rawPath.join(' / '))}</p>
          <button onclick="FitcoreExcel.approveNew('${issue.key}')" class="w-full bg-blue-600 text-white py-2 rounded-xl font-bold">✅ ${xl('Yangi katalog sifatida tasdiqlash','Подтвердить как новый каталог')}</button>
        </div>`;
    }).join('');
    const uniquePaths=new Set(state.rows.map(r=>pathKey(r.categoryPath))).size;
    return `
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3" onclick="activePopupModal=null; render();">
        <div class="bg-white rounded-3xl p-4 max-w-md w-full max-h-[94vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between border-b pb-2"><div><h3 class="font-black text-base">📊 ${xl('Excel orqali tovar importi','Импорт товаров из Excel')}</h3><p class="text-[10px] text-gray-400">${xl('Xavfsiz preview + katalog typo tekshiruvi','Безопасный предпросмотр + проверка опечаток каталогов')}</p></div><button onclick="activePopupModal=null;render();" class="bg-gray-100 rounded-xl px-3 py-1.5 font-bold">✕</button></div>
          ${state.busy?`<div class="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center"><div class="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><b>${esc(state.busyText||xl('Bajarilmoqda...','Выполняется...'))}</b></div>`:''}
          <div class="grid grid-cols-2 gap-2">
            <button onclick="FitcoreExcel.downloadTemplate()" ${state.busy?'disabled':''} class="bg-slate-900 text-white font-bold py-2.5 rounded-xl">📥 ${xl('Yangi shablon','Новый шаблон')}</button>
            <label class="bg-blue-600 text-white font-bold py-2.5 rounded-xl text-center cursor-pointer ${state.busy?'opacity-50':''}" >📤 ${xl('Excel tanlash','Выбрать Excel')}<input type="file" accept=".xlsx" class="hidden" onchange="FitcoreExcel.handleFile(event)" ${state.busy?'disabled':''}></label>
          </div>
          <div class="bg-gray-50 border rounded-2xl p-3 text-[10px] text-gray-600">💡 ${xl("Shablonda mavjud kataloglar <b>Kataloglar</b> varag'ida ko'rinadi va kategoriya ustunlarida dropdown bor. Pastdagi qatorda katalog kataklari bo'sh qolsa, <b>yuqoridagi oxirgi katalog davom etadi</b>.","В шаблоне существующие каталоги видны на листе <b>Kataloglar</b>, а в столбцах категорий есть выпадающие списки. Если в следующей строке каталог пуст, <b>продолжается последний каталог сверху</b>.")}</div>
          ${state.fileName?`<div class="bg-white border rounded-2xl p-3"><b>${xl('Fayl','Файл')}:</b> ${esc(state.fileName)}<br><b>${xl('Tovar','Товар')}:</b> ${state.rows.length} ${xl('ta','шт.')} · <b>${xl("Katalog yo'li",'Пути каталогов')}:</b> ${uniquePaths} ${xl('ta','шт.')} · <b>${xl('Hal qilinmagan katalog','Нерешённые каталоги')}:</b> <span class="${state.issues.length?'text-red-600':'text-green-600'} font-black">${state.issues.length}</span></div>`:''}
          ${state.parseWarnings.length?`<div class="bg-red-50 border border-red-200 rounded-2xl p-3"><b>❌ ${xl('Excel qator xatolari','Ошибки строк Excel')} (${state.parseWarnings.length})</b><div class="mt-1 max-h-24 overflow-y-auto">${state.parseWarnings.slice(0,20).map(x=>`<p>• ${esc(x)}</p>`).join('')}</div></div>`:''}
          ${issueHtml?`<div class="space-y-2"><h4 class="font-black">${xl('Katalog qarorlari','Решения по каталогам')}</h4>${issueHtml}</div>`:''}
          ${state.rows.length && !state.issues.length?`<div class="bg-green-50 border border-green-200 rounded-2xl p-3"><p class="font-bold text-green-800">✅ ${xl('Kataloglar tekshirildi. Importga tayyor.','Каталоги проверены. Готово к импорту.')}</p><p class="text-[10px] text-green-700">${xl("Rasmlar import qilinmaydi; keyin qo'lda qo'shiladi.",'Изображения не импортируются; их можно добавить вручную после импорта.')}</p></div>`:''}
          ${state.result?`<div class="${state.result.ok?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'} border rounded-2xl p-3 space-y-1"><p class="font-black">${state.result.ok?xl('✅ Import tugadi','✅ Импорт завершён'):xl('❌ Import tugamadi','❌ Импорт не завершён')}</p>${state.result.ok?`<p>${state.result.imported} ${xl('ta tovar','товаров')} · ${state.result.createdCategories} ${xl('ta yangi katalog','новых каталогов')} · ${state.result.rasmsiz} ${xl('ta rasmsiz','без изображений')}</p>`:`<p>${esc(state.result.error||xl('Xato','Ошибка'))}</p>`}${state.result.batchId?`<p class="font-mono text-[10px]">Batch #${state.result.batchId}</p>`:''}${state.result.ok&&!state.result.rolledBack?`<button onclick="FitcoreExcel.rollbackBatch()" class="mt-2 w-full bg-red-600 text-white py-2 rounded-xl font-bold">↩️ ${xl('Shu importni bekor qilish','Отменить этот импорт')}</button>`:''}</div>`:''}
          <div class="flex gap-2 pt-1">${state.rows.length?`<button onclick="FitcoreExcel.doImport()" ${state.busy||state.issues.length||state.parseWarnings.length?'disabled':''} class="flex-1 ${state.issues.length||state.parseWarnings.length?'bg-gray-200 text-gray-400':'bg-green-600 text-white'} font-black py-3 rounded-xl">✅ ${state.rows.length} ${xl('ta tovarni import qilish','товаров: импортировать')}</button>`:''}<button onclick="FitcoreExcel.reset()" class="bg-gray-100 text-gray-700 font-bold px-4 py-3 rounded-xl">${xl('Tozalash','Очистить')}</button></div>
        </div>
      </div>`;
  }

  async function prepare(){ return true; }
  window.FitcoreExcel={prepare,renderModal,downloadTemplate,handleFile,acceptSuggestion,approveNew,doImport,rollbackBatch,reset,state};
})();
