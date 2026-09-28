(function () {
    const allowedTags = new Set([
        'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'H1', 'H2', 'H3', 'H4',
        'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'TABLE',
        'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'UL'
    ]);
    const allowedAttributes = new Set(['alt', 'class', 'href', 'rel', 'src', 'target', 'title']);

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[character]));
    }

    function isSafeUrl(value, image = false) {
        try {
            const url = new URL(value, window.location.href);
            if (url.protocol === 'https:' || url.protocol === 'http:') return true;
            return image && url.protocol === 'data:' && /^data:image\/(gif|jpe?g|png|webp);base64,/i.test(value);
        } catch (_) {
            return false;
        }
    }

    function sanitizeHtml(html) {
        const documentFragment = new DOMParser().parseFromString(String(html), 'text/html');
        const walker = documentFragment.createTreeWalker(documentFragment.body, NodeFilter.SHOW_ELEMENT);
        const elements = [];
        while (walker.nextNode()) elements.push(walker.currentNode);

        for (const element of elements) {
            if (!allowedTags.has(element.tagName)) {
                element.replaceWith(...element.childNodes);
                continue;
            }
            for (const attribute of [...element.attributes]) {
                if (!allowedAttributes.has(attribute.name.toLowerCase())) {
                    element.removeAttribute(attribute.name);
                    continue;
                }
                const name = attribute.name.toLowerCase();
                const value = attribute.value;
                if ((name === 'href' && !isSafeUrl(value)) || (name === 'src' && !isSafeUrl(value, true))) {
                    element.removeAttribute(attribute.name);
                }
            }
            if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noopener noreferrer');
            }
        }
        return documentFragment.body.innerHTML;
    }

    window.BlogSecurity = Object.freeze({ escapeHtml, sanitizeHtml });
})();
