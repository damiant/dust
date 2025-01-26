import{e as v,f as I,k as M}from"./chunk-XCRBEL2Y.js";import{a as m}from"./chunk-LF5XB4YN.js";import{h as b}from"./chunk-LNJ3S2LQ.js";var p=class{constructor(){this.m=new Map}reset(e){this.m=new Map(Object.entries(e))}get(e,o){let n=this.m.get(e);return n!==void 0?n:o}getBoolean(e,o=!1){let n=this.m.get(e);return n===void 0?o:typeof n=="string"?n==="true":!!n}getNumber(e,o){let n=parseFloat(this.m.get(e));return isNaN(n)?o!==void 0?o:NaN:n}set(e,o){this.m.set(e,o)}},r=new p,S=t=>{try{let e=t.sessionStorage.getItem(y);return e!==null?JSON.parse(e):{}}catch{return{}}},k=(t,e)=>{try{t.sessionStorage.setItem(y,JSON.stringify(e))}catch{return}},C=t=>{let e={};return t.location.search.slice(1).split("&").map(o=>o.split("=")).map(([o,n])=>[decodeURIComponent(o),decodeURIComponent(n)]).filter(([o])=>W(o,E)).map(([o,n])=>[o.slice(E.length),n]).forEach(([o,n])=>{e[o]=n}),e},W=(t,e)=>t.substr(0,e.length)===e,E="ionic:",y="ionic-persist-config",T=t=>N(t),j=(t,e)=>(typeof t=="string"&&(e=t,t=void 0),T(t).includes(e)),N=(t=window)=>{if(typeof t>"u")return[];t.Ionic=t.Ionic||{};let e=t.Ionic.platforms;return e==null&&(e=t.Ionic.platforms=H(t),e.forEach(o=>t.document.documentElement.classList.add(`plt-${o}`))),e},H=t=>{let e=r.get("platform");return Object.keys(_).filter(o=>{let n=e==null?void 0:e[o];return typeof n=="function"?n(t):_[o](t)})},x=t=>f(t)&&!A(t),g=t=>!!(a(t,/iPad/i)||a(t,/Macintosh/i)&&f(t)),R=t=>a(t,/iPhone/i),U=t=>a(t,/iPhone|iPod/i)||g(t),O=t=>a(t,/android|sink/i),L=t=>O(t)&&!a(t,/mobile/i),F=t=>{let e=t.innerWidth,o=t.innerHeight,n=Math.min(e,o),c=Math.max(e,o);return n>390&&n<520&&c>620&&c<800},Y=t=>{let e=t.innerWidth,o=t.innerHeight,n=Math.min(e,o),c=Math.max(e,o);return g(t)||L(t)||n>460&&n<820&&c>780&&c<1400},f=t=>J(t,"(any-pointer:coarse)"),K=t=>!f(t),A=t=>P(t)||B(t),P=t=>!!(t.cordova||t.phonegap||t.PhoneGap),B=t=>{let e=t.Capacitor;return!!(e!=null&&e.isNative)},w=t=>a(t,/electron/i),G=t=>{var e;return!!(!((e=t.matchMedia)===null||e===void 0)&&e.call(t,"(display-mode: standalone)").matches||t.navigator.standalone)},a=(t,e)=>e.test(t.navigator.userAgent),J=(t,e)=>{var o;return(o=t.matchMedia)===null||o===void 0?void 0:o.call(t,e).matches},_={ipad:g,iphone:R,ios:U,android:O,phablet:F,tablet:Y,cordova:P,capacitor:B,electron:w,pwa:G,mobile:f,mobileweb:x,desktop:K,hybrid:A},l,D=t=>t&&I(t)||l,X=(t={})=>{if(typeof window>"u")return;let e=window.document,o=window,n=o.Ionic=o.Ionic||{},c={};t._ael&&(c.ael=t._ael),t._rel&&(c.rel=t._rel),t._ce&&(c.ce=t._ce),M(c);let d=Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},S(o)),{persistConfig:!1}),n.config),C(o)),t);r.reset(d),r.getBoolean("persistConfig")&&k(o,d),N(o),n.config=r,n.mode=l=r.get("mode",e.documentElement.getAttribute("mode")||(j(o,"ios")?"ios":"md")),r.set("mode",l),e.documentElement.setAttribute("mode",l),e.documentElement.classList.add(l),r.getBoolean("_testing")&&r.set("animated",!1);let h=s=>{var i;return(i=s.tagName)===null||i===void 0?void 0:i.startsWith("ION-")},u=s=>["ios","md"].includes(s);v(s=>{for(;s;){let i=s.mode||s.getAttribute("mode");if(i){if(u(i))return i;h(s)&&console.warn('Invalid ionic mode: "'+i+'", expected: "ios" or "md"')}s=s.parentElement}return l})};var V=()=>r.get("experimentalCloseWatcher",!1)&&m!==void 0&&"CloseWatcher"in m,Z=()=>{document.addEventListener("backbutton",()=>{})},tt=()=>{let t=document,e=!1,o=()=>{if(e)return;let n=0,c=[],d=new CustomEvent("ionBackButton",{bubbles:!1,detail:{register(s,i){c.push({priority:s,handler:i,id:n++})}}});t.dispatchEvent(d);let h=s=>b(void 0,null,function*(){try{if(s!=null&&s.handler){let i=s.handler(u);i!=null&&(yield i)}}catch(i){console.error(i)}}),u=()=>{if(c.length>0){let s={priority:Number.MIN_SAFE_INTEGER,handler:()=>{},id:-1};c.forEach(i=>{i.priority>=s.priority&&(s=i)}),e=!0,c=c.filter(i=>i.id!==s.id),h(s).then(()=>e=!1)}};u()};if(V()){let n,c=()=>{n==null||n.destroy(),n=new m.CloseWatcher,n.onclose=()=>{o(),c()}};c()}else t.addEventListener("backbutton",o)},et=100,ot=99;export{r as a,T as b,j as c,D as d,X as e,V as f,Z as g,tt as h,et as i,ot as j};
