import{a as k}from"./chunk-2ESKF5AC.js";import{c}from"./chunk-LADCEZG6.js";import{Aa as r,Bc as P,F as g,Fa as y,Ga as u,Ha as d,Qb as b,S as l,Sb as E,Tb as x,Ub as w,Wb as I,X as f,da as h,ka as i,la as s,mb as C,nb as _,pa as m,sb as M,vc as S,w as v}from"./chunk-SLKJQVFW.js";import{h as T}from"./chunk-LNJ3S2LQ.js";var F=["Arts & Crafts","Class/Workshop","Diversity & Inclusion","Fire/Spectacle","Food & Drink","For Kids","Games","Gathering/Party","Live Music","Mature Audiences","Miscellaneous","Parade","Performance","Repair","Ritual/Ceremony","Self Care","Sustainability/Greening Your Burn","Yoga/Movement/Fitness"],o=class o{constructor(){this.eventTypesChange=new g;this.alert=v(k);(!this.eventTypes||this.eventTypes==="")&&this.reset()}reset(){this.eventTypes=F.join(`
`)}save(){return T(this,null,function*(){if(this.maxTypes<1||this.maxTypes>5){yield c(this.alert,"The maximum number of event types must be between 1 and 5.");return}let a=this.eventTypes.split(`
`);if(a.length<5){yield c(this.alert,"You must have at least 5 event types.");return}this.eventTypes=a.filter(n=>n.trim()!=="").join(`
`),this.eventTypesChange.emit({eventTypes:this.eventTypes,maxTypes:this.maxTypes})})}};o.\u0275fac=function(n){return new(n||o)},o.\u0275cmp=f({type:o,selectors:[["app-event-types"]],inputs:{eventTypes:"eventTypes",maxTypes:"maxTypes"},outputs:{eventTypesChange:"eventTypesChange"},decls:11,vars:3,consts:[["rows","18",3,"ngModelChange","ngModel","value"],["min","1","max","5","type","number","label","Maximum Types per Event","labelPlacement","stacked",3,"ngModelChange","ngModel"],["size","small",3,"click"]],template:function(n,e){n&1&&(i(0,"ion-card")(1,"ion-card-header")(2,"ion-card-title"),r(3," Event Types "),s()(),i(4,"ion-card-content")(5,"ion-textarea",0),d("ngModelChange",function(t){return u(e.eventTypes,t)||(e.eventTypes=t),t}),s(),i(6,"ion-input",1),d("ngModelChange",function(t){return u(e.maxTypes,t)||(e.maxTypes=t),t}),s(),i(7,"ion-button",2),m("click",function(){return e.save()}),r(8,"Apply"),s(),i(9,"ion-button",2),m("click",function(){return e.reset()}),r(10,"Reset"),s()()()),n&2&&(l(5),y("ngModel",e.eventTypes),h("value",e.eventTypes),l(),y("ngModel",e.maxTypes))},dependencies:[S,M,C,_,P,b,x,I,w,E],styles:["ion-card-title[_ngcontent-%COMP%]{font-size:var(--fr3)!important}"]});var W=o;export{F as a,W as b};
