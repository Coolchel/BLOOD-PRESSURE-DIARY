(function(root){
  'use strict';
  const XLSX_TYPE='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function resetStoredDiary(storage,diaryKey,preferencesKey,value){
    const keys=Array.isArray(preferencesKey)?preferencesKey:[preferencesKey];
    const previous=keys.map(key=>[key,storage.getItem(key)]);
    try{keys.forEach(key=>storage.removeItem(key));storage.setItem(diaryKey,JSON.stringify(value));}
    catch(error){previous.forEach(([key,saved])=>{if(saved!==null)storage.setItem(key,saved);});throw error;}
  }
  async function saveExcel(name,content,host=root){
    const blob=new Blob([content],{type:XLSX_TYPE});
    if(typeof host.showSaveFilePicker==='function'){
      const handle=await host.showSaveFilePicker({suggestedName:name,types:[{description:'Excel',accept:{[XLSX_TYPE]:['.xlsx']}}],excludeAcceptAllOption:true});
      const stream=await handle.createWritable();
      try{await stream.write(blob);await stream.close();}
      catch(error){await stream.abort().catch(()=>{});throw error;}
      return;
    }
    // Browsers without the file-system picker use their ordinary download handling.
    const url=host.URL.createObjectURL(blob),link=host.document.createElement('a');
    link.href=url;link.download=name;link.hidden=true;host.document.body.append(link);link.click();link.remove();
    host.setTimeout(()=>host.URL.revokeObjectURL(url),60000);
  }
  function localBackups(diary,host=root){
    let pending=Promise.resolve();
    async function request(action,values={}){
      const response=await host.fetch('/api/backup/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({diary,...values})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||'Папка копии недоступна.');
      return result;
    }
    function enqueue(work){const result=pending.then(work);pending=result.catch(()=>{});return result;}
    return {
      sync(copy){return enqueue(()=>request('sync',{copy}));},
      open(copy){return enqueue(()=>request('open',{copy}));},
      reset(commit){return enqueue(async()=>{
        const saved=await request('reset');
        try{commit();}
        catch(error){
          try{await request('rollback',{previous:saved.previous});}
          catch{throw Error('Дневник сохранён, но не удалось вернуть файл копии.');}
          throw error;
        }
      });},
    };
  }
  const api={saveExcel,resetStoredDiary,localBackups};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DiaryFiles=api;
})(typeof window==='object'?window:globalThis);
