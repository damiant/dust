import{a as x}from"./chunk-MIGJGGKJ.js";import{d as u,w as h}from"./chunk-A5NTSXZY.js";import{Aa as n,T as a,X as c,Yb as f,cb as m,da as l,ka as i,la as o,ma as d,mc as g}from"./chunk-SLKJQVFW.js";import"./chunk-35XJAIHY.js";import"./chunk-7KGURMOZ.js";import"./chunk-W5R2B4OG.js";import"./chunk-SDKY465T.js";import"./chunk-45ASMX5N.js";import"./chunk-KM5AR3OJ.js";import"./chunk-XCRBEL2Y.js";import"./chunk-4U6PRYVA.js";import"./chunk-HJX2WMCX.js";import"./chunk-Z4V4M3ZT.js";import"./chunk-QPVVTFFW.js";import"./chunk-J6ICYO4L.js";import"./chunk-LF5XB4YN.js";import{h as s}from"./chunk-LNJ3S2LQ.js";var r=class r{constructor(e,t){this.router=e;this.api=t}ngOnInit(){return s(this,null,function*(){if(x.getPlatform()!=="web"){this.router.navigateByUrl("/all");return}if(window.location.search.includes("?app")){let e=navigator.userAgent.toLowerCase(),t=e.indexOf("android")>-1,p=e.indexOf("iphone")>-1;t&&(window.location.href="https://play.google.com/store/apps/details?id=nexus.concepts.dust"),p&&(window.location.href="https://apps.apple.com/us/app/dust-a-guide-for-burners/id6456943178")}yield u(500),this.edit()})}edit(){let e=this.api.isLocal()?"/all":"https://edit.dust.events/all";document.location.href=e}};r.\u0275fac=function(t){return new(t||r)(a(m),a(h))},r.\u0275cmp=c({type:r,selectors:[["app-home"]],decls:15,vars:1,consts:[["color","primary",1,"ion-text-center","ion-padding",3,"fullscreen"],[1,"pad-3"],[1,"pad-1"],[1,"ion-text-center","ion-padding",2,"padding-top","50vh"],[2,"font-size","medium","opacity","0.5"],["href","https://burningman.org/"]],template:function(t,p){t&1&&(i(0,"ion-content",0),d(1,"div",1),i(2,"h1"),n(3,"dust."),o(),i(4,"ion-text")(5,"b"),n(6,"dust"),o(),n(7," is a guide for burners to find events, camps and art."),o(),d(8,"div",2),i(9,"div",3)(10,"ion-text",4),n(11,"* This app is not affiliated with or endorsed by "),i(12,"a",5),n(13,"Burning Man Project"),o(),n(14," or Black Rock City LLC."),o()()()),t&2&&l("fullscreen",!0)},dependencies:[f,g],styles:["h1[_ngcontent-%COMP%]{font-size:var(--fs1);font-family:Nunito}h2[_ngcontent-%COMP%]{font-size:var(--fs2);font-family:Nunito}ion-button[_ngcontent-%COMP%]{color:var(--ion-color-primary);--background: white}ion-text[_ngcontent-%COMP%]{font-size:var(--fs2)}ion-text.small[_ngcontent-%COMP%]{font-size:var(--fs4)}.flex[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center}.rows[_ngcontent-%COMP%]{margin-top:-2rem;flex-direction:column;padding-left:10vw;padding-right:10vw;text-align:center;display:flex;justify-content:center;align-items:center;width:100%;height:100%}.badge[_ngcontent-%COMP%]{display:inline-block;overflow:hidden;border-radius:13px;width:280px;height:95px;margin-top:5px;padding-left:.5rem}.badge2[_ngcontent-%COMP%]{display:inline-block;overflow:hidden;border-radius:13px;width:250px;height:75px;padding-right:.5rem}a[_ngcontent-%COMP%]{color:#fff}.pad-1[_ngcontent-%COMP%]{padding:.5rem}.pad-2[_ngcontent-%COMP%]{padding:2rem}.pad-3[_ngcontent-%COMP%]{padding:3rem}@media (max-width: 640px){.pad3[_ngcontent-%COMP%]{padding:1.5rem}}"]});var v=r;export{v as HomePage};
