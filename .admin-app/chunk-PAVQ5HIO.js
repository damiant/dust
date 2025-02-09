import{a as Me}from"./chunk-OWJ3NGDC.js";import{a as Te}from"./chunk-XD3IRPH2.js";import{a as Ee}from"./chunk-TQS35TTB.js";import{a as Ie}from"./chunk-S2LNLKRW.js";import{a as we}from"./chunk-FMJXCHDZ.js";import{a as V}from"./chunk-LADCEZG6.js";import"./chunk-5Z4O26VQ.js";import"./chunk-FJQ4E5GO.js";import"./chunk-7FPDBCWT.js";import"./chunk-JYXYGJZQ.js";import"./chunk-HC6MZPB3.js";import"./chunk-YMI2B6JE.js";import"./chunk-YRQXWVV7.js";import"./chunk-NPRM7GGH.js";import"./chunk-52VTL4OE.js";import"./chunk-VBU7NMPV.js";import"./chunk-2GEO6OXL.js";import"./chunk-MCRJI3T3.js";import"./chunk-74YXDZAV.js";import"./chunk-YYXGO6RB.js";import"./chunk-MM5QLNJM.js";import"./chunk-3573TPBU.js";import"./chunk-2EOHHFOF.js";import"./chunk-JXIEZMHN.js";import{M as Ce,O as be,R as Se,p as Pe}from"./chunk-OAPJ7RFL.js";import{B as xe,x as ye}from"./chunk-UOBZOUDF.js";import"./chunk-MIGJGGKJ.js";import{$ as y,$a as X,A as m,Aa as l,B as u,Ba as M,Ca as B,Fa as E,Ga as T,Ha as I,Ja as Q,Ka as x,Kb as ee,Lb as te,Ma as j,P as W,Pb as ie,Qb as ne,R,Rb as oe,S as s,Sa as q,T as w,Ta as Y,X as D,Xa as J,Xb as ae,bc as le,cc as re,da as c,dc as se,ea as N,ec as pe,ga as C,ha as L,ia as k,ic as ce,ja as z,jc as de,ka as i,la as n,lb as Z,lc as me,ma as b,mb as K,mc as ue,nc as ge,oa as v,pa as _,qa as d,rb as $,ta as H,vc as he,wa as G,wc as fe,xa as O,ya as F,yc as _e,za as A,zc as ve}from"./chunk-PNZTRGP7.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h}from"./chunk-LNJ3S2LQ.js";var Le=["map"],ke=["fileUpload"],ze=r=>({title:"Upload Map Image",method:r,icon:"cloud-upload-outline"}),Ge=r=>({title:"Generate Map",method:r,icon:"map-outline"}),Oe=r=>({title:"Settings",method:r,icon:"settings-outline"}),Fe=r=>({title:"Clear Camp Locations",method:r,icon:"trash-bin-outline"}),Ae=r=>({title:"Clear Art Locations",method:r,icon:"trash-bin-outline"}),Be=r=>({title:"Clear Other Locations",method:r,icon:"trash-bin-outline"}),Ue=(r,t,e,a,o,p)=>[r,t,e,a,o,p],We=()=>["1","2","3","4","5"];function Re(r,t){if(r&1){let e=v();i(0,"ion-toolbar")(1,"ion-list")(2,"ion-item",16)(3,"ion-text"),l(4,"Click on the map to place a"),n(),i(5,"ion-select",17),_("ionChange",function(o){m(e);let p=d();return u(p.typeChange(o))}),I("ngModelChange",function(o){m(e);let p=d();return T(p.pinType,o)||(p.pinType=o),u(o)}),i(6,"ion-select-option",18),l(7,"Restroom"),n(),i(8,"ion-select-option",19),l(9,"Gate"),n(),i(10,"ion-select-option",20),l(11,"Greeter Station"),n(),i(12,"ion-select-option",21),l(13,"Shuttle Stop"),n(),i(14,"ion-select-option",22),l(15,"Ice"),n(),i(16,"ion-select-option",23),l(17,"Medical Station"),n(),i(18,"ion-select-option",24),l(19,"GPS"),n()()()(),i(20,"ion-buttons",5),b(21,"app-side",25),n()()}if(r&2){let e=d(),a=A(17);s(5),E("ngModel",e.pinType),c("value",e.pinType),s(16),c("hideProfile",!0)("buttons",j(16,Ue,x(4,ze,e.uploadMap(a)),x(6,Ge,e.generateMap()),x(8,Oe,e.openSettings()),x(10,Fe,e.clearCamps()),x(12,Ae,e.clearArt()),x(14,Be,e.clearPins())))}}function De(r,t){if(r&1){let e=v();i(0,"ion-content",14)(1,"div",14)(2,"h1"),l(3,"Map Settings"),n(),i(4,"p"),l(5,"Choose the direction that North is point on the map."),b(6,"br"),l(7,"This is used to ensure a persons pin on the map is facing the correct direction."),n(),i(8,"ion-radio-group",26),I("ngModelChange",function(o){m(e);let p=d();return T(p.mapDirection,o)||(p.mapDirection=o),u(o)}),i(9,"div",27)(10,"ion-radio",28),l(11,"Top Left"),n(),i(12,"ion-radio",28),l(13,"Top"),n(),i(14,"ion-radio",29),l(15,"Top Right"),n()(),i(16,"div",27)(17,"ion-radio",28),l(18,"Left"),n(),b(19,"div"),i(20,"ion-radio",29),l(21,"Right"),n()(),i(22,"div",27)(23,"ion-radio",28),l(24,"Bottom Right"),n(),i(25,"ion-radio",28),l(26,"Bottom"),n(),i(27,"ion-radio",29),l(28,"Bottom Left"),n()()()()(),i(29,"ion-toolbar",30)(30,"ion-button",31),_("click",function(){m(e);let o=d();return u(o.applySettings())}),l(31,"Apply"),n()()}if(r&2){let e=d();s(8),E("ngModel",e.mapDirection),s(2),c("value",270),s(2),c("value",0),s(2),c("value",45),s(3),c("value",240),s(3),c("value",90),s(3),c("value",120),s(2),c("value",180),s(2),c("value",210)}}function Ne(r,t){if(r&1&&(i(0,"ion-segment-button",39)(1,"ion-label"),l(2),n()()),r&2){let e=t.$implicit;H("value",e),s(2),M(e)}}function He(r,t){if(r&1){let e=v();i(0,"ion-content",14)(1,"div",14)(2,"h1"),l(3,"Generate Map"),n(),i(4,"p"),l(5),n()(),i(6,"ion-list",16)(7,"ion-item"),l(8,"Map Type"),n(),i(9,"ion-segment",32),I("ngModelChange",function(o){m(e);let p=d();return T(p.mapStyle,o)||(p.mapStyle=o),u(o)}),i(10,"ion-segment-button",33)(11,"ion-label"),l(12,"Outdoors"),n()(),i(13,"ion-segment-button",34)(14,"ion-label"),l(15,"Satellite"),n()(),i(16,"ion-segment-button",35)(17,"ion-label"),l(18,"Full"),n()(),i(19,"ion-segment-button",36)(20,"ion-label"),l(21,"Street"),n()(),i(22,"ion-segment-button",37)(23,"ion-label"),l(24,"Light"),n()(),i(25,"ion-segment-button",38)(26,"ion-label"),l(27,"Dark"),n()()()(),i(28,"ion-list",16)(29,"ion-item"),l(30,"Zoom Level"),n(),i(31,"ion-segment",32),I("ngModelChange",function(o){m(e);let p=d();return T(p.zoom,o)||(p.zoom=o),u(o)}),k(32,Ne,3,2,"ion-segment-button",39,L),n()()(),i(34,"ion-toolbar",30)(35,"ion-button",31),_("click",function(){m(e);let o=d();return u(o.createMap(o.mapStyle))}),l(36,"Create"),n()()}if(r&2){let e=d();s(5),B("Create an image of a map centered at the latitude and longitude of ",e.festivalTitle,"."),s(4),E("ngModel",e.mapStyle),c("value",e.mapStyle),s(22),E("ngModel",e.zoom),c("value",e.zoom),s(),z(Q(5,We))}}function Qe(r,t){if(r&1){let e=v();i(0,"div",10)(1,"ion-button",31),_("click",function(){m(e),d();let o=A(17);return u(o.click())}),l(2,"Upload Map Image"),n()()}}function je(r,t){if(r&1){let e=v();i(0,"div",40),_("click",function(o){m(e);let p=d();return u(p.mapPoint(o,!1))}),i(1,"div",41),l(2),n()()}if(r&2){let e=t.$implicit;N("left",e.px+"px")("top",e.py+"px"),c("title",e.label)("ngClass",e.class+" "+e.visible),s(2),M(e.label)}}function qe(r,t){if(r&1&&(i(0,"app-note"),l(1),n()),r&2){let e=d();s(),M(e.mapNote)}}function Ye(r,t){if(r&1){let e=v();i(0,"app-gps",43),_("gpsChange",function(o){m(e);let p=d(2);return u(p.applyGPS(o))}),n(),i(1,"app-note")(2,"b"),l(3,"Tip"),n(),l(4,": Right click in Google Maps to copy lat/long and paste here."),n()}if(r&2){let e=d(2);c("lat",e.selected.gpsLat)("lng",e.selected.gpsLng)}}function Je(r,t){if(r&1){let e=v();i(0,"app-footer",15)(1,"ion-card",14)(2,"ion-title"),l(3),n(),i(4,"ion-list"),y(5,Ye,5,2),n(),i(6,"ion-button",42),_("click",function(){m(e);let o=d();return u(o.delete())}),l(7,"Delete"),n()()()}if(r&2){let e=d();s(3),M(e.selected.label),s(2),C(e.selected&&e.selected.label==="GPS"?5:-1)}}var S=class S{constructor(t,e,a,o){this.api=t;this.sanitizer=e;this.location=a;this.alert=o;this.mapUri="";this.pinType="Restrooms";this.pins=[];this.title="";this.busy=!1;this.showGenMap=!1;this.showSettings=!1;this.uploading=!1;this.zoom="1";this.mapStyle="outdoors-v12";this.mapNote="";this.hasMap=!0;this.festivalTitle="";this.mapDirection=0;Se({trashBinOutline:be,cloudUploadOutline:Pe,settingsOutline:Ce})}generateMap(){return()=>h(this,null,function*(){this.api.isAdmin(this.api.festivalId)?this.showGenMap=!0:this.api.sendMessage("This feature is not available to you.")})}openSettings(){return()=>h(this,null,function*(){this.api.isAdmin(this.api.festivalId)?(this.showSettings=!0,console.log(this.mapDirection)):this.api.sendMessage("This feature is not available to you.")})}clearCamps(){return()=>h(this,null,function*(){if(!this.api.isAdmin(this.api.festivalId))this.api.sendMessage("This feature is not available to you.");else{if(!(yield V(this.alert,"Are you sure you want to clear the locations of all theme camps?","Clear")))return;this.api.clearCamps(),this.api.sendMessage("Camp locations have been cleared from the map"),this.api.clearCache()}})}clearArt(){return()=>h(this,null,function*(){if(!this.api.isAdmin(this.api.festivalId))this.api.sendMessage("This feature is not available to you.");else{if(!(yield V(this.alert,"Are you sure you want to clear the locations of all art?","Clear")))return;this.api.clearArtLocations(),this.api.sendMessage("Art locations have been cleared from the map"),this.api.clearCache()}})}clearPins(){return()=>h(this,null,function*(){if(!this.api.isAdmin(this.api.festivalId))this.api.sendMessage("This feature is not available to you.");else{if(!(yield V(this.alert,"Are you sure you want to clear the locations of all other items (restrooms, gate etc)?","Clear")))return;yield this.api.clearPinLocations(),this.ionViewWillEnter(),this.api.sendMessage("Other locations have been cleared from the map"),this.api.clearCache()}})}uploadMap(t){return()=>h(this,null,function*(){console.log(t),t.click()})}onFileSelected(t){return h(this,null,function*(){let e=t.target.files[0];if(e)try{this.uploading=!0;let a=yield ye(e);yield this.api.setMap(a),this.api.sendMessage("Map was uploaded"),this.ionViewWillEnter()}finally{this.uploading=!1}})}createMap(t){return h(this,null,function*(){this.showGenMap=!1,yield this.api.generateMap(t,parseInt(this.zoom)+12),this.ionViewWillEnter()})}applySettings(){return h(this,null,function*(){this.showSettings=!1;let t=yield this.api.getFestival(this.api.festivalId,{cached:!1});t.map_direction=this.mapDirection,yield this.api.addFestival(t),this.api.clearCache(),this.ionViewWillEnter()})}ionViewWillEnter(){return h(this,null,function*(){yield this.api.setFestivalByVanity(this.vanity);let t=yield this.api.getFestival(this.api.festivalId,{cached:!0});this.title="Map",this.festivalTitle=this.api.festivalTitle(),this.mapDirection=t.map_direction;let e=yield this.api.getMap();if(this.hasMap=!0,e.base64)this.mapUri=e?this.sanitizer.bypassSecurityTrustUrl(e.base64):"";else if(e.filename)this.mapUri=this.api.imageURL(`${this.vanity}/${e.filename}`);else{this.hasMap=!1,this.fileUpload.click();return}this.mapDirection=t.map_direction,this.pins=yield this.api.getPins(),this.recalculate()})}typeChange(t){this.filter(t.detail.value)}filter(t){for(let e of this.pins)e.visible=e.label==t?"":"hidden"}mapPoint(t,e){console.log("clicked",t,e);let a=t.clientX,o=t.clientY,f=this.map.nativeElement.getBoundingClientRect(),g=(a-f.x)*1e4/f.width,P=(o-f.y)*1e4/f.height;if(!(this.selectPin(g,P)||!e)){if(this.selected){this.selected=void 0;return}this.pins.push({x:Math.ceil(g),y:Math.ceil(P),px:Math.ceil(g)*this.width()/1e4,py:Math.ceil(P)*this.height()/1e4,label:this.pinType,gpsLat:void 0,gpsLng:void 0}),this.setMapNote()}}delete(){this.pins=this.pins.filter(t=>t.class!=="selected"),this.selected=void 0}applyGPS(t){this.pins.map(e=>{e.class==="selected"&&this.selected&&(e.gpsLat=t.lat,e.gpsLng=t.lng)})}recalculate(){for(let t of this.pins)t.px=Math.ceil(t.x)*this.width()/1e4,t.py=Math.ceil(t.y)*this.height()/1e4;this.setMapNote()}setMapNote(){let t=this.pins.filter(e=>e.label=="GPS").length;this.mapNote=t>=3?"":'You will need to add at least 3 Pins of type "GPS" with GPS coordinates for the dust app to show distances.'}save(){return h(this,null,function*(){try{this.busy=!0;for(let t of this.pins)t.class=void 0,t.px=void 0,t.py=void 0,t.visible=void 0,t.gpsLat==0&&t.gpsLng==0&&(t.gpsLat=void 0,t.gpsLng=void 0);yield this.api.placePins(this.pins),this.location.back()}finally{this.busy=!1}})}width(){return this.map.nativeElement.getBoundingClientRect().width}height(){return this.map.nativeElement.getBoundingClientRect().height}selectPin(t,e){var p,f;console.log("selectPin",t,e);let a,o=-80;for(let g of this.pins){let P=this.dist(g,t+o,e+o),U=this.height()/5;console.log("d",P,U,JSON.stringify(g)),P<U?(this.selected=g,this.selected.label==="GPS"&&(g.gpsLat=(p=g.gpsLat)!=null?p:0,g.gpsLng=(f=g.gpsLng)!=null?f:0),g.class="selected",a=g,console.log(`Selected ${g.label}`)):g.class=void 0}return a}dist(t,e,a){let o=e-t.x,p=a-t.y;return Math.sqrt(o*o+p*p)}};S.\u0275fac=function(e){return new(e||S)(w(xe),w(X),w(q),w(we))},S.\u0275cmp=D({type:S,selectors:[["app-pins"]],viewQuery:function(e,a){if(e&1&&(G(Le,5),G(ke,5)),e&2){let o;O(o=F())&&(a.map=o.first),O(o=F())&&(a.fileUpload=o.first)}},inputs:{vanity:"vanity"},decls:27,vars:10,consts:[["fileUpload",""],["map",""],["color","primary"],["slot","start"],["routerLink","../"],["slot","end"],[3,"click","disabled"],[3,"fullscreen"],[3,"isOpen"],["type","file",1,"file-input",3,"change"],[1,"ion-text-center",2,"padding-top","45vh"],[1,"map"],[1,"pin",3,"title","ngClass","left","top"],[3,"resize","click","src"],[1,"ion-padding"],["width","300px"],["lines","none"],["labelPlacement","fixed","interface","popover","placeholder","Pin Types",3,"ionChange","ngModelChange","ngModel","value"],["value","Restrooms"],["value","Gate"],["value","Greeters"],["value","Shuttle Stop"],["value","Ice"],["value","Medical"],["value","GPS"],[3,"hideProfile","buttons"],[3,"ngModelChange","ngModel"],[1,"row"],["labelPlacement","end",3,"value"],["labelPlacement","start",3,"value"],[1,"ion-text-center","ion-padding"],[3,"click"],["mode","ios",3,"ngModelChange","ngModel","value"],["value","outdoors-v12"],["value","satellite-v9"],["value","satellite-streets-v12"],["value","streets-v12"],["value","light-v11"],["value","dark-v11"],[3,"value"],[1,"pin",3,"click","title","ngClass"],[1,"label"],["shape","round","color","primary","mode","md",3,"click"],[3,"gpsChange","lat","lng"]],template:function(e,a){if(e&1){let o=v();i(0,"ion-header")(1,"ion-toolbar",2)(2,"ion-buttons",3),b(3,"ion-back-button"),n(),i(4,"ion-title",4),l(5),n(),i(6,"ion-buttons",5)(7,"ion-button",6),_("click",function(){return m(o),u(a.save())}),l(8,"Save"),n()()(),y(9,Re,22,23,"ion-toolbar"),n(),i(10,"ion-content",7)(11,"ion-modal",8),y(12,De,32,9,"ng-template"),n(),i(13,"ion-modal",8),y(14,He,37,6,"ng-template"),n(),i(15,"div")(16,"input",9,0),_("change",function(f){return m(o),u(a.onFileSelected(f))}),n(),y(18,Qe,3,0,"div",10),i(19,"div",11),k(20,je,3,7,"div",12,L),n(),i(22,"img",13,1),_("resize",function(){return m(o),u(a.recalculate())},!1,R)("click",function(f){return m(o),u(a.mapPoint(f,!0))}),n()(),b(24,"div",14),y(25,qe,2,1,"app-note")(26,Je,8,2,"app-footer",15),n()}e&2&&(s(5),B(" ",a.title," "),s(2),c("disabled",a.busy),s(2),C(a.hasMap?9:-1),s(),c("fullscreen",!0),s(),c("isOpen",a.showSettings),s(2),c("isOpen",a.showGenMap),s(5),C(a.hasMap?-1:18),s(2),z(a.pins),s(2),c("src",a.mapUri,W),s(3),C(a.hasMap?25:-1),s(),C(a.selected?26:-1))},dependencies:[me,ce,_e,fe,he,te,se,Me,oe,J,Y,$,Z,K,le,ge,ne,ee,ue,ie,pe,re,ve,de,ae,Ee,Te,Ie],styles:["img[_ngcontent-%COMP%]{user-drag:none;user-select:none;-moz-user-select:none;-webkit-user-drag:none;-webkit-user-select:none;-ms-user-select:none}.placed[_ngcontent-%COMP%]{background-color:red!important;border:2px solid white!important;width:var(--pin-size-placed);height:var(--pin-size-placed);border-radius:var(--pin-size-placed)}.selected[_ngcontent-%COMP%]{background-color:#ff9191!important;border:3px solid red!important}.pin[_ngcontent-%COMP%]   .label[_ngcontent-%COMP%]{visibility:hidden;width:100px;margin-left:var(--pin-size);margin-top:calc(var(---pin-size/2));color:#fff;background:#000;border-radius:10px;padding:3px;text-align:center}.pin[_ngcontent-%COMP%]:hover   .label[_ngcontent-%COMP%]{visibility:visible}.pin[_ngcontent-%COMP%]{width:var(--pin-size);height:var(--pin-size);border-radius:var(--pin-size);background-color:#fff;border:2px solid red;position:absolute;cursor:pointer}.hidden[_ngcontent-%COMP%]{opacity:.5}.map[_ngcontent-%COMP%]{position:absolute;--pin-size: 10px;--pin-size-placed: 15px}ion-select[_ngcontent-%COMP%]{margin-left:.5rem;padding-left:1rem;border:2px solid var(--ion-color-medium);border-radius:1rem;max-width:200px}.row[_ngcontent-%COMP%]{display:flex;width:100%;align-items:center;justify-content:space-between}ion-radio[_ngcontent-%COMP%]{padding:1rem}"]});var Ve=S;export{Ve as PinsPage};
