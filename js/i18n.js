(function () {
    const STORAGE_KEY = 'openfront-language';
    const CURRENT_SCRIPT = document.currentScript;
    const FALLBACK_LANGUAGES = {
        en: { htmlLang: 'en', label: 'EN', marketLabel: 'EN' }
    };
    let DATA = window.openFrontI18nData || null;
    let LANGUAGES = (DATA && DATA.languages) || FALLBACK_LANGUAGES;
    let SUPPORTED = Object.keys(LANGUAGES);

    function normalizePath(pathname) {
        return String(pathname || '')
            .replace(/\\/g, '/')
            .replace(/^\/+/, '')
            .replace(/\/+/g, '/');
    }

    function currentPath() {
        const path = normalizePath(window.location.pathname);
        return path || 'index.html';
    }

    function getLanguage() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('lang');
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
        return SUPPORTED.includes(query)
            ? query
            : SUPPORTED.includes(stored)
                ? stored
                : SUPPORTED.includes(browser)
                    ? browser
                    : 'en';
    }

    function persistLanguage(lang) {
        if (SUPPORTED.includes(lang)) {
            window.localStorage.setItem(STORAGE_KEY, lang);
        }
    }

    function getLocalizedUi(lang) {
        return (DATA.ui && DATA.ui[lang]) || (DATA.ui && DATA.ui.en) || {};
    }

    function getPageKey(path) {
        if (path === 'index.html' || path === '') return 'home';
        if (path === 'categories.html') return 'categories';
        if (path === 'contact.html') return 'contact';
        if (path === 'privacy-policy.html') return 'privacy';
        if (path === 'terms-of-service.html') return 'terms';
        if (path === 'cookie-policy.html') return 'cookie';
        return 'detail';
    }

    function getPageCopy(lang) {
        const pageKey = getPageKey(currentPath());
        const pages = DATA.pages || {};
        const scoped = pages[pageKey] || {};
        return scoped[lang] || scoped.en || {};
    }

    function getGameCopy(lang) {
        const games = DATA.games || {};
        const entry = games[currentPath()];
        if (!entry) return null;
        return entry[lang] || entry.en || null;
    }

    function format(template, values) {
        return String(template || '').replace(/\{(\w+)\}/g, function (_, key) {
            return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : '';
        });
    }

    function appendLangToUrl(url, lang) {
        try {
            const next = new URL(url, window.location.origin);
            if (next.origin !== window.location.origin) return url;
            if (lang === 'en') {
                next.searchParams.delete('lang');
            } else {
                next.searchParams.set('lang', lang);
            }
            const relative = next.pathname + next.search + next.hash;
            return relative;
        } catch (error) {
            return url;
        }
    }

    function updateHistory(lang) {
        const url = new URL(window.location.href);
        if (lang === 'en') {
            url.searchParams.delete('lang');
        } else {
            url.searchParams.set('lang', lang);
        }
        window.history.replaceState({}, '', url.toString());
    }

    function markSwitchState(lang) {
        document.querySelectorAll('.openfront-language-switch button').forEach((button) => {
            button.classList.toggle('active', button.dataset.lang === lang);
        });
    }

    function applyPlaceholder(uiCopy) {
        const input = document.querySelector('.search-bar input');
        if (input && uiCopy.searchPlaceholder) {
            input.placeholder = uiCopy.searchPlaceholder;
        }
    }

    function applyFooter(uiCopy, lang) {
        const footer = document.querySelector('.footer-copyright');
        if (footer && uiCopy.footerCopyright) {
            footer.textContent = uiCopy.footerCopyright;
        }

        const map = uiCopy.footerLinks || {};
        const linkMap = {
            'index.html': map.about,
            'contact.html': map.contact,
            'privacy-policy.html': map.privacy,
            'terms-of-service.html': map.terms,
            'cookie-policy.html': map.cookie
        };

        document.querySelectorAll('.footer .footer-links a').forEach((anchor) => {
            const href = normalizePath(anchor.getAttribute('href'));
            if (href.endsWith('contact.html') && /dmca/i.test(anchor.textContent || '')) {
                anchor.textContent = map.dmca || 'DMCA';
                anchor.href = appendLangToUrl(anchor.href, lang);
                return;
            }

            const key = Object.keys(linkMap).find((item) => href.endsWith(item));
            if (key && linkMap[key]) {
                anchor.textContent = linkMap[key];
            }
            anchor.href = appendLangToUrl(anchor.href, lang);
        });
    }

    function applyNav(uiCopy, lang) {
        const navMap = uiCopy.nav || {};
        document.querySelectorAll('.nav-categories a.nav-item').forEach((anchor) => {
            const href = anchor.getAttribute('href') || '';
            if (/category=action/i.test(href)) anchor.textContent = navMap.action || anchor.textContent;
            if (/category=battle-royale/i.test(href)) anchor.textContent = navMap['battle-royale'] || anchor.textContent;
            if (/category=fps/i.test(href)) anchor.textContent = navMap.fps || anchor.textContent;
            if (/category=multiplayer/i.test(href)) anchor.textContent = navMap.multiplayer || anchor.textContent;
            if (/category=sniper/i.test(href)) anchor.textContent = navMap.sniper || anchor.textContent;
            anchor.href = appendLangToUrl(anchor.href, lang);
        });

        document.querySelectorAll('a.logo, .logo').forEach((node) => {
            if (node.tagName === 'A' && node.getAttribute('href')) {
                node.href = appendLangToUrl(node.href, lang);
            }
        });
    }

    function applyCategoriesPage(lang, uiCopy, pageCopy) {
        const pageTitle = document.querySelector('.page-title');
        const pageSubtitle = document.querySelector('.page-subtitle');
        if (pageTitle && pageCopy.pageTitle) pageTitle.textContent = pageCopy.pageTitle;
        if (pageSubtitle && pageCopy.pageSubtitle) pageSubtitle.textContent = pageCopy.pageSubtitle;

        const map = uiCopy.categories || {};
        const cards = [
            ['count-all', 'all'],
            ['count-action', 'action'],
            ['count-battle-royale', 'battle-royale'],
            ['count-fps', 'fps'],
            ['count-multiplayer', 'multiplayer'],
            ['count-sniper', 'sniper']
        ];

        cards.forEach(function ([countId, key]) {
            const countNode = document.getElementById(countId);
            const card = countNode ? countNode.closest('.category-card') : null;
            const title = card ? card.querySelector('h3') : null;
            if (title && map[key]) {
                title.textContent = map[key];
            }
            if (countNode) {
                const match = String(countNode.textContent || '').match(/(\d+)/);
                const count = match ? match[1] : '0';
                countNode.textContent = format(uiCopy.countTemplate || '{count} games', { count });
            }
        });

        const sectionTitle = document.getElementById('games-section-title');
        if (sectionTitle) {
            const params = new URLSearchParams(window.location.search);
            const category = params.get('category') || 'all';
            sectionTitle.textContent = map[category] || map.all || sectionTitle.textContent;
        }

        document.querySelectorAll('.games-list .game-item').forEach((item) => {
            const categoryNode = item.querySelector('.game-item-category');
            if (!categoryNode) return;
            const text = categoryNode.textContent.trim().toLowerCase();
            const normalizedKey = text === 'battle royale' ? 'battle-royale' : text;
            categoryNode.textContent = map[normalizedKey] || categoryNode.textContent;
        });

    }

    function applyHomePage(lang, uiCopy, pageCopy) {
        if (pageCopy.relatedTitle) {
            const title = document.querySelector('.related-games .section-title');
            if (title) title.textContent = pageCopy.relatedTitle;
        }

        const infoHeader = document.querySelector('.game-info .info-header');
        if (infoHeader && pageCopy.intro) {
            infoHeader.textContent = pageCopy.intro;
        }

        const content = document.querySelector('.game-info .info-content');
        if (!content || !Array.isArray(pageCopy.sections)) return;

        const parts = [];
        pageCopy.sections.forEach((section, index) => {
            const headingTag = index === 0 ? 'h2' : 'h3';
            parts.push(`<${headingTag}>${section.heading}</${headingTag}>`);
            (section.paragraphs || []).forEach((paragraph) => {
                parts.push(`<p>${paragraph}</p>`);
            });
            if (Array.isArray(section.items) && section.items.length > 0) {
                parts.push('<ul>');
                section.items.forEach((item) => {
                    parts.push(`<li><strong>${item.label}:</strong> ${item.text}</li>`);
                });
                parts.push('</ul>');
            }
        });
        content.innerHTML = parts.join('');

        const tags = document.querySelector('.game-info .tags');
        if (tags && Array.isArray(pageCopy.tags)) {
            const icons = ['globe', 'chess', 'flag', 'users', 'shield-alt', 'ship', 'bomb', 'rocket'];
            tags.innerHTML = pageCopy.tags.map(function (tag, index) {
                const icon = icons[index] || 'tag';
                return `<span class="tag"><i class="fas fa-${icon}"></i>${tag}</span>`;
            }).join('');
        }

    }

    function applyDetailPage(lang, uiCopy) {
        const pageCopy = getPageCopy(lang);
        const gameCopy = getGameCopy(lang);
        if (!gameCopy) return;

        const currentTitle = document.getElementById('current-game-title');
        if (currentTitle) currentTitle.textContent = gameCopy.name;

        const icon = document.getElementById('game-icon');
        if (icon) icon.alt = gameCopy.name;

        const relatedTitle = document.querySelector('.related-games .section-title');
        if (relatedTitle && uiCopy.detail && uiCopy.detail.relatedTitle) {
            relatedTitle.textContent = uiCopy.detail.relatedTitle;
        }

        const infoHeader = document.querySelector('.game-info .info-header');
        if (infoHeader && uiCopy.detail && uiCopy.detail.headerTemplate) {
            infoHeader.textContent = format(uiCopy.detail.headerTemplate, { name: gameCopy.name });
        }

        const infoContent = document.querySelector('.game-info .info-content');
        if (infoContent) {
            const aboutHeading = uiCopy.detail && uiCopy.detail.aboutTemplate
                ? format(uiCopy.detail.aboutTemplate, { name: gameCopy.name })
                : `About ${gameCopy.name}`;
            infoContent.innerHTML = `<h2>${aboutHeading}</h2><p>${gameCopy.description}</p>`;
        }

        const tagsContainer = document.querySelector('.game-info .tags');
        if (tagsContainer && uiCopy.detail) {
            const categoryLabel = gameCopy.gameType || '';
            const tagCategoryMode = format(uiCopy.detail.tagCategoryModeTemplate || '{category} mode', {
                category: categoryLabel
            });
            const tags = [
                { icon: 'tag', text: uiCopy.detail.tagBrand || 'open front' },
                { icon: 'gamepad', text: categoryLabel },
                { icon: 'bolt', text: uiCopy.browserGame || 'Browser game' },
                { icon: 'crosshairs', text: tagCategoryMode }
            ];
            tagsContainer.innerHTML = tags.map(function (tag) {
                return `<span class="tag"><i class="fas fa-${tag.icon}"></i> ${tag.text}</span>`;
            }).join('');
        }

        document.querySelectorAll('.games-grid .game-card').forEach((card) => {
            const href = card.dataset.targetHref;
            if (!href) return;
            card.onclick = function () {
                window.location.href = appendLangToUrl(href, lang);
            };
        });

        if (uiCopy.detail && uiCopy.detail.titleTemplate) {
            document.title = format(uiCopy.detail.titleTemplate, { name: gameCopy.name });
        }

        const metaDescription = uiCopy.detail && uiCopy.detail.metaDescriptionTemplate
            ? format(uiCopy.detail.metaDescriptionTemplate, { description: gameCopy.description })
            : gameCopy.description;

        setMeta('description', metaDescription);
        setMeta('keywords', [gameCopy.name, gameCopy.gameType, 'open front', 'browser game'].filter(Boolean).join(', '));
        setMetaProperty('og:title', document.title);
        setMetaProperty('og:description', metaDescription);
        setMetaProperty('twitter:title', document.title);
        setMetaProperty('twitter:description', format((uiCopy.detail && uiCopy.detail.twitterDescriptionTemplate) || '{description}', {
            description: gameCopy.description
        }));

        const currentIcon = document.getElementById('game-icon');
        if (currentIcon) {
            currentIcon.alt = gameCopy.name;
        }
    }

    function renderSimpleSections(container, sections) {
        if (!container || !Array.isArray(sections)) return;
        const html = [];
        sections.forEach((section) => {
            html.push(`<div class="${container.firstElementChild ? container.firstElementChild.className : ''}">`);
            html.push(`<h2>${section.heading}</h2>`);
            (section.paragraphs || []).forEach((paragraph) => {
                html.push(`<p>${paragraph}</p>`);
            });
            if (Array.isArray(section.items) && section.items.length > 0) {
                html.push('<ul>');
                section.items.forEach((item) => {
                    html.push(`<li><strong>${item.label}:</strong> ${item.text}</li>`);
                });
                html.push('</ul>');
            }
            if (section.table) {
                html.push('<table class="cookie-table"><thead><tr>');
                section.table.headers.forEach((header) => {
                    html.push(`<th>${header}</th>`);
                });
                html.push('</tr></thead><tbody>');
                section.table.rows.forEach((row) => {
                    html.push('<tr>');
                    row.forEach((cell) => html.push(`<td>${cell}</td>`));
                    html.push('</tr>');
                });
                html.push('</tbody></table>');
            }
            html.push('</div>');
        });
        container.innerHTML = html.join('');
    }

    function applyContactPage(lang, uiCopy, pageCopy) {
        const title = document.querySelector('.contact-header h1');
        const intro = document.querySelector('.contact-header p');
        if (title && pageCopy.title) title.textContent = pageCopy.title;
        if (intro && pageCopy.intro) intro.textContent = pageCopy.intro;

        const sections = document.querySelectorAll('.contact-section');
        if (!sections.length) return;

        const first = sections[0];
        const h2 = first.querySelector('h2');
        const lead = first.querySelector('p');
        if (h2 && pageCopy.sectionTitle) h2.textContent = pageCopy.sectionTitle;
        if (lead && pageCopy.intro) lead.textContent = pageCopy.intro;

        const cards = first.querySelectorAll('.contact-item');
        (pageCopy.methods || []).forEach((method, index) => {
            const card = cards[index];
            if (!card) return;
            const titleNode = card.querySelector('h3');
            const descriptionNode = card.querySelector('p');
            const linkNode = card.querySelector('a');
            const iconNode = card.querySelector('i');
            if (iconNode) iconNode.className = method.icon;
            if (titleNode) titleNode.textContent = method.title;
            if (descriptionNode) descriptionNode.textContent = method.description;
            if (linkNode) {
                linkNode.textContent = method.linkText;
                linkNode.href = method.href;
            }
        });

        const response = first.querySelector('.response-time');
        if (response && pageCopy.responseTime) {
            response.innerHTML = `<strong>${uiCopy.footerLinks && uiCopy.footerLinks.contact ? uiCopy.footerLinks.contact : 'Contact Us'}:</strong> ${pageCopy.responseTime}`;
        }

        const faqSection = sections[1];
        if (faqSection) {
            faqSection.querySelector('h2').textContent = pageCopy.faqTitle || faqSection.querySelector('h2').textContent;
            const block = faqSection.querySelector('div');
            if (block) {
                const html = [];
                (pageCopy.faqs || []).forEach((faq) => {
                    html.push(`<h3 style="color: #e94560; margin-top: 20px;">${faq.question}</h3>`);
                    html.push(`<p>${faq.answer}</p>`);
                });
                block.innerHTML = html.join('');
            }
        }

        const hoursSection = sections[2];
        if (hoursSection) {
            hoursSection.querySelector('h2').textContent = pageCopy.hoursTitle || hoursSection.querySelector('h2').textContent;
            const block = hoursSection.querySelector('div');
            if (block) {
                block.innerHTML = (pageCopy.hours || []).map(function (line) {
                    return `<p>${line}</p>`;
                }).join('');
            }
        }

        const linksSection = sections[3];
        if (linksSection) {
            linksSection.querySelector('h2').textContent = pageCopy.linksTitle || linksSection.querySelector('h2').textContent;
            const block = linksSection.querySelector('div');
            if (block) {
                block.innerHTML = `
                    <p>${pageCopy.linksIntro || ''}</p>
                    <ul style="padding-left: 20px; margin-top: 10px;">
                        <li><a href="${appendLangToUrl('privacy-policy.html', lang)}" style="color: #ff6b35;">${(uiCopy.footerLinks && uiCopy.footerLinks.privacy) || 'Privacy Policy'}</a></li>
                        <li><a href="${appendLangToUrl('terms-of-service.html', lang)}" style="color: #ff6b35;">${(uiCopy.footerLinks && uiCopy.footerLinks.terms) || 'Terms of Service'}</a></li>
                        <li><a href="${appendLangToUrl('cookie-policy.html', lang)}" style="color: #ff6b35;">${(uiCopy.footerLinks && uiCopy.footerLinks.cookie) || 'Cookie Policy'}</a></li>
                    </ul>
                `;
            }
        }

        const back = document.querySelector('.back-link');
        if (back) {
            back.textContent = uiCopy.backToHome || back.textContent;
            back.href = appendLangToUrl(back.href, lang);
        }
    }

    function applyPolicyPage(lang, uiCopy, pageCopy, containerSelector, sectionClass) {
        const title = document.querySelector(`${containerSelector} h1`);
        if (title && pageCopy.title) title.textContent = pageCopy.title;

        const intro = document.querySelector(`${containerSelector} p`);
        if (intro && pageCopy.updatedOn) {
            intro.textContent = format(uiCopy.lastUpdatedTemplate || 'Last updated: {date}', { date: pageCopy.updatedOn });
        }

        const container = document.querySelector(containerSelector);
        if (!container) return;

        const oldSections = Array.from(container.querySelectorAll(`.${sectionClass}`));
        oldSections.forEach((section, index) => {
            if (index > 0) {
                section.remove();
            }
        });

        const sectionHost = document.createElement('div');
        sectionHost.innerHTML = '';
        (pageCopy.sections || []).forEach((section) => {
            const element = document.createElement('div');
            element.className = sectionClass;
            const html = [`<h2>${section.heading}</h2>`];
            (section.paragraphs || []).forEach((paragraph) => html.push(`<p>${paragraph}</p>`));
            if (Array.isArray(section.items) && section.items.length > 0) {
                html.push('<ul>');
                section.items.forEach((item) => {
                    html.push(`<li><strong>${item.label}:</strong> ${item.text}</li>`);
                });
                html.push('</ul>');
            }
            if (section.table) {
                html.push('<table class="cookie-table"><thead><tr>');
                section.table.headers.forEach((header) => html.push(`<th>${header}</th>`));
                html.push('</tr></thead><tbody>');
                section.table.rows.forEach((row) => {
                    html.push('<tr>');
                    row.forEach((cell) => html.push(`<td>${cell}</td>`));
                    html.push('</tr>');
                });
                html.push('</tbody></table>');
            }
            element.innerHTML = html.join('');
            sectionHost.appendChild(element);
        });

        const headerNode = container.querySelector(`.${sectionClass}`);
        if (headerNode) headerNode.remove();
        container.appendChild(sectionHost);

        const back = document.querySelector('.back-link');
        if (back) {
            back.textContent = uiCopy.backToHome || back.textContent;
            back.href = appendLangToUrl(back.href, lang);
        }
    }

    function setMeta(name, value) {
        if (!value) return;
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', value);
    }

    function setMetaProperty(property, value) {
        if (!value) return;
        let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', value);
    }

    function applyPageMeta(lang, uiCopy, pageCopy) {
        const pageKey = getPageKey(currentPath());
        if (pageKey === 'detail') {
            applyDetailPage(lang, uiCopy);
            return;
        }

        if (pageCopy.metaTitle) {
            document.title = pageCopy.metaTitle;
            setMetaProperty('og:title', pageCopy.metaTitle);
            setMetaProperty('twitter:title', pageCopy.metaTitle);
        }
        if (pageCopy.metaDescription) {
            setMeta('description', pageCopy.metaDescription);
            setMetaProperty('og:description', pageCopy.metaDescription);
            setMetaProperty('twitter:description', pageCopy.metaDescription);
        }
        if (pageCopy.metaKeywords) {
            setMeta('keywords', pageCopy.metaKeywords);
        }
    }

    function localizeStaticPage(lang, uiCopy, pageCopy) {
        const pageKey = getPageKey(currentPath());

        if (pageKey === 'home') {
            applyHomePage(lang, uiCopy, pageCopy);
            return;
        }
        if (pageKey === 'categories') {
            applyCategoriesPage(lang, uiCopy, pageCopy);
            return;
        }
        if (pageKey === 'contact') {
            applyContactPage(lang, uiCopy, pageCopy);
            return;
        }
        if (pageKey === 'privacy') {
            applyPolicyPage(lang, uiCopy, pageCopy, '.privacy-container', 'privacy-section');
            return;
        }
        if (pageKey === 'terms') {
            applyPolicyPage(lang, uiCopy, pageCopy, '.terms-container', 'terms-section');
            return;
        }
        if (pageKey === 'cookie') {
            applyPolicyPage(lang, uiCopy, pageCopy, '.cookie-container', 'cookie-section');
        }
    }

    function localizeAllLinks(lang) {
        document.querySelectorAll('a[href]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
            anchor.href = appendLangToUrl(anchor.href, lang);
        });
    }

    function annotateDynamicCards() {
        document.querySelectorAll('.game-card, .game-item').forEach((card) => {
            if (card.dataset.i18nBound === '1') return;
            const clickHandler = card.onclick;
            const directAnchor = card.querySelector('a[href]');
            if (directAnchor) {
                card.dataset.targetHref = directAnchor.getAttribute('href');
            } else if (clickHandler && typeof clickHandler === 'function') {
                // keep existing handler
            }
            card.dataset.i18nBound = '1';
        });
    }

    function rewriteDynamicGameLinks(lang) {
        document.querySelectorAll('.games-grid .game-card, .games-list .game-item').forEach((card) => {
            if (card.dataset.targetHref) return;
            const click = String(card.getAttribute('onclick') || '');
            const match = click.match(/location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (match) {
                card.dataset.targetHref = match[1];
            }
        });

        document.querySelectorAll('.games-grid .game-card, .games-list .game-item').forEach((card) => {
            const targetHref = card.dataset.targetHref;
            if (!targetHref) return;
            card.onclick = function () {
                window.location.href = appendLangToUrl(targetHref, lang);
            };
        });
    }

    function applyLanguage(lang) {
        const uiCopy = getLocalizedUi(lang);
        const pageCopy = getPageCopy(lang);

        document.documentElement.lang = (LANGUAGES[lang] && LANGUAGES[lang].htmlLang) || lang;
        persistLanguage(lang);
        updateHistory(lang);

        applyPlaceholder(uiCopy);
        applyNav(uiCopy, lang);
        applyFooter(uiCopy, lang);
        applyPageMeta(lang, uiCopy, pageCopy);
        localizeStaticPage(lang, uiCopy, pageCopy);
        localizeAllLinks(lang);
        annotateDynamicCards();
        rewriteDynamicGameLinks(lang);
        markSwitchState(lang);
    }

    function setLanguage(lang) {
        if (!SUPPORTED.includes(lang)) return;
        applyLanguage(lang);
    }

    function createSwitcher() {
        if (document.querySelector('.openfront-language-switch')) return;

        if (!document.getElementById('openfront-i18n-style')) {
            const style = document.createElement('style');
            style.id = 'openfront-i18n-style';
            style.textContent = `
                .openfront-language-switch {
                    position: fixed;
                    top: 14px;
                    right: 14px;
                    z-index: 9999;
                    display: flex;
                    gap: 6px;
                    padding: 6px;
                    border-radius: 999px;
                    background: rgba(5, 10, 20, 0.72);
                    backdrop-filter: blur(16px);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
                }
                .openfront-language-switch button {
                    border: 1px solid rgba(255, 107, 53, 0.22);
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(255, 255, 255, 0.76);
                    border-radius: 999px;
                    padding: 6px 10px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .openfront-language-switch button:hover {
                    color: #fff;
                    border-color: rgba(255, 107, 53, 0.48);
                    background: rgba(255, 107, 53, 0.18);
                }
                .openfront-language-switch button.active {
                    color: #0f172a;
                    background: #ffb38f;
                    border-color: #ffb38f;
                }
                @media (max-width: 768px) {
                    .openfront-language-switch {
                        top: 10px;
                        right: 10px;
                        gap: 4px;
                        padding: 4px;
                    }
                    .openfront-language-switch button {
                        padding: 5px 8px;
                        font-size: 11px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const switcher = document.createElement('div');
        switcher.className = 'openfront-language-switch';
        switcher.innerHTML = SUPPORTED.map(function (code) {
            const label = (LANGUAGES[code] && LANGUAGES[code].marketLabel) || code.toUpperCase();
            return `<button type="button" data-lang="${code}">${label}</button>`;
        }).join('');

        switcher.addEventListener('click', function (event) {
            const button = event.target.closest('button[data-lang]');
            if (!button) return;
            setLanguage(button.dataset.lang);
        });

        document.body.appendChild(switcher);
    }

    function resolveDataScriptUrl() {
        if (!CURRENT_SCRIPT || !CURRENT_SCRIPT.src) {
            return null;
        }
        try {
            const url = new URL(CURRENT_SCRIPT.src, window.location.href);
            url.pathname = url.pathname.replace(/i18n\.js$/i, 'i18n-data.js');
            return url.toString();
        } catch (error) {
            return null;
        }
    }

    function loadDataScript() {
        if (window.openFrontI18nData) {
            DATA = window.openFrontI18nData;
            LANGUAGES = DATA.languages || FALLBACK_LANGUAGES;
            SUPPORTED = Object.keys(LANGUAGES);
            return Promise.resolve();
        }

        const existing = document.querySelector('script[data-openfront-i18n-data="1"]');
        if (existing) {
            return new Promise(function (resolve, reject) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
            }).then(function () {
                DATA = window.openFrontI18nData || {};
                LANGUAGES = DATA.languages || FALLBACK_LANGUAGES;
                SUPPORTED = Object.keys(LANGUAGES);
            });
        }

        const scriptUrl = resolveDataScriptUrl();
        if (!scriptUrl) {
            DATA = window.openFrontI18nData || {};
            LANGUAGES = DATA.languages || FALLBACK_LANGUAGES;
            SUPPORTED = Object.keys(LANGUAGES);
            return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.async = false;
            script.dataset.openfrontI18nData = '1';
            script.onload = function () {
                DATA = window.openFrontI18nData || {};
                LANGUAGES = DATA.languages || FALLBACK_LANGUAGES;
                SUPPORTED = Object.keys(LANGUAGES);
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function boot() {
        createSwitcher();
        const lang = getLanguage();
        applyLanguage(lang);
        window.setTimeout(function () {
            applyLanguage(getLanguage());
        }, 250);
        window.setTimeout(function () {
            applyLanguage(getLanguage());
        }, 1000);
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadDataScript()
            .catch(function (error) {
                console.error('Failed to load open front i18n data', error);
                DATA = {};
                LANGUAGES = FALLBACK_LANGUAGES;
                SUPPORTED = Object.keys(LANGUAGES);
            })
            .finally(boot);
    });
    window.openFrontI18n = {
        getLanguage,
        setLanguage,
        applyLanguage,
        appendLangToUrl
    };
})();
