import{a as Me}from"./chunk-QTBNLBDF.js";import{a as Le}from"./chunk-TOSLD3EX.js";import{a as Te}from"./chunk-OF25KEPG.js";import{a as Pe}from"./chunk-55PDQDPP.js";import{a as be,e as j,m as O,r as Se,t as z,w as ke}from"./chunk-A5NTSXZY.js";import{$ as k,A as y,Aa as p,Ac as Ee,B as C,Ba as v,Ca as G,Da as J,Fa as U,Ga as A,Ha as B,Lb as oe,Mb as re,P as Q,Qb as ae,Rb as se,S as c,Sa as K,Sb as le,T as N,Tb as ce,Ub as de,Vb as pe,Wb as me,X as Z,Xa as X,Yb as fe,cc as ue,da as w,dc as he,fc as _e,ga as T,ha as R,hc as ge,ia as W,ja as F,ka as l,kc as ve,la as s,ma as E,mb as ee,mc as ye,nb as te,nc as Ce,oa as V,oc as we,pa as b,qa as u,sb as ne,tb as ie,wa as Y,wc as Ie,xa as q,xc as xe,ya as H}from"./chunk-SLKJQVFW.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as S}from"./chunk-LNJ3S2LQ.js";var We=["fileUpload"],Fe=(a,i)=>i.title;function Ve(a,i){if(a&1&&(l(0,"ion-select-option",13),p(1),s()),a&2){let e=i.$implicit;w("value",e.id),c(),v(e.name)}}function Ue(a,i){if(a&1&&(l(0,"ion-select-option",13),p(1),s()),a&2){let e=i.$implicit;w("value",e.id),c(),v(e.name)}}function Ae(a,i){if(a&1){let e=V();l(0,"ion-content",9)(1,"div",9)(2,"h1"),p(3,"Unknown Location"),s(),l(4,"p"),p(5),s(),l(6,"p"),p(7),s(),l(8,"ion-radio-group",10),B("ngModelChange",function(t){y(e);let o=u();return A(o.locationType,t)||(o.locationType=t),C(t)}),l(9,"ion-radio",11),p(10,"Camp"),s(),l(11,"ion-select",12),b("ionChange",function(){y(e);let t=u();return C(t.locationType="camp")}),B("ngModelChange",function(t){y(e);let o=u();return A(o.selectedCamp,t)||(o.selectedCamp=t),C(t)}),W(12,Ve,2,2,"ion-select-option",13,R),s(),l(14,"ion-radio",14),p(15,"Art"),s(),l(16,"ion-select",15),b("ionChange",function(){y(e);let t=u();return C(t.locationType="art")}),B("ngModelChange",function(t){y(e);let o=u();return A(o.selectedArt,t)||(o.selectedArt=t),C(t)}),W(17,Ue,2,2,"ion-select-option",13,R),s(),l(19,"ion-radio",16),p(20,"Open Camping / Other"),s(),E(21,"br"),s()()(),l(22,"ion-toolbar",17)(23,"ion-button",18),b("click",function(){y(e);let t=u();return C(t.applyTransform(t.selectedCamp,t.selectedArt,t.locationType,t.unknownLocation))}),p(24,"Apply"),s()()}if(a&2){let e=u();c(5),G('Choose the camp or art that matches the location "',e.unknownLocation,'"'),c(2),v(e.eventInfo),c(),U("ngModel",e.locationType),c(3),w("value",e.selectedCamp),U("ngModel",e.selectedCamp),c(),F(e.camps),c(4),w("value",e.selectedArt),U("ngModel",e.selectedArt),c(),F(e.art)}}function Be(a,i){if(a&1&&(E(0,"ion-progress-bar",13),l(1,"ion-text"),p(2),s(),E(3,"app-spinner"),l(4,"div",19),E(5,"img",20),s()),a&2){let e=u();w("value",e.progress),c(2),v(e.importing),c(3),w("src",e.url,Q)}}function Ne(a,i){if(a&1){let e=V();l(0,"div",21)(1,"ion-button",18),b("click",function(){y(e);let t=u(2);return C(t.doImport())}),p(2,"Import from CSV"),s()()}}function Re(a,i){if(a&1&&(l(0,"p",22),p(1),s()),a&2){let e=u(3);c(),J("There are ",e.errors.length," problems found in the CSV. You can choose to import but it is preferable to fix the errors in red below before importing. ",e.otherErrors,"")}}function Ge(a,i){a&1&&(l(0,"p",22),p(1,'Click "Complete Import" to perform the import'),s())}function je(a,i){if(a&1&&(l(0,"ion-card-subtitle",25),p(1),s()),a&2){let e=u().$implicit;c(),v(e.error)}}function ze(a,i){if(a&1&&(l(0,"ion-card-subtitle"),p(1),s()),a&2){let e=u().$implicit;c(),v(e.timeString)}}function Qe(a,i){if(a&1&&(l(0,"ion-item",23)(1,"ion-card",24)(2,"ion-card-header")(3,"ion-card-title"),p(4),s(),k(5,je,2,1,"ion-card-subtitle",25)(6,ze,2,1,"ion-card-subtitle"),s(),l(7,"ion-card-content"),p(8),E(9,"br"),l(10,"b"),p(11),s()()()()),a&2){let e=i.$implicit;c(4),v(e.title),c(),T(!e.hosted_by_camp||e.error?5:6),c(3),v(e.description),c(3),v(e.event_type)}}function Ze(a,i){if(a&1&&(l(0,"ion-list")(1,"h1"),p(2),s(),k(3,Re,2,2,"p",22)(4,Ge,2,0,"p",22),W(5,Qe,12,4,"ion-item",23,Fe),s()),a&2){let e=u(2);c(2),G("",e.events.length," Events can be imported"),c(),T(e.errors.length>0?3:4),c(2),F(e.events)}}function Ye(a,i){if(a&1&&(l(0,"div",6),k(1,Ne,3,0,"div",21)(2,Ze,7,2,"ion-list"),s()),a&2){let e=u();c(),T(e.isSafari&&e.events.length===0?1:-1),c(),T(e.events.length>0||e.errors.length>0?2:-1)}}var P=class P{constructor(i,e){this.api=i;this.location=e;this.busy=!1;this.isAdmin=!1;this.importing="";this.title="Import";this.otherErrors="";this.locationType="camp";this.progress=0;this.url="";this.events=[];this.camps=[];this.art=[];this.errors=[];this.showSelectCamp=!1;this.unknownLocation="";this.eventInfo="";this.isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)}ngOnInit(){this.isAdmin=this.api.lastRoleResponse=="festival",this.isAdmin&&this.fileUpload.nativeElement.click()}doImport(){this.fileUpload.nativeElement.click()}onFileSelected(i){return S(this,null,function*(){let e=i.target.files[0];if(!e)return;let n=new FileReader;n.onload=t=>S(this,null,function*(){var r;let o=(r=t.target)==null?void 0:r.result;this.parseCSV(o)}),n.readAsText(e)})}applyTransform(i,e,n,t){this.showSelectCamp=!1,n=="other"&&(i=void 0,e=void 0),n=="art"&&(i=void 0),n=="camp"&&(e=void 0),t&&(localStorage.setItem(`match-camp-${t}`,i),localStorage.setItem(`match-art-${t}`,e),localStorage.setItem(`match-type-${t}`,n),setTimeout(()=>{this.fixUnknownLocations()},1e3))}parseCSV(i){return S(this,null,function*(){let e=Me(i);this.events=[];let n=this.mapColumns(e);this.camps=yield this.api.camps({cached:!1}),this.art=yield this.api.art({cached:!1}),this.errors=[],this.otherErrors="";let t=yield this.api.events({cached:!1}),o=0;if(n){for(let r of e)if(this.isBlankLine(r))console.log("Ignored blank line");else{let d=this.importEvent(r,n);this.isDuplicate(d,t)?(d.error="This event already exists and wont be imported",o++):this.events.push(d)}this.events=this.events.sort((r,d)=>r.title>d.title?1:-1),this.title=`Import ${this.events.length} events`,o>0&&(this.otherErrors=` There are ${o} duplicate events already imported that will be skipped.`)}this.fixUnknownLocations(),this.fileUpload.nativeElement.target&&(this.fileUpload.nativeElement.target.value="")})}fixUnknownLocations(){for(let i of this.events)if(i.unknownLocation){let e=localStorage[`match-camp-${i.unknownLocation}`],n=localStorage[`match-art-${i.unknownLocation}`],t=localStorage[`match-type-${i.unknownLocation}`];if(t=="camp")i.hosted_by_camp=parseInt(e),i.unknownLocation=void 0,i.other_location=void 0;else if(t=="art")i.located_at_art=n,i.unknownLocation=void 0,i.other_location=void 0;else if(t=="other")i.other_location=i.unknownLocation,i.hosted_by_camp=void 0,i.located_at_art=void 0;else if(e)i.hosted_by_camp=parseInt(e),i.unknownLocation=void 0;else{this.showSelectCamp=!0,this.unknownLocation=i.unknownLocation,this.eventInfo=`${i.title}. ${i.description}`,console.log("unknown location is",i.unknownLocation);return}}}isDuplicate(i,e){for(let n of e)if(n.occurrence_set==i.occurrence_set&&n.title==i.title&&n.description==i.description)return!0;return!1}import(){return S(this,null,function*(){this.busy=!0,this.title="Importing...";let i=0,e=0,n=this.events.length;for(;this.events.length>0;){let t;try{if(e++,t=this.events.pop(),t){let o=t.imageUrl;t.imageUrl=void 0,this.importing=t.title,this.progress=e/n;let r=yield this.api.addEvent(t);if(i++,o&&r.id){t.id=r.id;try{yield this.importImage(o,t)}catch{console.error(`Unable to import image for event ${t.title}: ${o}`)}}}}catch{console.error(`Failed to import ${t==null?void 0:t.title}: ${t==null?void 0:t.description}`)}}this.api.sendMessage(`Imported ${i} of ${e} events.`),this.busy=!1,this.api.clearCache(),this.location.back()})}isBlankLine(i){for(let e of Object.keys(i))if(i[e]&&i[e]!="")return!1;return!0}toUrl(i){let e=!1,n="";for(let t of i)if(t=="(")e=!0;else if(t==")")if(e=!1,n.length<3)n="";else return n;else e&&(n+=t);return n}importImage(i,e){return S(this,null,function*(){let n=this.toUrl(i),o=yield(yield fetch(n)).blob(),r=yield Te(o,{quality:75,width:300});this.url=URL.createObjectURL(r),e.imageUrl=yield this.api.setImage(r,e.id),yield this.api.addEvent(e)})}importEvent(i,e){var D,x;let n={description:"",title:"",hosted_by_camp:void 0,occurrence_set:"[]",id:void 0,event_type:"Event",error:void 0,unknownLocation:void 0};n.title=i[e.title],n.description=i[e.description],n.event_type=i[e.event_type],n.event_type||(n.event_type=this.guessEventType(n.title,n.description)),n.event_type=="Yes"&&(n.event_type="Class/Workshop");let t=e.image,o=e.logo,r=e.startDay,d=e.endDay,I=e.start_time,_=e.end_time,m=i[e.location],g,h=!1;for(let f of this.camps)f.name.toLowerCase()=="unknown"&&(g=f),(m==null?void 0:m.toLowerCase().trim())==((D=f.name)==null?void 0:D.toLowerCase().trim())&&(n.hosted_by_camp=f.id,h=!0);let L=localStorage[`match-camp-${m}`],M=localStorage[`match-art-${m}`],$=localStorage[`match-type-${m}`];h||(L&&!n.hosted_by_camp?(n.hosted_by_camp=parseInt(L),h=!0):M&&!n.located_at_art&&(n.located_at_art=M,h=!0)),$=="other"&&(n.other_location=m,h=!0),h||(this.errors.push(`Location of event ${n.title} has an unknown location "${m}"`),n.error=`Unknown Location "${m}"`,n.unknownLocation=m,n.hosted_by_camp=g?g.id:void 0),t&&(n.imageUrl=i[t]),o&&this.isBlank(n.imageUrl)&&(n.imageUrl=i[o]);try{let f=this.convertToOccurrenceSet(i[r],i[d],i[I],i[_]);(f.start_time.includes("NaN")||f.end_time.includes("NaN"))&&(n.error="The event times are invalid");let Oe=new Date(f.start_time),$e=new Date(f.end_time);n.occurrence_set=JSON.stringify([f]),n.timeString=(x=be(Oe,$e,void 0,this.api.currentTimeZone()))==null?void 0:x.long}catch(f){this.errors.push(`There is an error with the event ${n.title}: ${f}`),n.error=`${f}`,console.error(f)}return n}guessEventType(i,e){let n=i.toLowerCase().trim(),t=e.toLowerCase().trim(),o={yoga:"Yoga/Movement/Fitness",class:"Class/Workshop",workshop:"Class/Workshop",conversation:"Class/Workshop",101:"Class/Workshop","learn to":"Class/Workshop","talk about":"Class/Workshop",relax:"Self Care","to play":"Games",films:"Performance","make a":"Arts & Crafts",meditation:"Ritual/Ceremony",ceremony:"Ritual/Ceremony",live:"Live Music",tasting:"Food/Drink",shibari:"Class/Workshop",karaoke:"Performance","happy hour":"Food/Drink",party:"Gathering/Party",spins:"Gathering/Party",djs:"Gathering/Party",dancing:"Gathering/Party",dance:"Gathering/Party",music:"Gathering/Party",movie:"Performance",pizza:"Food/Drink","fire spin":"Fire/Spectacle",session:"Class/Workshop",beginners:"Class/Workshop","safety meeting":"Class/Workshop",dungeon:"Mature Audiences",sex:"Mature Audiences",orgy:"Mature Audiences",tea:"Food/Drink",games:"Games","photo booth":"Games",cacao:"Food/Drink","bloody mary":"Food/Drink",homebrew:"Food/Drink","bring your cup":"Food/Drink",cookies:"Food/Drink",eating:"Food/Drink","drum circle":"Live Music",perform:"Performance",stroll:"Parade",acoustic:"Live Music","bar crawl":"Parade"};for(let r of Object.keys(o))if(n.includes(r)||t.includes(r))return o[r];return"Miscellaneous"}convertToOccurrenceSet(i,e,n,t){if(i=z(i,'"',""),e=z(e,'"',""),e||(e=i),n.length>=19&&t.length>=19)return{start_time:n,end_time:t};n==""&&t==""&&(n="00:00am",t="11:59:59pm"),j(":",n)==2&&(n=n.replace(":00 ","")),j(":",t)==2&&(t=t.replace(":00 ",""));let o=this.toISODate(i+" "+n,void 0);console.log("toISODate:StartDay=",i,"EndDay="+e,"Start=",n,"End=",t);let r=this.toISODate(e+" "+t,o);return console.log(`start_time=${o} end_time=${r}`),{start_time:o,end_time:r}}toIsoDateSlash(i,e){let n=i.split(" "),t=new Date(n[0]).toISOString().split("T")[0].split("-"),o=parseInt(t[0],10),r=parseInt(t[1],10)-1,d=parseInt(t[2],10),I=n[1].split(":"),_=parseInt(I[0],10),m=parseInt(I[1],10);i.toLowerCase().includes("pm")&&_!=12&&(_+=12);let g=O(o,r,d,_,m).replace("Z","");return e&&new Date(g).getTime()-new Date(e).getTime()<0&&(d=d+1,d>this.daysInMonth(r,o)&&(d=1,r++,r>12&&(r=0,o++)),g=O(o,r,d,_,m).replace("Z","")),g}toISODate(i,e){if(i.includes("/"))return this.toIsoDateSlash(i,e);let n=i.split(" "),t,o=Se(void 0,"short"),r,d,I=0;for(let h of n){let L=Number.parseInt(h,10);!Number.isNaN(L)&&!t&&(t=L);let M=o.find(x=>h.toLowerCase().startsWith(x.toLowerCase()));M&&(r=M),h.toLowerCase()=="midnight"&&(d=23,I=59);let $=h.toLowerCase().endsWith("pm"),D=h.toLowerCase().endsWith("am");if(D||$||h.includes(":")){let x=h.toLowerCase().replace("pm","").replace("am","");if(x.includes(":")){let f=x.split(":");x=f[0],I=Number.parseInt(f[1])}d=Number.parseInt(x),$&&d<=11&&(d+=12),D&&d==12&&(d=0)}}if(d==null)throw new Error(`'${i}' is missing the time`);if(r==null)throw new Error(`'${i}' is missing the month`);if(t==null)throw new Error(`'${i}' is missing the day`);let _=o.indexOf(r),m=new Date().getFullYear(),g=O(m,_,t,d,I).replace("Z","");return e&&new Date(g).getTime()-new Date(e).getTime()<0&&(t=t+1,t>this.daysInMonth(_,m)&&(t=1,_++,_>12&&(_=0,m++)),g=O(m,_,t,d,I).replace("Z","")),g}daysInMonth(i,e){return new Date(e,i+1,0).getDate()}isBlank(i){return!i||i.trim()==""}mapColumns(i){if(i.length==0)return;let e=i[0],n={title:"",description:"",event_type:"",hosted_by_camp:void 0,occurrence_set:"",id:void 0};for(let t of Object.keys(e)){let o=t.toLowerCase();o.includes("event name")&&(n.title=t),o.includes("name")&&!o.includes("camp name")&&(n.title=t),o.includes("title")&&(n.title=t),o.includes("description")&&(n.description=t),o.includes("day")&&!n.startDay&&(n.startDay=t),o.includes("date")&&!n.startDay&&(n.startDay=t),o.includes("start date")&&(n.startDay=t),o.includes("end date")&&(n.endDay=t),o.includes("image")&&(n.image=t),o.includes("logo")&&(n.logo=t),o.includes("type")&&(n.event_type=t),(o.includes("start time")||o.includes("starttime"))&&(n.start_time=t),(o.includes("end time")||o.includes("endtime"))&&(n.end_time=t),o.includes("location")&&(n.location=t)}return n}};P.\u0275fac=function(e){return new(e||P)(N(ke),N(K))},P.\u0275cmp=Z({type:P,selectors:[["app-import-events"]],viewQuery:function(e,n){if(e&1&&Y(We,7),e&2){let t;q(t=H())&&(n.fileUpload=t.first)}},decls:14,vars:5,consts:[["fileUpload",""],["color","primary"],["slot","start"],["routerLink","../"],[3,"fullscreen"],[3,"isOpen"],[1,"border"],["type","file",1,"file-input",3,"change"],["title","Complete Import",3,"press","hidden"],[1,"ion-padding"],[3,"ngModelChange","ngModel"],["labelPlacement","end","value","camp"],["label"," ","interface","popover","placeholder","Select camp for event",3,"ionChange","ngModelChange","value","ngModel"],[3,"value"],["labelPlacement","end","value","art"],["label"," ","interface","popover","placeholder","Select art for event",3,"ionChange","ngModelChange","value","ngModel"],["labelPlacement","end","value","other"],[1,"ion-text-center","ion-padding"],[3,"click"],[1,"ion-text-center","vcenter"],[2,"border-radius","2rem",3,"src"],[1,"ion-text-center"],[1,"error","ion-padding-left","ion-padding-right"],["lines","none"],["mode","ios"],[1,"error"]],template:function(e,n){if(e&1){let t=V();l(0,"ion-header")(1,"ion-toolbar",1)(2,"ion-buttons",2),E(3,"ion-back-button"),s(),l(4,"ion-title",3),p(5),s()()(),l(6,"ion-content",4)(7,"ion-modal",5),k(8,Ae,25,7,"ng-template"),s(),k(9,Be,6,3)(10,Ye,3,2,"div",6),l(11,"input",7,0),b("change",function(r){return y(t),C(n.onFileSelected(r))}),s(),l(13,"app-footer",8),b("press",function(){return y(t),C(n.import())}),s()()}e&2&&(c(5),v(n.title),c(),w("fullscreen",!0),c(),w("isOpen",n.showSelectCamp),c(2),T(n.busy?9:10),c(4),w("hidden",n.busy||n.events.length===0))},dependencies:[Ie,xe,re,de,ce,pe,me,le,oe,he,_e,ye,ge,ae,se,fe,ue,Ce,we,X,ne,ee,te,Pe,Le,ie,ve,Ee],styles:[".error[_ngcontent-%COMP%]{color:red;font-weight:700}ion-card-title[_ngcontent-%COMP%]{font-size:var(--fs3)!important}ion-card-subtitle[_ngcontent-%COMP%]{font-size:var(--fs4)}ion-card-content[_ngcontent-%COMP%]{font-size:var(--fs4)}ion-select[_ngcontent-%COMP%]{width:50%;margin-left:50%}ion-radio[_ngcontent-%COMP%]{float:left;margin-top:.5rem}"]});var De=P;export{De as ImportEventsPage};
