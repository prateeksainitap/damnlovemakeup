/* DamnLove Journal behaviour: reading progress, contents list, reveals, share. */
(function(){
  "use strict";
  var rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bar = document.querySelector(".progress i"), mBar = document.getElementById("mBar");
  var art = document.querySelector(".prose");

  /* reading progress + mobile booking bar */
  var queued = false;
  function onScroll(){
    queued = false;
    if (bar && art){
      var r = art.getBoundingClientRect(), h = r.height - innerHeight * .4;
      var p = Math.min(1, Math.max(0, (-r.top + innerHeight * .25) / Math.max(1, h)));
      bar.style.transform = "scaleX(" + p + ")";
    }
    if (mBar) mBar.classList.toggle("show", scrollY > innerHeight * .7);
  }
  addEventListener("scroll", function(){ if (!queued){ queued = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();

  /* contents list from the h2s, with active-section highlight */
  var toc = document.getElementById("tocList");
  if (art && toc){
    var hs = art.querySelectorAll("h2"), links = [];
    hs.forEach(function(h, i){
      var id = "s" + (i + 1); h.id = id;
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + id; a.textContent = h.textContent.replace(/^\s*\d+\.\s*/, "");
      li.appendChild(a); toc.appendChild(li); links.push(a);
    });
    if ("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting){
            links.forEach(function(a){ a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
          }
        });
      }, {rootMargin:"-20% 0px -70% 0px"});
      hs.forEach(function(h){ io.observe(h); });
    }
  }

  /* reveals (visible by default; only below-the-fold items are hidden first) */
  if (!rm && "IntersectionObserver" in window){
    var rio = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.remove("pre"); rio.unobserve(e.target); } });
    }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
    document.querySelectorAll(".pull,.mid,.prose figure,.author,.card,.feat").forEach(function(el){
      if (el.getBoundingClientRect().top > innerHeight * .95){ el.classList.add("rv","pre"); rio.observe(el); }
    });
  }

  /* share */
  var cp = document.getElementById("copyLink");
  if (cp) cp.addEventListener("click", function(){
    var done = function(){ cp.querySelector("span").textContent = "Copied"; setTimeout(function(){ cp.querySelector("span").textContent = "Copy link"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done);
  });
  var wa = document.getElementById("shareWa");
  if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(document.title + " " + location.href);
})();
