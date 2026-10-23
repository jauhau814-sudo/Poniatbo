/* Local browser profiles, not a server authentication boundary. Guest data is retained separately. */
(()=>{
 'use strict';let user=null;
 try{const id=sessionStorage.getItem('schoolSimulatorLocalSessionV1'),users=JSON.parse(localStorage.getItem('schoolSimulatorLocalUsersV1')||'[]');if(Array.isArray(users)){const u=users.find(u=>u.id===id);if(u)user={id:u.id,name:u.name,username:u.username};}}catch{}
 window.SCHOOL_LOCAL_PROFILE=user;
 if(!user)return;
 const rawGet=Storage.prototype.getItem,rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem,prefix='school-profile:'+user.id+':';
 Storage.prototype.getItem=function(k){k=String(k);return rawGet.call(this,this===localStorage&&k.startsWith('school-')?prefix+k:k);};
 Storage.prototype.setItem=function(k,v){k=String(k);return rawSet.call(this,this===localStorage&&k.startsWith('school-')?prefix+k:k,v);};
 Storage.prototype.removeItem=function(k){k=String(k);return rawRemove.call(this,this===localStorage&&k.startsWith('school-')?prefix+k:k);};
})();
