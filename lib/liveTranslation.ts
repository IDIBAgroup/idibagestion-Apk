import { translate, type PlatformLanguage } from '@/lib/i18n';
import { useBrandingStore } from '@/stores/brandingStore';

type LocalizedText = Text & { __idibaSourceText?: string; __idibaLastTranslation?: string };
type LocalizedAttribute = { source: string; translated: string };

const textAttributes = ['placeholder', 'title', 'aria-label', 'alt'] as const;

function isExcluded(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest('script, style, noscript, textarea, [contenteditable="true"], [data-no-translate]')) return true;
  return false;
}

function localizeText(node: Text, language: PlatformLanguage) {
  if (isExcluded(node)) return;
  const localized = node as LocalizedText;
  const current = node.nodeValue ?? '';
  if (!current.trim()) return;

  if (localized.__idibaSourceText === undefined || (localized.__idibaLastTranslation !== undefined && current !== localized.__idibaLastTranslation)) {
    localized.__idibaSourceText = current;
  }
  const source = localized.__idibaSourceText;
  if (!source) return;
  const result = translate(source, language);
  localized.__idibaLastTranslation = result;
  if (result !== current) node.nodeValue = result;
}

function localizeAttributes(element: Element, language: PlatformLanguage, cache: WeakMap<Element, Map<string, LocalizedAttribute>>) {
  if (element.closest('script, style, noscript, [data-no-translate]')) return;
  let values = cache.get(element);
  if (!values) {
    values = new Map();
    cache.set(element, values);
  }

  for (const name of textAttributes) {
    if (!element.hasAttribute(name)) continue;
    const current = element.getAttribute(name) ?? '';
    if (!current.trim()) continue;
    let value = values.get(name);
    if (!value || current !== value.translated) value = { source: current, translated: current };
    const result = translate(value.source, language);
    value.translated = result;
    values.set(name, value);
    if (result !== current) element.setAttribute(name, result);
  }
}

function walk(root: Node, language: PlatformLanguage, attributeCache: WeakMap<Element, Map<string, LocalizedAttribute>>) {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeText(root as Text, language);
    return;
  }
  if (!(root instanceof Element) && root !== document) return;
  if (root instanceof Element) localizeAttributes(root, language, attributeCache);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    localizeText(node as Text, language);
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    root.querySelectorAll(textAttributes.map((name) => `[${name}]`).join(',')).forEach((element) => localizeAttributes(element, language, attributeCache));
  }
}

/** Applies the selected locale to static and dynamically rendered UI text across the whole app. */
export function installLiveTranslation() {
  let language = useBrandingStore.getState().language;
  const attributeCache = new WeakMap<Element, Map<string, LocalizedAttribute>>();
  const applyLanguage = (nextLanguage: PlatformLanguage) => {
    language = nextLanguage;
    document.documentElement.lang = nextLanguage;
    walk(document.body, language, attributeCache);
  };

  applyLanguage(language);
  const unsubscribe = useBrandingStore.subscribe((state, previous) => {
    if (state.language !== previous.language) applyLanguage(state.language);
  });

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') {
        localizeText(record.target as Text, language);
        continue;
      }
      if (record.type === 'attributes' && record.target instanceof Element) {
        localizeAttributes(record.target, language, attributeCache);
        continue;
      }
      record.addedNodes.forEach((node) => walk(node, language, attributeCache));
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...textAttributes] });

  return () => {
    observer.disconnect();
    unsubscribe();
  };
}
