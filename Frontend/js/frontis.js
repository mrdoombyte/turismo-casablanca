// Pestañas de la Ruta del Vino: datos de cada viña y renderizado del panel.
var W=[
{t:"Vinos premium",n:"Viña Indomita",d:"Bodega de arquitectura monumental con vista panorámica al valle. Ofrece catas guiadas, maridaje y cicloturismo entre viñedos.",v:["Sauvignon Blanc","Chardonnay","Pinot Noir"],h:"Lun–Dom 10:00–18:00",p:"+56 32 2754 755"},
{t:"Boutique",n:"Viña William Cole",d:"Viña boutique de producción acotada, con catas íntimas entre los viñedos del valle.",v:["Sauvignon Blanc","Pinot Noir"],h:"Mar–Sáb 11:00–17:00",p:"+56 32 2741 622"},
{t:"Vinos",n:"Viña Casablanca",d:"Viña emblemática del valle, con recorridos por los viñedos y degustación de varietales de clima frío.",v:["Sauvignon Blanc","Chardonnay"],h:"Sólo con reserva previa",p:"+56 32 2742 003"},
{t:"Familiar",n:"Kingston Family Vineyards",d:"Viña de origen chileno-estadounidense. Sus catas son legendarias, con vista a la cordillera de la costa.",v:["Tobiano","Bayo Oscuro","Alazan"],h:"Sólo con reserva previa",p:"+56 32 2742 003"}];
var tabs=document.getElementById("tabs"),panel=document.getElementById("panel");
function show(i){
  var w=W[i];
  panel.innerHTML='<h3></h3><p></p><div class="meta"></div><a class="btn w" href="#info">Reservar visita</a>';
  panel.querySelector("h3").textContent=w.n;
  panel.querySelector("p").textContent=w.d;
  var m=panel.querySelector(".meta");
  m.innerHTML=w.v.map(function(x){return '<span class="chip"></span>'}).join("")+'<p></p><p></p>';
  var c=m.querySelectorAll(".chip");w.v.forEach(function(x,k){c[k].textContent=x});
  var ps=m.querySelectorAll("p");ps[0].textContent="🕒 "+w.h;ps[1].textContent="📞 "+w.p;
  Array.prototype.forEach.call(tabs.children,function(b,k){b.classList.toggle("on",k===i)});
}
W.forEach(function(w,i){
  var b=document.createElement("button");b.className="tab";
  b.innerHTML='<span></span><b></b>';b.children[0].textContent=w.t;b.children[1].textContent=w.n;
  b.onclick=function(){show(i)};tabs.appendChild(b);
});
show(0);

// Flechas del carrusel de atracciones: avanzan una tarjeta (ancho + separación de 22px).
var track=document.getElementById("track");
Array.prototype.forEach.call(document.querySelectorAll(".car-nav button"),function(b){
  b.onclick=function(){track.scrollBy({left:b.dataset.dir*(track.firstElementChild.offsetWidth+22),behavior:"smooth"})};
});
