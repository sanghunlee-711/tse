var w=Object.defineProperty;var N=(c,t,e)=>t in c?w(c,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):c[t]=e;var a=(c,t,e)=>N(c,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=e(n);fetch(n.href,r)}})();const v=1;class i{constructor(t,e,s=[],n=0){a(this,"type");a(this,"attrs");a(this,"content");a(this,"startOffset");a(this,"endOffset");this.type=t,this.attrs=e,this.content=s,this.startOffset=n,this.endOffset=this.calculateEndOffset()}static isTSENode(t){return t instanceof i&&typeof t.type=="string"&&Array.isArray(t.content)}toDOM(){const t=this.content.map(e=>{if(i.isTSENode(e)){const s=e.toDOM();return s.length>0?s:null}return typeof e=="string"?e:null}).filter(e=>e!==null);return this.type==="paragraph"?["p",this.attrs,...t]:this.type==="heading"?["h"+this.attrs.level,this.attrs,...t]:["div",this.attrs,...t]}calculateEndOffset(){if(typeof this.content=="string")return this.startOffset+this.content.length;if(Array.isArray(this.content)){let t=this.startOffset;return this.content.forEach(e=>{e instanceof i?t=Math.max(t,e.calculateEndOffset()):typeof e=="string"&&(t+=e.length)}),t}return this.startOffset}recalculateOffsets(){let t=this.startOffset;const e=s=>{s.startOffset=t,typeof s.content=="string"?s.endOffset=s.startOffset+s.content.length:Array.isArray(s.content)&&(s.endOffset=s.startOffset,s.content.forEach(n=>{n instanceof i?(e(n),s.endOffset=n.endOffset):typeof n=="string"&&(s.endOffset+=n.length)})),t=s.endOffset+v};e(this)}toJSON(){return{type:this.type,attrs:this.attrs,content:this.content.map(t=>t instanceof i?t.toJSON():t)}}update(t,e=this.content){return new i(this.type,t||this.attrs,e)}diff(t){const e=[];return this.type!==t.type?(e.push({node:t,changeType:"type"}),e):(Object.entries(this.attrs).some(([n,r])=>t.attrs[n]!==r)&&e.push({node:t,changeType:"attributes"}),this.content.length!==t.content.length?e.push({node:t,changeType:"content"}):this.content.forEach((n,r)=>{const o=t.content[r];if(typeof n=="string"&&typeof o=="string")n!==o&&e.push({node:t,changeType:"content"});else if(i.isTSENode(n)&&i.isTSENode(o)){const f=n.diff(o);e.push(...f)}else n!==o&&e.push({node:t,changeType:"content"})}),e)}getNodeLength(){return typeof this=="string"?this.length:this instanceof i?this.content.reduce((t,e)=>typeof e=="string"?t+e.length:e instanceof i?t+e.getNodeLength():t,0):0}}class d{constructor(t){a(this,"schema");a(this,"steps",[]);this.schema=t}addNode(t,e,s=[]){const n=this.schema.createNode(t,e,s);return this.steps.push(r=>{const o=[...r.content,n];return new i(r.type,r.attrs,o)}),this}updateNodeAttrs(t,e){return this.steps.push(s=>{const n=s.content.map((r,o)=>o===t&&r instanceof i?new i(r.type,{...e},r.content,r.startOffset):r);return new i(s.type,s.attrs,n)}),this}updateNodeContents(t,e){return this.steps.push(s=>{const n=s.content.map((r,o)=>o===t&&r instanceof i?new i(r.type,r.attrs,e,r.startOffset):r);return new i(s.type,s.attrs,n)}),this}}class C{constructor(t){a(this,"node");a(this,"dom");a(this,"selected");this.node=t,this.dom=this.createDOM(),this.selected=!1,this.addEventListeners()}createDOM(){let t;return this.node.type==="paragraph"?t=document.createElement("p"):this.node.type==="heading"?t=document.createElement(`h${this.node.attrs.level||1}`):t=document.createElement("div"),this.updateAttributes(t),this.updateContent(t),t}updateAttributes(t){this.node.attrs&&Object.entries(this.node.attrs).forEach(([e,s])=>{s?t.setAttribute(e,s):t.removeAttribute(e)})}updateContent(t){t.textContent=this.node.content.join("")}update(t){if(t.type!==this.node.type)return!1;this.node=t,this.updateAttributes(this.dom);const e=t.content.join("");return this.dom.textContent!==e&&this.updateContent(this.dom),!0}selectNode(){this.selected=!0,this.dom.classList.add("selected-node"),this.dom.style.outline="2px solid blue"}deselectNode(){this.selected=!1,this.dom.classList.remove("selected-node"),this.dom.style.outline=""}onClick(t){this.selected?this.deselectNode():this.selectNode()}addEventListeners(){this.dom.addEventListener("click",this.onClick.bind(this))}removeEventListeners(){this.dom.removeEventListener("click",this.onClick.bind(this))}destroy(){this.removeEventListeners(),this.dom.remove()}ignoreMutation(t){return t.type!=="characterData"}addClass(t){this.dom.classList.add(t)}removeClass(t){this.dom.classList.remove(t)}}const L=1,b="tse";function l(c,t){var r;const e=document.getElementById(b);let s=c,n=t;for(;s&&s.previousSibling;){s=s.previousSibling;const o=((r=s.textContent)==null?void 0:r.length)||0;n+=o+(o>0?L:0)}return s!=null&&s.parentNode&&s.parentNode!==e?n+l(s.parentNode,0):n}class E{constructor(t){a(this,"rootNode");a(this,"startOffset",0);a(this,"endOffset",0);a(this,"matchedNode",null);this.rootNode=t}updateSelection(){var r,o,f,h,p,m,O;const t=window.getSelection();if(!(t!=null&&t.rangeCount))return;const e=t.getRangeAt(0);this.startOffset=l(e.startContainer,e.startOffset),this.endOffset=l(e.endContainer,e.endOffset),this.matchedNode=this.findNodeByOffset(this.rootNode,this.startOffset);const s=document.getElementById("output"),n=typeof((r=this.matchedNode)==null?void 0:r.content)=="string"?this.matchedNode.content:(f=(o=this.matchedNode)==null?void 0:o.content)==null?void 0:f.join("");this.startOffset===this.endOffset?s&&(s.innerText=`커서 위치: ${this.startOffset}, 노드 내용: "${n}", 노드 범위: "${(h=this.matchedNode)==null?void 0:h.startOffset} ~ ${(p=this.matchedNode)==null?void 0:p.endOffset}"`):s&&(s.textContent=`선택 범위: ${this.startOffset} ~ ${this.endOffset}, 노드 내용: "${n}", 노드 범위: "${(m=this.matchedNode)==null?void 0:m.startOffset} ~ ${(O=this.matchedNode)==null?void 0:O.endOffset}"`)}findNodeByOffset(t,e){if(typeof t=="string")return null;if(e>=t.startOffset&&e<=t.endOffset){if(typeof t.content=="string")return t;if(Array.isArray(t.content))for(const s of t.content){const n=this.findNodeByOffset(s,e);if(n)return n}return t}return null}}class T{constructor(t,e){a(this,"state");a(this,"rootElement");a(this,"selection");this.rootElement=t,this.state=e,this.selection=new E(this.state.doc),this.render(),this.addEventListeners()}dispatch(t){const e=this.state.apply(t);this.state=e,this.selection.rootNode=this.state.doc,this.selection.updateSelection(),this.render()}render(){this.rootElement.innerHTML="",this.rootElement.setAttribute("contentEditable","true"),this.state.doc.content.forEach(t=>{if(t instanceof i){const e=new C(t);this.rootElement.appendChild(e.dom)}else if(typeof t=="string"){const e=document.createTextNode(t);this.rootElement.appendChild(e)}})}addEventListeners(){this.rootElement.addEventListener("input",t=>{this.handleInput(t)}),this.rootElement.addEventListener("mouseup",()=>this.selection.updateSelection()),this.rootElement.addEventListener("keyup",()=>this.selection.updateSelection())}handleInput(t){if(t.inputType==="insertText"){const e=t.data||"",s=this.createInsertTransaction(e);this.dispatch(s)}else if(t.inputType==="deleteContentBackward"){const e=this.createDeleteTransaction();this.dispatch(e)}else if(t.inputType==="Enter"){const e=this.createEnterTransaction();this.dispatch(e)}}createInsertTransaction(t){const{startOffset:e}=this.selection,s=this.state.resolvePosition(e);if(!s)throw new Error("Failed to resolve position for insertText.");const{node:n,localOffset:r}=s,o=new d(this.state.schema);return n.content.length>0&&n.content.forEach(f=>{if(typeof f=="string"){const h=f.slice(0,r)+t+f.slice(r);o.updateNodeContents(this.state.doc.content.indexOf(n),[h])}}),o}createDeleteTransaction(){const{startOffset:t}=this.selection,e=this.state.resolvePosition(t);if(!e)throw new Error("Failed to resolve position for deleteContentBackward.");const{node:s,localOffset:n}=e,r=new d(this.state.schema);return s.content.length>0&&s.content.forEach(o=>{if(typeof o=="string"){const f=o.slice(0,n-1)+o.slice(n);r.updateNodeContents(this.state.doc.content.indexOf(s),[f])}}),r}createEnterTransaction(){return new d(this.state.schema)}}class u{constructor(t,e){a(this,"schema");a(this,"doc");a(this,"selection");this.schema=t.schema,this.doc=t.doc||this.schema.createNode("doc",{},[]),this.selection=e}apply(t){let e=this.doc;return t.steps.forEach(s=>{e=s(e)}),e.recalculateOffsets(),new u({schema:this.schema,doc:e},this.selection)}resolvePosition(t){let e=0;const s=r=>{for(const o of r.content)if(typeof o=="string"){const f=o.length;if(e+f>=t)return{node:r,localOffset:t-e};e+=f}else if(o instanceof i){const f=s(o);if(f)return f}return null},n=s(this.doc);if(!n)throw new Error("Offset out of bounds");return n}toJSON(){return{schema:this.schema.spec,doc:this.doc.toJSON(),selection:this.selection}}}class A{constructor(t){a(this,"spec");a(this,"nodes");this.spec=t,this.nodes=this.compileNodes(t.nodes)}compileNodes(t){const e={};for(const[s,n]of Object.entries(t))e[s]=n;return e}createNode(t,e,s=[]){if(!this.nodes[t])throw new Error(`Undefined node type: ${t}`);return new i(t,e,s)}nodeFromJSON(t){const{type:e,attrs:s,content:n}=t;return new i(e,s,Array.isArray(n)?n.map(r=>typeof r=="object"&&r!==null?this.nodeFromJSON(r):r):n)}}const x={nodes:{doc:{content:"block+"},paragraph:{group:"block"},heading:{group:"block",attrs:{level:1}}}},y=new A(x),g=document.getElementById("tse");if(g){const c=new i("doc",{id:"test"},[new i("paragraph",{},["Hello, World!"],0),new i("paragraph",{},["ProseMirror-inspired editor"],13)]),t=new E(c),e=new u({schema:y,doc:c},t),s=new T(g,e),n=new d(y);n.addNode("paragraph",{},["This is a new paragraph added with Transaction."]),n.addNode("paragraph",{},["One More Line With Transaction!@!"]),s.dispatch(n);const r=document.getElementById("console-button");r==null||r.addEventListener("click",()=>{console.info(s.state.toJSON())})}
