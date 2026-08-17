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
    };

    const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    const TASHKENT_CITY_DISTRICTS = ["Bektemir","Chilonzor","Mirobod","Mirzo Ulug'bek","Olmazor","Sergeli","Shayxontohur","Uchtepa","Yakkasaroy","Yashnobod","Yunusobod"];

    // Kanonik snake_case hudud kodlari. Bular DB/API/HTML atributlarida ID
    // sifatida ishlatiladi va HECH QACHON o'zbekcha ko'rsatiladigan nom
    // bo'lmasligi kerak — oldingi versiyada hudud ID'lari to'g'ridan-to'g'ri
    // "Farg'ona viloyati" kabi nomlar edi va admin sozlamalar UI'si bu nomni
    // encodeURIComponent (apostrofni escape qilmaydi) orqali bitta-tirnoqli
    // inline JS onchange ichiga qo'yardi — natijada apostrofli nomlar (Farg'ona,
    // Qoraqalpog'iston) uchun checkbox handler jim buzilib qolardi. Tafsilot:
    // supabase/migrations/013_region_canonical_codes.sql.
    const REGION_DEFS = [
      { code: 'tashkent_city', nameUz: 'Toshkent shahri', nameRu: 'Город Ташкент' },
      { code: 'tashkent_region', nameUz: 'Toshkent viloyati', nameRu: 'Ташкентская область' },
      { code: 'andijan', nameUz: 'Andijon viloyati', nameRu: 'Андижанская область' },
      { code: 'bukhara', nameUz: 'Buxoro viloyati', nameRu: 'Бухарская область' },
      { code: 'fergana', nameUz: "Farg'ona viloyati", nameRu: 'Ферганская область' },
      { code: 'jizzakh', nameUz: 'Jizzax viloyati', nameRu: 'Джизакская область' },
      { code: 'namangan', nameUz: 'Namangan viloyati', nameRu: 'Наманганская область' },
      { code: 'navoi', nameUz: 'Navoiy viloyati', nameRu: 'Навоийская область' },
      { code: 'qashqadaryo', nameUz: 'Qashqadaryo viloyati', nameRu: 'Кашкадарьинская область' },
      { code: 'karakalpakstan', nameUz: "Qoraqalpog'iston Respublikasi", nameRu: 'Республика Каракалпакстан' },
      { code: 'samarkand', nameUz: 'Samarqand viloyati', nameRu: 'Самаркандская область' },
      { code: 'sirdaryo', nameUz: 'Sirdaryo viloyati', nameRu: 'Сырдарьинская область' },
      { code: 'surxondaryo', nameUz: 'Surxondaryo viloyati', nameRu: 'Сурхандарьинская область' },
      { code: 'khorezm', nameUz: 'Xorazm viloyati', nameRu: 'Хорезмская область' },
    ];
    // Eski (pre-013) mijoz holatlarida (masalan localStorage'dagi checkoutDraft)
    // qolib ketgan bo'lishi mumkin bo'lgan eski ID'larni yangi kodga o'giradi.
    const LEGACY_REGION_CODE_MAP = {
      TASHKENT_CITY: 'tashkent_city', 'Toshkent viloyati': 'tashkent_region',
      'Andijon viloyati': 'andijan', 'Buxoro viloyati': 'bukhara', "Farg'ona viloyati": 'fergana',
      'Jizzax viloyati': 'jizzakh', 'Namangan viloyati': 'namangan', 'Navoiy viloyati': 'navoi',
      'Qashqadaryo viloyati': 'qashqadaryo', "Qoraqalpog'iston Respublikasi": 'karakalpakstan',
      'Samarqand viloyati': 'samarkand', 'Sirdaryo viloyati': 'sirdaryo',
      'Surxondaryo viloyati': 'surxondaryo', 'Xorazm viloyati': 'khorezm',
    };
    function canonicalRegionCode(value) {
      if (!value) return null;
      if (REGION_DEFS.some(r => r.code === value)) return value;
      return LEGACY_REGION_CODE_MAP[value] || null;
    }

    const UZ_REGIONS_BY_CODE = {
      andijan: ["Andijon shahri","Andijon tumani","Asaka","Baliqchi","Bo'z","Buloqboshi","Izboskan","Jalaquduq","Marhamat","Oltinko'l","Paxtaobod","Qo'rg'ontepa","Shahrixon","Ulug'nor","Xo'jaobod","Xonobod shahri"],
      bukhara: ["Buxoro shahri","Buxoro tumani","G'ijduvon","Jondor","Kogon shahri","Kogon tumani","Olot","Peshku","Qorako'l","Qorovulbozor","Romitan","Shofirkon","Vobkent"],
      fergana: ["Farg'ona shahri","Marg'ilon shahri","Qo'qon shahri","Farg'ona tumani","Bag'dod","Beshariq","Buvayda","Dang'ara","Furqat","Oltiariq","O'zbekiston","Quva","Qo'shtepa","Rishton","So'x","Toshloq","Uchko'prik","Yozyovon"],
      jizzakh: ["Jizzax shahri","Jizzax tumani","Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Sh.Rashidov tumani","Yangiobod","Zafarobod","Zarbdor","Zomin"],
      khorezm: ["Urganch shahri","Urganch tumani","Bog'ot","Gurlan","Hazorasp","Xiva","Xonqa","Qo'shko'pir","Shovot","Yangiariq","Yangibozor"],
      namangan: ["Namangan shahri","Namangan tumani","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To'raqo'rg'on","Uchqo'rg'on","Uychi","Yangiqo'rg'on"],
      navoi: ["Navoiy shahri","Zarafshon shahri","Karmana","Konimex","Navbahor","Nurota","Qiziltepa","Tomdi","Uchquduq","Xatirchi"],
      qashqadaryo: ["Qarshi shahri","Shahrisabz shahri","Qarshi tumani","Shahrisabz tumani","Chiroqchi","Dehqonobod","G'uzor","Kasbi","Kitob","Koson","Mirishkor","Muborak","Nishon","Qamashi","Yakkabog'"],
      karakalpakstan: ["Nukus shahri","Nukus tumani","Amudaryo","Beruniy","Chimboy","Ellikqal'a","Kegeyli","Mo'ynoq","Qanliko'l","Qorao'zak","Qo'ng'irot","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
      samarkand: ["Samarqand shahri","Samarqand tumani","Bulung'ur","Ishtixon","Jomboy","Kattaqo'rg'on","Narpay","Nurobod","Oqdaryo","Pastdarg'om","Paxtachi","Payariq","Qo'shrabot","Toyloq","Urgut"],
      sirdaryo: ["Guliston shahri","Guliston tumani","Yangiyer shahri","Boyovut","Mirzaobod","Oqoltin","Sardoba","Sayxunobod","Sirdaryo tumani","Xovos"],
      surxondaryo: ["Termiz shahri","Termiz tumani","Angor","Bandixon","Boysun","Denov","Jarqo'rg'on","Muzrabot","Oltinsoy","Qiziriq","Qumqo'rg'on","Sariosiyo","Sherobod","Sho'rchi","Uzun"],
      tashkent_region: ["Angren shahri","Bekobod shahri","Bekobod tumani","Bo'ka","Bo'stonliq","Chinoz","Chirchiq shahri","Ohangaron shahri","Ohangaron tumani","Olmaliq shahri","Oqqo'rg'on","Parkent","Piskent","Qibray","Quyichirchiq","Toshkent tumani","O'rtachirchiq","Yangiyo'l shahri","Yangiyo'l tumani","Yuqorichirchiq","Zangiota"],
    };

    // 5-band: tuman/shahar nomlarining haqiqiy ruscha tarjimasi — qo'lda
    // yozilgan (Azure emas, chunki bu ro'yxat qat'iy va bir martalik).
    // Transliteratsiya EMAS — masalan "Farg'ona tumani" -> "Ферганский
    // район", harf-ma-harf o'girilgan variant emas. Kalitlar UZ_REGIONS_BY_CODE/
    // TASHKENT_CITY_DISTRICTS'dagi qiymatlar bilan aynan bir xil (select
    // value shu o'zbekcha qiymat bo'lib qoladi — faqat ko'rsatiladigan matn
    // almashadi). Qarang: districtNameRu().
    const TASHKENT_CITY_DISTRICTS_RU = {
      "Bektemir": "Бектемирский район", "Chilonzor": "Чиланзарский район", "Mirobod": "Мирабадский район",
      "Mirzo Ulug'bek": "Мирзо-Улугбекский район", "Olmazor": "Алмазарский район", "Sergeli": "Сергелийский район",
      "Shayxontohur": "Шайхантахурский район", "Uchtepa": "Учтепинский район", "Yakkasaroy": "Яккасарайский район",
      "Yashnobod": "Яшнабадский район", "Yunusobod": "Юнусабадский район",
    };
    const DISTRICT_RU_BY_REGION = {
      andijan: {
        "Andijon shahri": "город Андижан", "Andijon tumani": "Андижанский район", "Asaka": "Асакинский район",
        "Baliqchi": "Баликчинский район", "Bo'z": "Бозский район", "Buloqboshi": "Булакбашинский район",
        "Izboskan": "Избасканский район", "Jalaquduq": "Джалакудукский район", "Marhamat": "Мархаматский район",
        "Oltinko'l": "Алтынкульский район", "Paxtaobod": "Пахтаабадский район", "Qo'rg'ontepa": "Кургантепинский район",
        "Shahrixon": "Шахриханский район", "Ulug'nor": "Улугнорский район", "Xo'jaobod": "Ходжаабадский район",
        "Xonobod shahri": "город Ханабад",
      },
      bukhara: {
        "Buxoro shahri": "город Бухара", "Buxoro tumani": "Бухарский район", "G'ijduvon": "Гиждуванский район",
        "Jondor": "Жондорский район", "Kogon shahri": "город Каган", "Kogon tumani": "Каганский район",
        "Olot": "Алатский район", "Peshku": "Пешкунский район", "Qorako'l": "Каракульский район",
        "Qorovulbozor": "Караулбазарский район", "Romitan": "Ромитанский район", "Shofirkon": "Шафирканский район",
        "Vobkent": "Вабкентский район",
      },
      fergana: {
        "Farg'ona shahri": "город Фергана", "Marg'ilon shahri": "город Маргилан", "Qo'qon shahri": "город Коканд",
        "Farg'ona tumani": "Ферганский район", "Bag'dod": "Багдадский район", "Beshariq": "Бешарыкский район",
        "Buvayda": "Бувайдинский район", "Dang'ara": "Дангаринский район", "Furqat": "Фуркатский район",
        "Oltiariq": "Алтыарыкский район", "O'zbekiston": "Узбекистанский район", "Quva": "Кувинский район",
        "Qo'shtepa": "Куштепинский район", "Rishton": "Риштанский район", "So'x": "Сохский район",
        "Toshloq": "Ташлакский район", "Uchko'prik": "Учкуприкский район", "Yozyovon": "Язъяванский район",
      },
      jizzakh: {
        "Jizzax shahri": "город Джизак", "Jizzax tumani": "Джизакский район", "Arnasoy": "Арнасайский район",
        "Baxmal": "Бахмальский район", "Do'stlik": "Дустликский район", "Forish": "Фаришский район",
        "G'allaorol": "Галляаральский район", "Mirzacho'l": "Мирзачульский район", "Paxtakor": "Пахтакорский район",
        "Sh.Rashidov tumani": "район Шарофа Рашидова", "Yangiobod": "Янгиабадский район", "Zafarobod": "Зафарабадский район",
        "Zarbdor": "Зарбдарский район", "Zomin": "Зааминский район",
      },
      khorezm: {
        "Urganch shahri": "город Ургенч", "Urganch tumani": "Ургенчский район", "Bog'ot": "Багатский район",
        "Gurlan": "Гурланский район", "Hazorasp": "Хазараспский район", "Xiva": "Хивинский район",
        "Xonqa": "Ханкинский район", "Qo'shko'pir": "Кошкупырский район", "Shovot": "Шаватский район",
        "Yangiariq": "Янгиарыкский район", "Yangibozor": "Янгибазарский район",
      },
      namangan: {
        "Namangan shahri": "город Наманган", "Namangan tumani": "Наманганский район", "Chortoq": "Чартакский район",
        "Chust": "Чустский район", "Kosonsoy": "Касансайский район", "Mingbuloq": "Мингбулакский район",
        "Norin": "Наринский район", "Pop": "Папский район", "To'raqo'rg'on": "Туракурганский район",
        "Uchqo'rg'on": "Учкурганский район", "Uychi": "Уйчинский район", "Yangiqo'rg'on": "Янгикурганский район",
      },
      navoi: {
        "Navoiy shahri": "город Навои", "Zarafshon shahri": "город Зарафшан", "Karmana": "Карманинский район",
        "Konimex": "Канимехский район", "Navbahor": "Навбахорский район", "Nurota": "Нуратинский район",
        "Qiziltepa": "Кызылтепинский район", "Tomdi": "Тамдынский район", "Uchquduq": "Учкудукский район",
        "Xatirchi": "Хатырчинский район",
      },
      qashqadaryo: {
        "Qarshi shahri": "город Карши", "Shahrisabz shahri": "город Шахрисабз", "Qarshi tumani": "Каршинский район",
        "Shahrisabz tumani": "Шахрисабзский район", "Chiroqchi": "Чиракчинский район", "Dehqonobod": "Дехканабадский район",
        "G'uzor": "Гузарский район", "Kasbi": "Касбийский район", "Kitob": "Китабский район",
        "Koson": "Касанский район", "Mirishkor": "Миришкорский район", "Muborak": "Мубарекский район",
        "Nishon": "Нишанский район", "Qamashi": "Камашинский район", "Yakkabog'": "Яккабагский район",
      },
      karakalpakstan: {
        "Nukus shahri": "город Нукус", "Nukus tumani": "Нукусский район", "Amudaryo": "Амударьинский район",
        "Beruniy": "Берунийский район", "Chimboy": "Чимбайский район", "Ellikqal'a": "Элликкалинский район",
        "Kegeyli": "Кегейлийский район", "Mo'ynoq": "Муйнакский район", "Qanliko'l": "Канлыкульский район",
        "Qorao'zak": "Караузякский район", "Qo'ng'irot": "Кунградский район", "Shumanay": "Шуманайский район",
        "Taxtako'pir": "Тахтакупырский район", "To'rtko'l": "Турткульский район", "Xo'jayli": "Ходжейлийский район",
      },
      samarkand: {
        "Samarqand shahri": "город Самарканд", "Samarqand tumani": "Самаркандский район", "Bulung'ur": "Булунгурский район",
        "Ishtixon": "Иштыханский район", "Jomboy": "Джамбайский район", "Kattaqo'rg'on": "Каттакурганский район",
        "Narpay": "Нарпайский район", "Nurobod": "Нурабадский район", "Oqdaryo": "Акдарьинский район",
        "Pastdarg'om": "Пастдаргомский район", "Paxtachi": "Пахтачийский район", "Payariq": "Пайарыкский район",
        "Qo'shrabot": "Кошрабадский район", "Toyloq": "Тайлакский район", "Urgut": "Ургутский район",
      },
      sirdaryo: {
        "Guliston shahri": "город Гулистан", "Guliston tumani": "Гулистанский район", "Yangiyer shahri": "город Янгиер",
        "Boyovut": "Баяутский район", "Mirzaobod": "Мирзаабадский район", "Oqoltin": "Акалтынский район",
        "Sardoba": "Сардобинский район", "Sayxunobod": "Сайхунабадский район", "Sirdaryo tumani": "Сырдарьинский район",
        "Xovos": "Хавастский район",
      },
      surxondaryo: {
        "Termiz shahri": "город Термез", "Termiz tumani": "Термезский район", "Angor": "Ангорский район",
        "Bandixon": "Бандиханский район", "Boysun": "Байсунский район", "Denov": "Денауский район",
        "Jarqo'rg'on": "Джаркурганский район", "Muzrabot": "Музрабадский район", "Oltinsoy": "Алтынсайский район",
        "Qiziriq": "Кызирикский район", "Qumqo'rg'on": "Кумкурганский район", "Sariosiyo": "Сариасийский район",
        "Sherobod": "Шерабадский район", "Sho'rchi": "Шурчинский район", "Uzun": "Узунский район",
      },
      tashkent_region: {
        "Angren shahri": "город Ангрен", "Bekobod shahri": "город Бекабад", "Bekobod tumani": "Бекабадский район",
        "Bo'ka": "Букинский район", "Bo'stonliq": "Бостанлыкский район", "Chinoz": "Чиназский район",
        "Chirchiq shahri": "город Чирчик", "Ohangaron shahri": "город Ахангаран", "Ohangaron tumani": "Ахангаранский район",
        "Olmaliq shahri": "город Алмалык", "Oqqo'rg'on": "Аккурганский район", "Parkent": "Паркентский район",
        "Piskent": "Пскентский район", "Qibray": "Кибрайский район", "Quyichirchiq": "Нижнечирчикский район",
        "Toshkent tumani": "Ташкентский район", "O'rtachirchiq": "Среднечирчикский район", "Yangiyo'l shahri": "город Янгиюль",
        "Yangiyo'l tumani": "Янгиюльский район", "Yuqorichirchiq": "Верхнечирчикский район", "Zangiota": "Зангиатинский район",
      },
    };
    // Barcha regionlar bo'yicha bitta tekis lug'at (aniq mos kelish uchun tez qidiruv).
    const DISTRICT_RU_FLAT = Object.assign({}, TASHKENT_CITY_DISTRICTS_RU, ...Object.values(DISTRICT_RU_BY_REGION));
    // Haqiqiy filial ma'lumotidan (get_delivery_districts) kelgan yorliq har
    // doim ham lug'at kaliti bilan harfma-harf mos kelmasligi mumkin — shu
    // sabab "tumani"/"shahri" so'zini olib tashlab, bazaviy nom bo'yicha ham
    // qidiriladi. Topilmasa (5-band talabiga ko'ra) o'zbekcha qiymat qoladi.
    function districtNameRu(uzLabel) {
      if (!uzLabel) return uzLabel;
      if (DISTRICT_RU_FLAT[uzLabel]) return DISTRICT_RU_FLAT[uzLabel];
      const strip = (s) => String(s).replace(/\s*(tumani|shahri)\s*$/i, '').trim().toLowerCase();
      const target = strip(uzLabel);
      for (const [uzKey, ruVal] of Object.entries(DISTRICT_RU_FLAT)) {
        if (strip(uzKey) === target) return ruVal;
      }
      return uzLabel;
    }
    function districtLabelForUi(uzLabel) { return uiLang === 'ru' ? districtNameRu(uzLabel) : uzLabel; }

    const TOP_LEVEL_REGIONS = REGION_DEFS.map(r => ({ id: r.code, nameUz: r.nameUz, nameRu: r.nameRu }));
    const TOP_LEVEL_REGION_IDS = TOP_LEVEL_REGIONS.map(region => region.id);
    const commerce = window.FitcoreCommerce;
    // Rasm siqish/saqlash chegaralari (mahsulot/kategoriya/logotip).
    const TARGET_IMAGE_BYTES = 2 * 1024 * 1024;
    const MAX_STORED_IMAGE_BYTES = 5 * 1024 * 1024;
    const MAX_RECEIPT_BYTES = 6 * 1024 * 1024;
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
    function hasProductImage(p) { return typeof p?.img === 'string' && p.img.trim().length > 0; }
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
      return { id: r.id, name: r.name, nameRu: r.name_ru || null, parentId: r.parent_id, img: r.img, sortOrder: r.sort_order || 0 };
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
    // 2-10-band (2026-08-17): qo'llab-quvvatlash — cheksiz xabarlashuvli
    // thread, admin tomonda user->chatlar->chat bo'ylab guruhlangan.
    let supportTickets = [];
    let supportTicketsLoaded = false, supportTicketsLoading = false;
    let adminSupportTickets = [];
    let adminSupportTicketsLoaded = false, adminSupportTicketsLoading = false;
    let supportTicketOrderId = null; // openSupportModal(orderId) orqali kelgan kontekst
    let supportMessages = []; // hozir ochiq chatning xabarlari
    let supportMessagesLoading = false;
    let openSupportTicketId = null; // mijoz tomonda hozir ochiq chat
    let supportReplyTarget = null; // {id, body, sender} — "shu xabarga javob" preview
    let adminSupportSelectedUser = null; // admin: Support -> User bosqichi
    let adminSupportSelectedTicketId = null; // admin: User -> Chat bosqichi
    let cart = JSON.parse(localStorage.getItem('cart') || "{}");
    let registeredUser = JSON.parse(localStorage.getItem('registeredUser') || "null");
    let checkoutDraft = JSON.parse(localStorage.getItem('checkoutDraft') || "null") || { fullname: '', phone: '', regionKey: 'tashkent_city', district: '', address: '' };
    // Eski (pre-013) localStorage'da qolgan bo'lishi mumkin bo'lgan hudud
    // ID'larini (o'zbekcha nom yoki eski 'TASHKENT_CITY') kanonik kodga o'giradi.
    checkoutDraft.regionKey = canonicalRegionCode(checkoutDraft.regionKey)
      || canonicalRegionCode(checkoutDraft.region === 'PROVINCE' ? checkoutDraft.viloyat : null)
      || 'tashkent_city';

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
    let warehouseImportedMissingImageOnly = false;
    let warehouseSection = 'holat'; // holat | yangilash | kirim | kam | tugagan | tarix
    let inventoryMovements = null;
    let inventoryMovementsLoading = false;
    let isAdminMode = false;
    let authReady = false;
    let adminCatParentId = null;
    let categoryPage = 1;
    // sortPrice/sortNew/sortSold: null | 'asc' | 'desc' — har biri mustaqil yoqiladi
    let categoryFilter = { search: '', minPrice: '', maxPrice: '', sortPrice: null, sortNew: null, sortSold: null, hideOutOfStock: false };
    let homePage = 1;
    let ordersPage = 1;
    let userOrderFilter = 'ALL';
    let selectedProductModal = null;
    let selectedOrderModal = null;
    let rejectReceiptOrderId = null; // 14-band: REJECT_RECEIPT modali qaysi buyurtma uchun ochilgani
    let selectedCategoryModal = null;
    let selectedUserModal = null;
    let usersSummary = [];
    let shopLogoUrl = null;
    let botUsername = null; // 1.10: "Telegramda ko'rish" uchun — hardcode emas, boot() javobidan
    let shopContact = { name: null, address: null, addressRu: null, coordinates: null, phone: null, phone2: null, phone3: null, instagram: null, telegram: null, facebook: null, startMessage: null };
    let fulfillmentConfig = commerce.defaultConfig(TOP_LEVEL_REGION_IDS);
    let fulfillmentDraft = null;

    // ---- Block 4: store design/theme ----
    let designSettings = { themeId: 'minimal', colors: {} };
    let designDraft = null;
    // 'MENU' (A/B tanlash) | 'DELIVERY' | 'PAYMENTS' — 1.1 talabiga ko'ra
    // "Yetkazib berish va to'lov" endi ikkita alohida bo'limga bo'lingan.
    let fulfillmentSettingsSection = 'MENU';
    let fulfillmentDeliveryKind = 'FREE'; // FREE | FIXED | TAXI | POST (faqat DELIVERY bo'limida)
    let fulfillmentExpandedPayment = null; // CASH | CARD | null (faqat PAYMENTS bo'limida, 1.2: yonma-yon + inline ochilish)
    let selectedDeliveryMethodId = checkoutDraft.deliveryMethodId || null;
    let selectedPayMethod = checkoutDraft.paymentMethodId || null;
    // 15-band: rad etilgan chekni qayta yuborish uchun alohida state —
    // checkout state'idan mustaqil (checkout draft bilan aralashib ketmasin).
    let resubmitOrderId = null;
    let resubmitReceiptFile = null;
    let resubmitReceiptPreparing = null;
    let resubmitReceiptPreviewUrl = null;
    let resubmitReceiptSelectionVersion = 0;
    // 1.14: BTS/EMU filial tanlash — mijoz qo'lda manzil yozmaydi.
    let checkoutBranches = [];
    let checkoutBranchesLoading = false;
    let checkoutBranchesLoadedFor = null; // `${regionKey}::${district}::${providerId}` — qayta yuklashni oldini olish uchun
    let checkoutSelectedBranch = null;
    let checkoutBranchSearch = '';
    // 5.7: har loadCheckoutBranches chaqiruvi o'zining raqamini oladi — eski
    // (sekin) so'rov keyinroq qaytsa ham, agar bu orada yangi so'rov
    // boshlangan bo'lsa, eski javob UI holatini bosib yubormaydi.
    let branchRequestSeq = 0;
    // 5.6: POST (BTS/EMU) oqimi uchun tuman/shahar bosqichi — provider bu
    // tanlanmaguncha tanlanmaydi (avtomatik tanlanmaydi).
    // 2-band: bitta tuman state — #chk-district har doim yagona manba.
    // checkoutDistrictOptions haqiqiy delivery_branches ma'lumotidan olingan
    // ro'yxat (BTS/EMU filtrlashga to'g'ri mos keladi); bo'sh bo'lsa hardcoded
    // UZ_REGIONS_BY_CODE/TASHKENT_CITY_DISTRICTS'ga fallback qilinadi.
    let checkoutDistrictOptions = [];
    let checkoutDistrictOptionsLoading = false;
    let checkoutDistrictOptionsLoadedFor = null; // regionKey
    let activePopupModal = null;
    let editingFieldData = null;
    let missingImageQueueIndex = 0;
    let missingImageQueueSaving = false;

    // ---- Block 2: catalog management (reorder/move/trash/duplicate/history) ----
    let priceHistoryProductId = null;
    let priceHistoryList = null;
    let moveProductId = null;
    let moveTargetCategoryId = '';
    let moveCategoryId = null;
    let moveCategoryTargetId = '';
    let trashBatches = null;
    let trashPage = 1;
    let trashSelectMode = false;
    const trashSelectedBatchIds = new Set();
    let bulkProductSelectMode = false;
    const bulkSelectedProductIds = new Set();
    let bulkMoveTargetCategoryId = '';
    // Dashboard — alohida sahifa (currentTab === 'dashboard').
    let dashboardData = null;
    let dashboardLoading = false;
    let dashboardRangePreset = 'today'; // today | 7d | 30d | month | custom
    let dashboardCustomFrom = '';
    let dashboardCustomTo = '';
    let dashboardReturnTab = 'warehouse';

    // Rasm: lokal fayl (siqilib, base64 sifatida save so'rovi ichida
    // yuboriladi) YOKI HTTPS URL — ikkalasi ham qo'llab-quvvatlanadi.
    let tempImageFile = null;
    let tempImagePreviewUrl = null;
    let tempImagePreparingPromise = null;
    let tempImageUrl = null;
    let tempImageExistingUrl = null;
    let tempImageSelectionVersion = 0;

    function clearTempImageSelection() {
      tempImageSelectionVersion += 1;
      if (tempImagePreviewUrl && String(tempImagePreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(tempImagePreviewUrl); } catch (_) {}
      }
      tempImageFile = null;
      tempImagePreviewUrl = null;
      tempImagePreparingPromise = null;
      tempImageUrl = null;
      tempImageExistingUrl = null;
    }
    function initializeTempImageEditor(existingUrl = null) {
      clearTempImageSelection();
      tempImageExistingUrl = hasProductImage({ img: existingUrl }) ? String(existingUrl).trim() : null;
    }
    function takeTempImageSnapshot() {
      const snap = {
        file: tempImageFile,
        preview: tempImagePreviewUrl,
        preparing: tempImagePreparingPromise,
        url: tempImageUrl,
      };
      tempImageFile = null;
      tempImagePreviewUrl = null;
      tempImagePreparingPromise = null;
      tempImageUrl = null;
      tempImageExistingUrl = null;
      tempImageSelectionVersion += 1;
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
      REJECTED: "bg-red-100 text-red-800",
    };
    function statusColorClass(st) { return STATUS_COLORS[st] || "bg-gray-100 text-gray-600"; }
    // 14-band: chek rad etilgan bo'lsa, orders.status o'zi o'zgarmagan (hali
    // "Yangi" bo'lishi mumkin) — lekin mijoz/adminga alohida "Rad etildi"
    // holati ko'rsatiladi, orders.status'ga hech qanday yangi qiymat
    // qo'shilmagan (mavjud update_order_status RPCga tegilmadi).
    // 3-band: "Chek tekshirilmoqda" endi tepadagi badge'da EMAS — faqat
    // effectiveShipmentStatusLabel() orqali "Jo'natma holati" qatorida
    // ko'rsatiladi (ikkita alohida ko'rsatkich birlashtirildi). Tepadagi
    // badge endi buyurtmaning haqiqiy o.status qiymatini ko'rsatadi.
    function orderDisplayStatus(o) {
      if (o?.receiptReviewStatus === 'REJECTED') return 'REJECTED';
      return o?.status;
    }

    // Karta orqali to'langan, chek yuklangan, lekin admin hali ko'rib
    // chiqmagan buyurtma — orders.status hamon "NEW" bo'lib qoladi (hech
    // qanday yangi haqiqiy status qiymati kiritilmagan), faqat displeyda
    // almashtiriladi.
    function isReceiptPendingReview(o) {
      return o?.status === 'NEW' && o?.hasReceipt && (o?.receiptReviewStatus || 'PENDING') === 'PENDING';
    }
    // 3-band: avval mustaqil tepadagi badge ("Chek tekshirilmoqda") va
    // pastdagi "Jo'natma holati: Tayyorlanmoqda" qatori bir vaqtda ko'rinardi.
    // Endi bitta manba — chek ko'rib chiqilayotgan bo'lsa shipment qatorining
    // o'zi "Chek tekshirilmoqda" deydi, aks holda oddiy shipment holati.
    function effectiveShipmentStatusLabel(o) {
      if (isReceiptPendingReview(o)) return tr('🧾 Chek tekshirilmoqda', '🧾 Проверка чека');
      return shipmentStatusLabel(o?.shipment?.status);
    }

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
      nav_support: { uz: "Qo'llab-quvvatlash", ru: "Поддержка" },
      nav_profile: { uz: "Profil", ru: "Профиль" },
      // 14-band: oddiy mijozga ID orqali qidirish mumkinligini reklama qilmaydi
      // — texnik SKU/ID tushunchasi faqat admin uchun. Qidiruv FUNKSIYASI (ID
      // bo'yicha ham topish) o'zgarmagan, faqat matn shartli. Qarang: searchPlaceholderText().
      search_placeholder: { uz: "Nomi yoki ID (masalan: 111001) orqali qidirish...", ru: "Поиск по названию или ID (например: 111001)..." },
      search_placeholder_user: { uz: "Mahsulot qidiring...", ru: "Поиск товара..." },
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
    // 14-band: admin ID/SKU bo'yicha qidirishni bilishi va ishlatishi davom
    // etadi; oddiy mijozga esa bu texnik tafsilot ko'rsatilmaydi.
    function searchPlaceholderText() { return (isAdminMode && isUserAnAdmin) ? t('search_placeholder') : t('search_placeholder_user'); }
    window.fitcoreGetLang = () => uiLang;
    function toggleUiLang() {
      uiLang = uiLang === 'uz' ? 'ru' : 'uz';
      localStorage.setItem('uiLang', uiLang);
      document.documentElement.lang = uiLang;
      render();
    }
    // Admin kiritgan tovar nomi/tavsifi — ruscha tarjimasi bo'lsa va til
    // ruscha tanlangan bo'lsa o'shani, aks holda o'zbekchasini ko'rsatadi.
    function productName(p) { return (uiLang === 'ru' && p.nameRu) ? p.nameRu : p.name; }
    // 5-band: buyurtma ichidagi item — order yaratilganda snapshot qilingan
    // nameRu (create_order action) bo'lsa o'shani, bo'lmasa (eski buyurtmalar)
    // o'zbekchasini ko'rsatadi.
    function orderItemName(i) { return (uiLang === 'ru' && i?.nameRu) ? i.nameRu : (i?.name || ''); }
    function productDesc(p) { return (uiLang === 'ru' && p.descRu) ? p.descRu : (p.desc || ''); }
    function categoryName(c) { return (uiLang === 'ru' && c?.nameRu) ? c.nameRu : (c?.name || ''); }
    // 5-band: BTS/EMU filiali — translate_delivery_branches_batch orqali RU
    // maydon to'ldirilgan bo'lsa o'shani, bo'lmasa (production'da hali
    // ishga tushirilmagan bo'lishi mumkin) o'zbekchasini ko'rsatadi.
    function branchNameLabel(b) { return (uiLang === 'ru' && b?.branch_name_ru) ? b.branch_name_ru : (b?.branch_name || ''); }
    function branchDistrictLabel(b) { return (uiLang === 'ru' && b?.district_or_city_ru) ? b.district_or_city_ru : (b?.district_or_city || ''); }
    function branchAddressLabel(b) { return (uiLang === 'ru' && b?.full_address_ru) ? b.full_address_ru : (b?.full_address || ''); }
    // 6-band: admin do'kon nomini o'zgartirmagan bo'lsa standart "FITCORE"
    // qoladi — orqaga mos, hech kim majburan o'zgartirishga majbur emas.
    function shopDisplayName() { return (shopContact && shopContact.name) ? shopContact.name : 'FITCORE'; }
    function formatNumber(v) {
      const n = Math.round(Number(v || 0));
      return String(Number.isFinite(n) ? n : 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function money(v) { return `${formatNumber(v)} ${tr("so‘m", 'сум')}`; }

    // Har bir katalog uchun o'zidagi va barcha avlod kataloglaridagi tovarlar
    // sonini xotiradagi products/categories ma'lumotidan bir marta hisoblaydi.
    // Bunda qo'shimcha Supabase so'rovi yo'q; noto'g'ri sikl bo'lsa ham cheksiz
    // rekursiyaga tushmaslik uchun visiting to'plami ishlatiladi.
    function buildRecursiveProductCountMap() {
      const childrenByParent = new Map();
      const directProductCount = new Map();

      for (const category of categories) {
        const parentKey = category.parentId === null || category.parentId === undefined
          ? null
          : String(category.parentId);
        if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
        childrenByParent.get(parentKey).push(String(category.id));
      }

      for (const product of products) {
        if (product.status === 'DELETED' || product.categoryId === null || product.categoryId === undefined) continue;
        const categoryKey = String(product.categoryId);
        directProductCount.set(categoryKey, (directProductCount.get(categoryKey) || 0) + 1);
      }

      const totals = new Map();
      const visiting = new Set();
      const countFor = (categoryKey) => {
        if (totals.has(categoryKey)) return totals.get(categoryKey);
        if (visiting.has(categoryKey)) return 0;
        visiting.add(categoryKey);
        let total = directProductCount.get(categoryKey) || 0;
        for (const childKey of childrenByParent.get(categoryKey) || []) total += countFor(childKey);
        visiting.delete(categoryKey);
        totals.set(categoryKey, total);
        return total;
      };

      for (const category of categories) countFor(String(category.id));
      return totals;
    }
    function getMissingImageProducts() {
      return products.filter(p => p.status !== 'DELETED' && !hasProductImage(p));
    }
    function categoryPathForProduct(product) {
      const byId = new Map(categories.map(c => [String(c.id), c]));
      const path = [];
      const seen = new Set();
      let currentId = product?.categoryId === null || product?.categoryId === undefined ? null : String(product.categoryId);
      while (currentId && !seen.has(currentId)) {
        seen.add(currentId);
        const category = byId.get(currentId);
        if (!category) break;
        path.unshift(categoryName(category));
        currentId = category.parentId === null || category.parentId === undefined ? null : String(category.parentId);
      }
      return path.length ? path.join(' / ') : tr('Bosh katalog', 'Главный каталог');
    }
    // categoryPathForProduct bilan bir xil parentId-yurish logikasi, lekin
    // bosiladigan breadcrumb qurish uchun {id, name} massivini qaytaradi.
    function categoryAncestorChain(categoryId) {
      const byId = new Map(categories.map(c => [String(c.id), c]));
      const chain = [];
      const seen = new Set();
      let currentId = categoryId === null || categoryId === undefined ? null : String(categoryId);
      while (currentId && !seen.has(currentId)) {
        seen.add(currentId);
        const category = byId.get(currentId);
        if (!category) break;
        chain.unshift({ id: category.id, name: categoryName(category) });
        currentId = category.parentId === null || category.parentId === undefined ? null : String(category.parentId);
      }
      return chain;
    }
    function openMissingImageQueue() {
      if (!isUserAnAdmin || !isAdminMode) return;
      missingImageQueueIndex = Math.min(missingImageQueueIndex, Math.max(0, getMissingImageProducts().length - 1));
      missingImageQueueSaving = false;
      initializeTempImageEditor(null);
      activePopupModal = 'MISSING_IMAGE_QUEUE';
      selectedProductModal = null;
      render();
    }
    function moveMissingImageQueue(direction) {
      if (missingImageQueueSaving) return;
      const queue = getMissingImageProducts();
      if (!queue.length) return;
      missingImageQueueIndex = Math.max(0, Math.min(queue.length - 1, missingImageQueueIndex + Number(direction || 0)));
      initializeTempImageEditor(null);
      renderModalContainer();
    }
    function regionLabel(v) { return v === 'TASHKENT' ? tr('Toshkent shahri','Город Ташкент') : (v === 'PROVINCE' ? tr('Viloyatlar','Области') : (v || '')); }
    function payMethodLabel(v) { return v === 'CASH' ? tr('Naqd pul','Наличные') : (v === 'CARD' ? tr('Karta','Карта') : (v || '')); }

    const STATUS_LABELS_BY_LANG = {
      uz: { NEW: "Yangi", PROCESSING: "Jarayonda", DELIVERED: "Yetkazib berilgan", CANCELLED: "Bekor qilingan", REJECTED: "❌ Rad etildi" },
      ru: { NEW: "Новый", PROCESSING: "В обработке", DELIVERED: "Доставлен", CANCELLED: "Отменён", REJECTED: "❌ Отклонён" },
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
      const timeoutMs = action === 'bulk_import_products' ? 45000
        : action === 'get_excel_template_url' ? 9000
        : action === 'edit_product_field' && payload?.field === 'img' && !payload?.imageUpload ? 10000
        : action === 'add_product' || action === 'edit_product_field' ? 30000
        : 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
        if (!res.ok) {
          const apiError = new Error(data.error || `Server xatosi (${res.status})`);
          apiError.details = data;
          throw apiError;
        }
        return data;
      } catch (e) {
        if (e.name === 'AbortError') {
          if (action === 'get_excel_template_url') throw new Error("Shablon serverda 9 soniyada tayyor bo'lmadi. Internetni tekshirib qayta urinib ko'ring.");
          if (action === 'edit_product_field' && payload?.field === 'img' && !payload?.imageUpload) throw new Error(tr("Rasm URL 10 soniyada saqlanmadi. Internetni tekshirib qayta urinib ko'ring.", "URL изображения не сохранился за 10 секунд. Проверьте интернет."));
          if (action === 'add_product' || action === 'edit_product_field') throw new Error(tr("Rasm/tovar 30 soniyada saqlanmadi. Internetni tekshirib qayta urinib ko'ring.", "Изображение/товар не сохранились за 30 секунд. Проверьте интернет и повторите."));
          throw new Error("Server javob bermadi (vaqt tugadi). Internetni tekshirib qayta urinib ko'ring.");
        }
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
        // 3.5: name_uz, description_uz, name_ru, description_ru bo'yicha qidiradi.
        // RU maydonlari (avtomatik tarjima qilingan) o'zining haqiqiy kirill
        // shaklida, transliteratsiyasiz solishtiriladi.
        const nameRuMatch = p.nameRu && p.nameRu.toLowerCase().includes(q);
        const descNorm = normalizeText(p.desc || '');
        const descMatch = descNorm.latin.includes(latin) || descNorm.cyrillic.includes(cyrillic);
        const descRuMatch = p.descRu && p.descRu.toLowerCase().includes(q);
        // Har bir o'lchamning O'ZINING ID'sini ham qidiradi.
        const variantSkuMatch = productVariants(p).some(v => v.sku && String(v.sku).toLowerCase().includes(latin));
        const variantTextMatch = productVariants(p).some(v => [v.size,v.color].filter(Boolean).some(x => String(x).toLowerCase().includes(q)));
        return pNorm.latin.includes(latin) || pNorm.cyrillic.includes(cyrillic) || skuMatch || nameRuMatch || descMatch || descRuMatch || variantSkuMatch || variantTextMatch;
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

    // 2-10-band (2026-08-17): qo'llab-quvvatlash — mijoz o'z murojaatlarini,
    // admin barcha murojaatlarni lazy yuklaydi (boshqa lazy ro'yxatlar bilan
    // bir xil pattern). Har ticket endi lastMessage/messageCount bilan keladi
    // (backend attachTicketSummaries) — to'liq thread alohida lazy yuklanadi.
    async function loadMySupportTicketsLazy(force = false) {
      if (supportTicketsLoading || (supportTicketsLoaded && !force)) return;
      supportTicketsLoading = true;
      try {
        const data = await callApi('get_my_support_tickets', {});
        supportTickets = data.tickets || [];
        supportTicketsLoaded = true;
      } catch (e) {
        console.error("Murojaatlarni yuklashda xatolik:", e);
      } finally {
        supportTicketsLoading = false;
        if (activePopupModal === 'SUPPORT') render();
      }
    }
    async function loadAdminSupportTicketsLazy(force = false) {
      if (!isUserAnAdmin || adminSupportTicketsLoading || (adminSupportTicketsLoaded && !force)) return;
      adminSupportTicketsLoading = true;
      try {
        const data = await callApi('get_support_tickets', {});
        adminSupportTickets = data.tickets || [];
        adminSupportTicketsLoaded = true;
      } catch (e) {
        console.error("Murojaatlarni yuklashda xatolik:", e);
      } finally {
        adminSupportTicketsLoading = false;
        if (currentTab === 'support' || currentTab === 'profile') render();
      }
    }
    async function loadSupportMessages(ticketId, force = false) {
      if (!force && openSupportTicketId === ticketId && supportMessages.length) return;
      supportMessagesLoading = true;
      render();
      try {
        const data = await callApi('get_support_messages', { ticketId });
        supportMessages = data.messages || [];
      } catch (e) {
        console.error("Xabarlarni yuklashda xatolik:", e);
        supportMessages = [];
      } finally {
        supportMessagesLoading = false;
        render();
      }
    }
    // 5-band: usersSummary allaqachon boshqa joyda (Mijozlar tab) yuklangan
    // bo'lsa, shundan foydalanib aniq ism ko'rsatamiz — yangi so'rov qo'shmaymiz.
    function supportUserLabel(tgId) {
      const u = usersSummary.find(x => String(x.tgId) === String(tgId));
      return u?.userName ? `${u.userName} (${tgId})` : String(tgId);
    }
    function supportNeedsAttention(t) {
      return t.status === 'ANSWERED' && t.lastMessage?.sender === 'USER';
    }

    // ---- Mijoz tomon ----
    function openSupportModal(orderId) {
      supportTicketOrderId = orderId || null;
      openSupportTicketId = null;
      supportMessages = [];
      supportReplyTarget = null;
      activePopupModal = 'SUPPORT';
      render();
      loadMySupportTicketsLazy().then(resolveActiveSupportTicket);
    }
    // Shu order (yoki umumiy) uchun yopilmagan ticket bo'lsa, to'g'ridan-
    // to'g'ri o'sha chatni ochadi — bo'lmasa yangi xabar yozish ko'rinishi qoladi.
    function resolveActiveSupportTicket() {
      const active = supportTickets.find(t => t.status !== 'CLOSED' && (t.orderId || null) === supportTicketOrderId);
      if (active) { openSupportTicketId = active.id; loadSupportMessages(active.id); }
      else render();
    }
    function openMySupportChat(ticketId) {
      openSupportTicketId = ticketId;
      supportReplyTarget = null;
      render();
      loadSupportMessages(ticketId);
    }
    function backToMySupportList() {
      openSupportTicketId = null;
      supportReplyTarget = null;
      render();
    }
    async function submitSupportComposer() {
      const textareaId = openSupportTicketId ? 'sup-chat-message' : 'sup-message';
      const body = document.getElementById(textareaId)?.value.trim() || '';
      if (!body) return alert(tr("Murojaat matnini yozing.", "Напишите текст обращения."));
      showActionToast(tr("⏳ Yuborilmoqda...", "⏳ Отправка..."), 'saving');
      try {
        if (openSupportTicketId) {
          const data = await callApi('send_support_message', { ticketId: openSupportTicketId, body, replyToMessageId: supportReplyTarget?.id || null });
          supportMessages = [...supportMessages, data.message];
          const idx = supportTickets.findIndex(t => t.id === openSupportTicketId);
          if (idx >= 0) supportTickets[idx] = { ...supportTickets[idx], ...data.ticket, lastMessage: { sender: data.message.sender, body: data.message.body, createdAt: data.message.createdAt } };
        } else {
          const data = await callApi('create_support_ticket', { message: body, orderId: supportTicketOrderId });
          supportTickets = [{ ...data.ticket, lastMessage: { sender: data.message.sender, body: data.message.body, createdAt: data.message.createdAt }, messageCount: 1 }, ...supportTickets];
          openSupportTicketId = data.ticket.id;
          supportMessages = [data.message];
        }
        supportReplyTarget = null;
        render();
        showActionToast(tr("✅ Yuborildi", "✅ Отправлено"), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Yuborilmadi", "❌ Не отправлено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }
    // 7-band: FAQAT mijoz o'zi murojaatni tugatadi.
    async function closeSupportTicket(ticketId) {
      if (!confirm(tr("Murojaatni tugatasizmi? Keyin shu ticketga yozib bo'lmaydi.", "Завершить обращение? После этого писать в этот тикет будет нельзя."))) return;
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохранение..."), 'saving');
      try {
        const data = await callApi('close_support_ticket', { ticketId });
        const idx = supportTickets.findIndex(t => t.id === ticketId);
        if (idx >= 0) supportTickets[idx] = { ...supportTickets[idx], ...data.ticket };
        render();
        showActionToast(tr("✅ Tugallandi", "✅ Завершено"), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }

    // ---- Admin tomon: Support -> User -> Chatlar -> Chat (to'liq sahifa) ----
    function openAdminSupportModal() {
      currentTab = 'support';
      adminSupportSelectedUser = null;
      adminSupportSelectedTicketId = null;
      supportReplyTarget = null;
      render();
      loadAdminSupportTicketsLazy();
    }
    function groupAdminSupportTicketsByUser() {
      const byUser = new Map();
      for (const t of adminSupportTickets) {
        if (!byUser.has(t.tgId)) byUser.set(t.tgId, []);
        byUser.get(t.tgId).push(t);
      }
      return Array.from(byUser.entries()).map(([tgId, tickets]) => ({
        tgId, tickets,
        needsAttention: tickets.some(supportNeedsAttention),
        hasOpen: tickets.some(t => t.status === 'OPEN'),
        lastActivityAt: Math.max(...tickets.map(t => new Date(t.lastMessage?.createdAt || t.createdAt).getTime())),
      })).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    }
    function selectAdminSupportUser(tgId) {
      adminSupportSelectedUser = tgId;
      adminSupportSelectedTicketId = null;
      render();
    }
    function backToAdminSupportUsers() {
      adminSupportSelectedUser = null;
      adminSupportSelectedTicketId = null;
      render();
    }
    function backToAdminSupportUserTickets() {
      adminSupportSelectedTicketId = null;
      supportReplyTarget = null;
      render();
    }
    function openAdminSupportChat(ticketId) {
      adminSupportSelectedTicketId = ticketId;
      supportReplyTarget = null;
      render();
      loadSupportMessages(ticketId);
    }
    async function submitAdminSupportReply() {
      const ticketId = adminSupportSelectedTicketId;
      const body = document.getElementById('sup-admin-message')?.value.trim() || '';
      if (!body) return alert(tr("Javob matnini yozing.", "Напишите текст ответа."));
      showActionToast(tr("⏳ Yuborilmoqda...", "⏳ Отправка..."), 'saving');
      try {
        const data = await callApi('send_support_message', { ticketId, body, replyToMessageId: supportReplyTarget?.id || null });
        supportMessages = [...supportMessages, data.message];
        const idx = adminSupportTickets.findIndex(t => t.id === ticketId);
        if (idx >= 0) adminSupportTickets[idx] = { ...adminSupportTickets[idx], ...data.ticket, lastMessage: { sender: data.message.sender, body: data.message.body, createdAt: data.message.createdAt } };
        supportReplyTarget = null;
        render();
        showActionToast(tr("✅ Javob yuborildi", "✅ Ответ отправлен"), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Yuborilmadi", "❌ Не отправлено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }
    function setSupportReplyTarget(id) {
      const m = supportMessages.find(x => x.id === id);
      if (!m) return;
      supportReplyTarget = { id: m.id, body: m.body, sender: m.sender };
      render();
    }
    function clearSupportReplyTarget() {
      supportReplyTarget = null;
      render();
    }
    // 6-band: xabarlar tarixini render qilish — mijoz va admin chat
    // ko'rinishlari shu bitta funksiyani ishlatadi (ikkinchi tizim yo'q).
    // viewerIsAdmin — hozirgi ko'ruvchi kim ekaniga qarab o'z xabarlari
    // o'ngga (mine/blue), boshqa tomonniki chapga (theirs/gray) chiqadi.
    function renderSupportThreadHtml(messages, viewerIsAdmin) {
      const byId = new Map(messages.map(m => [m.id, m]));
      return messages.map(m => {
        const mine = viewerIsAdmin ? m.sender === 'ADMIN' : m.sender === 'USER';
        const parent = m.replyToMessageId ? byId.get(m.replyToMessageId) : null;
        return `
          <div class="fitcore-msg-row ${mine ? 'mine' : ''}">
            <div class="fitcore-msg-bubble ${mine ? 'mine' : 'theirs'}">
              ${parent ? `<div class="fitcore-msg-reply-quote">${escapeHtml(parent.body.slice(0, 80))}</div>` : ''}
              <div>${escapeHtml(m.body)}</div>
              <div class="fitcore-msg-time">${new Date(m.createdAt).toLocaleString()}</div>
              <span class="fitcore-msg-reply-btn" onclick="setSupportReplyTarget(${m.id})">↩ ${tr('Javob','Ответ')}</span>
            </div>
          </div>`;
      }).join('');
    }
    function renderSupportReplyBarHtml() {
      if (!supportReplyTarget) return '';
      return `
        <div class="fitcore-reply-bar">
          <span>↩ ${tr('Javob','Ответ')}: ${escapeHtml(String(supportReplyTarget.body || '').slice(0, 60))}</span>
          <button onclick="clearSupportReplyTarget()" class="font-bold">✕</button>
        </div>`;
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('text-blue-600', 'font-bold'));
      const activeNav = document.getElementById(`nav-${tab}`);
      if (activeNav) activeNav.classList.add('text-blue-600', 'font-bold');
      render(); // tugma bosilishi darhol sezilsin
      if (tab === 'orders') loadOrdersLazy();
      if (tab === 'support' && isUserAnAdmin) { adminSupportSelectedUser = null; adminSupportSelectedTicketId = null; loadAdminSupportTicketsLazy(); }
      if (tab === 'profile' && isSuperAdmin) loadAdminsLazy();
      if (tab === 'profile' && isUserAnAdmin) loadAdminSupportTicketsLazy();
    }

    function openAllCustomersPage() {
      currentTab = 'users';
      render();
      loadUsersLazy();
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

    // ============ RASM: LOKAL FAYL + URL ============
    // Lokal fayl tanlansa: hech qanday qat'iy MIME ro'yxati bilan OLDINDAN
    // rad etilmaydi (eski bug: Android content:// orqali tanlangan haqiqiy
    // JPEG fayllarning `file.type`i ko'pincha bo'sh/nostandart bo'lib,
    // 10 tadan 8 hol qat'iy ro'yxat tufayli noto'g'ri rad etilardi). Buning
    // o'rniga fayl to'g'ridan-to'g'ri createImageBitmap(file) orqali dekodlashga
    // urinib ko'riladi (FileReader/ArrayBuffer bilan OLDINDAN o'qish YO'Q —
    // aynan shu oldindan o'qish Telegram WebView'da abadiy osilib qolish
    // bug'ining sababi edi). Faqat DEKOD chindan muvaffaqiyatsiz bo'lsagina
    // (haqiqatan qo'llab-quvvatlanmaydigan format) xato ko'rsatiladi.
    async function decodeImageSource(blob) {
      if (typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(blob);
          return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
        } catch (_) {}
      }
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => resolve({ source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, close: () => URL.revokeObjectURL(url) });
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image_decode_failed')); };
        img.src = url;
      });
    }

    function canvasToBlob(canvas, mimeType, quality) {
      return new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
    }

    // Kirish formatidan qat'iy nazar (jpg/png/webp/gif/bmp/heic — brauzer
    // dekodlay olgan hammasi), chiqish PNG (shaffoflik saqlanishi kerak
    // bo'lsa, masalan logotip) yoki JPEG (boshqa barcha holatlarda, eng
    // kichik hajm uchun) bo'lib qayta kodlanadi — shu "siqish" talabining o'zi.
    async function compressImage(file, maxDim, quality) {
      let decoded;
      try { decoded = await decodeImageSource(file); }
      catch (e) { throw e; }
      try {
        let width = decoded.width, height = decoded.height;
        if (!width || !height) throw new Error('image_decode_failed');
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('image_decode_failed');
        ctx.drawImage(decoded.source, 0, 0, width, height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(canvas, outputType, outputType === 'image/png' ? undefined : quality);
        if (!blob) throw new Error('image_decode_failed');
        return blob;
      } finally { decoded.close?.(); }
    }

    async function compressImageToLimit(file, maxBytes, maxDim = 1000, quality = 0.8) {
      const dims = Array.from(new Set([maxDim, Math.min(maxDim, 1200), Math.min(maxDim, 900), Math.min(maxDim, 720), Math.min(maxDim, 600)]))
        .filter((n) => Number(n) > 0).sort((a, b) => b - a);
      const qualities = [quality, Math.min(quality, 0.75), 0.65, 0.55, 0.48];
      let best = null;
      let lastErr = null;
      for (let i = 0; i < dims.length; i++) {
        try {
          const candidate = await compressImage(file, dims[i], qualities[Math.min(i, qualities.length - 1)]);
          if (candidate && (!best || candidate.size < best.size)) best = candidate;
          if (candidate && candidate.size <= maxBytes) return candidate;
        } catch (e) { lastErr = e; }
      }
      if (!best) throw lastErr || new Error('image_decode_failed');
      return best;
    }

    // Faqat CANVAS orqali ISHLAB CHIQARILGAN (allaqachon xotiradagi, native
    // fayl handle'iga bog'liq bo'lmagan) blob ustida ishlaydi — shuning
    // uchun bu yerda FileReader xavfsiz (WebView hang muammosi faqat asl
    // native fayl handle'ini o'qishda bo'lgan).
    async function blobToBase64(blob) {
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }

    function validateExternalImageUrl(value) {
      const raw = String(value || '').trim();
      if (!raw) return null;
      if (raw.length > 2048) throw new Error(tr("Rasm URL juda uzun.", "URL изображения слишком длинный."));
      let parsed;
      try { parsed = new URL(raw); } catch { throw new Error(tr("Rasm URL noto'g'ri. To'liq HTTPS havola kiriting.", "Неверный URL изображения. Введите полный HTTPS-адрес.")); }
      if (parsed.protocol !== 'https:') throw new Error(tr("Rasm URL faqat HTTPS bo'lishi kerak.", "URL изображения должен использовать HTTPS."));
      return parsed.href;
    }

    function setImageUrlError(errorId, message = '') {
      const el = document.getElementById(errorId);
      if (!el) return;
      el.textContent = message;
      el.classList.toggle('hidden', !message);
    }

    function onImageUrlInput(value, previewId, errorId, buttonId) {
      const raw = String(value || '').trim();
      if (tempImagePreviewUrl && String(tempImagePreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(tempImagePreviewUrl); } catch (_) {}
      }
      tempImageFile = null;
      tempImagePreparingPromise = null;
      tempImagePreviewUrl = null;
      tempImageUrl = raw || null;
      const preview = document.getElementById(previewId);
      const pickerButton = buttonId ? document.getElementById(buttonId) : null;
      if (pickerButton) pickerButton.textContent = `🖼 ${tr('Rasm tanlash', 'Выбрать фото')}`;

      if (!raw) {
        setImageUrlError(errorId, '');
        if (preview) {
          if (tempImageExistingUrl) { preview.src = tempImageExistingUrl; preview.classList.remove('hidden'); }
          else { preview.removeAttribute('src'); preview.classList.add('hidden'); }
        }
        return;
      }

      let validUrl;
      try { validUrl = validateExternalImageUrl(raw); }
      catch (e) {
        setImageUrlError(errorId, e.message || String(e));
        if (preview) preview.classList.add('hidden');
        return;
      }
      tempImageUrl = validUrl;
      setImageUrlError(errorId, xlImageText('Rasm tekshirilmoqda…', 'Изображение проверяется…'));
      if (!preview) return;
      preview.onload = () => setImageUrlError(errorId, '');
      preview.onerror = () => {
        preview.classList.add('hidden');
        setImageUrlError(errorId, tr("Rasmni bu URL orqali ko'rsatib bo'lmadi. Havolani tekshiring.", "Не удалось показать изображение по этому URL. Проверьте ссылку."));
      };
      preview.src = validUrl;
      preview.classList.remove('hidden');
    }

    function xlImageText(uz, ru) { return tr(uz, ru); }

    // Fayl tanlangach: preview DARHOL original File'dan ko'rsatiladi (hech
    // qanday o'qishga hojatsiz), so'ng fonda siqish tugagach preview
    // mustaqil (canvas'dan yaratilgan) nusxaga o'tkaziladi.
    async function onImagePicked(event, previewId, buttonId, urlInputId, errorId) {
      const file = event.target.files?.[0];
      if (!file) return;

      const selectionVersion = ++tempImageSelectionVersion;
      if (tempImagePreviewUrl && String(tempImagePreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(tempImagePreviewUrl); } catch (_) {}
      }
      tempImageFile = file;
      try { tempImagePreviewUrl = URL.createObjectURL(file); } catch (_) { tempImagePreviewUrl = null; }
      tempImageUrl = null;
      const urlInput = urlInputId ? document.getElementById(urlInputId) : null;
      if (urlInput) urlInput.value = '';
      if (errorId) setImageUrlError(errorId, '');
      const prev = document.getElementById(previewId);
      if (prev && tempImagePreviewUrl) { prev.src = tempImagePreviewUrl; prev.classList.remove('hidden'); }
      const pickerButton = buttonId ? document.getElementById(buttonId) : null;
      if (pickerButton) pickerButton.textContent = `🖼 ${tr('Rasmni almashtirish', 'Заменить фото')}`;

      const preparing = compressImageToLimit(file, TARGET_IMAGE_BYTES, 1000, 0.8).then((compressed) => {
        if (selectionVersion !== tempImageSelectionVersion || tempImagePreparingPromise !== preparing) return compressed;
        try {
          tempImageFile = compressed;
          const stableUrl = URL.createObjectURL(compressed);
          const oldUrl = tempImagePreviewUrl;
          tempImagePreviewUrl = stableUrl;
          if (prev) { prev.src = stableUrl; prev.classList.remove('hidden'); }
          if (oldUrl && oldUrl !== stableUrl && oldUrl.startsWith('blob:')) { try { URL.revokeObjectURL(oldUrl); } catch (_) {} }
        } catch (_) {}
        return compressed;
      }).catch((e) => {
        if (selectionVersion === tempImageSelectionVersion) {
          if (errorId) setImageUrlError(errorId, tr("Bu rasm formatini o'qib bo'lmadi. Boshqa rasm tanlang.", "Не удалось прочитать этот формат изображения. Выберите другое фото."));
        }
        throw e;
      });
      tempImagePreparingPromise = preparing;
      showActionToast(tr("🖼️ Rasm tanlandi", "🖼️ Фото выбрано"), 'success', 1200);
    }

    // Barcha rasm joylari (mahsulot/kategoriya/logotip/chek) uchun umumiy:
    // lokal fayl tanlangan bo'lsa siqilgan baytlar base64 sifatida
    // qaytariladi (save so'rovi ICHIDA yuboriladi — alohida yuklash
    // so'rovi shart emas), URL kiritilgan bo'lsa to'g'ridan-to'g'ri shu URL
    // ishlatiladi. Hech narsi tanlanmagan bo'lsa (tahrirlashda maydon bo'sh
    // qoldirilsa) `img` umuman qaytarilmaydi — backend eski rasmni
    // o'zgarishsiz qoldiradi.
    async function imagePayloadFromSnapshot(snapshot, requireImage = false) {
      if (snapshot?.file || snapshot?.preparing) {
        let prepared;
        try { prepared = snapshot.preparing ? await snapshot.preparing : snapshot.file; }
        catch (e) { throw e; }
        if (!prepared) { if (requireImage) throw new Error('image_decode_failed'); return { imageUpload: null, img: undefined }; }
        if (prepared.size > MAX_STORED_IMAGE_BYTES) throw new Error('image_too_large');
        return { imageUpload: { mimeType: prepared.type, base64: await blobToBase64(prepared) }, img: undefined };
      }
      if (snapshot?.url) return { imageUpload: null, img: validateExternalImageUrl(snapshot.url) };
      if (requireImage) throw new Error(tr("Rasm tanlang yoki URL kiriting.", "Выберите фото или укажите URL."));
      return { imageUpload: null, img: undefined };
    }
    function friendlyImageError(error) {
      const raw = String(error?.message || error || '');
      if (/failed to fetch|networkerror|load failed/i.test(raw)) return tr("Internet yoki Telegram WebView tarmoq xatosi. Eski rasm o'zgarmadi; internetni tekshirib qayta urinib ko'ring.", "Ошибка сети или Telegram WebView. Старое изображение не изменено; проверьте интернет и повторите.");
      if (/invalid_image_url/i.test(raw)) return tr("Rasm URL noto'g'ri. To'liq HTTPS havola kiriting.", "Неверный URL изображения. Введите полный HTTPS-адрес.");
      if (/invalid_image_upload|invalid_image_type|image_decode_failed/i.test(raw)) return tr("Bu rasm formatini saqlab bo'lmadi. Boshqa rasm tanlang.", "Не удалось сохранить это изображение. Выберите другое фото.");
      if (/image_too_large/i.test(raw)) return tr("Rasm juda katta. Kichikroq rasm tanlang.", "Изображение слишком большое. Выберите файл меньшего размера.");
      if (/image_upload_failed|image_public_url_failed/i.test(raw)) return tr("Rasm server xotirasiga yuklanmadi. Eski rasm saqlanib qoldi; qayta urinib ko'ring.", "Не удалось загрузить изображение в хранилище. Старое изображение сохранено; повторите попытку.");
      return raw || tr("Noma'lum rasm xatosi.", "Неизвестная ошибка изображения.");
    }

    function cancelProductEditor() {
      clearTempImageSelection();
      activePopupModal = null;
      render();
    }

    // RENDER ROUTER
    function updateNavLabels() {
      const map = {
        'nav-label-home': 'nav_home', 'nav-label-categories': 'nav_categories',
        'nav-label-cart': 'nav_cart', 'nav-label-orders': 'nav_orders',
        'nav-label-warehouse': 'nav_warehouse', 'nav-label-support': 'nav_support',
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
      if (flagBtn) flagBtn.innerText = uiLang === 'uz' ? '🇷🇺' : '🇺🇿';
      const cartBtn = document.getElementById('header-cart-btn');
      if (cartBtn) cartBtn.classList.toggle('hidden', isAdminMode && isUserAnAdmin);
      const personBtn = document.getElementById('header-person-btn');
      if (personBtn) personBtn.onclick = isUserAnAdmin ? togglePersonMenu : (() => switchTab('profile'));
    }

    // 20-band: Profildagi katta "rejim almashtirish" tugmasi o'rniga headerdagi
    // odamcha icon — faqat admin huquqiga ega userlarga chiqadi, joriy rejimga
    // qarab bitta variant ko'rsatadi. toggleAdminRole() o'zgarmagan.
    // 17-band: popover avval statik `right-4 top-14` bilan joylashtirilgan
    // edi — bu odamcha iconning haqiqiy ekrandagi joyidan mustaqil taxmin
    // bo'lib, real Telegram'da logo ustidan chiqib qolardi. Endi tugmaning
    // haqiqiy joyi o'lchanadi va popover shunga aniq anchor qilinadi.
    function togglePersonMenu(event) {
      if (event) event.stopPropagation();
      const popover = document.getElementById('role-mode-popover');
      const personBtn = document.getElementById('header-person-btn');
      if (!popover || !personBtn) return;
      const isOpen = !popover.classList.contains('hidden');
      if (isOpen) { popover.classList.add('hidden'); return; }
      const label = isAdminMode ? tr("👤 Userga o'tish", '👤 Перейти к пользователю') : tr("🛡️ Adminga o'tish", '🛡️ Перейти в админку');
      popover.innerHTML = `<button onclick="document.getElementById('role-mode-popover').classList.add('hidden'); toggleAdminRole();" class="block w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 whitespace-nowrap">${label}</button>`;
      popover.classList.remove('hidden');
      const rect = personBtn.getBoundingClientRect();
      const popW = popover.offsetWidth || 200;
      const margin = 8;
      let left = rect.left + rect.width / 2 - popW / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));
      popover.style.top = `${rect.bottom + margin}px`;
      popover.style.left = `${left}px`;
      popover.style.right = 'auto';
    }
    document.addEventListener('click', (event) => {
      const popover = document.getElementById('role-mode-popover');
      const personBtn = document.getElementById('header-person-btn');
      if (!popover || popover.classList.contains('hidden')) return;
      if (popover.contains(event.target) || (personBtn && personBtn.contains(event.target))) return;
      popover.classList.add('hidden');
    });

    function render() {
      updateCartBadge();
      updateNavLabels();
      updateHeaderChrome();

      if (authReady && !registeredUser && !isAdminMode && activePopupModal !== 'REGISTRATION') {
        activePopupModal = 'REGISTRATION';
      }

      const roleTag = document.getElementById('role-tag');
      if (roleTag && authReady) roleTag.classList.remove('hidden');
      const whBtn = document.getElementById('nav-warehouse-btn');
      const supportBtn = document.getElementById('nav-support-btn');
      const cartNavBtn = document.getElementById('nav-cart');

      if (isAdminMode && isUserAnAdmin) {
        roleTag.innerText = "ADMIN";
        roleTag.dataset.role = 'admin';
        whBtn.classList.remove('hidden');
        whBtn.classList.add('flex');
        supportBtn.classList.remove('hidden');
        supportBtn.classList.add('flex');
        cartNavBtn.classList.add('hidden');
        cartNavBtn.classList.remove('flex');
        if (currentTab === 'cart') currentTab = 'home';
      } else {
        roleTag.innerText = "STORE";
        roleTag.dataset.role = 'store';
        whBtn.classList.add('hidden');
        supportBtn.classList.add('hidden');
        cartNavBtn.classList.remove('hidden');
        cartNavBtn.classList.add('flex');
        if (currentTab === 'warehouse' || currentTab === 'support' || currentTab === 'dashboard' || currentTab === 'users') currentTab = 'home';
      }

      const container = document.getElementById('app-content');
      switch (currentTab) {
        case 'home': renderHome(container); break;
        case 'categories': renderCategories(container); break;
        case 'cart': renderCart(container); break;
        case 'orders': renderOrders(container); break;
        case 'warehouse': renderWarehouse(container); break;
        case 'support': renderAdminSupportPage(container); break;
        case 'dashboard': renderDashboard(container); break;
        case 'users': renderUsers(container); break;
        case 'profile': renderProfile(container); break;
      }
      renderModalContainer();
      lucide.createIcons();
    }

    // 1. HOME TAB
    function renderHome(container) {
      const homeFilterActive = isCategoryFilterActive();
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input type="text" id="search-input" oninput="handleSearchDebounced()" placeholder="${escapeHtml(searchPlaceholderText())}"
                class="w-full bg-white pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute left-3 top-3.5"></i>
            </div>
            <button onclick="openCategoryFilterModal()" title="${tr('Filtr','Фильтр')}" class="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl border shadow-sm ${homeFilterActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}">
              🔍${homeFilterActive ? '•' : ''}
            </button>
          </div>

          ${(isAdminMode && isUserAnAdmin) ? `
            <div class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 shadow-sm flex items-center justify-between">
              <span>${tr("🛡️ Admin rejimi", "🛡️ Режим администратора")}</span>
            </div>
          ` : ''}

          <div id="products-grid" class="grid grid-cols-2 gap-3"></div>
          <div id="products-pagination" class="flex flex-wrap justify-center items-center gap-1.5 pt-2"></div>
        </div>
      `;
      handleSearch();
    }

    // Qidiruvni har harfda emas, 300ms kutib bir marta ishlatish (tezlik uchun)
    let searchDebounceTimer = null;
    function handleSearchDebounced() {
      homePage = 1; // 7-band: qidiruv o'zgarsa 1-sahifaga qayt
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(handleSearch, 300);
    }

    function handleSearch() {
      const q = document.getElementById('search-input')?.value || '';
      let filtered = searchProducts(q);

      if (currentTab === 'home' && !q.trim()) {
        filtered = filtered.filter(p => p.isFeatured === true);
      }
      if (currentTab === 'home') filtered = applyCategoryFilter(filtered);

      currentVisibleProductIds = filtered.map(p => p.id);

      const grid = document.getElementById('products-grid');
      const pager = document.getElementById('products-pagination');
      if (!grid) return;

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center py-8 bg-white rounded-2xl p-4 text-xs text-gray-500">${tr("🔍 Bosh sahifa uchun tovar biriktirilmagan yoki topilmadi", "🔍 Для главной страницы нет закреплённых товаров")}</div>`;
        if (pager) pager.innerHTML = '';
        return;
      }

      // 7-band: bosh sahifada ham 10 tadan pagination (katalog ichidagi bilan
      // bir xil uslub — 10 tagacha pagination yo'q).
      const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
      if (homePage > totalPages) homePage = 1;
      const start = (homePage - 1) * 10;
      const pageItems = filtered.slice(start, start + 10);

      grid.innerHTML = pageItems.map((p, i) => renderProductCardHTML(p, start + i, filtered.length)).join('');
      lucide.createIcons();

      if (pager) {
        pager.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => `
          <button onclick="homePage=${pNum}; handleSearch();" class="px-3 py-1.5 rounded-xl text-xs font-bold ${homePage === pNum ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}">${pNum}</button>
        `).join('') : '';
      }
    }

    // REUSABLE PRODUCT CARD
    function renderProductCardHTML(p, idx, totalLen) {
      const inCart = cart[p.id];
      const vars = productVariants(p);
      const variantSizes = [...new Set(vars.map(v => v.size).filter(Boolean))];
      const variantColors = [...new Set(vars.map(v => v.color).filter(Boolean))];
      const hasDiscount = p.oldPrice && p.oldPrice > p.price;
      const bulkSelecting = isAdminMode && isUserAnAdmin && bulkProductSelectMode;
      const cardClick = bulkSelecting ? `toggleBulkProductSelection('${p.id}', event)` : `openProductDetailModal('${p.id}')`;

      return `
        <div data-product-card-id="${escapeHtml(p.id)}" onclick="${cardClick}" class="bg-white rounded-2xl p-3 shadow-sm border ${bulkSelecting && bulkSelectedProductIds.has(String(p.id)) ? 'fitcore-selected-card border-blue-500' : 'border-gray-100'} flex flex-col justify-between relative cursor-pointer hover:shadow-md transition-all">
          ${bulkSelecting ? `<div class="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center font-black ${bulkSelectedProductIds.has(String(p.id)) ? 'bg-blue-600 text-white' : 'bg-white/95 text-gray-400 border'}">${bulkSelectedProductIds.has(String(p.id)) ? '✓' : '○'}</div>` : ''}
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
                  <span class="text-[10px] text-gray-400 line-through font-bold">${money(p.oldPrice)}</span>
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
          ${(isAdminMode && isUserAnAdmin && !bulkSelecting) ? `
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
      const subCats = categories.filter(c => c.parentId === adminCatParentId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const recursiveProductCounts = buildRecursiveProductCountMap();
      const catProdsRaw = products.filter(p => p.categoryId === adminCatParentId && p.status !== 'DELETED');
      const catProds = applyCategoryFilter(catProdsRaw);
      const globalMissingImageCount = getMissingImageProducts().length;
      const filterActive = isCategoryFilterActive();

      const totalPages = Math.ceil(catProds.length / 10) || 1;
      if (categoryPage > totalPages) categoryPage = 1;
      const paginatedProds = catProds.slice((categoryPage - 1) * 10, categoryPage * 10);
      currentVisibleProductIds = paginatedProds.map(p => p.id);

      const catAncestors = categoryAncestorChain(adminCatParentId);
      const breadcrumbHtml = [
        `<span onclick="adminCatParentId = null; categoryPage=1; render();" class="cursor-pointer hover:underline ${catAncestors.length ? 'text-gray-500' : 'text-blue-600'}">${escapeHtml(uiLang === 'ru' ? 'Главные каталоги' : 'Bosh Kataloglar')}</span>`,
        ...catAncestors.map((a, i) => `<span class="text-gray-300">/</span><span onclick="adminCatParentId = '${a.id}'; categoryPage=1; render();" class="cursor-pointer hover:underline ${i === catAncestors.length - 1 ? 'text-blue-600' : 'text-gray-500'}">${escapeHtml(a.name)}</span>`)
      ].join(' ');

      container.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white p-3 rounded-2xl border space-y-2 shadow-sm">
            <div class="flex items-center justify-between text-xs gap-2">
              <span class="font-bold flex flex-wrap items-center gap-x-1 gap-y-0.5">📍 ${breadcrumbHtml}</span>
              ${adminCatParentId ? `
                <div class="flex space-x-1 shrink-0">
                  <button onclick="goBackCatLevel()" class="bg-gray-100 px-2 py-1 rounded-lg font-bold text-[11px]">${tr("⬅️ Orqaga", "⬅️ Назад")}</button>
                  <button onclick="adminCatParentId = null; categoryPage=1; render();" class="bg-gray-100 px-2 py-1 rounded-lg font-bold text-[11px]">${tr("🏠 Boshiga", "🏠 В начало")}</button>
                </div>
              ` : ''}
            </div>

            ${(isAdminMode && isUserAnAdmin) ? `
              <!-- 23-band: Katalog/Tovar/Excel bitta ixcham qatorda, zamonaviy
                   (Lucide) iconlar bilan — eski emoji emas. -->
              <div class="flex space-x-2 pt-1 border-t">
                <button onclick="openAddCatModal()" class="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white font-bold py-1.5 rounded-xl text-xs"><i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>${tr("Katalog", "Каталог")}</button>
                <button onclick="openAddProductModal()" class="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white font-bold py-1.5 rounded-xl text-xs"><i data-lucide="package-plus" class="w-3.5 h-3.5"></i>${tr("Tovar", "Товар")}</button>
                <button onclick="openExcelImportModal()" class="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-white font-bold py-1.5 rounded-xl text-xs"><i data-lucide="table" class="w-3.5 h-3.5"></i>Excel</button>
              </div>
              <div class="flex flex-wrap gap-1.5 pt-1">
                <button onclick="openMissingImageQueue()" title="${tr('Rasmsiz','Без фото')} · ${globalMissingImageCount}" class="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2.5 py-1.5 rounded-xl text-[11px] shadow-sm">🖼️ ${globalMissingImageCount}</button>
                <button onclick="openTrashModal()" title="${tr('Chiqindi (24 soat)','Корзина (24 часа)')}" class="flex items-center gap-1 bg-white border text-gray-600 font-bold px-2.5 py-1.5 rounded-xl text-[11px]">🗑️</button>
                <button onclick="openDuplicateProductsModal()" title="${tr('Duplicate tovarlarni tekshirish','Проверить дубликаты товаров')}" class="flex items-center gap-1 bg-white border text-gray-600 font-bold px-2.5 py-1.5 rounded-xl text-[11px]">🧭</button>
                <button onclick="toggleBulkProductSelectMode()" title="${bulkProductSelectMode ? tr('Tanlashni tugatish','Завершить выбор') : tr('Tovarlarni tanlash','Выбрать товары')}" class="flex items-center gap-1 ${bulkProductSelectMode ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'} font-bold px-2.5 py-1.5 rounded-xl text-[11px]">☑️</button>
              </div>
            ` : ''}
          </div>

          <!-- SUBCATEGORIES LIST -->
          <div class="space-y-2">
            ${subCats.map((sub, subIdx) => `
              <div data-category-row-id="${sub.id}" onclick="adminCatParentId = '${sub.id}'; categoryPage=1; render();" class="fitcore-cat-row p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer">
                <div class="flex items-center space-x-3">
                  ${sub.img && (sub.img.startsWith('http') || sub.img.startsWith('data:')) ?
                    `<img src="${escapeHtml(sub.img)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-8 h-8 object-cover rounded-lg" loading="lazy">` :
                    `<span class="text-xl">${escapeHtml(sub.img) || '📁'}</span>`
                  }
                  <div>
                    <h5 class="font-bold text-sm text-gray-800">${escapeHtml(categoryName(sub))}</h5>
                    <p class="text-[10px] text-gray-400">${categories.filter(c => c.parentId === sub.id).length} ${tr('katalog','кат.')} | ${recursiveProductCounts.get(String(sub.id)) || 0} ${tr('tovar','тов.')}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-1">
                  ${(isAdminMode && isUserAnAdmin) ? `
                    <button onclick="moveCategoryOrder('${sub.id}', -1, event)" ${subIdx === 0 ? 'disabled' : ''} class="px-1.5 py-0.5 bg-gray-100 rounded font-bold">⬆️</button>
                    <button onclick="moveCategoryOrder('${sub.id}', 1, event)" ${subIdx === subCats.length - 1 ? 'disabled' : ''} class="px-1.5 py-0.5 bg-gray-100 rounded font-bold">⬇️</button>
                    <button onclick="openMoveCategoryModal('${sub.id}', event)" title="${tr("Boshqa katalogga ko'chirish", "Переместить в другой каталог")}" class="p-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">📁⇢</button>
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
              <div class="flex gap-1">
                ${catProdsRaw.length > 0 ? `
                  ${bulkProductSelectMode ? `<button onclick="selectAllVisibleProducts()" class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">${tr('Barchasini tanlash','Выбрать все')}</button>` : ''}
                  <button onclick="openCategoryFilterModal()" class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${filterActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}">
                    🔍 ${tr('Filtr','Фильтр')}${filterActive ? ' •' : ''}
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${paginatedProds.map((p, idx) => renderProductCardHTML(p, idx, paginatedProds.length)).join('')}
            </div>

            ${bulkProductSelectMode ? `<div class="sticky bottom-20 z-30 bg-slate-900 text-white rounded-2xl p-2.5 shadow-xl flex flex-wrap items-center gap-2"><b class="text-xs flex-1 min-w-[90px]">${bulkSelectedProductIds.size} ${tr('ta tanlandi','выбрано')}</b><button onclick="openBulkMoveProductsModal()" ${bulkSelectedProductIds.size ? '' : 'disabled'} class="px-3 py-2 rounded-xl bg-blue-600 disabled:opacity-40 text-[11px] font-bold">📁 ${tr('Ko‘chirish','Переместить')}</button><button onclick="bulkTrashSelectedProducts()" ${bulkSelectedProductIds.size ? '' : 'disabled'} class="px-3 py-2 rounded-xl bg-red-600 disabled:opacity-40 text-[11px] font-bold">🗑 ${tr('Chiqindiga','В корзину')}</button><button onclick="clearBulkProductSelection()" class="px-3 py-2 rounded-xl bg-white/10 text-[11px] font-bold">✕</button></div>` : ''}

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
      return !!(categoryFilter.search || categoryFilter.minPrice || categoryFilter.maxPrice || categoryFilter.sortPrice || categoryFilter.sortNew || categoryFilter.sortSold || categoryFilter.hideOutOfStock);
    }

    function applyCategoryFilter(list) {
      let result = list.slice();
      if (categoryFilter.search && categoryFilter.search.trim()) {
        const matchedIds = new Set(searchProducts(categoryFilter.search).map(p => String(p.id)));
        result = result.filter(p => matchedIds.has(String(p.id)));
      }
      if (categoryFilter.hideOutOfStock) result = result.filter(p => Number(p.stock) > 0);
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
      homePage = 1;
    }

    // Har bir saralash: yo'q -> o'suvchi -> kamayuvchi -> yo'q, mustaqil ravishda
    function toggleCategorySortOption(key) {
      const order = [null, 'asc', 'desc'];
      const idx = order.indexOf(categoryFilter[key]);
      categoryFilter[key] = order[(idx + 1) % order.length];
      categoryPage = 1;
      homePage = 1;
      render();
    }

    function clearCategoryFilter() {
      categoryFilter = { search: '', minPrice: '', maxPrice: '', sortPrice: null, sortNew: null, sortSold: null, hideOutOfStock: false };
      categoryPage = 1;
      homePage = 1;
      render();
    }

    function toggleCategoryHideOutOfStock() {
      categoryFilter.hideOutOfStock = !categoryFilter.hideOutOfStock;
      categoryPage = 1;
      homePage = 1;
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

    function topLevelRegionLabel(regionId) {
      const region = TOP_LEVEL_REGIONS.find(item => item.id === regionId);
      return region ? (uiLang === 'ru' ? region.nameRu : region.nameUz) : regionId;
    }

    function checkoutSubtotal() {
      return Object.entries(cart).reduce((sum, [key, itemData]) => {
        const productId = cartEntryProductId(key, itemData);
        const product = products.find(item => item.id === productId);
        return sum + (product ? product.price * (Number(itemData.qty) || 0) : 0);
      }, 0);
    }

    function deliveryOptionLabel(option) {
      if (option.kind === 'FREE') return tr('🆓 Bepul yetkazib berish', '🆓 Бесплатная доставка');
      if (option.kind === 'FIXED') return `${tr('🚚 Uyigacha', '🚚 До дома')} · ${money(option.fee)}`;
      if (option.kind === 'TAXI') return `${tr('🚕 Taksi orqali', '🚕 На такси')} · ${formatNumber(option.minFee)}–${formatNumber(option.maxFee)} ${tr("so'm", 'сум')}`;
      return `📦 ${escapeHtml(option.providerName || tr('Pochta', 'Почта'))}`;
    }

    function deliveryOptionNotice(option) {
      if (!option) return '';
      if (option.kind === 'TAXI') return tr(
        `Yetkazib berish taxminan ${formatNumber(option.minFee)}–${formatNumber(option.maxFee)} so'm. Bu summa buyurtmaga qo'shilmaydi; olganda haydovchiga alohida to'laysiz. ${formatNumber(option.maxFee)} so'm — siz tasdiqlagan maksimal limit.`,
        `Доставка ориентировочно ${formatNumber(option.minFee)}–${formatNumber(option.maxFee)} сум. Сумма не включается в заказ и оплачивается водителю отдельно. ${formatNumber(option.maxFee)} сум — подтверждённый вами максимум.`
      );
      if (option.kind === 'POST' && option.payer === 'CUSTOMER') return tr(
        "Yetkazib berish narxi tovar hajmi/og'irligi va pochta xizmatining amaldagi tariflariga muvofiq hisoblanadi. To'lov pochta xizmatiga alohida amalga oshiriladi.",
        'Стоимость доставки рассчитывается по габаритам/весу и действующим тарифам почты. Оплата производится почтовой службе отдельно.'
      );
      if (option.kind === 'POST') return tr("Pochta xarajati sotuvchi hisobidan; sizdan alohida haq olinmaydi.", 'Почтовые расходы оплачивает продавец; отдельной оплаты с вас нет.');
      if (option.kind === 'FREE') return tr('Yetkazib berish bepul.', 'Доставка бесплатная.');
      return tr('Yetkazib berish narxi hozir to‘lanadigan jami summaga qo‘shiladi.', 'Стоимость доставки включена в итоговую сумму к оплате.');
    }

    let checkoutReceiptFile = null;
    let checkoutReceiptPreparing = null;
    let checkoutReceiptPreviewUrl = null;
    let checkoutReceiptSelectionVersion = 0;

    function clearCheckoutReceipt() {
      checkoutReceiptSelectionVersion += 1;
      if (checkoutReceiptPreviewUrl && String(checkoutReceiptPreviewUrl).startsWith('blob:')) {
        try { URL.revokeObjectURL(checkoutReceiptPreviewUrl); } catch (_) {}
      }
      checkoutReceiptFile = null;
      checkoutReceiptPreparing = null;
      checkoutReceiptPreviewUrl = null;
    }

    // 1.8: native "Choose file / No file chosen" matni hech qachon ko'rinmasin —
    // faqat custom tugma + tanlangach preview + "Almashtirish".
    function renderReceiptPicker(receiptRequired) {
      const label = `${tr("To'lov cheki/skrinshoti", 'Чек/скриншот оплаты')} ${receiptRequired ? '*' : `(${tr('ixtiyoriy', 'необязательно')})`}`;
      const pickerInput = `<input id="chk-receipt" type="file" accept="image/*" onchange="onCheckoutReceiptPicked(event)" class="hidden">`;
      if (checkoutReceiptPreviewUrl) {
        return `
          <label class="block font-bold">${label}</label>
          <div class="flex items-center gap-3 mt-1">
            <img src="${checkoutReceiptPreviewUrl}" class="h-16 w-16 object-cover rounded-xl border" alt="">
            <label class="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">🔄 ${tr('Almashtirish', 'Заменить')}${pickerInput}</label>
          </div>`;
      }
      return `
        <label class="block font-bold">${label}</label>
        <label class="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-blue-600 text-white mt-1">📎 ${tr('Chekni tanlash', 'Выбрать чек')}${pickerInput}</label>`;
    }

    function rerenderReceiptPicker() {
      const wrap = document.getElementById('chk-receipt-wrap');
      if (!wrap) return;
      const regionKey = document.getElementById('chk-region-key')?.value || checkoutDraft.regionKey || 'tashkent_city';
      const selectedPayment = commerce.paymentOptions(fulfillmentConfig, regionKey).find(m => m.id === selectedPayMethod);
      wrap.innerHTML = renderReceiptPicker(!!selectedPayment?.receiptRequired);
    }

    async function onCheckoutReceiptPicked(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const selectionVersion = ++checkoutReceiptSelectionVersion;
      checkoutReceiptFile = file;
      if (checkoutReceiptPreviewUrl) { try { URL.revokeObjectURL(checkoutReceiptPreviewUrl); } catch (_) {} }
      try { checkoutReceiptPreviewUrl = URL.createObjectURL(file); } catch (_) { checkoutReceiptPreviewUrl = null; }
      checkoutReceiptPreparing = compressImageToLimit(file, MAX_RECEIPT_BYTES, 1600, 0.85).then((compressed) => {
        if (selectionVersion !== checkoutReceiptSelectionVersion) return compressed;
        checkoutReceiptFile = compressed;
        try {
          const stableUrl = URL.createObjectURL(compressed);
          const oldUrl = checkoutReceiptPreviewUrl;
          checkoutReceiptPreviewUrl = stableUrl;
          rerenderReceiptPicker();
          if (oldUrl && oldUrl !== stableUrl && oldUrl.startsWith('blob:')) { try { URL.revokeObjectURL(oldUrl); } catch (_) {} }
        } catch (_) {}
        return compressed;
      });
      rerenderReceiptPicker();
    }

    async function prepareReceiptImageUpload() {
      if (!checkoutReceiptFile && !checkoutReceiptPreparing) return null;
      let prepared;
      try {
        prepared = checkoutReceiptPreparing ? await checkoutReceiptPreparing : checkoutReceiptFile;
      } catch (e) {
        console.error('[receipt:READ_FAILED]', e);
        clearCheckoutReceipt();
        rerenderReceiptPicker();
        throw new Error('receipt_read_failed');
      }
      if (!prepared || prepared.size > MAX_RECEIPT_BYTES) throw new Error('receipt_too_large');
      return { base64: await blobToBase64(prepared), mimeType: prepared.type, fileName: 'payment-receipt.jpg' };
    }

    function openCheckoutForm() {
      if (Object.keys(cart).length === 0) return;
      clearCheckoutReceipt();
      selectedDeliveryMethodId = checkoutDraft.deliveryMethodId || selectedDeliveryMethodId;
      selectedPayMethod = checkoutDraft.paymentMethodId || selectedPayMethod;
      activePopupModal = 'CHECKOUT_FORM';
      render();
    }

    function closeCheckoutForm() {
      clearCheckoutReceipt();
      activePopupModal = null;
      render();
    }

    function saveCheckoutDraft() {
      checkoutDraft = {
        fullname: document.getElementById('chk-fullname')?.value || '',
        phone: document.getElementById('chk-phone')?.value || '',
        regionKey: document.getElementById('chk-region-key')?.value || 'tashkent_city',
        district: document.getElementById('chk-district')?.value || '',
        address: document.getElementById('chk-address')?.value || '',
        deliveryMethodId: selectedDeliveryMethodId,
        paymentMethodId: selectedPayMethod,
      };
      localStorage.setItem('checkoutDraft', JSON.stringify(checkoutDraft));
    }

    function applyCheckoutDraftToForm() {
      const fullnameEl = document.getElementById('chk-fullname');
      const phoneEl = document.getElementById('chk-phone');
      if (fullnameEl) fullnameEl.value = checkoutDraft.fullname || (currentUser.firstName + ' ' + currentUser.lastName).trim();
      if (phoneEl) phoneEl.value = checkoutDraft.phone || currentUser.phone || '';
      const regionEl = document.getElementById('chk-region-key');
      if (regionEl) regionEl.value = TOP_LEVEL_REGION_IDS.includes(checkoutDraft.regionKey) ? checkoutDraft.regionKey : 'tashkent_city';
      selectedDeliveryMethodId = checkoutDraft.deliveryMethodId || selectedDeliveryMethodId;
      selectedPayMethod = checkoutDraft.paymentMethodId || selectedPayMethod;
      handleRegionChange(false);
      const districtEl = document.getElementById('chk-district');
      if (districtEl && checkoutDraft.district) districtEl.value = checkoutDraft.district;
      const addressEl = document.getElementById('chk-address');
      if (addressEl) addressEl.value = checkoutDraft.address || '';
      renderCheckoutOptions();
    }

    function handleRegionChange(shouldSave = true) {
      const regionKey = document.getElementById('chk-region-key')?.value || 'tashkent_city';
      const districtSelect = document.getElementById('chk-district');
      const previousDistrict = districtSelect?.value || '';
      const districts = regionKey === 'tashkent_city' ? TASHKENT_CITY_DISTRICTS : (UZ_REGIONS_BY_CODE[regionKey] || []);
      if (districtSelect) {
        districtSelect.innerHTML = `<option value="">${tr('— Tanlang —', '— Выберите —')}</option>` + districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(districtLabelForUi(d))}</option>`).join('');
        if (districts.includes(previousDistrict)) districtSelect.value = previousDistrict;
      }
      selectedDeliveryMethodId = null;
      selectedPayMethod = null;
      clearCheckoutReceipt();
      checkoutSelectedBranch = null;
      checkoutBranches = [];
      checkoutBranchesLoadedFor = null;
      checkoutBranchesLoading = false;
      branchRequestSeq++; // 5.7: har qanday kutilayotgan eski so'rovni bekor qiladi
      // 2-band: viloyat almashsa — real (delivery_branches asosidagi) tuman
      // ro'yxati ham reset qilinadi; #chk-district esa yuqorida hardcoded
      // ro'yxat bilan darhol to'ldirildi (foydalanuvchi kutmasin), real
      // ro'yxat orqadan kelib uni almashtiradi (yoki bo'sh bo'lsa — hardcoded
      // shundayligicha qoladi).
      checkoutDistrictOptions = [];
      checkoutDistrictOptionsLoadedFor = null;
      loadCheckoutDistrictOptions(regionKey);
      renderCheckoutOptions();
      if (shouldSave) saveCheckoutDraft();
    }

    function handleViloyatChange() { handleRegionChange(); }

    // 2-band: bitta #chk-district uchun real tuman/shahar ro'yxati — hardcoded
    // UZ_REGIONS_BY_CODE'dan EMAS (u haqiqiy filial ma'lumotlaridagi
    // district_or_city qiymatlari bilan mos kelmasligi mumkin — masalan
    // "Izboskan" vs "Izboskan tuman"), balki delivery_branches jadvalidagi
    // haqiqiy distinct tumanlardan olinadi. Natija bo'sh bo'lsa (regionda
    // BTS/EMU umuman yo'q), hardcoded ro'yxat o'zgarishsiz qoladi.
    async function loadCheckoutDistrictOptions(regionKey) {
      if (checkoutDistrictOptionsLoadedFor === regionKey) return;
      checkoutDistrictOptionsLoading = true;
      try {
        const result = await callApi('get_delivery_districts', { regionKey });
        checkoutDistrictOptions = result.districts || [];
        checkoutDistrictOptionsLoadedFor = regionKey;
      } catch (e) {
        console.error('Tumanlar ro\'yxatini yuklashda xato:', e);
        checkoutDistrictOptions = [];
        checkoutDistrictOptionsLoadedFor = null;
      } finally {
        checkoutDistrictOptionsLoading = false;
        renderDistrictField();
      }
    }

    // Real ro'yxat kelganda (yoki reload orqali) #chk-district'ni yangilaydi,
    // joriy tanlovni (agar yangi ro'yxatda ham mavjud bo'lsa) saqlab qoladi.
    function renderDistrictField() {
      if (!checkoutDistrictOptions.length) return;
      const select = document.getElementById('chk-district');
      if (!select) return;
      const previousValue = select.value;
      select.innerHTML = `<option value="">${tr('— Tanlang —', '— Выберите —')}</option>` +
        checkoutDistrictOptions.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(districtLabelForUi(d))}</option>`).join('');
      if (checkoutDistrictOptions.includes(previousValue)) select.value = previousValue;
    }

    // Tuman/shahar o'zgarganda: draft saqlanadi, eski filial tanlovi bekor
    // qilinadi, va agar hozir POST provider tanlangan bo'lsa — filiallar shu
    // yangi tuman uchun qayta yuklanadi.
    function handleDistrictChange() {
      saveCheckoutDraft();
      checkoutSelectedBranch = null;
      checkoutBranches = [];
      checkoutBranchesLoadedFor = null;
      const districtValue = document.getElementById('chk-district')?.value || '';
      if (districtValue && String(selectedDeliveryMethodId || '').startsWith('POST:')) {
        const regionKey = document.getElementById('chk-region-key')?.value || checkoutDraft.regionKey || 'tashkent_city';
        loadCheckoutBranches(regionKey, selectedDeliveryMethodId.slice(5), districtValue);
      } else {
        renderBranchPicker();
      }
    }

    function selectDelivery(methodId) {
      // 2-band: POST provider tuman-maydonini yashirmaydi/almashtirmaydi —
      // bitta umumiy #chk-district har doim ko'rinadi. Agar tuman
      // allaqachon tanlangan bo'lsa, provider bosilgach filiallar darhol
      // shu tuman uchun yuklanadi (Viloyat → Tuman/Shahar → Usul → Filial
      // ketma-ketligi o'zgarmaydi).
      if (methodId !== selectedDeliveryMethodId) checkoutSelectedBranch = null;
      selectedDeliveryMethodId = methodId;
      renderCheckoutOptions();
      saveCheckoutDraft();
      const districtValue = document.getElementById('chk-district')?.value || '';
      if (methodId?.startsWith('POST:') && districtValue) {
        const regionKey = document.getElementById('chk-region-key')?.value || checkoutDraft.regionKey || 'tashkent_city';
        loadCheckoutBranches(regionKey, methodId.slice(5), districtValue);
      }
    }

    async function loadCheckoutBranches(regionKey, providerId, districtValue) {
      const cacheKey = `${regionKey}::${districtValue || ''}::${providerId}`;
      if (checkoutBranchesLoadedFor === cacheKey) return;
      // 5.7: bu so'rovning shaxsiy raqami — javob qaytganda joriy
      // hisoblagich bilan solishtiriladi; agar shu orada region/tuman/provider
      // qayta o'zgargan (va yangi so'rov boshlangan) bo'lsa, bu (eski) javob
      // e'tiborsiz qoldiriladi va UI holatini bosib yubormaydi.
      const requestId = ++branchRequestSeq;
      checkoutBranchesLoading = true;
      checkoutBranchSearch = '';
      renderBranchPicker();
      try {
        const result = await callApi('get_delivery_branches', { regionKey, provider: providerId, district: districtValue || undefined });
        if (requestId !== branchRequestSeq) return; // stale javob — e'tiborsiz
        checkoutBranches = result.branches || [];
        checkoutBranchesLoadedFor = cacheKey;
      } catch (e) {
        if (requestId !== branchRequestSeq) return;
        console.error('Filiallarni yuklashda xato:', e);
        checkoutBranches = [];
        checkoutBranchesLoadedFor = null;
      } finally {
        if (requestId === branchRequestSeq) checkoutBranchesLoading = false;
        renderBranchPicker();
      }
    }

    function branchMatchesSearch(branch, query) {
      if (!query || !query.trim()) return true;
      const { latin, cyrillic } = normalizeText(query);
      const fields = [branch.branch_name, branch.district_or_city, branch.full_address];
      return fields.some(f => {
        if (!f) return false;
        const fNorm = normalizeText(f);
        return fNorm.latin.includes(latin) || fNorm.cyrillic.includes(cyrillic);
      });
    }

    function filterBranchList(query) {
      checkoutBranchSearch = query;
      const listEl = document.getElementById('chk-branch-list');
      if (listEl) listEl.innerHTML = renderBranchListHTML();
    }

    function renderBranchListHTML() {
      if (checkoutBranchesLoading) return `<p class="p-3 text-center text-gray-400">${tr('Yuklanmoqda...', 'Загрузка...')}</p>`;
      const filtered = checkoutBranches.filter(b => branchMatchesSearch(b, checkoutBranchSearch));
      if (!filtered.length) return `<p class="p-3 text-center text-gray-400">${tr("Filial topilmadi.", 'Филиалы не найдены.')}</p>`;
      return filtered.map(b => `
        <button type="button" onclick="selectCheckoutBranch(${b.id})" class="w-full text-left p-2.5 ${checkoutSelectedBranch?.id === b.id ? 'bg-blue-50' : 'bg-white'}">
          <p class="font-bold">${escapeHtml(branchNameLabel(b))}</p>
          <p class="text-[10px] text-gray-500">${escapeHtml(branchDistrictLabel(b))} — ${escapeHtml(branchAddressLabel(b))}</p>
        </button>`).join('');
    }

    function renderBranchPicker() {
      const wrap = document.getElementById('chk-branch-wrap');
      if (wrap) wrap.classList.remove('hidden');
      const listEl = document.getElementById('chk-branch-list');
      if (listEl) listEl.innerHTML = renderBranchListHTML();
      renderSelectedBranchSummary();
    }

    function renderSelectedBranchSummary() {
      const el = document.getElementById('chk-branch-selected');
      if (!el) return;
      if (!checkoutSelectedBranch) { el.classList.add('hidden'); el.innerHTML = ''; return; }
      el.classList.remove('hidden');
      el.innerHTML = `<b>✅ ${escapeHtml(branchNameLabel(checkoutSelectedBranch))}</b><br>${escapeHtml(branchDistrictLabel(checkoutSelectedBranch))} — ${escapeHtml(branchAddressLabel(checkoutSelectedBranch))}`;
    }

    function selectCheckoutBranch(branchId) {
      checkoutSelectedBranch = checkoutBranches.find(b => b.id === branchId) || null;
      const listEl = document.getElementById('chk-branch-list');
      if (listEl) listEl.innerHTML = renderBranchListHTML();
      renderSelectedBranchSummary();
    }

    function selectPayment(type) {
      selectedPayMethod = type;
      if (type !== 'CARD') clearCheckoutReceipt();
      renderCheckoutOptions();
      saveCheckoutDraft();
    }

    function renderCheckoutOptions() {
      const regionKey = document.getElementById('chk-region-key')?.value || checkoutDraft.regionKey || 'tashkent_city';
      const deliveryOptions = commerce.deliveryOptions(fulfillmentConfig, regionKey);
      const paymentOptions = commerce.paymentOptions(fulfillmentConfig, regionKey);
      if (!deliveryOptions.some(option => option.id === selectedDeliveryMethodId)) {
        // 5.6: yetkazib berish provideri (POST:BTS/POST:EMU) hech qachon
        // avtomatik tanlanmaydi — mijoz buni o'zi bosishi shart. Boshqa
        // turlar (FREE/FIXED/TAXI) uchun avvalgi qulay xulq — birinchisi
        // avtomatik tanlanadi — saqlanadi.
        const fallback = deliveryOptions.find(option => option.kind !== 'POST');
        selectedDeliveryMethodId = fallback ? fallback.id : null;
      }
      if (!paymentOptions.some(option => option.id === selectedPayMethod)) selectedPayMethod = paymentOptions[0]?.id || null;
      const selectedDelivery = deliveryOptions.find(option => option.id === selectedDeliveryMethodId) || null;
      const selectedPayment = paymentOptions.find(option => option.id === selectedPayMethod) || null;
      const totals = commerce.calculateTotals(checkoutSubtotal(), selectedDelivery);

      const districtValue = document.getElementById('chk-district')?.value || '';
      const deliveryWrap = document.getElementById('delivery-method-wrap');
      if (deliveryWrap) deliveryWrap.innerHTML = deliveryOptions.length ? deliveryOptions.map(option => {
        // 5.6: provider tugmalari tuman tanlanmaguncha bosilmaydigan
        // ko'rinishda ko'rsatiladi — lekin onclick faol qoladi, shunda
        // bosilsa selectDelivery o'zi aniq ogohlantirish ko'rsatadi.
        const disabledLook = option.kind === 'POST' && !districtValue;
        return `
        <button type="button" onclick="selectDelivery('${escapeHtml(option.id)}')" class="w-full text-left p-2.5 border rounded-xl font-bold text-xs ${option.id === selectedDeliveryMethodId ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white text-gray-700'} ${disabledLook ? 'opacity-40' : ''}">
          ${deliveryOptionLabel(option)}
        </button>`;
      }).join('') : `<div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl font-bold">${tr('Bu hudud uchun yetkazib berish usuli yoqilmagan.', 'Для этого региона способы доставки не настроены.')}</div>`;

      const notice = document.getElementById('delivery-notice');
      if (notice) {
        // 13-band: admin izohi bo'lsa, standart bildirishnoma ostida
        // qo'shimcha qator sifatida chiqadi; bo'lmasa hech narsa qo'shilmaydi.
        const noticeText = escapeHtml(deliveryOptionNotice(selectedDelivery));
        const comment = selectedDelivery?.comment ? `<br><b>${escapeHtml(selectedDelivery.comment)}</b>` : '';
        notice.innerHTML = noticeText + comment;
        notice.classList.toggle('hidden', !selectedDelivery);
      }
      // 2-band: POST (BTS/EMU) uchun faqat manzil maydoni yashiriladi (uning
      // o'rniga filial tanlash ro'yxati ko'rsatiladi) — tuman maydoni endi
      // BARCHA yetkazib berish usullari uchun umumiy va doim ko'rinadi.
      const isPost = selectedDelivery?.kind === 'POST';
      const addressField = document.getElementById('chk-address-field');
      if (addressField) addressField.classList.toggle('hidden', isPost);
      const branchWrap = document.getElementById('chk-branch-wrap');
      if (branchWrap) branchWrap.classList.toggle('hidden', !isPost);
      if (isPost) renderBranchPicker();

      const payWrap = document.getElementById('pay-method-wrap');
      if (payWrap) payWrap.innerHTML = paymentOptions.length ? paymentOptions.map(method => `
        <button type="button" onclick="selectPayment('${method.id}')" class="p-2.5 border rounded-xl font-bold text-xs ${method.id === selectedPayMethod ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}">
          ${method.id === 'CASH' ? '💵' : '💳'} ${escapeHtml(method.id === 'CASH' ? tr('Naqd','Наличные') : method.id === 'CARD' ? tr('Karta orqali','Картой') : method.name)}
        </button>`).join('') : `<div class="col-span-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl font-bold">${tr("Bu hudud uchun to'lov usuli yoqilmagan.", 'Для этого региона способы оплаты не настроены.')}</div>`;

      const cardDetails = document.getElementById('card-payment-details');
      if (cardDetails) {
        if (selectedPayment?.id === 'CARD') {
          cardDetails.classList.remove('hidden');
          cardDetails.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl space-y-1">
              <p class="font-bold text-blue-900">${tr("Pul o'tkaziladigan karta", 'Карта для перевода')}</p>
              <p class="font-mono text-sm font-black">${escapeHtml(selectedPayment.cardNumber || '')}</p>
              <p>${escapeHtml(selectedPayment.cardHolder || '')}</p>
              <p class="text-[10px] text-blue-700">${tr(`CVV, PIN, SMS kod yoki amal qilish muddatini hech kimga bermang — ${escapeHtml(shopDisplayName())} ularni so'ramaydi.`, `Никому не сообщайте CVV, PIN, SMS-код или срок действия — ${escapeHtml(shopDisplayName())} их не запрашивает.`)}</p>
            </div>
            <div id="chk-receipt-wrap">${renderReceiptPicker(selectedPayment.receiptRequired)}</div>`;
        } else {
          cardDetails.classList.add('hidden');
          cardDetails.innerHTML = '';
        }
      }
      const subtotalEl = document.getElementById('checkout-subtotal');
      const deliveryFeeEl = document.getElementById('checkout-delivery-fee');
      const payableEl = document.getElementById('checkout-payable-total');
      if (subtotalEl) subtotalEl.textContent = money(totals.subtotal);
      if (deliveryFeeEl) deliveryFeeEl.textContent = selectedDelivery?.kind === 'FIXED' ? money(totals.deliveryFee) : (selectedDelivery?.kind === 'TAXI' ? tr('Alohida', 'Отдельно') : (selectedDelivery?.kind === 'POST' && selectedDelivery.payer === 'CUSTOMER' ? tr('Pochta tarifida', 'По тарифу почты') : money(0)));
      if (payableEl) payableEl.textContent = money(totals.payableTotal);
    }

    let submittingOrder = false;
    async function submitOrder() {
      if (myStatus.isBlocked) {
        return alert(`${tr("🚫 Siz botdan foydalanish huquqidan mahrum qilingansiz", "🚫 Доступ к оформлению заказов заблокирован")}.\n${tr('Sabab','Причина')}: ${myStatus.blockReason || tr("ko'rsatilmagan",'не указана')}\n\n${tr("Batafsil ma'lumot uchun Profil bo'limiga qarang.",'Подробности смотрите в разделе «Профиль».')}`);
      }

      const fullname = document.getElementById('chk-fullname').value.trim();
      const phone = document.getElementById('chk-phone').value.trim();
      const regionKey = document.getElementById('chk-region-key').value;
      const deliveryOptions = commerce.deliveryOptions(fulfillmentConfig, regionKey);
      const paymentOptions = commerce.paymentOptions(fulfillmentConfig, regionKey);
      const selectedDelivery = deliveryOptions.find(option => option.id === selectedDeliveryMethodId);
      const selectedPayment = paymentOptions.find(method => method.id === selectedPayMethod);
      const isPostDelivery = selectedDelivery?.kind === 'POST';

      // 1.13/1.14: BTS/EMU uchun mijoz qo'lda tuman/manzil yozmaydi — ro'yxatdan
      // tanlangan filial manzili ishlatiladi.
      const tuman = isPostDelivery ? (checkoutSelectedBranch?.district_or_city || '') : document.getElementById('chk-district').value.trim();
      const district = isPostDelivery ? tuman : (regionKey === 'tashkent_city' ? tuman : `${topLevelRegionLabel(regionKey)}, ${tuman}`);
      const address = isPostDelivery ? (checkoutSelectedBranch?.full_address || '') : document.getElementById('chk-address').value.trim();

      let hasError = false;

      const requiredFields = isPostDelivery
        ? [['chk-fullname', fullname], ['chk-phone', phone]]
        : [['chk-fullname', fullname], ['chk-phone', phone], ['chk-district', tuman], ['chk-address', address]];

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

      if (!selectedDelivery) return alert(tr('Bu hudud uchun yetkazib berish usulini tanlang.', 'Выберите доступный способ доставки.'));
      if (isPostDelivery && !checkoutSelectedBranch) return alert(tr('Iltimos, pochta filialini tanlang.', 'Пожалуйста, выберите отделение почты.'));
      if (!selectedPayment) return alert(tr("Bu hudud uchun to'lov usuli mavjud emas.", 'Для этого региона нет доступного способа оплаты.'));
      if (selectedPayment.id === 'CARD' && selectedPayment.receiptRequired && !checkoutReceiptFile && !checkoutReceiptPreparing) {
        return alert(tr("Buyurtmani yuborish uchun to'lov chekini yuklang.", 'Чтобы отправить заказ, загрузите чек оплаты.'));
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
        // 1.7: chek order bilan BIR VAQTDA, bitta create_order so'rovida
        // yuboriladi — order avval yaratilib, chek keyin "ixtiyoriy
        // qo'shimcha" sifatida yuborilmaydi.
        let receiptImageUpload = null;
        try { receiptImageUpload = await prepareReceiptImageUpload(); }
        catch (prepError) {
          if (String(prepError?.message) === 'receipt_read_failed') {
            return alert(tr("Chek rasmini o'qib bo'lmadi. Iltimos, chek rasmini qaytadan tanlang.", "Не удалось прочитать фото чека. Пожалуйста, выберите фото чека заново."));
          }
          return alert(tr("Chek rasmi yaroqsiz yoki juda katta.", 'Файл чека повреждён или слишком большой.'));
        }
        const result = await callApi('create_order', {
          items: itemsPayload, fullname, phone, regionKey, district, address,
          deliveryMethodId: selectedDeliveryMethodId, paymentMethodId: selectedPayMethod,
          receiptImageUpload, branchId: isPostDelivery ? checkoutSelectedBranch?.id : undefined,
        });
        const newOrder = formatOrderForUi(result.order);
        orders.unshift(newOrder);
        ordersLoaded = true;
        cart = {};
        localStorage.setItem('cart', JSON.stringify(cart));
        activePopupModal = null;
        checkoutDraft = { fullname: '', phone: '', regionKey: 'tashkent_city', district: '', address: '', deliveryMethodId: null, paymentMethodId: null };
        localStorage.removeItem('checkoutDraft');
        clearCheckoutReceipt();
        checkoutSelectedBranch = null;
        checkoutBranches = [];
        checkoutBranchesLoadedFor = null;
        checkoutDistrictOptions = [];
        checkoutDistrictOptionsLoadedFor = null;
        openOrderSuccessCelebration(newOrder.id);
      } catch (e) {
        console.error(e);
        if (String(e.message).includes('insufficient_stock')) {
          alert(tr("❌ Afsuski, savatchangizdagi bir yoki bir nechta tovar omborda tugab qoldi. Savatchani tekshiring.", "❌ Один или несколько товаров в корзине закончились. Проверьте корзину."));
        } else if (String(e.message).startsWith('blocked:')) {
          myStatus.isBlocked = true;
          myStatus.blockReason = e.message.slice('blocked:'.length);
          alert(`${tr("🚫 Siz botdan foydalanish huquqidan mahrum qilingansiz", "🚫 Доступ к оформлению заказов заблокирован")}.\n${tr('Sabab','Причина')}: ${myStatus.blockReason}`);
        } else if (String(e.message).includes('receipt_required')) {
          alert(tr("Buyurtmani yuborish uchun to'lov chekini yuklang.", 'Чтобы отправить заказ, загрузите чек оплаты.'));
        } else if (String(e.message).includes('receipt_upload_failed')) {
          alert(tr("❌ To'lov cheki yuklanmadi, shuning uchun buyurtma yaratilmadi. Qayta urinib ko'ring.", "❌ Чек оплаты не загрузился, поэтому заказ не был создан. Попробуйте ещё раз."));
        } else if (String(e.message).includes('branch_required') || String(e.message).includes('invalid_branch')) {
          checkoutSelectedBranch = null;
          alert(tr("Iltimos, pochta filialini qaytadan tanlang.", 'Пожалуйста, выберите отделение почты заново.'));
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
            <p class="text-xs text-gray-500">${tr("Buyurtma ID:", "ID заказа:")} <b class="text-blue-600">#${orderId}</b>${tr(`. ${escapeHtml(shopDisplayName())} mutaxassislari tez orada siz bilan bog'lanishadi.`, `. Специалисты ${escapeHtml(shopDisplayName())} скоро свяжутся с вами.`)}</p>
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
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColorClass(orderDisplayStatus(o))}">${statusLabel(orderDisplayStatus(o))}</span>
                    </div>
                    <p class="font-bold text-xs text-gray-800 mt-1">${escapeHtml(o.user)} (${escapeHtml(o.phone)})</p>
                    <p class="text-[10px] text-gray-400">${escapeHtml(regionLabel(o.region))} | ${escapeHtml(payMethodLabel(o.payMethod))}</p>
                    <p class="text-[10px] text-gray-500">${escapeHtml(deliverySnapshotLabel(o))} · ${escapeHtml(effectiveShipmentStatusLabel(o))}</p>
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
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColorClass(orderDisplayStatus(o))}">${statusLabel(orderDisplayStatus(o))}</span>
              </div>
              <p class="text-xs text-gray-500">📅 ${escapeHtml(o.date)}</p>
              <p class="text-xs text-gray-600">🚚 ${escapeHtml(deliverySnapshotLabel(o))} · <b>${escapeHtml(effectiveShipmentStatusLabel(o))}</b></p>
              ${o.shipment?.kind === 'TAXI' && o.shipment?.carNumber ? `<div class="bg-blue-50 border border-blue-200 p-2 rounded-xl text-[11px]">🚕 ${tr('Mashina','Машина')}: <b>${escapeHtml(o.shipment.carNumber)}</b><br>${tr('Haydovchi','Водитель')}: ${escapeHtml(o.shipment.driverPhone || '')}${o.shipment.driverName ? ` · ${escapeHtml(o.shipment.driverName)}` : ''}</div>` : ''}
              ${o.shipment?.kind === 'POST' && o.shipment?.trackingNumber ? `<div class="bg-blue-50 border border-blue-200 p-2 rounded-xl text-[11px]">📦 ${escapeHtml(o.shipment.providerName || o.delivery?.providerName || '')}<br>${tr("Jo'natma raqami",'Трек-номер')}: <b>${escapeHtml(o.shipment.trackingNumber)}</b>${o.shipment.originBranch ? `<br>${tr('Filial','Филиал')}: ${escapeHtml(o.shipment.originBranch)}` : ''}</div>` : ''}
              <div class="text-xs space-y-1.5">
                ${o.items.map(i => `
                  <div class="flex items-center gap-2">
                    ${i.img ? `<img src="${escapeHtml(i.img)}" onerror="this.style.display='none'" class="w-7 h-7 object-cover rounded-lg flex-shrink-0" loading="lazy">` : ''}
                    <p class="font-medium">• ${escapeHtml(orderItemName(i))} ${i.size ? `<span class="text-gray-500 font-mono">[${escapeHtml(i.size)}]</span>` : ''} ${i.color ? `<span class="text-gray-500">[${escapeHtml(i.color)}]</span>` : ''} ${(i.sku && isAdminMode && isUserAnAdmin) ? `<span class="text-gray-400 font-mono">(ID: ${escapeHtml(i.sku)})</span>` : ''} x ${i.qty}</p>
                  </div>
                `).join('')}
              </div>
              ${o.status === 'CANCELLED' && o.cancelReason ? `
                <p class="text-[10px] text-red-500">${tr('Bekor qilindi','Отменён')} (${o.cancelledBy === 'ADMIN' ? tr("do'kon","магазин") : tr('siz','вы')}): ${escapeHtml(o.cancelReason)}</p>
              ` : ''}
              <div class="border-t pt-2 flex justify-between items-center font-bold text-sm">
                <span class="text-green-600">${money(o.payableTotal ?? o.totalPrice)}</span>
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

    // 5. WAREHOUSE TAB — Ombor 2.0: bir nechta ichki bo'lim.
    function warehouseLowStockThreshold() { return 5; }
    function warehouseActiveProducts() { return products.filter(p => p.status !== 'DELETED'); }
    function setWarehouseSection(section) {
      warehouseSection = section;
      render();
      if (section === 'tarix') loadInventoryMovements();
    }
    function renderWarehouse(container) {
      const sections = [
        { id: 'holat', label: tr('Holat', 'Состояние') },
        { id: 'yangilash', label: tr('Yangilash', 'Обновить') },
        { id: 'kirim', label: tr('Kirim', 'Приход') },
        { id: 'kam', label: tr('Kam qolgan', 'Мало') },
        { id: 'tugagan', label: tr('Tugagan', 'Нет в наличии') },
        { id: 'tarix', label: tr('Tarix', 'История') },
      ];
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-slate-800">${t('warehouse_title')}</h2>
            <button onclick="openDashboard()" class="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-slate-900 text-white">📊 ${tr('Hisobot', 'Отчёт')}</button>
          </div>

          <div class="flex flex-wrap gap-1.5">
            ${sections.map(s => `<button onclick="setWarehouseSection('${s.id}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${warehouseSection === s.id ? 'bg-slate-900 text-white' : 'bg-white border text-gray-600'}">${s.label}</button>`).join('')}
          </div>

          ${warehouseSection === 'holat' ? renderWarehouseHolatHtml()
            : warehouseSection === 'yangilash' ? renderWarehouseYangilashHtml()
            : warehouseSection === 'kirim' ? renderWarehouseKirimHtml()
            : warehouseSection === 'kam' ? renderWarehouseProductListHtml(warehouseActiveProducts().filter(p => Number(p.stock) > 0 && Number(p.stock) <= warehouseLowStockThreshold()), tr("Kam qolgan mahsulotlar yo'q.", 'Товаров с малым остатком нет.'))
            : warehouseSection === 'tugagan' ? renderWarehouseProductListHtml(warehouseActiveProducts().filter(p => Number(p.stock) <= 0), tr("Tugagan mahsulotlar yo'q.", 'Закончившихся товаров нет.'))
            : renderWarehouseTarixHtml()}
        </div>
      `;
    }

    // A. Ombor holati — umumiy son ko'rsatkichlari + mavjud katalog daraxti.
    function renderWarehouseHolatHtml() {
      const active = warehouseActiveProducts();
      const totalStock = active.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
      const lowCount = active.filter(p => Number(p.stock) > 0 && Number(p.stock) <= warehouseLowStockThreshold()).length;
      const outCount = active.filter(p => Number(p.stock) <= 0).length;
      const topCats = categories.filter(c => !c.parentId);
      return `
        <div class="grid grid-cols-2 gap-2">
          ${dashboardStatCard({ icon: '📚', label: tr('Jami mahsulot', 'Всего товаров'), value: String(active.length), tint: 'emerald' })}
          ${dashboardStatCard({ icon: '📦', label: tr('Jami qoldiq', 'Общий остаток'), value: String(totalStock), tint: 'blue' })}
          ${dashboardStatCard({ icon: '⚠️', label: tr('Kam qolgan', 'Мало на складе'), value: String(lowCount), tint: 'amber' })}
          ${dashboardStatCard({ icon: '🚫', label: tr('Tugagan', 'Закончились'), value: String(outCount), tint: 'red' })}
        </div>
        <div class="flex gap-1.5">
          <button onclick="warehouseMissingImageOnly=!warehouseMissingImageOnly; if(warehouseMissingImageOnly)warehouseImportedMissingImageOnly=false; render();" class="px-2 py-1.5 rounded-xl text-[10px] font-bold ${warehouseMissingImageOnly ? 'bg-amber-500 text-white' : 'bg-white border text-amber-700'}">🖼 ${tr('Rasmsiz', 'Без фото')} (${getMissingImageProducts().length})</button>
          <button onclick="warehouseImportedMissingImageOnly=!warehouseImportedMissingImageOnly; if(warehouseImportedMissingImageOnly)warehouseMissingImageOnly=false; render();" class="px-2 py-1.5 rounded-xl text-[10px] font-bold ${warehouseImportedMissingImageOnly ? 'bg-blue-600 text-white' : 'bg-white border text-blue-700'}">📊 ${tr('Import rasmsiz', 'Импорт без фото')} (${products.filter(p => p.status !== 'DELETED' && !hasProductImage(p) && p.importBatchId).length})</button>
        </div>
        <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm font-mono text-xs">
          ${topCats.map(parent => renderCategoryTreeNodeHTML(parent, 0)).join('')}
        </div>
      `;
    }

    // B. Qoldiqni yangilash — HOZIRGI ishlayotgan funksiya, o'zgarishsiz,
    // faqat Ombor ichki bo'limiga ko'chirilgan.
    function renderWarehouseYangilashHtml() {
      return `
        <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm">
          <h3 class="font-bold text-sm text-gray-800">${tr("⚡ ID orqali ko'p tovar qoldig'ini yangilash", "⚡ Массовое обновление остатков по ID")}</h3>
          <p class="text-[10px] text-gray-500">${tr("SKU va sonini kiriting (Masalan:", "Введите SKU и количество (Например:")} <b>111001 35</b>)</p>
          <textarea id="bulk-input" rows="4" class="w-full p-2.5 font-mono text-xs border rounded-xl bg-gray-50" placeholder="111001 35&#10;111002 20"></textarea>
          <button onclick="saveBulkStock()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">${tr("💾 Barchasini saqlash", "💾 Сохранить все")}</button>
        </div>
      `;
    }

    // C. Kirim — mavjud qoldiqqa QO'SHISH (almashtirish emas).
    function renderWarehouseKirimHtml() {
      const eligible = warehouseActiveProducts().filter(p => !(Array.isArray(p.variants) && p.variants.length));
      return `
        <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm">
          <h3 class="font-bold text-sm text-gray-800">📥 ${tr('Yangi kirim', 'Новое поступление')}</h3>
          <p class="text-[10px] text-gray-500">${tr("Hozirgi qoldiqqa qo'shiladi (masalan: hozir 5, kirim +10, yangi qoldiq 15). O'lchamli/variantli tovarlar hozircha bu yerdan qo'llab-quvvatlanmaydi.", 'Добавляется к текущему остатку (например: сейчас 5, приход +10, новый остаток 15). Товары с вариантами пока не поддерживаются здесь.')}</p>
          <div>
            <label class="block font-bold text-gray-600 mb-1">${tr('Mahsulot', 'Товар')}</label>
            <select id="kirim-product" class="w-full p-2.5 border rounded-xl bg-gray-50">
              <option value="">${tr('— tanlang —', '— выберите —')}</option>
              ${eligible.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(productName(p))} (SKU ${escapeHtml(p.sku)}, ${tr('hozir', 'сейчас')} ${p.stock})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">${tr('Kirim miqdori (+)', 'Количество прихода (+)')}</label>
            <input id="kirim-qty" type="number" min="1" step="1" placeholder="10" class="w-full p-2.5 border rounded-xl">
          </div>
          <button onclick="submitStockIncoming()" class="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs">✅ ${tr("Kirimni qo'shish", 'Добавить приход')}</button>
        </div>
      `;
    }

    // D/E. Kam qolganlar / Tugaganlar — bir xil ro'yxat ko'rinishi.
    function renderWarehouseProductListHtml(list, emptyText) {
      if (!list.length) return `<p class="text-center text-gray-400 py-10 text-xs">${emptyText}</p>`;
      return `
        <div class="bg-white rounded-2xl border divide-y overflow-hidden">
          ${list.map(p => `
            <div class="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50" onclick="openProductDetailModal('${p.id}')">
              <img src="${escapeHtml(p.img || FALLBACK_IMG)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm text-gray-800 truncate">${escapeHtml(productName(p))}</p>
                <p class="text-[10px] text-gray-400 font-mono">SKU: ${escapeHtml(p.sku)}</p>
              </div>
              <span class="font-black text-xs ${Number(p.stock) <= 0 ? 'text-red-600' : 'text-amber-600'}">${p.stock}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // F. Harakatlar tarixi.
    function renderWarehouseTarixHtml() {
      if (inventoryMovementsLoading || inventoryMovements === null) return `<p class="text-center text-gray-400 py-10 text-xs">${tr('Yuklanmoqda...', 'Загрузка...')}</p>`;
      if (!inventoryMovements.length) return `<p class="text-center text-gray-400 py-10 text-xs">${tr("Hali harakatlar yo'q.", 'Движений пока нет.')}</p>`;
      const typeLabel = (mt) => mt === 'INCOMING' ? tr('Kirim', 'Приход') : mt === 'ORDER' ? tr('Buyurtma', 'Заказ') : tr("Qo'lda yangilash", 'Ручное обновление');
      return `
        <div class="bg-white rounded-2xl border divide-y overflow-hidden">
          ${inventoryMovements.map(m => `
            <div class="p-3 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-gray-800 truncate">${escapeHtml(m.productName || m.productId || '—')}</span>
                <span class="font-black ${Number(m.changeQty) >= 0 ? 'text-emerald-600' : 'text-red-600'}">${Number(m.changeQty) >= 0 ? '+' : ''}${m.changeQty}</span>
              </div>
              <div class="flex items-center justify-between mt-0.5 text-[10px] text-gray-400">
                <span>${typeLabel(m.movementType)}${m.reason ? ` · ${escapeHtml(m.reason)}` : ''}</span>
                <span>${m.oldStock} → ${m.newStock}</span>
              </div>
              <p class="text-[9px] text-gray-300 mt-0.5">${new Date(m.createdAt).toLocaleString()}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    async function loadInventoryMovements() {
      inventoryMovementsLoading = true;
      render();
      try {
        const data = await callApi('get_inventory_movements', { limit: 100 });
        inventoryMovements = data.movements || [];
      } catch (e) {
        console.error(e);
        inventoryMovements = [];
      } finally {
        inventoryMovementsLoading = false;
        if (currentTab === 'warehouse' && warehouseSection === 'tarix') render();
      }
    }

    async function submitStockIncoming() {
      const productId = document.getElementById('kirim-product')?.value || '';
      const qty = Number.parseInt(document.getElementById('kirim-qty')?.value || '', 10);
      if (!productId) return alert(tr('Mahsulotni tanlang.', 'Выберите товар.'));
      if (!Number.isInteger(qty) || qty <= 0) return alert(tr("Kirim miqdorini to'g'ri kiriting.", 'Введите корректное количество прихода.'));
      showActionToast(tr('⏳ Saqlanmoqda...', '⏳ Сохранение...'), 'saving');
      try {
        const result = await callApi('stock_incoming', { productId, qty });
        const idx = products.findIndex(p => p.id === productId);
        if (idx >= 0) Object.assign(products[idx], mapProductFromDB(result.product));
        saveCatalogCache();
        showActionToast(tr('✅ Kirim saqlandi', '✅ Приход сохранён'), 'success', 1500);
        render();
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Saqlanmadi', '❌ Не сохранено'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }

    function renderCategoryTreeNodeHTML(cat, depth) {
      const children = categories.filter(c => c.parentId === cat.id);
      const catProds = products.filter(p => p.categoryId === cat.id && p.status !== 'DELETED' && (!warehouseMissingImageOnly || !hasProductImage(p)) && (!warehouseImportedMissingImageOnly || (!hasProductImage(p) && p.importBatchId)));
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

    // QO'LLAB-QUVVATLASH TAB (admin) — to'liq sahifa, avval modal edi.
    // Ichki tuzilma (Support -> User -> Chatlar -> Chat) o'zgarmagan, faqat
    // taqdimot modal → sahifa bo'lib o'zgardi.
    function renderAdminSupportPage(container) {
      const grouped = groupAdminSupportTicketsByUser();
      const selectedUserTickets = adminSupportSelectedUser ? adminSupportTickets.filter(t => t.tgId === adminSupportSelectedUser) : [];
      const openTicket = adminSupportSelectedTicketId ? adminSupportTickets.find(t => t.id === adminSupportSelectedTicketId) : null;
      container.innerHTML = `
        <div class="space-y-3 text-xs">
          ${openTicket ? `
            <div class="flex items-center justify-between border-b pb-2">
              <button onclick="backToAdminSupportUserTickets()" class="text-[11px] font-bold text-blue-600">‹ ${tr('Orqaga', 'Назад')}</button>
              <h3 class="font-bold text-sm text-gray-900">${openTicket.orderId ? `#${openTicket.orderId} · ` : ''}${escapeHtml(supportUserLabel(openTicket.tgId))}</h3>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${openTicket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : (openTicket.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">${openTicket.status === 'CLOSED' ? tr('Tugallangan', 'Завершено') : (openTicket.status === 'OPEN' ? tr('Yangi', 'Новое') : tr('Javob berilgan', 'Отвечено'))}</span>
            </div>
            <div>
              ${supportMessagesLoading ? `<p class="text-center text-gray-400 py-2">${tr('Yuklanmoqda...', 'Загрузка...')}</p>` : renderSupportThreadHtml(supportMessages, true)}
            </div>
            ${openTicket.status !== 'CLOSED' ? `
              ${renderSupportReplyBarHtml()}
              <textarea id="sup-admin-message" rows="2" placeholder="${tr('Javob yozing...', 'Напишите ответ...')}" class="w-full p-2.5 border rounded-xl"></textarea>
              <button onclick="submitAdminSupportReply()" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr('Yuborish', 'Отправить')}</button>
            ` : `<p class="text-center text-gray-400 py-2">${tr('Mijoz bu murojaatni tugatgan.', 'Клиент завершил это обращение.')}</p>`}
          ` : adminSupportSelectedUser ? `
            <div class="flex items-center justify-between border-b pb-2">
              <button onclick="backToAdminSupportUsers()" class="text-[11px] font-bold text-blue-600">‹ ${tr('Orqaga', 'Назад')}</button>
              <h3 class="font-bold text-sm text-gray-900">${escapeHtml(supportUserLabel(adminSupportSelectedUser))}</h3>
              <span></span>
            </div>
            ${selectedUserTickets.map(t => `
              <div class="border rounded-xl p-2.5 space-y-1 cursor-pointer bg-white" onclick="openAdminSupportChat(${t.id})">
                <div class="flex items-center justify-between">
                  <span class="font-bold">${t.orderId ? `📦 #${t.orderId}` : tr('Umumiy', 'Общее')}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : (t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">${t.status === 'CLOSED' ? tr('Tugallangan', 'Завершено') : (t.status === 'OPEN' ? tr('Yangi', 'Новое') : tr('Javob berilgan', 'Отвечено'))}${supportNeedsAttention(t) ? ' •' : ''}</span>
                </div>
                <p class="text-[10px] text-gray-400">${new Date(t.lastMessage?.createdAt || t.createdAt).toLocaleString()}</p>
                <p>${escapeHtml((t.lastMessage?.body || '').slice(0, 80))}</p>
              </div>
            `).join('')}
          ` : `
            <h2 class="text-lg font-bold text-slate-800">💬 ${tr("Qo'llab-quvvatlash", 'Поддержка')}</h2>
            <div class="bg-white rounded-2xl border divide-y overflow-hidden">
              ${adminSupportTicketsLoading ? `<p class="text-center text-gray-400 py-4">${tr('Yuklanmoqda...', 'Загрузка...')}</p>` : ''}
              ${(!adminSupportTicketsLoading && !grouped.length) ? `<p class="text-center text-gray-400 py-4">${tr('Murojaatlar yo‘q', 'Обращений нет')}</p>` : ''}
              ${grouped.map(g => `
                <div class="p-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50" onclick="selectAdminSupportUser('${g.tgId}')">
                  <div>
                    <p class="font-bold">${escapeHtml(supportUserLabel(g.tgId))}</p>
                    <p class="text-[10px] text-gray-400">${g.tickets.length} ${tr('ta murojaat', 'обращений')}</p>
                  </div>
                  ${g.needsAttention || g.hasOpen ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">${tr('Yangi', 'Новое')}</span>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }

    // 5.5. FOYDALANUVCHILAR (MIJOZLAR) TAB — faqat admin ko'radi
    function renderUsers(container) {
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <button onclick="openDashboard()" class="text-xs font-bold text-blue-600 flex items-center gap-1">‹ ${tr('Dashboard', 'Dashboard')}</button>
            <h2 class="text-lg font-bold text-slate-800">👥 ${t('users_title')}</h2>
            <span class="w-16"></span>
          </div>
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

    // 18-band: matnni saqlash — webhook ulash (setupBotWebhook, o'zgarmagan)
    // dan alohida, START_MESSAGE modalidagi "Saqlash" tugmasi chaqiradi.
    async function saveStartMessage() {
      if (!isSuperAdmin) return;
      const value = document.getElementById('sm-text')?.value.trim() || null;
      const old = shopContact.startMessage;
      shopContact = { ...shopContact, startMessage: value };
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохранение..."), 'saving');
      try {
        await callApi('set_start_message', { startMessage: value });
        showActionToast(tr("✅ Saqlandi", "✅ Сохранено"), 'success', 1600);
      } catch (e) {
        console.error(e);
        shopContact = { ...shopContact, startMessage: old };
        render();
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }

    async function setupBotWebhook() {
      if (!isSuperAdmin) return;
      if (!confirm(tr("Telegram /start xabarlarini Supabase orqali ulaysizmi?", "Подключить сообщения /start через Supabase?"))) return;
      showActionToast(tr("Ulanmoqda...", "Подключение..."), 'saving');
      try {
        const data = await callApi('setup_bot_webhook', {});
        if (!data.ok) throw new Error(data.description || 'webhook_setup_failed');
        showActionToast(tr("✅ /start xabari ulandi", "✅ /start подключён"), 'success', 2200);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ /start ulanmagan", "❌ /start не подключён"), 'error', 2400);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }

    // 6. PROFIL TAB (SUPER ADMIN & ADMIN MANAGEMENT)
    function cleanSocialNick(value) {
      return String(value || '').trim().replace(/^@/, '').replace(/\/+$/, '');
    }

    function shopInfoIsEmpty() {
      return !shopContact.address && !shopContact.coordinates && !shopContact.phone && !shopContact.phone2 &&
        !shopContact.phone3 && !shopContact.instagram && !shopContact.telegram && !shopContact.facebook;
    }

    const DELIVERY_CONFIG_KEYS = { FREE: 'free', FIXED: 'fixed', TAXI: 'taxi' };
    function encodedRegionId(regionId) { return encodeURIComponent(regionId); }
    function decodedRegionId(regionId) { return decodeURIComponent(regionId); }

    function openShopParams() {
      if (!isUserAnAdmin || !isAdminMode) return;
      activePopupModal = 'SHOP_PARAMS';
      render();
    }

    // ==================== 4-BLOK: DO'KON DIZAYNI ====================
    const DESIGN_COLOR_KEYS = ['primary', 'accent', 'button', 'pageBg', 'cardBg', 'headerBg', 'bottomNavBg', 'text'];
    const DESIGN_COLOR_LABELS = {
      primary: tr('Asosiy rang', 'Основной цвет'), accent: tr('Urg\'u rangi', 'Акцентный цвет'),
      button: tr('Tugma rangi', 'Цвет кнопок'), pageBg: tr('Sahifa foni', 'Фон страницы'),
      cardBg: tr('Karta foni', 'Фон карточек'), headerBg: tr('Header foni', 'Фон шапки'),
      bottomNavBg: tr("Pastki panel foni", 'Фон нижней панели'), text: tr('Matn rangi', 'Цвет текста'),
    };
    // 4.1: kamida 5 ta tayyor mavzu. Har biri barcha 8 rolni belgilaydi.
    const DESIGN_THEMES = {
      minimal: { label: tr('Minimal', 'Минимал'), colors: { primary: '#2563eb', accent: '#2563eb', button: '#2563eb', pageBg: '#f6f8fb', cardBg: '#ffffff', headerBg: '#ffffff', bottomNavBg: '#ffffff', text: '#1f2937' } },
      dark: { label: tr('Dark', 'Тёмная'), colors: { primary: '#60a5fa', accent: '#818cf8', button: '#2563eb', pageBg: '#0f172a', cardBg: '#1e293b', headerBg: '#111827', bottomNavBg: '#111827', text: '#f1f5f9' } },
      sport: { label: tr('Sport', 'Спорт'), colors: { primary: '#ea580c', accent: '#f59e0b', button: '#ea580c', pageBg: '#f1f5f9', cardBg: '#ffffff', headerBg: '#111827', bottomNavBg: '#111827', text: '#111827' } },
      elegant: { label: tr('Elegant', 'Элегант'), colors: { primary: '#6d28d9', accent: '#7c3aed', button: '#6d28d9', pageBg: '#faf5ff', cardBg: '#ffffff', headerBg: '#1e1b4b', bottomNavBg: '#1e1b4b', text: '#2e1065' } },
      bright: { label: tr('Bright', 'Яркая'), colors: { primary: '#db2777', accent: '#0891b2', button: '#db2777', pageBg: '#fff7ed', cardBg: '#ffffff', headerBg: '#ffffff', bottomNavBg: '#ffffff', text: '#7c2d12' } },
    };

    // ---- 4.3: WCAG kontrast hisoblash ----
    function hexToRgb(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
      if (!m) return null;
      const n = parseInt(m[1], 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function relLuminance(hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) return null;
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function contrastRatio(hex1, hex2) {
      const l1 = relLuminance(hex1), l2 = relLuminance(hex2);
      if (l1 === null || l2 === null) return 0;
      const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    // 4.3: tugma/header/pastki panel uchun avtomatik o'qiladigan matn rangi.
    function readableTextColor(bgHex) {
      const white = contrastRatio(bgHex, '#ffffff');
      const black = contrastRatio(bgHex, '#000000');
      return white >= black ? '#ffffff' : '#000000';
    }
    const WCAG_AA_RATIO = 4.5;

    function designColorsWithDefaults(colors) {
      const base = DESIGN_THEMES.minimal.colors;
      const merged = {};
      for (const key of DESIGN_COLOR_KEYS) merged[key] = (colors && colors[key]) || base[key];
      return merged;
    }

    // 4.3: saqlashdan oldin o'qilmaydigan kombinatsiyalarni topadi (masalan
    // oq tugma + oq matn). Matn/fon juftlari WCAG AA (4.5:1) bo'yicha tekshiriladi.
    function findContrastIssues(colors) {
      const c = designColorsWithDefaults(colors);
      const issues = [];
      if (contrastRatio(c.text, c.pageBg) < WCAG_AA_RATIO) issues.push({ pair: tr("Matn / Sahifa foni", 'Текст / Фон страницы'), ratio: contrastRatio(c.text, c.pageBg) });
      if (contrastRatio(c.text, c.cardBg) < WCAG_AA_RATIO) issues.push({ pair: tr('Matn / Karta foni', 'Текст / Фон карточек'), ratio: contrastRatio(c.text, c.cardBg) });
      return issues;
    }

    // 4.6: bitta joyda qo'llanadi — Telegram Mini App va oddiy web'da bir xil
    // ishlaydi, chunki bu faqat CSS custom property'larni yangilaydi.
    function applyDesignColors(colors) {
      const c = designColorsWithDefaults(colors);
      const root = document.documentElement.style;
      root.setProperty('--fitcore-primary', c.primary);
      root.setProperty('--fitcore-accent', c.accent);
      root.setProperty('--fitcore-button', c.button);
      root.setProperty('--fitcore-button-text', readableTextColor(c.button));
      root.setProperty('--fitcore-page-bg', c.pageBg);
      root.setProperty('--fitcore-card-bg', c.cardBg);
      root.setProperty('--fitcore-header-bg', c.headerBg);
      root.setProperty('--fitcore-bottomnav-bg', c.bottomNavBg);
      root.setProperty('--fitcore-text', c.text);
    }

    function openDesignSettings() {
      if (!isUserAnAdmin || !isAdminMode) return;
      designDraft = { themeId: designSettings.themeId, colors: { ...designSettings.colors } };
      activePopupModal = 'DESIGN_SETTINGS';
      render();
    }
    function closeDesignSettings() {
      applyDesignColors(designSettings.colors); // bekor qilinsa — saqlangan holatga qaytariladi
      designDraft = null;
      activePopupModal = null;
      render();
    }
    function pickDesignTheme(themeId) {
      const theme = DESIGN_THEMES[themeId];
      if (!theme) return;
      designDraft.themeId = themeId;
      designDraft.colors = { ...theme.colors };
      applyDesignColors(designDraft.colors); // 4.1: tugmani bosganda darhol preview
      renderModalContainer();
    }
    function setDesignColor(key, value) {
      if (!DESIGN_COLOR_KEYS.includes(key)) return;
      designDraft.themeId = 'custom';
      designDraft.colors = { ...designDraft.colors, [key]: value };
      applyDesignColors(designDraft.colors);
      renderModalContainer();
    }
    async function saveDesignSettings() {
      const issues = findContrastIssues(designDraft.colors);
      if (issues.length) {
        const msg = issues.map(i => `${i.pair}: ${i.ratio.toFixed(1)}:1 (kerak ${WCAG_AA_RATIO}:1)`).join('\n');
        if (!confirm(tr(`⚠️ Ba'zi rang juftlari o'qilishi qiyin bo'lishi mumkin:\n${msg}\n\nBaribir saqlaysizmi?`, `⚠️ Некоторые сочетания цветов трудно читать:\n${msg}\n\nВсё равно сохранить?`))) return;
      }
      showActionToast(tr('⏳ Dizayn saqlanmoqda...', '⏳ Дизайн сохраняется...'), 'saving');
      try {
        const result = await callApi('set_design_settings', { themeId: designDraft.themeId, colors: designDraft.colors });
        designSettings = result.designSettings;
        applyDesignColors(designSettings.colors);
        designDraft = null;
        activePopupModal = null;
        render();
        showActionToast(tr('✅ Dizayn saqlandi', '✅ Дизайн сохранён'), 'success', 1500);
      } catch (e) {
        console.error(e);
        applyDesignColors(designSettings.colors);
        showActionToast(tr('❌ Dizayn saqlanmadi', '❌ Дизайн не сохранён'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }

    function openOrderInfoSettings() {
      if (!isUserAnAdmin || !isAdminMode) return;
      activePopupModal = 'ORDER_INFO';
      render();
    }

    function openFulfillmentSettings() {
      if (!isUserAnAdmin || !isAdminMode) return;
      fulfillmentDraft = commerce.normalizeConfig(cloneData(fulfillmentConfig), TOP_LEVEL_REGION_IDS);
      fulfillmentSettingsSection = 'MENU';
      fulfillmentDeliveryKind = 'FREE';
      fulfillmentExpandedPayment = null;
      activePopupModal = 'FULFILLMENT_SETTINGS';
      render();
    }

    function closeFulfillmentSettings() {
      fulfillmentDraft = null;
      activePopupModal = null;
      render();
    }

    // Faqat #fulfillment-panel (sarlavha/Saqlash tugmalaridan tashqari ichki
    // navigatsiya: MENU/DELIVERY/PAYMENTS) qayta chiziladi — tashqi scroll
    // konteyner hech qachon almashtirilmaydi.
    function rerenderFulfillmentPanel() {
      const el = document.getElementById('fulfillment-panel');
      if (el) el.innerHTML = renderFulfillmentPanel();
    }

    // 1.3: checkbox/toggle bosilganda FAQAT ro'yxat qismi (#fulfillment-body)
    // yangilanadi — sarlavha, bo'lim tugmalari va tashqi scroll konteyner
    // qayta yaratilmaydi, shuning uchun scroll pozitsiyasi buzilmaydi.
    function rerenderFulfillmentBody() {
      const el = document.getElementById('fulfillment-body');
      if (!el) return;
      if (fulfillmentSettingsSection === 'PAYMENTS') {
        const method = fulfillmentExpandedPayment ? paymentMethodConfig(fulfillmentExpandedPayment) : null;
        el.innerHTML = method ? renderPaymentMethodSettings(method) : '';
      } else {
        el.innerHTML = renderFulfillmentDeliveryBody();
      }
    }

    function setFulfillmentSettingsSection(section) {
      fulfillmentSettingsSection = section;
      if (section === 'DELIVERY' && !fulfillmentDeliveryKind) fulfillmentDeliveryKind = 'FREE';
      if (section === 'PAYMENTS' && !fulfillmentExpandedPayment) fulfillmentExpandedPayment = 'CASH';
      rerenderFulfillmentPanel();
    }

    function setFulfillmentDeliveryKind(kind) {
      fulfillmentDeliveryKind = kind;
      rerenderFulfillmentPanel();
    }

    // 1.2: Naqd/Karta yonma-yon; birini bosganda sozlamasi pastda ochiladi
    // (accordion) — ikkinchisini bossa birinchisi yopiladi, sahifa uzun
    // ro'yxatga aylanmaydi.
    function setFulfillmentExpandedPayment(methodId) {
      fulfillmentExpandedPayment = fulfillmentExpandedPayment === methodId ? null : methodId;
      rerenderFulfillmentPanel();
    }

    function setDeliveryMethodEnabled(kind, enabled) {
      const key = DELIVERY_CONFIG_KEYS[kind];
      if (!key || !fulfillmentDraft) return;
      fulfillmentDraft.delivery[key].enabled = !!enabled;
      rerenderFulfillmentBody();
    }

    function defaultRegionSetting(kind) {
      if (kind === 'FIXED') return { enabled: true, fee: 40000 };
      if (kind === 'TAXI') return { enabled: true, minFee: 50000, maxFee: 80000 };
      return { enabled: true };
    }

    function setDeliveryRegionEnabled(kind, encodedId, enabled) {
      const key = DELIVERY_CONFIG_KEYS[kind];
      const regionId = decodedRegionId(encodedId);
      if (!key || !TOP_LEVEL_REGION_IDS.includes(regionId)) return;
      if (enabled) fulfillmentDraft.delivery[key].regions[regionId] = { ...(fulfillmentDraft.delivery[key].regions[regionId] || defaultRegionSetting(kind)), enabled: true };
      else delete fulfillmentDraft.delivery[key].regions[regionId];
      rerenderFulfillmentBody();
    }

    function setDeliveryRegionNumber(kind, encodedId, field, value) {
      const key = DELIVERY_CONFIG_KEYS[kind];
      const regionId = decodedRegionId(encodedId);
      if (!key || !fulfillmentDraft.delivery[key].regions[regionId]) return;
      fulfillmentDraft.delivery[key].regions[regionId][field] = Math.max(0, Math.round(Number(value) || 0));
    }

    // 13-band: har bir yetkazib berish usuli/region uchun ixtiyoriy admin
    // izohi — checkoutda usul tanlanganda mavjud bildirishnoma ostida chiqadi.
    function setDeliveryRegionComment(kind, encodedId, value) {
      const key = DELIVERY_CONFIG_KEYS[kind];
      const regionId = decodedRegionId(encodedId);
      if (!key || !fulfillmentDraft.delivery[key].regions[regionId]) return;
      fulfillmentDraft.delivery[key].regions[regionId].comment = String(value || '').slice(0, 200);
    }

    function bulkDeliveryRegions(kind, enabled) {
      const key = DELIVERY_CONFIG_KEYS[kind];
      if (!key) return;
      fulfillmentDraft.delivery[key].regions = enabled ? Object.fromEntries(TOP_LEVEL_REGION_IDS.map(regionId => [regionId, defaultRegionSetting(kind)])) : {};
      rerenderFulfillmentBody();
    }

    function setPostEnabled(enabled) {
      fulfillmentDraft.delivery.post.enabled = !!enabled;
      rerenderFulfillmentBody();
    }

    function postProvider(providerId) {
      return fulfillmentDraft?.delivery?.post?.providers?.find(provider => provider.id === providerId);
    }

    function setPostProviderEnabled(providerId, enabled) {
      const provider = postProvider(providerId); if (!provider) return;
      provider.enabled = !!enabled;
      rerenderFulfillmentBody();
    }

    function setPostProviderName(providerId, name) {
      const provider = postProvider(providerId); if (provider) provider.name = String(name || '').trim().slice(0, 80);
    }

    function setPostRegionEnabled(providerId, encodedId, enabled) {
      const provider = postProvider(providerId), regionId = decodedRegionId(encodedId);
      if (!provider || !TOP_LEVEL_REGION_IDS.includes(regionId)) return;
      if (enabled) provider.regions[regionId] = { ...(provider.regions[regionId] || { payer: 'CUSTOMER' }), enabled: true };
      else delete provider.regions[regionId];
      rerenderFulfillmentBody();
    }

    function setPostRegionPayer(providerId, encodedId, payer) {
      const provider = postProvider(providerId), regionId = decodedRegionId(encodedId);
      if (provider?.regions?.[regionId]) provider.regions[regionId].payer = payer === 'SELLER' ? 'SELLER' : 'CUSTOMER';
    }

    function setPostRegionComment(providerId, encodedId, value) {
      const provider = postProvider(providerId), regionId = decodedRegionId(encodedId);
      if (provider?.regions?.[regionId]) provider.regions[regionId].comment = String(value || '').slice(0, 200);
    }

    function bulkPostRegions(providerId, enabled) {
      const provider = postProvider(providerId); if (!provider) return;
      provider.regions = enabled ? Object.fromEntries(TOP_LEVEL_REGION_IDS.map(regionId => [regionId, { enabled: true, payer: 'CUSTOMER' }])) : {};
      rerenderFulfillmentBody();
    }

    function paymentMethodConfig(methodId) {
      return fulfillmentDraft?.payments?.methods?.find(method => method.id === methodId);
    }

    function setPaymentMethodEnabled(methodId, enabled) {
      const method = paymentMethodConfig(methodId); if (!method) return;
      method.enabled = !!enabled;
      rerenderFulfillmentBody();
    }

    function setPaymentRegionEnabled(methodId, encodedId, enabled) {
      const method = paymentMethodConfig(methodId), regionId = decodedRegionId(encodedId);
      if (!method || !TOP_LEVEL_REGION_IDS.includes(regionId)) return;
      if (enabled) method.regions[regionId] = { enabled: true };
      else delete method.regions[regionId];
      rerenderFulfillmentBody();
    }

    function bulkPaymentRegions(methodId, enabled) {
      const method = paymentMethodConfig(methodId); if (!method) return;
      method.regions = enabled ? Object.fromEntries(TOP_LEVEL_REGION_IDS.map(regionId => [regionId, { enabled: true }])) : {};
      rerenderFulfillmentBody();
    }

    function setCardSetting(field, value) {
      const card = paymentMethodConfig('CARD'); if (!card) return;
      card[field] = field === 'receiptRequired' ? !!value : String(value || '').slice(0, field === 'cardNumber' ? 32 : 120);
    }

    function settingsBulkButtons(onClickAll, onClickClear) {
      return `<div class="flex gap-2"><button type="button" onclick="${onClickAll}" class="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg font-bold text-[10px]">${tr('Barchasini tanlash','Выбрать все')}</button><button type="button" onclick="${onClickClear}" class="bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-bold text-[10px]">${tr('Tozalash','Очистить')}</button></div>`;
    }

    function renderDeliveryRegionRows(kind) {
      const key = DELIVERY_CONFIG_KEYS[kind], regions = fulfillmentDraft.delivery[key].regions;
      return TOP_LEVEL_REGIONS.map(region => {
        const entry = regions[region.id], encoded = encodedRegionId(region.id);
        return `<div class="border rounded-xl p-2.5 space-y-2">
          <label class="flex items-center justify-between gap-2 font-bold"><span>${escapeHtml(uiLang === 'ru' ? region.nameRu : region.nameUz)}</span><input type="checkbox" ${entry?.enabled ? 'checked' : ''} onchange="setDeliveryRegionEnabled('${kind}','${encoded}',this.checked)"></label>
          ${entry?.enabled && kind === 'FIXED' ? `<div class="flex items-center gap-2"><input type="number" min="0" value="${entry.fee || ''}" oninput="setDeliveryRegionNumber('FIXED','${encoded}','fee',this.value)" class="flex-1 p-2 border rounded-xl"><span>${tr("so'm",'сум')}</span></div>` : ''}
          ${entry?.enabled && kind === 'TAXI' ? `<div class="grid grid-cols-2 gap-2"><input type="number" min="0" value="${entry.minFee || ''}" oninput="setDeliveryRegionNumber('TAXI','${encoded}','minFee',this.value)" placeholder="Min" class="p-2 border rounded-xl"><input type="number" min="0" value="${entry.maxFee || ''}" oninput="setDeliveryRegionNumber('TAXI','${encoded}','maxFee',this.value)" placeholder="Max" class="p-2 border rounded-xl"></div>` : ''}
          ${entry?.enabled ? `<input type="text" value="${escapeHtml(entry.comment || '')}" oninput="setDeliveryRegionComment('${kind}','${encoded}',this.value)" placeholder="${tr('Izoh (ixtiyoriy)','Комментарий (необязательно)')}" maxlength="200" class="w-full p-2 border rounded-xl text-[11px]">` : ''}
        </div>`;
      }).join('');
    }

    function renderPostProviderSettings(provider) {
      return `<div class="border rounded-2xl p-3 space-y-3">
        <label class="flex items-center justify-between font-black"><span>📦 ${escapeHtml(provider.name)}</span><input type="checkbox" ${provider.enabled ? 'checked' : ''} onchange="setPostProviderEnabled('${provider.id}',this.checked)"></label>
        ${provider.id === 'OTHER' ? `<input type="text" value="${escapeHtml(provider.name)}" oninput="setPostProviderName('OTHER',this.value)" placeholder="${tr('Pochta nomi','Название почты')}" class="w-full p-2 border rounded-xl">` : ''}
        ${provider.enabled ? `${settingsBulkButtons(`bulkPostRegions('${provider.id}',true)`, `bulkPostRegions('${provider.id}',false)`)}<div class="space-y-2">${TOP_LEVEL_REGIONS.map(region => {
          const entry = provider.regions[region.id], encoded = encodedRegionId(region.id);
          return `<div class="border rounded-xl p-2 space-y-2"><label class="flex justify-between gap-2 font-bold"><span>${escapeHtml(uiLang === 'ru' ? region.nameRu : region.nameUz)}</span><input type="checkbox" ${entry?.enabled ? 'checked' : ''} onchange="setPostRegionEnabled('${provider.id}','${encoded}',this.checked)"></label>${entry?.enabled ? `<select onchange="setPostRegionPayer('${provider.id}','${encoded}',this.value)" class="w-full p-2 border rounded-xl bg-gray-50"><option value="CUSTOMER" ${entry.payer !== 'SELLER' ? 'selected' : ''}>${tr('Pochta xarajati mijoz hisobidan','Почта за счёт клиента')}</option><option value="SELLER" ${entry.payer === 'SELLER' ? 'selected' : ''}>${tr('Pochta xarajati sotuvchi hisobidan','Почта за счёт продавца')}</option></select><input type="text" value="${escapeHtml(entry.comment || '')}" oninput="setPostRegionComment('${provider.id}','${encoded}',this.value)" placeholder="${tr('Izoh (ixtiyoriy)','Комментарий (необязательно)')}" maxlength="200" class="w-full p-2 border rounded-xl text-[11px]">` : ''}</div>`;
        }).join('')}</div>` : ''}
      </div>`;
    }

    function renderPaymentMethodSettings(method) {
      return `<div class="border rounded-2xl p-3 space-y-3">
        <label class="flex items-center justify-between font-black"><span>${method.id === 'CASH' ? '💵' : '💳'} ${escapeHtml(method.id === 'CASH' ? tr('Naqd','Наличные') : method.id === 'CARD' ? tr('Karta orqali','Картой') : method.name)}</span><input type="checkbox" ${method.enabled ? 'checked' : ''} onchange="setPaymentMethodEnabled('${method.id}',this.checked)"></label>
        ${method.enabled ? `${method.id === 'CARD' ? `<div class="bg-blue-50 border border-blue-200 p-3 rounded-xl space-y-2"><input type="text" value="${escapeHtml(method.cardNumber || '')}" oninput="setCardSetting('cardNumber',this.value)" placeholder="8600 0000 0000 0000" class="w-full p-2 border rounded-xl font-mono"><input type="text" value="${escapeHtml(method.cardHolder || '')}" oninput="setCardSetting('cardHolder',this.value)" placeholder="${tr('Karta egasi','Владелец карты')}" class="w-full p-2 border rounded-xl"><label class="flex items-center gap-2 font-bold"><input type="checkbox" ${method.receiptRequired ? 'checked' : ''} onchange="setCardSetting('receiptRequired',this.checked)">${tr('Chek yuklash majburiy','Загрузка чека обязательна')}</label><p class="text-[10px] text-blue-700">${tr('Faqat xaridorga ko‘rsatiladigan karta raqami va egasi. CVV/PIN/SMS saqlanmaydi.','Только номер и владелец карты для показа покупателю. CVV/PIN/SMS не сохраняются.')}</p></div>` : ''}${settingsBulkButtons(`bulkPaymentRegions('${method.id}',true)`, `bulkPaymentRegions('${method.id}',false)`)}<div class="space-y-2">${TOP_LEVEL_REGIONS.map(region => `<label class="flex items-center justify-between border rounded-xl p-2.5 font-bold"><span>${escapeHtml(uiLang === 'ru' ? region.nameRu : region.nameUz)}</span><input type="checkbox" ${method.regions[region.id]?.enabled ? 'checked' : ''} onchange="setPaymentRegionEnabled('${method.id}','${encodedRegionId(region.id)}',this.checked)"></label>`).join('')}</div>` : ''}
      </div>`;
    }

    function renderFulfillmentDeliveryBody() {
      const kind = fulfillmentDeliveryKind;
      if (kind === 'POST') return `<div class="space-y-3"><label class="flex items-center justify-between font-black"><span>${tr('Pochta orqali yetkazib berishni yoqish','Включить доставку почтой')}</span><input type="checkbox" ${fulfillmentDraft.delivery.post.enabled ? 'checked' : ''} onchange="setPostEnabled(this.checked)"></label><p class="text-[10px] text-gray-500">${tr('BTS va EMU filiallari bazadan olinadi: mijoz viloyat → tuman/shahar → provider → filialni tanlaydi.','Филиалы BTS и EMU берутся из базы: клиент выбирает регион → район/город → службу → отделение.')}</p>${fulfillmentDraft.delivery.post.enabled ? fulfillmentDraft.delivery.post.providers.map(renderPostProviderSettings).join('') : ''}</div>`;
      const key = DELIVERY_CONFIG_KEYS[kind], method = fulfillmentDraft.delivery[key];
      const descriptions = {
        FREE: tr('Tanlangan hududlarda checkoutda faqat bepul variant chiqadi.', 'В выбранных регионах появится бесплатный вариант.'),
        FIXED: tr('Har tanlangan hudud uchun uyigacha aniq narx kiriting.', 'Укажите точную стоимость доставки до дома для каждого региона.'),
        TAXI: tr('Taxminiy min/max diapazon informatsion; buyurtma summasiga qo‘shilmaydi.', 'Диапазон min/max информационный и не включается в сумму заказа.'),
      };
      return `<div class="space-y-3"><label class="flex items-center justify-between font-black"><span>${tr('Usulni yoqish','Включить способ')}</span><input type="checkbox" ${method.enabled ? 'checked' : ''} onchange="setDeliveryMethodEnabled('${kind}',this.checked)"></label><p class="text-[10px] text-gray-500">${descriptions[kind]}</p>${method.enabled ? `${settingsBulkButtons(`bulkDeliveryRegions('${kind}',true)`, `bulkDeliveryRegions('${kind}',false)`)}<div class="space-y-2">${renderDeliveryRegionRows(kind)}</div>` : ''}</div>`;
    }

    function fulfillmentBackButton() {
      return `<button type="button" onclick="setFulfillmentSettingsSection('MENU')" class="text-[11px] font-bold text-blue-600 flex items-center gap-1">‹ ${tr('Orqaga','Назад')}</button>`;
    }

    // 1.1: "Yetkazib berish va to'lov" ikkita mustaqil bo'limga bo'lingan:
    // A) Yetkazib berish usullari  B) To'lov turlari. Telegram katalogi kabi
    // — avval bo'lim ro'yxati, bosilganda ichiga kirasiz.
    function renderFulfillmentMenuPanel() {
      const deliveryOnCount = ['FREE', 'FIXED', 'TAXI'].filter(k => fulfillmentDraft.delivery[DELIVERY_CONFIG_KEYS[k]].enabled).length + (fulfillmentDraft.delivery.post.enabled ? 1 : 0);
      const paymentOnCount = fulfillmentDraft.payments.methods.filter(m => m.enabled).length;
      return `<div class="space-y-2">
        <button type="button" onclick="setFulfillmentSettingsSection('DELIVERY')" class="w-full flex items-center justify-between bg-gray-50 border rounded-2xl p-3.5 font-bold text-left">
          <span>🚚 ${tr('Yetkazib berish usullari','Способы доставки')}<br><span class="text-[10px] font-normal text-gray-500">${deliveryOnCount} ${tr('usul yoqilgan','способов включено')}</span></span><span>›</span>
        </button>
        <button type="button" onclick="setFulfillmentSettingsSection('PAYMENTS')" class="w-full flex items-center justify-between bg-gray-50 border rounded-2xl p-3.5 font-bold text-left">
          <span>💳 ${tr("To'lov turlari",'Способы оплаты')}<br><span class="text-[10px] font-normal text-gray-500">${paymentOnCount} ${tr('usul yoqilgan','способов включено')}</span></span><span>›</span>
        </button>
      </div>`;
    }

    function renderFulfillmentDeliveryPanel() {
      const kinds = [
        ['FREE', tr('🆓 Bepul', '🆓 Бесплатно')],
        ['FIXED', tr('🚚 Aniq narx', '🚚 Фикс. цена')],
        ['TAXI', tr('🚕 Taksi', '🚕 Такси')],
        ['POST', tr('📦 Pochta', '📦 Почта')],
      ];
      return `<div class="space-y-3">
        ${fulfillmentBackButton()}
        <div class="flex gap-1 flex-wrap">${kinds.map(([id, label]) => `<button type="button" onclick="setFulfillmentDeliveryKind('${id}')" class="px-2.5 py-1.5 rounded-xl font-bold ${fulfillmentDeliveryKind === id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}">${label}</button>`).join('')}</div>
        <div id="fulfillment-body" class="bg-gray-50 border rounded-2xl p-3">${renderFulfillmentDeliveryBody()}</div>
      </div>`;
    }

    // 1.2: Naqd va Karta yonma-yon tugma; bosilgan usul pastda ochiladi.
    function renderFulfillmentPaymentsPanel() {
      const methods = fulfillmentDraft.payments.methods;
      return `<div class="space-y-3">
        ${fulfillmentBackButton()}
        <div class="grid grid-cols-2 gap-2">${methods.map(m => `
          <button type="button" onclick="setFulfillmentExpandedPayment('${m.id}')" class="p-3 rounded-2xl border font-black flex flex-col items-center gap-1 ${fulfillmentExpandedPayment === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-gray-50 text-gray-700 border-gray-200'}">
            <span class="text-lg">${m.id === 'CASH' ? '💵' : '💳'}</span>
            <span>${escapeHtml(m.name)}</span>
            <span class="text-[9px] font-bold ${m.enabled ? (fulfillmentExpandedPayment === m.id ? 'text-emerald-300' : 'text-emerald-600') : 'text-gray-400'}">${m.enabled ? tr('Yoqilgan','Включено') : tr("O'chirilgan",'Выключено')}</span>
          </button>`).join('')}</div>
        <div id="fulfillment-body">${fulfillmentExpandedPayment ? renderPaymentMethodSettings(paymentMethodConfig(fulfillmentExpandedPayment)) : ''}</div>
      </div>`;
    }

    function renderFulfillmentPanel() {
      if (fulfillmentSettingsSection === 'DELIVERY') return renderFulfillmentDeliveryPanel();
      if (fulfillmentSettingsSection === 'PAYMENTS') return renderFulfillmentPaymentsPanel();
      return renderFulfillmentMenuPanel();
    }

    async function saveFulfillmentSettings() {
      const checked = commerce.validateConfig(fulfillmentDraft, TOP_LEVEL_REGION_IDS);
      if (checked.issues.length) {
        const first = checked.issues[0];
        if (first.code === 'CARD_DETAILS_REQUIRED') return alert(tr('Karta raqami va karta egasi nomini to‘g‘ri kiriting.', 'Правильно укажите номер карты и имя владельца.'));
        if (first.code === 'FIXED_FEE_REQUIRED') return alert(`${topLevelRegionLabel(first.regionId)}: ${tr('aniq yetkazish narxini kiriting.', 'укажите стоимость доставки.')}`);
        return alert(`${topLevelRegionLabel(first.regionId)}: ${tr('taksi min/max diapazonini tekshiring.', 'проверьте диапазон такси min/max.')}`);
      }
      const old = fulfillmentConfig;
      fulfillmentConfig = checked.config;
      activePopupModal = null;
      fulfillmentDraft = null;
      render();
      showActionToast(tr('⏳ Yetkazib berish sozlamalari saqlanmoqda...', '⏳ Настройки доставки сохраняются...'), 'saving');
      try {
        const result = await callApi('set_fulfillment_config', { config: fulfillmentConfig });
        fulfillmentConfig = commerce.normalizeConfig(result.fulfillmentConfig, TOP_LEVEL_REGION_IDS);
        showActionToast(tr('✅ Yetkazib berish va to‘lov sozlamalari saqlandi', '✅ Настройки доставки и оплаты сохранены'), 'success', 1600);
      } catch (e) {
        fulfillmentConfig = old;
        render();
        showActionToast(tr('❌ Sozlamalar saqlanmadi', '❌ Настройки не сохранены'), 'error', 1800);
        alert(tr('Sozlamalarni saqlashda xato: ', 'Ошибка сохранения настроек: ') + (e.message || e));
      }
    }

    function renderProfile(container) {
      const phones = [shopContact.phone, shopContact.phone2, shopContact.phone3].filter(Boolean);
      const instagramNick = cleanSocialNick(shopContact.instagram);
      const telegramNick = cleanSocialNick(shopContact.telegram);
      const facebookNick = cleanSocialNick(shopContact.facebook);
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

          ${!(isUserAnAdmin && isAdminMode) ? `
            <button onclick="openSupportModal(null)" class="w-full bg-white text-slate-700 p-3 rounded-2xl flex items-center justify-between font-bold shadow-sm border border-slate-200 text-xs">
              <span>💬 ${tr("Qo'llab-quvvatlash", 'Поддержка')}</span>
              <span>›</span>
            </button>
          ` : ''}

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
            <div class="flex items-center justify-between gap-3 border-b pb-2 flex-wrap">
              <div class="flex items-center gap-2 min-w-0 flex-wrap">
                <h3 class="font-bold text-sm text-gray-900 truncate">📍 ${escapeHtml(shopDisplayName())}</h3>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  ${instagramNick ? `<a href="https://instagram.com/${encodeURIComponent(instagramNick)}" target="_blank" title="Instagram" class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>` : ''}
                  ${telegramNick ? `<a href="https://t.me/${encodeURIComponent(telegramNick)}" target="_blank" title="Telegram" class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9z"></path></svg></a>` : ''}
                  ${facebookNick ? `<a href="https://facebook.com/${encodeURIComponent(facebookNick)}" target="_blank" title="Facebook" class="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h2.6l.4-4H14V7a1 1 0 0 1 1-1h3z"></path></svg></a>` : ''}
                </div>
                ${(isUserAnAdmin && isAdminMode) ? `
                  <button onclick="initializeTempImageEditor(shopLogoUrl); activePopupModal='SHOP_INFO'; render();" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">✏️ ${tr("Tahrirlash", "Изменить")}</button>
                ` : ''}
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${shopLogoUrl ? `<img id="shop-about-logo" src="${escapeHtml(shopLogoUrl)}" class="h-10 max-w-[100px] object-contain rounded-lg bg-slate-50 p-1 border">` : `<div id="shop-about-logo-empty" class="h-10 min-w-10 px-2 rounded-lg bg-slate-50 border flex items-center justify-center text-[9px] font-bold text-slate-400">${escapeHtml(shopDisplayName())}</div>`}
              </div>
            </div>

            ${shopContact.address ? `
              <div class="flex items-start space-x-3">
                <i data-lucide="map-pin" class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"></i>
                <p class="text-xs font-bold text-gray-800">${escapeHtml((uiLang === 'ru' && shopContact.addressRu) ? shopContact.addressRu : shopContact.address)}</p>
              </div>
            ` : ''}

            ${mapsUrl ? `
              <a href="${escapeHtml(mapsUrl)}" target="_blank" class="flex items-center space-x-3 active:bg-gray-50 rounded-xl p-1 -m-1">
                <i data-lucide="navigation" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
                <div>
                  <p class="text-xs font-bold text-blue-700">${tr("Xaritada ochish", "Открыть на карте")} →</p>
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

            ${shopInfoIsEmpty() ? `
              <p class="text-[11px] text-gray-400 text-center py-2">${(isUserAnAdmin && isAdminMode) ? tr("Do'kon ma'lumotlarini ✏️ Tahrirlash orqali kiriting.", "Заполните данные магазина через ✏️ Изменить.") : ''}</p>
            ` : ''}
          </div>

          ${(isUserAnAdmin && isAdminMode) ? `
            <button onclick="openShopParams()" class="w-full bg-white text-slate-800 p-4 rounded-2xl flex items-center justify-between font-bold shadow-sm border border-slate-200 text-xs">
              <span>⚙️ ${tr("Do'kon sozlamalari", 'Настройки магазина')}</span>
              <span>›</span>
            </button>
            <button onclick="openAdminSupportModal()" class="w-full bg-white text-slate-800 p-4 rounded-2xl flex items-center justify-between font-bold shadow-sm border border-slate-200 text-xs">
              <span>💬 ${tr("Qo'llab-quvvatlash murojaatlari", 'Обращения в поддержку')}${adminSupportTicketsLoaded && adminSupportTickets.some(t => t.status === 'OPEN' || supportNeedsAttention(t)) ? ` <span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">${adminSupportTickets.filter(t => t.status === 'OPEN' || supportNeedsAttention(t)).length}</span>` : ''}</span>
              <span>›</span>
            </button>
          ` : ''}


          ${(isSuperAdmin && isAdminMode) ? `
            <button onclick="activePopupModal='START_MESSAGE'; render();" class="w-full bg-white text-slate-700 p-3 rounded-2xl flex items-center justify-between font-bold shadow-sm border border-slate-200 text-xs">
              <span>🤖 ${tr("Bot /start xabarini ulash", "Подключить сообщение /start")}</span>
              <i data-lucide="link" class="w-4 h-4"></i>
            </button>
          ` : ''}

          <!-- BOSH ADMINGA VA ADMINLARGA KO'RINADIGAN BO'LIM -->
          ${(isSuperAdmin && isAdminMode) ? `
            <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-sm">
              <div class="flex justify-between items-center border-b pb-2">
                <h3 class="font-bold text-xs text-amber-900">${tr("👑 Adminlarni boshqarish (Bosh Admin)", "👑 Управление администраторами (Главный админ)")}</h3>
                <button onclick="activePopupModal='ADD_ADMIN'; render();" title="${tr("Yangi admin qo'shish", "Добавить администратора")}" class="bg-amber-600 hover:bg-amber-700 text-white font-bold w-7 h-7 flex items-center justify-center rounded-xl text-sm shadow-sm">
                  ➕
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
        name: document.getElementById('sc-name').value.trim() || null,
        address: document.getElementById('sc-address').value.trim() || null,
        addressRu: document.getElementById('sc-address-ru').value.trim() || null,
        coordinates: document.getElementById('sc-coordinates').value.trim() || null,
        phone: document.getElementById('sc-phone1').value.trim() || null,
        phone2: document.getElementById('sc-phone2').value.trim() || null,
        phone3: document.getElementById('sc-phone3').value.trim() || null,
        instagram: cleanSocialNick(document.getElementById('sc-instagram').value) || null,
        telegram: cleanSocialNick(document.getElementById('sc-telegram').value) || null,
        facebook: cleanSocialNick(document.getElementById('sc-facebook').value) || null,
      };

      if (next.coordinates && !/^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/.test(next.coordinates)) {
        return alert(tr("Kordinatani '41.217408,69.211225' ko'rinishida yozing.", "Введите координаты в формате '41.217408,69.211225'."));
      }

      const imageSnap = takeTempImageSnapshot();
      let imagePayload;
      try { imagePayload = await imagePayloadFromSnapshot(imageSnap, false); }
      catch (e) { releaseImageSnapshot(imageSnap); return alert(friendlyImageError(e)); }
      const logoChanged = !!(imagePayload.imageUpload || imagePayload.img !== undefined);

      const old = { ...shopContact };
      const oldLogo = shopLogoUrl;
      shopContact = { ...next, startMessage: shopContact.startMessage };
      if (logoChanged && imagePayload.img !== undefined) shopLogoUrl = imagePayload.img;
      activePopupModal = null;
      render(); // optimistic UI — darhol ko'rinadi
      try {
        await callApi('set_shop_contact', next);
        if (logoChanged) {
          const logoResult = await callApi('set_shop_logo', { logoUrl: imagePayload.img, imageUpload: imagePayload.imageUpload });
          shopLogoUrl = logoResult?.logoUrl ?? shopLogoUrl;
          render();
        }
      } catch (e) {
        console.error(e);
        shopContact = old;
        shopLogoUrl = oldLogo;
        render();
        alert(tr("❌ Do'kon ma'lumotlarini saqlab bo'lmadi: ", "❌ Не удалось сохранить данные магазина: ") + friendlyImageError(e));
      } finally {
        releaseImageSnapshot(imageSnap);
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
    function closeAnyOpenModal() {
      clearTempImageSelection();
      activePopupModal = null;
      selectedProductModal = null;
      selectedOrderModal = null;
      selectedCategoryModal = null;
      selectedUserModal = null;
      render();
    }

    function installModalEscapeHandlers() {
      const container = document.getElementById('modal-container');
      if (!container || container.dataset.escapeHandlers === '1') return;
      container.dataset.escapeHandlers = '1';
      container.addEventListener('click', (event) => {
        const overlay = event.target;
        if (overlay instanceof HTMLElement && overlay.parentElement === container && overlay.classList.contains('fixed')) {
          closeAnyOpenModal();
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && container.innerHTML.trim()) closeAnyOpenModal();
      });
    }

    function renderModalContainer() {
      const container = document.getElementById('modal-container');
      installModalEscapeHandlers();

      // REGISTRATION MODAL
      if (activePopupModal === 'REGISTRATION') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2 text-center">${tr(`📝 ${escapeHtml(shopDisplayName())} ro'yxatdan o'tish`, `📝 Регистрация ${escapeHtml(shopDisplayName())}`)}</h3>
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
                <label class="font-bold text-gray-600">${tr("Logotip", "Логотип")}</label>
                <div class="flex items-center gap-3 mt-1">
                  <img id="sc-logo-prev" src="${escapeHtml(shopLogoUrl || '')}" class="h-10 max-w-[100px] object-contain rounded-lg bg-slate-50 p-1 border ${shopLogoUrl ? '' : 'hidden'}">
                  <input id="sc-logo-image-input" type="file" accept="image/*" onchange="onImagePicked(event, 'sc-logo-prev', 'sc-logo-image-button', 'sc-logo-url', 'sc-logo-url-error')" class="hidden">
                  <button id="sc-logo-image-button" type="button" onclick="document.getElementById('sc-logo-image-input').click()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs">🖼️ ${shopLogoUrl ? tr('Almashtirish', 'Заменить') : tr('Rasm tanlash', 'Выбрать изображение')}</button>
                </div>
                <input id="sc-logo-url" type="url" inputmode="url" value="${escapeHtml(shopLogoUrl || '')}" oninput="onImageUrlInput(this.value, 'sc-logo-prev', 'sc-logo-url-error', 'sc-logo-image-button')" placeholder="${tr('yoki Logotip URL (https://...)','или URL логотипа (https://...)')}" class="w-full mt-2 p-2 border rounded-xl">
                <p id="sc-logo-url-error" class="hidden mt-1 text-[10px] text-red-600"></p>
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Do'kon nomi", "Название магазина")}</label>
                <input type="text" id="sc-name" value="${escapeHtml(shopContact.name || '')}" placeholder="FITCORE" class="w-full mt-1 p-2 border rounded-xl">
                <p class="text-[9px] text-gray-400 mt-1">${tr("Bo'sh qoldirilsa, standart \"FITCORE\" nomi ishlatiladi.", "Если оставить пустым, используется название \"FITCORE\" по умолчанию.")}</p>
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Manzil", "Адрес")}</label>
                <input type="text" id="sc-address" value="${escapeHtml(shopContact.address || '')}" placeholder="Sergeli tumani, ..." class="w-full mt-1 p-2 border rounded-xl">
              </div>
              <div>
                <label class="font-bold text-gray-600">${tr("Manzil (ruscha, ixtiyoriy)", "Адрес (по-русски, необязательно)")}</label>
                <input type="text" id="sc-address-ru" value="${escapeHtml(shopContact.addressRu || '')}" placeholder="Сергелийский район, ..." class="w-full mt-1 p-2 border rounded-xl">
                <p class="text-[9px] text-gray-400 mt-1">${tr("Bo'sh qoldirilsa, ruscha rejimda ham o'zbekcha manzil ko'rsatiladi.", "Если оставить пустым, в русском режиме тоже отображается узбекский адрес.")}</p>
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
              <div>
                <label class="font-bold text-gray-600">Facebook ${tr("nickname", "никнейм")}</label>
                <div class="flex items-center mt-1"><span class="px-2 py-2 bg-slate-50 border border-r-0 rounded-l-xl text-gray-500">@</span><input type="text" id="sc-facebook" value="${escapeHtml(cleanSocialNick(shopContact.facebook))}" placeholder="fitcore.uz" class="flex-1 p-2 border rounded-r-xl"></div>
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

      // 18-band: "Bot /start xabarini ulash" endi ikkita ishni bir joyda
      // qiladi — matnni tahrirlash (yangi) va webhookni ulash (mavjud,
      // setupBotWebhook() o'zgarmagan).
      if (activePopupModal === 'START_MESSAGE') {
        const currentStartMessage = shopContact.startMessage || '';
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">🤖 ${tr("Bot /start xabari", "Сообщение бота /start")}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr("Xabar matni", "Текст сообщения")}</label>
                <textarea id="sm-text" rows="8" placeholder="${tr('Standart matn ishlatiladi...', 'Используется стандартный текст...')}" class="w-full mt-1 p-2.5 border rounded-xl font-mono text-[11px]">${escapeHtml(currentStartMessage)}</textarea>
                <p class="text-[9px] text-gray-400 mt-1">${tr("Bo'sh qoldirilsa, standart xabar matni ishlatiladi. HTML teglar (masalan <b>...</b>) qo'llab-quvvatlanadi.", "Если оставить пустым, используется стандартный текст. Поддерживаются HTML-теги (например <b>...</b>).")}</p>
                <button onclick="saveStartMessage()" class="w-full mt-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr("Matnni saqlash", "Сохранить текст")}</button>
              </div>
              <div class="border-t pt-3">
                <button onclick="setupBotWebhook()" class="w-full bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">🔗 ${tr("Webhookni ulash", "Подключить webhook")}</button>
                <p class="text-[9px] text-gray-400 mt-1">${tr("Bu tugma faqat botni Supabase'ga ulaydi — bir marta bosish yetarli.", "Эта кнопка только подключает бота к Supabase — достаточно нажать один раз.")}</p>
              </div>
              <button onclick="activePopupModal=null; render();" class="w-full bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
            </div>
          </div>
        `;
        return;
      }

      if (activePopupModal === 'SHOP_PARAMS') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-4 max-w-md w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="font-black text-sm">⚙️ ${tr("Do'kon parametrlari", "Параметры магазина")}</h3>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
              </div>
              <div class="space-y-2">
                <button type="button" onclick="openOrderInfoSettings()" class="w-full flex items-center justify-between bg-gray-50 border rounded-2xl p-3.5 font-bold text-left"><span>🧾 ${tr("Buyurtma ma'lumotlari", "Информация о заказе")}</span><span>›</span></button>
                <button type="button" onclick="openFulfillmentSettings()" class="w-full flex items-center justify-between bg-gray-50 border rounded-2xl p-3.5 font-bold text-left"><span>🚚 ${tr("Yetkazib berish va to'lov", "Доставка и оплата")}</span><span>›</span></button>
                <button type="button" onclick="openDesignSettings()" class="w-full flex items-center justify-between bg-gray-50 border rounded-2xl p-3.5 font-bold text-left"><span>🎨 ${tr("Dizayn", "Дизайн")}</span><span>›</span></button>
              </div>
            </div>
          </div>`;
        return;
      }

      if (activePopupModal === 'ORDER_INFO') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="activePopupModal='SHOP_PARAMS'; render();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-4 max-w-md w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="font-black text-sm">🧾 ${tr("Buyurtma ma'lumotlari", "Информация о заказе")}</h3>
                <button onclick="activePopupModal='SHOP_PARAMS'; render();" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
              </div>
              <p class="text-gray-400 text-center py-8">${tr("Bu bo'lim tez orada qo'shiladi.", "Этот раздел скоро будет добавлен.")}</p>
            </div>
          </div>`;
        return;
      }

      if (activePopupModal === 'FULFILLMENT_SETTINGS') {
        if (!fulfillmentDraft) fulfillmentDraft = commerce.normalizeConfig(cloneData(fulfillmentConfig), TOP_LEVEL_REGION_IDS);
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-4 max-w-md w-full max-h-[94vh] overflow-y-auto space-y-3 shadow-2xl text-xs">
              <div class="flex items-center justify-between border-b pb-2 gap-2">
                <div><h3 class="font-black text-sm">🚚 ${tr("Yetkazib berish va to'lov", 'Доставка и оплата')}</h3><p class="text-[10px] text-gray-500">${TOP_LEVEL_REGIONS.length} ${tr('ta top-level hudud mavjud ro‘yxatdan olindi', 'регионов взято из текущего списка')}</p></div>
                <button onclick="closeFulfillmentSettings()" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
              </div>
              <div id="fulfillment-panel">${renderFulfillmentPanel()}</div>
              <div class="grid grid-cols-2 gap-2 sticky bottom-0 bg-white pt-2">
                <button onclick="saveFulfillmentSettings()" class="bg-blue-600 text-white font-black py-3 rounded-xl">✅ ${tr('Saqlash','Сохранить')}</button>
                <button onclick="closeFulfillmentSettings()" class="bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">${tr('Bekor qilish','Отмена')}</button>
              </div>
            </div>
          </div>`;
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
              </div>

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
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Tovar rasmi", "Фото товара")}</label>
                <input id="m-prod-image-input" type="file" accept="image/*" onchange="onImagePicked(event, 'm-prod-prev', 'm-prod-image-button', 'm-prod-image-url', 'm-prod-image-url-error')" class="hidden">
                <button id="m-prod-image-button" type="button" onclick="document.getElementById('m-prod-image-input').click()" class="w-full mt-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-sm">🖼 ${tr("Rasm tanlash", "Выбрать фото")}</button>
                <input id="m-prod-image-url" type="url" inputmode="url" oninput="onImageUrlInput(this.value, 'm-prod-prev', 'm-prod-image-url-error', 'm-prod-image-button')" placeholder="${tr('yoki Rasm URL (https://...)','или URL изображения (https://...)')}" class="w-full mt-2 p-2 border rounded-xl">
                <p id="m-prod-image-url-error" class="hidden mt-1 text-[10px] text-red-600"></p>
                <img id="m-prod-prev" src="" class="w-24 h-24 object-cover rounded-xl mt-2 hidden border">
              </div>

              <div class="flex space-x-2 pt-2">
                <button onclick="saveProductFromModal()" class="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl">${tr("✅ Saqlash va omborga kiritish", "✅ Сохранить и добавить на склад")}</button>
                <button onclick="cancelProductEditor()" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
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
                <label class="font-bold text-gray-600">${tr("Katalog rasmi", "Изображение каталога")}</label>
                <div class="flex items-center gap-3 mt-1">
                  <img id="m-cat-prev" src="" class="w-16 h-16 object-cover rounded-xl hidden border">
                  <input id="m-cat-image-input" type="file" accept="image/*" onchange="onImagePicked(event, 'm-cat-prev', 'm-cat-image-button', 'm-cat-image-url', 'm-cat-image-url-error')" class="hidden">
                  <button id="m-cat-image-button" type="button" onclick="document.getElementById('m-cat-image-input').click()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs">🖼️ ${tr('Rasm tanlash', 'Выбрать изображение')}</button>
                </div>
                <input id="m-cat-image-url" type="url" inputmode="url" oninput="onImageUrlInput(this.value, 'm-cat-prev', 'm-cat-image-url-error', 'm-cat-image-button')" placeholder="${tr('yoki Rasm URL (https://...)','или URL изображения (https://...)')}" class="w-full mt-2 p-2 border rounded-xl">
                <p id="m-cat-image-url-error" class="hidden mt-1 text-[10px] text-red-600"></p>
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
                <label class="font-bold text-gray-600">${tr("Katalog rasmi", "Изображение каталога")}</label>
                <div class="flex items-center gap-3 mt-1">
                  <img id="ec-img-prev" src="${escapeHtml((c.img && (c.img.startsWith('http') || c.img.startsWith('data:'))) ? c.img : '')}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-16 h-16 object-cover rounded-xl ${(c.img && (c.img.startsWith('http') || c.img.startsWith('data:'))) ? '' : 'hidden'} border">
                  <input id="ec-image-input" type="file" accept="image/*" onchange="onImagePicked(event, 'ec-img-prev', 'ec-image-button', 'ec-image-url', 'ec-image-url-error')" class="hidden">
                  <button id="ec-image-button" type="button" onclick="document.getElementById('ec-image-input').click()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs">${(c.img && (c.img.startsWith('http') || c.img.startsWith('data:'))) ? `🔄 ${tr('Rasmni almashtirish', 'Заменить изображение')}` : `🖼️ ${tr('Rasm tanlash', 'Выбрать изображение')}`}</button>
                </div>
                <input id="ec-image-url" type="url" inputmode="url" value="${(c.img && c.img.startsWith('http')) ? escapeHtml(c.img) : ''}" oninput="onImageUrlInput(this.value, 'ec-img-prev', 'ec-image-url-error', 'ec-image-button')" placeholder="${tr('yoki Rasm URL (https://...)','или URL изображения (https://...)')}" class="w-full mt-2 p-2 border rounded-xl">
                <p id="ec-image-url-error" class="hidden mt-1 text-[10px] text-red-600"></p>
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

      if (activePopupModal === 'MISSING_IMAGE_QUEUE') {
        const queue = getMissingImageProducts();
        if (missingImageQueueIndex >= queue.length) missingImageQueueIndex = Math.max(0, queue.length - 1);
        const p = queue[missingImageQueueIndex] || null;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[94vh] overflow-y-auto space-y-3 shadow-2xl text-xs">
              <div class="flex items-center justify-between border-b pb-2">
                <div><h3 class="font-black text-base">🖼 ${tr('Rasmsiz tovarlar','Товары без фото')}</h3><p class="text-[10px] text-gray-400">${tr('Barcha kataloglar bo‘yicha global navbat','Общая очередь по всем каталогам')}</p></div>
                <button onclick="clearTempImageSelection(); activePopupModal=null; render();" class="bg-gray-100 rounded-xl px-3 py-1.5 font-bold">✕</button>
              </div>
              ${p ? `
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-black text-sm text-gray-900">${escapeHtml(productName(p))}</p>
                    <p class="mt-1 text-[10px] text-blue-700 font-bold break-words">📁 ${escapeHtml(categoryPathForProduct(p))}</p>
                    <p class="mt-1 text-[10px] font-mono text-gray-500">SKU: ${escapeHtml(p.sku || '—')}</p>
                  </div>
                  <span class="flex-shrink-0 bg-slate-100 text-slate-700 font-black px-2.5 py-1 rounded-xl">${missingImageQueueIndex + 1} / ${queue.length}</span>
                </div>
                <div class="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <img id="miq-img-prev" src="" class="hidden w-full h-48 object-contain rounded-xl bg-white">
                  <div id="miq-empty-preview" class="h-32 flex items-center justify-center text-center text-gray-400 font-bold">🖼<br>${tr('Rasm preview','Предпросмотр фото')}</div>
                </div>
                <input id="miq-image-input" type="file" accept="image/*" onchange="document.getElementById('miq-empty-preview')?.classList.add('hidden'); onImagePicked(event, 'miq-img-prev', 'miq-image-button', 'miq-image-url', 'miq-image-url-error')" class="hidden">
                <button id="miq-image-button" type="button" onclick="document.getElementById('miq-image-input').click()" class="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-sm">🖼 ${tr('Rasm tanlash','Выбрать фото')}</button>
                <input id="miq-image-url" type="url" inputmode="url" oninput="document.getElementById('miq-empty-preview')?.classList.toggle('hidden', !!this.value.trim()); onImageUrlInput(this.value, 'miq-img-prev', 'miq-image-url-error', 'miq-image-button')" placeholder="${tr('yoki Rasm URL (https://...)','или URL изображения (https://...)')}" class="w-full mt-2 p-2.5 border rounded-xl">
                <p id="miq-image-url-error" class="hidden text-[10px] text-red-600"></p>
                <button onclick="saveMissingImageQueueItem('${p.id}')" ${missingImageQueueSaving ? 'disabled' : ''} class="w-full ${missingImageQueueSaving ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white'} font-black py-3 rounded-xl">${missingImageQueueSaving ? tr('⏳ Saqlanmoqda…','⏳ Сохранение…') : tr('✅ Saqlash','✅ Сохранить')}</button>
                <div class="grid grid-cols-2 gap-2 sticky bottom-0 bg-white pt-2">
                  <button onclick="moveMissingImageQueue(-1)" ${missingImageQueueSaving || missingImageQueueIndex === 0 ? 'disabled' : ''} class="bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl disabled:opacity-40">⬅️ ${tr('Oldingi','Предыдущий')}</button>
                  <button onclick="moveMissingImageQueue(1)" ${missingImageQueueSaving || missingImageQueueIndex >= queue.length - 1 ? 'disabled' : ''} class="bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl disabled:opacity-40">${tr('Keyingi','Следующий')} ➡️</button>
                </div>
              ` : `
                <div class="py-10 text-center space-y-3"><div class="text-5xl">✅</div><p class="font-black text-emerald-700">${tr('Rasmsiz tovar qolmadi.','Товаров без фото не осталось.')}</p><button onclick="clearTempImageSelection(); activePopupModal=null; render();" class="bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl">${tr('Yopish','Закрыть')}</button></div>
              `}
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

      // 2.3: tovarni boshqa katalogga ko'chirish.
      if (activePopupModal === 'MOVE_PRODUCT_CATEGORY') {
        const flatCats = categories.slice().sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("Katalogni o'zgartirish", "Изменить каталог")}</h3>
              <select id="move-product-target" onchange="moveTargetCategoryId=this.value" class="w-full p-2.5 border rounded-xl bg-gray-50">
                <option value="">${tr("— Katalogsiz —", "— Без каталога —")}</option>
                ${flatCats.map(c => `<option value="${c.id}">${escapeHtml(categoryName(c))}</option>`).join('')}
              </select>
              <div class="flex gap-2 pt-2">
                <button onclick="saveMoveProduct()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
              </div>
            </div>
          </div>`;
        return;
      }

      // 2.2: katalogni boshqa katalog ichiga ko'chirish (o'ziga/o'z ichki
      // kataloglariga ko'chirish variantlari ro'yxatdan chiqarib tashlanadi;
      // server baribir mustaqil tekshiradi).
      if (activePopupModal === 'MOVE_CATEGORY') {
        const forbidden = categoryDescendantIds(moveCategoryId);
        const validTargets = categories.filter(c => !forbidden.has(String(c.id))).sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("Katalogni ko'chirish", "Переместить каталог")}</h3>
              <select id="move-category-target" onchange="moveCategoryTargetId=this.value" class="w-full p-2.5 border rounded-xl bg-gray-50">
                <option value="">${tr("— Bosh katalog (root) —", "— Корневой каталог —")}</option>
                ${validTargets.map(c => `<option value="${c.id}">${escapeHtml(categoryName(c))}</option>`).join('')}
              </select>
              <div class="flex gap-2 pt-2">
                <button onclick="saveMoveCategory()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr("Saqlash", "Сохранить")}</button>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
              </div>
            </div>
          </div>`;
        return;
      }

      // 2.8: narx tarixi.
      if (activePopupModal === 'PRICE_HISTORY') {
        const rows = priceHistoryList || [];
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">${tr("🕘 Narx tarixi", "🕘 История цен")}</h3>
              ${priceHistoryList === null ? `<p class="text-center text-gray-400 py-6">${tr('Yuklanmoqda...', 'Загрузка...')}</p>`
                : rows.length === 0 ? `<p class="text-center text-gray-400 py-6">${tr("O'zgarishlar topilmadi.", 'Изменений не найдено.')}</p>`
                : `<div class="divide-y">${rows.map(h => `
                    <div class="py-2 flex justify-between items-center">
                      <div>
                        <p class="font-bold">${h.oldPrice !== null ? money(h.oldPrice) + ' → ' : ''}${money(h.newPrice)}</p>
                        <p class="text-[10px] text-gray-400">${new Date(h.changedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  `).join('')}</div>`}
              <button onclick="activePopupModal=null; render();" class="w-full bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl">${tr("Yopish", "Закрыть")}</button>
            </div>
          </div>`;
        return;
      }

      if (activePopupModal === 'BULK_MOVE_PRODUCTS') {
        const selectedCount = bulkSelectedProductIds.size;
        const options = categories.filter(c => !c.deletedAt).map(c => `<option value="${escapeHtml(c.id)}" ${String(bulkMoveTargetCategoryId)===String(c.id)?'selected':''}>${escapeHtml(categoryName(c))}</option>`).join('');
        container.innerHTML = `<div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="activePopupModal=null; render();"><div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full max-h-[90dvh] flex flex-col overflow-hidden" onclick="event.stopPropagation()"><div class="p-4 border-b flex justify-between items-center"><h3 class="font-bold">📁 ${tr('Tovarlarni ko‘chirish','Перемещение товаров')}</h3><button onclick="activePopupModal=null; render();" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button></div><div class="p-4 overflow-y-auto space-y-3"><p class="text-xs text-gray-500">${selectedCount} ${tr('ta tovar tanlandi','товаров выбрано')}</p><select onchange="bulkMoveTargetCategoryId=this.value" class="w-full border rounded-xl p-2.5"><option value="">${tr('Bosh katalog','Главный каталог')}</option>${options}</select><button onclick="saveBulkMoveProducts()" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl">${tr('Ko‘chirish','Переместить')}</button></div></div></div>`;
        return;
      }

      // 2.5: Chiqindi (24 soatlik trash) ko'rinishi.
      if (activePopupModal === 'TRASH') {
        const batches = trashBatches || [];
        const totalPages = Math.max(1, Math.ceil(batches.length / 10));
        if (trashPage > totalPages) trashPage = 1;
        const pageItems = batches.slice((trashPage - 1) * 10, trashPage * 10);
        const selectedCount = trashSelectedBatchIds.size;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full max-h-[90dvh] flex flex-col shadow-2xl text-xs overflow-hidden" onclick="event.stopPropagation()">
              <div class="sticky top-0 z-10 bg-white flex items-center justify-between border-b p-4">
                <h3 class="font-bold text-sm text-gray-900">${tr("🗑️ Chiqindi", "🗑️ Корзина")}</h3>
                <div class="flex items-center gap-1.5">
                  ${batches.length ? `<button onclick="toggleTrashSelectMode()" class="px-2.5 py-1.5 rounded-xl font-bold ${trashSelectMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}">${trashSelectMode ? tr('Bekor qilish', 'Отмена') : tr('Tanlash', 'Выбрать')}</button>` : ''}
                  <button onclick="activePopupModal=null; trashSelectMode=false; trashSelectedBatchIds.clear(); render();" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
                </div>
              </div>
              <div class="overflow-y-auto p-4 space-y-3"><p class="text-[10px] text-gray-400">${tr("O'chirilgan kataloglar/tovarlar shu yerda 24 soat turadi, keyin butunlay o'chadi.", "Удалённые каталоги/товары хранятся здесь 24 часа, затем удаляются навсегда.")}</p>
              ${trashSelectMode ? `
                <div class="flex flex-wrap items-center gap-1.5 bg-slate-50 border rounded-xl p-2">
                  <button onclick="selectAllVisibleTrashBatches()" class="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-white border">${tr('Sahifadagi barchasi', 'Все на странице')} (${pageItems.length})</button>
                  <button onclick="selectAllTrashBatches()" class="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-white border">${tr('Barcha', 'Все')} ${batches.length} ${tr('ta', '')}</button>
                  <button onclick="clearTrashSelection()" class="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-white border">${tr('Tanlovni bekor qilish', 'Снять выбор')}</button>
                </div>
              ` : ''}
              ${trashBatches === null ? `<p class="text-center text-gray-400 py-6">${tr('Yuklanmoqda...', 'Загрузка...')}</p>`
                : batches.length === 0 ? `<p class="text-center text-gray-400 py-6">${tr("Chiqindi bo'sh.", 'Корзина пуста.')}</p>`
                : `<div class="space-y-2">${pageItems.map(b => `
                    <div class="border rounded-xl p-2.5 space-y-1 ${trashSelectMode && trashSelectedBatchIds.has(String(b.id)) ? 'border-blue-500 bg-blue-50' : ''}" ${trashSelectMode ? `onclick="toggleTrashBatchSelection(${b.id}, event)"` : ''}>
                      <div class="flex items-center gap-2">
                        ${trashSelectMode ? `<span class="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center font-black text-[10px] ${trashSelectedBatchIds.has(String(b.id)) ? 'bg-blue-600 text-white' : 'bg-white border text-gray-400'}">${trashSelectedBatchIds.has(String(b.id)) ? '✓' : ''}</span>` : ''}
                        <p class="font-bold flex-1 min-w-0 truncate">${b.kind === 'CATEGORY' ? `📁 ${escapeHtml(b.rootCategoryName || ('#' + b.id))}` : `📦 ${escapeHtml((b.productNames || [])[0] || ('#' + b.id))}`}</p>
                      </div>
                      <p class="text-[10px] text-gray-500">${b.categoryCount ? `${b.categoryCount} ${tr('katalog','кат.')} · ` : ''}${b.productCount} ${tr('tovar','тов.')}</p>
                      <p class="text-[10px] text-gray-400">${tr("Muddati", "Истекает")}: ${new Date(b.expiresAt).toLocaleString()}</p>
                      ${!trashSelectMode ? `<div class="grid grid-cols-2 gap-1.5"><button onclick="restoreTrashBatch(${b.id})" class="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-1.5 rounded-lg">${tr("♻️ Tiklash", "♻️ Восстановить")}</button><button onclick="purgeTrashBatchNow(${b.id})" class="bg-red-50 text-red-700 border border-red-200 font-bold py-1.5 rounded-lg">${tr("🗑 Butunlay", "🗑 Навсегда")}</button></div>` : ''}
                    </div>
                  `).join('')}</div>
                  ${totalPages > 1 ? `
                    <div class="flex justify-center items-center flex-wrap gap-1.5 pt-1">
                      ${Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => `
                        <button onclick="trashPage=${pNum}; renderModalContainer();" class="px-3 py-1.5 rounded-xl text-xs font-bold ${trashPage === pNum ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}">${pNum}</button>
                      `).join('')}
                    </div>
                  ` : ''}`}
              </div>
              ${trashSelectMode && selectedCount ? `
                <div class="sticky bottom-0 bg-white border-t p-3 grid grid-cols-2 gap-2">
                  <button onclick="restoreSelectedTrashBatches()" class="bg-emerald-600 text-white font-bold py-2.5 rounded-xl">♻️ ${tr('Tiklash', 'Восстановить')} (${selectedCount})</button>
                  <button onclick="purgeSelectedTrashBatches()" class="bg-red-600 text-white font-bold py-2.5 rounded-xl">🗑 ${tr('Butunlay', 'Навсегда')} (${selectedCount})</button>
                </div>
              ` : ''}
            </div>
          </div>`;
        return;
      }

      // 2.7: duplicate tovar NOMZODLARI — faqat aniqlash, avtomatik birlashtirish yo'q.
      if (activePopupModal === 'DUPLICATE_PRODUCTS') {
        const pairs = findDuplicateProductCandidates();
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="activePopupModal=null; render();">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="font-bold text-sm text-gray-900">${tr("🧭 Duplicate tovar nomzodlari", "🧭 Возможные дубликаты")}</h3>
                <button onclick="activePopupModal=null; render();" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
              </div>
              <p class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">${tr("Bu faqat aniqlash: bir xil katalogdagi juda yaqin nomli tovarlar ko'rsatiladi. Avtomatik birlashtirish (merge) hali yo'q — kerak bo'lsa qo'lda tekshirib, keragini o'chiring yoki tahrirlang.", "Это только обнаружение: показаны товары с очень похожими названиями в одном каталоге. Автоматическое объединение пока не реализовано — проверьте вручную.")}</p>
              ${pairs.length === 0 ? `<p class="text-center text-gray-400 py-6">${tr("Duplicate topilmadi.", "Дубликаты не найдены.")}</p>`
                : `<div class="space-y-2">${pairs.map(({ a, b, score }) => `
                    <div class="border rounded-xl p-2.5 space-y-1">
                      <p class="text-[10px] text-gray-400">${Math.round(score * 100)}% ${tr("o'xshash", "совпадение")}</p>
                      <button onclick="activePopupModal=null; openProductDetailModal('${a.id}');" class="w-full text-left font-bold text-blue-700">${escapeHtml(a.name)} <span class="text-gray-400 font-normal">(${escapeHtml(a.sku)})</span></button>
                      <button onclick="activePopupModal=null; openProductDetailModal('${b.id}');" class="w-full text-left font-bold text-blue-700">${escapeHtml(b.name)} <span class="text-gray-400 font-normal">(${escapeHtml(b.sku)})</span></button>
                    </div>
                  `).join('')}</div>`}
            </div>
          </div>`;
        return;
      }

      // 4-blok: do'kon dizayni — tayyor mavzular + qo'lda ranglar + kontrast ogohlantirish.
      if (activePopupModal === 'DESIGN_SETTINGS') {
        const draft = designDraft || { themeId: 'minimal', colors: {} };
        const activeColors = designColorsWithDefaults(draft.colors);
        const issues = findContrastIssues(draft.colors);
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="closeDesignSettings()">
            <div class="bg-white rounded-t-3xl sm:rounded-3xl p-4 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="flex items-center justify-between border-b pb-2">
                <h3 class="font-black text-sm">🎨 ${tr("Do'kon dizayni", "Дизайн магазина")}</h3>
                <button onclick="closeDesignSettings()" class="bg-gray-100 px-3 py-1.5 rounded-xl font-bold">✕</button>
              </div>

              <div>
                <p class="font-bold text-gray-600 mb-1.5">${tr("Tayyor mavzular", "Готовые темы")}</p>
                <div class="grid grid-cols-3 gap-2">
                  ${Object.entries(DESIGN_THEMES).map(([id, theme]) => `
                    <button type="button" onclick="pickDesignTheme('${id}')" class="rounded-xl border-2 p-2 text-center ${draft.themeId === id ? 'border-blue-600' : 'border-transparent'}" style="background:${theme.colors.pageBg}">
                      <div class="flex justify-center gap-1 mb-1">
                        <span class="w-3.5 h-3.5 rounded-full inline-block" style="background:${theme.colors.button}"></span>
                        <span class="w-3.5 h-3.5 rounded-full inline-block border" style="background:${theme.colors.cardBg}"></span>
                      </div>
                      <span class="font-bold text-[10px]" style="color:${theme.colors.text}">${theme.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="space-y-2 pt-2 border-t">
                <p class="font-bold text-gray-600 pt-2">${tr("Qo'lda rang tanlash", "Ручной выбор цвета")}</p>
                ${DESIGN_COLOR_KEYS.map(key => `
                  <div class="flex items-center justify-between gap-2">
                    <label class="font-bold text-gray-600">${DESIGN_COLOR_LABELS[key]}</label>
                    <div class="flex items-center gap-2">
                      <input type="color" value="${activeColors[key]}" onchange="setDesignColor('${key}', this.value)" class="w-9 h-9 border rounded-lg cursor-pointer">
                      <span class="font-mono text-[10px] text-gray-400 w-14">${activeColors[key]}</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              ${issues.length ? `
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[10px] text-amber-900 space-y-1">
                  <p class="font-bold">⚠️ ${tr("O'qilishi qiyin bo'lishi mumkin:", 'Может быть трудно читать:')}</p>
                  ${issues.map(i => `<p>${i.pair}: ${i.ratio.toFixed(1)}:1 (${tr('kerak','нужно')} ${WCAG_AA_RATIO}:1)</p>`).join('')}
                </div>
              ` : ''}

              <div class="flex gap-2 pt-2 sticky bottom-0 bg-white">
                <button onclick="saveDesignSettings()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr("Saqlash", "Сохранить")}</button>
                <button onclick="closeDesignSettings()" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
              </div>
            </div>
          </div>`;
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
              ` : ''}

              ${field === 'img' ? `
                <label class="font-bold text-gray-600">${tr("Tovar rasmi", "Фото товара")}</label>
                <input id="ef-image-input" type="file" accept="image/*" onchange="onImagePicked(event, 'ef-img-prev', 'ef-image-button', 'ef-image-url', 'ef-image-url-error')" class="hidden">
                <button id="ef-image-button" type="button" onclick="document.getElementById('ef-image-input').click()" class="w-full mt-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-sm">🖼 ${hasProductImage(p) ? tr("Rasmni almashtirish", "Заменить фото") : tr("Rasm tanlash", "Выбрать фото")}</button>
                <input id="ef-image-url" type="url" inputmode="url" oninput="onImageUrlInput(this.value, 'ef-img-prev', 'ef-image-url-error', 'ef-image-button')" placeholder="${tr('yoki Rasm URL (https://...)','или URL изображения (https://...)')}" class="w-full mt-2 p-2 border rounded-xl">
                <p id="ef-image-url-error" class="hidden mt-1 text-[10px] text-red-600"></p>
                <img id="ef-img-prev" src="${escapeHtml(hasProductImage(p) ? p.img : '')}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-24 h-24 object-cover rounded-xl mt-2 border ${hasProductImage(p) ? '' : 'hidden'}">
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
                <button onclick="cancelProductEditor()" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr("Bekor qilish", "Отмена")}</button>
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
          return p ? { ...p, key, qty: itemData.qty, size: itemData.size || null, color: itemData.color || null } : null;
        }).filter(Boolean);

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
                <select id="chk-region-key" onchange="handleRegionChange()" class="w-full mt-1 p-2.5 border rounded-xl text-xs bg-gray-50 font-bold">
                  ${TOP_LEVEL_REGIONS.map(region => `<option value="${escapeHtml(region.id)}">${escapeHtml(uiLang === 'ru' ? region.nameRu : region.nameUz)}</option>`).join('')}
                </select>
              </div>

              <div id="chk-district-field">
                <label class="text-xs font-bold text-gray-600">${tr("Tumanni tanlang *", "Выберите район *")}</label>
                <select id="chk-district" onchange="handleDistrictChange()" class="w-full mt-1 p-2.5 border rounded-xl text-xs bg-gray-50 font-bold">
                  <option value="">${tr("— Tanlang —", "— Выберите —")}</option>
                </select>
              </div>

              <!-- 19-band: Yetkazib berish usuli endi Viloyat/Tuman'dan KEYIN,
                   Manzil/Filial'dan OLDIN chiqadi (to'g'ri tartib: Viloyat →
                   Tuman/Shahar → Usul → Filial). 2-band: #chk-district endi
                   BARCHA usullar uchun bitta umumiy maydon — renderCheckoutOptions
                   uni yashirmaydi, faqat manzil/filial maydonlari almashadi. -->
              <div>
                <label class="text-xs font-bold text-gray-600">${tr("Yetkazib berish usuli *", "Способ доставки *")}</label>
                <div id="delivery-method-wrap" class="space-y-2 mt-1"></div>
              </div>

              <div id="delivery-notice" class="hidden bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900"></div>

              <div id="chk-address-field">
                <label id="chk-address-label" class="text-xs font-bold text-gray-600">${tr("Manzil *", "Адрес *")}</label>
                <input type="text" id="chk-address" oninput="saveCheckoutDraft()" placeholder="${tr("Ko'cha, mahalla va uy raqami",'Улица, махалля и номер дома')}" class="w-full mt-1 p-2.5 border rounded-xl text-xs">
              </div>

              <div id="chk-branch-wrap" class="hidden space-y-2">
                <label class="text-xs font-bold text-gray-600">${tr("Filialni tanlang *", "Выберите филиал *")}</label>
                <input type="text" id="chk-branch-search" oninput="filterBranchList(this.value)" placeholder="${tr('Filial yoki tuman nomi bilan qidirish', 'Поиск по названию филиала или района')}" class="w-full p-2.5 border rounded-xl text-xs">
                <div id="chk-branch-list" class="max-h-56 overflow-y-auto border rounded-xl divide-y text-xs"></div>
                <div id="chk-branch-selected" class="hidden bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs"></div>
              </div>

              <div>
                <label class="text-xs font-bold text-gray-600">${tr("To'lov turi *", "Способ оплаты *")}</label>
                <div id="pay-method-wrap" class="grid grid-cols-2 gap-2 mt-1"></div>
              </div>

              <div id="card-payment-details" class="hidden space-y-2"></div>

              <div class="border-t pt-3 space-y-1.5">
                <div class="flex justify-between"><span>${tr('Tovarlar summasi', 'Сумма товаров')}:</span><b id="checkout-subtotal"></b></div>
                <div class="flex justify-between"><span>${tr('Yetkazib berish', 'Доставка')}:</span><b id="checkout-delivery-fee"></b></div>
                <div class="flex justify-between items-center text-base font-black"><span>${tr("Hozir to'lanadigan jami", 'Итого к оплате сейчас')}:</span><span id="checkout-payable-total" class="text-green-600"></span></div>
              </div>

              <button onclick="submitOrder()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm shadow-md">
                ✅ ${tr('Rasmiylashtirish', 'Оформить')}
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
                <label class="font-bold text-gray-600">${tr("Tovar qidirish", "Поиск товара")}</label>
                <input type="text" value="${escapeHtml(categoryFilter.search || '')}" oninput="categoryFilter.search=this.value; categoryPage=1;" placeholder="${escapeHtml(searchPlaceholderText())}" class="w-full mt-1 p-2.5 border rounded-xl">
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Narx oralig'i (so'm)", "Диапазон цен (сум)")}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="number" inputmode="numeric" placeholder="${tr('Dan','От')}" value="${escapeHtml(categoryFilter.minPrice)}" oninput="setCategoryPriceBound('minPrice', this.value)" class="w-full p-2.5 border rounded-xl">
                  <span class="text-gray-400">—</span>
                  <input type="number" inputmode="numeric" placeholder="${tr('Gacha','До')}" value="${escapeHtml(categoryFilter.maxPrice)}" oninput="setCategoryPriceBound('maxPrice', this.value)" class="w-full p-2.5 border rounded-xl">
                </div>
              </div>

              <div>
                <label class="font-bold text-gray-600">${tr("Mavjudlik", "Наличие")}</label>
                <button onclick="toggleCategoryHideOutOfStock()" class="w-full mt-1 flex items-center justify-between px-3 py-2.5 rounded-xl font-bold ${categoryFilter.hideOutOfStock ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}">
                  <span>📦 ${tr("Tugaganlarni yashirish", "Скрыть закончившиеся")}</span><span>${categoryFilter.hideOutOfStock ? '✓' : ''}</span>
                </button>
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
                <div class="flex justify-between items-center gap-1">
                  ${(isAdminMode && isUserAnAdmin) ? `<span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">ID: ${escapeHtml(p.sku)}</span>` : '<span></span>'}
                  ${(isAdminMode && isUserAnAdmin) ? `
                    <div class="flex gap-1">
                      <button onclick="duplicateProduct('${p.id}')" class="text-xs bg-slate-50 text-slate-600 font-bold px-2 py-1 rounded-lg">${tr("📄 Nusxalash", "📄 Копировать")}</button>
                      <button onclick="deleteProduct('${p.id}'); selectedProductModal=null; render();" class="text-xs bg-red-50 text-red-600 font-bold px-2 py-1 rounded-lg">${tr("🗑️ O'chirish", "🗑️ Удалить")}</button>
                    </div>
                  ` : ''}
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
                ${(isAdminMode && isUserAnAdmin) ? `<button onclick="openPriceHistoryModal('${p.id}')" class="text-[10px] text-gray-400 underline">${tr("🕘 Narx tarixi", "🕘 История цен")}</button>` : ''}

                <!-- STOCK WITH EDIT -->
                ${(isAdminMode && isUserAnAdmin) ? `
                  <div class="flex justify-between items-center pt-1 text-xs">
                    <span class="font-bold text-gray-600">${tr("Ombor qoldig'i:", "Остаток на складе:")} <b class="${p.stock > 0 ? 'text-green-600' : 'text-red-500'}">${p.stock} ${tr('ta','шт.')}</b></span>
                    ${productVariants(p).length ? '' : `<button onclick="openEditFieldModal('${p.id}', 'stock')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>`}
                  </div>
                  <div class="flex justify-between items-start gap-2 pt-1 text-xs">
                    <span class="font-bold text-gray-600 flex-1">${tr("Variantlar:", "Варианты:")} <b>${productVariants(p).length ? escapeHtml(productVariants(p).map(v => `${variantLabel(v)} (${v.qty} ${tr('ta','шт.')}, ID:${v.sku})`).join(', ')) : tr('kiritilmagan','не указано')}</b></span>
                    <button onclick="openEditFieldModal('${p.id}', 'variants')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>
                  </div>
                  <div class="flex justify-between items-center pt-1 text-xs">
                    <span class="font-bold text-gray-600">${tr("Katalog:", "Каталог:")} <b>${escapeHtml(categoryName(categories.find(c => c.id === p.categoryId)) || tr('belgilanmagan','не указан'))}</b></span>
                    <button onclick="openMoveProductModal('${p.id}')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">${tr('Ko\'chirish','Переместить')}</button>
                  </div>
                ` : ''}
              </div>

              <!-- TAVSIF WITH EDIT -->
              <div class="bg-gray-50 p-3 rounded-2xl border text-xs space-y-1 relative">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-gray-700">${tr("📝 Tavsif / Izoh:", "📝 Описание:")}</h4>
                  ${(isAdminMode && isUserAnAdmin) ? `<button onclick="openEditFieldModal('${p.id}', 'desc')" class="text-xs p-1 bg-blue-50 text-blue-600 rounded-lg font-bold">✏️</button>` : ''}
                </div>
                <p class="text-gray-600 leading-relaxed">${escapeHtml(productDesc(p) || tr('Tavsif kiritilmagan.','Описание не указано.'))}</p>
              </div>

              ${!isAdminMode ? `
                <div>
                  ${p.stock > 0 ? (
                    productVariants(p).length > 0 ? `
                      <div class="space-y-2">
                        <p class="text-xs font-bold text-gray-600">${t('choose_variant')} ${tr('(bir nechtasini tanlash mumkin):','(можно выбрать несколько):')}</p>
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
                                <p class="text-[9px] text-center mt-1 text-gray-400">${v.qty} ${tr('ta','шт.')}</p>
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
                        <span class="font-bold text-base text-blue-800">${inCart.qty} ${tr('ta savatda','шт. в корзине')}</span>
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

      // 14-band: chekni rad etish — sabab kiritish oynasi.
      if (activePopupModal === 'REJECT_RECEIPT') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; rejectReceiptOrderId=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">❌ ${tr('Chekni rad etish', 'Отклонить чек')}</h3>
              <div>
                <label class="font-bold text-gray-600">${tr('Rad etish sababi *', 'Причина отклонения *')}</label>
                <textarea id="rr-reason" rows="3" placeholder="${tr('Masalan: rasm noaniq, summa mos emas...', 'Например: изображение нечёткое, сумма не совпадает...')}" class="w-full mt-1 p-2.5 border rounded-xl"></textarea>
              </div>
              <div class="flex gap-2 pt-1">
                <button onclick="submitRejectReceipt()" class="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl">❌ ${tr('Rad etish', 'Отклонить')}</button>
                <button onclick="activePopupModal=null; rejectReceiptOrderId=null; render();" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr('Bekor qilish', 'Отмена')}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // 15-band: rad etilgan chekni qayta yuborish oynasi.
      if (activePopupModal === 'RESUBMIT_RECEIPT') {
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="closeResubmitReceiptModal();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <h3 class="font-bold text-sm text-gray-900 border-b pb-2">📎 ${tr('Yangi chek yuborish', 'Отправить новый чек')}</h3>
              <div>
                <label class="block font-bold">${tr("To'lov cheki/skrinshoti *", 'Чек/скриншот оплаты *')}</label>
                ${resubmitReceiptPreviewUrl ? `
                  <div class="flex items-center gap-3 mt-1">
                    <img src="${resubmitReceiptPreviewUrl}" class="h-16 w-16 object-cover rounded-xl border" alt="">
                    <label class="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">🔄 ${tr('Almashtirish', 'Заменить')}<input type="file" accept="image/*" onchange="onResubmitReceiptPicked(event)" class="hidden"></label>
                  </div>
                ` : `
                  <label class="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-blue-600 text-white mt-1">📎 ${tr('Chekni tanlash', 'Выбрать чек')}<input type="file" accept="image/*" onchange="onResubmitReceiptPicked(event)" class="hidden"></label>
                `}
              </div>
              <div class="flex gap-2 pt-1">
                <button onclick="submitResubmitReceipt()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr('Yuborish', 'Отправить')}</button>
                <button onclick="closeResubmitReceiptModal()" class="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl">${tr('Bekor qilish', 'Отмена')}</button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // 16-band: mijoz uchun qo'llab-quvvatlash — yangi murojaat yozish +
      // o'z murojaatlari/admin javoblari tarixi.
      // 2-9-band: mijoz tomon — agar shu order/umumiy kontekst uchun ochiq
      // ticket bo'lsa to'g'ridan-to'g'ri chat, bo'lmasa yangi xabar yozish
      // ko'rinishi + o'zining oldingi murojaatlari ro'yxati.
      if (activePopupModal === 'SUPPORT') {
        const openTicket = openSupportTicketId ? supportTickets.find(t => t.id === openSupportTicketId) : null;
        container.innerHTML = `
          <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="activePopupModal=null; supportTicketOrderId=null; openSupportTicketId=null; render();">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              ${openTicket ? `
                <div class="flex items-center justify-between border-b pb-2">
                  <button onclick="backToMySupportList()" class="text-[11px] font-bold text-blue-600">‹ ${tr('Orqaga','Назад')}</button>
                  <h3 class="font-bold text-sm text-gray-900">💬 ${openTicket.orderId ? `#${openTicket.orderId}` : tr('Murojaat','Обращение')}</h3>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${openTicket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : (openTicket.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">${openTicket.status === 'CLOSED' ? tr('Tugallangan','Завершено') : (openTicket.status === 'OPEN' ? tr('Yangi','Новое') : tr('Javob berilgan','Отвечено'))}</span>
                </div>
                <div>
                  ${supportMessagesLoading ? `<p class="text-center text-gray-400 py-2">${tr('Yuklanmoqda...','Загрузка...')}</p>` : renderSupportThreadHtml(supportMessages, false)}
                </div>
                ${openTicket.status !== 'CLOSED' ? `
                  ${renderSupportReplyBarHtml()}
                  <textarea id="sup-chat-message" rows="2" placeholder="${tr('Xabar yozing...','Напишите сообщение...')}" class="w-full p-2.5 border rounded-xl"></textarea>
                  <div class="flex gap-2">
                    <button onclick="submitSupportComposer()" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr('Yuborish','Отправить')}</button>
                    <button onclick="closeSupportTicket(${openTicket.id})" class="bg-gray-100 text-gray-700 font-bold px-3 py-2.5 rounded-xl">${tr('Tugatish','Завершить')}</button>
                  </div>
                ` : `<p class="text-center text-gray-400 py-2">${tr('Bu murojaat tugallangan.','Это обращение завершено.')}</p>`}
              ` : `
                <h3 class="font-bold text-sm text-gray-900 border-b pb-2">💬 ${tr("Qo'llab-quvvatlash", 'Поддержка')}</h3>
                ${supportTicketOrderId ? `<p class="text-[10px] text-gray-500">${tr('Buyurtma','Заказ')} #${supportTicketOrderId} ${tr('bo‘yicha murojaat','по этому заказу')}</p>` : ''}
                <div>
                  <label class="font-bold text-gray-600">${tr('Murojaatingiz', 'Ваше обращение')}</label>
                  <textarea id="sup-message" rows="4" placeholder="${tr('Savolingiz yoki muammoingizni yozing...', 'Опишите ваш вопрос или проблему...')}" class="w-full mt-1 p-2.5 border rounded-xl"></textarea>
                  <button onclick="submitSupportComposer()" class="w-full mt-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl">✅ ${tr('Yuborish', 'Отправить')}</button>
                </div>
                ${supportTicketsLoading ? `<p class="text-center text-gray-400 py-2">${tr('Yuklanmoqda...','Загрузка...')}</p>` : ''}
                ${(!supportTicketsLoading && supportTickets.length) ? `
                  <div class="border-t pt-2 space-y-2">
                    <p class="font-bold text-gray-600">${tr('Oldingi murojaatlar', 'Предыдущие обращения')}</p>
                    ${supportTickets.map(t => `
                      <div class="bg-gray-50 border rounded-xl p-2.5 space-y-1 cursor-pointer" onclick="openMySupportChat(${t.id})">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] text-gray-400">${t.orderId ? `#${t.orderId} · ` : ''}${new Date(t.lastMessage?.createdAt || t.createdAt).toLocaleString()}</span>
                          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : (t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">${t.status === 'CLOSED' ? tr('Tugallangan','Завершено') : (t.status === 'OPEN' ? tr('Yangi','Новое') : tr('Javob berilgan','Отвечено'))}</span>
                        </div>
                        <p>${escapeHtml((t.lastMessage?.body || '').slice(0, 80))}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              `}
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
            <div class="bg-white rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-3 shadow-2xl text-xs" onclick="event.stopPropagation()">
              <div class="border-b pb-2 flex items-center justify-between gap-2">
                <h3 class="font-black text-sm text-blue-600">${tr("Buyurtma", "Заказ")} #${o.id}</h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColorClass(orderDisplayStatus(o))}">${statusLabel(orderDisplayStatus(o))}</span>
              </div>

              <div class="space-y-1">
                <p>👤 <b>${tr("Mijoz:", "Клиент:")}</b> ${escapeHtml(o.user)}</p>
                <p>📞 <b>${tr("Tel:", "Тел:")}</b> ${escapeHtml(o.phone)}</p>
                <p>📍 <b>${tr("Hudud:", "Регион:")}</b> ${escapeHtml(o.delivery?.regionLabel || regionLabel(o.region))} (${escapeHtml(districtLabelForUi(o.district))})</p>
                <p>🏠 <b>${tr("Manzil:", "Адрес:")}</b> ${escapeHtml(o.address)}</p>
                <p>🚚 <b>${tr("Yetkazib berish:", "Доставка:")}</b> ${escapeHtml(deliverySnapshotLabel(o))}</p>
                <p>💳 <b>${tr("To'lov:", "Оплата:")}</b> ${escapeHtml(o.payment?.label || payMethodLabel(o.payMethod))}</p>
                <p>📅 <b>${tr("Sana:", "Дата:")}</b> ${escapeHtml(o.date)}</p>
              </div>

              <div class="border-t pt-2 space-y-1.5">
                <b>${tr("📦 Tovar:", "📦 Товары:")}</b>
                ${o.items.map(i => `
                  <div class="flex items-center gap-2">
                    ${i.img ? `<img src="${escapeHtml(i.img)}" onerror="this.style.display='none'" class="w-7 h-7 object-cover rounded-lg flex-shrink-0" loading="lazy">` : ''}
                    <p>• ${escapeHtml(orderItemName(i))} ${i.size ? `<span class="text-gray-500 font-mono">[${escapeHtml(i.size)}]</span>` : ''} ${i.color ? `<span class="text-gray-500">[${escapeHtml(i.color)}]</span>` : ''} ${(i.sku && isAdminMode && isUserAnAdmin) ? `<span class="text-gray-400 font-mono">(ID: ${escapeHtml(i.sku)})</span>` : ''} x ${i.qty} = ${money(i.price * i.qty)}</p>
                  </div>
                `).join('')}
              </div>

              <div class="border-t pt-2 space-y-1">
                <div class="flex justify-between"><span>${tr('Tovarlar summasi','Сумма товаров')}:</span><b>${money(o.subtotal ?? o.totalPrice)}</b></div>
                <div class="flex justify-between"><span>${tr('Yetkazib berish','Доставка')}:</span><b>${(o.delivery?.kind === 'TAXI' || (o.delivery?.kind === 'POST' && o.delivery?.payer === 'CUSTOMER')) ? tr("Mijoz to'laydi", 'Оплачивает клиент') : (Number(o.deliveryFee) > 0 ? money(o.deliveryFee) : money(0))}</b></div>
                <div class="flex justify-between font-black text-sm"><span>${tr("Hozir to'lanadigan jami",'Итого к оплате сейчас')}:</span><span class="text-green-600">${money(o.payableTotal ?? o.totalPrice)}</span></div>
              </div>

              ${o.delivery?.warning ? `<div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900">ℹ️ ${escapeHtml(o.delivery.warning)}</div>` : ''}
              ${o.delivery?.comment ? `<div class="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-[11px] text-blue-900">💬 ${escapeHtml(o.delivery.comment)}</div>` : ''}

              <div class="bg-slate-50 border rounded-xl p-2.5 space-y-1">
                <p class="font-bold">🚚 ${tr('Jo‘natma holati','Статус отправления')}: ${escapeHtml(effectiveShipmentStatusLabel(o))}</p>
                ${o.shipment?.kind === 'TAXI' && o.shipment?.carNumber ? `<p>${tr('Mashina','Машина')}: <b>${escapeHtml(o.shipment.carNumber)}</b></p><p>${tr('Haydovchi','Водитель')}: ${escapeHtml(o.shipment.driverPhone || '')}${o.shipment.driverName ? ` · ${escapeHtml(o.shipment.driverName)}` : ''}</p>` : ''}
                ${o.shipment?.kind === 'POST' && o.shipment?.trackingNumber ? `<p>${tr("Jo'natma raqami",'Трек-номер')}: <b>${escapeHtml(o.shipment.trackingNumber)}</b></p>${o.shipment.originBranch ? `<p>${tr('Yuborilgan filial','Филиал отправки')}: ${escapeHtml(o.shipment.originBranch)}</p>` : ''}` : ''}
              </div>

              ${(isAdminMode && isUserAnAdmin && o.hasReceipt) ? `<button onclick="openOrderReceipt(${o.id})" class="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-xl font-bold">🧾 ${tr("To'lov chekini ochish", 'Открыть чек оплаты')}</button>` : ''}
              ${(isAdminMode && isUserAnAdmin && o.receiptSentToTelegram && botUsername) ? `<button onclick="openReceiptInTelegram()" class="w-full bg-sky-50 text-sky-700 border border-sky-200 py-2 rounded-xl font-bold">✈️ ${tr("Telegramda ko'rish", 'Смотреть в Telegram')}</button>` : ''}
              ${(isAdminMode && isUserAnAdmin && o.hasReceipt && (o.receiptReviewStatus || 'PENDING') === 'PENDING') ? `
                <div class="grid grid-cols-2 gap-2">
                  <button onclick="approvePaymentReceipt(${o.id})" class="bg-emerald-600 text-white font-bold py-2 rounded-xl text-[11px]">✅ ${tr('Tasdiqlash', 'Подтвердить')}</button>
                  <button onclick="openRejectReceiptModal(${o.id})" class="bg-red-600 text-white font-bold py-2 rounded-xl text-[11px]">❌ ${tr('Rad etish', 'Отклонить')}</button>
                </div>
              ` : ''}

              ${(isAdminMode && isUserAnAdmin && o.delivery?.kind === 'TAXI' && o.status !== 'CANCELLED') ? `
                <div class="border-t pt-2 space-y-2">
                  <p class="font-black">🚕 ${tr('Taksi ma’lumoti','Данные такси')}</p>
                  <input id="shipment-car" value="${escapeHtml(o.shipment?.carNumber || '')}" placeholder="01 A 123 BC" class="w-full p-2 border rounded-xl uppercase">
                  <input id="shipment-phone" value="${escapeHtml(o.shipment?.driverPhone || '')}" placeholder="+998 90 123 45 67" class="w-full p-2 border rounded-xl font-mono">
                  <input id="shipment-driver" value="${escapeHtml(o.shipment?.driverName || '')}" placeholder="${tr('Haydovchi ismi (ixtiyoriy)','Имя водителя (необязательно)')}" class="w-full p-2 border rounded-xl">
                  <select id="shipment-status" class="w-full p-2 border rounded-xl bg-gray-50"><option value="READY" ${o.shipment?.status === 'READY' ? 'selected' : ''}>${tr('Tayyor','Готовится')}</option><option value="TAXI_ASSIGNED" ${o.shipment?.status === 'TAXI_ASSIGNED' ? 'selected' : ''}>${tr('Taksi biriktirildi','Такси назначено')}</option><option value="IN_TRANSIT" ${o.shipment?.status === 'IN_TRANSIT' ? 'selected' : ''}>${tr("Yo'lga chiqdi",'В пути')}</option><option value="DELIVERED" ${o.shipment?.status === 'DELIVERED' ? 'selected' : ''}>${tr('Yetkazildi','Доставлено')}</option></select>
                  <button onclick="saveShipmentForOrder(${o.id})" class="w-full bg-slate-800 text-white py-2.5 rounded-xl font-bold">💾 ${tr('Jo‘natmani saqlash','Сохранить отправление')}</button>
                </div>` : ''}

              ${(isAdminMode && isUserAnAdmin && o.delivery?.kind === 'POST' && o.status !== 'CANCELLED') ? `
                <div class="border-t pt-2 space-y-2">
                  <p class="font-black">📦 ${escapeHtml(o.delivery.providerName || tr('Pochta','Почта'))}</p>
                  ${o.delivery.branchName ? `<p class="text-[11px] text-gray-600">${tr('Mijoz tanlagan filial','Филиал, выбранный клиентом')}: <b>${escapeHtml(o.delivery.branchName)}</b></p>` : ''}
                  <input id="shipment-tracking" value="${escapeHtml(o.shipment?.trackingNumber || '')}" placeholder="${tr("Tracking/jo'natma raqami",'Трек-номер')}" class="w-full p-2 border rounded-xl font-mono">
                  <select id="shipment-status" class="w-full p-2 border rounded-xl bg-gray-50"><option value="READY" ${o.shipment?.status === 'READY' ? 'selected' : ''}>${tr('Tayyor','Готовится')}</option><option value="HANDED_TO_CARRIER" ${o.shipment?.status === 'HANDED_TO_CARRIER' ? 'selected' : ''}>${tr('Pochtaga topshirildi','Передано почте')}</option></select>
                  <button onclick="saveShipmentForOrder(${o.id})" class="w-full bg-slate-800 text-white py-2.5 rounded-xl font-bold">💾 ${tr('Jo‘natmani saqlash','Сохранить отправление')}</button>
                </div>` : ''}

              ${o.status === 'CANCELLED' && o.cancelReason ? `
                <div class="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[11px] text-red-700">
                  ❌ Bekor qilindi (${o.cancelledBy === 'ADMIN' ? "do'kon tomonidan" : 'mijoz tomonidan'}): ${escapeHtml(o.cancelReason)}
                </div>
              ` : ''}

              ${o.receiptReviewStatus === 'REJECTED' ? `
                <div class="bg-red-50 border border-red-200 p-2.5 rounded-xl text-[11px] text-red-700 space-y-2">
                  <p>❌ ${tr('Chek rad etildi', 'Чек отклонён')}${o.receiptRejectReason ? `: ${escapeHtml(o.receiptRejectReason)}` : ''}</p>
                  ${!isAdminMode ? `
                    <div class="flex gap-2">
                      <button onclick="openResubmitReceiptModal(${o.id})" class="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl text-[11px]">📎 ${tr('Yangi chek yuborish', 'Отправить новый чек')}</button>
                      <button onclick="openSupportModal(${o.id})" class="flex-1 bg-white border border-red-200 text-red-700 font-bold py-2 rounded-xl text-[11px]">💬 ${tr("Qo'llab-quvvatlash", 'Поддержка')}</button>
                    </div>
                  ` : ''}
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
                  <p class="text-lg font-black text-green-600">${money(u.totalSpent)}</p>
                  <p class="text-[10px] text-gray-500">${tr("Jami xarid", "Всего покупок")}</p>
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
      initializeTempImageEditor((fieldName === 'img' && selectedProductModal) ? selectedProductModal.img : null);
      activePopupModal = 'EDIT_PROD_FIELD';
      render();
    }

    function openOrderModal(id) {
      selectedOrderModal = orders.find(o => o.id === id);
      renderModalContainer();
    }

    function deliverySnapshotLabel(order) {
      const delivery = order?.delivery || {};
      if (delivery.kind === 'FREE') return tr('Bepul yetkazib berish', 'Бесплатная доставка');
      if (delivery.kind === 'FIXED') return tr('Pullik uyigacha', 'Платная доставка до дома');
      if (delivery.kind === 'TAXI') return tr('Taksi orqali', 'На такси');
      if (delivery.kind === 'POST') return `${tr('Pochta orqali', 'Почтой')} · ${delivery.providerName || ''}`;
      return delivery.label || tr('Eski buyurtma yetkazishi', 'Доставка старого заказа');
    }

    function shipmentStatusLabel(status) {
      const labels = {
        READY: tr('Tayyorlanmoqda', 'Готовится'), TAXI_ASSIGNED: tr('Taksi biriktirildi', 'Такси назначено'),
        HANDED_TO_CARRIER: tr('Pochtaga topshirildi', 'Передано почте'), IN_TRANSIT: tr("Yo'lda", 'В пути'), DELIVERED: tr('Yetkazildi', 'Доставлено')
      };
      return labels[status] || status || '-';
    }

    async function openOrderReceipt(orderId) {
      try {
        const data = await callApi('get_payment_receipt_url', { orderId });
        if (tg?.openLink) tg.openLink(data.url);
        else window.open(data.url, '_blank', 'noopener');
      } catch (e) {
        alert(tr("Chekni ochib bo'lmadi: ", 'Не удалось открыть чек: ') + (e.message || e));
      }
    }

    // 1.10: chek Telegramga yuborilgandan keyin admin FITCORE bot chatini
    // ochadi (aniq xabarga soxta deep-link yasalmaydi). Bot username hardcode
    // emas — boot() javobidan (server konfiguratsiyasidan) olinadi.
    function openReceiptInTelegram() {
      if (!botUsername) return;
      const url = `https://t.me/${encodeURIComponent(botUsername)}`;
      if (tg?.openTelegramLink) tg.openTelegramLink(url);
      else if (tg?.openLink) tg.openLink(url);
      else window.open(url, '_blank', 'noopener');
    }

    async function saveShipmentForOrder(orderId) {
      const order = orders.find(item => item.id === orderId);
      if (!order) return;
      const payload = { orderId, status: document.getElementById('shipment-status')?.value || 'READY' };
      if (order.delivery?.kind === 'TAXI') {
        payload.carNumber = document.getElementById('shipment-car')?.value.trim() || '';
        payload.driverPhone = document.getElementById('shipment-phone')?.value.trim() || '';
        payload.driverName = document.getElementById('shipment-driver')?.value.trim() || '';
      } else if (order.delivery?.kind === 'POST') {
        // 1.13: filial mijoz tomonidan checkout'da tanlanadi (order snapshot'da
        // saqlanadi) — admin uni qayta kiritmaydi, faqat tracking + status.
        payload.trackingNumber = document.getElementById('shipment-tracking')?.value.trim() || '';
      }
      showActionToast(tr('⏳ Yetkazish ma’lumoti saqlanmoqda...', '⏳ Данные доставки сохраняются...'), 'saving');
      try {
        const result = await callApi('update_shipment', payload);
        const updated = formatOrderForUi(result.order);
        const idx = orders.findIndex(item => item.id === orderId);
        if (idx >= 0) orders[idx] = updated;
        selectedOrderModal = updated;
        render();
        showActionToast(tr('✅ Yetkazish ma’lumoti saqlandi', '✅ Данные доставки сохранены'), 'success', 1300);
      } catch (e) {
        showActionToast(tr('❌ Yetkazish ma’lumoti saqlanmadi', '❌ Данные доставки не сохранены'), 'error', 1800);
        alert(tr('Xato: ', 'Ошибка: ') + (e.message || e));
      }
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

    // 14-band: chekni tasdiqlash — orders.status'ga to'g'ridan-to'g'ri
    // tegilmaydi, faqat mustaqil receiptReviewStatus (backend "PROCESSING"ga
    // o'tkazadi, agar order hali "NEW" bo'lsa — mavjud status qiymati).
    async function approvePaymentReceipt(orderId) {
      if (!confirm(tr("Chekni tasdiqlaysizmi?", "Подтвердить чек?"))) return;
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохранение..."), 'saving');
      try {
        const result = await callApi('approve_payment_receipt', { orderId });
        const updated = formatOrderForUi(result.order);
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx >= 0) orders[idx] = updated;
        if (selectedOrderModal?.id === orderId) selectedOrderModal = updated;
        render();
        showActionToast(tr("✅ Chek tasdiqlandi", "✅ Чек подтверждён"), 'success', 1600);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }
    function openRejectReceiptModal(orderId) {
      rejectReceiptOrderId = orderId;
      activePopupModal = 'REJECT_RECEIPT';
      render();
    }
    async function submitRejectReceipt() {
      const orderId = rejectReceiptOrderId;
      const reason = document.getElementById('rr-reason')?.value.trim() || '';
      if (!reason) return alert(tr("Rad etish sababini yozing.", "Укажите причину отклонения."));
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохранение..."), 'saving');
      try {
        const result = await callApi('reject_payment_receipt', { orderId, reason });
        const updated = formatOrderForUi(result.order);
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx >= 0) orders[idx] = updated;
        selectedOrderModal = updated;
        rejectReceiptOrderId = null;
        activePopupModal = null;
        render();
        showActionToast(tr("✅ Chek rad etildi", "✅ Чек отклонён"), 'success', 1600);
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 2000);
        alert(tr("Xatolik: ", "Ошибка: ") + (e.message || e));
      }
    }

    // 15-band: rad etilgan chekni qayta yuborish oynasi.
    function openResubmitReceiptModal(orderId) {
      resubmitOrderId = orderId;
      resubmitReceiptFile = null;
      resubmitReceiptPreparing = null;
      resubmitReceiptPreviewUrl = null;
      activePopupModal = 'RESUBMIT_RECEIPT';
      render();
    }
    function closeResubmitReceiptModal() {
      if (resubmitReceiptPreviewUrl) { try { URL.revokeObjectURL(resubmitReceiptPreviewUrl); } catch (_) {} }
      resubmitOrderId = null;
      resubmitReceiptFile = null;
      resubmitReceiptPreparing = null;
      resubmitReceiptPreviewUrl = null;
      activePopupModal = null;
      render();
    }
    async function onResubmitReceiptPicked(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const selectionVersion = ++resubmitReceiptSelectionVersion;
      resubmitReceiptFile = file;
      if (resubmitReceiptPreviewUrl) { try { URL.revokeObjectURL(resubmitReceiptPreviewUrl); } catch (_) {} }
      try { resubmitReceiptPreviewUrl = URL.createObjectURL(file); } catch (_) { resubmitReceiptPreviewUrl = null; }
      resubmitReceiptPreparing = compressImageToLimit(file, MAX_RECEIPT_BYTES, 1600, 0.85).then((compressed) => {
        if (selectionVersion !== resubmitReceiptSelectionVersion) return compressed;
        resubmitReceiptFile = compressed;
        try {
          const stableUrl = URL.createObjectURL(compressed);
          const oldUrl = resubmitReceiptPreviewUrl;
          resubmitReceiptPreviewUrl = stableUrl;
          renderModalContainer();
          if (oldUrl && oldUrl !== stableUrl && oldUrl.startsWith('blob:')) { try { URL.revokeObjectURL(oldUrl); } catch (_) {} }
        } catch (_) {}
        return compressed;
      });
      renderModalContainer();
    }
    async function submitResubmitReceipt() {
      if (!resubmitOrderId || (!resubmitReceiptFile && !resubmitReceiptPreparing)) {
        return alert(tr("Iltimos, chek rasmini tanlang.", "Пожалуйста, выберите изображение чека."));
      }
      const orderId = resubmitOrderId;
      showActionToast(tr('⏳ Yuborilmoqda...', '⏳ Отправка...'), 'saving');
      try {
        const prepared = resubmitReceiptPreparing ? await resubmitReceiptPreparing : resubmitReceiptFile;
        if (!prepared || prepared.size > MAX_RECEIPT_BYTES) throw new Error('receipt_too_large');
        const imageUpload = { base64: await blobToBase64(prepared), mimeType: prepared.type, fileName: 'payment-receipt.jpg' };
        await callApi('upload_payment_receipt', { orderId, imageUpload });
        const patch = { hasReceipt: true, receiptReviewStatus: 'PENDING', receiptRejectReason: null };
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx >= 0) orders[idx] = { ...orders[idx], ...patch };
        if (selectedOrderModal?.id === orderId) selectedOrderModal = { ...selectedOrderModal, ...patch };
        closeResubmitReceiptModal();
        showActionToast(tr('✅ Yangi chek yuborildi', '✅ Новый чек отправлен'), 'success', 2000);
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Yuborilmadi', '❌ Не отправлено'), 'error', 2200);
        alert(tr('Xatolik: ', 'Ошибка: ') + friendlyImageError(e));
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

    async function saveProductFromModal() {
      const name = document.getElementById('m-prod-name').value.trim();
      const price = parseFloat(document.getElementById('m-prod-price').value);
      const oldPriceVal = parseFloat(document.getElementById('m-prod-oldprice').value);
      const stockVal = document.getElementById('m-prod-stock').value;
      const stock = stockVal === '' ? NaN : parseInt(stockVal, 10);
      const sizeText = document.getElementById('m-prod-sizes').value;
      const colorText = document.getElementById('m-prod-colors').value;
      const variants = parseVariantInputs(sizeText, colorText, isNaN(stock) ? 0 : stock);
      const desc = document.getElementById('m-prod-desc').value.trim();
      if (!name || isNaN(price) || (variants.length === 0 && isNaN(stock))) {
        return alert(tr("Iltimos, barcha majburiy maydonlarni to'ldiring!", "Заполните все обязательные поля!"));
      }
      const oldPrice = (!isNaN(oldPriceVal) && oldPriceVal > price) ? oldPriceVal : null;
      const imageSnap = takeTempImageSnapshot();
      const categoryId = adminCatParentId;

      // Formani server javobigacha ochiq qoldiramiz: rasm xatosida admin kiritgan
      // name/price/stock/description yo'qolmasligi kerak.
      showActionToast(tr("⏳ Tovar saqlanmoqda...", "⏳ Товар сохраняется..."), 'saving');
      try {
        const imagePayload = await imagePayloadFromSnapshot(imageSnap, false);
        const result = await callApi('add_product', {
          name, price, oldPrice,
          stock: isNaN(stock) ? 0 : stock,
          variants: variants.length > 0 ? variants : null,
          desc, categoryId, img: imagePayload.img, imageUpload: imagePayload.imageUpload
        });
        upsertLocalProduct(result.product);
        saveCatalogCache();
        activePopupModal = null;
        showActionToast(`${tr("✅ Tovar qo'shildi. ID:", "✅ Товар добавлен. ID:")} ${result.product.sku}`, 'success', 1800);
        render();
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Tovar saqlanmadi", "❌ Товар не сохранён"), 'error', 1800);
        if (String(e.message).startsWith('product_limit_reached')) {
          const limit = String(e.message).split(':')[1];
          alert(`${tr('⚠️ Tovar soni chegarasiga yetdingiz','⚠️ Достигнут лимит количества товаров')} (${limit}). ${tr("Ko'proq tovar qo'shish uchun tarifingizni oshiring.",'Чтобы добавить больше товаров, увеличьте тариф.')}`);
        } else {
          alert(tr("❌ Tovarni saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения товара: ") + ((imageSnap?.file || imageSnap?.preparing || imageSnap?.url) ? friendlyImageError(e) : (e.message || e)));
        }
        // Input matnlari DOM'da qoladi. Rasm selection esa qayta tanlanishi uchun tozalanadi.
        clearTempImageSelection();
      } finally { releaseImageSnapshot(imageSnap); }
    }

    // 3.1/3.7: admin faqat UZ kiritadi — RU serverda avtomatik tarjima qilinadi.
    async function saveCategoryFromModal() {
      const name = document.getElementById('m-cat-name').value.trim();
      if (!name) return alert(tr("Katalog nomini kiriting!", "Введите название каталога!"));
      const imageSnap = takeTempImageSnapshot();
      const parentId = adminCatParentId;
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Katalog saqlanmoqda...", "⏳ Каталог сохраняется..."), 'saving');
      try {
        const imagePayload = await imagePayloadFromSnapshot(imageSnap, false);
        const result = await callApi('add_category', { name, img: imagePayload.img, imageUpload: imagePayload.imageUpload, parentId });
        upsertLocalCategory(result.category);
        saveCatalogCache();
        showActionToast(tr("✅ Katalog yaratildi", "✅ Каталог создан"), 'success', 1200);
        render();
      } catch (e) {
        console.error(e);
        showActionToast(tr("❌ Katalog saqlanmadi", "❌ Каталог не сохранён"), 'error', 1800);
        alert(tr("❌ Katalogni saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения каталога: ") + friendlyImageError(e));
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
        p.name = val;
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
        payload.value = val;
        p.desc = val;
      } else if (field === 'img') {
        imageSnap = takeTempImageSnapshot();
        if (!imageSnap.file && !imageSnap.preparing && !imageSnap.url) { activePopupModal = null; render(); return; }
        // Tanlangan rasm kartochkada ham darhol ko'rinsin.
        if (imageSnap.preview) p.img = imageSnap.preview;
        else if (imageSnap.url) p.img = imageSnap.url;
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

      // Matn/son kabi tez maydonlar PIN kabi optimistik yopiladi. Rasm esa
      // Telegram WebView'da o'qish/yuklash xatosi bo'lsa admin qayta tanlay olishi
      // uchun edit modalini muvaffaqiyatli uploadgacha ochiq qoldiradi.
      if (field !== 'img') {
        activePopupModal = null;
        selectedProductModal = p;
        render();
      }
      showActionToast(tr("⏳ Saqlanmoqda...", "⏳ Сохраняется..."), 'saving');

      try {
        if (field === 'img') {
          const imagePayload = await imagePayloadFromSnapshot(imageSnap, true);
          payload.value = imagePayload.img;
          payload.imageUpload = imagePayload.imageUpload;
        }
        const result = await callApi('edit_product_field', payload);
        const current = products.find(prod => prod.id === prodId);
        if (current) Object.assign(current, mapProductFromDB(result.product));
        saveCatalogCache();
        if (field === 'img') {
          activePopupModal = null;
          selectedProductModal = current || p;
        }
        showActionToast(tr("✅ Saqlandi", "✅ Сохранено"), 'success', 1200);
        render();
      } catch (e) {
        console.error(e);
        const curIdx = products.findIndex(prod => prod.id === prodId);
        if (curIdx >= 0) products[curIdx] = old;
        selectedProductModal = products.find(prod => prod.id === prodId) || null;
        // Rasm xatosida edit oynasini yopmaymiz: forma va qayta tanlash imkoniyati qoladi.
        if (field !== 'img') render();
        showActionToast(tr("❌ Saqlanmadi", "❌ Не сохранено"), 'error', 1800);
        alert(tr("❌ Saqlashda xatolik yuz berdi: ", "❌ Ошибка сохранения: ") + (field === 'img' ? friendlyImageError(e) : (e.message || e)));
      } finally {
        releaseImageSnapshot(imageSnap);
      }
    }

    async function saveMissingImageQueueItem(prodId) {
      if (missingImageQueueSaving) return;
      const product = products.find(p => p.id === prodId);
      if (!product || product.status === 'DELETED' || hasProductImage(product)) {
        renderModalContainer();
        return;
      }
      const imageSnap = takeTempImageSnapshot();
      missingImageQueueSaving = true;
      renderModalContainer();
      showActionToast(tr("⏳ Rasm saqlanmoqda...", "⏳ Изображение сохраняется..."), 'saving');
      try {
        const imagePayload = await imagePayloadFromSnapshot(imageSnap, true);
        const result = await callApi('edit_product_field', {
          productId: prodId,
          field: 'img',
          value: imagePayload.img,
          imageUpload: imagePayload.imageUpload,
        });
        const current = products.find(p => p.id === prodId);
        if (current) Object.assign(current, mapProductFromDB(result.product));
        saveCatalogCache();
        const remaining = getMissingImageProducts();
        if (missingImageQueueIndex >= remaining.length) missingImageQueueIndex = Math.max(0, remaining.length - 1);
        initializeTempImageEditor(null);
        showActionToast(tr("✅ Rasm saqlandi", "✅ Изображение сохранено"), 'success', 1200);
      } catch (e) {
        console.error('Global rasmsiz navbatda rasm saqlash xatosi:', e);
        showActionToast(tr("❌ Rasm saqlanmadi", "❌ Изображение не сохранено"), 'error', 1800);
        alert(tr("❌ Rasm saqlanmadi. Eski ma'lumot o'zgarmadi: ", "❌ Изображение не сохранено. Старые данные не изменены: ") + friendlyImageError(e));
      } finally {
        releaseImageSnapshot(imageSnap);
        missingImageQueueSaving = false;
        render();
      }
    }

    function openAddProductModal() {
      initializeTempImageEditor(null);
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
        if (!excelModulePromise) excelModulePromise = ensureScript('./excel-import.js?v=6');
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
      initializeTempImageEditor(c.img);
      activePopupModal = 'EDIT_CAT';
      render();
    }

    async function saveCategoryEdit(id) {
      const idx = categories.findIndex(cat => cat.id === id);
      if (idx < 0) return;
      const c = categories[idx];
      const old = cloneData(c);
      const name = document.getElementById('ec-name').value.trim();
      if (!name) return alert(tr("Katalog nomini kiriting!", "Введите название каталога!"));
      const imageSnap = takeTempImageSnapshot();

      c.name = name;
      if (imageSnap.preview) c.img = imageSnap.preview;
      else if (imageSnap.url) c.img = imageSnap.url;
      activePopupModal = null;
      render();
      showActionToast(tr("⏳ Katalog saqlanmoqda...", "⏳ Каталог сохраняется..."), 'saving');

      try {
        const imagePayload = await imagePayloadFromSnapshot(imageSnap, false);
        const result = await callApi('edit_category', { categoryId: id, name, img: imagePayload.img, imageUpload: imagePayload.imageUpload });
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

    // 2.4/2.5: standalone product delete — 24 soat trash'da turadi, tiklash mumkin.
    async function deleteProduct(id) {
      if (!confirm(tr("Rostdan ham ushbu mahsulotni o'chirmoqchimisiz? (24 soat ichida Chiqindidan tiklash mumkin)", "Удалить этот товар? (В течение 24 часов его можно восстановить из корзины)"))) return;
      const idx = products.findIndex(prod => prod.id === id);
      if (idx < 0) return;
      const old = cloneData(products[idx]);
      products.splice(idx, 1);
      render();
      showActionToast(tr("⏳ O'chirilmoqda...", "⏳ Удаление..."), 'saving');
      try {
        await callApi('delete_product', { productId: id });
        saveCatalogCache();
        showActionToast(tr("✅ O'chirildi (24 soat Chiqindida)", "✅ Удалено (24 часа в корзине)"), 'success', 1800);
      } catch (e) {
        console.error(e);
        products.splice(Math.min(idx, products.length), 0, old);
        render();
        showActionToast(tr("❌ O'chirilmadi", "❌ Не удалено"), 'error', 1800);
        alert(tr("❌ O'chirishda xatolik yuz berdi: ", "❌ Ошибка удаления: ") + (e.message || e));
      }
    }

    // 2.4: o'chirishdan oldin ichki katalog/tovar sonini ko'rsatib tasdiq so'raladi.
    // 2.5: tasdiqlansa, butun subtree+tovarlar 24 soatlik trash'ga tushadi —
    // bu kaskad ko'p elementga ta'sir qilgani uchun aniqlik uchun butun
    // katalogni qayta yuklaymiz (optimistik qisman o'chirish emas).
    async function deleteCategory(id, e) {
      if (e) e.stopPropagation();
      let preview;
      showActionToast(tr('⏳ Tekshirilmoqda...', '⏳ Проверка...'), 'saving');
      try {
        preview = await callApi('get_category_delete_preview', { categoryId: id });
      } catch (err) {
        hideActionToast();
        return alert(tr('❌ Tekshirishda xatolik: ', '❌ Ошибка проверки: ') + (err.message || err));
      }
      hideActionToast();
      const msg = (preview.categoryCount > 0 || preview.productCount > 0)
        ? tr(
            `Bu katalog ichida:\n${preview.categoryCount} ta ichki katalog\n${preview.productCount} ta tovar\nbor.\n\nO'chirishga aminmisiz? (24 soat ichida Chiqindidan tiklash mumkin)`,
            `В этом каталоге:\n${preview.categoryCount} подкаталогов\n${preview.productCount} товаров\n\nУдалить? (В течение 24 часов можно восстановить из корзины)`
          )
        : tr("Katalog o'chirilsinmi? (24 soat ichida Chiqindidan tiklash mumkin)", 'Удалить каталог? (В течение 24 часов можно восстановить из корзины)');
      if (!confirm(msg)) return;
      showActionToast(tr("⏳ O'chirilmoqda...", "⏳ Удаление..."), 'saving');
      try {
        await callApi('delete_category', { categoryId: id });
        await loadCatalog();
        if (adminCatParentId === id) adminCatParentId = null;
        render();
        showActionToast(tr("✅ O'chirildi (24 soat Chiqindida)", "✅ Удалено (24 часа в корзине)"), 'success', 1800);
      } catch (e2) {
        console.error(e2);
        showActionToast(tr("❌ O'chirilmadi", "❌ Не удалено"), 'error', 1800);
        alert(tr("❌ O'chirishda xatolik yuz berdi: ", "❌ Ошибка удаления: ") + (e2.message || e2));
      }
    }

    // 2.6: mahsulotni nusxalash — yangi SKU, mustaqil rasm va original qoldiq/variant qty bilan.
    async function duplicateProduct(id) {
      showActionToast(tr('⏳ Nusxalanmoqda...', '⏳ Копирование...'), 'saving');
      try {
        const result = await callApi('duplicate_product', { productId: id });
        products.unshift(mapProductFromDB(result.product));
        saveCatalogCache();
        selectedProductModal = mapProductFromDB(result.product);
        render();
        showActionToast(tr('✅ Nusxa yaratildi', '✅ Копия создана'), 'success', 1800);
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Nusxalab bo\'lmadi', '❌ Не удалось скопировать'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }

    // 2.8: narx tarixi ko'rish.
    async function openPriceHistoryModal(productId) {
      priceHistoryProductId = productId;
      priceHistoryList = null;
      activePopupModal = 'PRICE_HISTORY';
      render();
      try {
        const result = await callApi('get_product_price_history', { productId });
        priceHistoryList = result.history || [];
      } catch (e) {
        console.error(e);
        priceHistoryList = [];
      }
      if (activePopupModal === 'PRICE_HISTORY') renderModalContainer();
    }

    // 2.3: "Katalogni o'zgartirish" — tovarni boshqa kategoriyaga ko'chirish.
    function openMoveProductModal(productId) {
      moveProductId = productId;
      moveTargetCategoryId = '';
      activePopupModal = 'MOVE_PRODUCT_CATEGORY';
      render();
    }
    async function saveMoveProduct() {
      const newCategoryId = moveTargetCategoryId || null;
      showActionToast(tr('⏳ Ko\'chirilmoqda...', '⏳ Перемещение...'), 'saving');
      try {
        const result = await callApi('edit_product_field', { productId: moveProductId, field: 'categoryId', value: newCategoryId });
        const idx = products.findIndex(p => p.id === moveProductId);
        if (idx >= 0) products[idx] = mapProductFromDB(result.product);
        saveCatalogCache();
        activePopupModal = null;
        selectedProductModal = idx >= 0 ? products[idx] : null;
        render();
        showActionToast(tr('✅ Katalog o\'zgartirildi', '✅ Каталог изменён'), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ O\'zgartirilmadi', '❌ Не изменено'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }

    // 2.2: kategoriyani boshqa kategoriya ichiga ko'chirish (server cycle'ni ham tekshiradi).
    function categoryDescendantIds(id) {
      const result = new Set([String(id)]);
      const queue = [String(id)];
      while (queue.length) {
        const cur = queue.shift();
        for (const c of categories.filter(x => String(x.parentId || '') === cur)) {
          if (!result.has(String(c.id))) { result.add(String(c.id)); queue.push(String(c.id)); }
        }
      }
      return result;
    }
    function openMoveCategoryModal(categoryId, e) {
      if (e) e.stopPropagation();
      moveCategoryId = categoryId;
      moveCategoryTargetId = '';
      activePopupModal = 'MOVE_CATEGORY';
      render();
    }
    async function saveMoveCategory() {
      const newParentId = moveCategoryTargetId || null;
      showActionToast(tr('⏳ Ko\'chirilmoqda...', '⏳ Перемещение...'), 'saving');
      try {
        await callApi('move_category', { categoryId: moveCategoryId, newParentId });
        await loadCatalog();
        activePopupModal = null;
        render();
        showActionToast(tr('✅ Katalog ko\'chirildi', '✅ Каталог перемещён'), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Ko\'chirilmadi', '❌ Не перемещено'), 'error', 1800);
        const msg = String(e.message || '').includes('cannot_move_into_own_descendant')
          ? tr("❌ Katalogni o'zining ichki kataloglaridan biriga ko'chirib bo'lmaydi.", '❌ Нельзя переместить каталог в его же подкаталог.')
          : tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e);
        alert(msg);
      }
    }

    // 2.1: tartib tugmalari — faqat bir xil ota-katalog ichidagi qo'shnilar bilan almashadi.
    //
    // MUHIM TUZATISH (real production DB'da tasdiqlangan): bazadagi barcha
    // kategoriyalarning sort_order'i 0 ekan (hech qachon farqlantirilmagan).
    // Eski kod faqat ikkita qo'shnining QIYMATINI almashtirar edi — 0 bilan
    // 0'ni almashtirish esa hech narsani o'zgartirmaydi, shuning uchun tugma
    // "ishlamayotganday" ko'rinardi. Endi ikkalasi ARRAY ICHIDA joy
    // almashadi, so'ng BUTUN qo'shnilar ro'yxati 0..N-1 tarzida qaytadan
    // raqamlanadi — bu bir martalik ishlatishning o'zi shu guruhdagi
    // barcha 0 qiymatlarni ham tuzatib (normalizatsiya qilib) qo'yadi.
    async function moveCategoryOrder(categoryId, direction, e) {
      if (e) e.stopPropagation();
      const cat = categories.find(c => c.id === categoryId);
      if (!cat) return;
      const siblings = categories.filter(c => String(c.parentId || '') === String(cat.parentId || ''))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const idx = siblings.findIndex(c => c.id === categoryId);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= siblings.length) return;

      const reordered = siblings.slice();
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      const previousOrders = reordered.map(c => c.sortOrder);
      reordered.forEach((c, i) => { c.sortOrder = i; });

      // Optimistic: tugma darhol ishlaydi, server javobi fon rejimida keladi.
      render();
      try {
        await callApi('reorder_categories', { items: reordered.map(c => ({ id: c.id, sortOrder: c.sortOrder })) });
        saveCatalogCache();
      } catch (err) {
        console.error(err);
        reordered.forEach((c, i) => { c.sortOrder = previousOrders[i]; });
        render();
        alert(tr('❌ Tartibni saqlab bo\'lmadi: ', '❌ Не удалось сохранить порядок: ') + (err.message || err));
      }
    }

    // 2.7: duplicate tovarlarni ANIQLASH (auto-merge yo'q — spec buni keyinga
    // qoldirishga ruxsat beradi: "Automatic merge qilmay turish mumkin").
    // excel-import.js'ning ichki (lazy-load qilinadigan, eksport qilinmagan)
    // Levenshtein funksiyasiga bog'lanmaslik uchun mustaqil kichik nusxa.
    function productNameSimilarity(a, b) {
      const an = normalizeText(a || '').latin, bn = normalizeText(b || '').latin;
      if (an === bn) return 1;
      const len = Math.max(an.length, bn.length, 1);
      const prev = Array.from({ length: bn.length + 1 }, (_, i) => i);
      const cur = new Array(bn.length + 1);
      for (let i = 1; i <= an.length; i++) {
        cur[0] = i;
        for (let j = 1; j <= bn.length; j++) cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (an[i - 1] === bn[j - 1] ? 0 : 1));
        for (let j = 0; j <= bn.length; j++) prev[j] = cur[j];
      }
      return 1 - prev[bn.length] / len;
    }
    function findDuplicateProductCandidates() {
      const active = products.filter(p => p.status !== 'DELETED');
      const pairs = [];
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i], b = active[j];
          if (a.categoryId !== b.categoryId) continue;
          const score = productNameSimilarity(a.name, b.name);
          if (score >= 0.82) pairs.push({ a, b, score });
        }
      }
      pairs.sort((x, y) => y.score - x.score);
      return pairs.slice(0, 50);
    }
    function openDuplicateProductsModal() {
      activePopupModal = 'DUPLICATE_PRODUCTS';
      render();
    }

    function toggleBulkProductSelectMode() {
      bulkProductSelectMode = !bulkProductSelectMode;
      bulkSelectedProductIds.clear();
      render();
    }
    function toggleBulkProductSelection(productId, event) {
      if (event) event.stopPropagation();
      const id = String(productId);
      if (bulkSelectedProductIds.has(id)) bulkSelectedProductIds.delete(id); else bulkSelectedProductIds.add(id);
      render();
    }
    function selectAllVisibleProducts() {
      for (const id of currentVisibleProductIds) bulkSelectedProductIds.add(String(id));
      render();
    }
    function clearBulkProductSelection() {
      bulkSelectedProductIds.clear();
      bulkProductSelectMode = false;
      render();
    }
    function openBulkMoveProductsModal() {
      if (!bulkSelectedProductIds.size) return;
      bulkMoveTargetCategoryId = '';
      activePopupModal = 'BULK_MOVE_PRODUCTS';
      render();
    }
    async function saveBulkMoveProducts() {
      const ids = [...bulkSelectedProductIds];
      if (!ids.length) return;
      showActionToast(tr('⏳ Ko‘chirilmoqda...','⏳ Перемещение...'), 'saving');
      try {
        const result = await callApi('bulk_move_products', { productIds: ids, categoryId: bulkMoveTargetCategoryId || null });
        for (const row of result.products || []) upsertLocalProduct(row);
        saveCatalogCache();
        activePopupModal = null; bulkProductSelectMode = false; bulkSelectedProductIds.clear();
        render();
        showActionToast(tr('✅ Tovarlar ko‘chirildi','✅ Товары перемещены'), 'success', 1500);
      } catch (e) {
        console.error(e);
        alert(tr('❌ Ko‘chirishda xatolik: ','❌ Ошибка перемещения: ') + (e.message || e));
      }
    }
    async function bulkTrashSelectedProducts() {
      const ids = [...bulkSelectedProductIds];
      if (!ids.length) return;
      if (!confirm(`${ids.length} ${tr('ta tovar chiqindiga o‘tkazilsinmi?','товаров переместить в корзину?')}`)) return;
      showActionToast(tr('⏳ Chiqindiga o‘tkazilmoqda...','⏳ Перемещение в корзину...'), 'saving');
      try {
        await callApi('bulk_trash_products', { productIds: ids });
        products = products.filter(p => !bulkSelectedProductIds.has(String(p.id)));
        bulkSelectedProductIds.clear(); bulkProductSelectMode = false;
        saveCatalogCache(); render();
        showActionToast(tr('✅ Chiqindiga o‘tkazildi','✅ Перемещено в корзину'), 'success', 1500);
      } catch (e) { console.error(e); alert(tr('❌ Xatolik: ','❌ Ошибка: ') + (e.message || e)); }
    }
    async function purgeTrashBatchNow(batchId) {
      if (!confirm(tr('Bu elementlar darhol va qaytarib bo‘lmaydigan tarzda o‘chirilsinmi?','Удалить эти элементы навсегда прямо сейчас?'))) return;
      showActionToast(tr('⏳ Butunlay o‘chirilmoqda...','⏳ Удаление навсегда...'), 'saving');
      try {
        await callApi('purge_trash_batch_now', { batchId });
        if (trashBatches) trashBatches = trashBatches.filter(b => Number(b.id) !== Number(batchId));
        await loadCatalog(); render();
        showActionToast(tr('✅ Butunlay o‘chirildi','✅ Удалено навсегда'), 'success', 1500);
      } catch (e) { console.error(e); alert(tr('❌ O‘chirishda xatolik: ','❌ Ошибка удаления: ') + (e.message || e)); }
    }
    function dashboardRangeBounds(preset) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endExclusive = new Date(startOfToday.getTime() + 24 * 3600 * 1000);
      if (preset === '7d') return { from: new Date(startOfToday.getTime() - 6 * 24 * 3600 * 1000), to: endExclusive };
      if (preset === '30d') return { from: new Date(startOfToday.getTime() - 29 * 24 * 3600 * 1000), to: endExclusive };
      if (preset === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endExclusive };
      if (preset === 'custom') {
        const from = dashboardCustomFrom ? new Date(dashboardCustomFrom) : startOfToday;
        const toBase = dashboardCustomTo ? new Date(dashboardCustomTo) : startOfToday;
        return { from, to: new Date(toBase.getTime() + 24 * 3600 * 1000) };
      }
      return { from: startOfToday, to: endExclusive };
    }

    function openDashboard() {
      dashboardReturnTab = currentTab === 'dashboard' ? dashboardReturnTab : currentTab;
      currentTab = 'dashboard';
      render();
      loadDashboard();
      loadUsersLazy(); // "Eng faol mijozlar" ro'yxati openUserModal orqali usersSummary'ga tayanadi
    }

    function closeDashboard() {
      currentTab = dashboardReturnTab || 'warehouse';
      render();
    }

    function setDashboardRangePreset(preset) {
      dashboardRangePreset = preset;
      if (preset === 'custom') { render(); return; }
      loadDashboard();
    }

    async function loadDashboard() {
      dashboardLoading = true;
      render();
      try {
        const { from, to } = dashboardRangeBounds(dashboardRangePreset);
        dashboardData = await callApi('get_dashboard', { from: from.toISOString(), to: to.toISOString() });
      } catch (e) {
        console.error(e);
        dashboardData = null;
        alert(tr('❌ Dashboard yuklanmadi: ', '❌ Dashboard не загружен: ') + (e.message || e));
      } finally {
        dashboardLoading = false;
        if (currentTab === 'dashboard') render();
      }
    }

    function dashboardStatCard(opts) {
      const { icon, label, value, tint } = opts;
      const tints = {
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        amber: 'bg-amber-50 border-amber-100 text-amber-700',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        violet: 'bg-violet-50 border-violet-100 text-violet-700',
        sky: 'bg-sky-50 border-sky-100 text-sky-700',
        red: 'bg-red-50 border-red-100 text-red-700',
      };
      return `
        <div class="rounded-2xl border p-3 ${tints[tint] || tints.blue}">
          <div class="flex items-center gap-1.5 text-[10px] font-bold opacity-80"><span>${icon}</span><span>${label}</span></div>
          <p class="mt-1 text-lg font-black leading-tight">${value}</p>
        </div>`;
    }

    function renderDashboard(container) {
      const d = dashboardData;
      const presets = [
        { id: 'today', label: tr('Bugun', 'Сегодня') },
        { id: '7d', label: tr('7 kun', '7 дней') },
        { id: '30d', label: tr('30 kun', '30 дней') },
        { id: 'month', label: tr('Shu oy', 'Этот месяц') },
        { id: 'custom', label: tr('Ixtiyoriy', 'Период') },
      ];
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <button onclick="closeDashboard()" class="text-xs font-bold text-blue-600 flex items-center gap-1">‹ ${tr('Orqaga', 'Назад')}</button>
            <h2 class="text-lg font-bold text-slate-800">📊 ${tr('Dashboard / Hisobot', 'Dashboard / Отчёт')}</h2>
            <span class="w-10"></span>
          </div>

          <div class="flex flex-wrap gap-1.5">
            ${presets.map(p => `<button onclick="setDashboardRangePreset('${p.id}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${dashboardRangePreset === p.id ? 'bg-slate-900 text-white' : 'bg-white border text-gray-600'}">${p.label}</button>`).join('')}
          </div>
          ${dashboardRangePreset === 'custom' ? `
            <div class="bg-white rounded-2xl border p-3 flex flex-wrap items-end gap-2 text-xs">
              <div><label class="block font-bold text-gray-500 mb-1">${tr('Dan', 'С')}</label><input type="date" id="dash-from" value="${escapeHtml(dashboardCustomFrom)}" class="p-2 border rounded-xl"></div>
              <div><label class="block font-bold text-gray-500 mb-1">${tr('Gacha', 'По')}</label><input type="date" id="dash-to" value="${escapeHtml(dashboardCustomTo)}" class="p-2 border rounded-xl"></div>
              <button onclick="dashboardCustomFrom=document.getElementById('dash-from').value; dashboardCustomTo=document.getElementById('dash-to').value; loadDashboard();" class="bg-blue-600 text-white font-bold px-3 py-2 rounded-xl">${tr("Qo'llash", 'Применить')}</button>
            </div>
          ` : ''}

          ${dashboardLoading || !d ? `<p class="text-center text-gray-400 py-10">${tr('Yuklanmoqda...', 'Загрузка...')}</p>` : `
            <div>
              <h3 class="text-xs font-black text-gray-500 mb-1.5">💰 ${tr('Savdo', 'Продажи')}</h3>
              <div class="grid grid-cols-2 gap-2">
                ${dashboardStatCard({ icon: '☀️', label: tr('Bugungi savdo', 'Продажи сегодня'), value: money(d.sales.today), tint: 'blue' })}
                ${dashboardStatCard({ icon: '📅', label: tr('Haftalik savdo', 'Продажи за неделю'), value: money(d.sales.week), tint: 'blue' })}
                ${dashboardStatCard({ icon: '🗓️', label: tr('Oylik savdo', 'Продажи за месяц'), value: money(d.sales.month), tint: 'blue' })}
                ${dashboardStatCard({ icon: '🧾', label: tr('Tanlangan davr buyurtmalari', 'Заказы за период'), value: String(d.sales.rangeOrderCount), tint: 'blue' })}
              </div>
            </div>

            <div>
              <h3 class="text-xs font-black text-gray-500 mb-1.5">📦 ${tr('Buyurtmalar (tanlangan davr)', 'Заказы (за период)')}</h3>
              <div class="grid grid-cols-2 gap-2">
                ${dashboardStatCard({ icon: '🆕', label: tr('Yangi', 'Новые'), value: String(d.orders.byStatus.NEW || 0), tint: 'amber' })}
                ${dashboardStatCard({ icon: '⏳', label: tr('Tayyorlanmoqda', 'В обработке'), value: String(d.orders.byStatus.PROCESSING || 0), tint: 'amber' })}
                ${dashboardStatCard({ icon: '✅', label: tr('Yetkazilgan', 'Доставлено'), value: String(d.orders.byStatus.DELIVERED || 0), tint: 'emerald' })}
                ${dashboardStatCard({ icon: '❌', label: tr('Bekor qilingan', 'Отменено'), value: String(d.orders.byStatus.CANCELLED || 0), tint: 'red' })}
              </div>
            </div>

            <div>
              <h3 class="text-xs font-black text-gray-500 mb-1.5">🏷️ ${tr('Tovarlar', 'Товары')}</h3>
              <div class="grid grid-cols-2 gap-2">
                ${dashboardStatCard({ icon: '📚', label: tr('Jami mahsulot', 'Всего товаров'), value: String(d.products.total), tint: 'emerald' })}
                ${dashboardStatCard({ icon: '⚠️', label: tr('Kam qolgan', 'Мало на складе'), value: String(d.products.lowStock), tint: 'amber' })}
                ${dashboardStatCard({ icon: '🚫', label: tr('Tugagan', 'Закончились'), value: String(d.products.outOfStock), tint: 'red' })}
              </div>
              ${d.products.top.length ? `
                <div class="mt-2 bg-white rounded-2xl border divide-y overflow-hidden">
                  <p class="px-3 py-2 text-[10px] font-black text-gray-400">${tr('Eng ko‘p sotilgan', 'Самые продаваемые')}</p>
                  ${d.products.top.map((p, i) => `
                    <div class="px-3 py-2 flex items-center gap-2 text-xs">
                      <span class="font-black text-gray-300 w-4">${i + 1}</span>
                      <img src="${escapeHtml(p.img || FALLBACK_IMG)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" class="w-7 h-7 rounded-lg object-cover flex-shrink-0">
                      <span class="flex-1 truncate font-bold text-gray-700">${escapeHtml(p.name)}</span>
                      <span class="font-black text-emerald-700">${p.soldCount}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div>
              <h3 class="text-xs font-black text-gray-500 mb-1.5">👥 ${tr('Mijozlar', 'Клиенты')}</h3>
              <div class="grid grid-cols-2 gap-2">
                ${dashboardStatCard({ icon: '👤', label: tr('Jami mijozlar', 'Всего клиентов'), value: String(d.customers.total), tint: 'violet' })}
                ${dashboardStatCard({ icon: '✨', label: tr('Yangi mijozlar', 'Новые клиенты'), value: String(d.customers.new), tint: 'violet' })}
                ${dashboardStatCard({ icon: '🔁', label: tr('Qayta buyurtma', 'Повторные заказы'), value: String(d.customers.returning), tint: 'violet' })}
              </div>
              <button onclick="openAllCustomersPage()" class="mt-2 w-full text-center text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-xl py-2">${tr('Barcha mijozlarni ko‘rish →', 'Все клиенты →')}</button>
              ${d.customers.top.length ? `
                <div class="mt-2 bg-white rounded-2xl border divide-y overflow-hidden">
                  <p class="px-3 py-2 text-[10px] font-black text-gray-400">${tr('Eng faol mijozlar', 'Самые активные клиенты')}</p>
                  ${d.customers.top.map(u => `
                    <div class="px-3 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-gray-50" onclick="openUserModal('${u.tgId}')">
                      <span class="font-bold text-gray-700 truncate">${escapeHtml(u.userName)}</span>
                      <span class="font-black text-violet-700">${u.totalOrders} ${tr('buyurtma', 'заказов')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div>
              <h3 class="text-xs font-black text-gray-500 mb-1.5">📍 ${tr('Hududlar (tanlangan davr)', 'Регионы (за период)')}</h3>
              ${d.regions.length ? `
                <div class="bg-white rounded-2xl border divide-y overflow-hidden">
                  ${d.regions.map(r => `
                    <div class="px-3 py-2 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-700">${escapeHtml(r.region)}</span>
                      <span class="font-black text-sky-700">${r.count}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `<p class="text-center text-gray-400 py-4 text-xs">${tr("Bu davrda buyurtma yo'q", 'За этот период заказов нет')}</p>`}
            </div>
          `}
        </div>
      `;
    }

    // 2.5: Chiqindi (trash) ko'rinishi.
    async function openTrashModal() {
      trashBatches = null;
      trashPage = 1;
      trashSelectMode = false;
      trashSelectedBatchIds.clear();
      activePopupModal = 'TRASH';
      render();
      try {
        const result = await callApi('get_trash', {});
        trashBatches = result.batches || [];
      } catch (e) {
        console.error(e);
        trashBatches = [];
      }
      if (activePopupModal === 'TRASH') renderModalContainer();
    }
    async function restoreTrashBatch(batchId) {
      showActionToast(tr('⏳ Tiklanmoqda...', '⏳ Восстановление...'), 'saving');
      try {
        await callApi('restore_trash_batch', { batchId });
        await loadCatalog();
        if (trashBatches) trashBatches = trashBatches.filter(b => b.id !== batchId);
        render();
        showActionToast(tr('✅ Tiklandi', '✅ Восстановлено'), 'success', 1500);
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Tiklanmadi', '❌ Не восстановлено'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }

    // 9-11-band: Trash bulk select. "Multi-select" batch darajasida ishlaydi
    // — har bir batch allaqachon bitta atomik birlik (bitta mahsulot yoki
    // bitta bulk-trash/kategoriya operatsiyasi natijasi), shu sabab bir
    // nechta batch'ni birga tanlab tiklash/o'chirish xavfsiz semantика.
    function toggleTrashSelectMode() {
      trashSelectMode = !trashSelectMode;
      trashSelectedBatchIds.clear();
      renderModalContainer();
    }
    function toggleTrashBatchSelection(batchId, event) {
      if (event) event.stopPropagation();
      const key = String(batchId);
      if (trashSelectedBatchIds.has(key)) trashSelectedBatchIds.delete(key); else trashSelectedBatchIds.add(key);
      renderModalContainer();
    }
    function selectAllVisibleTrashBatches() {
      const batches = trashBatches || [];
      const pageItems = batches.slice((trashPage - 1) * 10, trashPage * 10);
      for (const b of pageItems) trashSelectedBatchIds.add(String(b.id));
      renderModalContainer();
    }
    function selectAllTrashBatches() {
      for (const b of (trashBatches || [])) trashSelectedBatchIds.add(String(b.id));
      renderModalContainer();
    }
    function clearTrashSelection() {
      trashSelectedBatchIds.clear();
      renderModalContainer();
    }
    async function restoreSelectedTrashBatches() {
      const ids = [...trashSelectedBatchIds].map(Number);
      if (!ids.length) return;
      showActionToast(tr('⏳ Tiklanmoqda...', '⏳ Восстановление...'), 'saving');
      try {
        const result = await callApi('restore_trash_batches', { batchIds: ids });
        const failedIds = new Set((result.results || []).filter(r => !r.ok).map(r => r.batchId));
        await loadCatalog();
        if (trashBatches) trashBatches = trashBatches.filter(b => failedIds.has(b.id) || !ids.includes(b.id));
        trashSelectedBatchIds.clear();
        trashSelectMode = false;
        render();
        if (failedIds.size) {
          showActionToast(tr(`⚠️ ${failedIds.size} tasi tiklanmadi`, `⚠️ ${failedIds.size} не восстановлено`), 'error', 2200);
        } else {
          showActionToast(tr('✅ Tiklandi', '✅ Восстановлено'), 'success', 1500);
        }
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Xatolik', '❌ Ошибка'), 'error', 1800);
        alert(tr('❌ Xatolik: ', '❌ Ошибка: ') + (e.message || e));
      }
    }
    async function purgeSelectedTrashBatches() {
      const ids = [...trashSelectedBatchIds].map(Number);
      if (!ids.length) return;
      if (!confirm(`${ids.length} ${tr("ta chiqindi butunlay o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi.", "элементов будет удалено навсегда. Это действие нельзя отменить.")}`)) return;
      showActionToast(tr('⏳ Butunlay o‘chirilmoqda...', '⏳ Удаление навсегда...'), 'saving');
      try {
        const result = await callApi('purge_trash_batches_now', { batchIds: ids });
        const failedIds = new Set((result.results || []).filter(r => !r.ok).map(r => r.batchId));
        if (trashBatches) trashBatches = trashBatches.filter(b => failedIds.has(b.id) || !ids.includes(b.id));
        trashSelectedBatchIds.clear();
        trashSelectMode = false;
        render();
        if (failedIds.size) {
          showActionToast(tr(`⚠️ ${failedIds.size} tasi o'chmadi`, `⚠️ ${failedIds.size} не удалено`), 'error', 2200);
        } else {
          showActionToast(tr('✅ Butunlay o‘chirildi', '✅ Удалено навсегда'), 'success', 1500);
        }
      } catch (e) {
        console.error(e);
        showActionToast(tr('❌ Xatolik', '❌ Ошибка'), 'error', 1800);
        alert(tr('❌ O‘chirishda xatolik: ', '❌ Ошибка удаления: ') + (e.message || e));
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
      // Kategoriya realtime'dagi bilan bir xil himoya: TOAST qilingan katta
      // (base64) img ustuni o'zgarmagan UPDATE'da bo'sh kelishi mumkin.
      if (idx >= 0) {
        if (!mapped.img && products[idx].img) mapped.img = products[idx].img;
        products[idx] = mapped;
      } else products.push(mapped);
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
            // MUAMMO 2 tuzatish: tartib (sortOrder) FAQAT ⬆️/⬇️ tugmasi
            // (moveCategoryOrder) orqali o'zgaradi va u allaqachon o'zining
            // optimistic+rollback tsikliga ega. Realtime orqali kelgan
            // sortOrder'ga ishonib mahalliy qiymatni qoplab qo'yish — bir
            // nechta bosishda (reorder yozuvining o'zi ham shu kanalga signal
            // beradi) eski/kechikkan qiymat yangisini bosib, tartib "orqaga
            // qaytib" ketardi. Shu sabab mavjud qatorlar uchun sortOrder
            // e'tiborsiz qoldiriladi — faqat nom/rasm/boshqa maydonlar
            // sinxronlanadi. Yangi (idx<0) qatorlar uchun serverdan kelgan
            // sortOrder shart, chunki mahalliy optimistic qiymat yo'q.
            //
            // QO'SHIMCHA TUZATISH (reorder rasmlarni "yo'qotib qo'yish" bug'i):
            // reorder bir nechta qatorni bir vaqtda yangilaganda (faqat
            // sort_order ustuniga tegadi), Postgres logical replication katta
            // (base64) `img` ustunini — u TOAST qilingan va shu UPDATE'da
            // o'zgarmagan bo'lsa — real qiymatsiz/bo'sh holda yuborishi
            // mumkin. Shu sabab: agar realtime orqali kelgan img BO'SH bo'lsa,
            // lekin mahalliyda oldin haqiqiy rasm bo'lgan bo'lsa — eskisi
            // saqlanadi (rasm "yo'qolib" ko'rinmaydi). Rasm chindan o'chirilsa
            // yoki almashtirilsa — kelgan qiymat BO'SH BO'LMAYDI, shuning
            // uchun bu himoya haqiqiy o'zgarishlarga xalaqit bermaydi.
            if (idx >= 0) {
              mapped.sortOrder = categories[idx].sortOrder;
              if (!mapped.img && categories[idx].img) mapped.img = categories[idx].img;
              categories[idx] = mapped;
            } else categories.push(mapped);
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
        // 10-band: yangi support xabari — mavjud kanalning o'zi kengaytirildi,
        // yangi kanal/polling loop ochilmagan. Ro'yxat (agar yuklangan bo'lsa)
        // va hozir ochiq chat (agar shu ticket bo'lsa) qayta yuklanadi.
        .on('broadcast', { event: 'support_changed' }, async (msg) => {
          const ticketId = msg?.payload?.ticketId;
          if (isUserAnAdmin && adminSupportTicketsLoaded) await loadAdminSupportTicketsLazy(true);
          if (supportTicketsLoaded) await loadMySupportTicketsLazy(true);
          if (ticketId && (openSupportTicketId === ticketId || adminSupportSelectedTicketId === ticketId)) {
            await loadSupportMessages(ticketId, true);
          }
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
        sb.from('categories').select('id,name,name_ru,parent_id,img,sort_order').is('deleted_at', null).order('sort_order', { ascending: true })
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
      // Katalog cache darhol xotiraga olinadi, lekin ADMIN/USER roli aniqlanmaguncha
      // hech narsa render qilinmaydi. Shu bilan USER -> ADMIN sakrashi yo'qoladi.
      const catalogPromise = loadCatalog().then(() => {
        if (authReady && (currentTab === 'home' || currentTab === 'categories' || currentTab === 'warehouse')) render();
      });

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
        botUsername = bootData.botUsername || null;
        shopContact = bootData.shopContact || { name: null, address: null, addressRu: null, coordinates: null, phone: null, phone2: null, phone3: null, instagram: null, telegram: null, facebook: null, startMessage: null };
        fulfillmentConfig = commerce.normalizeConfig(bootData.fulfillmentConfig, TOP_LEVEL_REGION_IDS);
        designSettings = bootData.designSettings || { themeId: 'minimal', colors: {} };
        applyDesignColors(designSettings.colors);
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

      // Eski versiyalarda FRESH deb noto'g'ri belgilangan yoki bo'sh qolgan RU
      // matnlarni bir sessiyada bir marta server fonida qayta tekshirtiramiz.
      // Bu boot'ni kutdirmaydi va oddiy foydalanuvchida umuman ishlamaydi.
      if (isUserAnAdmin && sessionStorage.getItem('fitcore-ru-repair-v2') !== '1') {
        sessionStorage.setItem('fitcore-ru-repair-v2', '1');
        callApi('retry_bad_translations', {}).then((r) => {
          if (Number(r?.scheduledProducts || 0) + Number(r?.scheduledCategories || 0) > 0) {
            console.info('[FITCORE] RU translation repair scheduled', r);
          }
        }).catch((e) => console.warn('[FITCORE] RU translation repair could not start', e));
      }
    }

    // INITIAL LAUNCH
    boot();
