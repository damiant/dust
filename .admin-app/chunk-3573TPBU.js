var g=(e,t=0)=>new Promise(n=>{d(e,t,n)}),d=(e,t=0,n)=>{let i,o,r={passive:!0},a=500,s=()=>{i&&i()},u=l=>{(l===void 0||e===l.target)&&(s(),n(l))};return e&&(e.addEventListener("webkitTransitionEnd",u,r),e.addEventListener("transitionend",u,r),o=setTimeout(u,t+a),i=()=>{o!==void 0&&(clearTimeout(o),o=void 0),e.removeEventListener("webkitTransitionEnd",u,r),e.removeEventListener("transitionend",u,r)}),s},v=(e,t)=>{e.componentOnReady?e.componentOnReady().then(n=>t(n)):b(()=>t(e))},y=e=>e.componentOnReady!==void 0,c=(e,t=[])=>{let n={};return t.forEach(i=>{e.hasAttribute(i)&&(e.getAttribute(i)!==null&&(n[i]=e.getAttribute(i)),e.removeAttribute(i))}),n},f=["role","aria-activedescendant","aria-atomic","aria-autocomplete","aria-braillelabel","aria-brailleroledescription","aria-busy","aria-checked","aria-colcount","aria-colindex","aria-colindextext","aria-colspan","aria-controls","aria-current","aria-describedby","aria-description","aria-details","aria-disabled","aria-errormessage","aria-expanded","aria-flowto","aria-haspopup","aria-hidden","aria-invalid","aria-keyshortcuts","aria-label","aria-labelledby","aria-level","aria-live","aria-multiline","aria-multiselectable","aria-orientation","aria-owns","aria-placeholder","aria-posinset","aria-pressed","aria-readonly","aria-relevant","aria-required","aria-roledescription","aria-rowcount","aria-rowindex","aria-rowindextext","aria-rowspan","aria-selected","aria-setsize","aria-sort","aria-valuemax","aria-valuemin","aria-valuenow","aria-valuetext"],p=(e,t)=>{let n=f;return t&&t.length>0&&(n=n.filter(i=>!t.includes(i))),c(e,n)},E=(e,t,n,i)=>{var o;if(typeof window<"u"){let r=window,a=(o=r==null?void 0:r.Ionic)===null||o===void 0?void 0:o.config;if(a){let s=a.get("_ael");if(s)return s(e,t,n,i);if(a._ael)return a._ael(e,t,n,i)}}return e.addEventListener(t,n,i)},_=(e,t,n,i)=>{var o;if(typeof window<"u"){let r=window,a=(o=r==null?void 0:r.Ionic)===null||o===void 0?void 0:o.config;if(a){let s=a.get("_rel");if(s)return s(e,t,n,i);if(a._rel)return a._rel(e,t,n,i)}}return e.removeEventListener(t,n,i)},A=(e,t=e)=>e.shadowRoot||t,b=e=>typeof __zone_symbol__requestAnimationFrame=="function"?__zone_symbol__requestAnimationFrame(e):typeof requestAnimationFrame=="function"?requestAnimationFrame(e):setTimeout(e),m=e=>!!e.shadowRoot&&!!e.attachShadow,h=e=>{let t=e.closest("ion-item");return t?t.querySelector("ion-label"):null},x=e=>{if(e.focus(),e.classList.contains("ion-focusable")){let t=e.closest("ion-app");t&&t.setFocus([e])}},T=(e,t)=>{let n,i=e.getAttribute("aria-labelledby"),o=e.id,r=i!==null&&i.trim()!==""?i:t+"-lbl",a=i!==null&&i.trim()!==""?document.getElementById(i):h(e);return a?(i===null&&(a.id=r),n=a.textContent,a.setAttribute("aria-hidden","true")):o.trim()!==""&&(a=document.querySelector(`label[for="${o}"]`),a&&(a.id!==""?r=a.id:a.id=r=`${o}-lbl`,n=a.textContent)),{label:a,labelId:r,labelText:n}},L=(e,t,n,i,o)=>{if(e||m(t)){let r=t.querySelector("input.aux-input");r||(r=t.ownerDocument.createElement("input"),r.type="hidden",r.classList.add("aux-input"),t.appendChild(r)),r.disabled=o,r.name=n,r.value=i||""}},I=(e,t,n)=>Math.max(e,Math.min(t,n)),q=(e,t)=>{if(!e){let n="ASSERT: "+t;console.error(n);debugger;throw new Error(n)}},R=e=>e.timeStamp||Date.now(),S=e=>{if(e){let t=e.changedTouches;if(t&&t.length>0){let n=t[0];return{x:n.clientX,y:n.clientY}}if(e.pageX!==void 0)return{x:e.pageX,y:e.pageY}}return{x:0,y:0}},O=e=>{let t=document.dir==="rtl";switch(e){case"start":return t;case"end":return!t;default:throw new Error(`"${e}" is not a valid value for [side]. Use "start" or "end" instead.`)}},F=(e,t)=>{let n=e._original||e;return{_original:e,emit:w(n.emit.bind(n),t)}},w=(e,t=0)=>{let n;return(...i)=>{clearTimeout(n),n=setTimeout(e,t,...i)}},C=(e,t)=>{if(e!=null||(e={}),t!=null||(t={}),e===t)return!0;let n=Object.keys(e);if(n.length!==Object.keys(t).length)return!1;for(let i of n)if(!(i in t)||e[i]!==t[i])return!1;return!0};export{g as a,v as b,y as c,c as d,p as e,E as f,_ as g,A as h,b as i,m as j,h as k,x as l,T as m,L as n,I as o,q as p,R as q,S as r,O as s,F as t,w as u,C as v};
