import{i as H}from"./chunk-5FZVM2DH.js";import{a as o}from"./chunk-NPRM7GGH.js";var j=540,U=r=>document.querySelector(`${r}.ion-cloned-element`),b=r=>r.shadowRoot||r,M=r=>{let s=r.tagName==="ION-TABS"?r:r.querySelector("ion-tabs"),c="ion-content ion-header:not(.header-collapse-condense-inactive) ion-title.title-large";if(s!=null){let e=s.querySelector("ion-tab:not(.tab-hidden), .ion-page:not(.ion-page-hidden)");return e!=null?e.querySelector(c):null}return r.querySelector(c)},k=(r,s)=>{let c=r.tagName==="ION-TABS"?r:r.querySelector("ion-tabs"),e=[];if(c!=null){let t=c.querySelector("ion-tab:not(.tab-hidden), .ion-page:not(.ion-page-hidden)");t!=null&&(e=t.querySelectorAll("ion-buttons"))}else e=r.querySelectorAll("ion-buttons");for(let t of e){let p=t.closest("ion-header"),i=p&&!p.classList.contains("header-collapse-condense-inactive"),u=t.querySelector("ion-back-button"),l=t.classList.contains("buttons-collapse"),y=t.slot==="start"||t.slot==="";if(u!==null&&y&&(l&&i&&s||!l))return u}return null},J=(r,s,c,e,t)=>{let p=k(e,c),i=M(t),u=M(e),l=k(t,c),y=p!==null&&i!==null&&!c,E=u!==null&&l!==null&&c;if(y){let _=i.getBoundingClientRect(),f=p.getBoundingClientRect(),m=b(p).querySelector(".button-text"),R=m.getBoundingClientRect(),L=b(i).querySelector(".toolbar-title").getBoundingClientRect();z(r,s,c,i,_,L,m,R),G(r,s,c,p,f,m,R,i,L)}else if(E){let _=u.getBoundingClientRect(),f=l.getBoundingClientRect(),m=b(l).querySelector(".button-text"),R=m.getBoundingClientRect(),L=b(u).querySelector(".toolbar-title").getBoundingClientRect();z(r,s,c,u,_,L,m,R),G(r,s,c,l,f,m,R,u,L)}return{forward:y,backward:E}},G=(r,s,c,e,t,p,i,u,l)=>{var y,E;let _=s?`calc(100% - ${t.right+4}px)`:`${t.left-4}px`,f=s?"right":"left",m=s?"left":"right",R=s?"right":"left",q=((y=p.textContent)===null||y===void 0?void 0:y.trim())===((E=u.textContent)===null||E===void 0?void 0:E.trim()),L=l.width/i.width,g=(l.height-Z)/i.height,v=q?`scale(${L}, ${g})`:`scale(${g})`,P="scale(1)",x=b(e).querySelector("ion-icon").getBoundingClientRect(),n=s?`${x.width/2-(x.right-t.right)}px`:`${t.left-x.width/2}px`,S=s?`-${window.innerWidth-t.right}px`:`${t.left}px`,h=`${l.top}px`,C=`${t.top}px`,a=[{offset:0,transform:`translate3d(${n}, ${h}, 0)`},{offset:1,transform:`translate3d(${S}, ${C}, 0)`}],d=[{offset:0,transform:`translate3d(${S}, ${C}, 0)`},{offset:1,transform:`translate3d(${n}, ${h}, 0)`}],X=c?d:a,A=c?[{offset:0,opacity:1,transform:P},{offset:1,opacity:0,transform:v}]:[{offset:0,opacity:0,transform:v},{offset:1,opacity:1,transform:P}],I=c?[{offset:0,opacity:1,transform:"scale(1)"},{offset:.2,opacity:0,transform:"scale(0.6)"},{offset:1,opacity:0,transform:"scale(0.6)"}]:[{offset:0,opacity:0,transform:"scale(0.6)"},{offset:.6,opacity:0,transform:"scale(0.6)"},{offset:1,opacity:1,transform:"scale(1)"}],N=o(),F=o(),w=o(),T=U("ion-back-button"),D=b(T).querySelector(".button-text"),K=b(T).querySelector("ion-icon");T.text=e.text,T.mode=e.mode,T.icon=e.icon,T.color=e.color,T.disabled=e.disabled,T.style.setProperty("display","block"),T.style.setProperty("position","fixed"),F.addElement(K),N.addElement(D),w.addElement(T),w.beforeStyles({position:"absolute",top:"0px",[R]:"0px"}).keyframes(X),N.beforeStyles({"transform-origin":`${f} top`}).beforeAddWrite(()=>{e.style.setProperty("display","none"),T.style.setProperty(f,_)}).afterAddWrite(()=>{e.style.setProperty("display",""),T.style.setProperty("display","none"),T.style.removeProperty(f)}).keyframes(A),F.beforeStyles({"transform-origin":`${m} center`}).keyframes(I),r.addAnimation([N,F,w])},z=(r,s,c,e,t,p,i,u)=>{var l,y;let E=s?"right":"left",_=s?`calc(100% - ${t.right}px)`:`${t.left}px`,f="0px",m=`${t.top}px`,R=8,q=s?`-${window.innerWidth-u.right-R}px`:`${u.x-R}px`,g=`${u.y-2}px`,v=((l=i.textContent)===null||l===void 0?void 0:l.trim())===((y=e.textContent)===null||y===void 0?void 0:y.trim()),P=u.width/p.width,W=u.height/(p.height-Z),x="scale(1)",n=v?`scale(${P}, ${W})`:`scale(${W})`,S=[{offset:0,opacity:0,transform:`translate3d(${q}, ${g}, 0) ${n}`},{offset:.1,opacity:0},{offset:1,opacity:1,transform:`translate3d(${f}, ${m}, 0) ${x}`}],h=[{offset:0,opacity:.99,transform:`translate3d(${f}, ${m}, 0) ${x}`},{offset:.6,opacity:0},{offset:1,opacity:0,transform:`translate3d(${q}, ${g}, 0) ${n}`}],C=c?S:h,a=U("ion-title"),d=o();a.innerText=e.innerText,a.size=e.size,a.color=e.color,d.addElement(a),d.beforeStyles({"transform-origin":`${E} top`,height:`${t.height}px`,display:"",position:"relative",[E]:_}).beforeAddWrite(()=>{e.style.setProperty("opacity","0")}).afterAddWrite(()=>{e.style.setProperty("opacity",""),a.style.setProperty("display","none")}).keyframes(C),r.addAnimation(d)},ot=(r,s)=>{var c;try{let e="cubic-bezier(0.32,0.72,0,1)",t="opacity",p="transform",i="0%",l=r.ownerDocument.dir==="rtl",y=l?"-99.5%":"99.5%",E=l?"33%":"-33%",_=s.enteringEl,f=s.leavingEl,m=s.direction==="back",R=_.querySelector(":scope > ion-content"),q=_.querySelectorAll(":scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *"),L=_.querySelectorAll(":scope > ion-header > ion-toolbar"),g=o(),v=o();if(g.addElement(_).duration(((c=s.duration)!==null&&c!==void 0?c:0)||j).easing(s.easing||e).fill("both").beforeRemoveClass("ion-page-invisible"),f&&r!==null&&r!==void 0){let n=o();n.addElement(r),g.addAnimation(n)}if(!R&&L.length===0&&q.length===0?v.addElement(_.querySelector(":scope > .ion-page, :scope > ion-nav, :scope > ion-tabs")):(v.addElement(R),v.addElement(q)),g.addAnimation(v),m?v.beforeClearStyles([t]).fromTo("transform",`translateX(${E})`,`translateX(${i})`).fromTo(t,.8,1):v.beforeClearStyles([t]).fromTo("transform",`translateX(${y})`,`translateX(${i})`),R){let n=b(R).querySelector(".transition-effect");if(n){let S=n.querySelector(".transition-cover"),h=n.querySelector(".transition-shadow"),C=o(),a=o(),d=o();C.addElement(n).beforeStyles({opacity:"1",display:"block"}).afterStyles({opacity:"",display:""}),a.addElement(S).beforeClearStyles([t]).fromTo(t,0,.1),d.addElement(h).beforeClearStyles([t]).fromTo(t,.03,.7),C.addAnimation([a,d]),v.addAnimation([C])}}let P=_.querySelector("ion-header.header-collapse-condense"),{forward:W,backward:x}=J(g,l,m,_,f);if(L.forEach(n=>{let S=o();S.addElement(n),g.addAnimation(S);let h=o();h.addElement(n.querySelector("ion-title"));let C=o(),a=Array.from(n.querySelectorAll("ion-buttons,[menuToggle]")),d=n.closest("ion-header"),X=d==null?void 0:d.classList.contains("header-collapse-condense-inactive"),$;m?$=a.filter(I=>{let N=I.classList.contains("buttons-collapse");return N&&!X||!N}):$=a.filter(I=>!I.classList.contains("buttons-collapse")),C.addElement($);let B=o();B.addElement(n.querySelectorAll(":scope > *:not(ion-title):not(ion-buttons):not([menuToggle])"));let A=o();A.addElement(b(n).querySelector(".toolbar-background"));let O=o(),Y=n.querySelector("ion-back-button");if(Y&&O.addElement(Y),S.addAnimation([h,C,B,A,O]),C.fromTo(t,.01,1),B.fromTo(t,.01,1),m)X||h.fromTo("transform",`translateX(${E})`,`translateX(${i})`).fromTo(t,.01,1),B.fromTo("transform",`translateX(${E})`,`translateX(${i})`),O.fromTo(t,.01,1);else if(P||h.fromTo("transform",`translateX(${y})`,`translateX(${i})`).fromTo(t,.01,1),B.fromTo("transform",`translateX(${y})`,`translateX(${i})`),A.beforeClearStyles([t,"transform"]),(d==null?void 0:d.translucent)?A.fromTo("transform",l?"translateX(-100%)":"translateX(100%)","translateX(0px)"):A.fromTo(t,.01,"var(--opacity)"),W||O.fromTo(t,.01,1),Y&&!W){let N=o();N.addElement(b(Y).querySelector(".button-text")).fromTo("transform",l?"translateX(-100px)":"translateX(100px)","translateX(0px)"),S.addAnimation(N)}}),f){let n=o(),S=f.querySelector(":scope > ion-content"),h=f.querySelectorAll(":scope > ion-header > ion-toolbar"),C=f.querySelectorAll(":scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *");if(!S&&h.length===0&&C.length===0?n.addElement(f.querySelector(":scope > .ion-page, :scope > ion-nav, :scope > ion-tabs")):(n.addElement(S),n.addElement(C)),g.addAnimation(n),m){n.beforeClearStyles([t]).fromTo("transform",`translateX(${i})`,l?"translateX(-100%)":"translateX(100%)");let a=H(f);g.afterAddWrite(()=>{g.getDirection()==="normal"&&a.style.setProperty("display","none")})}else n.fromTo("transform",`translateX(${i})`,`translateX(${E})`).fromTo(t,1,.8);if(S){let a=b(S).querySelector(".transition-effect");if(a){let d=a.querySelector(".transition-cover"),X=a.querySelector(".transition-shadow"),$=o(),B=o(),A=o();$.addElement(a).beforeStyles({opacity:"1",display:"block"}).afterStyles({opacity:"",display:""}),B.addElement(d).beforeClearStyles([t]).fromTo(t,.1,0),A.addElement(X).beforeClearStyles([t]).fromTo(t,.7,.03),$.addAnimation([B,A]),n.addAnimation([$])}}h.forEach(a=>{let d=o();d.addElement(a);let X=o();X.addElement(a.querySelector("ion-title"));let $=o(),B=a.querySelectorAll("ion-buttons,[menuToggle]"),A=a.closest("ion-header"),O=A==null?void 0:A.classList.contains("header-collapse-condense-inactive"),Y=Array.from(B).filter(D=>{let K=D.classList.contains("buttons-collapse");return K&&!O||!K});$.addElement(Y);let I=o(),N=a.querySelectorAll(":scope > *:not(ion-title):not(ion-buttons):not([menuToggle])");N.length>0&&I.addElement(N);let F=o();F.addElement(b(a).querySelector(".toolbar-background"));let w=o(),T=a.querySelector("ion-back-button");if(T&&w.addElement(T),d.addAnimation([X,$,I,w,F]),g.addAnimation(d),w.fromTo(t,.99,0),$.fromTo(t,.99,0),I.fromTo(t,.99,0),m){if(O||X.fromTo("transform",`translateX(${i})`,l?"translateX(-100%)":"translateX(100%)").fromTo(t,.99,0),I.fromTo("transform",`translateX(${i})`,l?"translateX(-100%)":"translateX(100%)"),F.beforeClearStyles([t,"transform"]),(A==null?void 0:A.translucent)?F.fromTo("transform","translateX(0px)",l?"translateX(-100%)":"translateX(100%)"):F.fromTo(t,"var(--opacity)",0),T&&!x){let K=o();K.addElement(b(T).querySelector(".button-text")).fromTo("transform",`translateX(${i})`,`translateX(${(l?-124:124)+"px"})`),d.addAnimation(K)}}else O||X.fromTo("transform",`translateX(${i})`,`translateX(${E})`).fromTo(t,.99,0).afterClearStyles([p,t]),I.fromTo("transform",`translateX(${i})`,`translateX(${E})`).afterClearStyles([p,t]),w.afterClearStyles([t]),X.afterClearStyles([t]),$.afterClearStyles([t])})}return g}catch(e){throw e}},Z=10;export{b as a,ot as b};
