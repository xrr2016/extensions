/* TabPeek landing — i18n, scroll reveal, nav highlight */
(function () {
  'use strict';

  var I18N = {
    'zh-CN': {
      'nav.speed': '极速预览',
      'nav.features': '功能',
      'nav.sponsor': '赞助支持',
      'nav.faq': 'FAQ',
      'hero.chip': '极速预览 · 悬停即开',
      'hero.title': '极速预览，告别标签海',
      'hero.subtitle': '链接预热秒开 · 阅读模式 · 划词搜索',
      'hero.desc': '鼠标停在链接上的瞬间，目标页已经开始加载。',
      'hero.try': '试一试',
      'dl.chrome': '添加至 Chrome',
      'dl.edge': 'Edge 扩展',
      'dl.firefox': 'Firefox 附加组件',
      'dl.manual': '手动安装',
      'features.title': '沉浸式浏览，告别标签海',
      'features.subtitle': '九项能力，全部本地运行，不上传任何数据',
      'f.preview.t': '链接预览',
      'f.preview.d': '悬停链接即浮出内容预览，是否打开由你决定。',
      'f.reader.t': '阅读模式',
      'f.reader.d': '无法内嵌的网站自动切换为无干扰阅读视图。',
      'f.multi.t': '多窗口预览',
      'f.multi.d': '最多同时打开 6 个预览窗，左右对比阅读。',
      'f.sidebar.t': '侧边栏模式',
      'f.sidebar.d': '预览窗通高贴边，侧栏堆叠不遮挡正文。',
      'f.warm.t': '链接预热',
      'f.warm.d': '悬停瞬间即开始预取目标页，预览与打开更快。',
      'f.warm.tag': '极速核心',
      'speed.title': '极速预览，快在每一环',
      'speed.subtitle': '从悬停到呈现，三步把等待压缩到感知之外',
      'speed.s1t': '悬停即预热',
      'speed.s1d': '鼠标停在链接上的刹那，浏览器原生 Speculation Rules 已把目标页加入下载队列——不经过任何第三方服务器。',
      'speed.s2t': '预览窗秒开',
      'speed.s2d': '预览窗出现时直接命中缓存；可内嵌的站点一步到位，禁止内嵌的站点无缝转入阅读模式。',
      'speed.s3t': '点击零等待',
      'speed.s3d': '开启预渲染后，页面在后台提前完成渲染，真正点击时跳转即呈现。',
      'speed.cold': '冷启动加载',
      'speed.warm': 'TabPeek 预热后',
      'f.search.t': '划词搜索',
      'f.search.d': '选中文字，一键 Google / Bing / 百度 / DuckDuckGo。',
      'f.ai.t': 'AI 搜索',
      'f.ai.d': 'Copilot / Gemini / 豆包 / Kimi，选完即问。',
      'f.theme.t': '主题定制',
      'f.theme.d': '主题色、尺寸、位置、背景模糊随心调。',
      'f.privacy.t': '隐私本地化',
      'f.privacy.d': '无账号、无服务器，数据不出本机。',
      'sponsor.title': '完全免费，欢迎赞助',
      'sponsor.subtitle': '无账号、无服务器、无付费版本——所有功能免费开放。如果它帮到了你，欢迎赞助支持后续开发。',
      'sponsor.afdian.t': '爱发电',
      'sponsor.afdian.d': '国内访问，微信 / 支付宝均可',
      'sponsor.patreon.t': 'Patreon',
      'sponsor.patreon.d': '海外访问，按月或一次性支持',
      'sponsor.note': '赞助完全自愿，不影响任何功能的可用性。',
      'faq.title': '常见问题',
      'faq.q1': '预览窗口是空白的怎么办？',
      'faq.a1': '部分网站禁止被内嵌，TabPeek 会自动切换为阅读模式；若两者都失败，窗口会提供「在新标签页打开」按钮。',
      'faq.q2': '我的数据会被上传吗？',
      'faq.a2': '不会。所有预览与设置都发生在本机浏览器内，TabPeek 没有账号体系，也不设任何服务器。',
      'faq.q3': 'TabPeek 收费吗？',
      'faq.a3': '完全免费，没有 Pro 版本、没有内购，也没有需要解锁的功能——包括多窗口预览在内全部开放。项目靠赞助维持，赞助纯粹出于自愿。',
      'faq.q4': '预览为什么这么快？',
      'faq.a4': 'TabPeek 使用浏览器原生的 Speculation Rules API：你悬停链接的瞬间就开始预取（甚至预渲染）目标页，预览窗打开时加载的是已经到本地的内容。这一切由浏览器自己调度，扩展不搭建任何中转服务器。',
      'footer.slogan': '一点即预览，告别标签海。',
      'footer.links': '快速链接',
      'footer.contact': '联系我们',
      'footer.sponsor': '赞助',
      'footer.legal': '条款',
      'footer.privacy': '隐私政策',
      'footer.terms': '服务条款',
      'footer.rights': '保留所有权利',
    },
    en: {
      'nav.speed': 'Speed',
      'nav.features': 'Features',
      'nav.sponsor': 'Support',
      'nav.faq': 'FAQ',
      'hero.chip': 'Instant preview · on hover',
      'hero.title': 'Blazing-fast previews. Goodbye tab clutter',
      'hero.subtitle': 'Pre-warmed instant previews · Reader mode · Selection search',
      'hero.desc': 'The moment your cursor lands on a link, its page is already loading.',
      'hero.try': 'Try it ↓',
      'dl.chrome': 'Add to Chrome',
      'dl.edge': 'Edge Add-on',
      'dl.firefox': 'Firefox Add-on',
      'dl.manual': 'Manual install',
      'features.title': 'Immersive browsing, goodbye tab clutter',
      'features.subtitle': 'Nine features, all local — nothing is uploaded',
      'f.preview.t': 'Link preview',
      'f.preview.d': 'Hover any link to peek its content; you decide whether to open it.',
      'f.reader.t': 'Reader mode',
      'f.reader.d': 'Sites that block embedding are shown as clean article views.',
      'f.multi.t': 'Multi-window preview',
      'f.multi.d': 'Open up to 6 previews side by side for comparison reading.',
      'f.sidebar.t': 'Sidebar mode',
      'f.sidebar.d': 'Dock previews full-height to either edge, stacked.',
      'f.warm.t': 'Link warm-up',
      'f.warm.d': 'Hovered links are prefetched via Speculation Rules for instant previews.',
      'f.warm.tag': 'Speed core',
      'speed.title': 'Engineered for speed',
      'speed.subtitle': 'Three steps that compress waiting out of your perception',
      'speed.s1t': 'Warm on hover',
      'speed.s1d': 'The instant you hover a link, the browser-native Speculation Rules API queues the target page — through no third-party server.',
      'speed.s2t': 'Instant preview',
      'speed.s2d': 'The preview window hits a warm cache; embeddable sites render right away, blocked sites flow into reader mode.',
      'speed.s3t': 'Zero-wait click',
      'speed.s3d': 'With prerendering on, the page is already painted in the background — clicking navigates instantly.',
      'speed.cold': 'Cold load',
      'speed.warm': 'After TabPeek warm-up',
      'f.search.t': 'Selection search',
      'f.search.d': 'Select text — Google / Bing / Baidu / DuckDuckGo in one click.',
      'f.ai.t': 'AI search',
      'f.ai.d': 'Copilot / Gemini / Doubao / Kimi, ask right away.',
      'f.theme.t': 'Customization',
      'f.theme.d': 'Theme color, size, position and backdrop blur.',
      'f.privacy.t': 'Privacy-first',
      'f.privacy.d': 'No account, no server — data never leaves your device.',
      'sponsor.title': 'Free forever — sponsorship welcome',
      'sponsor.subtitle': 'No account, no server, no paid tier: every feature is open. If TabPeek helps you, a sponsorship keeps development going.',
      'sponsor.afdian.t': 'Afdian',
      'sponsor.afdian.d': 'For China — WeChat or Alipay',
      'sponsor.patreon.t': 'Patreon',
      'sponsor.patreon.d': 'For everywhere else — monthly or one-off',
      'sponsor.note': 'Sponsoring is entirely optional and unlocks nothing extra.',
      'faq.title': 'FAQ',
      'faq.q1': 'The preview window is blank — what now?',
      'faq.a1': 'Some sites forbid embedding; TabPeek switches to reader mode automatically. If both fail, the window offers an "open in new tab" button.',
      'faq.q2': 'Is my data uploaded?',
      'faq.a2': 'No. Previews and settings live entirely in your browser — no accounts, no servers.',
      'faq.q3': 'Does TabPeek cost anything?',
      'faq.a3': 'It is completely free: no Pro tier, no in-app purchases, no locked features — multi-window previews included. The project runs on sponsorships, which are purely optional.',
      'faq.q4': 'Why are the previews so fast?',
      'faq.a4': 'TabPeek uses the browser-native Speculation Rules API: the moment you hover a link, prefetching (or prerendering) begins, so the preview window shows content that has already arrived locally. The browser does all the scheduling — the extension runs no servers.',
      'footer.slogan': 'Peek first, tab less.',
      'footer.links': 'Links',
      'footer.contact': 'Contact',
      'footer.sponsor': 'Sponsor',
      'footer.legal': 'Legal',
      'footer.privacy': 'Privacy policy',
      'footer.terms': 'Terms of service',
      'footer.rights': 'All rights reserved',
    },
  };

  var LANGS = ['zh-CN', 'en'];
  var saved = null;
  try {
    saved = localStorage.getItem('tabpeek-landing-lang');
  } catch (e) {
    /* private mode */
  }
  var current = saved && LANGS.indexOf(saved) >= 0 ? saved : 'zh-CN';

  function applyLang() {
    var dict = I18N[current];
    document.documentElement.lang = current === 'zh-CN' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });
    var btn = document.getElementById('langBtn');
    if (btn) btn.textContent = current === 'zh-CN' ? 'EN' : '中文';
    document.title =
      current === 'zh-CN'
        ? 'TabPeek — 极速悬停预览，告别标签海'
        : 'TabPeek — Blazing-fast hover previews, goodbye tab clutter';
    try {
      localStorage.setItem('tabpeek-landing-lang', current);
    } catch (e) {
      /* ignore */
    }
  }

  document.getElementById('langBtn').addEventListener('click', function () {
    current = current === 'zh-CN' ? 'en' : 'zh-CN';
    applyLang();
  });
  applyLang();

  // scroll reveal
  var revealTargets = document.querySelectorAll('.card, .sponsor-card, .faq details, .hero-mock, .step, .compare');
  revealTargets.forEach(function (el) {
    el.classList.add('reveal');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealTargets.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('in');
    });
  }

  // nav highlight
  var links = document.querySelectorAll('.nav-links a');
  var sections = ['speed', 'features', 'sponsor', 'faq'].map(function (id) {
    return document.getElementById(id);
  });
  window.addEventListener('scroll', function () {
    var pos = window.scrollY + 90;
    var active = -1;
    sections.forEach(function (sec, i) {
      if (sec && sec.offsetTop <= pos) active = i;
    });
    links.forEach(function (a, i) {
      a.classList.toggle('active', i === active);
    });
  });
})();
