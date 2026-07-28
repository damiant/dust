import {T}from'./chunk-Bb77wLmp.js';import {B}from'./chunk-CFyZIZuv.js';import'./chunk-DSCoAJBk.js';import {e as su,w,T as T$1,V,C,bY as l1,bF as o,G as G$1,W as WN,D as GN,aM as $3,bw as ml,aZ as IO,E as fQ,F as dQ,I as T5,N as NF,L as due,M as Due,O as Xde,P as zde,R as Eue,a5 as Zde,i as iue,r as a6,x as wue,af as e1,g as ga,b as Jd,s as sl,c as CR,A as Ye,ai as y1,ak as P2,aj as UN,B as zN,Z as Zm,al as v1,am as L2,d as br,$ as $N,aP as Ca,aQ as hi,aR as fi,aT as pY,ac as sd,v as v$1,be as hg,bg as fg,ag as nu,ae as m1,ao as bg,c3 as t1,c4 as Kk,ap as xf,ar as SR,aq as wf,at as Yw}from'./main-NXCBWGKF.js';import {v}from'./chunk-CcRvFAFl.js';import'./chunk-Ddr8RMFh.js';import'./chunk-CQjzQBv7.js';function Ie(n,i){return `
<style>
@font-face {
    font-family: 'Gelion Regular';
    font-style: normal;
    font-weight: normal;
    src: local('Gelion Regular'), url('/assets/fonts/gelion-regular.woff') format('woff');
}
@font-face {
    font-family: 'Grotesk Bold';
    font-style: normal;
    font-weight: normal;
    src: local('Grotesk Bold'), url('/assets/fonts/grotesk-bold.woff') format('woff');
}

@font-face {
    font-family: 'Nunito';
    font-style: normal;
    font-weight: normal;
    src: local('Nunito'), url('/assets/fonts/nunito-extrabold.woff') format('woff');
}


p, span {
    font-family: 'Gelion Regular';
    margin: 0;
    font-size: 0.8rem;
}

a {
    text-decoration: none;
}

.desc {
    display: ${i>0?"-webkit-box":"none"};
    -webkit-line-clamp: ${i};
    line-clamp: ${i};
    -webkit-box-orient: vertical; 
    overflow: hidden;
    font-size: 0.7rem;
}

.time {
    padding-top: 0rem;    
    font-size: 0.8rem;
}


.event-header {
    display: flex;
    align-items: center;
    padding-bottom: 0.5rem;
}

.camp-header {
    display: flex;    
    width: 100%;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 0.5rem;
}
.title {
    page-break-before: always;
    margin-top: 50px;
}

.break {
      page-break-after: always;
}
.after-break {
    height: 50px;
    border-bottom: 1px solid grey;
}

.camp {
    color: #F61067; 
}

.event {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    page-break-inside: avoid;
}

span {
    margin-top: 1rem;
    font-weight: bold;
}

h1, h2 {
    font-family: 'Nunito';
    margin: 0;
}

header, footer {
    text-align: center;
}

h3 {
    font-family: 'Grotesk Bold';    
    font-size: 0.8rem;
    margin: 0;
}

img {
    height: 50px;
    width: 50px;
    object-fit: cover;
    margin-right: 0.5rem;
    border-radius: 0.5rem;
}

img.camp {
    float: left;
}

.container {
   max-width: 1200px;
   margin-left: 0rem;
   margin-right: 0rem;
}

.columns-container {
    columns: ${n>4?"110":"150"}px ${n};
    column-gap: 1.5rem;
    column-rule 1px solid #f1f1f1;
    padding: 1rem;

    > * + * {
        margin-top: 1rem;
    }
}

@page {
    margin-top: 1cm;
    margin-bottom: 1cm;
    @top-center {
        content: element(pageHeader);
    }

    @bottom-center {
        content: element(pageFooter);
    }
}

.page-break {
    page-break-before: always;
}

#pageHeader{
    position: running(pageHeader);
}

#pageFooter{
    position: running(pageFooter);
}
</style>
`}var Pe=(n,i)=>i.id;function Ee(n,i){if(n&1&&(hg(0,"h2",0),CR(1),fg()),n&2){let e=nu().$implicit;Zm(),m1(e.heading);}}function Se(n,i){if(n&1&&Kk(0,"img",3),n&2){let e=nu().$implicit;t1("src",e.image,Yw);}}function Te(n,i){if(n&1&&(zN(0,Ee,2,1,"h2",0),hg(1,"div",1)(2,"div",2),zN(3,Se,1,1,"img",3),hg(4,"div")(5,"h3"),CR(6),fg(),hg(7,"p",4),CR(8),fg(),hg(9,"a",5)(10,"p",6),CR(11),fg()()()(),hg(12,"p",7),CR(13),fg()()),n&2){let e=i.$implicit,t=nu();$N(e.heading?0:-1),Zm(3),$N(e.image&&!t.hideImages()?3:-1),Zm(3),m1(e.title),Zm(2),bg(" ",e.timeString," "),Zm(),t1("href",e.campUrl,Yw),Zm(2),m1(t.eventLocation(e)),Zm(2),m1(e.description);}}var U=class U{constructor(){this.events=[];this.day=su("day");this.excluded=su("");this.hideImages=pY(false);this.pbOnDay=pY(true);this.eventService=w(T);this.api=w(T$1);sd(()=>{this.excluded(),this.loadEvents();});}ngOnInit(){return C(this,null,function*(){yield this.loadEvents();})}loadEvents(){return C(this,null,function*(){this.events=yield this.eventService.getPrintableEvents(this.api.vanity(),yield this.api.events({cached:true}),this.day(),this.excluded());})}eventLocation(i){return v$1(i.camp)?i.other_location??"":i.camp??""}};U.\u0275fac=function(e){return new(e||U)},U.\u0275cmp=G$1({type:U,selectors:[["app-print-events"]],inputs:{day:[1,"day"],excluded:[1,"excluded"],hideImages:[1,"hideImages"],pbOnDay:[1,"pbOnDay"]},outputs:{hideImages:"hideImagesChange",pbOnDay:"pbOnDayChange"},decls:2,vars:0,consts:[[1,"title"],[1,"event"],[1,"event-header"],[3,"src"],[1,"time"],[3,"href"],[1,"camp"],[1,"desc"]],template:function(e,t){e&1&&WN(0,Te,14,7,null,null,Pe),e&2&&GN(t.events);},encapsulation:2,changeDetection:1});var G=U;var Me=(n,i)=>i.id;function De(n,i){if(n&1&&Kk(0,"img",2),n&2){let e=nu().$implicit;t1("src",e.imageUrl,Yw);}}function Oe(n,i){if(n&1&&(hg(0,"div",0)(1,"div",1)(2,"h3"),CR(3),fg()(),hg(4,"p"),zN(5,De,1,1,"img",2),CR(6),fg()()),n&2){let e=i.$implicit,t=nu();Zm(3),m1(e.name),Zm(2),$N(e.imageUrl&&!t.hideImages()?5:-1),Zm(),bg(" ",e.description," ");}}var L=class L{constructor(){this.api=w(T$1);this.camps=[];this.hideImages=pY(false);}ngOnInit(){return C(this,null,function*(){this.camps=yield this.api.camps({cached:false}),this.camps.map(i=>{i.imageUrl&&(i.imageUrl=this.api.imageURL(i.imageUrl));});})}};L.\u0275fac=function(e){return new(e||L)},L.\u0275cmp=G$1({type:L,selectors:[["app-print-camps"]],inputs:{hideImages:[1,"hideImages"]},outputs:{hideImages:"hideImagesChange"},decls:2,vars:0,consts:[[1,"event"],[1,"camp-header"],[1,"camp",3,"src"]],template:function(e,t){e&1&&WN(0,Oe,7,3,"div",0,Me),e&2&&GN(t.camps);},encapsulation:2,changeDetection:1});var Z=L;var ke=(n,i)=>i.id;function Fe(n,i){if(n&1&&Kk(0,"img",2),n&2){let e=nu().$implicit;t1("src",e.imageUrl,Yw);}}function We(n,i){if(n&1&&(hg(0,"div",0)(1,"div",1)(2,"h3"),CR(3),fg()(),hg(4,"p"),zN(5,Fe,1,1,"img",2),CR(6),fg()()),n&2){let e=i.$implicit,t=nu();Zm(3),m1(e.name),Zm(2),$N(e.imageUrl&&!t.hideImages()?5:-1),Zm(),bg(" ",e.description," ");}}var A=class A{constructor(){this.api=w(T$1);this.art=[];this.hideImages=pY(false);}ngOnInit(){return C(this,null,function*(){this.art=yield this.api.art({cached:false}),this.art.map(i=>{i.imageUrl&&(i.imageUrl=this.api.imageURL(i.imageUrl));});})}};A.\u0275fac=function(e){return new(e||A)},A.\u0275cmp=G$1({type:A,selectors:[["app-print-art"]],inputs:{hideImages:[1,"hideImages"]},outputs:{hideImages:"hideImagesChange"},decls:2,vars:0,consts:[[1,"event"],[1,"camp-header"],[1,"camp",3,"src"]],template:function(e,t){e&1&&WN(0,We,7,3,"div",0,ke),e&2&&GN(t.art);},encapsulation:2,changeDetection:1});var Q=A;var Ve=["frame"];function Be(n,i){if(n&1&&(ga(0,"ion-select-option",23),CR(1),sl()),n&2){let e=i.$implicit;br("value",e),Zm(),m1(e);}}function Ne(n,i){n&1&&Jd(0,"app-spinner");}function Ue(n,i){if(n&1){let e=e1();ga(0,"header",28)(1,"h1"),CR(2),sl(),ga(3,"h2"),CR(4),sl()(),ga(5,"div",29)(6,"div",30)(7,"app-print-events",31),y1("pbOnDayChange",function(m){xf(e);let s=nu(2);return SR(s.pbOnDay,m)||(s.pbOnDay=m),wf(m)})("hideImagesChange",function(m){xf(e);let s=nu(2);return SR(s.hideImages,m)||(s.hideImages=m),wf(m)}),sl()()();}if(n&2){let e=i.$implicit,t=nu(2);br("ngClass",t.pbOnDay?"page-break":""),Zm(2),m1(t.title),Zm(2),bg("",e," Events"),Zm(3),v1("pbOnDay",t.pbOnDay),br("excluded",t.excluded),v1("hideImages",t.hideImages),br("day",e);}}function Le(n,i){if(n&1&&WN(0,Ue,8,7,null,null,UN),n&2){let e=nu();GN(e.days);}}function Ae(n,i){if(n&1){let e=e1();ga(0,"header",32)(1,"h1"),CR(2),sl(),ga(3,"h2"),CR(4,"Theme Camps"),sl()(),ga(5,"div",29)(6,"div",30)(7,"app-print-camps",33),y1("hideImagesChange",function(m){xf(e);let s=nu();return SR(s.hideImages,m)||(s.hideImages=m),wf(m)}),sl()()();}if(n&2){let e=nu();Zm(2),m1(e.title),Zm(5),v1("hideImages",e.hideImages);}}function Re(n,i){if(n&1){let e=e1();ga(0,"header",32)(1,"h1"),CR(2),sl(),ga(3,"h2"),CR(4,"Art"),sl()(),ga(5,"div",29)(6,"div",30)(7,"app-print-art",33),y1("hideImagesChange",function(m){xf(e);let s=nu();return SR(s.hideImages,m)||(s.hideImages=m),wf(m)}),sl()()();}if(n&2){let e=nu();Zm(2),m1(e.title),Zm(5),v1("hideImages",e.hideImages);}}var R=class R{constructor(){this.vanity=su();this.title="";this.busy=true;this.diffTimeZone="";this.showing="all";this.imageUrl="";this.pbOnDay=true;this.hideImages=false;this.filter="all";this.excludedTypes=[];this.excluded="";this.eventTypes=[];this.columns="3";this.lines="6";this.days=[];this.eventService=w(T);this.api=w(T$1);V({add:o,printOutline:l1});}ngOnInit(){return C(this,null,function*(){this.title=this.api.festivalTitle(),this.diffTimeZone=this.api.currentTimeZone()==this.api.festivalTimeZone()?"":this.api.festivalTimeZone(),yield this.api.setFestivalByVanity(this.vanity()),this.imageUrl=this.api.imageURL(this.api.festivalImage())??"";let i=yield this.api.getFestival(this.api.festivalId,{cached:true});this.eventTypes=i.event_types?i.event_types.split(`
`):B;})}print(){this.iFrame.nativeElement.contentWindow.focus(),this.iFrame.nativeElement.contentWindow.print();}ionViewDidEnter(){return C(this,null,function*(){yield this.refresh(),setTimeout(()=>{this.busy=false,this.copyToIFrame();},4e3);})}hasEvents(){return this.filter=="all"||this.filter=="events"}hasCamps(){return this.filter=="all"||this.filter=="camps"}hasArt(){return this.filter=="all"||this.filter=="art"}update(){this.excluded=this.excludedTypes.join(","),this.busy=true,setTimeout(()=>{this.busy=false,this.copyToIFrame();},4e3);}copyToIFrame(){let i=document.getElementById("page"),e=this.iFrame.nativeElement.contentDocument;e.open(),e.write(Ie(parseInt(this.columns),parseInt(this.lines))),e.write(i?.innerHTML),e.close();}festivalImage(){return this.api.imageURL(this.api.festivalImage())}refresh(){return C(this,null,function*(){this.days=yield this.eventService.getEventDays(this.api.vanity(),yield this.api.events({cached:false}));})}};R.\u0275fac=function(e){return new(e||R)},R.\u0275cmp=G$1({type:R,selectors:[["app-print"]],viewQuery:function(e,t){if(e&1&&Ca(Ve,5),e&2){let m;hi(m=fi())&&(t.iFrame=m.first);}},inputs:{vanity:[1,"vanity"]},decls:71,vars:18,consts:[["frame",""],["color","primary"],["slot","start"],["slot","end"],[3,"click"],[3,"ionChange","ngModelChange","ngModel"],[2,"padding","1rem"],["justify","start","label","COLUMNS","aria-label","Columns","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","1"],["value","2"],["value","3"],["value","4"],["value","5"],["justify","start","label","MAX LINES","aria-label","Maximum Lines","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","0"],["value","6"],["value","10"],["justify","start","label","FILTER","aria-label","Filter by Type","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","all"],["value","camps"],["value","events"],["value","art"],["label","EXCLUDE TYPES","interface","popover","placeholder","Select event types to exclude",2,"max-width","200px",3,"ionChange","ngModelChange","multiple","value","ngModel"],[3,"value"],[3,"fullscreen"],[3,"scrolling","frameBorder"],["id","page",2,"display","none"],["id","pageFooter"],["id","pageHeader",3,"ngClass"],[1,"container"],[1,"columns-container"],[3,"pbOnDayChange","hideImagesChange","pbOnDay","excluded","hideImages","day"],["id","pageHeader",1,"page-break"],[3,"hideImagesChange","hideImages"]],template:function(e,t){if(e&1){let m=e1();ga(0,"ion-header")(1,"ion-toolbar",1)(2,"ion-buttons",2),Jd(3,"ion-back-button"),sl(),ga(4,"ion-title"),CR(5,"Print Preview"),sl(),ga(6,"ion-buttons",3)(7,"ion-button",4),Ye("click",function(){return t.print()}),CR(8,"Print"),sl()()(),ga(9,"ion-toolbar",1)(10,"ion-buttons")(11,"ion-button")(12,"ion-checkbox",5),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.hideImages,p)||(t.hideImages=p),wf(p)}),CR(13,"Hide Images"),sl(),P2(),sl(),Jd(14,"div",6),ga(15,"ion-select",7),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.columns,p)||(t.columns=p),wf(p)}),ga(16,"ion-select-option",8),CR(17,"1"),sl(),ga(18,"ion-select-option",9),CR(19,"2"),sl(),ga(20,"ion-select-option",10),CR(21,"3"),sl(),ga(22,"ion-select-option",11),CR(23,"4"),sl(),ga(24,"ion-select-option",12),CR(25,"5"),sl()(),P2(),Jd(26,"div",6),ga(27,"ion-select",13),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.lines,p)||(t.lines=p),wf(p)}),ga(28,"ion-select-option",14),CR(29,"0"),sl(),ga(30,"ion-select-option",8),CR(31,"1"),sl(),ga(32,"ion-select-option",9),CR(33,"2"),sl(),ga(34,"ion-select-option",10),CR(35,"3"),sl(),ga(36,"ion-select-option",11),CR(37,"4"),sl(),ga(38,"ion-select-option",12),CR(39,"5"),sl(),ga(40,"ion-select-option",15),CR(41,"6"),sl(),ga(42,"ion-select-option",16),CR(43,"10"),sl()(),P2(),Jd(44,"div",6),ga(45,"ion-select",17),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.filter,p)||(t.filter=p),wf(p)}),ga(46,"ion-select-option",18),CR(47,"All"),sl(),ga(48,"ion-select-option",19),CR(49,"Camps"),sl(),ga(50,"ion-select-option",20),CR(51,"Events"),sl(),ga(52,"ion-select-option",21),CR(53,"Art"),sl()(),P2(),Jd(54,"div",6),ga(55,"ion-select",22),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.excludedTypes,p)||(t.excludedTypes=p),wf(p)}),WN(56,Be,2,2,"ion-select-option",23,UN),sl(),P2(),ga(58,"ion-button")(59,"ion-checkbox",5),Ye("ionChange",function(){return t.update()}),y1("ngModelChange",function(p){return xf(m),SR(t.pbOnDay,p)||(t.pbOnDay=p),wf(p)}),CR(60,"Page Break on Day"),sl(),P2(),sl()()()(),ga(61,"ion-content",24),zN(62,Ne,1,0,"app-spinner"),Jd(63,"iframe",25,0),ga(65,"div",26),zN(66,Le,2,0),zN(67,Ae,8,2),zN(68,Re,8,2),ga(69,"footer",27),CR(70,"-"),sl()()();}e&2&&(Zm(12),v1("ngModel",t.hideImages),L2(),Zm(3),v1("ngModel",t.columns),br("value",t.columns),L2(),Zm(12),v1("ngModel",t.lines),br("value",t.lines),L2(),Zm(18),v1("ngModel",t.filter),br("value",t.filter),L2(),Zm(10),br("multiple",true)("value",t.excludedTypes),v1("ngModel",t.excludedTypes),L2(),Zm(),GN(t.eventTypes),Zm(3),v1("ngModel",t.pbOnDay),L2(),Zm(2),br("fullscreen",true),Zm(),$N(t.busy?62:-1),Zm(),br("scrolling","no")("frameBorder",0),Zm(3),$N(t.hasEvents()?66:-1),Zm(),$N(t.hasCamps()?67:-1),Zm(),$N(t.hasArt()?68:-1));},dependencies:[$3,v,ml,IO,fQ,dQ,T5,NF,due,Due,Xde,zde,Eue,Zde,iue,G,Z,Q,a6,wue],styles:["iframe[_ngcontent-%COMP%]{height:100%;width:100%}ion-checkbox[_ngcontent-%COMP%]{font-family:Gelion Regular;font-size:medium}ion-select[_ngcontent-%COMP%]{font-size:medium;width:unset}ion-select[_ngcontent-%COMP%]::part(icon){color:#fff!important}"],changeDetection:1});var we=R;export{we as PrintPage};