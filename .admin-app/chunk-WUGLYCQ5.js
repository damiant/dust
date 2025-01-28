import{s as C}from"./chunk-SLKJQVFW.js";function w(o){let n=o.split(`
`),e=[];for(let a of n){let t=a.split(",");t.length>=2&&e.push({lat:parseFloat(t[1].trim()),lng:parseFloat(t[0].trim())})}return e.length==0?{lat:-1,lng:-1}:(e[e.length-1].lng==e[0].lng&&e[e.length-1].lat==e[0].lat&&e.length>1&&e.pop(),e.length==1?e[0]:L(e))}function x(o,n){let e=n.map(r=>o=="lat"?r.lat:r.lng),a=Math.min(...e),t=Math.max(...e);o==="lng"&&t-a>180&&(e=e.map(r=>r<t-180?r+360:r),a=Math.min(...e),t=Math.max(...e));let i=(a+t)/2;return o==="lng"&&i>180&&(i-=360),i}function L(o){return{lat:x("lat",o),lng:x("lng",o)}}var p=class p{constructor(){}parse(n,e,a=!1){let t={camps:[],art:[],pins:[],newCamps:[],newArt:[]},i=n.split("<Placemark>"),r=0,h=0;for(let f of i){h++;let m=this.extractBetweenTags(f,"name").replace(" sc","").replace("<![cdata[","").replace("<![CDATA[","").replace("]]>","").replace(/\r/g,"").replace(/\n/g,"").trim(),c=m.toLowerCase(),u=this.extractBetweenTags(f,"description").replace(" sc","").replace("<![CDATA[","").replace("]]>","").replace(/\r/g,"").replace(/\n/g,"").replace(/<br>/g,`\r
`).trim(),l=w(this.extractBetweenTags(f,"coordinates")),s;for(let g of e){if(g.externalId&&c.endsWith(g.externalId)){s=g;break}if(this.campNameMatch(c,g.name)){s=g;break}}s?(console.log(`${c} at ${JSON.stringify(l)} matched with ${s.name}`),s.pin=JSON.stringify(l),(a?t.art.find(d=>d.id==s.id):t.camps.find(d=>d.id==s.id))||(a?t.art.push(s):t.camps.push(s)),r++):c.includes("porto")||c.includes("restroom")||c.includes("toilet")?t.pins.push({label:"Restrooms",gpsLat:l.lat,gpsLng:l.lng,x:0,y:0}):(console.warn(`"${c}" at ${JSON.stringify(l)} does not match`),u==""&&(u=`${m} is a theme camp.`),a?t.newArt.push({id:void 0,contact_email:"",art_type:"Art",category:"Art",name:m,description:u,pin:JSON.stringify(l),imageUrl:void 0,externalId:void 0}):t.newCamps.push({id:void 0,contact_email:"",camp_type:"Theme Camp",name:m,description:u,pin:JSON.stringify(l),imageUrl:void 0,externalId:void 0}))}return console.log(`Found ${r} of ${h} matches`,t),t}withoutCamp(n){return this.noEmojis(n.toLowerCase()).replace("camp ","").replace(" camp","").trim()}noEmojis(n){return n.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,"").replace(/'/g,"").replace(/`/g,"").replace(/&/g,"and").replace("/-/g","").replace(/the/g,"")}campNameMatch(n,e){return this.withoutCamp(n)==this.withoutCamp(e)}extractBetweenTags(n,e){let a=`<${e}>`,t=`</${e}>`,i=n.indexOf(a);if(i===-1)return"";let r=n.indexOf(t,i);return r===-1?"":n.substring(i+a.length,r)}};p.\u0275fac=function(e){return new(e||p)},p.\u0275prov=C({token:p,factory:p.\u0275fac,providedIn:"root"});var F=p;export{F as a};
