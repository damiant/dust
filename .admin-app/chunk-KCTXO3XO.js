import{L as c,s as h,v as y}from"./chunk-PNZTRGP7.js";import{h as i}from"./chunk-LNJ3S2LQ.js";function $(s,e,t,n){let r=t&&P(s,t),a=t&&P(e,t);if(!t||r||a){let d=s.toLocaleDateString([],{weekday:"long"}),o=a&&!r?`Until ${g(e,n)} (${v(e,s)})`:`${g(s,n)} (${v(e,s)})`,b=`${g(s,n)}`;return{long:`${d} ${g(s,n)}-${g(e,n)} (${v(e,s)})`,short:o,brief:b}}}function C(s,e){return s===null||!s?e:s}function D(s){return!!String(s).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}function E(s){return!s||s.trim()==""}function O(s){return new Promise(e=>setTimeout(e,s))}function L(s,e){return(e.match(new RegExp(s,"g"))||[]).length}function U(s){if(!s)return"";let e=s.split("@");return e.length==3?e[1]:e.length==2?e[0]:""}function _(s){let e=new Date(s);return Math.ceil((e.getTime()-new Date().getTime())/(1e3*60*60*24))}function N(s){if(!s)return"";let e=s.split("@");return e.length==3?e[2]:e.length==2?e[1]:""}function w(s){if(!(s=="new"||!s))return parseInt(s,10)}function l(s,e){let t=""+s;for(;t.length<e;)t="0"+t;return t}function W(s){s.endsWith("Z")||(s=s+"Z");let e=s.split(/\D+/);return new Date(Date.UTC(e[0],--e[1],e[2],e[3],e[4],e[5],e[6]))}function Z(s){let e=s.split(/[-:.T]/),t={year:p(e[0]),month:p(e[1]),day:p(e[2]),hour:p(e[3]),min:p(e[4])};return new Date(t.year,t.month-1,t.day,t.hour,t.min)}function p(s){return parseInt(s,10)}function B(s,e){return s.setTime(s.getTime()+e*60*60*1e3),s}function j(s,e){return s.setTime(s.getTime()+e*60*1e3),s}function J(s,e,t,n,r){return`${l(s,4)}-${l(e+1,2)}-${l(t,2)}T${l(n,2)}:${l(r,2)}:00.000Z`}function z(s){let e=S(s);return(e<0?"+":"-")+l(parseInt(Math.abs(e/60)),2)+l(Math.abs(e%60),2)}function S(s){let e=new Date,t=new Date(e.toLocaleString("en-US",{timeZone:"UTC"}));return(new Date(e.toLocaleString("en-US",{timeZone:s}))-t)/(60*1e3)}function V(s){for(let[e,t]of Object.entries(s))(typeof t=="string"||t instanceof String)&&t&&t!==t.trim()&&(console.info(`${e} was trimmed of extra spaces.`),s[e]=t.trim())}var G=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];function g(s,e){let t=s.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:e}).toLowerCase().replace(" ","").replace(":00","");return t=="12am"?"Midnight":t=="12pm"?"Noon":t}function Y(s,e){return s.toLocaleTimeString([],{hour12:!1,hour:"2-digit",minute:"2-digit",timeZone:e}).toLowerCase()}function P(s,e){return s.getDate()===e.getDate()&&s.getMonth()===e.getMonth()&&s.getFullYear()===e.getFullYear()}function H(s,e="long"){let t=new Date().getFullYear(),n=[...Array(12).keys()],r=new Intl.DateTimeFormat(s,{month:e}),a=d=>r.format(new Date(t,d));return n.map(a)}function K(s){return new Promise((e,t)=>{try{let n=new FileReader;n.onloadend=()=>{let r=n.result;r?e(r):t()},n.onerror=t,n.readAsDataURL(s)}catch(n){t(n)}})}function v(s,e){let t=Math.ceil(Math.abs(s-e)/36e5),n=Math.floor(Math.abs(s-e)/1e3/60);return n<60?`${n}mins`:`${t}hrs`}function M(s){let e=s.replace(/-/g,"+").replace(/_/g,"/");switch(e.length%4){case 0:break;case 2:e+="==";break;case 3:e+="=";break;default:throw"Illegal base64url string!"}return decodeURIComponent(window.escape(window.atob(e)))}function I(s=""){if(s===null||s==="")return{upn:""};let e=s.split(".");if(e.length!==3)throw new Error("JWT must have 3 parts");let t=M(e[1]);if(!t)throw new Error("Cannot decode the token");return JSON.parse(t)}function F(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function q(s,e,t){return s&&s.replace(new RegExp(F(e),"g"),t)}function Q(s){return s.replace(/\n([a-z])/g," $1")}var u=class u{constructor(){this.mem={}}get(e){return this.mem[e]?this.mem[e]:localStorage[this.key(e)]}key(e){return e=="token"?e:`admin-${e}`}set(e,t){t==null&&(delete this.mem[e],localStorage.removeItem(e.toString())),this.mem[e]=t,localStorage[this.key(e)]=t}clear(){this.mem={},localStorage.clear()}};u.\u0275fac=function(t){return new(t||u)},u.\u0275prov=h({token:u,factory:u.\u0275fac,providedIn:"root"});var f=u;var A=8787;var m=class m{constructor(e){this.store=e;this.lastRoleResponse=null;this.changesMade=!1;this.user=c("");this.moreButton=c({buttons:[],event:void 0,hideProfile:!1});this.campRegistration=c(!1);this.campEditing=c(!1);this.eventEditing=c(!1);this.artEditing=c(!1);this.errorStream=c({status:200,text:"",url:""});this.messageStream=c({id:0,message:"",type:0});this.cache={}}get festivalId(){return this.store.get("festivalId")}isLocal(){return location.protocol==="capacitor:"?!1:location.href.includes("localhost:")||location.href.includes("ngrok")}url(e){return location.hostname,this.isLocal()?`http://${location.hostname}:${A}/${e}`:`https://api.dust.events/${e}`}imageURL(e){return e=="null"?"":this.isLocal()?e?`http://localhost:${A}/images/${e}`:"":e?`https://data.dust.events/${e}`:""}setFestival(e){this.campRegistration.set(e.camp_registration),this.campEditing.set(e.camp_editing),this.eventEditing.set(e.event_editing),this.artEditing.set(e.art_editing),this.store.set("festivalId",e.id),this.store.set("festivalTitle",e.name),this.store.set("festivalVanity",e.vanity),this.store.set("festivalImage",e.imageUrl),this.store.set("festivalTimeZone",e.timezone)}archive(e){return i(this,null,function*(){return yield this.post(`festivals/${e.vanity}/archive`,e)})}approve(e){return i(this,null,function*(){return yield this.post(`festivals/${e.vanity}/approve`,{})})}setEventTypes(e){return i(this,null,function*(){return yield this.post(`festivals/${e.vanity}/event-types`,e)})}setsetMessageSettings(e){return i(this,null,function*(){return yield this.post(`festivals/${e.festival_vanity}/message-settings`,e)})}vanity(){return this.store.get("festivalVanity")}produceError(e,t,n){this.errorStream.set({status:e,text:t,url:n})}getFestivalByVanity(e,t=!1,n=!0){return i(this,null,function*(){return(yield this.get(`festivals/${e}?by=vanity&pending=${t}`,{cached:n})).data})}isAdmin(e){return this.getAccessInfo(e).hasAdmin}isCampOwner(e,t){return this.getAccessInfo(e).camps.includes(t)}isArtOwner(e,t){return t?this.getAccessInfo(e).art.includes(t):!1}isEventOwner(e){return i(this,null,function*(){return e?!!(yield this.get(`events/${e}`,{cached:!1})):!1})}setFestivalByVanity(e,t=!1){return i(this,null,function*(){let n=!this.festivalId;if(this.vanity()==e&&!t&&!n)return;let r=yield this.getFestivalByVanity(e);if(!r)throw new Error(`Festival ${e} not found`);this.setFestival(r)})}sendPushMessage(e){return i(this,null,function*(){return yield this.post("messages",e)})}getPushInformation(){return i(this,null,function*(){return yield this.get("pushtokens")})}festivalTitle(){return this.store.get("festivalTitle")}festivalImage(){return this.store.get("festivalImage")}festivalTimeZone(){return this.store.get("festivalTimeZone")}addEvent(e){return i(this,null,function*(){return this.changesMade=!0,this.post("events",e)})}addMusic(e,t){return i(this,null,function*(){return e.occurrences=JSON.stringify(t),this.changesMade=!0,this.post("music",e)})}addLink(e){return i(this,null,function*(){return this.post("links",e)})}generateMap(e,t){return i(this,null,function*(){return yield this.post("map/create",{style:e,zoom:t})})}sendMessage(e,t,n){let r=this.messageStream();this.messageStream.set({id:r.id++,message:e,type:t!=null?t:0,title:n})}getCamp(e){return i(this,null,function*(){if(!e)return this.emptyCamp();let t=yield this.camp(e);return t||this.emptyCamp()})}getArt(e){return i(this,null,function*(){if(!e)return this.emptyArt();let t=yield this.artItem(e);return t||this.emptyArt()})}broadcast(e,t){return i(this,null,function*(){yield this.post("live",{festivalId:this.festivalId,lng:t.coords.longitude,lat:t.coords.latitude,id:e.id})})}emptyCamp(){return{name:"",description:"",pin:"",id:void 0,contact_email:"",camp_type:""}}emptyArt(){return{name:"",description:"",pin:"",category:"Open Playa Art",id:void 0,contact_email:"",art_type:""}}addFestival(e){return i(this,null,function*(){return yield this.post("festivals",e)})}updateFestivalSettings(e){return i(this,null,function*(){return yield this.post("festivals/registration",e)})}getFestivals(e){return i(this,null,function*(){return(yield this.get(e?"festivals?details=false":"festivals")).data})}getFestival(e,t){return i(this,null,function*(){let n=e?yield this.festival(e,t):void 0;return n||{name:"",contact:"",vanity:"",admins:"",description:"",mastodon_handle:"",inbox_email:"",start_time:new Date().toISOString(),end_time:new Date().toISOString(),id:void 0,active:!1,timezone:this.currentTimeZone(),gpsLat:0,gpsLng:0,approved:!1,camp_registration:!1,event_registration:!1,event_editing:!1,camp_editing:!1,art_editing:!1,max_event_types:2,map_direction:0,directions:void 0,pin:void 0,archived:!1,unknown_dates:!1,event_types:"",region:"",website:""}})}currentTimeZone(){return Intl.DateTimeFormat().resolvedOptions().timeZone}placeCamp(e,t){return i(this,null,function*(){return this.changesMade=!0,yield this.post("place",{id:e,pt:t})})}saveCSS(e){return i(this,null,function*(){return this.changesMade=!0,yield this.post("css",{css:e})})}getCSS(){return i(this,null,function*(){return yield this.get("css",{cached:!1,asText:!0})})}placeArt(e,t){return i(this,null,function*(){return this.changesMade=!0,yield this.post("place/art",{id:e,pt:t})})}placePins(e){return i(this,null,function*(){return this.changesMade=!0,yield this.post("pins",e)})}getPins(){return i(this,null,function*(){return(yield this.get("pins",{cached:!1})).data})}newEvent(){return i(this,null,function*(){let e=yield this.defaultCamp();return{description:"",title:"",hosted_by_camp:e?e.id:void 0,occurrence_set:"[]",id:void 0,event_type:"Event"}})}newMusic(){return i(this,null,function*(){var n;let e=yield this.defaultCamp();return{title:"",id:void 0,campId:e?e.id:void 0,occurrences:"[]",camp:(n=e==null?void 0:e.name)!=null?n:"",location:"",day:""}})}getLink(e){return i(this,null,function*(){let t=yield this.links();for(let n of t)if(n.id==e)return n;return{title:"",id:void 0,url:""}})}camps(e){return i(this,null,function*(){return(yield this.get("camps",e)).data.sort((n,r)=>n.name.localeCompare(r.name))})}art(e){return i(this,null,function*(){return(yield this.get("art",e)).data.sort((n,r)=>n.name.localeCompare(r.name))})}music(){return i(this,null,function*(){return(yield this.get("music")).data})}getMusic(e){return i(this,null,function*(){return(yield this.get(`music/${e}`)).data})}getUnpublishedChanges(){return i(this,null,function*(){return(yield this.get("publish",{cached:!1})).data})}camp(e){return i(this,null,function*(){return(yield this.get(`camps/${e}`)).data})}artItem(e){return i(this,null,function*(){return(yield this.get(`art/${e}`)).data})}festival(e,t){return i(this,null,function*(){return(yield this.get(`festivals/${e}`,t)).data})}defaultCamp(){return i(this,null,function*(){return(yield this.get("camp")).data})}events(e){return i(this,null,function*(){return(yield this.get("events",e)).data})}getEvent(e){return i(this,null,function*(){return(yield this.get(`events/${e}`)).data})}getRedirect(e){return i(this,null,function*(){let t=yield this.post("redirect",{code:e});console.log("getRedirect",t);let n=t.message.split("+");if(n)return this.store.set("token",n[0]),n[1]})}links(){return i(this,null,function*(){return(yield this.get("links")).data})}signIn(e){return i(this,null,function*(){return e=e.toLowerCase().trim(),yield this.post("signin",{email:e})})}deleteEvent(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("events",{id:e})})}clearCamps(){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("camps/locations",{})})}clearData(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete(e?"everything":"all",{})})}clearEvents(){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("all/events",{})})}clearArtLocations(){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("art/locations",{})})}clearPinLocations(){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("pins/locations",{})})}deleteParty(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("music",{id:e})})}deleteLink(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("links",{id:e})})}verify(e){return i(this,null,function*(){let n=(yield this.post("verify",{code:e})).message;return n.length>0?(this.store.set("token",n),!0):!1})}publish(){return i(this,null,function*(){return yield this.post("publish",{})})}preview(){return i(this,null,function*(){return yield this.post("preview",{})})}setMap(e){return i(this,null,function*(){return yield this.post("map",{base64:e})})}setImage(e,t){return i(this,null,function*(){this.changesMade=!0;let n=yield fetch(this.url("images"),{method:"POST",headers:{"Content-Type":"text/plain","Festival-Id":this.festivalId?this.festivalId.toString():"","Image-Id":t.toString(),Authorization:this.bearer()},body:e}),r=yield n.text();if(n.status!==200)throw this.errorStream.set({status:n.status,text:"",url:this.url("images")}),new Error(r);return r})}getMap(){return i(this,null,function*(){return(yield this.get("map",{cached:!1})).data})}addCamp(e,t){return i(this,null,function*(){return this.changesMade=!0,yield this.post(t?"camps?import=true":"camps",e)})}addArt(e){return i(this,null,function*(){return this.changesMade=!0,yield this.post("art",e)})}inviteCamp(e){return i(this,null,function*(){return yield this.post("camps/invite",e)})}inviteArt(e){return i(this,null,function*(){return yield this.post("art/invite",e)})}deleteCamp(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("camps",e)})}deleteArt(e){return i(this,null,function*(){return this.changesMade=!0,yield this.delete("art",e)})}handleNewItem(e,t){return e&&e.id&&!t.id&&(t.id=e.id,t.revision_id=1),e}clearToken(){this.store.set("token",void 0),this.store.clear()}getAccessInfo(e){let t=I(this.store.get("token"));return t.hasAdmin=!!(e&&t.festivals.includes(e)),t.hasCamps=t.hasAdmin||t.camps.length>0,t.hasFestivals=t.hasAdmin||t.festivals.length>0,t.hasMusic=t.hasAdmin||t.hasCamps||t.music.length>0,t.hasArt=t.hasAdmin||t.art.length>0,t.isEventRegistrationOpen=!1,t.hasEvents=t.hasAdmin,t.events&&t.events.length>0&&(t.hasEvents=!0),t.approver=["damiantarnawsky@gmail.com","damian@dust.events"].includes(t.email),t}signedIn(){let e=this.store.get("token");if(e&&e.length>0){let t=this.parseJwt(e);if(t.email)return this.user.set(t.email),!0}return!1}setRedirection(e){this.store.set("redirectionUrl",e)}setKey(){return i(this,null,function*(){let e=sessionStorage.getItem("key");e&&(yield this.post("one-time-key",{key:e}),sessionStorage.removeItem("key"))})}getRedirectionUrl(){let e=this.store.get("redirectionUrl");return new URLSearchParams(window.location.search).get("redirect"),e}parseJwt(e){let n=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),r=decodeURIComponent(window.atob(n).split("").map(function(a){return"%"+("00"+a.charCodeAt(0).toString(16)).slice(-2)}).join(""));return JSON.parse(r)}signOut(){this.store.set("token",void 0),this.store.clear()}bearer(){let e=this.store.get("token");return e?`bearer ${e}`:""}post(e,t){return i(this,null,function*(){return this.handleNewItem(yield this.do("POST",e,t),t)})}delete(e,t){return i(this,null,function*(){return this.do("DELETE",e,t)})}apiResponse(e,t){return i(this,null,function*(){this.lastRoleResponse=e.headers.get("Role");let n=e.headers.get("NewToken");return n&&n!==""&&(console.log("Token was refreshed"),this.store.set("token",n)),{message:t?"":yield e.text(),id:w(e.headers.get("Id")),role:e.headers.get("Role"),data:t?yield e.json():void 0}})}do(e,t,n,r){return i(this,null,function*(){let a=!1,d=e=="GET"&&!r;try{let o=yield fetch(this.url(t),{method:e,headers:{"Content-Type":"application/json","Festival-Id":this.festivalId?this.festivalId.toString():"",Authorization:this.bearer()},body:JSON.stringify(n)});if(o.status!=200){a=!0;let b=o.headers.get("Message");this.handleError(e,t,b,o.status);let x=yield o.text();throw new Error(x)}return this.apiResponse(o,d)}catch(o){throw a||this.handleError(e,t,`${o}`),new Error("API Failure")}})}handleError(e,t,n,r){if(`${n}`.startsWith("Festival-Id was not set")&&(r=2,t="all",n="You need to select an event."),console.error(`[error][app] "${n}"`),`${n}`=="code is invalid")throw new Error("code is invalid");this.errorStream.set({status:r||500,text:`${n}`,url:r!=2?this.url(t):t}),this.isLocal()&&console.error(`${e} ${this.url(t)} failed. Did you start up the cloudflare worker?`)}clearCache(){this.cache={}}get(e,t){return i(this,null,function*(){if(!t||!t.cached)return yield this.do("GET",e,void 0,t==null?void 0:t.asText);if(!this.cache[e]){let n=yield this.do("GET",e);return this.cache[e]=JSON.parse(JSON.stringify(n.data)),n}return{message:"",data:this.cache[e]}})}};m.\u0275fac=function(t){return new(t||m)(y(f))},m.\u0275prov=h({token:m,factory:m.\u0275fac,providedIn:"root"});var R=m;export{$ as a,C as b,D as c,E as d,O as e,L as f,U as g,_ as h,N as i,w as j,W as k,Z as l,B as m,j as n,J as o,z as p,V as q,G as r,Y as s,H as t,K as u,q as v,Q as w,f as x,R as y};
