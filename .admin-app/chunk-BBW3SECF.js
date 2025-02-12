import{a as Y}from"./chunk-4MBMHUBT.js";import{a as U}from"./chunk-A6LN74YY.js";import{a as X}from"./chunk-LADCEZG6.js";import"./chunk-5W5FH4VE.js";import"./chunk-2RWSG5RW.js";import"./chunk-G3CKXV7X.js";import"./chunk-5FZVM2DH.js";import"./chunk-HC6MZPB3.js";import"./chunk-YMI2B6JE.js";import"./chunk-4JPLRTL2.js";import"./chunk-NPRM7GGH.js";import"./chunk-52VTL4OE.js";import"./chunk-VBU7NMPV.js";import"./chunk-2EOHHFOF.js";import"./chunk-JXIEZMHN.js";import"./chunk-3GGVU3XB.js";import"./chunk-MCRJI3T3.js";import"./chunk-5ZNPFCKO.js";import"./chunk-46PQVYTJ.js";import"./chunk-MM5QLNJM.js";import"./chunk-3573TPBU.js";import{D as R}from"./chunk-3FSCB2FX.js";import"./chunk-MIGJGGKJ.js";import{A as u,B as f,Da as m,Dc as Q,Ga as S,Ia as y,Ja as M,Ka as v,L as I,Nb as W,S as s,Sb as D,Tb as L,Ub as N,Va as T,Vb as O,Y as b,_a as k,_b as q,aa as x,ea as h,ec as A,fc as G,ha as w,hc as j,la as i,ma as n,na as _,ob as V,pa as P,pb as E,pc as H,qa as C,qc as z,ra as c,sb as B,ub as F,w as g,wc as J,xc as K}from"./chunk-JQETABDO.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-2BF6BOWA.js";import"./chunk-OA2QWUMP.js";import"./chunk-3J2H4E5C.js";import"./chunk-KBMMZLX2.js";import"./chunk-5J6JP6Q2.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as p}from"./chunk-LNJ3S2LQ.js";function $(d,o){if(d&1){let e=P();i(0,"div",7)(1,"ion-card",9)(2,"ion-card-content",9)(3,"ion-list",10)(4,"ion-item")(5,"ion-input",11),v("ngModelChange",function(t){u(e);let l=c();return M(l.message.title,t)||(l.message.title=t),f(t)}),n()(),i(6,"ion-item")(7,"ion-textarea",12),v("ngModelChange",function(t){u(e);let l=c();return M(l.message.description,t)||(l.message.description=t),f(t)}),n()()(),i(8,"div",13),m(9),n(),i(10,"div",14)(11,"ion-button",15),C("click",function(){u(e);let t=c();return f(t.send())}),m(12,"Send"),n()()()()()}if(d&2){let e=c();s(5),y("ngModel",e.message.title),s(2),h("counterFormatter",e.customCounterFormatter)("spellcheck",!0)("rows",6)("maxlength",178)("autoGrow",!0),y("ngModel",e.message.description),s(2),S(" This will send a notification to ",e.pushInformation.deviceCount," users who have accepted receiving notifications for ",e.festivalTitle," in the dust app. "),s(2),h("disabled",e.busy())}}function ee(d,o){d&1&&_(0,"app-spinner",8)}var a=class a{constructor(){this.message={title:"",description:""};this.pushInformation={deviceCount:0};this.festivalTitle="";this.busy=I(!1);this.api=g(R);this.location=g(T);this.alert=g(Y)}ngOnInit(){return p(this,null,function*(){yield this.api.setFestivalByVanity(this.vanity,!0),this.festivalTitle=this.api.festivalTitle()})}ionViewWillEnter(){return p(this,null,function*(){let o=yield this.api.getPushInformation();this.pushInformation=o.data})}customCounterFormatter(o,e){return`${e-o} characters remaining`}send(){return p(this,null,function*(){try{if(this.message.title.length==0){this.api.sendMessage("Title is required");return}if(this.message.description.length==0){this.api.sendMessage("Description is required");return}if(!(yield X(this.alert,`Send message "${this.message.title}" to ${this.pushInformation.deviceCount} users ?`,"Send")))return;this.busy.set(!0),yield this.api.sendPushMessage({title:this.message.title,description:this.message.description}),this.location.back(),this.api.sendMessage("Message Sent")}finally{this.busy.set(!1)}})}};a.\u0275fac=function(e){return new(e||a)},a.\u0275cmp=b({type:a,selectors:[["app-message"]],inputs:{vanity:"vanity"},decls:13,vars:2,consts:[["color","primary"],["slot","start"],["routerLink","../"],["slot","end"],[3,"click"],["name","add"],[3,"fullscreen"],[1,"border"],["title","Sending message..."],[1,"form"],["lines","none"],["label","Title","labelPlacement","stacked","placeholder","Title of the message",3,"ngModelChange","ngModel"],["labelPlacement","stacked","label","Description","placeholder","Description of the message",3,"ngModelChange","counterFormatter","spellcheck","rows","maxlength","autoGrow","ngModel"],[1,"padded"],[1,"center"],[3,"click","disabled"]],template:function(e,r){e&1&&(i(0,"ion-header")(1,"ion-toolbar",0)(2,"ion-buttons",1),_(3,"ion-back-button"),n(),i(4,"ion-title",2),m(5,"Message"),n(),i(6,"ion-buttons",3)(7,"ion-button",4),C("click",function(){return r.send()}),_(8,"ion-icon",5),m(9,"Send"),n()()()(),i(10,"ion-content",6),x(11,$,13,10,"div",7)(12,ee,1,0,"app-spinner",8),n()),e&2&&(s(10),h("fullscreen",!0),s(),w(r.busy()?12:11))},dependencies:[G,j,O,N,J,D,W,K,L,q,A,Q,H,z,k,F,V,B,E,U],styles:[".padded[_ngcontent-%COMP%]{padding-left:25%;padding-right:25%;text-align:center}"]});var Z=a;export{Z as MessagePage};
