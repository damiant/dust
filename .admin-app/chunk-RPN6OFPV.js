import{a as le}from"./chunk-TB777RDH.js";import{a as me}from"./chunk-2ESKF5AC.js";import{a as se}from"./chunk-GOQU6RDX.js";import{a as ae}from"./chunk-LADCEZG6.js";import"./chunk-5Z4O26VQ.js";import"./chunk-FJQ4E5GO.js";import"./chunk-7FPDBCWT.js";import"./chunk-JYXYGJZQ.js";import"./chunk-HC6MZPB3.js";import"./chunk-YMI2B6JE.js";import"./chunk-YRQXWVV7.js";import"./chunk-NPRM7GGH.js";import"./chunk-52VTL4OE.js";import"./chunk-VBU7NMPV.js";import"./chunk-2GEO6OXL.js";import"./chunk-MCRJI3T3.js";import"./chunk-74YXDZAV.js";import"./chunk-YYXGO6RB.js";import"./chunk-MM5QLNJM.js";import"./chunk-3573TPBU.js";import"./chunk-2EOHHFOF.js";import"./chunk-JXIEZMHN.js";import{R as ce,b as oe,m as re}from"./chunk-OAPJ7RFL.js";import{a as te,i as k,j as M,l as v,o as ie,w as ne}from"./chunk-A5NTSXZY.js";import{$ as b,A as m,Aa as u,Ac as ee,B as d,Ba as V,Fa as w,Ga as T,Ha as I,Lb as j,Qb as R,Rb as N,S as c,Sa as D,Sb as Z,T as C,Tb as J,X as A,Yb as q,ab as W,cc as H,da as p,dc as U,fc as G,ga as S,gb as z,ha as E,ia as P,ja as O,ka as r,kc as K,la as a,ma as x,mb as B,nb as F,nc as Q,oa as y,oc as X,pa as _,qa as l,sb as L,uc as Y,vc as $}from"./chunk-SLKJQVFW.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as f}from"./chunk-LNJ3S2LQ.js";var ue=(s,i)=>i.id;function pe(s,i){if(s&1&&(r(0,"ion-select-option",10),u(1),a()),s&2){let e=i.$implicit;p("value",e.id),c(),V(e.name)}}function _e(s,i){if(s&1){let e=y();r(0,"div",13)(1,"ion-item",20)(2,"ion-input",21),I("ngModelChange",function(t){let o=m(e).$implicit;return T(o.who,t)||(o.who=t),d(t)}),a(),r(3,"app-tooltip",22)(4,"ion-button",23),_("click",function(){let t=m(e).$implicit,o=l(2);return d(o.deleteItem(t))}),x(5,"ion-icon",24),a()()(),r(6,"app-date-range",25),_("endChanged",function(t){let o=m(e).$implicit,g=l(2);return d(g.endChanged(o,t))})("startChanged",function(t){let o=m(e).$implicit,g=l(2);return d(g.startChanged(o,t))}),a()()}if(s&2){let e=i.$implicit,n=l(2);c(2),w("ngModel",e.who),c(2),p("hidden",n.occurrences.length===1),c(2),p("minTime",n.minTime)("maxTime",n.maxTime)("id",e.id)("startTime",e.startTime)("endTime",e.endTime)}}function he(s,i){if(s&1){let e=y();r(0,"ion-button",18),_("click",function(){m(e);let t=l(2);return d(t.deleteParty())}),u(1,"Delete"),a()}}function ge(s,i){s&1&&(r(0,"ion-button",16),u(1,"\xA0"),a())}function fe(s,i){if(s&1){let e=y();r(0,"div",5)(1,"ion-card")(2,"ion-card-content")(3,"ion-list")(4,"ion-item",6)(5,"ion-input",7),I("ngModelChange",function(t){m(e);let o=l();return T(o.music.title,t)||(o.music.title=t),d(t)}),a()(),r(6,"ion-item",8)(7,"ion-select",9),I("ngModelChange",function(t){m(e);let o=l();return T(o.music.campId,t)||(o.music.campId=t),d(t)}),P(8,pe,2,2,"ion-select-option",10,E),a()(),r(10,"ion-item",6)(11,"ion-input",11),I("ngModelChange",function(t){m(e);let o=l();return T(o.music.contact,t)||(o.music.contact=t),d(t)}),a(),r(12,"div",12),u(13," The party owner can login and alter this lineup. This is a comma separated list of email addresses. "),a()(),P(14,_e,7,7,"div",13,ue),a(),r(16,"div",14),b(17,he,2,0,"ion-button",15)(18,ge,2,0,"ion-button",16),r(19,"ion-button",3),_("click",function(){m(e);let t=l();return d(t.save())}),u(20,"Save"),a(),r(21,"app-tooltip",17)(22,"ion-button",18),_("click",function(){m(e);let t=l();return d(t.addItem())}),x(23,"ion-icon",19),a()()()()()()}if(s&2){let e=l();c(5),w("ngModel",e.music.title),c(2),p("value",e.music.campId),w("ngModel",e.music.campId),c(),O(e.camps),c(3),p("disabled",!(e.isAdmin||e.isOwner)),w("ngModel",e.music.contact),c(3),O(e.occurrences),c(3),S((e.isAdmin||e.isOwner)&&e.music.id?17:18)}}var h=class h{constructor(i,e,n,t){this.api=i;this.route=e;this.alert=n;this.location=t;this.busy=!0;this.camps=[];this.minTime=new Date().toISOString();this.maxTime=new Date().toISOString();this.isOwner=!1;this.isAdmin=!1;this.timezone=this.api.currentTimeZone();this.music={id:void 0,camp:"",location:"",day:"",occurrences:"[]"};this.occurrences=[];ce({closeOutline:re,addOutline:oe})}ionViewWillEnter(){return f(this,null,function*(){yield this.api.setFestivalByVanity(this.vanity),this.id=k(this.id);let i=!this.id,e=yield this.api.getFestival(this.api.festivalId,{cached:!0});i?(this.music=yield this.api.newMusic(),console.log("new music with camp",this.route.snapshot.queryParams.camp),this.music.campId=k(this.route.snapshot.queryParams.camp)):this.music=yield this.api.getMusic(this.id);let n=this.api.getAccessInfo(e.id);this.isOwner=this.music&&n.music.includes(this.music.id)||i,this.isAdmin=this.api.isAdmin(e.id),this.timezone=e.timezone,this.timezone||(this.timezone=this.api.currentTimeZone()),this.minTime=e.start_time,this.maxTime=e.end_time,this.occurrences=JSON.parse(this.music.occurrences),this.occurrences.length==0&&this.occurrences.push({who:"",id:"1",startTime:this.minTime,endTime:v(M(this.minTime),1).toISOString()});for(let t of this.occurrences)t.startTime=this.fixDate(t.startTime),t.endTime=this.fixDate(t.endTime);this.busy=!1})}fixDate(i){return i.endsWith("Z")?i.replace("Z",""):i}ngOnInit(){return f(this,null,function*(){this.camps=yield this.api.camps({cached:!0})})}lastTime(){let i=this.minTime;for(let e of this.occurrences)i=e.endTime;return i}deleteParty(){return f(this,null,function*(){(yield ae(this.alert,"Are you sure you want to delete this party?"))&&(yield this.api.deleteParty(this.music.id),this.api.clearCache(),this.location.back())})}deleteItem(i){this.occurrences.length!=1&&(this.occurrences=this.occurrences.filter(e=>e.id!==i.id))}addItem(){let i=this.lastTime();this.occurrences.push({who:"",id:(this.occurrences.length+1).toString(),startTime:i,endTime:v(M(i),1).toISOString()})}save(){return f(this,null,function*(){var e,n;if(!this.music.title||((e=this.music.title)==null?void 0:e.trim())==""){this.api.sendMessage("The name of the event (or name of the camp) must be set");return}let i=this.camps.find(t=>t.id==this.music.campId);this.music.camp=i?i.name:"Unknown";for(let t of this.occurrences){if(t.who.trim()==""){this.api.sendMessage("The DJ/Musician must be set");return}t.startTime=this.fixDate(t.startTime),t.endTime=this.fixDate(t.endTime);let o=new Date(t.startTime),g=new Date(t.endTime);t.timeRange=(n=te(o,g,void 0,this.api.currentTimeZone()))==null?void 0:n.brief}ie(this.music),yield this.api.addMusic(this.music,this.occurrences),this.location.back()})}startChanged(i,e){i.startTime=e,i.endTime=v(M(e),1).toISOString()}endChanged(i,e){i.endTime=e}};h.\u0275fac=function(e){return new(e||h)(C(ne),C(W),C(me),C(D))},h.\u0275cmp=A({type:h,selectors:[["app-music-item"]],inputs:{id:"id",vanity:"vanity"},decls:11,vars:3,consts:[["color","primary"],["slot","start"],["slot","end"],[3,"click"],[3,"fullscreen"],[1,"border"],["lines","none"],["label","Party Title","labelPlacement","stacked","placeholder","Title of the theme camp or party",3,"ngModelChange","ngModel"],["lines","none",1,"app-select"],["label","Location","labelPlacement","stacked","interface","popover","placeholder","Select location of event",1,"app-select",3,"ngModelChange","value","ngModel"],[3,"value"],["label","Party Owner","labelPlacement","stacked","placeholder","Email address",3,"ngModelChange","disabled","ngModel"],["slot","helper",1,"helper"],[1,"horizontal","bottom-line"],[1,"horizontal"],["color","secondary"],["fill","clear"],["position","right","text","Add a time slot"],["color","secondary",3,"click"],["size","small","name","add-outline"],["lines","none",2,"width","50%"],["labelPlacement","stacked","label","DJ / Musician",3,"ngModelChange","ngModel"],["position","right","text","Remove this time slot",2,"margin-top","15px"],["slot","end","color","secondary",3,"click","hidden"],["size","small","name","close-outline"],[3,"endChanged","startChanged","minTime","maxTime","id","startTime","endTime"]],template:function(e,n){e&1&&(r(0,"ion-header")(1,"ion-toolbar",0)(2,"ion-buttons",1),x(3,"ion-back-button"),a(),r(4,"ion-title"),u(5),a(),r(6,"ion-buttons",2)(7,"ion-button",3),_("click",function(){return n.save()}),u(8,"Save"),a()()()(),r(9,"ion-content",4),b(10,fe,24,6,"div",5),a()),e&2&&(c(5),V(n.id?"Party":"Add Party"),c(4),p("fullscreen",!0),c(),S(n.busy?-1:10))},dependencies:[L,B,F,z,H,X,N,j,Q,q,Z,J,G,U,$,ee,K,R,Y,se,le],styles:["ion-card[_ngcontent-%COMP%]{cursor:auto}.vertical[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:end;justify-content:center}.horizontal[_ngcontent-%COMP%]{display:flex;flex-direction:row;justify-content:space-between}.bottom-line[_ngcontent-%COMP%]{border-bottom:1px solid var(--ion-color-light)}ion-item[_ngcontent-%COMP%]{--padding-start: 0px;--padding-end: 0px}"]});var de=h;export{de as MusicItemPage};
