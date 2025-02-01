import{a as k}from"./chunk-4WODZXLH.js";import"./chunk-OF25KEPG.js";import{a as _e}from"./chunk-55PDQDPP.js";import{a as Ce}from"./chunk-P432SOVY.js";import{a as ge}from"./chunk-GOQU6RDX.js";import{c as g}from"./chunk-LADCEZG6.js";import{F as de,G as ue,R as he}from"./chunk-OAPJ7RFL.js";import{d as S,j as pe,p as ce,x as me}from"./chunk-SNNE7GZP.js";import{$ as y,A as m,Aa as u,Ac as re,B as d,Ba as T,Bc as se,Fa as b,Ga as w,Ha as x,Ka as O,Lb as z,Ob as H,P as V,Qb as K,Rb as Y,S as n,Sa as N,Sb as J,T as I,Tb as X,X as A,Yb as Z,cc as $,da as c,db as R,dc as ee,fa as E,fc as ie,ga as _,gb as F,ha as M,ia as U,ja as B,ka as l,kc as te,la as r,ma as v,mb as j,nb as Q,nc as ae,oa as P,oc as ne,pa as h,qa as s,qb as G,qc as oe,sb as q,vc as le,wa as L,xa as W,ya as D}from"./chunk-SLKJQVFW.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as C}from"./chunk-LNJ3S2LQ.js";var ye=t=>[t];function ve(t,a){if(t&1&&(l(0,"ion-select-option",11),u(1),r()),t&2){let e=a.$implicit;c("value",e),n(),T(e)}}function be(t,a){if(t&1&&v(0,"img",15),t&2){let e=s(2);c("src",e.imageUrl,V)}}function we(t,a){t&1&&(l(0,"p"),u(1,"Click to choose an optional image for your camp"),r())}function xe(t,a){if(t&1){let e=P();l(0,"ion-item",7)(1,"app-emails",19),x("emailsChange",function(i){m(e);let p=s(2);return w(p.camp.contact_email,i)||(p.camp.contact_email=i),d(i)}),r()()}if(t&2){let e=s(2);n(),c("isAdmin",e.isAdmin)("isOwner",e.isOwner)("label","Camp Owner(s)")("placeholder","Email address of camp owner"),b("emails",e.camp.contact_email)}}function Ie(t,a){if(t&1){let e=P();l(0,"app-tooltip",17)(1,"ion-button",20),h("click",function(){m(e);let i=s(2);return d(i.invite())}),u(2,"Invite"),r()()}if(t&2){let e=s(2);n(),c("disabled",e.inviting)}}function Pe(t,a){if(t&1&&(l(0,"app-tooltip",21)(1,"ion-button",22),u(2," Place "),r()(),l(3,"ion-button",23),u(4," Delete "),r(),u(5,"\xA0 "),v(6,"ion-alert",24)),t&2){let e=s(2);n(),c("routerLink","../../map/"+O(2,ye,e.camp.id)),n(5),c("buttons",e.deleteButtons)}}function Te(t,a){if(t&1){let e=P();l(0,"div",5)(1,"ion-card",6)(2,"ion-card-content",6)(3,"ion-list",7)(4,"ion-item")(5,"ion-input",8),x("ngModelChange",function(i){m(e);let p=s();return w(p.camp.name,i)||(p.camp.name=i),d(i)}),r()(),l(6,"ion-item",9)(7,"ion-select",10),x("ngModelChange",function(i){m(e);let p=s();return w(p.camp.camp_type,i)||(p.camp.camp_type=i),d(i)}),U(8,ve,2,2,"ion-select-option",11,M),r()(),l(10,"ion-item",12),h("dblclick",function(){m(e);let i=s();return d(i.fillDescription())}),l(11,"ion-textarea",13),x("ngModelChange",function(i){m(e);let p=s();return w(p.camp.description,i)||(p.camp.description=i),d(i)}),r()(),l(12,"div",14),h("click",function(){m(e);let i=s();return d(i.upload.click())}),y(13,be,1,1,"img",15)(14,we,2,0,"p"),r(),y(15,xe,2,5,"ion-item",7),r(),l(16,"div",16),y(17,Ie,3,1,"app-tooltip",17)(18,Pe,7,4),l(19,"ion-button",3),h("click",function(){m(e);let i=s();return d(i.save())}),u(20,"Save"),r()(),l(21,"app-upload",18),h("upload",function(i){m(e);let p=s();return d(p.uploaded(i))}),r()()()()}if(t&2){let e=s();n(5),b("ngModel",e.camp.name),n(2),c("value",e.camp.camp_type),b("ngModel",e.camp.camp_type),n(),B(e.campTypes),n(3),c("spellcheck",!0)("rows",6)("maxlength",1e3)("autoGrow",!0),b("ngModel",e.camp.description),n(),E(e.uploading?"disabled":""),n(),_(e.imageUrl?13:-1),n(),_(e.imageUrl?-1:14),n(),_(e.isAdmin||e.isOwner?15:-1),n(2),_(e.id&&e.isAdmin?17:-1),n(),_(e.id&&e.canPlace?18:-1),n(),c("disabled",e.busy)}}function Se(t,a){t&1&&v(0,"app-spinner")}var f=class f{constructor(a,e,o){this.api=a;this.alert=e;this.location=o;this.busy=!0;this.uploading=!1;this.imageChanged=!1;this.isAdmin=!1;this.isOwner=!1;this.canPlace=!1;this.isNew=!1;this.inviting=!1;this.campTypes=["Theme Camp","Sound Camp","Art Support Camp","Village Camp"];this.camp={name:"",pin:"",description:"",id:void 0,contact_email:"",camp_type:this.campTypes[0]};this.deleteButtons=[{text:"Delete",role:"destructive",handler:()=>{this.delete()}},{text:"Cancel",role:"cancel",handler:()=>{}}];he({mapOutline:ue,mailOutline:de})}uploaded(a){console.log(a),this.imageUrl=a.url,this.imageChanged=!0,this.blob=a.blob}ionViewWillEnter(){return C(this,null,function*(){yield this.api.setFestivalByVanity(this.vanity),this.id=pe(this.id),this.isNew=!this.id,this.camp=yield this.api.getCamp(this.id),this.canPlace=this.api.getAccessInfo(this.api.festivalId).hasAdmin,this.isAdmin=this.api.lastRoleResponse=="festival",this.isOwner=!!this.id&&this.api.getAccessInfo(this.api.festivalId).camps.includes(this.id),this.imageUrl=this.api.imageURL(this.camp.imageUrl),this.busy=!1})}delete(){return C(this,null,function*(){this.busy=!0,yield this.api.deleteCamp(this.camp),this.api.clearCache(),this.busy=!1,this.location.back()})}fillDescription(){console.log("fillDescription"),S(this.camp.description)&&!S(this.camp.name)&&(this.camp.description=`${this.camp.name} does not have a description yet.`)}save(a=!0){return C(this,null,function*(){this.busy=!0,ce(this.camp);try{let e=yield this.api.addCamp(this.camp);if(this.busy=!1,e.message)g(this.alert,e.message);else{if(e.id&&this.imageChanged){console.log(`Uploaded image for camp ${e.id}`),this.busy=!0;try{yield this.uploadImage(e.id)}finally{this.busy=!1,this.imageChanged=!1}}if(!this.isAdmin){let o=this.isNew?`Thank you for registering your camp at ${this.api.festivalTitle()}.`:`The changes you have made will be reviewed by ${this.api.festivalTitle()} prior to publishing in the app.`;g(this.alert,o,"Note"),yield this.api.setKey()}this.api.clearCache(),a&&this.location.back()}}finally{this.busy=!1}})}invite(){return C(this,null,function*(){if(!this.camp.contact_email){yield g(this.alert,"You must specify an email address","Error");return}this.inviting=!0,yield this.save(!1);let a=yield this.api.inviteCamp(this.camp);a.message?g(this.alert,a.message):g(this.alert,"The camp owner has been invited to manage their camp.","Invitation")})}uploadImage(a){return C(this,null,function*(){if(this.blob)try{this.uploading=!0,this.camp.imageUrl=yield this.api.setImage(this.blob,a);let e=yield this.api.addCamp(this.camp);e.message&&g(this.alert,e.message)}finally{this.uploading=!1}})}};f.\u0275fac=function(e){return new(e||f)(I(me),I(oe),I(N))},f.\u0275cmp=A({type:f,selectors:[["app-camp"]],viewQuery:function(e,o){if(e&1&&L(k,5),e&2){let i;W(i=D())&&(o.upload=i.first)}},inputs:{id:"id",vanity:"vanity"},decls:12,vars:4,consts:[["color","primary"],["slot","start"],["slot","end"],[3,"click","disabled"],[3,"fullscreen"],[1,"border"],[1,"form"],["lines","none"],["label","Camp Name","labelPlacement","stacked","placeholder","Name of the theme camp",3,"ngModelChange","ngModel"],["lines","none",1,"app-select"],["label","Type","labelPlacement","stacked","interface","popover","placeholder","Select the type of camp",1,"app-select",3,"ngModelChange","value","ngModel"],[3,"value"],[3,"dblclick"],["labelPlacement","stacked","label","Description","placeholder","Description of the theme camp",3,"ngModelChange","spellcheck","rows","maxlength","autoGrow","ngModel"],[1,"image-container","center",3,"click"],[3,"src"],[1,"center"],["text","Invite camp owner via email to manage their camp"],[3,"upload"],["helperText",`The camp owner(s) can login and alter their camp
              events and details. This is a comma separated list of email addresses.`,3,"emailsChange","isAdmin","isOwner","label","placeholder","emails"],["color","secondary",3,"click","disabled"],["text","Place the camp on the map"],["color","secondary",3,"routerLink"],["id","deleteCamp","color","secondary"],["trigger","deleteCamp","header","Delete Camp?",3,"buttons"]],template:function(e,o){e&1&&(l(0,"ion-header")(1,"ion-toolbar",0)(2,"ion-buttons",1),v(3,"ion-back-button"),r(),l(4,"ion-title"),u(5),r(),l(6,"ion-buttons",2)(7,"ion-button",3),h("click",function(){return o.save()}),u(8,"Save"),r()()()(),l(9,"ion-content",4),y(10,Te,22,16,"div",5)(11,Se,1,0,"app-spinner"),r()),e&2&&(n(5),T(o.id||o.camp.id?"Edit Camp":o.isAdmin?"Add Camp":"Register Camp"),n(2),c("disabled",o.busy),n(2),c("fullscreen",!0),n(),_(o.busy?11:10))},dependencies:[H,ge,k,q,j,G,Q,_e,F,R,$,ne,Y,z,ae,K,Z,J,X,ie,ee,le,se,re,te,Ce],encapsulation:2});var fe=f;export{fe as CampPage};
