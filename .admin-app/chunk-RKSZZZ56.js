import{s as oe}from"./chunk-PNZTRGP7.js";import{a as L}from"./chunk-LNJ3S2LQ.js";function le(s){let e=s.split(`
`),t=[];for(let r of e){let n=r.split(",");n.length>=2&&t.push({lat:parseFloat(n[1].trim()),lng:parseFloat(n[0].trim())})}return t.length==0?{lat:-1,lng:-1}:(t[t.length-1].lng==t[0].lng&&t[t.length-1].lat==t[0].lat&&t.length>1&&t.pop(),t.length==1?t[0]:ye(t))}function ae(s,e){let t=e.map(i=>s=="lat"?i.lat:i.lng),r=Math.min(...t),n=Math.max(...t);s==="lng"&&n-r>180&&(t=t.map(i=>i<n-180?i+360:i),r=Math.min(...t),n=Math.max(...t));let u=(r+n)/2;return s==="lng"&&u>180&&(u-=360),u}function ye(s){return{lat:ae("lat",s),lng:ae("lng",s)}}function _(s){return Array.isArray?Array.isArray(s):Ee(s)==="[object Array]"}var _e=1/0;function xe(s){if(typeof s=="string")return s;let e=s+"";return e=="0"&&1/s==-_e?"-0":e}function we(s){return s==null?"":xe(s)}function M(s){return typeof s=="string"}function me(s){return typeof s=="number"}function Ie(s){return s===!0||s===!1||Le(s)&&Ee(s)=="[object Boolean]"}function Ce(s){return typeof s=="object"}function Le(s){return Ce(s)&&s!==null}function E(s){return s!=null}function z(s){return!s.trim().length}function Ee(s){return s==null?s===void 0?"[object Undefined]":"[object Null]":Object.prototype.toString.call(s)}var be="Incorrect 'index' type",Se=s=>`Invalid value for key ${s}`,$e=s=>`Pattern length exceeds max of ${s}.`,Ne=s=>`Missing ${s} property in key`,Re=s=>`Property 'weight' in key '${s}' must be a positive integer`,he=Object.prototype.hasOwnProperty,J=class{constructor(e){this._keys=[],this._keyMap={};let t=0;e.forEach(r=>{let n=Fe(r);this._keys.push(n),this._keyMap[n.id]=n,t+=n.weight}),this._keys.forEach(r=>{r.weight/=t})}get(e){return this._keyMap[e]}keys(){return this._keys}toJSON(){return JSON.stringify(this._keys)}};function Fe(s){let e=null,t=null,r=null,n=1,u=null;if(M(s)||_(s))r=s,e=fe(s),t=U(s);else{if(!he.call(s,"name"))throw new Error(Ne("name"));let i=s.name;if(r=i,he.call(s,"weight")&&(n=s.weight,n<=0))throw new Error(Re(i));e=fe(i),t=U(i),u=s.getFn}return{path:e,id:t,weight:n,src:r,getFn:u}}function fe(s){return _(s)?s:s.split(".")}function U(s){return _(s)?s.join("."):s}function Oe(s,e){let t=[],r=!1,n=(u,i,o)=>{if(E(u))if(!i[o])t.push(u);else{let l=i[o],c=u[l];if(!E(c))return;if(o===i.length-1&&(M(c)||me(c)||Ie(c)))t.push(we(c));else if(_(c)){r=!0;for(let a=0,g=c.length;a<g;a+=1)n(c[a],i,o+1)}else i.length&&n(c,i,o+1)}};return n(s,M(e)?e.split("."):e,0),r?t:t[0]}var ke={includeMatches:!1,findAllMatches:!1,minMatchCharLength:1},Te={isCaseSensitive:!1,ignoreDiacritics:!1,includeScore:!1,keys:[],shouldSort:!0,sortFn:(s,e)=>s.score===e.score?s.idx<e.idx?-1:1:s.score<e.score?-1:1},ve={location:0,threshold:.6,distance:100},je={useExtendedSearch:!1,getFn:Oe,ignoreLocation:!1,ignoreFieldNorm:!1,fieldNormWeight:1},h=L(L(L(L({},Te),ke),ve),je),Pe=/[^ ]+/g;function We(s=1,e=3){let t=new Map,r=Math.pow(10,e);return{get(n){let u=n.match(Pe).length;if(t.has(u))return t.get(u);let i=1/Math.pow(u,.5*s),o=parseFloat(Math.round(i*r)/r);return t.set(u,o),o},clear(){t.clear()}}}var R=class{constructor({getFn:e=h.getFn,fieldNormWeight:t=h.fieldNormWeight}={}){this.norm=We(t,3),this.getFn=e,this.isCreated=!1,this.setIndexRecords()}setSources(e=[]){this.docs=e}setIndexRecords(e=[]){this.records=e}setKeys(e=[]){this.keys=e,this._keysMap={},e.forEach((t,r)=>{this._keysMap[t.id]=r})}create(){this.isCreated||!this.docs.length||(this.isCreated=!0,M(this.docs[0])?this.docs.forEach((e,t)=>{this._addString(e,t)}):this.docs.forEach((e,t)=>{this._addObject(e,t)}),this.norm.clear())}add(e){let t=this.size();M(e)?this._addString(e,t):this._addObject(e,t)}removeAt(e){this.records.splice(e,1);for(let t=e,r=this.size();t<r;t+=1)this.records[t].i-=1}getValueForItemAtKeyId(e,t){return e[this._keysMap[t]]}size(){return this.records.length}_addString(e,t){if(!E(e)||z(e))return;let r={v:e,i:t,n:this.norm.get(e)};this.records.push(r)}_addObject(e,t){let r={i:t,$:{}};this.keys.forEach((n,u)=>{let i=n.getFn?n.getFn(e):this.getFn(e,n.path);if(E(i)){if(_(i)){let o=[],l=[{nestedArrIndex:-1,value:i}];for(;l.length;){let{nestedArrIndex:c,value:a}=l.pop();if(E(a))if(M(a)&&!z(a)){let g={v:a,i:c,n:this.norm.get(a)};o.push(g)}else _(a)&&a.forEach((g,f)=>{l.push({nestedArrIndex:f,value:g})})}r.$[u]=o}else if(M(i)&&!z(i)){let o={v:i,n:this.norm.get(i)};r.$[u]=o}}}),this.records.push(r)}toJSON(){return{keys:this.keys,records:this.records}}};function ge(s,e,{getFn:t=h.getFn,fieldNormWeight:r=h.fieldNormWeight}={}){let n=new R({getFn:t,fieldNormWeight:r});return n.setKeys(s.map(Fe)),n.setSources(e),n.create(),n}function Ke(s,{getFn:e=h.getFn,fieldNormWeight:t=h.fieldNormWeight}={}){let{keys:r,records:n}=s,u=new R({getFn:e,fieldNormWeight:t});return u.setKeys(r),u.setIndexRecords(n),u}function k(s,{errors:e=0,currentLocation:t=0,expectedLocation:r=0,distance:n=h.distance,ignoreLocation:u=h.ignoreLocation}={}){let i=e/s.length;if(u)return i;let o=Math.abs(r-t);return n?i+o/n:o?1:i}function He(s=[],e=h.minMatchCharLength){let t=[],r=-1,n=-1,u=0;for(let i=s.length;u<i;u+=1){let o=s[u];o&&r===-1?r=u:!o&&r!==-1&&(n=u-1,n-r+1>=e&&t.push([r,n]),r=-1)}return s[u-1]&&u-r>=e&&t.push([r,u-1]),t}var b=32;function ze(s,e,t,{location:r=h.location,distance:n=h.distance,threshold:u=h.threshold,findAllMatches:i=h.findAllMatches,minMatchCharLength:o=h.minMatchCharLength,includeMatches:l=h.includeMatches,ignoreLocation:c=h.ignoreLocation}={}){if(e.length>b)throw new Error($e(b));let a=e.length,g=s.length,f=Math.max(0,Math.min(r,g)),p=u,d=f,A=o>1||l,m=A?Array(g):[],C;for(;(C=s.indexOf(e,d))>-1;){let D=k(e,{currentLocation:C,expectedLocation:f,distance:n,ignoreLocation:c});if(p=Math.min(D,p),d=C+a,A){let x=0;for(;x<a;)m[C+x]=1,x+=1}}d=-1;let F=[],$=1,I=a+g,Me=1<<a-1;for(let D=0;D<a;D+=1){let x=0,w=I;for(;x<w;)k(e,{errors:D,currentLocation:f+w,expectedLocation:f,distance:n,ignoreLocation:c})<=p?x=w:I=w,w=Math.floor((I-x)/2+x);I=w;let ue=Math.max(1,f-w+1),H=i?g:Math.min(f+w,g)+a,N=Array(H+2);N[H+1]=(1<<D)-1;for(let B=H;B>=ue;B-=1){let O=B-1,ce=t[s.charAt(O)];if(A&&(m[O]=+!!ce),N[B]=(N[B+1]<<1|1)&ce,D&&(N[B]|=(F[B+1]|F[B])<<1|1|F[B+1]),N[B]&Me&&($=k(e,{errors:D,currentLocation:O,expectedLocation:f,distance:n,ignoreLocation:c}),$<=p)){if(p=$,d=O,d<=f)break;ue=Math.max(1,2*f-d)}}if(k(e,{errors:D+1,currentLocation:f,expectedLocation:f,distance:n,ignoreLocation:c})>p)break;F=N}let K={isMatch:d>=0,score:Math.max(.001,$)};if(A){let D=He(m,o);D.length?l&&(K.indices=D):K.isMatch=!1}return K}function Je(s){let e={};for(let t=0,r=s.length;t<r;t+=1){let n=s.charAt(t);e[n]=(e[n]||0)|1<<r-t-1}return e}var T=String.prototype.normalize?s=>s.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g,""):s=>s,v=class{constructor(e,{location:t=h.location,threshold:r=h.threshold,distance:n=h.distance,includeMatches:u=h.includeMatches,findAllMatches:i=h.findAllMatches,minMatchCharLength:o=h.minMatchCharLength,isCaseSensitive:l=h.isCaseSensitive,ignoreDiacritics:c=h.ignoreDiacritics,ignoreLocation:a=h.ignoreLocation}={}){if(this.options={location:t,threshold:r,distance:n,includeMatches:u,findAllMatches:i,minMatchCharLength:o,isCaseSensitive:l,ignoreDiacritics:c,ignoreLocation:a},e=l?e:e.toLowerCase(),e=c?T(e):e,this.pattern=e,this.chunks=[],!this.pattern.length)return;let g=(p,d)=>{this.chunks.push({pattern:p,alphabet:Je(p),startIndex:d})},f=this.pattern.length;if(f>b){let p=0,d=f%b,A=f-d;for(;p<A;)g(this.pattern.substr(p,b),p),p+=b;if(d){let m=f-b;g(this.pattern.substr(m),m)}}else g(this.pattern,0)}searchIn(e){let{isCaseSensitive:t,ignoreDiacritics:r,includeMatches:n}=this.options;if(e=t?e:e.toLowerCase(),e=r?T(e):e,this.pattern===e){let A={isMatch:!0,score:0};return n&&(A.indices=[[0,e.length-1]]),A}let{location:u,distance:i,threshold:o,findAllMatches:l,minMatchCharLength:c,ignoreLocation:a}=this.options,g=[],f=0,p=!1;this.chunks.forEach(({pattern:A,alphabet:m,startIndex:C})=>{let{isMatch:F,score:$,indices:I}=ze(e,A,m,{location:u+C,distance:i,threshold:o,findAllMatches:l,minMatchCharLength:c,includeMatches:n,ignoreLocation:a});F&&(p=!0),f+=$,F&&I&&(g=[...g,...I])});let d={isMatch:p,score:p?f/this.chunks.length:1};return p&&n&&(d.indices=g),d}},y=class{constructor(e){this.pattern=e}static isMultiMatch(e){return de(e,this.multiRegex)}static isSingleMatch(e){return de(e,this.singleRegex)}search(){}};function de(s,e){let t=s.match(e);return t?t[1]:null}var V=class extends y{constructor(e){super(e)}static get type(){return"exact"}static get multiRegex(){return/^="(.*)"$/}static get singleRegex(){return/^=(.*)$/}search(e){let t=e===this.pattern;return{isMatch:t,score:t?0:1,indices:[0,this.pattern.length-1]}}},Y=class extends y{constructor(e){super(e)}static get type(){return"inverse-exact"}static get multiRegex(){return/^!"(.*)"$/}static get singleRegex(){return/^!(.*)$/}search(e){let r=e.indexOf(this.pattern)===-1;return{isMatch:r,score:r?0:1,indices:[0,e.length-1]}}},G=class extends y{constructor(e){super(e)}static get type(){return"prefix-exact"}static get multiRegex(){return/^\^"(.*)"$/}static get singleRegex(){return/^\^(.*)$/}search(e){let t=e.startsWith(this.pattern);return{isMatch:t,score:t?0:1,indices:[0,this.pattern.length-1]}}},Q=class extends y{constructor(e){super(e)}static get type(){return"inverse-prefix-exact"}static get multiRegex(){return/^!\^"(.*)"$/}static get singleRegex(){return/^!\^(.*)$/}search(e){let t=!e.startsWith(this.pattern);return{isMatch:t,score:t?0:1,indices:[0,e.length-1]}}},X=class extends y{constructor(e){super(e)}static get type(){return"suffix-exact"}static get multiRegex(){return/^"(.*)"\$$/}static get singleRegex(){return/^(.*)\$$/}search(e){let t=e.endsWith(this.pattern);return{isMatch:t,score:t?0:1,indices:[e.length-this.pattern.length,e.length-1]}}},Z=class extends y{constructor(e){super(e)}static get type(){return"inverse-suffix-exact"}static get multiRegex(){return/^!"(.*)"\$$/}static get singleRegex(){return/^!(.*)\$$/}search(e){let t=!e.endsWith(this.pattern);return{isMatch:t,score:t?0:1,indices:[0,e.length-1]}}},j=class extends y{constructor(e,{location:t=h.location,threshold:r=h.threshold,distance:n=h.distance,includeMatches:u=h.includeMatches,findAllMatches:i=h.findAllMatches,minMatchCharLength:o=h.minMatchCharLength,isCaseSensitive:l=h.isCaseSensitive,ignoreDiacritics:c=h.ignoreDiacritics,ignoreLocation:a=h.ignoreLocation}={}){super(e),this._bitapSearch=new v(e,{location:t,threshold:r,distance:n,includeMatches:u,findAllMatches:i,minMatchCharLength:o,isCaseSensitive:l,ignoreDiacritics:c,ignoreLocation:a})}static get type(){return"fuzzy"}static get multiRegex(){return/^"(.*)"$/}static get singleRegex(){return/^(.*)$/}search(e){return this._bitapSearch.searchIn(e)}},P=class extends y{constructor(e){super(e)}static get type(){return"include"}static get multiRegex(){return/^'"(.*)"$/}static get singleRegex(){return/^'(.*)$/}search(e){let t=0,r,n=[],u=this.pattern.length;for(;(r=e.indexOf(this.pattern,t))>-1;)t=r+u,n.push([r,t-1]);let i=!!n.length;return{isMatch:i,score:i?0:1,indices:n}}},q=[V,P,G,Q,Z,X,Y,j],pe=q.length,Ue=/ +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/,Ve="|";function Ye(s,e={}){return s.split(Ve).map(t=>{let r=t.trim().split(Ue).filter(u=>u&&!!u.trim()),n=[];for(let u=0,i=r.length;u<i;u+=1){let o=r[u],l=!1,c=-1;for(;!l&&++c<pe;){let a=q[c],g=a.isMultiMatch(o);g&&(n.push(new a(g,e)),l=!0)}if(!l)for(c=-1;++c<pe;){let a=q[c],g=a.isSingleMatch(o);if(g){n.push(new a(g,e));break}}}return n})}var Ge=new Set([j.type,P.type]),ee=class{constructor(e,{isCaseSensitive:t=h.isCaseSensitive,ignoreDiacritics:r=h.ignoreDiacritics,includeMatches:n=h.includeMatches,minMatchCharLength:u=h.minMatchCharLength,ignoreLocation:i=h.ignoreLocation,findAllMatches:o=h.findAllMatches,location:l=h.location,threshold:c=h.threshold,distance:a=h.distance}={}){this.query=null,this.options={isCaseSensitive:t,ignoreDiacritics:r,includeMatches:n,minMatchCharLength:u,findAllMatches:o,ignoreLocation:i,location:l,threshold:c,distance:a},e=t?e:e.toLowerCase(),e=r?T(e):e,this.pattern=e,this.query=Ye(this.pattern,this.options)}static condition(e,t){return t.useExtendedSearch}searchIn(e){let t=this.query;if(!t)return{isMatch:!1,score:1};let{includeMatches:r,isCaseSensitive:n,ignoreDiacritics:u}=this.options;e=n?e:e.toLowerCase(),e=u?T(e):e;let i=0,o=[],l=0;for(let c=0,a=t.length;c<a;c+=1){let g=t[c];o.length=0,i=0;for(let f=0,p=g.length;f<p;f+=1){let d=g[f],{isMatch:A,indices:m,score:C}=d.search(e);if(A){if(i+=1,l+=C,r){let F=d.constructor.type;Ge.has(F)?o=[...o,...m]:o.push(m)}}else{l=0,i=0,o.length=0;break}}if(i){let f={isMatch:!0,score:l/i};return r&&(f.indices=o),f}}return{isMatch:!1,score:1}}},te=[];function Qe(...s){te.push(...s)}function se(s,e){for(let t=0,r=te.length;t<r;t+=1){let n=te[t];if(n.condition(s,e))return new n(s,e)}return new v(s,e)}var W={AND:"$and",OR:"$or"},ne={PATH:"$path",PATTERN:"$val"},re=s=>!!(s[W.AND]||s[W.OR]),Xe=s=>!!s[ne.PATH],Ze=s=>!_(s)&&Ce(s)&&!re(s),Ae=s=>({[W.AND]:Object.keys(s).map(e=>({[e]:s[e]}))});function De(s,e,{auto:t=!0}={}){let r=n=>{let u=Object.keys(n),i=Xe(n);if(!i&&u.length>1&&!re(n))return r(Ae(n));if(Ze(n)){let l=i?n[ne.PATH]:u[0],c=i?n[ne.PATTERN]:n[l];if(!M(c))throw new Error(Se(l));let a={keyId:U(l),pattern:c};return t&&(a.searcher=se(c,e)),a}let o={children:[],operator:u[0]};return u.forEach(l=>{let c=n[l];_(c)&&c.forEach(a=>{o.children.push(r(a))})}),o};return re(s)||(s=Ae(s)),r(s)}function qe(s,{ignoreFieldNorm:e=h.ignoreFieldNorm}){s.forEach(t=>{let r=1;t.matches.forEach(({key:n,norm:u,score:i})=>{let o=n?n.weight:null;r*=Math.pow(i===0&&o?Number.EPSILON:i,(o||1)*(e?1:u))}),t.score=r})}function et(s,e){let t=s.matches;e.matches=[],E(t)&&t.forEach(r=>{if(!E(r.indices)||!r.indices.length)return;let{indices:n,value:u}=r,i={indices:n,value:u};r.key&&(i.key=r.key.src),r.idx>-1&&(i.refIndex=r.idx),e.matches.push(i)})}function tt(s,e){e.score=s.score}function st(s,e,{includeMatches:t=h.includeMatches,includeScore:r=h.includeScore}={}){let n=[];return t&&n.push(et),r&&n.push(tt),s.map(u=>{let{idx:i}=u,o={item:e[i],refIndex:i};return n.length&&n.forEach(l=>{l(u,o)}),o})}var ie=(()=>{class s{constructor(t,r={},n){this.options=L(L({},h),r),this.options.useExtendedSearch,this._keyStore=new J(this.options.keys),this.setCollection(t,n)}setCollection(t,r){if(this._docs=t,r&&!(r instanceof R))throw new Error(be);this._myIndex=r||ge(this.options.keys,this._docs,{getFn:this.options.getFn,fieldNormWeight:this.options.fieldNormWeight})}add(t){E(t)&&(this._docs.push(t),this._myIndex.add(t))}remove(t=()=>!1){let r=[];for(let n=0,u=this._docs.length;n<u;n+=1){let i=this._docs[n];t(i,n)&&(this.removeAt(n),n-=1,u-=1,r.push(i))}return r}removeAt(t){this._docs.splice(t,1),this._myIndex.removeAt(t)}getIndex(){return this._myIndex}search(t,{limit:r=-1}={}){let{includeMatches:n,includeScore:u,shouldSort:i,sortFn:o,ignoreFieldNorm:l}=this.options,c=M(t)?M(this._docs[0])?this._searchStringList(t):this._searchObjectList(t):this._searchLogical(t);return qe(c,{ignoreFieldNorm:l}),i&&c.sort(o),me(r)&&r>-1&&(c=c.slice(0,r)),st(c,this._docs,{includeMatches:n,includeScore:u})}_searchStringList(t){let r=se(t,this.options),{records:n}=this._myIndex,u=[];return n.forEach(({v:i,i:o,n:l})=>{if(!E(i))return;let{isMatch:c,score:a,indices:g}=r.searchIn(i);c&&u.push({item:i,idx:o,matches:[{score:a,value:i,norm:l,indices:g}]})}),u}_searchLogical(t){let r=De(t,this.options),n=(l,c,a)=>{if(!l.children){let{keyId:f,searcher:p}=l,d=this._findMatches({key:this._keyStore.get(f),value:this._myIndex.getValueForItemAtKeyId(c,f),searcher:p});return d&&d.length?[{idx:a,item:c,matches:d}]:[]}let g=[];for(let f=0,p=l.children.length;f<p;f+=1){let d=l.children[f],A=n(d,c,a);if(A.length)g.push(...A);else if(l.operator===W.AND)return[]}return g},u=this._myIndex.records,i={},o=[];return u.forEach(({$:l,i:c})=>{if(E(l)){let a=n(r,l,c);a.length&&(i[c]||(i[c]={idx:c,item:l,matches:[]},o.push(i[c])),a.forEach(({matches:g})=>{i[c].matches.push(...g)}))}}),o}_searchObjectList(t){let r=se(t,this.options),{keys:n,records:u}=this._myIndex,i=[];return u.forEach(({$:o,i:l})=>{if(!E(o))return;let c=[];n.forEach((a,g)=>{c.push(...this._findMatches({key:a,value:o[g],searcher:r}))}),c.length&&i.push({idx:l,item:o,matches:c})}),i}_findMatches({key:t,value:r,searcher:n}){if(!E(r))return[];let u=[];if(_(r))r.forEach(({v:i,i:o,n:l})=>{if(!E(i))return;let{isMatch:c,score:a,indices:g}=n.searchIn(i);c&&u.push({score:a,key:t,value:i,idx:o,norm:l,indices:g})});else{let{v:i,n:o}=r,{isMatch:l,score:c,indices:a}=n.searchIn(i);l&&u.push({score:c,key:t,value:i,norm:o,indices:a})}return u}}return s.version="7.1.0",s.createIndex=ge,s.parseIndex=Ke,s.config=h,s})();ie.parseQuery=De;Qe(ee);var S=class S{constructor(){}parse(e,t,r=!1){var c;let n={camps:[],art:[],pins:[],newCamps:[],newArt:[]},u=e.split("<Placemark>"),i=0,o=[],l=0;for(let a of u){l++;let g=this.extractBetweenTags(a,"name").replace(" sc","").replace("<![cdata[","").replace("<![CDATA[","").replace("]]>","").replace(/\r/g,"").replace(/\n/g,"").trim(),f=g.toLowerCase(),p=this.extractBetweenTags(a,"description").replace(" sc","").replace("<![CDATA[","").replace("]]>","").replace(/\r/g,"").replace(/\n/g,"").replace(/<br>/g,`\r
`).trim(),d=le(this.extractBetweenTags(a,"coordinates")),A;for(let m of t){if(m.externalId&&f.endsWith(m.externalId)){A=m;break}if(this.campNameMatch(f,m.name)){A=m;break}m.ref=this.cleanString(m.name)}if(A==null){let C=new ie(t,{keys:["ref"],ignoreLocation:!0,includeScore:!0}).search(this.cleanString(f),{limit:1});if(C.length>0){A=C[0].item;let F=(c=C[0].score)!=null?c:0;F<.2?console.warn(`"${f}" close match is ${C[0].item.name} score ${F}`):A=void 0}}A?(A.pin=JSON.stringify(d),(r?n.art.find(C=>C.id==A.id):n.camps.find(C=>C.id==A.id))||(r?n.art.push(A):n.camps.push(A)),i++):f.includes("porto")||f.includes("restroom")||f.includes("toilet")?n.pins.push({label:"Restrooms",gpsLat:d.lat,gpsLng:d.lng,x:0,y:0}):(o.push(`"${f}" at ${JSON.stringify(d)} does not match. (${this.withoutCamp(f)})`),p==""&&(p=`${g} is a theme camp.`),r?n.newArt.push({id:void 0,contact_email:"",art_type:"Art",category:"Art",name:g,description:p,pin:JSON.stringify(d),imageUrl:void 0,externalId:void 0}):n.newCamps.push({id:void 0,contact_email:"",camp_type:"Theme Camp",name:g,description:p,pin:JSON.stringify(d),imageUrl:void 0,externalId:void 0}))}console.log(`Found ${i} of ${l} matches`,n);for(let a of o)console.error(a);return n}withoutCamp(e){return this.cleanString(e).replace("camp ","").replace(" camp","")}cleanString(e){let t=this.noEmojis(e.toLowerCase()).trim();return t=t.replace(" - ","-"),t=t.replace(/[^\x00-\x7F]/g,""),t=t.replace(/[-.]/g,""),t=t.replace(/\d/g,"").trim(),t}noEmojis(e){return e.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,"").replace(/'/g,"").replace(/`/g,"").replace(/&/g,"and").replace("/-/g","").replace(/the/g,"")}campNameMatch(e,t){return this.withoutCamp(e)===this.withoutCamp(t)}extractBetweenTags(e,t){let r=`<${t}>`,n=`</${t}>`,u=e.indexOf(r);if(u===-1)return"";let i=e.indexOf(n,u);return i===-1?"":e.substring(u+r.length,i)}};S.\u0275fac=function(t){return new(t||S)},S.\u0275prov=oe({token:S,factory:S.\u0275fac,providedIn:"root"});var Be=S;export{Be as a};
