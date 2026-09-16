/* Prelook landing — i18n、主题切换、滚动高亮、入场动画、按钮涟漪 */
(function () {
  'use strict';

  var I18N = {
    'zh-CN': {
      'nav.features': '功能',
      'nav.speed': '极速',
      'nav.install': '安装',
      'nav.reviews': '评价',
      'nav.faq': 'FAQ',
      'nav.theme': '切换深浅色主题',
      'nav.lang': '切换语言',

      'hero.title1': '悬停即预览，',
      'hero.title2': '不必点开',
      'hero.desc': '鼠标停在链接上的瞬间，目标页已经开始加载——先预览，再决定要不要打开。',
      'hero.videoAria': 'Prelook 使用演示：指针停在链接上，预览窗浮出并渲染这个页面',
      'hero.videoPlay': '播放演示',
      'hero.videoPause': '暂停演示',

      // 安装入口：hero 与页尾色带各一份，四颗等权
      'install.chrome': 'Chrome 安装',
      'install.edge': 'Edge 安装',
      'install.firefox': 'Firefox 安装',
      'install.manual': '手动安装',

      'cta.badge': '三个浏览器，同一份代码',
      'cta.title': '现在就用起来',
      'cta.sub': '装完即用，不用注册，也不用登录。',

      'features.title': '沉浸式浏览，不必来回切换',
      'features.subtitle': '十二项能力，全部本地运行，不上传任何数据',

      'f.preview.tag': '核心',
      'f.preview.t': '链接预览',
      'f.preview.d': '悬停链接即浮出内容预览，是否打开由你决定。',
      'f.preview.g1': '悬停即预览',
      'f.preview.g2': '见后再开',
      'f.warm.t': '链接预热',
      'f.warm.d': '悬停瞬间即开始预取目标页，预览与打开更快。',
      'f.warm.g1': 'Speculation Rules',
      'f.warm.g2': '原生预取',
      'f.reader.t': '阅读模式',
      'f.reader.d': '无法内嵌的网站自动切换为无干扰阅读视图。',
      'f.reader.g1': '禁嵌兜底',
      'f.reader.g2': '正文提取',
      'f.multi.t': '多窗口预览',
      'f.multi.d': '最多同时打开 6 个预览窗，左右对比阅读。',
      'f.multi.g1': '最多 6 窗',
      'f.multi.g2': '并排对比',
      'f.sidebar.t': '侧边栏模式',
      'f.sidebar.d': '预览窗通高贴边，侧栏堆叠不遮挡正文。',
      'f.sidebar.g1': '通高停靠',
      'f.sidebar.g2': '左右任选',
      'f.search.t': '划词搜索',
      'f.search.d': '选中文字，一键 Google / Bing / 百度 / DuckDuckGo。',
      'f.search.g1': '4 大引擎',
      'f.search.g2': '选中即搜',
      'f.ai.t': 'AI 搜索',
      'f.ai.d': 'DeepSeek / 豆包 / Kimi / Perplexity，选完即问。',
      'f.ai.g1': '4 家引擎',
      'f.ai.g2': '选中即问',
      'f.track.t': '追踪参数清理',
      'f.track.d': '自动剥掉 utm、fbclid 等追踪参数，还原中转壳里的真实地址。',
      'f.track.g1': '剥离 utm',
      'f.track.g2': '还原真实链接',
      'f.safety.t': '链接风险提示',
      'f.safety.d': '仿冒域名、乱码域名、文字与目标不符时在标题栏给出提醒。',
      'f.safety.g1': '仿冒域名',
      'f.safety.g2': '文字不符',
      'f.trigger.t': '四种触发方式',
      'f.trigger.d': '悬停、Alt+悬停、长按、拖动，按习惯任选。',
      'f.trigger.g1': 'Alt 组合',
      'f.trigger.g2': '长按拖动',
      'f.theme.t': '主题与外观',
      'f.theme.d': '深浅色、主题色、窗口配色、位置尺寸与背景模糊随心调。',
      'f.theme.g1': '深浅色',
      'f.theme.g2': '窗口配色',
      'f.privacy.t': '隐私本地化',
      'f.privacy.d': '无账号、无服务器，数据不出本机。',
      'f.privacy.g1': '无账号',
      'f.privacy.g2': '无服务器',

      'speed.title': '极速预览，快在每一环',
      'speed.subtitle': '从悬停到呈现，三步把等待压缩到感知之外',
      'speed.s1t': '悬停即预热',
      'speed.s1d':
        '鼠标停在链接上的刹那，浏览器原生 Speculation Rules 已把目标页加入下载队列——不经过任何第三方服务器。',
      'speed.s2t': '预览窗秒开',
      'speed.s2d':
        '预览窗出现时直接命中缓存；可内嵌的站点一步到位，禁止内嵌的站点无缝转入阅读模式。',
      'speed.s3t': '点击零等待',
      'speed.s3d': '开启预渲染后，页面在后台提前完成渲染，真正点击时跳转即呈现。',
      'speed.compare': '加载耗时对比',
      'speed.cold': '冷启动加载',
      'speed.warm': 'Prelook 预热后',
      'speed.note': '示意对比：预热后的预览窗直接呈现本地已有内容。',

      // 占位评价：上线前必须换成可核实的真实评价原文与昵称，
      // 不要为了让版式好看而编造或改写原话。
      'reviews.title': '用户怎么说',
      'reviews.subtitle': '别只听我们说——看看装上之后的人怎么讲。',
      'reviews.r1.name': '示例用户 A',
      'reviews.r1.text': '（占位）这条换成真实评价的原文。',
      'reviews.r2.name': '示例用户 B',
      'reviews.r2.text': '（占位）昵称也要替换成评价者本人的。',
      'reviews.r3.name': '示例用户 C',
      'reviews.r3.text': '（占位）建议照抄原文，不要自己润色改写。',
      'reviews.r4.name': '示例用户 D',
      'reviews.r4.text': '（占位）长短不一的评价会自然形成错落的三栏。',
      'reviews.r5.name': '示例用户 E',
      'reviews.r5.text': '（占位）头像右下角的小图标表示评价者用的浏览器。',
      'reviews.r6.name': '示例用户 F',
      'reviews.r6.text': '（占位）没有真实评价之前，这一段先别上线。',

      'faq.title': '常见问题',
      'faq.subtitle': '还有疑问？先看这几条。',
      'faq.q1': '预览窗口是空白的怎么办？',
      'faq.a1':
        '部分网站禁止被内嵌，Prelook 会自动切换为阅读模式；若两者都失败，窗口会提供「在新标签页打开」按钮。',
      'faq.q2': '我的数据会被上传吗？',
      'faq.a2':
        '不会。所有预览与设置都发生在本机浏览器内，Prelook 没有账号体系，也不设任何服务器。',
      'faq.q3': 'Prelook 收费吗？',
      'faq.a3':
        '完全免费，没有 Pro 版本、没有内购，也没有需要解锁的功能——包括多窗口预览在内全部开放。项目靠赞助维持，赞助纯粹出于自愿。',
      'faq.q4': '预览为什么这么快？',
      'faq.a4':
        'Prelook 使用浏览器原生的 Speculation Rules API：你悬停链接的瞬间就开始预取（甚至预渲染）目标页，预览窗打开时加载的是已经到本地的内容。这一切由浏览器自己调度，扩展不搭建任何中转服务器。',
      'faq.q5': '会不会拖慢浏览器？',
      'faq.a5':
        '不会常驻开销。预热只在指针停留在链接上时触发，指针离开就取消；「性能」里还提供节电模式，可以在用电池时自动关掉预热与背景模糊。',

      'footer.about': 'Prelook 悬停即预览，不必再点开。',
      'footer.slogan': '悬停即预览，不必再点开。',
      'footer.links': '快速链接',
      'footer.contact': '联系我们',
      'footer.rights': '保留所有权利',
      'footer.top': '回到顶部',
    },

    en: {
      'nav.features': 'Features',
      'nav.speed': 'Speed',
      'nav.install': 'Install',
      'nav.reviews': 'Reviews',
      'nav.faq': 'FAQ',
      'nav.theme': 'Toggle color theme',
      'nav.lang': 'Switch language',

      'hero.title1': 'Hover to preview, ',
      'hero.title2': 'no wasted clicks',
      'hero.desc':
        'The instant your cursor lands on a link, its page is already loading — preview first, decide after.',
      'hero.videoAria':
        'Prelook in action: the pointer rests on a link and a preview window opens with that page',
      'hero.videoPlay': 'Play the demo',
      'hero.videoPause': 'Pause the demo',

      // Install entries: one set in the hero, one in the closing band, all equal
      'install.chrome': 'Install for Chrome',
      'install.edge': 'Install for Edge',
      'install.firefox': 'Install for Firefox',
      'install.manual': 'Manual install',

      'cta.badge': 'Three browsers, one codebase',
      'cta.title': 'Get it running today',
      'cta.sub': 'Install and go — no sign-up, no login.',

      'features.title': 'Immersive browsing, without the back-and-forth',
      'features.subtitle': 'Twelve features, all local — nothing is uploaded',

      'f.preview.tag': 'Core',
      'f.preview.t': 'Link preview',
      'f.preview.d': 'Hover any link to peek its content; you decide whether to open it.',
      'f.preview.g1': 'Peek on hover',
      'f.preview.g2': 'Decide after',
      'f.warm.t': 'Link warm-up',
      'f.warm.d': 'Hovered links are prefetched via Speculation Rules for instant previews.',
      'f.warm.g1': 'Speculation Rules',
      'f.warm.g2': 'Native prefetch',
      'f.reader.t': 'Reader mode',
      'f.reader.d': 'Sites that block embedding are shown as clean article views.',
      'f.reader.g1': 'Embed fallback',
      'f.reader.g2': 'Article extraction',
      'f.multi.t': 'Multi-window preview',
      'f.multi.d': 'Open up to 6 previews side by side for comparison reading.',
      'f.multi.g1': 'Up to 6 windows',
      'f.multi.g2': 'Side by side',
      'f.sidebar.t': 'Sidebar mode',
      'f.sidebar.d': 'Dock previews full height to either edge, stacked.',
      'f.sidebar.g1': 'Full-height dock',
      'f.sidebar.g2': 'Left or right',
      'f.search.t': 'Selection search',
      'f.search.d': 'Select text — Google / Bing / Baidu / DuckDuckGo in one click.',
      'f.search.g1': '4 engines',
      'f.search.g2': 'Search on select',
      'f.ai.t': 'AI search',
      'f.ai.d': 'DeepSeek / Doubao / Kimi / Perplexity, ask right away.',
      'f.ai.g1': '4 engines',
      'f.ai.g2': 'Ask on select',
      'f.track.t': 'Tracking cleanup',
      'f.track.d':
        'Strips utm, fbclid and friends, and unwraps redirect shells back to the real address.',
      'f.track.g1': 'Strips utm',
      'f.track.g2': 'Unwraps redirects',
      'f.safety.t': 'Link risk hints',
      'f.safety.d':
        'Flags look-alike domains, punycode hosts and link text that points somewhere else.',
      'f.safety.g1': 'Look-alike domains',
      'f.safety.g2': 'Text mismatch',
      'f.trigger.t': 'Four trigger modes',
      'f.trigger.d': 'Hover, Alt+hover, long-press or drag — pick what feels natural.',
      'f.trigger.g1': 'Alt combos',
      'f.trigger.g2': 'Long-press and drag',
      'f.theme.t': 'Themes and appearance',
      'f.theme.d': 'Light or dark, accent color, window palettes, position, size and backdrop blur.',
      'f.theme.g1': 'Light and dark',
      'f.theme.g2': 'Window palettes',
      'f.privacy.t': 'Privacy-first',
      'f.privacy.d': 'No account, no server — data never leaves your device.',
      'f.privacy.g1': 'No account',
      'f.privacy.g2': 'No server',

      'speed.title': 'Engineered for speed',
      'speed.subtitle': 'Three steps that compress waiting out of your perception',
      'speed.s1t': 'Warm on hover',
      'speed.s1d':
        'The instant you hover a link, the browser-native Speculation Rules API queues the target page — through no third-party server.',
      'speed.s2t': 'Instant preview',
      'speed.s2d':
        'The preview window hits a warm cache; embeddable sites render right away, blocked sites flow into reader mode.',
      'speed.s3t': 'Zero-wait click',
      'speed.s3d':
        'With prerendering on, the page is already painted in the background — clicking navigates instantly.',
      'speed.compare': 'Load time comparison',
      'speed.cold': 'Cold load',
      'speed.warm': 'After Prelook warm-up',
      'speed.note': 'Illustrative: a warmed preview window shows what is already on your machine.',

      // Placeholder reviews: replace every entry with a verifiable real review
      // before shipping. Never invent reviews or rewrite the original wording.
      'reviews.title': 'What our users say',
      'reviews.subtitle': 'Not just our word for it — here is what users say.',
      'reviews.r1.name': 'Sample user A',
      'reviews.r1.text': '(Placeholder) Replace this with the text of a real review.',
      'reviews.r2.name': 'Sample user B',
      'reviews.r2.text': '(Placeholder) Swap the name for the actual reviewer.',
      'reviews.r3.name': 'Sample user C',
      'reviews.r3.text': '(Placeholder) Copy the wording as-is from the source; do not polish it.',
      'reviews.r4.name': 'Sample user D',
      'reviews.r4.text': '(Placeholder) Uneven lengths are what makes the three columns stagger.',
      'reviews.r5.name': 'Sample user E',
      'reviews.r5.text': '(Placeholder) The small icon shows which browser the reviewer used.',
      'reviews.r6.name': 'Sample user F',
      'reviews.r6.text': '(Placeholder) Do not publish this section until real reviews exist.',

      'faq.title': 'FAQ',
      'faq.subtitle': 'Still curious? Start here.',
      'faq.q1': 'The preview window is blank — what now?',
      'faq.a1':
        'Some sites forbid embedding; Prelook switches to reader mode automatically. If both fail, the window offers an open-in-new-tab button.',
      'faq.q2': 'Is my data uploaded?',
      'faq.a2':
        'No. Previews and settings live entirely in your browser — no accounts, no servers.',
      'faq.q3': 'Does Prelook cost anything?',
      'faq.a3':
        'It is completely free: no Pro tier, no in-app purchases, no locked features — multi-window previews included. The project runs on sponsorships, which are purely optional.',
      'faq.q4': 'Why are the previews so fast?',
      'faq.a4':
        'Prelook uses the browser-native Speculation Rules API: the moment you hover a link, prefetching (or prerendering) begins, so the preview window shows content that has already arrived locally. The browser does all the scheduling — the extension runs no servers.',
      'faq.q5': 'Will it slow my browser down?',
      'faq.a5':
        'There is no constant overhead. Warm-up fires only while the pointer rests on a link and is cancelled when it leaves; a built-in power-saver mode can drop warm-up and backdrop blur automatically on battery.',

      'footer.about': 'Prelook is a free extension by 冷石Boy that puts previews right in the browser.',
      'footer.slogan': 'Peek first, click later.',
      'footer.links': 'Links',
      'footer.contact': 'Contact',
      'footer.rights': 'All rights reserved',
      'footer.top': 'Back to top',
    },
  };

  var TITLES = {
    'zh-CN': 'Prelook — 悬停链接即预览，不必再点开',
    en: 'Prelook — Preview any link without leaving the page',
  };

  var LANG_KEY = 'prelook-landing-lang';
  var THEME_KEY = 'prelook-landing-theme';
  var LANGS = ['zh-CN', 'en'];

  function readStore(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null; /* 隐私模式下存储不可用 */
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* 忽略 */
    }
  }

  /* ---------- 语言 ---------- */
  var savedLang = readStore(LANG_KEY);
  var current = savedLang && LANGS.indexOf(savedLang) >= 0 ? savedLang : 'zh-CN';

  var langBtn = document.getElementById('langToggle');

  function applyLang() {
    var dict = I18N[current];

    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var text = dict[el.getAttribute('data-i18n')];
      if (text !== undefined) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var label = dict[el.getAttribute('data-i18n-aria')];
      if (label !== undefined) el.setAttribute('aria-label', label);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var ph = dict[el.getAttribute('data-i18n-ph')];
      if (ph !== undefined) el.setAttribute('placeholder', ph);
    });

    if (langBtn) {
      langBtn.textContent = current === 'zh-CN' ? 'EN' : '中文';
      langBtn.setAttribute('lang', current === 'zh-CN' ? 'en' : 'zh-CN');
    }
    document.title = TITLES[current];
    writeStore(LANG_KEY, current);
    // 演示视频那个按钮的文案跟着播放状态走，切换语言时也要重算一遍
    syncDemoButton();
  }

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      current = current === 'zh-CN' ? 'en' : 'zh-CN';
      applyLang();
    });
  }
  applyLang();

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function chosenTheme() {
    var stored = readStore(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  function systemTheme() {
    return media && media.matches ? 'dark' : 'light';
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      writeStore(THEME_KEY, next);
    });
  }

  // 用户没手动选过就跟着系统走（首帧由 <head> 内联脚本负责）
  if (media) {
    var onSystemChange = function () {
      if (!chosenTheme()) root.setAttribute('data-theme', systemTheme());
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  /* ---------- 滚动高亮当前区块 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu .nav-link'));
  var spySections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  var SPY_OFFSET = 80; // 与 CSS 的 scroll-margin-top 保持一致

  function updateActiveNav() {
    if (!spySections.length) return;

    var scrollPos = window.scrollY + SPY_OFFSET + 1;
    var activeId = '';

    spySections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) activeId = section.id;
    });

    // 滚到底部时高亮最后一项：页脚较矮，否则永远点不亮。
    // 先确认页面真的能滚——加载途中文档还没被撑高时，"0 + 视口高 >= 文档高"
    // 会成立，于是最后一项（现在是「安装」）会在首屏被误点亮，且要等到下一次
    // 成功的滚动更新才纠正。
    var canScroll = document.documentElement.scrollHeight > window.innerHeight + 4;
    var isAtBottom =
      canScroll && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (isAtBottom) activeId = spySections[spySections.length - 1].id;

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + activeId;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  var spyTicking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (spyTicking) return;
      spyTicking = true;
      requestAnimationFrame(function () {
        updateActiveNav();
        sweepReveals();
        updateToTop();
        spyTicking = false;
      });
    },
    { passive: true },
  );
  window.addEventListener('resize', function () {
    updateActiveNav();
    sweepReveals();
  });
  updateActiveNav();

  /* ---------- 浮动回到顶部 ---------- */
  var toTopBtn = document.querySelector('.to-top');
  function updateToTop() {
    if (!toTopBtn) return;
    toTopBtn.classList.toggle('is-visible', window.scrollY > 400);
  }
  if (toTopBtn) {
    toTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    updateToTop();
  }

  /* ---------- 滚动入场 ---------- */
  var revealTargets = []
    .concat(Array.prototype.slice.call(document.querySelectorAll('.section-header')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.features-grid .feature-card')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.steps-grid .step-card')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.reviews-grid .review-card')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.faq-list details')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.compare')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.cta-copy, .cta-art')))
    .concat(Array.prototype.slice.call(document.querySelectorAll('.footer-content')));

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealObserver = null;
  var pendingReveals = [];

  function revealNow(el) {
    el.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(el);
  }

  // IntersectionObserver 是"采样"而不是"穿越检测"：快速滚动时某些区块可能
  // 整段跨过视口却一次都没被采样到，那样它会一直停在 opacity:0。
  // 每次滚动再用几何位置兜一遍底，凡是已经进入（或越过）视口的直接点亮。
  function sweepReveals() {
    if (!pendingReveals.length) return;
    var limit = window.innerHeight * 0.92;
    pendingReveals = pendingReveals.filter(function (el) {
      if (el.getBoundingClientRect().top >= limit) return true;
      revealNow(el);
      return false;
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    // 同组卡片按序号错峰出现（最多 350ms），避免整片一起闪
    [
      '.features-grid',
      '.steps-grid',
      '.reviews-grid',
    ].forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      Array.prototype.slice.call(group.children).forEach(function (child, index) {
        child.style.setProperty('--reveal-delay', Math.min(index, 5) * 70 + 'ms');
      });
    });

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
    });
    pendingReveals = revealTargets.slice();

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          var i = pendingReveals.indexOf(entry.target);
          if (i >= 0) pendingReveals.splice(i, 1);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
    sweepReveals();
  }

  /* ---------- hero 演示视频 ---------- */
  // 一段真实录屏。静音 + 循环才允许自动播放，而"减少动态效果"和浏览器的省电
  // 策略都可能让它播不起来——播不动就停在 poster 上，按钮回到"播放"图标，
  // 不要留一个不动的框让人以为是坏了。
  var demoVideo = document.getElementById('demoVideo');
  var demoToggle = document.getElementById('demoToggle');

  function syncDemoButton() {
    if (!demoVideo || !demoToggle) return;
    var paused = demoVideo.paused;
    var key = paused ? 'hero.videoPlay' : 'hero.videoPause';
    demoToggle.setAttribute('data-paused', paused ? 'true' : 'false');
    // 保持 data-i18n-aria 与当前状态一致，applyLang 才会补上对的文案
    demoToggle.setAttribute('data-i18n-aria', key);
    var label = I18N[current][key];
    if (label !== undefined) {
      demoToggle.setAttribute('aria-label', label);
      demoToggle.title = label;
    }
  }

  function playDemo() {
    var attempt = demoVideo.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        syncDemoButton();
      });
    }
  }

  if (demoVideo && demoToggle) {
    demoToggle.addEventListener('click', function () {
      if (demoVideo.paused) playDemo();
      else demoVideo.pause();
    });
    demoVideo.addEventListener('play', syncDemoButton);
    demoVideo.addEventListener('pause', syncDemoButton);
    if (!reduceMotion) playDemo();
    syncDemoButton();
  }

  /* ---------- 按钮涟漪 ---------- */
  if (!reduceMotion) {
    document.addEventListener('pointerdown', function (event) {
      var btn = event.target.closest ? event.target.closest('.btn') : null;
      if (!btn) return;

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () {
        ripple.remove();
      });
    });
  }
})();
