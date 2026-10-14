import { useEffect, useRef } from "react";

const revealTargets =
  ".lp-section-heading, .lp-foundation, .lp-capability, .lp-capabilities-footer, .lp-story-row, .lp-access-panel, .lp-steps article, .lp-pricing-heading, .lp-price-card, .lp-faq > div, .lp-final-cta > div, .lp-footer-grid > *";

export function useLandingMotion() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intersection: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    const clear = () => {
      intersection?.disconnect();
      mutations?.disconnect();
      element
        .querySelectorAll(".lp-reveal")
        .forEach(target => target.classList.remove("lp-reveal", "is-revealed"));
    };
    const initialize = () => {
      clear();
      if (preference.matches) return;
      intersection = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              intersection?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
      );
      const register = () => {
        element.querySelectorAll(revealTargets).forEach(target => {
          if (target.classList.contains("lp-reveal")) return;
          // Content in the first viewport stays immediately visible.
          if (target.getBoundingClientRect().top < window.innerHeight) return;
          target.classList.add("lp-reveal");
          intersection?.observe(target);
        });
      };
      register();
      mutations = new MutationObserver(register);
      mutations.observe(element, { childList: true, subtree: true });
    };
    initialize();
    preference.addEventListener("change", initialize);
    return () => {
      clear();
      preference.removeEventListener("change", initialize);
    };
  }, []);
  return root;
}
