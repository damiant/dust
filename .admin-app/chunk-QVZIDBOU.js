import{a as J}from"./chunk-QTBNLBDF.js";import{a as H}from"./chunk-OF25KEPG.js";import{a as G}from"./chunk-S6IHJUHU.js";import{z}from"./chunk-3H2U6HXL.js";import{$ as C,A as h,Aa as p,B as _,Ba as g,Kb as R,P as w,Pb as A,Qb as B,S as r,Sa as V,T as I,X as S,Xa as $,Xb as F,bc as O,cc as M,da as d,dc as Q,ec as j,ga as b,gc as D,ia as U,ja as k,ka as a,la as m,lc as q,ma as u,mc as N,nc as W,oa as x,pa as v,qa as y,rb as L,wa as P,xa as E,ya as T}from"./chunk-PNZTRGP7.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as c}from"./chunk-LNJ3S2LQ.js";var Y=["fileUpload"],Z=(s,n)=>n.name;function ee(s,n){if(s&1&&(u(0,"ion-progress-bar",9),a(1,"ion-text"),p(2),m(),u(3,"app-spinner"),a(4,"div",10),u(5,"img",11),m()),s&2){let e=y();d("value",e.progress),r(2),g(e.importing),r(3),d("src",e.url,w)}}function te(s,n){if(s&1){let e=x();a(0,"div",12)(1,"ion-button",13),v("click",function(){h(e);let i=y(2);return _(i.doImport())}),p(2,"Import from CSV"),m()()}}function ie(s,n){if(s&1&&(a(0,"ion-item")(1,"ion-label")(2,"h3"),p(3),m(),a(4,"p"),p(5),m()()()),s&2){let e=n.$implicit;r(3),g(e.name),r(2),g(e.description)}}function ne(s,n){if(s&1&&(a(0,"div",7),C(1,te,3,0,"div",12),a(2,"ion-list"),U(3,ie,6,2,"ion-item",null,Z),m()()),s&2){let e=y();r(),b(e.isSafari?1:-1),r(2),k(e.camps)}}var f=class f{constructor(n,e){this.api=n;this.location=e;this.vanity="";this.isAdmin=!1;this.busy=!1;this.camps=[];this.title="Import";this.importing="";this.progress=0;this.isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);this.url=""}ngOnInit(){this.isAdmin=this.api.lastRoleResponse=="festival",this.isAdmin&&this.fileUpload.nativeElement.click()}doImport(){this.fileUpload.nativeElement.click()}onFileSelected(n){return c(this,null,function*(){let e=n.target.files[0];if(!e)return;let t=new FileReader;t.onload=i=>c(this,null,function*(){var l;let o=(l=i.target)==null?void 0:l.result;yield this.parseCSV(o);try{this.fileUpload.nativeElement.target&&(this.fileUpload.nativeElement.target.value="")}catch(X){console.info(X)}}),t.readAsText(e)})}parseCSV(n){return c(this,null,function*(){let e=J(n);console.info(e),this.camps=[];let t=this.mapColumns(e);if(t){for(let i of e){let o=yield this.importCamp(i,t);!!o.name&&this.camps.push(o)}this.camps=this.camps.sort((i,o)=>i.name>o.name?1:-1),this.title=`Import ${this.camps.length} camps`}})}import(){return c(this,null,function*(){this.busy=!0,this.title="Importing...";let n=0,e=0,t=this.camps.length;for(;this.camps.length>0;){let i;try{if(e++,i=this.camps.pop(),i){let o=i.imageUrl;i.imageUrl=void 0,this.importing=i.name,this.progress=e/t;let l=yield this.api.addCamp(i,!0);if(n++,o&&l.id){i.id=l.id;try{yield this.importImage(o,i)}catch{console.error(`Unable to import image for camp ${i.name}: ${o}`)}}}}catch{console.error(`Failed to import ${i==null?void 0:i.name}: ${i==null?void 0:i.description}`)}}this.api.sendMessage(`Imported ${n} of ${e} camps.`),this.busy=!1,this.api.clearCache(),this.location.back()})}toUrl(n){let e=!1,t="";for(let i of n)if(i=="(")e=!0;else if(i==")")if(e=!1,t.length<3)t="";else return t;else e&&(t+=i);return t}importImage(n,e){return c(this,null,function*(){let t=this.toUrl(n),o=yield(yield fetch(t)).blob(),l=yield H(o,{quality:75,width:300});this.url=URL.createObjectURL(l),e.imageUrl=yield this.api.setImage(l,e.id),yield this.api.addCamp(e,!0)})}mapColumns(n){if(n.length==0)return;let e=n[0],t={pin:"",name:"",id:void 0,camp_type:"Theme Camp"};for(let i of Object.keys(e)){let o=i.toLowerCase();o.includes("name")&&!t.name&&(t.name=i),o.includes("description")&&(t.description=i),(o=="type"||o=="camp type"||o=="camptype")&&(t.camp_type=i),o.includes("image")&&(t.image=i),o.includes("logo")&&(t.logo=i),o.includes("email")&&(t.contact_email=i),(o.includes("#")||o=="id")&&(t.externalId=i)}return console.log("map",t),t}importCamp(n,e){return c(this,null,function*(){let t=yield this.api.getCamp(void 0);t.name=n[e.name],e.description?t.description=n[e.description]:t.description=`Details on ${t.name} coming soon...`,e.externalId&&(t.externalId=n[e.externalId]),e.camp_type&&(t.camp_type=n[e.camp_type]),e.contact_email&&(t.contact_email=n[e.contact_email]);let i=e.image,o=e.logo;return i&&(t.imageUrl=n[i]),o&&this.isBlank(t.imageUrl)&&(t.imageUrl=n[o]),t})}isBlank(n){return!n||n.trim()==""}};f.\u0275fac=function(e){return new(e||f)(I(z),I(V))},f.\u0275cmp=S({type:f,selectors:[["app-import"]],viewQuery:function(e,t){if(e&1&&P(Y,7),e&2){let i;E(i=T())&&(t.fileUpload=i.first)}},inputs:{vanity:"vanity"},decls:14,vars:5,consts:[["fileUpload",""],["color","primary"],["slot","start"],["routerLink","../"],["slot","end",3,"hidden"],[3,"click","disabled"],[3,"fullscreen"],[1,"border"],["type","file",1,"file-input",3,"change"],[3,"value"],[1,"ion-text-center","vcenter"],[2,"border-radius","2rem",3,"src"],[1,"ion-text-center"],[3,"click"]],template:function(e,t){if(e&1){let i=x();a(0,"ion-header")(1,"ion-toolbar",1)(2,"ion-buttons",2),u(3,"ion-back-button"),m(),a(4,"ion-title",3),p(5),m(),a(6,"ion-buttons",4)(7,"ion-button",5),v("click",function(){return h(i),_(t.import())}),p(8,"Import"),m()()()(),a(9,"ion-content",6),C(10,ee,6,3)(11,ne,5,1,"div",7),a(12,"input",8,0),v("change",function(l){return h(i),_(t.onFileSelected(l))}),m()()}e&2&&(r(5),g(t.title),r(),d("hidden",t.camps.length===0),r(),d("disabled",t.busy),r(2),d("fullscreen",!0),r(),b(t.busy?10:11))},dependencies:[D,q,A,j,Q,M,R,B,F,O,N,W,$,L,G],encapsulation:2});var K=f;export{K as ImportPage};
