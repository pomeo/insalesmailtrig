function SHA256(r){function n(r,n){var t=(65535&r)+(65535&n),e=(r>>16)+(n>>16)+(t>>16);return e<<16|65535&t}function t(r,n){return r>>>n|r<<32-n}function e(r,n){return r>>>n}function o(r,n,t){return r&n^~r&t}function a(r,n,t){return r&n^r&t^n&t}function u(r){return t(r,2)^t(r,13)^t(r,22)}function i(r){return t(r,6)^t(r,11)^t(r,25)}function c(r){return t(r,7)^t(r,18)^e(r,3)}function f(r){return t(r,17)^t(r,19)^e(r,10)}function s(r,t){var e,s,C,I,S,d,h,l,g,A,m,v,w=new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298),p=new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225),_=new Array(64);r[t>>5]|=128<<24-t%32,r[(t+64>>9<<4)+15]=t;for(var g=0;g<r.length;g+=16){e=p[0],s=p[1],C=p[2],I=p[3],S=p[4],d=p[5],h=p[6],l=p[7];for(var A=0;64>A;A++)_[A]=16>A?r[A+g]:n(n(n(f(_[A-2]),_[A-7]),c(_[A-15])),_[A-16]),m=n(n(n(n(l,i(S)),o(S,d,h)),w[A]),_[A]),v=n(u(e),a(e,s,C)),l=h,h=d,d=S,S=n(I,m),I=C,C=s,s=e,e=n(m,v);p[0]=n(e,p[0]),p[1]=n(s,p[1]),p[2]=n(C,p[2]),p[3]=n(I,p[3]),p[4]=n(S,p[4]),p[5]=n(d,p[5]),p[6]=n(h,p[6]),p[7]=n(l,p[7])}return p}function C(r){for(var n=Array(),t=(1<<d)-1,e=0;e<r.length*d;e+=d)n[e>>5]|=(r.charCodeAt(e/d)&t)<<24-e%32;return n}function I(r){r=r.replace(/\r\n/g,"\n");for(var n="",t=0;t<r.length;t++){var e=r.charCodeAt(t);128>e?n+=String.fromCharCode(e):e>127&&2048>e?(n+=String.fromCharCode(e>>6|192),n+=String.fromCharCode(63&e|128)):(n+=String.fromCharCode(e>>12|224),n+=String.fromCharCode(e>>6&63|128),n+=String.fromCharCode(63&e|128))}return n}function S(r){for(var n=h?"0123456789ABCDEF":"0123456789abcdef",t="",e=0;e<4*r.length;e++)t+=n.charAt(r[e>>2]>>8*(3-e%4)+4&15)+n.charAt(r[e>>2]>>8*(3-e%4)&15);return t}var d=8,h=0;return r=I(r),S(s(C(r),r.length*d))}document.addEventListener("DOMContentLoaded",function(){null==$.cookie("INSALES_MAILTRIG_CUSTOMER_ID")&&$.cookie("INSALES_MAILTRIG_CUSTOMER_ID",generateCusID(),{expires:7300,path:"/"}),null==$.cookie("INSALES_MAILTRIG_VISIT")&&$.post("http://"+window.mturl+"/visit/"+window.mtappid+"/"+window.mtusername+"/"+$.cookie("INSALES_MAILTRIG_CUSTOMER_ID"),function(r){"success"==r&&$.cookie("INSALES_MAILTRIG_VISIT",1,{expires:1,path:"/"})}),setInterval(doCheckCart,2e3)});var doCheckCart=function(){if("json"!=$.cookie("cart"))try{console.log(JSON.stringify($.parseJSON($.cookie("cart"))))}catch(r){return null}else $.ajax({url:"/cart_items.json",dateType:"json",success:function(r){console.log(r)}})},generateCusID=function(){return Date.now||(Date.now=function(){return(new Date).getTime()}),SHA256(window.mtappid+Date.now()+generatePass())},generatePass=function(){for(var r="0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ",n="",t=0;10>t;t++){var e=Math.floor(Math.random()*r.length);n+=r[e]}return n};