(function () {
  const CFG = window.YH_CONFIG || {};
  const WA = CFG.WHATSAPP || "201024173103";
  const CATS = [
    "بطاريات",
    "مفاتيح",
    "اسطوانات فرامل",
    "تيل فرامل",
    "تيل سحب",
    "سيور",
    "ورق دبرياج",
    "فلاتر",
    "زيوت",
    "آلة جر",
    "سفتي جير",
    "حماية الموتوسيكل",
    "أجزاء الماتور",
    "مرايات",
    "مسامير",
    "إشارات",
    "فوانيس",
    "كهرباء",
    "دوسات",
    "مقابض",
    "حامل موبايل",
    "إكسسوارات نيكل كروم",
  ];
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem("yh_favs") || "[]"); } catch (e) {}
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => en.target.classList.toggle("in", en.isIntersecting)), { threshold: 0.12 })
    : null;
  const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const sb = LIVE
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
    : null;
  const LOCAL_PASSWORD = "admin2323"; // يُستخدم في الوضع التجريبي فقط
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let prods = [],
    cur = "الكل",
    pendingDel = null,
    isAdmin = false,
    editId = null,
    imgs = []; // صور الفورم: { url?, blob?, prev }
  const MAX_IMGS = 8;
  const colorOf = (p, i) => (Array.isArray(p.colors) && p.colors[i]) || "";
  const imgsOf = (p) =>
    Array.isArray(p.images) && p.images.length
      ? p.images
      : p.image_url
        ? [p.image_url]
        : [];

  function toast(t) {
    const e = $("toast");
    e.textContent = t;
    e.style.display = "block";
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (e.style.display = "none"), 2800);
  }
  function waLink(p, idx) {
    const col = colorOf(p, idx || 0);
    return (
      "https://wa.me/" +
      WA +
      "?text=" +
      encodeURIComponent(
        "السلام عليكم، عايز أطلب من Yahia Honda:\n- " +
          p.name +
          " (" +
          p.category +
          ")" +
          (col ? " | اللون: " + col : "") +
          " | السعر: " +
          p.price +
          " جنيه\nمن فضلكم أكدوا التوفر والسعر.",
      )
    );
  }

  /* ---------- data layer ---------- */
  async function load() {
    if (LIVE) {
      const { data, error } = await sb
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast("تعذر تحميل المنتجات");
        prods = [];
      } else prods = data || [];
    } else {
      try {
        prods = JSON.parse(localStorage.getItem("yh_products") || "[]");
      } catch (e) {
        prods = [];
      }
    }
    draw();
    if (isAdmin) rows();
  }
  function saveLocal() {
    try {
      localStorage.setItem("yh_products", JSON.stringify(prods));
    } catch (e) {
      toast("مساحة المتصفح امتلأت — صغّر الصور أو احذف منتجات");
    }
  }
  function shrink(f) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const k = Math.min(1, 1000 / Math.max(im.width, im.height)),
            c = document.createElement("canvas");
          c.width = Math.round(im.width * k);
          c.height = Math.round(im.height * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          c.toBlob((b) => res(b), "image/jpeg", 0.82);
        };
        im.onerror = () => res(f);
        im.src = r.result;
      };
      r.onerror = () => res(f);
      r.readAsDataURL(f);
    });
  }
  function blobToDataUrl(b) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(b);
    });
  }

  /* ---------- store ---------- */
  var draw = function () {
    $("chips").innerHTML = ["الكل", ...CATS]
      .map(
        (c) =>
          '<button type="button" class="chip ' +
          (c === cur ? "on" : "") +
          '" data-c="' +
          esc(c) +
          '">' +
          esc(c) +
          "</button>",
      )
      .join("");
    document.querySelectorAll("#chips .chip").forEach(
      (b) =>
        (b.onclick = () => {
          cur = b.dataset.c;
          draw();
        }),
    );
    const q = $("q").value.trim();
    const so = $("sort").value;
    const list = prods.filter(
      (p) =>
        (cur === "الكل" || p.category === cur) &&
        p.name.includes(q) &&
        (so !== "fav" || favs.includes(String(p.id))),
    );
    if (so === "low") list.sort((a, b) => a.price - b.price);
    if (so === "high") list.sort((a, b) => b.price - a.price);
    $("grid").innerHTML =
      list
        .map((p) => {
          const out = p.stock === 0 || p.stock === "0";
          const im = imgsOf(p);
          const media = im.length
            ? '<div class="car">' +
              im
                .map(
                  (u) => '<img loading="lazy" alt="' + esc(p.name) + '" src="' + esc(u) + '" />',
                )
                .join("") +
              "</div>" +
              (im.length > 1
                ? '<div class="nv nx" data-dir="1">‹</div><div class="nv pv" data-dir="-1">›</div><em class="ct">1/' +
                  im.length +
                  "</em>"
                : "")
            : "";
          return (
            '<article class="p" data-id="' + esc(p.id) + '"><div class="ph"><div class="fav ' +
            (favs.includes(String(p.id)) ? "on" : "") +
            '" data-fav="' + esc(p.id) + '">' + (favs.includes(String(p.id)) ? "♥" : "♡") + "</div>" +
            media +
            "<i>" +
            esc(p.category) +
            '</i></div><div class="b"><h3>' +
            esc(p.name) +
            "</h3>" +
            (p.description
              ? '<small style="color:var(--mut)">' +
                esc(p.description) +
                "</small>"
              : "") +
            (colorOf(p, 0)
              ? '<div class="clr">اللون: <b>' + esc(colorOf(p, 0)) + "</b></div>"
              : "") +
            '<div class="pr">' +
            esc(p.price) +
            " <small>جنيه</small></div>" +
            (out ? '<div class="out">غير متوفر حاليًا</div>' : "") +
            '<a class="orderbtn" href="' +
            waLink(p) +
            '" target="_blank" rel="noopener">اطلب على واتساب</a></div></article>'
          );
        })
        .join("") ||
      '<p class="note">' +
        (prods.length
          ? "مفيش منتجات في القسم ده لسه"
          : "لسه مفيش منتجات — هتتضاف قريب") +
        "</p>";
  }
  function reveal() {
    document.querySelectorAll("#grid .p").forEach((c, i) => {
      c.style.setProperty("--d", (i % 2) * 0.08 + "s");
      if (io) io.observe(c); else c.classList.add("in");
    });
  }
  const _draw = draw;
  draw = function () { _draw(); reveal(); };
  $("sort").onchange = () => draw();
  $("grid").addEventListener("click", (e) => {
    const f = e.target.closest(".fav");
    if (!f) return;
    const id = f.dataset.fav, on = !favs.includes(id);
    favs = on ? favs.concat(id) : favs.filter((x) => x !== id);
    try { localStorage.setItem("yh_favs", JSON.stringify(favs)); } catch (er) {}
    f.classList.toggle("on", on);
    f.textContent = on ? "♥" : "♡";
    if ($("sort").value === "fav") draw();
  });
  $("q").oninput = draw;
  $("grid").addEventListener("click", (e) => {
    const n = e.target.closest(".nv");
    if (!n) return;
    const car = n.parentElement.querySelector(".car");
    // الصفحة RTL: "التالي" = ناحية الشمال (قيمة سالبة)
    car.scrollBy({ left: -Number(n.dataset.dir) * car.clientWidth, behavior: "smooth" });
  });
  $("grid").addEventListener(
    "scroll",
    (e) => {
      const car = e.target;
      if (!car.classList || !car.classList.contains("car")) return;
      const n = car.children.length;
      const i = Math.min(n - 1, Math.round(Math.abs(car.scrollLeft) / car.clientWidth));
      const card = car.closest(".p");
      const p = prods.find((x) => String(x.id) === card.dataset.id);
      const ct = card.querySelector(".ct");
      if (ct) ct.textContent = i + 1 + "/" + n;
      if (!p) return;
      const cl = card.querySelector(".clr");
      const col = colorOf(p, i);
      if (cl) {
        cl.style.visibility = col ? "visible" : "hidden";
        cl.innerHTML = col ? "اللون: <b>" + esc(col) + "</b>" : "&nbsp;";
      }
      card.querySelector(".orderbtn").href = waLink(p, i);
    },
    true,
  );

  /* ---------- admin ---------- */
  function fillCats(selected) {
    const list = CATS.slice();
    if (selected && !list.includes(selected)) list.push(selected);
    $("c").innerHTML =
      '<option value="" disabled>اختر القسم...</option>' +
      list.map((c) => '<option value="' + esc(c) + '">' + esc(c) + "</option>").join("");
    $("c").value = selected || "";
  }
  function showAdmin() {
    isAdmin = true;
    $("store").style.display = "none";
    $("admin").classList.add("show");
    if (!editId) fillCats("");
    rows();
    scrollTo(0, 0);
    history.replaceState(null, "", "#admin");
  }
  function showStore() {
    $("admin").classList.remove("show");
    $("store").style.display = "block";
    history.replaceState(null, "", location.pathname);
    draw();
  }
  function rows() {
    $("cnt").textContent = prods.length;
    $("arows").innerHTML =
      prods
        .map((p) => {
          const im = imgsOf(p);
          return (
            '<div class="row"><div class="rt">' +
            (im.length
              ? '<img class="rimg" src="' + esc(im[0]) + '" alt="" />'
              : '<div class="rimg"></div>') +
            "<div>" +
            esc(p.name) +
            "<br><span>" +
            esc(p.category) +
            " · " +
            esc(p.price) +
            " جنيه" +
            (p.stock != null ? " · المخزون: " + esc(p.stock) : "") +
            (im.length > 1 ? " · " + im.length + " صور" : "") +
            '</span></div></div><div class="ra"><button type="button" class="btn ed" data-id="' +
            esc(p.id) +
            '">تعديل</button><button type="button" class="btn del" data-id="' +
            esc(p.id) +
            '" style="color:#f87171">' +
            (String(pendingDel) === String(p.id) ? "تأكيد الحذف؟" : "حذف") +
            "</button></div></div>"
          );
        })
        .join("") || '<p class="note">مفيش منتجات</p>';
    document.querySelectorAll("#arows .del").forEach((b) => (b.onclick = () => delProduct(b.dataset.id)));
    document.querySelectorAll("#arows .ed").forEach((b) => (b.onclick = () => startEdit(b.dataset.id)));
  }

  /* حذف صور من الـ storage (محاولة بدون ما توقف العملية لو فشلت) */
  async function dropFiles(urls) {
    if (!LIVE) return;
    const paths = urls
      .map((u) => (String(u).split("/product-images/")[1] || "").split("?")[0])
      .filter(Boolean);
    if (paths.length) {
      try {
        await sb.storage.from("product-images").remove(paths);
      } catch (e) {}
    }
  }
  async function delProduct(id) {
    if (String(pendingDel) !== String(id)) {
      pendingDel = id;
      rows();
      setTimeout(() => {
        if (String(pendingDel) === String(id)) {
          pendingDel = null;
          rows();
        }
      }, 4000);
      return;
    }
    pendingDel = null;
    const p = prods.find((x) => String(x.id) === String(id));
    if (LIVE) {
      const { error } = await sb.from("products").delete().eq("id", id);
      if (error) {
        toast("تعذر الحذف: " + error.message);
        rows();
        return;
      }
      if (p) await dropFiles(imgsOf(p));
    } else {
      prods = prods.filter((x) => String(x.id) !== String(id));
      saveLocal();
    }
    if (String(editId) === String(id)) resetForm();
    toast("تم حذف المنتج");
    await load();
  }

  /* ---------- صور الفورم ---------- */
  function drawThumbs() {
    $("thumbs").innerHTML = imgs
      .map(
        (m, i) =>
          '<div class="th"><img src="' +
          esc(m.prev) +
          '" alt="" />' +
          (i === 0 ? '<em>رئيسية</em>' : '<button type="button" class="mk" data-i="' + i + '" title="اجعلها الرئيسية">★</button>') +
          '<button type="button" class="rm" data-i="' +
          i +
          '" title="حذف الصورة">×</button>' +
          '<input class="colin" data-i="' +
          i +
          '" placeholder="اللون (اختياري)" value="' +
          esc(m.color || "") +
          '" /></div>',
      )
      .join("");
    $("thumbs").querySelectorAll(".rm").forEach((b) => (b.onclick = () => {
      const m = imgs.splice(Number(b.dataset.i), 1)[0];
      if (m && m.blob && m.prev) URL.revokeObjectURL(m.prev);
      drawThumbs();
    }));
    $("thumbs").querySelectorAll(".mk").forEach((b) => (b.onclick = () => {
      const m = imgs.splice(Number(b.dataset.i), 1)[0];
      imgs.unshift(m);
      drawThumbs();
    }));
    $("thumbs").querySelectorAll(".colin").forEach((inp) => (inp.oninput = () => {
      imgs[Number(inp.dataset.i)].color = inp.value;
    }));
    $("imgcount").textContent = imgs.length ? imgs.length + " / " + MAX_IMGS + " صور" : "";
  }
  async function pickFiles(el) {
    const files = Array.from(el.files || []);
    el.value = "";
    for (const f of files) {
      if (imgs.length >= MAX_IMGS) {
        toast("الحد الأقصى " + MAX_IMGS + " صور للمنتج");
        break;
      }
      const blob = await shrink(f);
      imgs.push({ blob, prev: URL.createObjectURL(blob), color: "" });
    }
    drawThumbs();
  }
  $("im").onchange = (e) => pickFiles(e.target);
  $("cam").onchange = (e) => pickFiles(e.target);

  function resetForm() {
    editId = null;
    $("addForm").reset();
    imgs.forEach((m) => m.blob && m.prev && URL.revokeObjectURL(m.prev));
    imgs = [];
    drawThumbs();
    fillCats("");
    $("aerr").textContent = "";
    $("formTitle").textContent = "إضافة منتج";
    $("formHint").textContent = "ارفع صورة أو أكتر (لو للمنتج أكتر من لون)";
    $("saveBtn").textContent = "حفظ المنتج";
    $("cancelEdit").style.display = "none";
  }
  function startEdit(id) {
    const p = prods.find((x) => String(x.id) === String(id));
    if (!p) return;
    resetForm();
    editId = p.id;
    $("n").value = p.name || "";
    fillCats(p.category);
    $("d").value = p.description || "";
    $("pr").value = p.price != null ? p.price : "";
    $("st").value = p.stock != null ? p.stock : "";
    imgs = imgsOf(p).map((u, i) => ({ url: u, prev: u, color: colorOf(p, i) }));
    drawThumbs();
    $("formTitle").textContent = "تعديل منتج";
    $("formHint").textContent = "عدّل اللي تحبه واضغط «حفظ التعديلات»";
    $("saveBtn").textContent = "حفظ التعديلات";
    $("cancelEdit").style.display = "block";
    $("addForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("cancelEdit").onclick = () => {
    resetForm();
    toast("تم إلغاء التعديل");
  };

  $("addForm").onsubmit = async (e) => {
    e.preventDefault();
    $("aerr").textContent = "";
    $("saveBtn").disabled = true;
    try {
      const item = {
        name: $("n").value.trim(),
        category: $("c").value,
        description: $("d").value.trim(),
        price: Number($("pr").value),
        stock: $("st").value === "" ? null : parseInt($("st").value, 10),
      };
      if (!item.name || $("pr").value === "" || !isFinite(item.price)) throw new Error("راجع اسم المنتج والسعر");
      if (!item.category) throw new Error("اختار القسم الأول");

      // تجهيز الصور (رفع الجديد + إبقاء القديم)
      const urls = [],
        colors = [];
      for (const m of imgs) {
        let u = m.url;
        if (!u && m.blob) {
          if (LIVE) {
            const path = "p/" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + urls.length) + ".jpg";
            const up = await sb.storage.from("product-images").upload(path, m.blob, { contentType: "image/jpeg" });
            if (up.error) throw new Error("تعذر رفع الصورة: " + up.error.message);
            u = sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
          } else u = await blobToDataUrl(m.blob);
        }
        urls.push(u);
        colors.push((m.color || "").trim());
      }
      item.images = urls;
      item.colors = colors;
      item.image_url = urls[0] || null;

      const editing = editId != null;
      const old = editing ? prods.find((x) => String(x.id) === String(editId)) : null;
      if (LIVE) {
        const q = editing ? sb.from("products").update(item).eq("id", editId) : sb.from("products").insert(item);
        const { error } = await q;
        if (error) {
          throw new Error(
            /images|colors/.test(error.message)
              ? "لازم تشغّل ملف supabase-update.sql في Supabase الأول (شوف README)"
              : "تعذر الحفظ: " + error.message,
          );
        }
        if (old) await dropFiles(imgsOf(old).filter((u) => !urls.includes(u)));
      } else if (editing) {
        const i = prods.findIndex((x) => String(x.id) === String(editId));
        if (i > -1) prods[i] = Object.assign({}, prods[i], item);
        saveLocal();
      } else {
        item.id = "u" + Date.now();
        item.created_at = new Date().toISOString();
        prods.unshift(item);
        saveLocal();
      }
      resetForm();
      toast(editing ? "تم حفظ التعديلات" : "تمت إضافة المنتج");
      await load();
    } catch (err) {
      $("aerr").textContent = err.message || "حصل خطأ";
    }
    $("saveBtn").disabled = false;
  };

  /* ---------- login ---------- */
  $("adminBtn").onclick = async () => {
    if (LIVE) {
      const { data } = await sb.auth.getSession();
      if (data.session && data.session.user.email === CFG.ADMIN_EMAIL) {
        showAdmin();
        return;
      }
    } else if (sessionStorage.getItem("yh_admin") === "1") {
      showAdmin();
      return;
    }
    $("err").textContent = "";
    $("pw").value = "";
    $("m").classList.add("show");
    setTimeout(() => $("pw").focus(), 50);
  };
  $("cancel").onclick = () => $("m").classList.remove("show");
  $("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    $("err").textContent = "";
    $("loginBtn").disabled = true;
    const pw = $("pw").value;
    if (LIVE) {
      const { error } = await sb.auth.signInWithPassword({
        email: CFG.ADMIN_EMAIL,
        password: pw,
      });
      if (error) $("err").textContent = "كلمة المرور غير صحيحة";
      else {
        $("m").classList.remove("show");
        showAdmin();
      }
    } else {
      if (pw === LOCAL_PASSWORD) {
        sessionStorage.setItem("yh_admin", "1");
        $("m").classList.remove("show");
        showAdmin();
      } else $("err").textContent = "كلمة المرور غير صحيحة";
    }
    $("loginBtn").disabled = false;
  };
  $("logout").onclick = async () => {
    isAdmin = false;
    if (LIVE) await sb.auth.signOut();
    sessionStorage.removeItem("yh_admin");
    showStore();
  };
  $("toStore").onclick = () => {
    isAdmin = false;
    showStore();
  };

  if (!LIVE) $("demo").style.display = "block";
  load();
  if (location.hash === "#admin") $("adminBtn").click();
})();
