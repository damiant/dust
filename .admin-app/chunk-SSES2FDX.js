import{a as Q}from"./chunk-TGZQ3JYQ.js";import{a as K}from"./chunk-EDLISSJ7.js";import{S as G,d as q}from"./chunk-SZWMGHJI.js";import{D as H,k as z}from"./chunk-3FSCB2FX.js";import"./chunk-MIGJGGKJ.js";import{A as d,B as m,Da as o,Ea as L,Ia as v,Ja as C,Ka as w,Nb as T,S as s,Sb as V,T as g,Tb as N,Ub as O,Va as I,Vb as B,Y as S,_b as W,aa as b,ea as f,ec as A,fc as J,ha as y,hc as U,la as n,ma as i,na as p,ob as M,pa as x,pb as P,pc as D,qa as h,qc as F,ra as c,ub as E,wc as j,xc as R}from"./chunk-JQETABDO.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-2BF6BOWA.js";import"./chunk-OA2QWUMP.js";import"./chunk-3J2H4E5C.js";import"./chunk-KBMMZLX2.js";import"./chunk-5J6JP6Q2.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as k}from"./chunk-LNJ3S2LQ.js";function Y(_,a){if(_&1){let e=x();n(0,"app-tooltip",11)(1,"ion-button",12),h("click",function(){d(e);let t=c(2);return m(t.moveUp())}),p(2,"ion-icon",13),o(3,"Move Up"),i(),o(4,"\xA0 "),i(),n(5,"ion-button",14),h("click",function(){d(e);let t=c(2);return m(t.delete())}),o(6,"Delete"),i(),o(7,"\xA0 ")}if(_&2){let e=c(2);s(),f("disabled",e.busy)}}function Z(_,a){if(_&1){let e=x();n(0,"div",5)(1,"ion-card")(2,"ion-card-content")(3,"ion-list")(4,"ion-item",6)(5,"ion-input",7),w("ngModelChange",function(t){d(e);let r=c();return C(r.link.title,t)||(r.link.title=t),m(t)}),i()(),n(6,"ion-item",6)(7,"ion-input",8),w("ngModelChange",function(t){d(e);let r=c();return C(r.link.url,t)||(r.link.url=t),m(t)}),i()(),n(8,"ion-item")(9,"app-note")(10,"b"),o(11,"Examples"),i(),p(12,"br"),n(13,"code"),o(14,"tel:702100200"),i(),o(15," to call a phone number."),p(16,"br"),n(17,"code"),o(18,"mailto:address"),i(),o(19," to open an email client."),p(20,"br"),n(21,"code"),o(22,"https://google.com"),i(),o(23," to open a browser."),i()()(),n(24,"div",9),b(25,Y,8,1),n(26,"ion-button",10),h("click",function(){d(e);let t=c();return m(t.save())}),o(27,"Save"),i()()()()()}if(_&2){let e=c();s(5),v("ngModel",e.link.title),s(2),v("ngModel",e.link.url),s(18),y(e.id?25:-1),s(),f("disabled",e.busy)}}var u=class u{constructor(a,e){this.api=a;this.location=e;this.busy=!0;this.link={id:void 0,title:"",url:""};G({arrowUpOutline:q})}ionViewWillEnter(){return k(this,null,function*(){yield this.api.setFestivalByVanity(this.vanity),this.id=z(this.id),this.link=yield this.api.getLink(this.id),this.busy=!1})}delete(){return k(this,null,function*(){yield this.api.deleteLink(this.link.id),this.api.clearCache(),this.location.back()})}save(){return k(this,null,function*(){if(this.link.title.length<3){this.api.sendMessage("The link title must be set");return}this.link.url.length<3&&this.api.sendMessage("The link url must be set"),this.busy=!0;try{let a=yield this.api.addLink(this.link);a.message?this.api.sendMessage(a.message):this.location.back()}finally{this.busy=!1}})}moveUp(){return k(this,null,function*(){this.busy=!0;let a=yield this.api.links();console.log("moveup",a);let e=a.findIndex(l=>l.id===this.link.id);if(e!==-1){if(e==0){this.api.sendMessage("The link is the first in the list"),this.busy=!1;return}let l=JSON.parse(JSON.stringify(a[e-1])),t=JSON.parse(JSON.stringify(a[e-1])),r=JSON.parse(JSON.stringify(this.link));l.title=r.title,l.url=r.url,r.title=t.title,r.url=t.url,yield this.api.addLink(r),yield this.api.addLink(l),this.busy=!1,this.location.back()}})}};u.\u0275fac=function(e){return new(e||u)(g(H),g(I))},u.\u0275cmp=S({type:u,selectors:[["app-link"]],inputs:{vanity:"vanity",id:"id"},decls:11,vars:3,consts:[["color","primary"],["slot","start"],["slot","end"],[3,"click"],[3,"fullscreen"],[1,"border"],["lines","none"],["label","Title","labelPlacement","stacked","placeholder","Text of the link",3,"ngModelChange","ngModel"],["label","URL","labelPlacement","stacked","placeholder","URL for the link",3,"ngModelChange","ngModel"],[1,"center"],[3,"click","disabled"],["text","Move higher in the list"],["color","secondary",3,"click","disabled"],["size","small","name","arrow-up-outline"],["color","secondary",3,"click"]],template:function(e,l){e&1&&(n(0,"ion-header")(1,"ion-toolbar",0)(2,"ion-buttons",1),p(3,"ion-back-button"),i(),n(4,"ion-title"),o(5),i(),n(6,"ion-buttons",2)(7,"ion-button",3),h("click",function(){return l.save()}),o(8,"Save"),i()()()(),n(9,"ion-content",4),b(10,Z,28,4,"div",5),i()),e&2&&(s(5),L(l.id?"Link":"Add Link"),s(4),f("fullscreen",!0),s(),y(l.busy?-1:10))},dependencies:[j,K,E,M,P,Q,A,F,N,T,D,W,O,B,U,J,R,V],styles:["code[_ngcontent-%COMP%]{color:var(--ion-color-primary)}"]});var X=u;export{X as LinkPage};
