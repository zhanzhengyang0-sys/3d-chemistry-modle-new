/* ===== 首页主题层 =====
   1) 星空背景（canvas 星星 + 偶尔流星）与「星空 / 纯白」切换，偏好存 localStorage
   2) 右下角「联系我」按钮 + 微信/小红书二维码弹窗（图片在 assets/ 下，离线可用）
   —— 全部动态生成 DOM，所以 index.html 只需要引入本文件
*/
(function () {
  "use strict";

  var html = document.documentElement;
  var THEME_KEY = "chem3d-theme";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 星空画布 ---------- */
  var canvas = document.createElement("canvas");
  canvas.id = "starlayer";
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var stars = [], meteors = [], W = 0, H = 0, DPR = 1;
  var nextMeteorAt = 0, running = false, rafId = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
  }

  function buildStars() {
    var n = Math.min(340, Math.max(140, Math.round((W * H) / 5600)));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.35,
        a: 0.28 + Math.random() * 0.72,
        sp: 0.35 + Math.random() * 1.5,
        ph: Math.random() * Math.PI * 2,
        tint: Math.random() < 0.22 ? "196,190,255" : (Math.random() < 0.12 ? "170,215,255" : "255,255,255")
      });
    }
  }

  function spawnMeteor() {
    var fromLeft = Math.random() < 0.62;
    var ang = (28 + Math.random() * 14) * Math.PI / 180;
    var speed = 5.2 + Math.random() * 3.4;
    meteors.push({
      x: fromLeft ? -60 + Math.random() * W * 0.85 : W * 0.55 + Math.random() * W * 0.4,
      y: H * 0.26 + Math.random() * H * 0.38,
      vx: Math.cos(ang) * speed * (fromLeft ? 1 : -1),
      vy: Math.sin(ang) * speed,
      len: 130 + Math.random() * 130,
      age: 0,
      life: 78 + Math.random() * 34
    });
    nextMeteorAt = performance.now() + 4200 + Math.random() * 6000;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = reduce ? 1 : (0.58 + 0.42 * Math.sin(t * 0.001 * s.sp + s.ph));
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + s.tint + "," + (s.a * tw).toFixed(3) + ")";
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fill();
      if (s.r > 1.25) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + s.tint + "," + (s.a * tw * 0.12).toFixed(3) + ")";
        ctx.arc(s.x, s.y, s.r * 4.2, 0, 6.2832);
        ctx.fill();
      }
    }

    if (!reduce && t > nextMeteorAt) spawnMeteor();
    for (var m = meteors.length - 1; m >= 0; m--) {
      var o = meteors[m];
      o.x += o.vx; o.y += o.vy; o.age++;
      var p = o.age / o.life;
      var fade = p < 0.15 ? p / 0.15 : (1 - (p - 0.15) / 0.85);
      if (fade < 0) fade = 0;
      var sp2 = Math.hypot(o.vx, o.vy) || 1;
      var tx = o.x - o.vx * (o.len / sp2);
      var ty = o.y - o.vy * (o.len / sp2);
      var g = ctx.createLinearGradient(o.x, o.y, tx, ty);
      g.addColorStop(0, "rgba(255,255,255," + fade.toFixed(3) + ")");
      g.addColorStop(0.35, "rgba(196,190,255," + (0.5 * fade).toFixed(3) + ")");
      g.addColorStop(1, "rgba(140,130,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255," + (0.9 * fade).toFixed(3) + ")";
      ctx.arc(o.x, o.y, 2.1, 0, 6.2832);
      ctx.fill();
      if (o.age > o.life || o.x < -260 || o.x > W + 260 || o.y > H + 160) meteors.splice(m, 1);
    }

    if (running) rafId = requestAnimationFrame(draw);
  }

  function startAnim() {
    if (running) return;
    running = true;
    nextMeteorAt = performance.now() + 2600;
    rafId = requestAnimationFrame(draw);
  }
  function stopAnim() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  resize();
  window.addEventListener("resize", function () {
    clearTimeout(window.__rsz);
    window.__rsz = setTimeout(resize, 160);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopAnim();
    else if (html.classList.contains("cosmos")) startAnim();
  });

  /* ---------- 2. 主题切换按钮 ---------- */
  var ICON_SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
    '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.7v2.1M12 19.2v2.1M2.7 12h2.1M19.2 12h2.1' +
    'M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5"/></svg>';
  var ICON_MOON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20.4 14.3A8.6 8.6 0 1 1 9.7 3.6a7 7 0 0 0 10.7 10.7z"/>' +
    '<path d="M17.6 3.4l.62 1.5 1.5.62-1.5.62-.62 1.5-.62-1.5-1.5-.62 1.5-.62z"/></svg>';

  var toggle = document.createElement("button");
  toggle.id = "themeToggle";
  toggle.type = "button";
  document.body.appendChild(toggle);

  function paintToggle(isCosmos) {
    if (isCosmos) {
      toggle.innerHTML = ICON_SUN + '<span class="lbl">纯白模式</span>';
      toggle.title = "切换到纯白极简模式";
      toggle.setAttribute("aria-label", "切换到纯白极简模式");
    } else {
      toggle.innerHTML = ICON_MOON + '<span class="lbl">星空模式</span>';
      toggle.title = "切换到星空流星模式";
      toggle.setAttribute("aria-label", "切换到星空流星模式");
    }
  }

  function applyTheme(t, persist) {
    var isCosmos = t === "cosmos";
    html.classList.toggle("cosmos", isCosmos);
    paintToggle(isCosmos);
    if (isCosmos) startAnim(); else stopAnim();
    if (persist) { try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
  }

  toggle.addEventListener("click", function () {
    applyTheme(html.classList.contains("cosmos") ? "light" : "cosmos", true);
  });

  /* ---------- 3. 联系我：按钮 + 弹窗 ---------- */
  var fab = document.createElement("button");
  fab.id = "contactFab";
  fab.type = "button";
  fab.setAttribute("aria-label", "联系我：查看微信和小红书二维码");
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 9.6 9.6 0 0 1-2.9-.4L4 21l1.4-4.1A8.2 8.2 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>' +
    "</svg><span>联系我</span>";
  document.body.appendChild(fab);

  var modal = document.createElement("div");
  modal.id = "contactModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "在星海之外找到我");
  modal.innerHTML =
    '<div class="contact-card">' +
      '<button id="contactClose" type="button" aria-label="关闭二维码弹窗">&times;</button>' +
      '<div class="contact-eyebrow"><i></i> FIND ME ONLINE</div>' +
      '<div class="contact-head">' +
        "<h3>在星海之外找到我</h3>" +
        "<p>如果你也对课件，模型，备课问题感兴趣，欢迎扫码与我交流</p>" +
      "</div>" +
      '<div class="qr-grid">' +
        '<article class="qr-box qr-box--wechat">' +
          '<header class="qr-head">' +
            '<span class="qr-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.2 12.8c0-2.9-2.9-5.2-6.4-5.2s-6.4 2.3-6.4 5.2 2.9 5.2 6.4 5.2c.7 0 1.3-.1 1.9-.2l2.1 1.1-.5-1.9c1.7-.9 2.9-2.4 2.9-4.2Z"></path><path d="M10.8 14.7c-.9-.6-2.5-1.1-3.9-1.1-.5 0-1 0-1.5.1L3.6 13l.4-1.5C2.8 10.7 2.2 9.6 2.2 8.4c0-2.3 2.3-4.2 5.2-4.2 2.2 0 4.1 1.1 4.8 2.7"></path></svg></span>' +
            '<span class="qr-name"><b>微信</b><span>六元环 · 广东惠州</span></span>' +
            '<em>WECHAT</em>' +
          "</header>" +
          '<div class="qr-image"><img src="assets/qr_wechat.jpg" alt="六元环的微信二维码"></div>' +
          '<div class="qr-foot"><span>打开微信「扫一扫」，添加我为好友</span></div>' +
        "</article>" +
        '<article class="qr-box qr-box--xhs">' +
          '<header class="qr-head">' +
            '<span class="qr-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4.5" width="16" height="15" rx="3"></rect><path d="M8.5 9h7M12 9v6M8.5 15h7"></path></svg></span>' +
            '<span class="qr-name"><b>小红书</b><span>六元环prf</span></span>' +
            '<em>REDNOTE</em>' +
          "</header>" +
          '<div class="qr-image"><img src="assets/qr_xhs.jpg" alt="六元环prf的小红书二维码"></div>' +
          '<div class="qr-foot"><span>小红书号 <b>438053832</b></span><span>扫码在小红书找到我</span></div>' +
        "</article>" +
      "</div>" +
      '<div class="contact-foot"><span>二维码可截图保存，在对应 App 中从相册识别</span><span>LET\'S CONNECT</span></div>' +
    "</div>";
  document.body.appendChild(modal);

  var card = modal.querySelector(".contact-card");
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector("#contactClose").focus();
  }
  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  fab.addEventListener("click", openModal);
  modal.querySelector("#contactClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (!card.contains(e.target)) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* ---------- 4. 初始化主题 ---------- */
  var saved = "cosmos";
  try {
    var v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "cosmos") saved = v;
  } catch (e) {}
  applyTheme(saved, false);
})();
