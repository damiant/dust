import{a as g}from"./chunk-5CHPG7GP.js";import{A as a,B as p,F as r,Y as d,la as s,ma as c,pa as u,qa as f,xa as m,ya as y,za as b}from"./chunk-JQETABDO.js";import{h as l}from"./chunk-LNJ3S2LQ.js";var w=["fileUpload"],n=class n{constructor(){this.upload=new r}click(){this.fileUpload.nativeElement.click()}onFileSelected(o){return l(this,null,function*(){let e=o.target.files[0];if(!e)return;let t=yield g(e,{quality:85,width:400}),i=URL.createObjectURL(t);this.upload.emit({blob:t,url:i})})}};n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=d({type:n,selectors:[["app-upload"]],viewQuery:function(e,t){if(e&1&&m(w,5),e&2){let i;y(i=b())&&(t.fileUpload=i.first)}},outputs:{upload:"upload"},decls:2,vars:0,consts:[["fileUpload",""],["type","file",1,"is-hidden",3,"change"]],template:function(e,t){if(e&1){let i=u();s(0,"input",1,0),f("change",function(h){return a(i),p(t.onFileSelected(h))}),c()}},styles:[".is-hidden[_ngcontent-%COMP%]{display:none}"]});var U=n;export{U as a};
