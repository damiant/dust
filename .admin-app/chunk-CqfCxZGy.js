import {T}from'./chunk-DFLKSm2I.js';import {B}from'./chunk-CCQ92MH-.js';import'./chunk-Cwba5CO3.js';import {e as au,x,T as T$1,V,C,bY as l1,bF as o,U as U$1,$ as $N,H as HN,aM as V3,bw as fl,aZ as kO,L as uQ,M as sQ,O as DF,P as T5,R as sue,S as kue,W as Gde,Z as jde,_ as wue,a5 as qde,t as tue,r as i6,w as vue,af as Jk,m as ma,Q as Qd,c as al,b as xR,A as Ge,ai as v1,ak as R2,aj as zN,B as jN,E as Ym,al as b1,am as P2,g as gr,F as BN,aP as ka,aQ as pi,aR as hi,aT as dY,a9 as uo,ac as ad,v as v$1,be as pg,bg as hg,ag as tu,ae as f1,ao as gg,c3 as e1,c4 as Xk,ap as yf,ar as DR,aq as xf,at as Yw}from'./main-5QDBEVG6.js';import {v}from'./chunk-D06bDEqK.js';import'./chunk-Ddr8RMFh.js';import'./chunk-DbZJ2CZW.js';function Pe(n,i){return `
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
`}var Ee=(n,i)=>i.id;function Se(n,i){if(n&1&&(pg(0,"h2",0),xR(1),hg()),n&2){let e=tu().$implicit;Ym(),f1(e.heading);}}function Te(n,i){if(n&1&&Xk(0,"img",3),n&2){let e=tu().$implicit;e1("src",e.image,Yw);}}function Me(n,i){if(n&1&&(jN(0,Se,2,1,"h2",0),pg(1,"div",1)(2,"div",2),jN(3,Te,1,1,"img",3),pg(4,"div")(5,"h3"),xR(6),hg(),pg(7,"p",4),xR(8),hg(),pg(9,"a",5)(10,"p",6),xR(11),hg()()()(),pg(12,"p",7),xR(13),hg()()),n&2){let e=i.$implicit,t=tu();BN(e.heading?0:-1),Ym(3),BN(e.image&&!t.hideImages()?3:-1),Ym(3),f1(e.title),Ym(2),gg(" ",e.timeString," "),Ym(),e1("href",e.campUrl,Yw),Ym(2),f1(t.eventLocation(e)),Ym(2),f1(e.description);}}var U=class U{constructor(){this.events=[];this.day=au("day");this.excluded=au("");this.hideImages=dY(false);this.pbOnDay=dY(true);this.inited=false;this.done=uo(()=>console.log(this.hideImages()));this.eventService=x(T);this.api=x(T$1);ad(()=>{this.excluded();this.ngOnInit();});}ngOnInit(){return C(this,null,function*(){this.inited||(this.inited=true,this.events=yield this.eventService.getPrintableEvents(this.api.vanity(),yield this.api.events({cached:true}),this.day(),this.excluded()));})}eventLocation(i){return v$1(i.camp)?i.other_location??"":i.camp??""}};U.\u0275fac=function(e){return new(e||U)},U.\u0275cmp=U$1({type:U,selectors:[["app-print-events"]],inputs:{day:[1,"day"],excluded:[1,"excluded"],hideImages:[1,"hideImages"],pbOnDay:[1,"pbOnDay"]},outputs:{hideImages:"hideImagesChange",pbOnDay:"pbOnDayChange"},decls:2,vars:0,consts:[[1,"title"],[1,"event"],[1,"event-header"],[3,"src"],[1,"time"],[3,"href"],[1,"camp"],[1,"desc"]],template:function(e,t){e&1&&$N(0,Me,14,7,null,null,Ee),e&2&&HN(t.events);},encapsulation:2,changeDetection:1});var G=U;var De=(n,i)=>i.id;function Oe(n,i){if(n&1&&Xk(0,"img",2),n&2){let e=tu().$implicit;e1("src",e.imageUrl,Yw);}}function ke(n,i){if(n&1&&(pg(0,"div",0)(1,"div",1)(2,"h3"),xR(3),hg()(),pg(4,"p"),jN(5,Oe,1,1,"img",2),xR(6),hg()()),n&2){let e=i.$implicit,t=tu();Ym(3),f1(e.name),Ym(2),BN(e.imageUrl&&!t.hideImages()?5:-1),Ym(),gg(" ",e.description," ");}}var L=class L{constructor(){this.api=x(T$1);this.camps=[];this.hideImages=dY(false);}ngOnInit(){return C(this,null,function*(){this.camps=yield this.api.camps({cached:false}),this.camps.map(i=>{i.imageUrl&&(i.imageUrl=this.api.imageURL(i.imageUrl));});})}};L.\u0275fac=function(e){return new(e||L)},L.\u0275cmp=U$1({type:L,selectors:[["app-print-camps"]],inputs:{hideImages:[1,"hideImages"]},outputs:{hideImages:"hideImagesChange"},decls:2,vars:0,consts:[[1,"event"],[1,"camp-header"],[1,"camp",3,"src"]],template:function(e,t){e&1&&$N(0,ke,7,3,"div",0,De),e&2&&HN(t.camps);},encapsulation:2,changeDetection:1});var Z=L;var Fe=(n,i)=>i.id;function We(n,i){if(n&1&&Xk(0,"img",2),n&2){let e=tu().$implicit;e1("src",e.imageUrl,Yw);}}function Ve(n,i){if(n&1&&(pg(0,"div",0)(1,"div",1)(2,"h3"),xR(3),hg()(),pg(4,"p"),jN(5,We,1,1,"img",2),xR(6),hg()()),n&2){let e=i.$implicit,t=tu();Ym(3),f1(e.name),Ym(2),BN(e.imageUrl&&!t.hideImages()?5:-1),Ym(),gg(" ",e.description," ");}}var A=class A{constructor(){this.api=x(T$1);this.art=[];this.hideImages=dY(false);}ngOnInit(){return C(this,null,function*(){this.art=yield this.api.art({cached:false}),this.art.map(i=>{i.imageUrl&&(i.imageUrl=this.api.imageURL(i.imageUrl));});})}};A.\u0275fac=function(e){return new(e||A)},A.\u0275cmp=U$1({type:A,selectors:[["app-print-art"]],inputs:{hideImages:[1,"hideImages"]},outputs:{hideImages:"hideImagesChange"},decls:2,vars:0,consts:[[1,"event"],[1,"camp-header"],[1,"camp",3,"src"]],template:function(e,t){e&1&&$N(0,Ve,7,3,"div",0,Fe),e&2&&HN(t.art);},encapsulation:2,changeDetection:1});var Q=A;var Be=["frame"];function Ne(n,i){if(n&1&&(ma(0,"ion-select-option",23),xR(1),al()),n&2){let e=i.$implicit;gr("value",e),Ym(),f1(e);}}function Ue(n,i){n&1&&Qd(0,"app-spinner");}function Le(n,i){if(n&1){let e=Jk();ma(0,"header",28)(1,"h1"),xR(2),al(),ma(3,"h2"),xR(4),al()(),ma(5,"div",29)(6,"div",30)(7,"app-print-events",31),v1("pbOnDayChange",function(m){yf(e);let s=tu(2);return DR(s.pbOnDay,m)||(s.pbOnDay=m),xf(m)})("hideImagesChange",function(m){yf(e);let s=tu(2);return DR(s.hideImages,m)||(s.hideImages=m),xf(m)}),al()()();}if(n&2){let e=i.$implicit,t=tu(2);gr("ngClass",t.pbOnDay?"page-break":""),Ym(2),f1(t.title),Ym(2),gg("",e," Events"),Ym(3),b1("pbOnDay",t.pbOnDay),gr("excluded",t.excluded),b1("hideImages",t.hideImages),gr("day",e);}}function Ae(n,i){if(n&1&&$N(0,Le,8,7,null,null,zN),n&2){let e=tu();HN(e.days);}}function Re(n,i){if(n&1){let e=Jk();ma(0,"header",32)(1,"h1"),xR(2),al(),ma(3,"h2"),xR(4,"Theme Camps"),al()(),ma(5,"div",29)(6,"div",30)(7,"app-print-camps",33),v1("hideImagesChange",function(m){yf(e);let s=tu();return DR(s.hideImages,m)||(s.hideImages=m),xf(m)}),al()()();}if(n&2){let e=tu();Ym(2),f1(e.title),Ym(5),b1("hideImages",e.hideImages);}}function ze(n,i){if(n&1){let e=Jk();ma(0,"header",32)(1,"h1"),xR(2),al(),ma(3,"h2"),xR(4,"Art"),al()(),ma(5,"div",29)(6,"div",30)(7,"app-print-art",33),v1("hideImagesChange",function(m){yf(e);let s=tu();return DR(s.hideImages,m)||(s.hideImages=m),xf(m)}),al()()();}if(n&2){let e=tu();Ym(2),f1(e.title),Ym(5),b1("hideImages",e.hideImages);}}var R=class R{constructor(){this.vanity=au();this.title="";this.busy=true;this.diffTimeZone="";this.showing="all";this.imageUrl="";this.pbOnDay=true;this.hideImages=false;this.filter="all";this.excludedTypes=[];this.excluded="";this.eventTypes=[];this.columns="3";this.lines="6";this.days=[];this.eventService=x(T);this.api=x(T$1);V({add:o,printOutline:l1});}ngOnInit(){return C(this,null,function*(){this.title=this.api.festivalTitle(),this.diffTimeZone=this.api.currentTimeZone()==this.api.festivalTimeZone()?"":this.api.festivalTimeZone(),yield this.api.setFestivalByVanity(this.vanity()),this.imageUrl=this.api.imageURL(this.api.festivalImage())??"";let i=yield this.api.getFestival(this.api.festivalId,{cached:true});this.eventTypes=i.event_types?i.event_types.split(`
`):B;})}print(){this.iFrame.nativeElement.contentWindow.focus(),this.iFrame.nativeElement.contentWindow.print();}ionViewDidEnter(){return C(this,null,function*(){yield this.refresh(),setTimeout(()=>{this.busy=false,this.copyToIFrame();},4e3);})}hasEvents(){return this.filter=="all"||this.filter=="events"}hasCamps(){return this.filter=="all"||this.filter=="camps"}hasArt(){return this.filter=="all"||this.filter=="art"}update(){this.excluded=this.excludedTypes.join(","),this.busy=true,setTimeout(()=>{this.busy=false,this.copyToIFrame();},4e3);}copyToIFrame(){let i=document.getElementById("page"),e=this.iFrame.nativeElement.contentDocument;e.open(),e.write(Pe(parseInt(this.columns),parseInt(this.lines))),e.write(i?.innerHTML),e.close();}festivalImage(){return this.api.imageURL(this.api.festivalImage())}refresh(){return C(this,null,function*(){this.days=yield this.eventService.getEventDays(this.api.vanity(),yield this.api.events({cached:false}));})}};R.\u0275fac=function(e){return new(e||R)},R.\u0275cmp=U$1({type:R,selectors:[["app-print"]],viewQuery:function(e,t){if(e&1&&ka(Be,5),e&2){let m;pi(m=hi())&&(t.iFrame=m.first);}},inputs:{vanity:[1,"vanity"]},decls:71,vars:18,consts:[["frame",""],["color","primary"],["slot","start"],["slot","end"],[3,"click"],[3,"ionChange","ngModelChange","ngModel"],[2,"padding","1rem"],["slot","end","label","COLUMNS","aria-label","Columns","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","1"],["value","2"],["value","3"],["value","4"],["value","5"],["slot","end","label","MAX LINES","aria-label","Maximum Lines","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","0"],["value","6"],["value","10"],["slot","end","label","FILTER","aria-label","Filter by Type","interface","popover",3,"ionChange","ngModelChange","ngModel","value"],["value","all"],["value","camps"],["value","events"],["value","art"],["label","EXCLUDE TYPES","interface","popover","placeholder","Select event types to exclude",2,"max-width","200px",3,"ionChange","ngModelChange","multiple","value","ngModel"],[3,"value"],[3,"fullscreen"],[3,"scrolling","frameBorder"],["id","page",2,"display","none"],["id","pageFooter"],["id","pageHeader",3,"ngClass"],[1,"container"],[1,"columns-container"],[3,"pbOnDayChange","hideImagesChange","pbOnDay","excluded","hideImages","day"],["id","pageHeader",1,"page-break"],[3,"hideImagesChange","hideImages"]],template:function(e,t){if(e&1){let m=Jk();ma(0,"ion-header")(1,"ion-toolbar",1)(2,"ion-buttons",2),Qd(3,"ion-back-button"),al(),ma(4,"ion-title"),xR(5,"Print Preview"),al(),ma(6,"ion-buttons",3)(7,"ion-button",4),Ge("click",function(){return t.print()}),xR(8,"Print"),al()()(),ma(9,"ion-toolbar",1)(10,"ion-buttons")(11,"ion-button")(12,"ion-checkbox",5),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.hideImages,p)||(t.hideImages=p),xf(p)}),xR(13,"Hide Images"),al(),R2(),al(),Qd(14,"div",6),ma(15,"ion-select",7),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.columns,p)||(t.columns=p),xf(p)}),ma(16,"ion-select-option",8),xR(17,"1"),al(),ma(18,"ion-select-option",9),xR(19,"2"),al(),ma(20,"ion-select-option",10),xR(21,"3"),al(),ma(22,"ion-select-option",11),xR(23,"4"),al(),ma(24,"ion-select-option",12),xR(25,"5"),al()(),R2(),Qd(26,"div",6),ma(27,"ion-select",13),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.lines,p)||(t.lines=p),xf(p)}),ma(28,"ion-select-option",14),xR(29,"0"),al(),ma(30,"ion-select-option",8),xR(31,"1"),al(),ma(32,"ion-select-option",9),xR(33,"2"),al(),ma(34,"ion-select-option",10),xR(35,"3"),al(),ma(36,"ion-select-option",11),xR(37,"4"),al(),ma(38,"ion-select-option",12),xR(39,"5"),al(),ma(40,"ion-select-option",15),xR(41,"6"),al(),ma(42,"ion-select-option",16),xR(43,"10"),al()(),R2(),Qd(44,"div",6),ma(45,"ion-select",17),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.filter,p)||(t.filter=p),xf(p)}),ma(46,"ion-select-option",18),xR(47,"All"),al(),ma(48,"ion-select-option",19),xR(49,"Camps"),al(),ma(50,"ion-select-option",20),xR(51,"Events"),al(),ma(52,"ion-select-option",21),xR(53,"Art"),al()(),R2(),Qd(54,"div",6),ma(55,"ion-select",22),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.excludedTypes,p)||(t.excludedTypes=p),xf(p)}),$N(56,Ne,2,2,"ion-select-option",23,zN),al(),R2(),ma(58,"ion-button")(59,"ion-checkbox",5),Ge("ionChange",function(){return t.update()}),v1("ngModelChange",function(p){return yf(m),DR(t.pbOnDay,p)||(t.pbOnDay=p),xf(p)}),xR(60,"Page Break on Day"),al(),R2(),al()()()(),ma(61,"ion-content",24),jN(62,Ue,1,0,"app-spinner"),Qd(63,"iframe",25,0),ma(65,"div",26),jN(66,Ae,2,0),jN(67,Re,8,2),jN(68,ze,8,2),ma(69,"footer",27),xR(70,"-"),al()()();}e&2&&(Ym(12),b1("ngModel",t.hideImages),P2(),Ym(3),b1("ngModel",t.columns),gr("value",t.columns),P2(),Ym(12),b1("ngModel",t.lines),gr("value",t.lines),P2(),Ym(18),b1("ngModel",t.filter),gr("value",t.filter),P2(),Ym(10),gr("multiple",true)("value",t.excludedTypes),b1("ngModel",t.excludedTypes),P2(),Ym(),HN(t.eventTypes),Ym(3),b1("ngModel",t.pbOnDay),P2(),Ym(2),gr("fullscreen",true),Ym(),BN(t.busy?62:-1),Ym(),gr("scrolling","no")("frameBorder",0),Ym(3),BN(t.hasEvents()?66:-1),Ym(),BN(t.hasCamps()?67:-1),Ym(),BN(t.hasArt()?68:-1));},dependencies:[V3,v,fl,kO,uQ,sQ,DF,T5,sue,kue,Gde,jde,wue,qde,tue,G,Z,Q,i6,vue],styles:["iframe[_ngcontent-%COMP%]{height:100%;width:100%}ion-checkbox[_ngcontent-%COMP%]{font-family:Gelion Regular;font-size:medium}ion-select[_ngcontent-%COMP%]{font-size:medium}ion-select[_ngcontent-%COMP%]::part(icon){color:#fff!important}"],changeDetection:1});var we=R;export{we as PrintPage};