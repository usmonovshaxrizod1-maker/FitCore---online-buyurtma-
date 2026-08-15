    // GLOBAL LOADER
    function showLoader(text) {
      const el = document.getElementById('global-loader');
      const txt = document.getElementById('global-loader-text');
      if (txt) txt.innerText = text || tr("Yuklanmoqda...", "Загрузка...");
      if (el) el.classList.remove('hidden');
    }
    function hideLoader() {
      const el = document.getElementById('global-loader');
      if (el) el.classList.add('hidden');
    }

    // Kichik, ekranni bloklamaydigan holat xabari. Admin amallarida global loader
    // o'rniga shu ishlatiladi: foydalanuvchi darhol natijani ko'radi, server esa fon rejimida saqlaydi.
    let actionToastTimer = null;
    function showActionToast(text, state = 'saving', duration = 0) {
      const el = document.getElementById('action-toast');
      if (!el) return;
      if (actionToastTimer) { clearTimeout(actionToastTimer); actionToastTimer = null; }
      el.textContent = text || '';
      el.dataset.state = state;
      el.classList.remove('hidden');
      if (duration > 0) {
        actionToastTimer = setTimeout(() => { el.classList.add('hidden'); actionToastTimer = null; }, duration);
      }
    }
    function hideActionToast() {
      const el = document.getElementById('action-toast');
      if (actionToastTimer) { clearTimeout(actionToastTimer); actionToastTimer = null; }
      if (el) el.classList.add('hidden');
    }
    function cloneData(v) {
      if (typeof structuredClone === 'function') { try { return structuredClone(v); } catch (_) {} }
      return JSON.parse(JSON.stringify(v));
    }

    // XSS OLDINI OLISH UCHUN: foydalanuvchi kiritgan matnni HTML'ga xavfsiz qo'yish
    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const FALLBACK_IMG = 'https://via.placeholder.com/150';

    // ⚙️ CONFIGURATION
    // MUHIM: bot tokeni va admin ID endi bu yerda YO'Q — ular faqat serverda
    // (Edge Function ichida, maxfiy sifatida) saqlanadi. Frontendda ular
    // umuman ko'rinmaydi, chunki bu yerga yozilgan har qanday narsani
    // dev-tools orqali istalgan kishi o'qib olishi mumkin.
    const CONFIG = {
      SUPABASE_URL: "https://mvgbqggrzhswjhmwqcyp.supabase.co",
      SUPABASE_KEY: "sb_publishable_f86Xiu8_yFR_kkZNU95P-g_inE5zCyA",
      IMAGES_BUCKET: "images"
    };

    const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    const TASHKENT_CITY_DISTRICTS = ["Bektemir","Chilonzor","Mirobod","Mirzo Ulug'bek","Olmazor","Sergeli","Shayxontohur","Uchtepa","Yakkasaroy","Yashnobod","Yunusobod"];

    const UZ_REGIONS = {
      "Andijon viloyati": ["Andijon shahri","Andijon tumani","Asaka","Baliqchi","Bo'z","Buloqboshi","Izboskan","Jalaquduq","Marhamat","Oltinko'l","Paxtaobod","Qo'rg'ontepa","Shahrixon","Ulug'nor","Xo'jaobod","Xonobod shahri"],
      "Buxoro viloyati": ["Buxoro shahri","Buxoro tumani","G'ijduvon","Jondor","Kogon shahri","Kogon tumani","Olot","Peshku","Qorako'l","Qorovulbozor","Romitan","Shofirkon","Vobkent"],
      "Farg'ona viloyati": ["Farg'ona shahri","Marg'ilon shahri","Qo'qon shahri","Farg'ona tumani","Bag'dod","Beshariq","Buvayda","Dang'ara","Furqat","Oltiariq","O'zbekiston","Quva","Qo'shtepa","Rishton","So'x","Toshloq","Uchko'prik","Yozyovon"],
      "Jizzax viloyati": ["Jizzax shahri","Jizzax tumani","Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Sh.Rashidov tumani","Yangiobod","Zafarobod","Zarbdor","Zomin"],
      "Xorazm viloyati": ["Urganch shahri","Urganch tumani","Bog'ot","Gurlan","Hazorasp","Xiva","Xonqa","Qo'shko'pir","Shovot","Yangiariq","Yangibozor"],
      "Namangan viloyati": ["Namangan shahri","Namangan tumani","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To'raqo'rg'on","Uchqo'rg'on","Uychi","Yangiqo'rg'on"],
      "Navoiy viloyati": ["Navoiy shahri","Zarafshon shahri","Karmana","Konimex","Navbahor","Nurota","Qiziltepa","Tomdi","Uchquduq","Xatirchi"],
      "Qashqadaryo viloyati": ["Qarshi shahri","Shahrisabz shahri","Qarshi tumani","Shahrisabz tumani","Chiroqchi","Dehqonobod","G'uzor","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Qamashi","Yakkabog'"],
      "Qoraqalpog'iston Respublikasi": ["Nukus shahri","Nukus tumani","Amudaryo","Beruniy","Chimboy","Ellikqal'a","Kegeyli","Mo'ynoq","Qanliko'l","Qorao'zak","Qo'ng'irot","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
      "Samarqand viloyati": ["Samarqand shahri","Samarqand tumani","Bulung'ur","Ishtixon","Jomboy","Kattaqo'rg'on","Narpay","Nurobod","Oqdaryo","Pastdarg'om","Paxtachi","Payariq","Qo'shrabot","Toyloq","Urgut"],
      "Sirdaryo viloyati": ["Guliston shahri","Guliston tumani","Yangiyer shahri","Boyovut","Mirzaobod","Oqoltin","Sardoba","Sayxunobod","Sirdaryo tumani","Xovos"],
      "Surxondaryo viloyati": ["Termiz shahri","Termiz tumani","Angor","Bandixon","Boysun","Denov","Jarqo'rg'on","Muzrabot","Oltinsoy","Qiziriq","Qumqo'rg'on","Sariosiyo","Sherobod","Sho'rchi","Uzun"],
      "Toshkent viloyati": ["Angren shahri","Bekobod shahri","Bekobod tumani","Bo'ka","Bo'stonliq","Chinoz","Chirchiq shahri","Ohangaron shahri","Ohangaron tumani","Olmaliq shahri","Oqqo'rg'on","Parkent","Piskent","Qibray","Quyichirchiq","Toshkent tumani","O'rtachirchiq","Yangiyo'l shahri","Yangiyo'l tumani","Yuqorichirchiq","Zangiota"]
    };

    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    // ============ DB <-> JS MAPPERS ============
    function mapProductFromDB(r) {
      const legacySizes = Array.isArray(r.sizes) ? r.sizes : null;
      const variants = Array.isArray(r.variants)
        ? r.variants
        : (legacySizes || []).map(x => ({ size: x.size || null, color: null, qty: Number(x.qty) || 0, sku: x.sku || null }));
      return {
        id: r.id, sku: r.sku, name: r.name, nameRu: r.name_ru || null, price: Number(r.price),
        oldPrice: r.old_price !== null ? Number(r.old_price) : null,
        stock: Number(r.stock) || 0, categoryId: r.category_id, status: r.status,
        img: r.img, desc: r.description, descRu: r.description_ru || null,
        isFeatured: r.is_featured, sortOrder: r.sort_order,
        sizes: legacySizes, variants,
        soldCount: r.sold_count || 0, createdAt: r.created_at || null,
        importBatchId: r.import_batch_id || null
      };
    }

    // Universal variant modeli: oddiy / faqat o'lcham / faqat rang / o'lcham+rangi.
    function productVariants(p) { return Array.isArray(p?.variants) ? p.variants : []; }
    function variantLabel(v) {
      return [v?.size, v?.color].filter(Boolean).join(' / ') || 'Asosiy';
    }
    function variantKey(size, color) { return `${size || ''}::${color || ''}`; }
    function variantQty(p, size, color) {
      const v = productVariants(p).find(x => (x.size || null) === (size || null) && (x.color || null) === (color || null));
      return v ? Number(v.qty) || 0 : Number(p?.stock) || 0;
    }

    // O'lchamlarni "40,2/42,4/44,8" matnidan [{size,qty}] ro'yxatiga o'giradi.
    // Agar ranglar bilan variant kiritilsa, Excel/import parseri alohida universal formatga aylantiradi.
    function parseSizesInput(text) {
      return (text || '').split('/').map(s => s.trim()).filter(Boolean).map(pair => {
        const parts = pair.split(',').map(s => s.trim());
        const size = parts[0] || '';
        const qty = parseInt(parts[1], 10);
        return { size, qty: isNaN(qty) ? 0 : qty };
      }).filter(s => s.size);
    }
    function formatSizesForInput(sizes) {
      return (sizes || []).map(s => `${s.size},${s.qty}`).join('/');
    }

    function parseVariantInputs(sizeText, colorText, fallbackStock) {
      const sizesRaw = String(sizeText || '').split('/').map(x => x.trim()).filter(Boolean);
      const colorRaw = String(colorText || '').split('/').map(x => x.trim()).filter(Boolean);
      const variants = [];

      // Rang mavjud bo'lsa: "48,Qizil-1,Qora-2/50,Ko'k-3" yoki "Qizil-3/Qora-2".
      if (colorRaw.length) {
        for (const group of colorRaw) {
          const parts = group.split(',').map(x => x.trim()).filter(Boolean);
          const first = parts[0] || '';
          const looksLikeSizeGroup = parts.length > 1 && !first.includes('-');
          const size = looksLikeSizeGroup ? first : null;
          const colorParts = looksLikeSizeGroup ? parts.slice(1) : parts;
          for (const token of colorParts) {
            const m = token.match(/^(.*?)[-–—]\s*(\d+)$/);
            if (!m) continue;
            const color = m[1].trim();
            const qty = parseInt(m[2], 10);
            if (color && Number.isFinite(qty) && qty >= 0) variants.push({ size, color, qty });
          }
        }
        return variants;
      }

      // Faqat o'lcham: "48,2/50,5". Agar faqat "48/50" yozilsa qty=0.
      if (sizesRaw.length) {
        for (const token of sizesRaw) {
          const parts = token.split(',').map(x => x.trim());
          const size = parts[0];
          const qty = parts.length > 1 ? parseInt(parts[1], 10) : 0;
          if (size) variants.push({ size, color: null, qty: Number.isFinite(qty) ? qty : 0 });
        }
        return variants;
      }

      return [];
    }
    function formatVariantInputs(vars) {
      const list = Array.isArray(vars) ? vars : [];
      if (!list.length) return { sizes: '', colors: '' };
      const hasColor = list.some(v => v.color);
      if (!hasColor) return { sizes: list.map(v => `${v.size || ''},${Number(v.qty)||0}`).join('/'), colors: '' };
      const hasSize = list.some(v => v.size);
      if (!hasSize) return { sizes: '', colors: list.map(v => `${v.color}-${Number(v.qty)||0}`).join('/') };
      const groups = new Map();
      for (const v of list) {
        const size = v.size || '';
        if (!groups.has(size)) groups.set(size, []);
        groups.get(size).push(`${v.color || ''}-${Number(v.qty)||0}`);
      }
      return { sizes: [...groups.keys()].filter(Boolean).join('/'), colors: [...groups.entries()].map(([size,arr]) => `${size},${arr.join(',')}`).join('/') };
    }

    function truncateText(text, maxLen) {
      if (!text) return '';
      return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text;
    }
    function sizesTotalQty(sizes) {
      return (sizes || []).reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
    }
    function mapCategoryFromDB(r) {
      return { id: r.id, name: r.name, nameRu: r.name_ru || null, parentId: r.parent_id, img: r.img };
    }
    // Buyurtma va savat tarixi endi to'g'ridan-to'g'ri bazadan emas, balki
    // serverda tasdiqlangan Edge Function javobidan keladi (pastdagi callApi).
    function formatOrderForUi(o) {
      return { ...o, date: new Date(o.createdAt).toLocaleString() };
    }

    // STATE VARIABLES (bo'sh boshlanadi, Supabase/Edge Function'dan yuklanadi)
    let products = [];
    let categories = [];
    let adminsList = [];
    let orders = [];
    let ordersLoaded = false, ordersLoading = false;
    let usersLoaded = false, usersLoading = false;
    let adminsLoaded = false, adminsLoading = false;
    let cart = JSON.parse(localStorage.getItem('cart') || "{}");
    let registeredUser = JSON.parse(localStorage.getItem('registeredUser') || "null");
    let checkoutDraft = JSON.parse(localStorage.getItem('checkoutDraft') || "null") || { fullname: '', phone: '', region: 'TASHKENT', viloyat: '', district: '', address: '' };

    // MUHIM: bular endi HECH QACHON "standart admin"ga tushmaydi. Haqiqiy
    // qiymatlar faqat boot() ichida, serverdagi Edge Function Telegram
    // imzosini tasdiqlagandan KEYIN o'rnatiladi. Ilova Telegram tashqarisida
    // ochilsa, bular hech qachon to'ldirilmaydi va ilova ishlamaydi (bu ataylab
    // shunday — xavfsizlik uchun).
    let currentTgId = null;
    let isSuperAdmin = false;
    let isUserAnAdmin = false;

    // Bloklash/ogohlantirish holati — faqat serverdan (boot javobidan) keladi
    let myStatus = { isBlocked: false, blockReason: null, isWarned: false, warnReason: null };

    let currentTab = 'home';
    let warehouseMissingImageOnly = false;
    let isAdminMode = false;
    let authReady = false;
    let adminCatParentId = null;
    let categoryPage = 1;
    // sortPrice/sortNew/sortSold: null | 'asc' | 'desc' — har biri mustaqil yoqiladi
    let categoryFilter = { minPrice: '', maxPrice: '', sortPrice: null, sortNew: null, sortSold: null };
    let ordersPage = 1;
    let userOrderFilter = 'ALL';
    let selectedProductModal = null;
    let selectedOrderModal = null;
    let selectedCategoryModal = null;
    let selectedUserModal = null;
    let usersSummary = [];
    let shopLogoUrl = null;
    let shopContact = { address: null, coordinates: null, phone: null, phone2: null, phone3: null, instagram: null, telegram: null };
    let activePopupModal = null;
    let editingFieldData = null;

    // Rasm yuklash uchun: haqiqiy fayl (Storage'ga yuklanadi) va preview (faqat ko'rsatish uchun)
    let tempImageFile = null;
    let tempImagePreviewUrl = null;
    let tempImagePreparingPromise = null;

    function clearTempImageSelection() {
      if (tempImagePreviewUrl && String(tempImagePreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(tempImagePreviewUrl); } catch (_) {}
      }
      tempImageFile = null;
      tempImagePreviewUrl = null;
      tempImagePreparingPromise = null;
    }
    function takeTempImageSnapshot() {
      const snap = {
        file: tempImageFile,
        preview: tempImagePreviewUrl,
        preparing: tempImagePreparingPromise,
      };
      tempImageFile = null;
      tempImagePreviewUrl = null;
      tempImagePreparingPromise = null;
      return snap;
    }
    function releaseImageSnapshot(snap) {
      if (snap?.preview && String(snap.preview).startsWith('blob:')) {
        try { URL.revokeObjectURL(snap.preview); } catch (_) {}
      }
    }

    // Joriy ko'rinib turgan mahsulotlar ro'yxati (⬆️⬇️ tugmalari shu ro'yxat ichida ishlashi uchun)
    let currentVisibleProductIds = [];

    let adminOrderFilters = {
      status: 'ALL',
      region: 'ALL',
      payment: 'ALL',
      search: ''
    };

    // Buyurtma statuslarini o'zbekcha ko'rsatish va har biriga alohida rang
    const STATUS_COLORS = {
      NEW: "bg-amber-100 text-amber-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    function statusColorClass(st) { return STATUS_COLORS[st] || "bg-gray-100 text-gray-600"; }

    // ============ TIL (O'ZBEK / RUS) ============
    // Ilovaning tayyor matnlari uchun lug'at. Faqat shu yerda ro'yxatdagi
    // matnlar tugma bilan tilga qarab almashadi. Admin kiritgan tovar
    // nomi/tavsifi esa alohida (nameRu/descRu maydonlari orqali) boshqariladi.
    let uiLang = localStorage.getItem('uiLang') || 'uz';
    const UI_TEXT = {
      nav_home: { uz: "Bosh sahifa", ru: "Главная" },
      nav_categories: { uz: "Kataloglar", ru: "Каталоги" },
      nav_cart: { uz: "Savatcha", ru: "Корзина" },
      nav_orders: { uz: "Buyurtmalar", ru: "Заказы" },
      nav_warehouse: { uz: "Ombor", ru: "Склад" },
      nav_users: { uz: "Mijozlar", ru: "Клиенты" },
      nav_profile: { uz: "Profil", ru: "Профиль" },
      search_placeholder: { uz: "Nomi yoki ID (masalan: 111001) orqali qidirish...", ru: "Поиск по названию или ID (например: 111001)..." },
      add_to_cart: { uz: "Savatga qo'shish", ru: "Добавить в корзину" },
      add_to_cart_short: { uz: "Savatga", ru: "В корзину" },
      out_of_stock: { uz: "Tugagan", ru: "Нет в наличии" },
      choose_size: { uz: "O'lchamni tanlash", ru: "Выбрать размер" },
      choose_variant: { uz: "Variantni tanlash", ru: "Выбрать вариант" },
      choose_color: { uz: "Rangni tanlash", ru: "Выбрать цвет" },
      place_order: { uz: "Buyurtma berish", ru: "Оформить заказ" },
      save: { uz: "Saqlash", ru: "Сохранить" },
      cancel: { uz: "Bekor qilish", ru: "Отмена" },
      cart_title: { uz: "Savatcha", ru: "Корзина" },
      cart_empty: { uz: "Savatchangiz bo'sh", ru: "Ваша корзина пуста" },
      shop_now: { uz: "Xarid qilish", ru: "Начать покупки" },
      my_orders: { uz: "Buyurtmalarim", ru: "Мои заказы" },
      all_orders: { uz: "Barcha buyurtmalar", ru: "Все заказы" },
      all_filter: { uz: "Barchasi", ru: "Все" },
      warehouse_title: { uz: "Ombor", ru: "Склад" },
      users_title: { uz: "Mijozlar", ru: "Клиенты" },
      total: { uz: "Jami", ru: "Итого" },
    };
    function t(key) {
      const entry = UI_TEXT[key];
      if (!entry) return key;
      return entry[uiLang] || entry.uz;
    }
    function tr(uz, ru) { return uiLang === 'ru' ? ru : uz; }
    window.fitcoreGetLang = () => uiLang;
    function toggleUiLang() {
      uiLang = uiLang === 'uz' ? 'ru' : 'uz';
      localStorage.setItem('uiLang', uiLang);
      render();
    }
    // Admin kiritgan tovar nomi/tavsifi — ruscha tarjimasi bo'lsa va til
    // ruscha tanlangan bo'lsa o'shani, aks holda o'zbekchasini ko'rsatadi.
    function productName(p) { return (uiLang === 'ru' && p.nameRu) ? p.nameRu : p.name; }
    function productDesc(p) { return (uiLang === 'ru' && p.descRu) ? p.descRu : (p.desc || ''); }
    function categoryName(c) { return (uiLang === 'ru' && c?.nameRu) ? c.nameRu : (c?.name || ''); }
    function money(v) { return `${Number(v || 0).toLocaleString()} ${tr("so'm", 'сум')}`; }
    function regionLabel(v) { return v === 'TASHKENT' ? tr('Toshkent shahri','Город Ташкент') : (v === 'PROVINCE' ? tr('Viloyatlar','Области') : (v || '')); }
    function payMethodLabel(v) { return v === 'CASH' ? tr('Naqd pul','Наличные') : (v === 'CARD' ? tr('Karta','Карта') : (v || '')); }

    const STATUS_LABELS_BY_LANG = {
      uz: { NEW: "Yangi", PROCESSING: "Jarayonda", DELIVERED: "Yetkazib berilgan", CANCELLED: "Bekor qilingan" },
      ru: { NEW: "Новый", PROCESSING: "В обработке", DELIVERED: "Доставлен", CANCELLED: "Отменён" },
    };
    function statusLabel(st) { return (STATUS_LABELS_BY_LANG[uiLang] || STATUS_LABELS_BY_LANG.uz)[st] || st; }

    let currentUser = {
      firstName: registeredUser?.firstName || tg?.initDataUnsafe?.user?.first_name || tr("Mijoz", "Клиент"),
      lastName: registeredUser?.lastName || tg?.initDataUnsafe?.user?.last_name || "",
      phone: registeredUser?.phone || "+998",
      tgId: null
    };

    // ============ SERVER BILAN GAPLASHISH (Edge Function) ============
    // Barcha admin amallari va ${tr("buyurtma", "заказов")}lar endi to'g'ridan-to'g'ri bazaga
    // emas, shu funksiya orqali serverga (app-api Edge Function) boradi.
    // Server har safar Telegram imzosini (tg.initData) tekshiradi, shuning
    // uchun bu yerdan hech qanday "soxta admin" yoki "soxta narx" o'tmaydi.
    async function callApi(action, payload) {
      const perfStarted = performance.now();
      const initData = tg?.initData || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/app-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            'apikey': CONFIG.SUPABASE_KEY
          },
          body: JSON.stringify({ action, payload: payload || {}, initData }),
          signal: controller.signal
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Server xatosi (${res.status})`);
        return data;
      } catch (e) {
        if (e.name === 'AbortError') throw new Error("Server javob bermadi (vaqt tugadi). Internetni tekshirib qayta urinib ko'ring.");
        throw e;
      } finally {
        clearTimeout(timeoutId);
        const ms = Math.round(performance.now() - perfStarted);
        if (ms >= 500) console.info(`[FITCORE perf] Edge ${action}: ${ms}ms`);
      }
    }

    // O'zbek telefon raqami formatini oddiy tekshirish
    function isValidPhone(phone) {
      const cleaned = (phone || '').replace(/\s+/g, '');
      return /^\+998\d{9}$/.test(cleaned);
    }

    // TRANSLITERATION & SEARCH
    function normalizeText(text) {
      if (!text) return { latin: '', cyrillic: '' };
      let str = text.toLowerCase().trim();
      const map = { 'sh':'ш','ch':'ч','yo':'ё','yu':'ю','ya':'я','ye':'е','a':'а','b':'б','v':'в','g':'г','d':'д','e':'е','z':'з','i':'и','j':'ж','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п','r':'р','s':'с','t':'т','u':'у','f':'ф','x':'х','h':'ҳ' };
      let cyr = str;
      for (let k in map) cyr = cyr.split(k).join(map[k]);
      return { latin: str, cyrillic: cyr };
    }

    // Mahsulotlarni nomi (lotin/kirill) YOKI ID (SKU) bo'yicha qidirish.
    // ID bo'yicha to'g'ridan-to'g'ri mos kelganlar ro'yxat boshida chiqadi.
    function searchProducts(query) {
      const activeProducts = products.filter(p => p.status !== 'DELETED').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      if (!query || !query.trim()) return activeProducts;

      const { latin, cyrillic } = normalizeText(query);
      const q = query.trim().toLowerCase();
      const results = activeProducts.filter(p => {
        const pNorm = normalizeText(p.name);
        const skuMatch = String(p.sku || '').toLowerCase().includes(latin);
        // Admin alohida kiritgan ruscha nomni ham (o'zining haqiqiy krill
        // shaklida, transliteratsiyasiz) qidiradi.
        const nameRuMatch = p.nameRu && p.nameRu.toLowerCase().includes(q);
        // Har bir o'lchamning O'ZINING ID'sini ham qidiradi.
        const variantSkuMatch = productVariants(p).some(v => v.sku && String(v.sku).toLowerCase().includes(latin));
        const variantTextMatch = productVariants(p).some(v => [v.size,v.color].filter(Boolean).some(x => String(x).toLowerCase().includes(q)));
        return pNorm.latin.includes(latin) || pNorm.cyrillic.includes(cyrillic) || skuMatch || nameRuMatch || variantSkuMatch || variantTextMatch;
      });

      results.sort((a, b) => {
        const aSkuStarts = String(a.sku || '').toLowerCase().startsWith(latin) ? 0 : 1;
        const bSkuStarts = String(b.sku || '').toLowerCase().startsWith(latin) ? 0 : 1;
        return aSkuStarts - bSkuStarts;
      });

      return results;
    }

    // NAVIGATION — og'ir admin ma'lumotlari faqat kerak bo'lgan tab ochilganda yuklanadi.
    async function loadOrdersLazy(force = false) {
      if (ordersLoading || (ordersLoaded && !force)) return;
      ordersLoading = true;
      if (currentTab === 'orders') render();
      try {
        const data = isUserAnAdmin && isAdminMode ? await callApi('get_all_orders', {}) : await callApi('get_my_orders', {});
        orders = (data.orders || []).map(formatOrderForUi);
        ordersLoaded = true;
        ordersSnapshot = JSON.stringify(orders.map(o => [o.id, o.status]));
      } catch (e) {
        console.error('Buyurtmalarni yuklashda xatolik:', e);
      } finally {
        ordersLoading = false;
        if (currentTab === 'orders') render();
      }
    }

    async function loadUsersLazy(force = false) {
      if (!isUserAnAdmin || usersLoading || (usersLoaded && !force)) return;
      usersLoading = true;
      if (currentTab === 'users') render();
      try {
        const data = await callApi('get_users_summary', {});
        usersSummary = data.users || [];
        usersLoaded = true;
      } catch (e) {
        console.error('Mijozlarni yuklashda xatolik:', e);
      } finally {
        usersLoading = false;
        if (currentTab === 'users') render();
      }
    }

    async function loadAdminsLazy(force = false) {
      if (!isSuperAdmin || adminsLoading || (adminsLoaded && !force)) return;
      adminsLoading = true;
      try {
        const data = await callApi('get_admins_list', {});
        adminsList = data.admins || [];
        adminsLoaded = true;
      } catch (e) {
        console.error('Adminlarni yuklashda xatolik:', e);
      } finally {
        adminsLoading = false;
        if (currentTab === 'profile') render();
      }
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('text-blue-600', 'font-bold'));
      const activeNav = document.getElementById(`nav-${tab}`);
      if (activeNav) activeNav.classList.add('text-blue-600', 'font-bold');
      render(); // tugma bosilishi darhol sezilsin
      if (tab === 'orders') loadOrdersLazy();
      if (tab === 'users' && isUserAnAdmin) loadUsersLazy();
      if (tab === 'profile' && isSuperAdmin) loadAdminsLazy();
    }

    function toggleAdminRole() {
      if (!isUserAnAdmin) {
        alert(tr("Sizda Admin huquqi yo'q!", "У вас нет прав администратора!"));
        isAdminMode = false;
        return;
      }
      isAdminMode = !isAdminMode;
      render();
    }

    // CART LOGIC — universal variant (size/color) qo'llab-quvvatlanadi.
    function cartKey(productId, size, color) {
      return (size || color) ? `${productId}::${size || ''}::${color || ''}` : productId;
    }
    function cartEntryProductId(key, entry) { return (entry && entry.productId) || String(key).split('::')[0]; }
    function cartQtyForVariant(productId, size, color, excludeKey) {
      return Object.entries(cart)
        .filter(([k,c]) => k !== excludeKey && cartEntryProductId(k,c) === productId && (c.size || null) === (size || null) && (c.color || null) === (color || null))
        .reduce((sum,[,c]) => sum + (Number(c.qty) || 0), 0);
    }
    function totalCartQtyForProduct(productId, excludeKey) {
      return Object.entries(cart).filter(([k,c]) => k !== excludeKey && cartEntryProductId(k,c) === productId).reduce((sum,[,c]) => sum + (Number(c.qty) || 0), 0);
    }

    function addToCart(id, e) {
      if (e) e.stopPropagation();
      const p = products.find(prod => prod.id === id);
      if (!p || p.stock <= 0) return alert(tr("Mahsulot tugagan!", "Товар закончился!"));
      if (productVariants(p).length) {
        openProductDetailModal(id);
        return;
      }
      const key = cartKey(id, null, null);
      const current = Number(cart[key]?.qty) || 0;
      if (current + 1 > p.stock) return alert(`${tr("⚠️ Omborda faqat", "⚠️ На складе только")} ${p.stock} ${tr("ta mavjud!", "шт.! ")}`);
      if (!cart[key]) cart[key] = { productId:id, size:null, color:null, qty:1, addedAt:new Date().toLocaleString() };
      else cart[key].qty += 1;
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartBadge(); render();
    }

    function changeCartQty(key, delta, e) {
      if (e) e.stopPropagation();
      if (!cart[key]) return;
      const entry = cart[key];
      const productId = cartEntryProductId(key, entry);
      const p = products.find(prod => prod.id === productId);
      const newQty = (Number(entry.qty) || 0) + delta;
      if (newQty <= 0) delete cart[key];
      else if (p) {
        const available = productVariants(p).length ? variantQty(p, entry.size || null, entry.color || null) : p.stock;
        const otherQty = cartQtyForVariant(productId, entry.size || null, entry.color || null, key);
        if (otherQty + newQty > available) {
          const label = [entry.size,entry.color].filter(Boolean).join(' / ');
          return alert(`⚠️ ${label ? '"'+label+'" ' : ''}${tr('variantidan faqat','вариант: доступно только')} ${available} ${tr('ta mavjud!','шт.!')}`);
        }
        entry.qty = newQty;
      } else entry.qty = newQty;
      localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); render();
    }

    function addVariantItemsToCart(productId, selectionMap) {
      const p = products.find(prod => prod.id === productId);
      if (!p) return;
      const vars = productVariants(p);
      const entries = Object.entries(selectionMap || {}).filter(([,q]) => Number(q) > 0);
      if (!entries.length) return alert(tr("Kamida bitta variant va sonini tanlang!", "Выберите хотя бы один вариант и количество!"));
      for (const [k,qtyRaw] of entries) {
        const v = vars.find(x => variantKey(x.size,x.color) === k);
        if (!v) return alert(tr("Variant topilmadi. Sahifani yangilang.", "Вариант не найден. Обновите страницу."));
        const qty = Number(qtyRaw) || 0;
        const cKey = cartKey(productId, v.size || null, v.color || null);
        const already = Number(cart[cKey]?.qty) || 0;
        if (already + qty > Number(v.qty || 0)) return alert(`⚠️ "${variantLabel(v)}": ${tr('faqat','доступно только')} ${v.qty} ${tr('ta mavjud!','шт.!')}`);
      }
      for (const [k,qtyRaw] of entries) {
        const v = vars.find(x => variantKey(x.size,x.color) === k);
        const qty = Number(qtyRaw) || 0;
        const cKey = cartKey(productId, v.size || null, v.color || null);
        if (cart[cKey]) cart[cKey].qty += qty;
        else cart[cKey] = { productId, size:v.size || null, color:v.color || null, qty, addedAt:new Date().toLocaleString() };
      }
      localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge();
    }

    // Legacy helper — eski size-only UI/call'lar buzilmasligi uchun.
    function addSizedItemsToCart(productId, sizeQtyMap) {
      const selection = {};
      for (const [size,qty] of Object.entries(sizeQtyMap || {})) selection[variantKey(size,null)] = qty;
      addVariantItemsToCart(productId, selection);
    }

    function updateCartBadge() {
      const count = Object.values(cart).reduce((a, b) => a + (b.qty || 0), 0);
      const badge = document.getElementById('cart-badge');
      if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
      }
    }

    // ============ IMAGE UPLOAD (Supabase Storage, signed URL orqali) ============
    // Fayl tanlanganda: faqat preview uchun base64 o'qiladi, haqiqiy fayl saqlab qo'yiladi.
    // Rasmni serverga yuklashdan oldin kichraytirish — tezroq yuklanadi va
    // kamroq joy egallaydi (uzun tomoni ~1000px, JPEG sifat 0.8 gacha).
    function compressImage(file, maxDim, quality) {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
            else { width = Math.round(width * maxDim / height); height = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (!blob) { resolve(file); return; }
            const newName = (file.name || 'rasm').replace(/\.\w+$/, '') + '.jpg';
            resolve(new File([blob], newName, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
    }

    async function onImagePicked(event, previewId) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert(tr("⚠️ Faqat rasm fayllarini tanlang!", "⚠️ Выберите файл изображения!"));
        event.target.value = '';
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert(tr("⚠️ Rasm hajmi 15MB dan oshmasligi kerak!", "⚠️ Размер изображения не должен превышать 15 МБ!"));
        event.target.value = '';
        return;
      }

      // Preview birinchi: galereyadan tanlangan rasm ESKI rasm o'rnida darhol ko'rinadi.
      if (tempImagePreviewUrl && String(tempImagePreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(tempImagePreviewUrl); } catch (_) {}
      }
      tempImageFile = file;
      tempImagePreviewUrl = URL.createObjectURL(file);
      const prev = document.getElementById(previewId);
      if (prev) {
        prev.src = tempImagePreviewUrl;
        prev.classList.remove('hidden');
      }

      // Kichraytirish fon rejimida. Saqlash tez bosilsa ham save funksiyasi shu promise'ni kutadi,
      // ammo ekran hech qachon global loader bilan qotmaydi.
      tempImagePreparingPromise = compressImage(file, 1000, 0.8);
      showActionToast(tr("🖼️ Rasm tanlandi", "🖼️ Фото выбрано"), 'success', 1200);
    }

    async function uploadImageSnapshot(snapshot, existingImg, strict = false) {
      if (!snapshot || (!snapshot.file && !snapshot.preparing)) return existingImg || null;
      const prepared = snapshot.preparing ? await snapshot.preparing : snapshot.file;
      if (!prepared) return existingImg || null;

      showActionToast(tr("☁️ Rasm yuklanmoqda...", "☁️ Фото загружается..."), 'saving');
      const ext = (prepared.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      let lastErr = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { path, token } = await callApi('get_upload_url', { ext });
          const { error: upErr } = await sb.storage.from(CONFIG.IMAGES_BUCKET).uploadToSignedUrl(path, token, prepared);
          if (upErr) throw upErr;
          const { data: pub } = sb.storage.from(CONFIG.IMAGES_BUCKET).getPublicUrl(path);
          return pub?.publicUrl || existingImg || null;
        } catch (e) {
          lastErr = e;
          console.error(`Rasm yuklash xatosi (${attempt + 1}-urinish):`, e);
        }
      }
      if (strict) throw lastErr || new Error('image_upload_failed');
      return existingImg || null;
    }

    // Eski chaqiruvlar uchun wrapper.
    async function uploadImageIfNeeded(existingImg) {
      const snap = takeTempImageSnapshot();
      try { return await uploadImageSnapshot(snap, existingImg, false); }
      finally { releaseImageSnapshot(snap); }
    }

    // RENDER ROUTER
    function updateNavLabels() {
      const map = {
        'nav-label-home': 'nav_home', 'nav-label-categories': 'nav_categories',
        'nav-label-cart': 'nav_cart', 'nav-label-orders': 'nav_orders',
        'nav-label-warehouse': 'nav_warehouse', 'nav-label-users': 'nav_users',
        'nav-label-profile': 'nav_profile',
      };
      for (const [elId, key] of Object.entries(map)) {
        const el = document.getElementById(elId);
        if (el) el.innerText = t(key);
      }
    }

    function updateHeaderChrome() {
      const logoImg = document.getElementById('shop-logo-img');
      if (logoImg) {
        if (shopLogoUrl) { logoImg.src = shopLogoUrl; logoImg.classList.remove('hidden'); }
        else { logoImg.classList.add('hidden'); }
      }
      const flagBtn = document.getElementById('lang-flag-btn');
      if (flagBtn) flagBtn.innerText = uiLang === 'uz' ? '🇺🇿' : '🇷🇺';
      const cartBtn = document.getElementById('header-cart-btn');
      if (cartBtn) cartBtn.classList.toggle('hidden', isAdminMode && isUserAnAdmin);
    }

    function render() {
      updateCartBadge();
      updateNavLabels();
      updateHeaderChrome();

      if (authReady && !registeredUser && !isAdminMode && activePopupModal !== 'REGISTRATION') {
        activePopupModal = 'REGISTRATION';
      }

      const roleTag = document.getElementById('role-tag');
      const whBtn = document.getElementById('nav-warehouse-btn');
      const usersBtn = document.getElementById('nav-users-btn');
      const cartNavBtn = document.getElementById('nav-cart');

      if (isAdminMode && isUserAnAdmin) {
        roleTag.innerText = "ADMIN";
        whBtn.classList.remove('hidden');
        whBtn.classList.add('flex');
        usersBtn.classList.remove('hidden');
        usersBtn.classList.add('flex');
        cartNavBtn.classList.add('hidden');
        cartNavBtn.classList.remove('flex');
        if (currentTab === 'cart') currentTab = 'home';
      } else {
        roleTag.innerText = "STORE";
        whBtn.classList.add('hidden');
        usersBtn.classList.add('hidden');
        cartNavBtn.classList.remove('hidden');
        cartNavBtn.classList.add('flex');
        if (currentTab === 'warehouse' || currentTab === 'users') currentTab = 'home';
      }

      const container = document.getElementById('app-content');
      switch (currentTab) {
        case 'home': renderHome(container); break;
        case 'categories': renderCategories(container); break;
        case 'cart': renderCart(container); break;
        case 'orders': renderOrders(container); break;
        case 'warehouse': renderWarehouse(container); break;
        case 'users': renderUsers(container); break;
        case 'profile': renderProfile(container); break;
      }
      renderModalContainer();
      lucide.createIcons();
    }

    // 1. HOME TAB
    function renderHome(container) {
      container.innerHTML = `
        <div class="space-y-4">
          <div class="relative">
            <input type="text" id="search-input" oninput="handleSearchDebounced()" placeholder="${escapeHtml(t('search_placeholder'))}"
              class="w-full bg-white pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute left-3 top-3.5"></i>
          </div>

          ${(isAdminMode && isUserAnAdmin) ? `
            <div class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 shadow-sm flex items-center justify-between">
              <span>${tr("🛡️ Admin rejimi: Bosh sahifa (Pin 📌 orqali tanlangan tovarlar)", "🛡️ Режим администратора: Главная (товары, закреплённые 📌)")}</span>
            </div>
          ` : ''}

          <div id="products-grid" class="grid grid-cols-2 gap-3"></div>
        </div>
      `;
      handleSearch();
    }

    // Qidiruvni har harfda emas, 300ms kutib bir marta ishlatish (tezlik uchun)
    let searchDebounceTimer = null;
    function handleSearchDebounced() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(handleSearch, 300);
    }

    function handleSearch() {
      const q = document.getElementById('search-input')?.value || '';
      let filtered = searchProducts(q);

      if (currentTab === 'home' && !q.trim()) {
        filtered = filtered.filter(p => p.isFeatured === true);
      }

      currentVisibleProductIds = filtered.map(p => p.id);

      const grid = document.getElementById('products-grid');
      if (!grid) return;

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center py-8 bg-white rounded-2xl p-4 text-xs text-gray-500">${tr("🔍 Bosh sahifa uchun tovar biriktirilmagan yoki topilmadi", "🔍 Для главной страницы нет закреплённых товаров")}</div>`;
        return;
      }

      grid.innerHTML = filtered.map((p, idx) => renderProductCardHTML(p, idx, filtered.length)).join('');
      lucide.createIcons();
    }

    // REUSABLE PRODUCT CARD
    function renderProductCardHTML(p, idx, totalLen) {
      const inCart = cart[p.id];
      const vars = productVariants(p);
      const variantSizes = [...new Set(vars.map(v => v.size).filter(Boolean))];
      const variantColors = [...new Set(vars.map(v => v.color).filter(Boolean))];
      const hasDiscount = p.oldPrice && p.oldPrice > p.price;

      return `
        <div onclick="openProductDetailModal('${p.id}')" class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col justify-between relative cursor-pointer hover:shadow-md transition-all">
          <div>
            <div class="relative">
              <img src="${escapeHtml(p.img || FALLBACK_IMG)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-full h-28 object-cover rounded-xl mb-2" loading="lazy">
              ${hasDiscount ? `<span class="absolute top-1 right-1 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">${tr("CHEGIRMA", "СКИДКА")}</span>` : ''}
            </div>
            ${(isAdminMode && isUserAnAdmin) ? `<span class="text-[10px] bg-gray-100 font-mono text-gray-500 px-1.5 py-0.5 rounded">${escapeHtml(p.sku)}</span>` : ''}
            <h4 class="font-bold text-sm text-gray-800 mt-1 leading-tight line-clamp-1">${escapeHtml(productName(p))}</h4>

            <div class="mt-1">
              ${hasDiscount ? `
                <div class="flex items-center space-x-1">
                  <span class="text-[10px] text-gray-400 line-through font-bold">${Number(p.oldPrice).toLocaleString()}</span>
                  <span class="text-xs text-red-600 font-black">${money(p.price)}</span>
                </div>
              ` : `
                <p class="text-xs text-blue-600 font-black">${money(p.price)}</p>
              `}
            </div>
            ${variantSizes.length ? `<p class="text-[9px] text-gray-400 mt-0.5">${tr("O'lcham", "Размер")}: ${variantSizes.map(escapeHtml).join(', ')}</p>` : ''}
            ${variantColors.length ? `<p class="text-[9px] text-gray-400 mt-0.5">${tr("Rang", "Цвет")}: ${variantColors.map(escapeHtml).join(', ')}</p>` : ''}
            ${productDesc(p) ? `<p class="text-[10px] text-gray-400 italic mt-0.5 line-clamp-1">${escapeHtml(truncateText(productDesc(p), 40))}</p>` : ''}
          </div>

          <!-- ADMIN CONTROLS -->
          ${(isAdminMode && isUserAnAdmin) ? `
            <div class="mt-2 pt-2 border-t flex flex-col space-y-1" onclick="event.stopPropagation()">
              <div class="flex justify-between items-center text-[10px]">
                <button onclick="moveProductSort('${p.id}', -1)" ${idx === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 bg-gray-100 rounded font-bold">⬆️</button>
                <button onclick="moveProductSort('${p.id}', 1)" ${idx === totalLen - 1 ? 'disabled' : ''} class="px-1.5 py-0.5 bg-gray-100 rounded font-bold">⬇️</button>
                <button onclick="toggleProductFeatured('${p.id}')" class="px-1.5 py-0.5 ${p.isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'} rounded font-bold">📌</button>
                <button onclick="openProductDetailModal('${p.id}')" class="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">✏️</button>
                <button onclick="deleteProduct('${p.id}')" class="px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold">🗑️</button>
              </div>
            </div>
          ` : `
            <!-- USER CART CONTROLS -->
            <div class="mt-2" onclick="event.stopPropagation()">
              ${p.stock > 0 ? (
                vars.length > 0 ? `
                  <button onclick="openProductDetailModal('${p.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                    <span>${t('choose_variant')}</span>
                  </button>
                ` : (
                inCart ? `
                  <div class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
                    <button onclick="changeCartQty('${p.id}', -1, event)" class="w-6 h-6 bg-white font-bold rounded-lg shadow text-xs text-blue-600">-</button>
                    <span class="font-bold text-xs text-blue-800">${inCart.qty}</span>
                    <button onclick="changeCartQty('${p.id}', 1, event)" class="w-6 h-6 bg-blue-600 font-bold rounded-lg text-xs text-white">+</button>
                  </div>
                ` : `
                  <button onclick="addToCart('${p.id}', event)" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i> <span>${t('add_to_cart_short')}</span>
                  </button>
                `
              )) : `<button disabled class="w-full bg-gray-100 text-gray-400 font-bold py-2 rounded-xl text-xs">❌ ${t('out_of_stock')}</button>`}
            </div>
          `}
        </div>
      `;
    }

    // 2. CATEGORIES TAB
    function renderCategories(container) {
      const currentCat = categories.find(c => c.id === adminCatParentId);
      const subCats = categories.filter(c => c.parentId === adminCatParentId);
      const catProdsRaw = products.filter(p => p.categoryId === adminCatParentId && p.status !== 'DELETED');
      const catProds = applyCategoryFilter(catProdsRaw);
      const filterActive = isCategoryFilterActive();

      const totalPages = Math.ceil(catProds.length / 10) || 1;
      if (categoryPage > totalPages) categoryPage = 1;
      const paginatedProds = catProds.slice((categoryPage - 1) * 10, categoryPage * 10);
      currentVisibleProductIds = paginatedProds.map(p => p.id);

      container.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white p-3 rounded-2xl border space-y-2 shadow-sm">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-gray-700">${tr("📍 Katalog:", "📍 Каталог:")} <b class="text-blue-600">${escapeHtml(currentCat ? categoryName(currentCat) : (uiLang === 'ru' ? 'Главные каталоги' : 'Bosh Kataloglar'))}</b></span>
              ${adminCatParentId ? `
                <div class="flex space-x-1">
                  <button onclick="goBackCatLevel()" class="bg-gray-100 px-2 py-1 rounded-lg font-bold text-[11px]">${tr("⬅️ Orqaga", "⬅️ Назад")}</button>
                  <button onclick="adminCatParentId = null; categoryPage=1; render();" class="bg-gray-100 px-2 py-1 rounded-lg font-bold text-[11px]">${tr("🏠 Boshiga", "🏠 В начало")}</button>
                </div>
              ` : ''}
            </div>

            ${(isAdminMode && isUserAnAdmin) ? `
              <div class="flex space-x-2 pt-1 border-t">
                <button onclick="openAddCatModal()" class="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded-xl text-xs">${tr("➕ Katalog qo'shish", "➕ Добавить каталог")}</button>
                <button onclick="openAddProductModal()" class="flex-1 bg-emerald-600 text-white font-bold py-1.5 rounded-xl text-xs">${tr("➕ Tovar qo'shish", "➕ Добавить товар")}</button>
              </div>
              <button onclick="openExcelImportModal()" class="w-full bg-slate-800 text-white font-bold py-1.5 rounded-xl text-xs">${tr("📊 Excel orqali ko'p tovar qo'shish", "📊 Массовый импорт из Excel")}</button>
            ` : ''}
          </div>

          <!-- SUBCATEGORIES LIST -->
          <div class="space-y-2">
            ${subCats.map(sub => `
              <div onclick="adminCatParentId = '${sub.id}'; categoryPage=1; render();" class="bg-white p-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50">
                <div class="flex items-center space-x-3">
                  ${sub.img && (sub.img.startsWith('http') || sub.img.startsWith('data:')) ?
                    `<img src="${escapeHtml(sub.img)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-8 h-8 object-cover rounded-lg" loading="lazy">` :
                    `<span class="text-xl">${escapeHtml(sub.img) || '📁'}</span>`
                  }
                  <div>
                    <h5 class="font-bold text-sm text-gray-800">${escapeHtml(categoryName(sub))}</h5>
                    <p class="text-[10px] text-gray-400">${categories.filter(c => c.parentId === sub.id).length} ${tr('katalog','кат.')} | ${products.filter(p => p.categoryId === sub.id && p.status !== 'DELETED').length} ${tr('tovar','тов.')}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  ${(isAdminMode && isUserAnAdmin) ? `
                    <button onclick="openEditCategoryModal('${sub.id}', event)" class="p-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">✏️</button>
                    <button onclick="deleteCategory('${sub.id}', event)" class="p-1 bg-red-100 text-red-600 rounded text-xs font-bold">🗑️</button>
                  ` : ''}
                  <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- PRODUCTS LIST -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between px-1">
              <h4 class="font-bold text-xs text-gray-500 uppercase">${tr("📦 Tovarlar", "📦 Товары")} (${catProds.length})</h4>
              ${catProdsRaw.length > 0 ? `
                <button onclick="openCategoryFilterModal()" class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${filterActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}">
                  🔍 Filtr${filterActive ? ' •' : ''}
                </button>
              ` : ''}
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${paginatedProds.map((p, idx) => renderProductCardHTML(p, idx, paginatedProds.length)).join('')}
            </div>

            ${totalPages > 1 ? `
              <div class="flex justify-center items-center space-x-2 pt-4">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => `
                  <button onclick="categoryPage = ${pNum}; render();" class="px-3 py-1.5 rounded-xl text-xs font-bold ${categoryPage === pNum ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}">
                    ${pNum}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    function isCategoryFilterActive() {
      return !!(categoryFilter.minPrice || categoryFilter.maxPrice || categoryFilter.sortPrice || categoryFilter.sortNew || categoryFilter.sortSold);
    }

    function applyCategoryFilter(list) {
      let result = list.slice();
      const min = parseFloat(categoryFilter.minPrice);
      const max = parseFloat(categoryFilter.maxPrice);
      if (!isNaN(min)) result = result.filter(p => p.price >= min);
      if (!isNaN(max)) result = result.filter(p => p.price <= max);

      const dirMul = (dir) => dir === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        if (categoryFilter.sortPrice) {
          const d = (a.price - b.price) * dirMul(categoryFilter.sortPrice);
          if (d !== 0) return d;
        }
        if (categoryFilter.sortNew) {
          const d = (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)) * dirMul(categoryFilter.sortNew);
          if (d !== 0) return d;
        }
        if (categoryFilter.sortSold) {
          const d = ((a.soldCount || 0) - (b.soldCount || 0)) * dirMul(categoryFilter.sortSold);
          if (d !== 0) return d;
        }
        return 0;
      });
      return result;
    }

    function openCategoryFilterModal() {
      activePopupModal = 'CAT_FILTER';
      render();
    }

    function closeCategoryFilterModal() {
      activePopupModal = null;
      render();
    }

    function setCategoryPriceBound(field, value) {
      categoryFilter[field] = value;
      categoryPage = 1;
    }

    // Har bir saralash: yo'q -> o'suvchi -> kamayuvchi -> yo'q, mustaqil ravishda
    function toggleCategorySortOption(key) {
      const order = [null, 'asc', 'desc'];
      const idx = order.indexOf(categoryFilter[key]);
      categoryFilter[key] = order[(idx + 1) % order.length];
      categoryPage = 1;
      render();
    }

    function clearCategoryFilter() {
      categoryFilter = { minPrice: '', maxPrice: '', sortPrice: null, sortNew: null, sortSold: null };
      categoryPage = 1;
      render();
    }

    function goBackCatLevel() {
      if (!adminCatParentId) return;
      const current = categories.find(c => c.id === adminCatParentId);
      adminCatParentId = current ? current.parentId : null;
      categoryPage = 1;
      render();
    }

    // 3. CART TAB
    function renderCart(container) {
      const items = Object.entries(cart).map(([key, itemData]) => {
        const productId = cartEntryProductId(key, itemData);
        const p = products.find(prod => prod.id === productId);
        return p ? { ...p, key, qty: itemData.qty, size: itemData.size || null, color: itemData.color || null } : null;
      }).filter(Boolean);

      let total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

      if (items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 bg-white rounded-2xl p-6 shadow-sm">
            <i data-lucide="shopping-bag" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
            <h3 class="font-bold text-gray-700">${t('cart_empty')}</h3>
            <button onclick="switchTab('home')" class="mt-4 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl">${t('shop_now')}</button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="space-y-4">
          <h2 class="text-lg font-bold">${t('cart_title')}</h2>
          <div class="bg-white rounded-2xl p-4 shadow-sm divide-y">
            ${items.map(item => `
              <div class="py-3 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <img src="${escapeHtml(item.img || FALLBACK_IMG)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-12 h-12 object-cover rounded-lg flex-shrink-0" loading="lazy">
                  <div>
                    <h4 class="font-bold text-sm text-gray-800">${escapeHtml(productName(item))} ${item.size ? `<span class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">${escapeHtml(item.size)}</span>` : ''} ${item.color ? `<span class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">${escapeHtml(item.color)}</span>` : ''}</h4>
                    <p class="text-xs text-gray-500">${money(item.price)} / ${t('total').toLowerCase()}: <b class="text-gray-700">${money(item.price * item.qty)}</b></p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button onclick="changeCartQty('${item.key}', -1)" class="w-7 h-7 bg-gray-100 rounded-lg font-bold text-sm">-</button>
                  <span class="font-bold text-sm px-1">${item.qty}</span>
                  <button onclick="changeCartQty('${item.key}', 1)" class="w-7 h-7 bg-blue-600 text-white rounded-lg font-bold text-sm">+</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div class="flex justify-between items-center text-lg font-black">
              <span>${t('total')}:</span>
              <span class="text-green-600">${money(total)}</span>
            </div>
            <button onclick="openCheckoutForm()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm shadow-md">
              ✅ ${t('place_order')}
            </button>
          </div>
        </div>
      `;
    }

    let selectedPayMethod = 'CASH';

    function openCheckoutForm() {
      if (Object.keys(cart).length === 0) return;
      activePopupModal = 'CHECKOUT_FORM';
      render();
    }

    function closeCheckoutForm() {
      activePopupModal = null;
      render();
    }

    function saveCheckoutDraft() {
      checkoutDraft = {
        fullname: document.getElementById('chk-fullname')?.value || '',
        phone: document.getElementById('chk-phone')?.value || '',
        region: document.getElementById('chk-region')?.value || 'TASHKENT',
        viloyat: document.getElementById('chk-viloyat')?.value || '',
        district: document.getElementById('chk-district')?.value || '',
        address: document.getElementById('chk-address')?.value || ''
      };
      localStorage.setItem('checkoutDraft', JSON.stringify(checkoutDraft));
    }

    // Modal ochilganda saqlangan qoralamani (yoki ro'yxatdan o'tishda kiritilgan
    // ism/telefonni) maydonlarga qaytarib qo'yadi.
    function applyCheckoutDraftToForm() {
      const fullnameEl = document.getElementById('chk-fullname');
      const phoneEl = document.getElementById('chk-phone');
      if (fullnameEl) fullnameEl.value = checkoutDraft.fullname || (currentUser.firstName + ' ' + currentUser.lastName).trim();
      if (phoneEl) phoneEl.value = checkoutDraft.phone || currentUser.phone || '';

      const regionEl = document.getElementById('chk-region');
      if (regionEl) regionEl.value = checkoutDraft.region || 'TASHKENT';
      handleRegionChange();

      if (checkoutDraft.region === 'PROVINCE' && checkoutDraft.viloyat) {
        const viloyatEl = document.getElementById('chk-viloyat');
        if (viloyatEl) viloyatEl.value = checkoutDraft.viloyat;
        handleViloyatChange();
      }

      const districtEl = document.getElementById('chk-district');
      if (districtEl && checkoutDraft.district) districtEl.value = checkoutDraft.district;

      const addressEl = document.getElementById('chk-address');
      if (addressEl) addressEl.value = checkoutDraft.address || '';
    }

   function handleRegionChange() {
      const region = document.getElementById('chk-region').value;
      const btsWarn = document.getElementById('bts-warning');
      const viloyatWrap = document.getElementById('chk-viloyat-wrap');
      const viloyatSelect = document.getElementById('chk-viloyat');
      const districtSelect = document.getElementById('chk-district');
      const addrLabel = document.getElementById('chk-address-label');
      const addrInput = document.getElementById('chk-address');
      const payWrap = document.getElementById('pay-method-wrap');
      const cashBtn = document.getElementById('pay-cash-btn');
      const cardBtn = document.getElementById('pay-card-btn');

      if (region === 'PROVINCE') {
        btsWarn.classList.remove('hidden');
        viloyatWrap.classList.remove('hidden');
        addrLabel.innerText = tr("BTS Pochta manzili *", "Адрес BTS Pochta *");
        addrInput.placeholder = "Hududingizdagi BTS pochta manzilini kiriting";

        viloyatSelect.innerHTML = `<option value="">${tr("— Tanlang —", "— Выберите —")}</option>` +
          Object.keys(UZ_REGIONS).map(v => `<option value="${v}">${v}</option>`).join('');
        districtSelect.innerHTML = `<option value="">${tr("— Avval viloyatni tanlang —", "— Сначала выберите область —")}</option>`;

        // Viloyatda faqat KARTA ko'rsatiladi (hozircha ishlamaydi)
        payWrap.className = "grid grid-cols-1 gap-2 mt-1";
        cashBtn.classList.add('hidden');
        selectedPayMethod = 'CARD';
        cardBtn.className = "py-2.5 border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs";
      } else {
        btsWarn.classList.add('hidden');
        viloyatWrap.classList.add('hidden');
        addrLabel.innerText = tr("Manzil *", "Адрес *");
        addrInput.placeholder = "Ko'cha/qishloq/mahalla va uy raqami";

        districtSelect.innerHTML = `<option value="">${tr("— Tanlang —", "— Выберите —")}</option>` +
          TASHKENT_CITY_DISTRICTS.map(d => `<option value="${d}">${d}</option>`).join('');

        // ${tr("Toshkent shahri", "Город Ташкент")}da ikkalasi ko'rinadi, karta o'chiq
        payWrap.className = "grid grid-cols-2 gap-2 mt-1";
        cashBtn.classList.remove('hidden');
        selectedPayMethod = 'CASH';
        cashBtn.className = "py-2.5 border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs";
        cardBtn.className = "py-2.5 border rounded-xl font-bold text-xs text-gray-400 bg-gray-50";
      }
    }

    function handleViloyatChange() {
      const viloyat = document.getElementById('chk-viloyat').value;
      const districtSelect = document.getElementById('chk-district');
      const tumanlar = UZ_REGIONS[viloyat] || [];
      districtSelect.innerHTML = `<option value="">${tr("— Tanlang —", "— Выберите —")}</option>` +
        tumanlar.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    function selectPayment(type) {
      if (type === 'CARD') {
        alert(tr("ℹ️ Karta orqali to'lov hozircha ishlab chiqilmoqda. Tez orada faollashtiriladi.", "ℹ️ Оплата картой пока разрабатывается. Скоро будет доступна."));
        return;
      }
      selectedPayMethod = 'CASH';
      const cashBtn = document.getElementById('pay-cash-btn');
      const cardBtn = document.getElementById('pay-card-btn');
      if (cashBtn) cashBtn.className = "py-2.5 border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs";
      if (cardBtn) cardBtn.className = "py-2.5 border rounded-xl font-bold text-xs text-gray-400 bg-gray-50";
    }

    let submittingOrder = false;
    async function submitOrder() {
      if (myStatus.isBlocked) {
        return alert(`${tr("🚫 Siz botdan foydalanish huquqidan mahrum qilingansiz", "🚫 Доступ к оформлению заказов заблокирован")}.\n${tr('Sabab','Причина')}: ${myStatus.blockReason || tr("ko'rsatilmagan",'не указана')}\n\n${tr("Batafsil ma'lumot uchun Profil bo'limiga qarang.",'Подробности смотрите в разделе «Профиль».')}`);
      }

      const fullname = document.getElementById('chk-fullname').value.trim();
      const phone = document.getElementById('chk-phone').value.trim();
      const region = document.getElementById('chk-region').value;
      const viloyat = region === 'PROVINCE' ? document.getElementById('chk-viloyat').value : '';
      const tuman = document.getElementById('chk-district').value.trim();
      const district = region === 'PROVINCE' ? `${viloyat}, ${tuman}` : tuman;
      const address = document.getElementById('chk-address').value.trim();

      let hasError = false;

      const requiredFields = [['chk-fullname', fullname], ['chk-phone', phone], ['chk-district', tuman], ['chk-address', address]];
      if (region === 'PROVINCE') requiredFields.push(['chk-viloyat', viloyat]);

      requiredFields.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (!val || val === '+998') {
          el.classList.add('border-red-500', 'bg-red-50');
          hasError = true;
        } else {
          el.classList.remove('border-red-500', 'bg-red-50');
        }
      });

      if (hasError) return alert(tr("Iltimos, barcha qizil maydonlarni to'ldiring!", "Заполните все поля, отмеченные красным!"));

      if (!isValidPhone(phone)) {
        document.getElementById('chk-phone').classList.add('border-red-500', 'bg-red-50');
        return alert(tr("Iltimos, telefon raqamini to'g'ri formatda kiriting: +998901234567", "Введите телефон в формате +998901234567"));
      }

      if (region === 'PROVINCE') {
        return alert(tr("❌ Hozircha viloyatlarga faqat karta orqali to'lov mumkin, u esa hali ishlamayapti. Tez orada faollashtiriladi.", "❌ Для областей требуется оплата картой, но она пока недоступна. Скоро будет активирована."));
      }
      if (selectedPayMethod !== 'CASH') {
        return alert(tr("❌ Hozircha faqat naqd pul bilan buyurtma qabul qilinadi.", "❌ Пока принимаются только заказы с оплатой наличными."));
      }

      // Savatdagi har bir variant bo'yicha tezkor tekshiruv. Yakuniy atomik tekshiruv serverda.
      for (const [key, itemData] of Object.entries(cart)) {
        const productId = cartEntryProductId(key, itemData);
        const p = products.find(prod => prod.id === productId);
        if (!p) return alert(tr('❌ Savatchadagi mahsulot topilmadi. Savatchani yangilang.', '❌ Товар из корзины не найден. Обновите корзину.'));
        const available = productVariants(p).length
          ? variantQty(p, itemData.size || null, itemData.color || null)
          : Number(p.stock) || 0;
        if ((Number(itemData.qty) || 0) > available) {
          const label = [itemData.size,itemData.color].filter(Boolean).join(' / ');
          return alert(`❌ "${productName(p)}"${label ? ' ('+label+')' : ''} ${tr("omborda yetarli emas. Iltimos, savatchani tekshiring.",'недостаточно на складе. Проверьте корзину.')}`);
        }
      }

      if (submittingOrder) return;
      submittingOrder = true;
      showLoader(tr("Buyurtma qabul qilinmoqda...", "Заказ оформляется..."));

      const itemsPayload = Object.entries(cart).map(([key, itemData]) => ({
        productId: cartEntryProductId(key, itemData), qty: itemData.qty, size: itemData.size || null, color: itemData.color || null
      }));

      try {
        const result = await callApi('create_order', {
          items: itemsPayload, fullname, phone, region, district, address, payMethod: selectedPayMethod
        });
        const newOrder = formatOrderForUi(result.order);
        orders.unshift(newOrder);
        ordersLoaded = true;
        cart = {};
        localStorage.setItem('cart', JSON.stringify(cart));
        activePopupModal = null;
        checkoutDraft = { fullname: '', phone: '', region: 'TASHKENT', viloyat: '', district: '', address: '' };
        localStorage.removeItem('checkoutDraft');
        openOrderSuccessCelebration(newOrder.id);
      } catch (e) {
        console.error(e);
        if (String(e.message).includes('insufficient_stock')) {
          alert(tr("❌ Afsuski, savatchangizdagi bir yoki bir nechta tovar omborda tugab qoldi. Savatchani tekshiring.", "❌ Один или несколько товаров в корзине закончились. Проверьте корзину."));
        } else if (String(e.message).startsWith('blocked:')) {
          myStatus.isBlocked = true;
          myStatus.blockReason = e.message.slice('blocked:'.length);
          alert(`${tr("🚫 Siz botdan foydalanish huquqidan mahrum qilingansiz", "🚫 Доступ к оформлению заказов заблокирован")}.\n${tr('Sabab','Причина')}: ${myStatus.blockReason}`);
        } else {
          alert(tr("❌ Buyurtmani yuborishda xatolik yuz berdi. Qayta urinib ko'ring.", "❌ Не удалось отправить заказ. Попробуйте ещё раз."));
        }
      } finally {
        submittingOrder = false;
        hideLoader();
      }
    }

    function openOrderSuccessCelebration(orderId) {
      selectedProductModal = null;
      document.getElementById('modal-container').innerHTML = `
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl">
            <div class="text-5xl">🎉</div>
            <h3 class="text-xl font-black text-gray-900">${tr("Buyurtmangiz qabul qilindi!", "Ваш заказ принят!")}</h3>
            <p class="text-xs text-gray-500">${tr("Buyurtma ID:", "ID заказа:")} <b class="text-blue-600">#${orderId}</b>${tr(". FITCORE mutaxassislari tez orada siz bilan bog'lanishadi.", ". Специалисты FITCORE скоро свяжутся с вами.")}</p>
            <button onclick="document.getElementById('modal-container').innerHTML=''; switchTab('orders');" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs">
              ${tr("📦 Buyurtmalarda ko\'rish", "📦 Посмотреть в заказах")}
            </button>
          </div>
        </div>
      `;
    }

    // 4. ORDERS TAB (USER & ADMIN)
    function renderOrders(container) {
      if (ordersLoading || !ordersLoaded) {
        container.innerHTML = `<div class="py-16 text-center text-sm text-gray-500"><div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>${tr("Buyurtmalar yuklanmoqda...", "Заказы загружаются...")}</div>`;
        return;
      }
      if (isAdminMode && isUserAnAdmin) {
        // ADMIN ORDERS VIEW
        let filteredOrders = orders.filter(o => {
          const matchStatus = adminOrderFilters.status === 'ALL' || o.status === adminOrderFilters.status;
          const matchRegion = adminOrderFilters.region === 'ALL' || o.region === adminOrderFilters.region;
          const matchPayment = adminOrderFilters.payment === 'ALL' || o.payMethod === adminOrderFilters.payment;
          const matchSearch = !adminOrderFilters.search || o.user.toLowerCase().includes(adminOrderFilters.search.toLowerCase()) || o.phone.includes(adminOrderFilters.search);
          return matchStatus && matchRegion && matchPayment && matchSearch;
        });

        const totalPages = Math.ceil(filteredOrders.length / 10) || 1;
        if (ordersPage > totalPages) ordersPage = 1;
        const paginatedOrders = filteredOrders.slice((ordersPage - 1) * 10, ordersPage * 10);

        container.innerHTML = `
          <div class="space-y-4">
            <h2 class="text-lg font-bold text-slate-800">${t('all_orders')}</h2>

            <div class="bg-white p-3 rounded-2xl border space-y-2 text-xs shadow-sm">
              <input type="text" id="adm-ord-search" oninput="adminOrderFilters.search = this.value; render();" placeholder="${tr('Mijoz ismi yoki tel raqami...','Имя клиента или номер телефона...')}" value="${escapeHtml(adminOrderFilters.search)}" class="w-full p-2 border rounded-xl">

              <div class="flex gap-1 flex-wrap">
                <button onclick="setAdminStatusFilter('ALL')" class="px-2.5 py-1 rounded-lg font-bold text-[10px] ${adminOrderFilters.status === 'ALL' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}">${tr("Barchasi", "Все")}</button>
                ${['NEW', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map(st => `
                  <button onclick="setAdminStatusFilter('${st}')" class="px-2.5 py-1 rounded-lg font-bold text-[10px] ${adminOrderFilters.status === st ? statusColorClass(st) + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500'}">
                    ${statusLabel(st)}
                  </button>
                `).join('')}
              </div>

              <div class="grid grid-cols-2 gap-2">
                <select onchange="adminOrderFilters.region = this.value; render();" class="p-2 border rounded-xl bg-gray-50 font-bold">
                  <option value="ALL" ${adminOrderFilters.region === 'ALL' ? 'selected' : ''}>${tr("Barcha hududlar", "Все регионы")}</option>
                  <option value="TASHKENT" ${adminOrderFilters.region === 'TASHKENT' ? 'selected' : ''}>${tr("Toshkent shahri", "Город Ташкент")}</option>
                  <option value="PROVINCE" ${adminOrderFilters.region === 'PROVINCE' ? 'selected' : ''}>${tr("Viloyatlar", "Области")}</option>
                </select>

                <select onchange="adminOrderFilters.payment = this.value; render();" class="p-2 border rounded-xl bg-gray-50 font-bold">
                  <option value="ALL" ${adminOrderFilters.payment === 'ALL' ? 'selected' : ''}>${tr("Barcha to'lovlar", "Все способы оплаты")}</option>
                  <option value="CASH" ${adminOrderFilters.payment === 'CASH' ? 'selected' : ''}>${tr("Naqd pul", "Наличные")}</option>
                  <option value="CARD" ${adminOrderFilters.payment === 'CARD' ? 'selected' : ''}>${tr("Karta", "Карта")}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              ${paginatedOrders.length === 0 ? `<p class="text-xs text-gray-400 bg-white p-4 rounded-xl text-center">${tr("Buyurtmalar topilmadi", "Заказы не найдены")}</p>` : ''}
              ${paginatedOrders.map(o => `
                <div onclick="openOrderModal(${o.id})" class="bg-white p-3 rounded-2xl border flex items-center justify-between cursor-pointer hover:bg-gray-50 shadow-sm">
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-black text-blue-600 text-xs">#${o.id}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColorClass(o.status)}">${statusLabel(o.status)}</span>
                    </div>
                    <p class="font-bold text-xs text-gray-800 mt-1">${escapeHtml(o.user)} (${escapeHtml(o.phone)})</p>
                    <p class="text-[10px] text-gray-400">${escapeHtml(regionLabel(o.region))} | ${escapeHtml(payMethodLabel(o.payMethod))}</p>
                  </div>
                  <span class="font-bold text-xs text-green-600">${money(o.totalPrice)}</span>
                </div>
              `).join('')}
            </div>

            ${totalPages > 1 ? `
              <div class="flex justify-center space-x-2 pt-2">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => `
                  <button onclick="ordersPage = ${pNum}; render();" class="px-3 py-1 rounded-xl text-xs font-bold ${ordersPage === pNum ? 'bg-blue-600 text-white' : 'bg-white border'}">${pNum}</button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
        return;
      }

      // USER ORDERS VIEW
      let userOrders = orders.filter(o => userOrderFilter === 'ALL' || o.status === userOrderFilter);

      container.innerHTML = `
        <div class="space-y-3">
          <h2 class="text-lg font-bold text-slate-800">${t('my_orders')}</h2>

          <div class="flex space-x-1 overflow-x-auto pb-1 text-xs">
            <button onclick="userOrderFilter='ALL'; render();" class="px-2.5 py-1 rounded-xl font-bold ${userOrderFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white border text-gray-600'}">${tr("Barchasi", "Все")}</button>
            ${['NEW', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map(st => `
              <button onclick="userOrderFilter='${st}'; render();" class="px-2.5 py-1 rounded-xl font-bold ${userOrderFilter === st ? statusColorClass(st) + ' ring-2 ring-offset-1 ring-current' : 'bg-white border text-gray-500'}">${statusLabel(st)}</button>
            `).join('')}
          </div>

          ${userOrders.length === 0 ? `<p class="text-xs text-gray-500 bg-white p-4 rounded-xl text-center">${tr("Buyurtmalar topilmadi", "Заказы не найдены")}</p>` : ''}
          ${userOrders.map(o => `
            <div onclick="openOrderModal(${o.id})" class="bg-white rounded-2xl p-4 shadow-sm space-y-2 border cursor-pointer hover:bg-gray-50">
              <div class="flex justify-between items-center border-b pb-2">
                <span class="font-black text-blue-600">#${o.id}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColorClass(o.status)}">${statusLabel(o.status)}</span>
              </div>
              <p class="text-xs text-gray-500">📅 ${escapeHtml(o.date)}</p>
              <div class="text-xs space-y-1.5">
                ${o.items.map(i => `
                  <div class="flex items-center gap-2">
                    ${i.img ? `<img src="${escapeHtml(i.img)}" onerror="this.style.display='none'" class="w-7 h-7 object-cover rounded-lg flex-shrink-0" loading="lazy">` : ''}
                    <p class="font-medium">• ${escapeHtml(i.name)} ${i.size ? `<span class="text-gray-500 font-mono">[${escapeHtml(i.size)}]</span>` : ''} ${i.color ? `<span class="text-gray-500">[${escapeHtml(i.color)}]</span>` : ''} ${i.sku ? `<span class="text-gray-400 font-mono">(ID: ${escapeHtml(i.sku)})</span>` : ''} x ${i.qty}</p>
                  </div>
                `).join('')}
              </div>
              ${o.status === 'CANCELLED' && o.cancelReason ? `
                <p class="text-[10px] text-red-500">${tr('Bekor qilindi','Отменён')} (${o.cancelledBy === 'ADMIN' ? tr('do\'kon','магазин') : tr('siz','вы')}): ${escapeHtml(o.cancelReason)}</p>
              ` : ''}
              <div class="border-t pt-2 flex justify-between items-center font-bold text-sm">
                <span class="text-green-600">${money(o.totalPrice)}</span>
                ${o.status === 'NEW' ? `
                  <button onclick="cancelUserOrder(${o.id}, event)" class="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-bold">
                    ❌ ${tr("Bekor qilish", "Отмена")}
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    async function cancelUserOrder(orderId, e) {
      if (e) e.stopPropagation();
      if (!confirm(tr("Rostdan ham ushbu buyurtmani bekor qilmoqchimisiz?", "Вы действительно хотите отменить этот заказ?"))) return;
      try {
        const result = await callApi('cancel_order', { orderId });
        const updated = formatOrderForUi(result.order);
        const idx = orders.findIndex(o => o.id === updated.id);
        if (idx >= 0) orders[idx] = updated;
        alert(tr("✅ Buyurtmangiz bekor qilindi!", "✅ Заказ отменён!"));
        render();
      } catch (e2) {
        console.error(e2);
        alert(tr("❌ Xatolik yuz berdi, qayta urinib ko'ring.", "❌ Произошла ошибка. Попробуйте ещё раз."));
      }
    }

    function setAdminStatusFilter(st) {
      adminOrderFilters.status = st;
      render();
    }

    // 5. WAREHOUSE TAB
    function renderWarehouse(container) {
      const topCats = categories.filter(c => !c.parentId);

      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-slate-800">${t('warehouse_title')}</h2>
            <button onclick="warehouseMissingImageOnly=!warehouseMissingImageOnly; render();" class="px-3 py-1.5 rounded-xl text-[10px] font-bold ${warehouseMissingImageOnly?'bg-amber-500 text-white':'bg-white border text-amber-700'}">🖼 ${tr('Rasmsiz','Без фото')} (${products.filter(p=>p.status!=='DELETED'&&!p.img).length})</button>
          </div>

          <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm font-mono text-xs">
            ${topCats.map(parent => renderCategoryTreeNodeHTML(parent, 0)).join('')}
          </div>

          <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm">
            <h3 class="font-bold text-sm text-gray-800">${tr("⚡ ID orqali ko'p tovar qoldig'ini yangilash", "⚡ Массовое обновление остатков по ID")}</h3>
            <p class="text-[10px] text-gray-500">${tr("SKU va sonini kiriting (Masalan:", "Введите SKU и количество (Например:")} <b>111001 35</b>)</p>
            <textarea id="bulk-input" rows="4" class="w-full p-2.5 font-mono text-xs border rounded-xl bg-gray-50" placeholder="111001 35&#10;111002 20"></textarea>
            <button onclick="saveBulkStock()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">${tr("💾 Barchasini saqlash", "💾 Сохранить все")}</button>
          </div>
        </div>
      `;
    }

    function renderCategoryTreeNodeHTML(cat, depth) {
      const children = categories.filter(c => c.parentId === cat.id);
      const catProds = products.filter(p => p.categoryId === cat.id && p.status !== 'DELETED' && (!warehouseMissingImageOnly || !p.img));
      const indent = "&nbsp;&nbsp;".repeat(depth * 2);

      return `
        <div class="space-y-1">
          <div class="font-bold text-blue-900">
            ${indent}${depth === 0 ? '📂' : '└─ 📁'} ${escapeHtml(categoryName(cat))}
          </div>
          ${catProds.map(p => {
            const vars = productVariants(p);
            if (vars.length > 0) {
              return vars.map(v => `
                <div class="pl-4 text-[11px] text-gray-700 flex justify-between border-b pb-1 gap-2">
                  <span>${indent}&nbsp;&nbsp;* [ID: ${escapeHtml(v.sku)}] ${escapeHtml(productName(p))} ${escapeHtml(variantLabel(v))}</span>
                  <b class="${v.qty > 0 ? 'text-green-600' : 'text-red-500'}">${v.qty} ${tr('ta','шт.')}</b>
                </div>
              `).join('');
            }
            return `
              <div class="pl-4 text-[11px] text-gray-700 flex justify-between border-b pb-1">
                <span>${indent}&nbsp;&nbsp;* [ID: ${escapeHtml(p.sku)}] ${escapeHtml(productName(p))}</span>
                <b class="${p.stock > 0 ? 'text-green-600' : 'text-red-500'}">${p.stock} ${tr('ta','шт.')}</b>
              </div>
            `;
          }).join('')}
          ${children.map(child => renderCategoryTreeNodeHTML(child, depth + 1)).join('')}
        </div>
      `;
    }

    // 5.5. FOYDALANUVCHILAR (MIJOZLAR) TAB — faqat admin ko'radi
    function renderUsers(container) {
      container.innerHTML = `
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-slate-800">👥 ${t('users_title')}</h2>
          <p class="text-[11px] text-gray-500">${tr("Mijozlar buyurtmalar soni bo'yicha tartiblangan.", "Клиенты отсортированы по количеству заказов.")}</p>
          <div class="bg-white rounded-2xl border divide-y">
            ${usersLoading ? `<p class="text-xs text-blue-500 p-4 text-center">${tr("⏳ Yuklanmoqda...", "⏳ Загрузка...")}</p>` : (usersSummary.length === 0 ? `<p class="text-xs text-gray-400 p-4 text-center">${tr("Hozircha mijozlar yo'q", "Клиентов пока нет")}</p>` : '')}
            ${usersSummary.map(u => `
              <div onclick="openUserModal('${u.tgId}')" class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <div>
                  <div class="flex items-center gap-1.5">
                    <p class="font-bold text-sm text-gray-800">${escapeHtml(u.userName)}</p>
                    ${u.isBlocked ? `<span class="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">${tr("🚫 BLOK", "🚫 БЛОК")}</span>` : (u.warned ? `<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">${tr("⚠️ OGOH", "⚠️ ПРЕДУПР.")}</span>` : '')}
                  </div>
                  <p class="text-[10px] text-gray-400">${escapeHtml(u.phone || '')} · ID: ${escapeHtml(u.tgId)}</p>
                </div>
                <div class="text-right">
                  <p class="font-black text-blue-600 text-sm">${u.totalOrders} ${tr("buyurtma", "заказов")}</p>
                  <p class="text-[10px] text-gray-400">✅${u.delivered} ⏳${u.active} ❌${u.cancelled}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function openUserModal(tgId) {
      selectedUserModal = usersSummary.find(u => u.tgId === tgId);
      renderModalContainer();
    }

    function openBlockUserModal(tgId) {
      selectedUserModal = usersSummary.find(u => u.tgId === tgId);
      activePopupModal = 'BLOCK_USER';
      render();
    }

    async function refreshUsersSummary() {
      try {
        const data = await callApi('get_users_summary', {});
        usersSummary = data.users || [];
        usersLoaded = true;
      } catch (e) { console.error('Mijozlarni yangilashda xatolik:', e); }
    }

    async function submitBlockUser(tgId) {
      const reason = document.getElementById('bl-reason').value;
      const note = document.getElementById('bl-note').value.trim();
      if (!confirm(tr("Rostdan ham bu mijozni bloklaysizmi? U buyurtma bera olmaydi.", "Заблокировать этого клиента? Он не сможет оформлять заказы."))) return;
      const idx = usersSummary.findIndex(u => u.tgId === tgId);
      const old = idx >= 0 ? cloneData(usersSummary[idx]) : null;
      if (idx >= 0) {
        usersSummary[idx].isBlocked = true;
        usersSummary[idx].blockReason = reason || note || null;
      }
      activePopupModal = null;
      selectedUserModal = idx >= 0 ? usersSummary[idx] : null;
      render();
      showActionToast(tr("⏳ Bloklanmoqda...", "⏳ Блокировка..."), 'saving');
      try {
        await callApi('block_user', { tgId, reason, note });
        showActionToast(tr("✅ Mijoz bloklandi", "✅ Клиент заблокирован"), 'success', 1200);
        refreshUsersSummary().then(() => { selectedUserModal = usersSummary.find(u => u.tgId === tgId) || null; render(); });
      } catch (e) {
        console.error(e);
        if (idx >= 0 && old) usersSummary[idx] = old;
        selectedUserModal = usersSummary.find(u => u.tgId === tgId) || null;
        render();
        showActionToast(tr("❌ Amal bajarilmadi", "❌ Действие не выполнено"), 'error', 1800);
        alert(tr("❌ Xatolik yuz berdi: ", "❌ Произошла ошибка: ") + (e.message || e));
      }
    }

    async function unblockUser(tgId) {
      if (!confirm(tr("Bu mijoz blokdan chiqarilsinmi?", "Разблокировать этого клиента?"))) return;
      const idx = usersSummary.findIndex(u => u.tgId === tgId);
      const old = idx >= 0 ? cloneData(usersSummary[idx]) : null;
      if (idx >= 0) { usersSummary[idx].isBlocked = false; usersSummary[idx].blockReason = null; }
      selectedUserModal = idx >= 0 ? usersSummary[idx] : null;
      render();
      showActionToast(tr("⏳ Blokdan chiqarilmoqda...", "⏳ Разблокировка..."), 'saving');
      try {
        await callApi('unblock_user', { tgId });
        showActionToast(tr("✅ Blokdan chiqarildi", "✅ Разблокирован"), 'success', 1200);
        refreshUsersSummary().then(() => { selectedUserModal = usersSummary.find(u => u.tgId === tgId) || null; render(); });
      } catch (e) {
        console.error(e);
        if (idx >= 0 && old) usersSummary[idx] = old;
        selectedUserModal = usersSummary.find(u => u.tgId === tgId) || null;
        render();
        showActionToast(tr("❌ Amal bajarilmadi", "❌ Действие не выполнено"), 'error', 1800);
        alert(tr("❌ Xatolik yuz berdi: ", "❌ Произошла ошибка: ") + (e.message || e));
      }
    }

    // 6. PROFIL TAB (SUPER ADMIN & ADMIN MANAGEMENT)
    function cleanSocialNick(value) {
      return String(value || '').trim().replace(/^@/, '').replace(/\/+$/, '');
    }

    function shopInfoIsEmpty() {
      return !shopContact.address && !shopContact.coordinates && !shopContact.phone && !shopContact.phone2 &&
        !shopContact.phone3 && !shopContact.instagram && !shopContact.telegram;
    }

    function renderProfile(container) {
      const phones = [shopContact.phone, shopContact.phone2, shopContact.phone3].filter(Boolean);
      const instagramNick = cleanSocialNick(shopContact.instagram);
      const telegramNick = cleanSocialNick(shopContact.telegram);
      const coords = String(shopContact.coordinates || '').trim();
      const mapsUrl = coords ? `https://www.google.com/maps?q=${encodeURIComponent(coords)}` : null;

      container.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white p-5 rounded-2xl shadow-sm flex items-center space-x-4 border">
            <div class="bg-blue-100 p-3 rounded-full text-blue-600">
              <i data-lucide="user" class="w-8 h-8"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold">${escapeHtml(currentUser.firstName)} ${escapeHtml(currentUser.lastName)}</h2>
              <p class="text-xs text-gray-500">${tr("Tel:", "Тел:")} ${escapeHtml(currentUser.phone)}</p>
              <button onclick="activePopupModal='REGISTRATION'; render();" class="mt-1 text-[10px] text-blue-600 font-bold underline">${tr("Ma'lumotlarni tahrirlash", "Изменить данные")}</button>
            </div>
          </div>

          ${myStatus.isBlocked ? `
            <div class="bg-red-50 border border-red-300 p-4 rounded-2xl text-xs">
              <p class="font-bold text-red-700">${tr("🚫 Siz botdan foydalanish huquqidan mahrum qilingansiz", "🚫 Доступ к оформлению заказов заблокирован")}</p>
              <p class="text-red-600 mt-1">${tr("Sabab", "Причина")}: ${escapeHtml(myStatus.blockReason || tr("ko'rsatilmagan", "не указана"))}</p>
              <p class="text-red-500 mt-1 text-[10px]">${tr("Buyurtma berish imkoni yopilgan. Savol bo'lsa, do'kon bilan bog'laning.", "Оформление заказов недоступно. По вопросам свяжитесь с магазином.")}</p>
            </div>
          ` : myStatus.isWarned ? `
            <div class="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-xs">
              <p class="font-bold text-amber-800">${tr("⚠️ Sizga ogohlantirish berilgan", "⚠️ Вам вынесено предупреждение")}</p>
              <p class="text-amber-700 mt-1">${tr("Sabab", "Причина")}: ${escapeHtml(myStatus.warnReason || tr("ko'rsatilmagan", "не указана"))}</p>
              <p class="text-amber-600 mt-1 text-[10px]">${tr("Takrorlansa, hisobingiz bloklanishi mumkin.", "При повторении аккаунт может быть заблокирован.")}</p>
            </div>
          ` : ''}

          <div class="shop-about-card bg-white p-4 rounded-2xl shadow-sm border space-y-3">
            <div class="flex items-center justify-between gap-3 border-b pb-2">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="font-bold text-sm text-gray-900">${tr("📍 Do'kon haqida", "📍 О магазине")}</h3>
                ${(isUserAnAdmin && isAdminMode) ? `
                  <button onclick="activePopupModal='SHOP_INFO'; render();" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">✏️ ${tr("Tahrirlash", "Изменить")}</button>
                ` : ''}
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${shopLogoUrl ? `<img id="shop-about-logo" src="${escapeHtml(shopLogoUrl)}" class="h-10 max-w-[100px] object-contain rounded-lg bg-slate-50 p-1 border">` : `<div id="shop-about-logo-empty" class="h-10 min-w-10 px-2 rounded-lg bg-slate-50 border flex items-center justify-center text-[9px] font-bold text-slate-400">FITCORE</div>`}
                ${(isUserAnAdmin && isAdminMode) ? `
                  <label class="cursor-pointer text-[10px] font-bold px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200" title="${tr('Logotip qo\'shish/almashtirish','Добавить/заменить логотип')}">
                    🖼️
                    <input type="file" accept="image/*" class="hidden" onchange="saveShopLogoFromPicker(event)">
                  </label>
                ` : ''}
              </div>
            </div>

            ${shopContact.address ? `
              <div class="flex items-start space-x-3">
                <i data-lucide="map-pin" class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"></i>
                <p class="text-xs font-bold text-gray-800">${escapeHtml(shopContact.address)}</p>
              </div>
            ` : ''}

            ${mapsUrl ? `
              <a href="${escapeHtml(mapsUrl)}" target="_blank" class="flex items-center space-x-3 active:bg-gray-50 rounded-xl p-1 -m-1">
                <i data-lucide="navigation" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
                <div>
                  <p class="text-xs font-bold text-blue-700">${tr("Xaritada ochish", "Открыть на карте")} →</p>
                  <p class="text-[10px] text-gray-400 font-mono">${escapeHtml(coords)}</p>
                </div>
              </a>
            ` : ''}

            <div class="flex items-center space-x-3">
              <i data-lucide="clock" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
              <p class="text-xs font-bold text-gray-800">${tr("Ish vaqti", "Время работы")}: 10:00 – 22:00</p>
            </div>

            ${phones.map(phone => `
              <a href="tel:${escapeHtml(String(phone).replace(/[^\d+]/g, ''))}" class="flex items-center space-x-3 active:bg-gray-50 rounded-xl p-1 -m-1">
                <i data-lucide="phone" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
                <p class="text-xs font-bold text-gray-800">${escapeHtml(phone)}</p>
              </a>
            `).join('')}

            ${instagramNick ? `
              <a href="https://instagram.com/${encodeURIComponent(instagramNick)}" target="_blank" class="flex items-center space-x-3 active:bg-gray-50 rounded-xl p-1 -m-1">
                <span class="w-4 h-4 flex items-center justify-center text-sm flex-shrink-0">📸</span>
                <p class="text-xs font-bold text-gray-800">Instagram: @${escapeHtml(instagramNick)}</p>
              </a>
            ` : ''}

            ${telegramNick ? `
              <a href="https://t.me/${encodeURIComponent(telegramNick)}" target="_blank" class="flex items-center space-x-3 active:bg-gray-50 rounded-xl p-1 -m-1">
                <span class="w-4 h-4 flex items-center justify-center text-sm flex-shrink-0">✈️</span>
                <p class="text-xs font-bold text-gray-800">Telegram: @${escapeHtml(telegramNick)}</p>
              </a>
            ` : ''}

            ${shopInfoIsEmpty() ? `
              <p class="text-[11px] text-gray-400 text-center py-2">${(isUserAnAdmin && isAdminMode) ? tr("Do'kon ma'lumotlarini ✏️ Tahrirlash orqali kiriting.", "Заполните данные магазина через ✏️ Изменить.") : ''}</p>
            ` : ''}
          </div>

          ${isUserAnAdmin ? `
            <button onclick="toggleAdminRole()" class="w-full bg-gradient-to-r ${isAdminMode ? 'from-amber-600 to-amber-700' : 'from-slate-700 to-slate-800'} text-white p-4 rounded-2xl flex items-center justify-between font-bold shadow-md">
              <span>${isAdminMode ? '👤 User rejimiga o\'tish' : '🛡️ Admin rejimiga o\'tish'}</span>
              <i data-lucide="refresh-cw" class="w-5 h-5"></i>
            </button>
          ` : ''}

          <!-- BOSH ADMINGA VA ADMINLARGA KO'RINADIGAN BO'LIM -->
          ${(isSuperAdmin && isAdminMode) ? `
            <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm">
              <div class="flex justify-between items-center border-b pb-2">
                <h3 class="font-bold text-xs text-amber-900">${tr("👑 Adminlarni boshqarish (Bosh Admin)", "👑 Управление администраторами (Главный админ)")}</h3>
                <button onclick="activePopupModal='ADD_ADMIN'; render();" class="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-sm">
                  <span>${tr("➕ Yangi admin qo'shish", "➕ Добавить администратора")}</span>
                </button>
              </div>

              <div class="space-y-1 text-xs">
                ${adminsList.map(admId => `
                  <div class="flex justify-between items-center p-2 bg-gray-50 rounded-xl border">
                    <span class="font-mono text-gray-700">ID: ${escapeHtml(admId)} ${admId === currentTgId && isSuperAdmin ? `<b>${tr("(Bosh Admin)", "(Главный админ)")}</b>` : ''}</span>
                    ${!(admId === currentTgId && isSuperAdmin) ? `
                      <button onclick="removeAdmin('${admId}')" class="text-red-600 font-bold px-2 py-0.5 bg-red-50 rounded-lg">🗑️</button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    async function saveShopContact() {
      const next = {
        address: document.getElementById('sc-address').value.trim() || null,
        coordinates: document.getElementById('sc-coordinates').value.trim() || null,
        phone: document.getElementById('sc-phone1').value.trim() || null,
        phone2: document.getElementById('sc-phone2').value.trim() || null,
        phone3: document.getElementById('sc-phone3').value.trim() || null,
        instagram: cleanSocialNick(document.getElementById('sc-instagram').value) || null,
        telegram: cleanSocialNick(document.getElementById('sc-telegram').value) || null,
      };

      if (next.coordinates && !/^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/.test(next.coordinates)) {
        return alert(tr("Kordinatani '41.217408,69.211225' ko'rinishida yozing.", "Введите координаты в формате '41.217408,69.211225'."));
      }

      const old = { ...shopContact };
      shopContact = next;
      activePopupModal = null;
      render(); // optimistic UI — darhol ko'rinadi
      try {
        await callApi('set_shop_contact', next);
      } catch (e) {
        console.error(e);
        shopContact = old;
        render();
        alert(tr("❌ Do'kon ma'lumotlarini saqlab bo'lmadi: ", "❌ Не удалось сохранить данные магазина: ") + (e.message || e));
      }
    }

    async function uploadImageFileQuiet(file, existingUrl) {
      const prepared = await compressImage(file, 1000, 0.8);
      const ext = (prepared.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      let lastErr = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { path, token } = await callApi('get_upload_url', { ext });
          const { error: upErr } = await sb.storage.from(CONFIG.IMAGES_BUCKET).uploadToSignedUrl(path, token, prepared);
          if (upErr) throw upErr;
          const { data: pub } = sb.storage.from(CONFIG.IMAGES_BUCKET).getPublicUrl(path);
          return pub?.publicUrl || existingUrl || null;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('image_upload_failed');
    }

    async function saveShopLogoFromPicker(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return alert(tr("⚠️ Faqat rasm faylini tanlang!", "⚠️ Выберите файл изображения!"));
      if (file.size > 15 * 1024 * 1024) return alert(tr("⚠️ Rasm hajmi 15MB dan oshmasligi kerak!", "⚠️ Размер изображения не должен превышать 15 МБ!"));

      const old = shopLogoUrl;
      const localPreview = URL.createObjectURL(file);
      shopLogoUrl = localPreview;
      render(); // darhol preview
      try {
        const url = await uploadImageFileQuiet(file, old);
        await callApi('set_shop_logo', { logoUrl: url });
        shopLogoUrl = url;
        render();
      } catch (e) {
        console.error(e);
        shopLogoUrl = old;
        render();
        alert(tr("❌ Logotipni saqlab bo'lmadi: ", "❌ Не удалось сохранить логотип: ") + (e.message || e));
      } finally {
        URL.revokeObjectURL(localPreview);
        event.target.value = '';
      }
    }

    async function removeAdmin(admId) {
      if (!confirm(tr("Ushbu admin huquqini bekor qilmoqchimisiz?", "Удалить права этого администратора?"))) return;
      const idx = adminsList.indexOf(admId);
      if (idx < 0) return;
      adminsList.splice(idx, 1);
      render();
      showActionToast(tr("⏳ Admin o'chirilmoqda...", "⏳ Администратор удаляется..."), 'saving');
      try {
        await callApi('remove_admin', { tgId: admId });
        showActionToast(tr("✅ Admin o'chirildi", "✅ Администратор удалён"), 'success', 1200);
      } catch (e) {
        console.error(e);
        adminsList.splice(Math.min(idx, adminsList.length), 0, admId);
        render();
        showActionToast(tr("❌ O'chirilmadi", "❌ Не удалён"), 'error', 1800);
        alert(tr("❌ Xatolik yuz berdi: ", "❌ Произошла ошибка: ") + (e.message || e));
      }
    }

    // MODALS ENGINE
    function renderModalContainer() {
      const container = document.getElementById('modal-container');

      // REGISTRATION MODAL
      if (activePopupModal === 'REGISTRATION') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2 text-center">${tr("📝 FITCORE ro'yxatdan o'tish", "📝 Регистрация FITCORE")}</h3>
              <p class="text-[11px] text-gray-500 text-center">${tr("Buyurtmani tez rasmiylashtirish uchun ma'lumotlaringizni kiriting:", "Введите данные для быстрого оформления заказов:")}</p>
              <div>
                <label class="font-bold text-gray-600">${tr("Ismingiz *", "Имя *")}</label>
                <input type="text" id="reg-fname" value="${escapeHtml(currentUser.firstName)}" placeholder="Ali" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Familiyangiz *", "Фамилия *")}</label>
                <input type="text" id="reg-lname" value="${escapeHtml(currentUser.lastName)}" placeholder="Valiyev" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Telefon raqamingiz *", "Номер телефона *")}</label>
                <input type="text" id="reg-phone" value="${escapeHtml(currentUser.phone)}" placeholder="+998 90 123 45 67" class="w-full mt-1 p-2 border rounded-xl font-mono">
              </div>
              <div class="pt-2">
                <button onclick="saveRegistrationFromModal()" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr("✅ Saqlash", "✅ Сохранить")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'SHOP_INFO') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("✏️ Do'kon haqida", "✏️ О магазине")}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr("Manzil", "Адрес")}</label>
                <input type="text" id="sc-address" value="${escapeHtml(shopContact.address || '')}" placeholder="Sergeli tumani, ..." class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Kordinata", "Координаты")}</label>
                <input type="text" id="sc-coordinates" value="${escapeHtml(shopContact.coordinates || '')}" placeholder="41.217408,69.211225" class="w-full mt-1 p-2 border rounded-xl font-mono">
                <p class="text-[9px] text-gray-400 mt-1">${tr("Google Maps'dan koordinatani nusxa qilib qo'ying.", "Вставьте координаты из Google Maps.")}</p>
              </div>
              <div class="grid grid-cols-1 gap-2">
                <div><label class="font-bold text-gray-600">${tr("Telefon 1", "Телефон 1")}</label><input type="text" id="sc-phone1" value="${escapeHtml(shopContact.phone || '')}" placeholder="+998 90 123 45 67" class="w-full mt-1 p-2 border rounded-xl font-mono"></div>
                <div><label class="font-bold text-gray-600">${tr("Telefon 2 (ixtiyoriy)", "Телефон 2 (необязательно)")}</label><input type="text" id="sc-phone2" value="${escapeHtml(shopContact.phone2 || '')}" placeholder="+998 90 123 45 67" class="w-full mt-1 p-2 border rounded-xl font-mono"></div>
                <div><label class="font-bold text-gray-600">${tr("Telefon 3 (ixtiyoriy)", "Телефон 3 (необязательно)")}</label><input type="text" id="sc-phone3" value="${escapeHtml(shopContact.phone3 || '')}" placeholder="+998 90 123 45 67" class="w-full mt-1 p-2 border rounded-xl font-mono"></div>
              </div>
              <div>
                <label class="font-bold text-gray-600">Instagram ${tr("nickname", "никнейм")}</label>
                <div class="flex items-center mt-1"><span class="px-2 py-2 bg-slate-50 border border-r-0 rounded-l-xl text-gray-500">@</span><input type="text" id="sc-instagram" value="${escapeHtml(cleanSocialNick(shopContact.instagram))}" placeholder="fitcore.uz.sergeli" class="flex-1 p-2 border rounded-r-xl"></div>
              </div>
              <div>
                <label class="font-bold text-gray-600">Telegram ${tr("nickname", "никнейм")}</label>
                <div class="flex items-center mt-1"><span class="px-2 py-2 bg-slate-50 border border-r-0 rounded-l-xl text-gray-500">@</span><input type="text" id="sc-telegram" value="${escapeHtml(cleanSocialNick(shopContact.telegram))}" placeholder="fitcore_uz" class="flex-1 p-2 border rounded-r-xl"></div>
              </div>
              <p class="text-[10px] text-gray-400">${tr("Bo'sh qoldirilgan maydonlar foydalanuvchiga umuman ko'rinmaydi.", "Пустые поля вообще не показываются пользователю.")}</p>
              <div class="flex gap-2 pt-2">
                <button onclick="saveShopContact()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'ADD_PROD') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("➕ Yangi tovar qo'shish", "➕ Добавить новый товар")}</h3>

              <div>
                <label class="font-bold text-gray-600">${tr("Tovar nomi *", "Название товара *")}</label>
                <input type="text" id="m-prod-name" placeholder="${tr('Masalan: Whey Protein','Например: Whey Protein')}" class="w-full mt-1 p-2 border rounded-xl">
                <input type="text" id="m-prod-name-ru" placeholder="${tr('Rus tilida nomi','Название на русском')}" class="w-full mt-1 p-2 border rounded-xl hidden">
              </div>

              <label class="flex items-center gap-2 font-bold text-gray-600">
                <input type="checkbox" id="m-prod-ru-toggle" onchange="toggleRuFields(this.checked, 'm-prod')">
                <span>${tr("+ Ruscha tarjima qo'shish", "+ Добавить русский перевод")}</span>
              </label>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="font-bold text-gray-600">${tr("Sotuv narxi *", "Цена продажи *")}</label>
                  <input type="number" id="m-prod-price" placeholder="400000" class="w-full mt-1 p-2 border rounded-xl">
                </div>
                <div>
                  <label class="font-bold text-gray-600">${tr("Eski narxi (Chegirma)", "Старая цена (скидка)")}</label>
                  <input type="number" id="m-prod-oldprice" placeholder="480000" class="w-full mt-1 p-2 border rounded-xl">
                </div>
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Ombor qoldig'i (Soni) *", "Остаток на складе *")}</label>
                <input type="number" id="m-prod-stock" placeholder="15" class="w-full mt-1 p-2 border rounded-xl">
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("O'lchamlar (ixtiyoriy)", "Размеры (необязательно)")}</label>
                <input type="text" id="m-prod-sizes" placeholder="48,2/50,5/52,17 yoki 48/50/52" class="w-full mt-1 p-2 border rounded-xl">
                <p class="text-[9px] text-gray-400 mt-0.5">${tr("Faqat o'lcham bo'lsa:", "Если только размеры:")} <b>48,2/50,5</b>${tr(". Rang ham bo'lsa, o'lchamlarni", ". Если есть цвета, размеры можно указать")} <b>48/50/52</b> ${tr("ko'rinishida yozish mumkin.", "в таком формате.")}</p>
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Ranglar (ixtiyoriy)", "Цвета (необязательно)")}</label>
                <input type="text" id="m-prod-colors" placeholder="48,Qizil-1,Qora-1/50,Qizil-3,Ko'k-3 yoki Qizil-3/Qora-2" class="w-full mt-1 p-2 border rounded-xl">
                <p class="text-[9px] text-gray-400 mt-0.5">${tr("Rang majburiy emas. Rang kiritilsa, haqiqiy qoldiq rang variantlarining yig'indisidan hisoblanadi.", "Цвет необязателен. Если указаны цвета, общий остаток рассчитывается по сумме цветовых вариантов.")}</p>
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Izoh / Tavsif", "Описание")}</label>
                <textarea id="m-prod-desc" rows="2" placeholder="${tr('Tovar haqida ma\'lumot','Описание товара')}" class="w-full mt-1 p-2 border rounded-xl"></textarea>
                <textarea id="m-prod-desc-ru" rows="2" placeholder="${tr('Rus tilida izoh','Описание на русском')}" class="w-full mt-1 p-2 border rounded-xl hidden"></textarea>
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Tovar rasmi (Xotiradan yuklash)", "Фото товара (загрузить с устройства)")}</label>
                <input type="file" accept="image/*" onchange="onImagePicked(event, 'm-prod-prev')" class="w-full mt-1 text-xs">
                <img id="m-prod-prev" src="" class="w-20 h-20 object-cover rounded-xl mt-2 hidden border">
              </div>

              <div class="flex space-x-2 pt-2">
                <button onclick="saveProductFromModal()" class="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl">${tr("✅ Saqlash va omborga kiritish", "✅ Сохранить и добавить на склад")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'ADD_CAT') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("📂 Yangi katalog qo'shish", "📂 Добавить новый каталог")}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog nomi *", "Название каталога *")}</label>
                <input type="text" id="m-cat-name" placeholder="${tr('Masalan: Proteinlar','Например: Протеины')}" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog nomi — ruscha (ixtiyoriy)", "Название каталога на русском (необязательно)")}</label>
                <input type="text" id="m-cat-name-ru" placeholder="Например: Протеины" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog rasmi (Xotiradan yuklash):", "Изображение каталога (загрузить с устройства):")}</label>
                <input type="file" accept="image/*" onchange="onImagePicked(event, 'm-cat-prev')" class="w-full mt-1 text-xs">
                <img id="m-cat-prev" src="" class="w-16 h-16 object-cover rounded-xl mt-2 hidden border">
              </div>
              <div class="flex space-x-2 pt-2">
                <button onclick="saveCategoryFromModal()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'EDIT_CAT') {
        const c = selectedCategoryModal;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("✏️ Katalogni tahrirlash", "✏️ Редактировать каталог")}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog nomi *", "Название каталога *")}</label>
                <input type="text" id="ec-name" value="${escapeHtml(c.name)}" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog nomi — ruscha (ixtiyoriy)", "Название каталога на русском (необязательно)")}</label>
                <input type="text" id="ec-name-ru" value="${escapeHtml(c.nameRu || '')}" class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Katalog rasmi (Xotiradan yuklash):", "Изображение каталога (загрузить с устройства):")}</label>
                <input type="file" accept="image/*" onchange="onImagePicked(event, 'ec-img-prev')" class="w-full mt-1 text-xs">
                <img id="ec-img-prev" src="${escapeHtml((c.img && (c.img.startsWith('http') || c.img.startsWith('data:'))) ? c.img : '')}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-16 h-16 object-cover rounded-xl mt-2 ${(c.img && (c.img.startsWith('http') || c.img.startsWith('data:'))) ? '' : 'hidden'} border">
              </div>
              <div class="flex space-x-2 pt-2">
                <button onclick="saveCategoryEdit('${c.id}')" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'EXCEL_IMPORT') {
        if (window.FitcoreExcel && typeof window.FitcoreExcel.renderModal === 'function') {
          container.innerHTML = window.FitcoreExcel.renderModal();
        } else {
          container.innerHTML = `<div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div class="bg-white rounded-3xl p-6 text-center text-sm">${tr("⏳ Excel moduli yuklanmoqda...", "⏳ Модуль Excel загружается...")}</div></div>`;
        }
        return;
      }

      if (activePopupModal === 'ADD_ADMIN') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("👑 Yangi admin qo'shish", "👑 Добавить администратора")}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr("Telegram ID raqami *", "Telegram ID *")}</label>
                <input type="number" id="m-admin-id" placeholder="Masalan: 123456789" class="w-full mt-1 p-2 border rounded-xl font-mono">
              </div>
              <div class="flex space-x-2 pt-2">
                <button onclick="saveAdminFromModal()" class="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-xl">${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'EDIT_PROD_FIELD') {
        const p = selectedProductModal;
        const field = editingFieldData;

        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("✏️ Ma'lumotni tahrirlash", "✏️ Редактирование данных")}</h3>

              ${field === 'name' ? `
                <label class="font-bold text-gray-600">${tr("Yangi nomi:", "Новое название:")}</label>
                <input type="text" id="ef-val" value="${escapeHtml(p.name)}" class="w-full p-2 border rounded-xl">
                <label class="font-bold text-gray-600 mt-2 block">${tr("Ruscha nomi (ixtiyoriy):", "Название на русском (необязательно):")}</label>
                <input type="text" id="ef-val-ru" value="${escapeHtml(p.nameRu || '')}" placeholder="${tr('Rus tilida nomi','Название на русском')}" class="w-full p-2 border rounded-xl">
              ` : ''}

              ${field === 'price' ? `
                <div>
                  <label class="font-bold text-gray-600">${tr("Yangi sotuv narxi *", "Новая цена продажи *")}</label>
                  <input type="number" id="ef-price" value="${p.price}" class="w-full p-2 border rounded-xl">
                </div>
                <div class="mt-2">
                  <label class="font-bold text-gray-600">${tr("Eski narxi (Chegirma)", "Старая цена (скидка)")}</label>
                  <input type="number" id="ef-oldprice" value="${p.oldPrice || ''}" placeholder="${tr('Kattaroq narx','Старая/более высокая цена')}" class="w-full p-2 border rounded-xl">
                </div>
              ` : ''}

              ${field === 'stock' ? `
                <label class="font-bold text-gray-600">${tr("Yangi ombor qoldig'i:", "Новый остаток:")}</label>
                <input type="number" id="ef-val" value="${p.stock}" class="w-full p-2 border rounded-xl">
              ` : ''}

              ${field === 'desc' ? `
                <label class="font-bold text-gray-600">${tr("Yangi izoh / tavsif:", "Новое описание:")}</label>
                <textarea id="ef-val" rows="3" class="w-full p-2 border rounded-xl">${escapeHtml(p.desc || '')}</textarea>
                <label class="font-bold text-gray-600 mt-2 block">${tr("Ruscha izoh (ixtiyoriy):", "Описание на русском (необязательно):")}</label>
                <textarea id="ef-val-ru" rows="3" class="w-full p-2 border rounded-xl">${escapeHtml(p.descRu || '')}</textarea>
              ` : ''}

              ${field === 'img' ? `
                <label class="font-bold text-gray-600">${tr("Yangi rasm (Xotiradan yuklash):", "Новое фото (загрузить с устройства):")}</label>
                <input type="file" accept="image/*" onchange="onImagePicked(event, 'ef-img-prev')" class="w-full mt-1 text-xs">
                <img id="ef-img-prev" src="${escapeHtml(p.img || '')}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-24 h-24 object-cover rounded-xl mt-2 border">
              ` : ''}

              ${(field === 'variants' || field === 'sizes') ? (() => { const vf = formatVariantInputs(productVariants(p)); return `
                <label class="font-bold text-gray-600">${tr("O'lchamlar:", "Размеры:")}</label>
                <input type="text" id="ef-size-val" value="${escapeHtml(vf.sizes)}" placeholder="48,2/50,5 yoki 48/50" class="w-full p-2 border rounded-xl">
                <label class="font-bold text-gray-600 mt-2 block">${tr("Ranglar:", "Цвета:")}</label>
                <input type="text" id="ef-color-val" value="${escapeHtml(vf.colors)}" placeholder="48,Qizil-1,Qora-1/50,Ko'k-3 yoki Qizil-3/Qora-2" class="w-full p-2 border rounded-xl">
                <p class="text-[10px] text-gray-400 mt-1">${tr("Rang majburiy emas. Variantlar bo'lsa umumiy qoldiq avtomatik hisoblanadi.", "Цвет необязателен. При наличии вариантов общий остаток рассчитывается автоматически.")}</p>
              `; })() : ''}

              <div class="flex space-x-2 pt-2">
                <button onclick="saveFieldEdit('${p.id}', '${field}')" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // BLOKLASH MODAL (bu tekshiruv "USER DETAILS MODAL"dan OLDIN turishi shart,
      // aks holda selectedUserModal hali ham to'ldirilgan bo'lgani uchun
      // eski mijoz kartochkasi qayta ko'rsatilib, bu oyna umuman ochilmaydi)
      if (activePopupModal === 'BLOCK_USER') {
        const u = selectedUserModal;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("🚫 Mijozni bloklash", "🚫 Заблокировать клиента")}</h3>
              <p class="text-gray-600">${tr("Mijoz:", "Клиент:")} <b>${escapeHtml(u.userName)}</b></p>
              <p class="text-red-600 text-[11px]">${tr("⚠️ Bloklangan mijoz buyurtma bera olmaydi.", "⚠️ Заблокированный клиент не сможет оформлять заказы.")}</p>
              <div>
                <label class="font-bold text-gray-600">${tr("Sabab *", "Причина *")}</label>
                <select id="bl-reason" class="w-full mt-1 p-2 border rounded-xl bg-gray-50 font-bold">
                  <option value="${tr("To'lovda muammo bo'lgan", "Проблема с оплатой")}">${tr("To'lovda muammo bo'lgan", "Проблема с оплатой")}</option>
                  <option value="${tr("Buyurtmani qabul qilmagan/bekor qilgan", "Не принял/отменил заказ")}">${tr("Buyurtmani qabul qilmagan/bekor qilgan", "Не принял/отменил заказ")}</option>
                  <option value="${tr("Boshqa", "Другое")}">${tr("Boshqa", "Другое")}</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Izoh (ixtiyoriy)", "Комментарий (необязательно)")}</label>
                <textarea id="bl-note" rows="2" placeholder="${tr("Qo'shimcha tushuntirish...",'Дополнительное пояснение...')}" class="w-full mt-1 p-2 border rounded-xl"></textarea>
              </div>
              <div class="flex gap-2 pt-2">
                <button onclick="submitBlockUser('${u.tgId}')" class="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl">${tr("🚫 Bloklash", "🚫 Заблокировать")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // CHECKOUT FORM MODAL (savatchadan "Buyurtma berish" bosilganda ochiladi)
      if (activePopupModal === 'CHECKOUT_FORM') {
        const items = Object.entries(cart).map(([key, itemData]) => {
          const productId = cartEntryProductId(key, itemData);
          const p = products.find(prod => prod.id === productId);
          return p ? { ...p, key, qty: itemData.qty, size: itemData.size || null } : null;
        }).filter(Boolean);
        const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="closeCheckoutForm();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("📍 Buyurtmani rasmiylashtirish", "📍 Оформление заказа")}</h3>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("Ism va familiyangiz *", "Имя и фамилия *")}</label>
                <input type="text" id="chk-fullname" oninput="saveCheckoutDraft()" placeholder="Ali Valiyev" class="w-full mt-1 p-2.5 border rounded-xl text-xs">
              </div>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("Telefon raqamingiz *", "Номер телефона *")}</label>
                <input type="text" id="chk-phone" oninput="saveCheckoutDraft()" placeholder="+998 90 123 45 67" class="w-full mt-1 p-2.5 border rounded-xl text-xs font-mono">
              </div>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("Hududni tanlang *", "Выберите регион *")}</label>
                <select id="chk-region" onchange="handleRegionChange(); saveCheckoutDraft();" class="w-full mt-1 p-2.5 border rounded-xl text-xs bg-gray-50 font-bold">
                  <option value="TASHKENT">${tr("Toshkent shahri (Bepul yetkazib berish)", "Город Ташкент (бесплатная доставка)")}</option>
                  <option value="PROVINCE">${tr("Viloyatlar (BTS Pochta)", "Области (почта BTS)")}</option>
                </select>
              </div>

              <div id="bts-warning" class="hidden bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-800 font-medium">
                ${tr("⚠️ Viloyatlarga BTS pochta orqali jo'natiladi. Yo'l kira mijoz tomonidan to'lanadi.", "⚠️ В области отправка осуществляется через почту BTS. Стоимость доставки оплачивает клиент.")}
              </div>

              <div id="chk-viloyat-wrap" class="hidden">
                <label class="text-xs font-bold text-gray-600">${tr("Viloyatni tanlang *", "Выберите область *")}</label>
                <select id="chk-viloyat" onchange="handleViloyatChange(); saveCheckoutDraft();" class="w-full mt-1 p-2.5 border rounded-xl text-xs bg-gray-50 font-bold">
                  <option value="">${tr("— Tanlang —", "— Выберите —")}</option>
                </select>
              </div>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("Tumanni tanlang *", "Выберите район *")}</label>
                <select id="chk-district" onchange="saveCheckoutDraft()" class="w-full mt-1 p-2.5 border rounded-xl text-xs bg-gray-50 font-bold">
                  <option value="">${tr("— Tanlang —", "— Выберите —")}</option>
                </select>
              </div>

              <div>
                <label id="chk-address-label" class="text-xs font-bold text-gray-600">${tr("Manzil *", "Адрес *")}</label>
                <input type="text" id="chk-address" oninput="saveCheckoutDraft()" placeholder="${tr("Ko'cha, mahalla va uy raqami",'Улица, махалля и номер дома')}" class="w-full mt-1 p-2.5 border rounded-xl text-xs">
              </div>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("To'lov turi *", "Способ оплаты *")}</label>
                <div id="pay-method-wrap" class="grid grid-cols-2 gap-2 mt-1">
                  <button type="button" id="pay-cash-btn" onclick="selectPayment('CASH')" class="py-2.5 border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs">💵 ${tr("Naqd pul", "Наличные")}</button>
                  <button type="button" id="pay-card-btn" onclick="selectPayment('CARD')" class="py-2.5 border rounded-xl font-bold text-xs text-gray-400 bg-gray-50">
                    ${tr("💳 Karta orqali", "💳 Картой")}
                    <span class="block text-[9px] text-gray-400">${tr("(Tez kunda)", "(Скоро)")}</span>
                  </button>
                </div>
              </div>

              <div class="border-t pt-3 flex justify-between items-center text-lg font-black">
                <span>${t('total')}:</span>
                <span class="text-green-600">${money(total)}</span>
              </div>

              <button onclick="submitOrder()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm shadow-md">
                ✅ Rasmiylashtirish
              </button>
            </div>
          </div>
        `;
        applyCheckoutDraftToForm();
        return;
      }

      // KATALOG FILTR/SARALASH PANELI
      if (activePopupModal === 'CAT_FILTER') {
        const sortBtnClass = (key) => {
          const v = categoryFilter[key];
          if (v === 'asc') return 'bg-blue-600 text-white';
          if (v === 'desc') return 'bg-blue-600 text-white';
          return 'bg-gray-100 text-gray-600';
        };
        const sortBtnArrow = (key) => {
          const v = categoryFilter[key];
          if (v === 'asc') return '↑';
          if (v === 'desc') return '↓';
          return '';
        };
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="closeCategoryFilterModal();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("🔍 Filtr va saralash", "🔍 Фильтр и сортировка")}</h3>

              <div>
                <label class="font-bold text-gray-600">${tr("Narx oralig'i (so'm)", "Диапазон цен (сум)")}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" inputmode="numeric" placeholder="${tr('Dan','От')}" value="${escapeHtml(categoryFilter.minPrice)}" oninput="setCategoryPriceBound('minPrice', this.value)" class="w-full p-2.5 border rounded-xl">
                  <span class="text-gray-400">—</span>
                  <input type="number" inputmode="numeric" placeholder="${tr('Gacha','До')}" value="${escapeHtml(categoryFilter.maxPrice)}" oninput="setCategoryPriceBound('maxPrice', this.value)" class="w-full p-2.5 border rounded-xl">
                </div>
              </div>

              <div class="space-y-2">
                <label class="font-bold text-gray-600">${tr("Saralash", "Сортировка")}</label>
                <button onclick="toggleCategorySortOption('sortPrice')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold ${sortBtnClass('sortPrice')}">
                  <span>${tr("💰 Narx bo'yicha", "💰 По цене")}</span><span>${sortBtnArrow('sortPrice')}</span>
                </button>
                <button onclick="toggleCategorySortOption('sortNew')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold ${sortBtnClass('sortNew')}">
                  <span>${tr("🆕 Yangiligi bo'yicha", "🆕 По новизне")}</span><span>${sortBtnArrow('sortNew')}</span>
                </button>
                <button onclick="toggleCategorySortOption('sortSold')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold ${sortBtnClass('sortSold')}">
                  <span>${tr("🔥 Ko'p sotib olinganlari", "🔥 По популярности")}</span><span>${sortBtnArrow('sortSold')}</span>
                </button>
                <p class="text-[10px] text-gray-400">${tr("Har birini bosganda: o'chiq → o'suvchi (↑) → kamayuvchi (↓) → o'chiq. Bir nechtasi yoqilsa, tepadagisi ustuvor.", "Нажатие меняет режим: выкл. → по возрастанию (↑) → по убыванию (↓) → выкл. Если выбрано несколько, верхний имеет приоритет.")}</p>
              </div>

              <div class="flex gap-2 pt-1">
                <button onclick="clearCategoryFilter()" class="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl">${tr("🗑️ Filtrni tozalash", "🗑️ Сбросить фильтр")}</button>
                <button onclick="closeCategoryFilterModal()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr("✅ Tayyor", "✅ Готово")}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // PRODUCT DETAILS MODAL
      if (selectedProductModal) {
        const p = selectedProductModal;
        const inCart = cart[p.id];
        const hasDiscount = p.oldPrice && p.oldPrice > p.price;

        container.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="selectedProductModal=null; render();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl" onclick="event.stopPropagation()">
              <div class="relative">
                <img src="${escapeHtml(p.img || FALLBACK_IMG.replace('150','300'))}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-full h-48 object-cover rounded-2xl border">
                ${(isAdminMode && isUserAnAdmin) ? `
                  <button onclick="openEditFieldModal('${p.id}', 'img')" class="absolute bottom-2 right-2 bg-blue-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shadow">
                    <span>${tr("✏️ Rasmni o'zgartirish", "✏️ Изменить фото")}</span>
                  </button>
                ` : ''}
              </div>

              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  ${(isAdminMode && isUserAnAdmin) ? `<span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">ID: ${escapeHtml(p.sku)}</span>` : '<span></span>'}
                  ${(isAdminMode && isUserAnAdmin) ? `<button onclick="deleteProduct('${p.id}'); selectedProductModal=null; render();" class="text-xs bg-red-50 text-red-600 font-bold px-2 py-1 rounded-lg">${tr("🗑️ O'chirish", "🗑️ Удалить")}</button>` : ''}
                </div>

                <!-- NAME WITH EDIT -->
                <div class="flex justify-between items-center pt-1">
                  <h2 class="text-lg font-black text-gray-900">${escapeHtml(productName(p))}</h2>
                  ${(isAdminMode && isUserAnAdmin) ? `<button onclick="openEditFieldModal('${p.id}', 'name')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>` : ''}
                </div>

                <!-- PRICE WITH EDIT -->
                <div class="flex justify-between items-center pt-1">
                  <div>
                    ${hasDiscount ? `
                      <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400 line-through font-bold">${money(p.oldPrice)}</span>
                        <span class="text-base text-red-600 font-black">${money(p.price)}</span>
                      </div>
                    ` : `
                      <p class="text-base font-black text-blue-600">${money(p.price)}</p>
                    `}
                  </div>
                  ${(isAdminMode && isUserAnAdmin) ? `<button onclick="openEditFieldModal('${p.id}', 'price')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>` : ''}
                </div>

                <!-- STOCK WITH EDIT -->
                ${(isAdminMode && isUserAnAdmin) ? `
                  <div class="flex justify-between items-center pt-1 text-xs">
                    <span class="font-bold text-gray-600">${tr("Ombor qoldig'i:", "Остаток на складе:")} <b class="${p.stock > 0 ? 'text-green-600' : 'text-red-500'}">${p.stock} ${tr('ta','шт.')}</b></span>
                    ${productVariants(p).length ? '' : `<button onclick="openEditFieldModal('${p.id}', 'stock')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>`}
                  </div>
                  <div class="flex justify-between items-start gap-2 pt-1 text-xs">
                    <span class="font-bold text-gray-600 flex-1">${tr("Variantlar:", "Варианты:")} <b>${productVariants(p).length ? escapeHtml(productVariants(p).map(v => `${variantLabel(v)} (${v.qty} ta, ID:${v.sku})`).join(', ')) : tr('kiritilmagan','не указано')}</b></span>
                    <button onclick="openEditFieldModal('${p.id}', 'variants')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>
                  </div>
                ` : ''}
              </div>

              <!-- TAVSIF WITH EDIT -->
              <div class="bg-gray-50 p-3 rounded-2xl border text-xs space-y-1 relative">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-gray-700">${tr("📝 Tavsif / Izoh:", "📝 Описание:")}</h4>
                  ${(isAdminMode && isUserAnAdmin) ? `<button onclick="openEditFieldModal('${p.id}', 'desc')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>` : ''}
                </div>
                <p class="text-gray-600 leading-relaxed">${escapeHtml(productDesc(p) || 'Tavsif kiritilmagan.')}</p>
              </div>

              ${!isAdminMode ? `
                <div>
                  ${p.stock > 0 ? (
                    productVariants(p).length > 0 ? `
                      <div class="space-y-2">
                        <p class="text-xs font-bold text-gray-600">${t('choose_variant')} (bir nechtasini tanlash mumkin):</p>
                        <div class="grid grid-cols-2 gap-2">
                          ${productVariants(p).map((v, vIdx) => {
                            const k = variantKey(v.size, v.color);
                            const selected = !!selectedVariantQtys[k];
                            const qty = selectedVariantQtys[k] || 0;
                            const disabled = !v.qty || Number(v.qty) <= 0;
                            return `
                              <div class="border rounded-xl p-2 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                                <button ${disabled ? 'disabled' : `onclick="toggleVariantSelect(${vIdx})"`}
                                  class="w-full px-2 py-1.5 rounded-lg font-bold text-xs ${disabled ? 'bg-gray-100 text-gray-300' : (selected ? 'bg-blue-600 text-white' : 'bg-white text-gray-700')}">
                                  ${escapeHtml(variantLabel(v))}
                                </button>
                                <p class="text-[9px] text-center mt-1 text-gray-400">${v.qty} ta</p>
                                ${selected ? `
                                  <div class="flex items-center justify-center gap-2 mt-1.5">
                                    <button onclick="setVariantQty(${vIdx}, -1)" class="w-7 h-7 bg-white font-bold rounded-lg shadow text-sm text-blue-600">-</button>
                                    <span class="font-bold text-sm w-5 text-center">${qty}</span>
                                    <button onclick="setVariantQty(${vIdx}, 1)" class="w-7 h-7 bg-blue-600 font-bold rounded-lg text-sm text-white">+</button>
                                  </div>
                                ` : ''}
                              </div>
                            `;
                          }).join('')}
                        </div>
                        <button onclick="addSelectedVariantsToCart('${p.id}'); openProductDetailModal('${p.id}');" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🛒 ${t('add_to_cart')}</button>
                      </div>
                    ` : (
                    inCart ? `
                      <div class="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-2">
                        <button onclick="changeCartQty('${p.id}', -1, event); openProductDetailModal('${p.id}');" class="w-10 h-10 bg-white font-bold rounded-xl shadow text-base text-blue-600">-</button>
                        <span class="font-bold text-base text-blue-800">${inCart.qty} ta savatda</span>
                        <button onclick="changeCartQty('${p.id}', 1, event); openProductDetailModal('${p.id}');" class="w-10 h-10 bg-blue-600 font-bold rounded-xl text-base text-white">+</button>
                      </div>
                    ` : `
                      <button onclick="addToCart('${p.id}', event); openProductDetailModal('${p.id}');" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl text-sm">🛒 ${t('add_to_cart')}</button>
                    `
                  )) : `<button disabled class="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-2xl text-sm">${tr("❌ Mahsulot tugagan", "❌ Товар закончился")}</button>`}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        return;
      }

      // ORDER DETAILS MODAL
      if (selectedOrderModal) {
        const o = selectedOrderModal;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="selectedOrderModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="border-b pb-2">
                <h3 class="font-black text-sm text-blue-600">${tr("Buyurtma", "Заказ")} #${o.id}</h3>
              </div>

              <div class="space-y-1">
                <p>👤 <b>${tr("Mijoz:", "Клиент:")}</b> ${escapeHtml(o.user)}</p>
                <p>📞 <b>${tr("Tel:", "Тел:")}</b> ${escapeHtml(o.phone)}</p>
                <p>📍 <b>${tr("Hudud:", "Регион:")}</b> ${escapeHtml(regionLabel(o.region))} (${escapeHtml(o.district)})</p>
                <p>🏠 <b>${tr("Manzil:", "Адрес:")}</b> ${escapeHtml(o.address)}</p>
                <p>💳 <b>${tr("To'lov:", "Оплата:")}</b> ${escapeHtml(payMethodLabel(o.payMethod))}</p>
                <p>📅 <b>${tr("Sana:", "Дата:")}</b> ${escapeHtml(o.date)}</p>
              </div>

              <div class="border-t pt-2 space-y-1.5">
                <b>${tr("📦 Tovar:", "📦 Товары:")}</b>
                ${o.items.map(i => `
                  <div class="flex items-center gap-2">
                    ${i.img ? `<img src="${escapeHtml(i.img)}" onerror="this.style.display='none'" class="w-7 h-7 object-cover rounded-lg flex-shrink-0" loading="lazy">` : ''}
                    <p>• ${escapeHtml(i.name)} ${i.size ? `<span class="text-gray-500 font-mono">[${escapeHtml(i.size)}]</span>` : ''} ${i.color ? `<span class="text-gray-500">[${escapeHtml(i.color)}]</span>` : ''} ${i.sku ? `<span class="text-gray-400 font-mono">(ID: ${escapeHtml(i.sku)})</span>` : ''} x ${i.qty} = ${money(i.price * i.qty)}</p>
                  </div>
                `).join('')}
              </div>

              <div class="border-t pt-2 flex justify-between font-bold text-sm">
                <span>${tr("Jami:", "Итого:")}</span>
                <span class="text-green-600">${money(o.totalPrice)}</span>
              </div>

              ${o.status === 'CANCELLED' && o.cancelReason ? `
                <div class="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[11px] text-red-700">
                  ❌ Bekor qilindi (${o.cancelledBy === 'ADMIN' ? "do'kon tomonidan" : 'mijoz tomonidan'}): ${escapeHtml(o.cancelReason)}
                </div>
              ` : ''}

              ${(isAdminMode && isUserAnAdmin && !['DELIVERED','CANCELLED'].includes(o.status)) ? `
                <div class="border-t pt-2 space-y-2">
                  <label class="font-bold text-gray-700">${tr("Tezkor status o'zgartirish:", "Быстро изменить статус:")}</label>
                  <div class="grid grid-cols-2 gap-2">
                    ${o.status === 'NEW' ? `<button onclick="updateOrderStatus(${o.id}, 'PROCESSING')" class="bg-blue-600 text-white font-bold py-2 rounded-xl text-[11px]">${tr("⏳ Jarayonda", "⏳ В обработке")}</button>` : ''}
                    <button onclick="updateOrderStatus(${o.id}, 'DELIVERED')" class="bg-green-600 text-white font-bold py-2 rounded-xl text-[11px] ${o.status === 'PROCESSING' ? 'col-span-2' : ''}">${tr("✅ Yetkazib berilgan", "✅ Доставлен")}</button>
                    <button onclick="updateOrderStatus(${o.id}, 'CANCELLED')" class="bg-red-600 text-white font-bold py-2 rounded-xl text-[11px] col-span-2">❌ ${tr("Bekor qilish", "Отмена")}</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        return;
      }

      // USER (MIJOZ) DETAILS MODAL
      if (selectedUserModal) {
        const u = selectedUserModal;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="selectedUserModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="flex justify-between items-center border-b pb-2">
                <h3 class="font-black text-sm text-blue-600">${escapeHtml(u.userName)}</h3>
                <button onclick="selectedUserModal=null; render();" class="text-xs bg-gray-100 font-bold px-2.5 py-1 rounded-xl">✕</button>
              </div>
              <p>📞 <b>${tr("Tel:", "Тел:")}</b> ${escapeHtml(u.phone || '-')}</p>
              <p>🆔 <b>${tr("Telegram ID:", "Telegram ID:")}</b> ${escapeHtml(u.tgId)}</p>

              ${u.isBlocked ? `
                <div class="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                  <p class="font-bold text-red-700">${tr("🚫 Bloklangan", "🚫 Заблокирован")}</p>
                  <p class="text-red-600">${tr("Sabab", "Причина")}: ${escapeHtml(u.blockReason || '-')}</p>
                </div>
              ` : (u.warned ? `
                <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  <p class="font-bold text-amber-800">${tr("⚠️ Ogohlantirilgan", "⚠️ Предупреждение")}</p>
                  <p class="text-amber-700">${tr("Sabab", "Причина")}: ${escapeHtml(u.warnReason || '-')}</p>
                </div>
              ` : '')}

              <div class="grid grid-cols-2 gap-2 pt-2">
                <div class="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p class="text-lg font-black text-gray-800">${u.totalOrders}</p>
                  <p class="text-[10px] text-gray-500">${tr("Jami buyurtma", "Всего заказов")}</p>
                </div>
                <div class="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p class="text-lg font-black text-green-600">${u.totalSpent.toLocaleString()}</p>
                  <p class="text-[10px] text-gray-500">${tr("Jami xarid (so'm)", "Всего покупок (сум)")}</p>
                </div>
                <div class="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p class="text-lg font-black text-amber-600">${u.active}</p>
                  <p class="text-[10px] text-gray-500">${tr("Jarayonda", "В обработке")}</p>
                </div>
                <div class="bg-gray-50 p-2.5 rounded-xl text-center">
                  <p class="text-lg font-black text-emerald-600">${u.delivered}</p>
                  <p class="text-[10px] text-gray-500">${tr("Bajarilgan", "Выполнено")}</p>
                </div>
              </div>

              <div class="border-t pt-3 flex gap-2">
                ${u.isBlocked ? `
                  <button onclick="unblockUser('${u.tgId}')" class="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl text-[11px]">${tr("✅ Blokdan chiqarish", "✅ Разблокировать")}</button>
                ` : `
                  <button onclick="openBlockUserModal('${u.tgId}')" class="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-[11px]">${tr("🚫 Bloklash", "🚫 Заблокировать")}</button>
                `}
              </div>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
    }

    // MODAL OPENERS & HANDLERS — universal variant tanlash.
    let selectedVariantQtys = {};
    function toggleVariantSelect(index) {
      const v = productVariants(selectedProductModal)[index];
      if (!v) return;
      const k = variantKey(v.size, v.color);
      if (selectedVariantQtys[k]) delete selectedVariantQtys[k];
      else selectedVariantQtys[k] = 1;
      renderModalContainer();
    }
    function setVariantQty(index, delta) {
      const v = productVariants(selectedProductModal)[index];
      if (!v) return;
      const k = variantKey(v.size, v.color);
      const next = (selectedVariantQtys[k] || 0) + delta;
      if (next <= 0) delete selectedVariantQtys[k];
      else selectedVariantQtys[k] = Math.min(next, Number(v.qty) || 0);
      renderModalContainer();
    }
    function addSelectedVariantsToCart(productId) {
      addVariantItemsToCart(productId, selectedVariantQtys);
      selectedVariantQtys = {};
    }

    // Legacy wrappers for old size-only calls.
    let selectedSizeQtys = {};
    function toggleSizeSelect(size) { selectedSizeQtys[size] = selectedSizeQtys[size] ? 0 : 1; renderModalContainer(); }
    function setSizeQty(size, delta, maxQty) { const n=(selectedSizeQtys[size]||0)+delta; if(n<=0) delete selectedSizeQtys[size]; else selectedSizeQtys[size]=Math.min(n,maxQty||n); renderModalContainer(); }
    function addSelectedSizesToCart(productId) { addSizedItemsToCart(productId, selectedSizeQtys); selectedSizeQtys={}; }

    function openProductDetailModal(id) {
      activePopupModal = null;
      selectedProductModal = products.find(p => p.id === id);
      selectedVariantQtys = {};
      selectedSizeQtys = {};
      renderModalContainer();
    }

    function openEditFieldModal(prodId, fieldName) {
      selectedProductModal = products.find(p => p.id === prodId);
      editingFieldData = fieldName;
      clearTempImageSelection();
      tempImagePreviewUrl = (fieldName === 'img' && selectedProductModal) ? selectedProductModal.img : null;
      activePopupModal = 'EDIT_PROD_FIELD';
      render();
    }

    function openOrderModal(id) {
      selectedOrderModal = orders.find(o => o.id === id);
      renderModalContainer();
    }

    async function updateOrderStatus(id, newStatus) {
      const idx = orders.findIndex(o => o.id === id);
      if (idx < 0) return;
      const old = { ...orders[idx] };
      if (['DELIVERED','CANCELLED'].includes(old.status)) return;
      if (newStatus === 'CANCELLED' && !confirm(tr("Buyurtmani bekor qilasizmi?", "Отменить заказ?"))) return;

      // Optimistic UI: status bosilishi bilan darhol o'zgaradi.
      orders[idx] = { ...orders[idx], status: newStatus };
      selectedOrderModal = null;
      render();
      showActionToast(tr("⏳ Status saqlanmoqda...", "⏳ Статус сохраняется..."), 'saving');
      try {
        const result = await callApi('update_order_status', { orderId: id, newStatus });
        orders[idx] = formatOrderForUi(result.order);
        showActionToast(tr("✅ Status saqlandi", "✅ Статус сохранён"), 'success', 1000);
        render();
      } catch (e) {
        console.error(e);
        orders[idx] = old;
        render();
        showActionToast(tr("❌ Status saqlanmadi", "❌ Статус не сохранён"), 'error', 1600);
        alert(tr("❌ Statusni o'zgartirishda xatolik yuz berdi.", "❌ Ошибка изменения статуса."));
      }
    }

    // MODAL SAVERS
    async function saveRegistrationFromModal() {
      const fn = document.getElementById('reg-fname').value.trim();
      const ln = document.getElementById('reg-lname').value.trim();
      const ph = document.getElementById('reg-phone').value.trim().replace(/\s+/g, '');

      if (!fn || !ph || ph === '+998') return alert(uiLang === 'ru' ? 'Введите имя и номер телефона.' : "Iltimos, ismingiz va telefon raqamingizni kiriting!");
      if (!isValidPhone(ph)) return alert(uiLang === 'ru' ? 'Введите телефон в формате +998901234567' : "Iltimos, telefon raqamini to'g'ri formatda kiriting: +998901234567");

      // UI darhol yangilanadi; profil serverda ham saqlanadi va boshqa qurilmada tiklanadi.
      const old = registeredUser ? { ...registeredUser } : null;
      registeredUser = { firstName: fn, lastName: ln, phone: ph };
      localStorage.setItem('registeredUser', JSON.stringify(registeredUser));
      currentUser.firstName = fn; currentUser.lastName = ln; currentUser.phone = ph;
      activePopupModal = null; render();
      try {
        await callApi('update_profile', { firstName: fn, lastName: ln, phone: ph });
        alert(uiLang === 'ru' ? '✅ Данные сохранены.' : "✅ Ma'lumotlar saqlandi!");
      } catch (e) {
        console.error(e);
        if (old) { registeredUser = old; localStorage.setItem('registeredUser', JSON.stringify(old)); }
        alert(uiLang === 'ru' ? '⚠️ На сервере сохранить не удалось. Проверьте интернет.' : "⚠️ Serverda saqlab bo'lmadi. Internetni tekshiring.");
      }
    }

    function toggleRuFields(checked, prefix) {
      const nameRu = document.getElementById(prefix + '-name-ru');
      const descRu = document.getElementById(prefix + '-desc-ru');
      if (nameRu) nameRu.classList.toggle('hidden', !checked);
      if (descRu) descRu.classList.toggle('hidden', !checked);
    }

    async function saveProductFromModal() {
      const name = document.getElementById('m-prod-name').value.trim();
      const nameRu = document.getElementById('m-prod-name-ru').value.trim();
      const price = parseFloat(document.getElementById('m-prod-price').value);
      const oldPriceVal = parseFloat(document.getElementById('m-prod-oldprice').value);
      const stockVal = document.getElementById('m-prod-stock').value;
      const stock = stockVal === '' ? NaN : parseInt(stockVal, 10);
      const sizeText = document.getElementById('m-prod-sizes').value;
      const colorText = document.getElementById('m-prod-colors').value;
      const variants = parseVariantInputs(sizeText, colorText, isNaN(stock) ? 0 : stock);
      const desc = document.getElementById('m-prod-desc').value.trim();
      const descRu = document.getElementById('m-prod-desc-ru').value.trim();
      if (!name || isNaN(price) || (variants.length === 0 && isNaN(stock))) {
        return alert(tr("Iltimos, barcha majburiy maydonlarni to'ldiring!", "Заполните все обязательные поля!"));
      }
      const oldPrice = (!isNaN(oldPriceVal) && oldPriceVal > price) ? oldPriceVal : null;
      const imageSnap = takeTempImageSnapshot();
      const categoryId = adminCatParentId;

      // Modal darhol yopiladi — foydalanuvchi serverni kutmaydi.
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Tovar saqlanmoqda...", "⏳ Товар сохраняется..."), 'saving');
      try {
        const imgUrl = await uploadImageSnapshot(imageSnap, null, false);
        const result = await callApi('add_product', {
          name, nameRu: nameRu || null, price, oldPrice,
          stock: isNaN(stock) ? 0 : stock,
          variants: variants.length > 0 ? variants : null,
          desc, descRu: descRu || null,
          categoryId, img: imgUrl
        });
        upsertLocalProduct(result.product);
        saveCatalogCache();
        showActionToast(`${tr("✅ Tovar qo'shildi. ID:", "✅ Товар добавлен. ID:")} ${result.product.sku}`, 'success', 1800);
        render();
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Tovar saqlanmadi", "❌ Товар не сохранён"), 'error', 1800);
        if (String(e.message).startsWith('product_limit_reached')) {
          const limit = String(e.message).split(':')[1];
          alert(`${tr('⚠️ Tovar soni chegarasiga yetdingiz','⚠️ Достигнут лимит количества товаров')} (${limit}). ${tr("Ko'proq tovar qo'shish uchun tarifingizni oshiring.",'Чтобы добавить больше товаров, увеличьте тариф.')}`);
        } else {
          alert(tr("❌ Tovarni saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения товара: ") + (e.message || e));
        }
      } finally { releaseImageSnapshot(imageSnap); }
    }

    async function saveCategoryFromModal() {
      const name = document.getElementById('m-cat-name').value.trim();
      const nameRu = document.getElementById('m-cat-name-ru').value.trim();
      if (!name) return alert(tr("Katalog nomini kiriting!", "Введите название каталога!"));
      const imageSnap = takeTempImageSnapshot();
      const parentId = adminCatParentId;
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Katalog saqlanmoqda...", "⏳ Каталог сохраняется..."), 'saving');
      try {
        const imgUrl = await uploadImageSnapshot(imageSnap, null, false);
        const result = await callApi('add_category', { name, nameRu: nameRu || null, img: imgUrl, parentId });
        upsertLocalCategory(result.category);
        saveCatalogCache();
        showActionToast(tr("✅ Katalog yaratildi", "✅ Каталог создан"), 'success', 1200);
        render();
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Katalog saqlanmadi", "❌ Каталог не сохранён"), 'error', 1800);
        alert(tr("❌ Katalogni saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения каталога: ") + (e.message || e));
      } finally { releaseImageSnapshot(imageSnap); }
    }

    async function saveAdminFromModal() {
      const idVal = document.getElementById('m-admin-id').value.trim();
      if (!idVal || !/^\d+$/.test(idVal)) return alert(tr("To'g'ri Telegram ID kiriting!", "Введите корректный Telegram ID!"));
      const existed = adminsList.includes(idVal);
      if (!existed) adminsList.push(idVal);
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Admin saqlanmoqda...", "⏳ Администратор сохраняется..."), 'saving');
      try {
        await callApi('add_admin', { tgId: idVal });
        showActionToast(tr("✅ Admin qo'shildi", "✅ Администратор добавлен"), 'success', 1200);
      } catch (e) {
        console.error(e);
        if (!existed) adminsList = adminsList.filter(x => x !== idVal);
        render();
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 1800);
        alert(tr("❌ Adminni qo'shishda xatolik yuz berdi: ", "❌ Ошибка добавления администратора: ") + (e.message || e));
      }
    }

    async function saveFieldEdit(prodId, field) {
      const idx = products.findIndex(prod => prod.id === prodId);
      if (idx < 0) return;
      const p = products[idx];
      const old = cloneData(p);
      const payload = { productId: prodId, field };
      let imageSnap = null;

      if (field === 'name') {
        const val = document.getElementById('ef-val').value.trim();
        if (!val) { activePopupModal = null; render(); return; }
        payload.value = val;
        const ruVal = document.getElementById('ef-val-ru').value.trim();
        p.name = val;
        p.nameRu = ruVal || null;
        if (ruVal) { payload.field2 = 'nameRu'; payload.value2 = ruVal; }
        else { payload.field2 = 'nameRu'; payload.value2 = null; }
      } else if (field === 'price') {
        const price = parseFloat(document.getElementById('ef-price').value);
        const oldVal = parseFloat(document.getElementById('ef-oldprice').value);
        if (isNaN(price)) { activePopupModal = null; render(); return; }
        const oldPrice = (!isNaN(oldVal) && oldVal > price) ? oldVal : null;
        payload.value = price; payload.oldPrice = oldPrice;
        p.price = price; p.oldPrice = oldPrice;
      } else if (field === 'stock') {
        const stock = parseInt(document.getElementById('ef-val').value, 10);
        if (isNaN(stock)) { activePopupModal = null; render(); return; }
        payload.value = stock;
        p.stock = stock; p.status = stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
      } else if (field === 'desc') {
        const val = document.getElementById('ef-val').value.trim();
        const ruVal = document.getElementById('ef-val-ru').value.trim();
        payload.value = val;
        payload.field2 = 'descRu'; payload.value2 = ruVal || null;
        p.desc = val; p.descRu = ruVal || null;
      } else if (field === 'img') {
        imageSnap = takeTempImageSnapshot();
        if (!imageSnap.file && !imageSnap.preparing) { activePopupModal = null; render(); return; }
        // Tanlangan rasm kartochkada ham darhol ko'rinsin.
        if (imageSnap.preview) p.img = imageSnap.preview;
      } else if (field === 'sizes' || field === 'variants') {
        const sizeText = document.getElementById('ef-size-val').value;
        const colorText = document.getElementById('ef-color-val').value;
        const vars = parseVariantInputs(sizeText, colorText, p.stock);
        payload.field = 'variants'; payload.value = vars;
        p.variants = vars;
        p.sizes = vars.length && !vars.some(v => v.color) ? vars.map(v => ({ size: v.size, qty: v.qty, sku: v.sku || null })) : null;
        if (vars.length) {
          p.stock = vars.reduce((sum, v) => sum + (Number(v.qty) || 0), 0);
          p.status = p.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
        }
      }

      // PIN kabi: Saqlash bosilishi bilan modal yopiladi va yangi qiymat darhol ko'rinadi.
      activePopupModal = null;
      selectedProductModal = p;
      render();
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохраняется..."), 'saving');

      try {
        if (field === 'img') payload.value = await uploadImageSnapshot(imageSnap, old.img, true);
        const result = await callApi('edit_product_field', payload);
        const current = products.find(prod => prod.id === prodId);
        if (current) Object.assign(current, mapProductFromDB(result.product));
        saveCatalogCache();
        showActionToast(tr("✅ Saqlandi", "✅ Сохранено"), 'success', 1200);
        render();
      } catch (e) {
        console.error(e);
        const curIdx = products.findIndex(prod => prod.id === prodId);
        if (curIdx >= 0) products[curIdx] = old;
        selectedProductModal = products.find(prod => prod.id === prodId) || null;
        render();
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 1800);
        alert(tr("❌ Saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения: ") + (e.message || e));
      } finally {
        releaseImageSnapshot(imageSnap);
      }
    }

    function openAddProductModal() {
      clearTempImageSelection();
      activePopupModal = 'ADD_PROD';
      render();
    }

    function openAddCatModal() {
      clearTempImageSelection();
      activePopupModal = 'ADD_CAT';
      render();
    }

    // ============ EXCEL IMPORT (faqat admin ochganda lazy-load) ============
    let excelModulePromise = null;
    function ensureScript(src) {
      return new Promise((resolve, reject) => {
        const old = document.querySelector(`script[data-src="${src}"]`);
        if (old) { if (old.dataset.loaded === '1') return resolve(); old.addEventListener('load', resolve, { once:true }); return; }
        const sc = document.createElement('script'); sc.src = src; sc.dataset.src = src; sc.async = true;
        sc.onload = () => { sc.dataset.loaded = '1'; resolve(); }; sc.onerror = reject; document.head.appendChild(sc);
      });
    }
    async function openExcelImportModal() {
      if (!isUserAnAdmin) return;
      try {
        if (!excelModulePromise) excelModulePromise = ensureScript('./excel-import.js?v=2');
        await excelModulePromise;
        if (!window.FitcoreExcel) throw new Error('Excel moduli topilmadi');
        activePopupModal = 'EXCEL_IMPORT';
        await window.FitcoreExcel.prepare?.();
        render();
      } catch (e) {
        console.error(e);
        alert(tr("❌ Excel modulini yuklab bo'lmadi: ", "❌ Не удалось загрузить модуль Excel: ") + (e.message || e));
      }
    }

    // Legacy qo'lda bulk forma olib tashlandi; faqat xavfsiz Excel import ishlatiladi.

    function openEditCategoryModal(id, e) {
      if (e) e.stopPropagation();
      const c = categories.find(cat => cat.id === id);
      if (!c) return;
      selectedCategoryModal = c;
      clearTempImageSelection();
      activePopupModal = 'EDIT_CAT';
      render();
    }

    async function saveCategoryEdit(id) {
      const idx = categories.findIndex(cat => cat.id === id);
      if (idx < 0) return;
      const c = categories[idx];
      const old = cloneData(c);
      const name = document.getElementById('ec-name').value.trim();
      const nameRu = document.getElementById('ec-name-ru').value.trim();
      if (!name) return alert(tr("Katalog nomini kiriting!", "Введите название каталога!"));
      const imageSnap = takeTempImageSnapshot();

      c.name = name;
      c.nameRu = nameRu || null;
      if (imageSnap.preview) c.img = imageSnap.preview;
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Katalog saqlanmoqda...", "⏳ Каталог сохраняется..."), 'saving');

      try {
        const newImg = await uploadImageSnapshot(imageSnap, old.img, !!(imageSnap.file || imageSnap.preparing));
        const result = await callApi('edit_category', { categoryId: id, name, nameRu: nameRu || null, img: newImg });
        const current = categories.find(cat => cat.id === id);
        if (current) Object.assign(current, mapCategoryFromDB(result.category));
        saveCatalogCache();
        showActionToast(tr("✅ Saqlandi", "✅ Сохранено"), 'success', 1200);
        render();
      } catch (e2) {
        console.error(e2);
        const curIdx = categories.findIndex(cat => cat.id === id);
        if (curIdx >= 0) categories[curIdx] = old;
        render();
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 1800);
        alert(tr("❌ Xatolik yuz berdi: ", "❌ Произошла ошибка: ") + (e2.message || e2));
      } finally {
        releaseImageSnapshot(imageSnap);
      }
    }

    // ⬆️⬇️ tugmalari FAQAT joriy ko'rinib turgan ro'yxat (currentVisibleProductIds) ichida ishlaydi.
    async function moveProductSort(id, dir) {
      const list = currentVisibleProductIds;
      const idx = list.indexOf(id);
      if (idx < 0) return;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= list.length) return;

      const prodA = products.find(p => p.id === list[idx]);
      const prodB = products.find(p => p.id === list[targetIdx]);
      if (!prodA || !prodB) return;

      const oldA = prodA.sortOrder;
      const oldB = prodB.sortOrder;
      prodA.sortOrder = oldB;
      prodB.sortOrder = oldA;

      // Optimistic: tugma darhol ishlaydi, server javobi fon rejimida keladi.
      render();
      try {
        await callApi('move_sort', { idA: prodA.id, sortOrderA: prodA.sortOrder, idB: prodB.id, sortOrderB: prodB.sortOrder });
        saveCatalogCache();
      } catch (e) {
        prodA.sortOrder = oldA;
        prodB.sortOrder = oldB;
        render();
        console.error('Tartibni saqlashda xatolik:', e);
        alert(tr("❌ Tartibni saqlab bo'lmadi: ", "❌ Не удалось сохранить порядок: ") + (e.message || e));
      }
    }

    async function toggleProductFeatured(id) {
      const p = products.find(prod => prod.id === id);
      if (!p) return;
      const oldVal = !!p.isFeatured;
      const newVal = !oldVal;

      // OPTIMISTIC UI: pin darhol o'zgaradi, server fon rejimida saqlaydi.
      p.isFeatured = newVal;
      render();
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохраняется..."), 'saving');
      try {
        await callApi('toggle_featured', { productId: id, value: newVal });
        saveCatalogCache();
        showActionToast(tr("✅ Saqlandi", "✅ Сохранено"), 'success', 800);
      } catch (e) {
        p.isFeatured = oldVal;
        render();
        console.error(e);
        alert(tr("❌ Pin holatini saqlab bo'lmadi: ", "❌ Не удалось сохранить закрепление: ") + (e.message || e));
      }
    }

    async function deleteProduct(id) {
      if (!confirm(tr("Rostdan ham ushbu mahsulotni o'chirmoqchimisiz?", "Вы действительно хотите удалить этот товар?"))) return;
      const idx = products.findIndex(prod => prod.id === id);
      if (idx < 0) return;
      const old = cloneData(products[idx]);
      products.splice(idx, 1);
      render();
      showActionToast(tr("⏳ O'chirilmoqda...", "⏳ Удаление..."), 'saving');
      try {
        await callApi('delete_product', { productId: id });
        saveCatalogCache();
        showActionToast(tr("✅ O'chirildi", "✅ Удалено"), 'success', 1200);
      } catch (e) {
        console.error(e);
        products.splice(Math.min(idx, products.length), 0, old);
        render();
        showActionToast(tr("❌ O'chirilmadi", "❌ Не удалено"), 'error', 1800);
        alert(tr("❌ O'chirishda xatolik yuz berdi: ", "❌ Ошибка удаления: ") + (e.message || e));
      }
    }

    async function deleteCategory(id, e) {
      if (e) e.stopPropagation();
      if (!confirm(tr("Katalog o'chirilsinmi?", "Удалить каталог?"))) return;
      const idx = categories.findIndex(c => c.id === id);
      if (idx < 0) return;
      const old = cloneData(categories[idx]);
      categories.splice(idx, 1);
      render();
      showActionToast(tr("⏳ O'chirilmoqda...", "⏳ Удаление..."), 'saving');
      try {
        await callApi('delete_category', { categoryId: id });
        saveCatalogCache();
        showActionToast(tr("✅ O'chirildi", "✅ Удалено"), 'success', 1200);
      } catch (e2) {
        console.error(e2);
        categories.splice(Math.min(idx, categories.length), 0, old);
        render();
        showActionToast(tr("❌ O'chirilmadi", "❌ Не удалено"), 'error', 1800);
        if (String(e2.message).includes('category_not_empty')) {
          alert(tr("❌ Bu katalogda pastki kataloglar yoki tovarlar bog'langan. Avval ularni o'chiring yoki boshqa joyga ko'chiring.", "❌ В каталоге есть подкаталоги или товары. Сначала удалите или переместите их."));
        } else {
          alert(tr("❌ O'chirishda xatolik yuz berdi: ", "❌ Ошибка удаления: ") + (e2.message || e2));
        }
      }
    }

    async function saveBulkStock() {
      const input = document.getElementById('bulk-input').value.trim();
      if (!input) return alert(tr("Ma'lumot kiriting!", "Введите данные!"));

      const lines = input.split('\n');
      const updates = [];

      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const sku = parts[0].toUpperCase();
          const stock = parseInt(parts[1], 10);
          if (!isNaN(stock)) updates.push({ sku, stock });
        }
      });

      if (updates.length === 0) return alert(tr("Hech qanday to'g'ri qator topilmadi!", "Не найдено ни одной корректной строки!"));

      try {
        const result = await callApi('bulk_stock_update', { updates });
        (result.products || []).forEach(row => {
          const mapped = mapProductFromDB(row);
          const idx = products.findIndex(p => p.id === mapped.id);
          if (idx >= 0) products[idx] = mapped;
        });
        const okCount = (result.products || []).length;
        const errs = result.errors || [];
        if (errs.length) {
          const sample = errs.slice(0, 5).map(x => `${x.sku || '?'}: ${x.error || 'xato'}`).join('\n');
          alert(`✅ ${okCount} ${tr("ta mahsulot qoldig'i yangilandi",'товаров: остатки обновлены')}\n⚠️ ${errs.length} ${tr('ta qator yangilanmadi','строк не обновлено')}\n${sample}`);
        } else {
          alert(`✅ ${okCount} ${tr("ta mahsulot qoldig'i yangilandi!",'товаров: остатки обновлены!')}`);
        }
        render();
      } catch (e) {
        console.error(e);
        alert(tr("❌ Xatolik yuz berdi: ", "❌ Произошла ошибка: ") + (e.message || e));
      }
    }

    // ============ REAL-TIME SINXRONIZATSIYA ============
    // Tovar/katalog o'zgarishlari hamma ochiq sessiyalarga to'g'ridan-to'g'ri
    // (bular maxfiy ma'lumot emas, hammaga ochiq o'qish bilan). Buyurtma/savat/
    // adminlar o'zgarishi esa faqat "signal" (Broadcast) orqali — signalni
    // olganimizdan keyin tegishli ma'lumotni serverdan qayta so'raymiz, hech
    // qachon maxfiy ma'lumot to'g'ridan-to'g'ri broadcast orqali kelmaydi.
    function upsertLocalProduct(row) {
      const mapped = mapProductFromDB(row);
      if (mapped.status === 'DELETED') {
        products = products.filter(p => p.id !== mapped.id);
        return;
      }
      const idx = products.findIndex(p => p.id === mapped.id);
      if (idx >= 0) products[idx] = mapped; else products.push(mapped);
      products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    // MUHIM: bu doim "yangilash yoki qo'shish" (upsert) tarzida ishlaydi —
    // to'g'ridan-to'g'ri push() ishlatmaymiz, chunki real-time signal ham
    // xuddi shu tovar/katalogni bir vaqtda qo'shib qo'yishi mumkin edi va
    // bitta tovar RO'YXATDA IKKI MARTA ko'rinib qolardi (haqiqiy bug edi).
    function upsertLocalCategory(row) {
      const mapped = mapCategoryFromDB(row);
      const idx = categories.findIndex(c => c.id === mapped.id);
      if (idx >= 0) categories[idx] = mapped; else categories.push(mapped);
    }

    function setupRealtime() {
      sb.channel('public-data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            products = products.filter(p => p.id !== payload.old.id);
          } else {
            upsertLocalProduct(payload.new);
          }
          saveCatalogCache();
          if (currentTab === 'home' || currentTab === 'categories' || currentTab === 'warehouse' || selectedProductModal) render();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
          if (payload.eventType === 'DELETE') {
            categories = categories.filter(c => c.id !== payload.old.id);
          } else {
            const mapped = mapCategoryFromDB(payload.new);
            const idx = categories.findIndex(c => c.id === mapped.id);
            if (idx >= 0) categories[idx] = mapped; else categories.push(mapped);
          }
          saveCatalogCache();
          if (currentTab === 'categories' || currentTab === 'warehouse') render();
        })
        .subscribe();

      sb.channel('app-events')
        .on('broadcast', { event: 'orders_changed' }, async () => {
          // Agar ${tr("buyurtma", "заказов")}lar hali ochilmagan bo'lsa, keraksiz katta so'rov yubormaymiz.
          if (ordersLoaded) await loadOrdersLazy(true);
          if (isUserAnAdmin && usersLoaded) await loadUsersLazy(true);
        })
        .on('broadcast', { event: 'admins_changed' }, async () => {
          if (isSuperAdmin && adminsLoaded) await loadAdminsLazy(true);
        })
        .subscribe();

      startOrdersPolling();
    }

    // Realtime asosiy, polling esa faqat zaxira: tab ochilgan bo'lsa va ilova faol bo'lsa 90 soniyada.
    let ordersSnapshot = JSON.stringify(orders.map(o => [o.id, o.status]));
    let ordersPollTimer = null;
    function startOrdersPolling() {
      if (ordersPollTimer) clearInterval(ordersPollTimer);
      ordersPollTimer = setInterval(async () => {
        if (!ordersLoaded || document.visibilityState !== 'visible') return;
        try {
          const data = isUserAnAdmin && isAdminMode ? await callApi('get_all_orders', {}) : await callApi('get_my_orders', {});
          const freshOrders = (data.orders || []).map(formatOrderForUi);
          const freshSnapshot = JSON.stringify(freshOrders.map(o => [o.id, o.status]));
          if (freshSnapshot !== ordersSnapshot) {
            ordersSnapshot = freshSnapshot;
            orders = freshOrders;
            if (currentTab === 'orders') render();
          }
        } catch (e) { console.error('Fon tekshiruvi xatosi:', e); }
      }, 90000);
    }

    // ============ BOOT: TEZKOR / STALE-WHILE-REVALIDATE ============
    const CATALOG_CACHE_KEY = 'fitcore_catalog_cache_v2';
    let catalogLoading = false;
    function hydrateCatalogCache() {
      try {
        const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null');
        if (!cached || !Array.isArray(cached.products) || !Array.isArray(cached.categories)) return false;
        products = cached.products; categories = cached.categories;
        return true;
      } catch { return false; }
    }
    function saveCatalogCache() {
      try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ products, categories, at: Date.now() })); } catch {}
    }
    async function loadCatalog() {
      const perfStarted = performance.now();
      catalogLoading = true;
      const [prodRes, catRes] = await Promise.all([
        sb.from('products').select('id,sku,name,name_ru,price,old_price,stock,category_id,status,img,description,description_ru,is_featured,sort_order,sizes,variants,sold_count,created_at,import_batch_id').neq('status', 'DELETED').order('sort_order', { ascending: true }),
        sb.from('categories').select('id,name,name_ru,parent_id,img')
      ]);
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      products = (prodRes.data || []).map(mapProductFromDB);
      categories = (catRes.data || []).map(mapCategoryFromDB);
      saveCatalogCache();
      catalogLoading = false;
      const ms = Math.round(performance.now() - perfStarted);
      if (ms >= 500) console.info(`[FITCORE perf] Catalog: ${ms}ms (${products.length} products, ${categories.length} categories)`);
      return true;
    }

    async function boot() {
      // MUHIM: ilova FAQAT Telegram orqali ochilganda ishlaydi. Bu ataylab
      // shunday qilingan — aks holda oddiy brauzerda ochib, admin bo'lib
      // olish mumkin bo'lardi (avvalgi versiyadagi xavfsizlik teshigi).
      if (!tg || !tg.initData) {
        document.getElementById('app-content').innerHTML = `
          <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-2xl mt-10 text-center">
            ⚠️ Bu ilova faqat Telegram bot orqali ishlaydi.<br>Iltimos, Telegram'dagi FITCORE bot/mini-app orqali oching.
          </div>`;
        return;
      }

      const hadCache = hydrateCatalogCache();
      if (hadCache) {
        // Avvalgi katalogni darhol ko'rsatamiz; yangi ma'lumot fonda keladi.
        render();
      }
      const catalogPromise = loadCatalog().then(() => { if (currentTab === 'home' || currentTab === 'categories' || currentTab === 'warehouse') render(); });

      try {
        // boot endi faqat auth + foydalanuvchi holati + shop settings. Orders/users/admins bu yerda yuklanmaydi.
        const bootData = await callApi('boot', {});
        currentTgId = bootData.tgId;
        isSuperAdmin = bootData.isSuperAdmin;
        isUserAnAdmin = bootData.isAdmin;
        isAdminMode = isUserAnAdmin;
        currentUser.tgId = currentTgId;
        myStatus = {
          isBlocked: !!bootData.isBlocked, blockReason: bootData.blockReason || null,
          isWarned: !!bootData.isWarned, warnReason: bootData.warnReason || null,
        };
        shopLogoUrl = bootData.logoUrl || null;
        shopContact = bootData.shopContact || { address: null, coordinates: null, phone: null, phone2: null, phone3: null, instagram: null, telegram: null };
        if (bootData.profile?.phone) {
          registeredUser = { firstName: bootData.profile.firstName || '', lastName: bootData.profile.lastName || '', phone: bootData.profile.phone };
          currentUser.firstName = registeredUser.firstName; currentUser.lastName = registeredUser.lastName; currentUser.phone = registeredUser.phone;
          localStorage.setItem('registeredUser', JSON.stringify(registeredUser));
        }
        authReady = true;
      } catch (e) {
        console.error('Yuklashda xatolik:', e);
        document.getElementById('app-content').innerHTML = `
          <div class="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl mt-10 text-center">
            ⚠️ Ma'lumotlarni yuklashda xatolik yuz berdi.<br>Internetni tekshirib, ilovani qayta oching.<br><br>
            <span class="font-mono text-[10px]">${escapeHtml(e.message || String(e))}</span>
          </div>`;
        return;
      }

      setupRealtime();
      switchTab('home');
      catalogPromise.catch(e => console.error('Katalogni yangilash xatosi:', e));
    }

    // INITIAL LAUNCH
    boot();
