import { useEffect } from "react";

export function useScrollReveal() {
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: "0px",
            threshold: 0.15,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-active");
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll(
            ".reveal-fade-in, .reveal-slide-left, .reveal-slide-right, .reveal-zoom-in"
        );
        elements.forEach((el) => observer.observe(el));

        return () => {
            elements.forEach((el) => observer.unobserve(el));
        };
    }, []);
}
