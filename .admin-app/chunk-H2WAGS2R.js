import{a as _e}from"./chunk-X4ZTNQOC.js";import{a as me}from"./chunk-OF25KEPG.js";import{a as ge}from"./chunk-55PDQDPP.js";import{a as pe}from"./chunk-GOQU6RDX.js";import{j as re,l as de,n as P,w as ce}from"./chunk-A5NTSXZY.js";import{$ as v,A as d,Aa as p,Ac as se,B as c,Ba as S,Bc as le,Fa as _,Ga as g,Ha as f,Lb as O,Mb as G,P as T,Qb as Z,Rb as j,S as m,Sa as z,Sb as A,T as M,Tb as Q,X as V,Yb as H,Zb as Y,cb as U,cc as J,da as u,dc as K,ec as X,fa as I,fc as $,ga as x,ha as F,ia as k,ja as W,ka as o,kc as ee,la as s,ma as C,mb as q,nb as N,nc as te,oa as b,oc as ie,pa as h,qa as l,sb as R,sc as ne,tc as ae,vc as oe,wa as L,xa as E,ya as B,za as D}from"./chunk-SLKJQVFW.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as y}from"./chunk-LNJ3S2LQ.js";var ue=["gps"];function he(r,a){if(r&1&&C(0,"img",12),r&2){let t=l(2);u("src",t.imageUrl,T)}}function ve(r,a){r&1&&(o(0,"p"),p(1,"Click to choose an image"),s())}function Ce(r,a){if(r&1){let t=b();o(0,"ion-datetime",28),f("ngModelChange",function(e){d(t);let i=l(2);return g(i.festival.start_time,e)||(i.festival.start_time=e),c(e)}),h("ionChange",function(){d(t);let e=l(2);return c(e.startChanged())}),s()}if(r&2){let t=l(2);u("showDefaultButtons",!0),_("ngModel",t.festival.start_time)}}function we(r,a){if(r&1){let t=b();o(0,"ion-datetime",29),f("ngModelChange",function(e){d(t);let i=l(2);return g(i.festival.end_time,e)||(i.festival.end_time=e),c(e)}),h("ionChange",function(){d(t);let e=l(2);return c(e.endChanged())}),s()}if(r&2){let t=l(2);u("showDefaultButtons",!0),_("ngModel",t.festival.end_time)}}function ye(r,a){if(r&1&&(o(0,"ion-select-option",21),p(1),s()),r&2){let t=a.$implicit;u("value",t),m(),S(t)}}function xe(r,a){if(r&1){let t=b();o(0,"ion-button",30),h("click",function(){d(t);let e=l(2);return c(e.delete())}),p(1,"Delete"),s()}r&2&&u("disabled",!0)}function be(r,a){if(r&1){let t=b();o(0,"div",7)(1,"ion-card")(2,"ion-card-content")(3,"ion-list",8)(4,"ion-item")(5,"ion-input",9),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.name,e)||(i.festival.name=e),c(e)}),s()(),o(6,"ion-item")(7,"ion-textarea",10),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.description,e)||(i.festival.description=e),c(e)}),s()(),o(8,"div",11),h("click",function(){d(t);let e=D(50);return c(e.click())}),v(9,he,1,1,"img",12)(10,ve,2,0,"p"),s(),o(11,"ion-item")(12,"ion-input",13),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.admins,e)||(i.festival.admins=e),c(e)}),s()(),o(13,"ion-item")(14,"ion-input",14),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.region,e)||(i.festival.region=e),c(e)}),s()(),o(15,"ion-item")(16,"ion-input",15),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.website,e)||(i.festival.website=e),c(e)}),s()(),o(17,"ion-item")(18,"ion-checkbox",16),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.unknown_dates,e)||(i.festival.unknown_dates=e),c(e)}),p(19,"Dates are not known yet"),s()(),o(20,"ion-item")(21,"ion-label"),p(22,"Start"),s(),C(23,"ion-datetime-button",17),s(),o(24,"ion-modal",18),v(25,Ce,1,2,"ng-template"),s(),o(26,"ion-item")(27,"ion-label"),p(28,"End"),s(),C(29,"ion-datetime-button",19),s(),o(30,"ion-modal",18),v(31,we,1,2,"ng-template"),s(),o(32,"ion-item")(33,"ion-select",20),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.timezone,e)||(i.festival.timezone=e),c(e)}),k(34,ye,2,2,"ion-select-option",21,F),s()(),o(36,"ion-item")(37,"ion-checkbox",16),f("ngModelChange",function(e){d(t);let i=l();return g(i.festival.active,e)||(i.festival.active=e),c(e)}),p(38,"Display in the Dust app"),s()(),o(39,"ion-item")(40,"ion-label",22),h("click",function(){d(t);let e=l();return c(e.openLocation())}),o(41,"app-tooltip",23),p(42," Location "),s()(),o(43,"app-gps",24,0),f("latChange",function(e){d(t);let i=l();return g(i.festival.gpsLat,e)||(i.festival.gpsLat=e),c(e)})("lngChange",function(e){d(t);let i=l();return g(i.festival.gpsLng,e)||(i.festival.gpsLng=e),c(e)}),h("gpsChange",function(e){d(t);let i=l();return c(i.gpsChanged(e))}),s()()(),o(45,"div",25),v(46,xe,2,1,"ion-button",26),o(47,"ion-button",5),h("click",function(){d(t);let e=l();return c(e.save())}),p(48,"Save"),s()(),o(49,"input",27,1),h("change",function(e){d(t);let i=l();return c(i.onFileSelected(e))}),s()()()()}if(r&2){let t=l();m(5),_("ngModel",t.festival.name),m(2),u("spellcheck",!0)("rows",6)("autoGrow",!0),_("ngModel",t.festival.description),m(),I(t.uploading?"disabled":""),m(),x(t.imageUrl?9:-1),m(),x(t.imageUrl?-1:10),m(2),_("ngModel",t.festival.admins),m(2),_("ngModel",t.festival.region),m(2),_("ngModel",t.festival.website),m(2),_("ngModel",t.festival.unknown_dates),m(6),u("keepContentsMounted",!0),m(6),u("keepContentsMounted",!0),m(3),u("value",t.festival.timezone),_("ngModel",t.festival.timezone),m(),W(t.timezones),m(3),_("ngModel",t.festival.active),m(6),_("lat",t.festival.gpsLat)("lng",t.festival.gpsLng),m(3),x(t.canDelete?46:-1)}}function Me(r,a){r&1&&C(0,"app-spinner")}var w=class w{constructor(a,t,n){this.api=a;this.router=t;this.location=n;this.busy=!0;this.canDelete=!1;this.uploading=!1;this.endModified=!1;this.timezones=[];this.imageChanged=!1;this.festival={name:"",vanity:"",admins:"",contact:"",description:"",mastodon_handle:"",inbox_email:"",region:"",website:"",start_time:new Date().toISOString(),end_time:new Date().toISOString(),camp_registration:!1,gpsLat:0,gpsLng:0,camp_editing:!1,approved:!1,event_editing:!1,art_editing:!1,archived:!1,map_direction:0,event_types:"",max_event_types:2,pin:void 0,directions:void 0,unknown_dates:!1,id:void 0,active:!1,timezone:this.api.currentTimeZone()}}ionViewWillEnter(){return y(this,null,function*(){let a=this.api.festivalId;this.vanity?yield this.api.setFestivalByVanity(this.vanity):a=void 0,this.festival=yield this.api.getFestival(a,{cached:!1}),this.canDelete=!!this.festival.id,this.festival.timezone||(this.festival.timezone=this.api.currentTimeZone()),this.imageUrl=this.api.imageURL(this.festival.imageUrl),this.busy=!1,this.timezones=Intl.supportedValuesOf("timeZone")})}ionViewWillLeave(){this.gps&&this.gps.cleanup()}startChanged(){this.endModified||(this.festival.end_time=de(re(this.festival.start_time),24).toISOString())}endChanged(){this.endModified=!0}delete(){}gpsChanged(a){this.festival.gpsLat=a.lat,this.festival.gpsLng=a.lng}fixUniqueId(){this.festival.id||(this.festival.vanity=this.festival.name.toLowerCase().trim().replace(/\s+/g,"-"))}onFileSelected(a){return y(this,null,function*(){let t=a.target.files[0];if(!t)return;let n={width:0,height:0};if(this.blob=yield me(t,{quality:75,width:300},n),console.log(n),n.width!==n.height){this.api.sendMessage("The image needs to be square (width and height must be equal)");return}let e=URL.createObjectURL(this.blob);this.imageUrl=e,this.imageChanged=!0})}setTime(a,t){return a.substring(0,10)+t}save(){return y(this,null,function*(){this.festival.start_time=this.setTime(this.festival.start_time,"T00:00:00"),this.festival.end_time=this.setTime(this.festival.end_time,"T23:59:59");let a=new Date(this.festival.start_time+P(this.festival.timezone)),t=new Date(this.festival.end_time+P(this.festival.timezone));console.log(a,t);let n=Math.round((t-a)/1e3/60/60);if(isNaN(n)){this.api.sendMessage("The start and end time must be set");return}if(n<0){this.api.sendMessage("The end time must be after the start time");return}if(n<24){this.api.sendMessage("The event must be at least 1 day long");return}if(n>24*30){this.api.sendMessage("The event cannot be longer than 30 days");return}if(this.festival.name.length<4){this.api.sendMessage("The event name must be set");return}let e=new Date().getFullYear();if((this.festival.name.includes(e.toString())||this.festival.name.includes((e+1).toString())||this.festival.name.includes((e-1).toString()))&&!this.festival.archived){this.api.sendMessage("The event name cannot include the year in it");return}if(this.fixUniqueId(),this.festival.vanity.length<4){this.api.sendMessage("The unique identifier must be set");return}if(this.festival.vanity.includes(" ")){this.api.sendMessage("The unique identifier cannot contain spaces");return}if(this.festival.description.length<4){this.api.sendMessage("The event description must be set");return}this.festival.timezone||(this.festival.timezone=this.api.currentTimeZone()),this.busy=!0;try{let i=yield this.api.addFestival(this.festival);if(i.message&&i.message!=""){this.api.sendMessage(i.message),this.busy=!1;return}else i.id&&this.imageChanged&&(yield this.uploadImage(i.id));this.api.clearCache(),this.busy=!1,this.location.back()}catch(i){console.error(i),this.busy=!1;return}})}uploadImage(a){return y(this,null,function*(){if(this.blob)try{this.uploading=!0,this.festival.imageUrl=yield this.api.setImage(this.blob,a);let t=yield this.api.addFestival(this.festival);t.message&&this.api.sendMessage(t.message),this.imageChanged=!1}finally{this.uploading=!1}})}openLocation(){let a=`https://www.google.com/maps/search/?api=1&query=${this.festival.gpsLat},${this.festival.gpsLng}`;window.open(a,"_blank")}};w.\u0275fac=function(t){return new(t||w)(M(ce),M(U),M(z))},w.\u0275cmp=V({type:w,selectors:[["app-festival"]],viewQuery:function(t,n){if(t&1&&L(ue,5),t&2){let e;E(e=B())&&(n.gps=e.first)}},inputs:{vanity:"vanity"},decls:13,vars:3,consts:[["gps",""],["fileUpload",""],["color","primary"],["slot","start"],["slot","end"],[3,"click"],[3,"fullscreen"],[1,"border"],["lines","none"],["label","Burn Name","labelPlacement","stacked","placeholder","Name of the burn",3,"ngModelChange","ngModel"],["labelPlacement","stacked","label","Description","placeholder","Description of the burn",3,"ngModelChange","spellcheck","rows","autoGrow","ngModel"],[1,"image-container","center",3,"click"],[3,"src"],["autocomplete","email","label","Administrator Emails","labelPlacement","stacked","placeholder","Comma delimited list of email addresses",3,"ngModelChange","ngModel"],["label","Region","labelPlacement","stacked","placeholder","City, State/Country",3,"ngModelChange","ngModel"],["label","Website","labelPlacement","stacked","placeholder","eg https://myburn.com",3,"ngModelChange","ngModel"],["labelPlacement","start",3,"ngModelChange","ngModel"],["datetime","datetime"],[3,"keepContentsMounted"],["datetime","datetimeEnd"],["label","Timezone","interface","popover","placeholder","Select the timezone of the event",3,"ngModelChange","value","ngModel"],[3,"value"],[2,"width","100%",3,"click"],["position","left","text","This is used for the directions button in the app. Right click in Google Maps to copy lat/long and paste here."],[3,"latChange","lngChange","gpsChange","lat","lng"],[1,"center"],["color","secondary",3,"disabled"],["type","file",1,"file-input",3,"change"],["presentation","date","minuteValues","0,15,30,45","id","datetime",3,"ngModelChange","ionChange","showDefaultButtons","ngModel"],["presentation","date","minuteValues","0,15,30,45","id","datetimeEnd",3,"ngModelChange","ionChange","showDefaultButtons","ngModel"],["color","secondary",3,"click","disabled"]],template:function(t,n){t&1&&(o(0,"ion-header")(1,"ion-toolbar",2)(2,"ion-buttons",3)(3,"ion-buttons",3),C(4,"ion-back-button"),s()(),o(5,"ion-title"),p(6),s(),o(7,"ion-buttons",4)(8,"ion-button",5),h("click",function(){return n.save()}),p(9,"Save"),s()()()(),o(10,"ion-content",6),v(11,be,51,21,"div",7)(12,Me,1,0,"app-spinner"),s()),t&2&&(m(6),S(n.vanity?"Edit Burn":"New Burn"),m(4),u("fullscreen",!0),m(),x(n.busy?12:11))},dependencies:[R,q,N,J,ie,j,O,ne,te,H,A,Q,$,K,oe,le,X,Y,G,ae,pe,se,ee,Z,_e,ge],encapsulation:2});var fe=w;export{fe as FestivalPage};
