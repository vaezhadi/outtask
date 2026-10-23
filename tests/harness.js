// Minimal fake-DOM harness for running app.js logic suites under node.
const fs=require('fs'),vm=require('vm'),path=require('path');
const APP=path.join(__dirname,'..','app.js');

const noop=()=>{};
function makeCanvasCtx(){
  return new Proxy({measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),setLineDash:noop,getImageData:()=>({data:[]}),clearRect:noop,canvas:{width:900,height:900}},
    {get(t,p){if(p in t)return t[p];return noop;},set(){return true;}});
}
function makeEl(tag){
  const style=new Proxy({},{get(t,p){if(p in t)return t[p];if(p==='setProperty'||p==='getPropertyValue'||p==='removeProperty')return noop;return undefined;},set(){return true;}});
  const el={
    tagName:(tag||'div').toUpperCase(),style,dataset:{},children:[],childNodes:[],
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false,replace:noop},
    addEventListener:noop,removeEventListener:noop,appendChild(c){this.children.push(c);return c;},
    append(c){this.children.push(c);},prepend:noop,removeChild:noop,remove:noop,replaceWith:noop,
    insertAdjacentHTML:noop,insertAdjacentElement:noop,before:noop,after:noop,replaceChildren:noop,
    insertBefore(c){this.children.push(c);return c;},setAttribute:noop,getAttribute:()=>null,
    removeAttribute:noop,hasAttribute:()=>false,focus:noop,blur:noop,click:noop,scrollTo:noop,
    querySelector:()=>makeEl(),querySelectorAll:()=>[],closest:()=>null,contains:()=>false,
    getBoundingClientRect:()=>({left:0,top:0,right:0,bottom:0,width:0,height:0}),
    dispatchEvent:()=>true,getContext:makeCanvasCtx,innerHTML:'',textContent:'',value:'',
    checked:false,disabled:false,hidden:false,selectedIndex:0,options:[],files:[],
    parentElement:null,parentNode:null,nextSibling:null,firstChild:null,lastChild:null,
  };
  return el;
}
const store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},clear:()=>{for(const k in store)delete store[k];}};
global.sessionStorage=global.localStorage;
const doc=makeEl('document');
doc.body=makeEl('body');doc.documentElement=makeEl('html');doc.head=makeEl('head');
doc.getElementById=()=>makeEl();
doc.querySelector=()=>makeEl();
doc.querySelectorAll=()=>[];
doc.getElementsByClassName=()=>[];
doc.getElementsByTagName=()=>[];
doc.createElement=t=>t==='canvas'?Object.assign(makeEl('canvas'),{width:900,height:900}):makeEl(t);
doc.createTextNode=t=>({textContent:t,nodeType:3});
doc.addEventListener=noop;doc.removeEventListener=noop;
doc.execCommand=noop;
global.document=doc;
global.window=global;
window.addEventListener=noop;window.removeEventListener=noop;
window.scrollTo=noop;
window.Audio=class{play(){return Promise.resolve();}pause(){}load(){}};
global.Audio=window.Audio;
global.requestAnimationFrame=cb=>setTimeout(cb,0);
global.cancelAnimationFrame=id=>clearTimeout(id);
global.matchMedia=()=>({matches:false,addListener:noop,removeListener:noop,addEventListener:noop});;
window.matchMedia=global.matchMedia;
global.location={href:'https://localhost/outtask/',reload:noop,pathname:'/outtask/'};
window.location=global.location;
global.navigator={userAgent:'node',language:'fa',clipboard:{writeText:()=>Promise.resolve()},languages:['fa']};
global.alert=noop;global.confirm=()=>true;global.prompt=()=>null;
global.btoa=s=>Buffer.from(s,'binary').toString('base64');
global.atob=s=>Buffer.from(s,'base64').toString('binary');
global.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
global.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
global.URL.createObjectURL=()=>'blob:x';global.URL.revokeObjectURL=noop;
global.Blob=global.Blob||class{constructor(parts){this.parts=parts;}};

const code=fs.readFileSync(APP,'utf8');
vm.runInThisContext(code,{filename:path.basename(APP)});
module.exports={APP};
