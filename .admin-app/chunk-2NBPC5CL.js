import{A as f,B as g,Da as m,F as _,Fa as s,S as o,Sb as M,T as x,Y as v,aa as p,ea as C,fa as h,fb as y,gb as E,ha as l,jb as I,la as r,ma as a,pa as b,qa as w,ra as c,sa as T,ta as k}from"./chunk-JQETABDO.js";var F=["*"];function L(i,e){if(i&1&&(r(0,"p"),m(1),a()),i&2){let t=c(2);o(),s("",t.badge," Changes")}}function P(i,e){if(i&1){let t=b();r(0,"ion-button",3),w("click",function(){f(t);let u=c();return g(u.navTo(u.routeTo))}),m(1),p(2,L,2,1,"p"),a()}if(i&2){let t=c();C("routerLink",t.routeTo),o(),s(" ",t.title,"\xA0 "),o(),l(t.badge?2:-1)}}var n=class n{constructor(e){this.router=e;this.title="";this.width="150px";this.press=new _}navTo(e){e||this.press.emit()}};n.\u0275fac=function(t){return new(t||n)(x(y))},n.\u0275cmp=v({type:n,selectors:[["app-footer"]],inputs:{title:"title",width:"width",badge:"badge",routeTo:"routeTo"},outputs:{press:"press"},ngContentSelectors:F,decls:4,vars:3,consts:[[1,"footer"],[1,"container"],["shape","round","color","primary","mode","md",3,"routerLink"],["shape","round","color","primary","mode","md",3,"click","routerLink"]],template:function(t,d){t&1&&(T(),r(0,"div",0)(1,"div",1),k(2),p(3,P,3,3,"ion-button",2),a()()),t&2&&(o(),h("width",d.width),o(2),l(d.title!==""?3:-1))},dependencies:[M,I,E],styles:["p[_ngcontent-%COMP%]{background-color:#fff;color:var(--ion-color-primary);padding:5px 10px;border-radius:25px;min-width:1.5rem;height:1.5rem;margin-left:.5rem;font-weight:700}.footer[_ngcontent-%COMP%]{position:fixed;margin-left:calc(50% - var(--footer-width));left:0;bottom:0;background-color:transparent;color:#fff;text-align:center;padding-top:1.5rem;padding-bottom:1.5rem}.container[_ngcontent-%COMP%]{margin-left:auto;margin-right:auto}"]});var R=n;export{R as a};
