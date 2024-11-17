import { A11yUtils } from "../utils/a11y.utils";
import "wicg-inert";

declare global {
    interface Window {
        dataLayer: any;
        _mtm: any;
        cookieNoticeConsentChange: any;
    }
}

export class CookieNoticeComponent {
    private consentCookie = "__cookie_consent";
    private blockedCookie = "__cookie_blocked";
    private siteContainer: HTMLElement;
    private cookieModal: HTMLElement;
    private onConsentChange: Function;

    private cookiePreferencesObject = {
        advertising: false,
        analytics: false,
        personalization: false
    };

    constructor() {
        let shouldRun = false;

        if (/bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(navigator.userAgent)) {
            shouldRun = false;
        } else {
            shouldRun = this.getCookie(this.consentCookie) ? false : true;
        }

        window.cookieNoticeConsentChange = (callback) => {
            this.onConsentChange = callback;
        };

        this.siteContainer = document.getElementById("site-container");
        const cookieBanner = document.getElementById("cookienotice-banner");

        if (shouldRun && cookieBanner) {
            cookieBanner.classList.remove("hidden");
            const cookieOverlay = document.getElementById("cookienotice-overlay");
            cookieOverlay.classList.remove("hidden");

            A11yUtils.keepFocus(cookieBanner);
            cookieBanner.focus();

            this.setSiteContainerInert();

            this.triggerEvent("cookienotice-banner-opened");

            setTimeout(() => {
                if (
                    window.getComputedStyle(cookieOverlay).display === "none" ||
                    window.getComputedStyle(cookieBanner).display === "none"
                ) {
                    console.info("The cookie notice cannot be shown because it is blocked by a browser plugin.");
                    this.setSiteContainerInert(false);
                    this.setCookie(this.consentCookie, "365", JSON.stringify(this.cookiePreferencesObject));
                    this.setCookie(this.blockedCookie, "365", true);
                    this.triggerEvent("cookienotice-banner-blocked");
                    this.triggerEvent("cookienotice-closed");
                }
            }, 500);
        }
        document.body.addEventListener("click", this.clickListener.bind(this));
    }

    private clickListener(event: Event) {
        const element = event.target as HTMLElement;
        if (!element) {
            return;
        }

        if (element.classList) {
            if (element.hasAttribute("data-a-cookie-settings")) {
                event.preventDefault();
                const cookieBanner = document.getElementById("cookienotice-banner");

                if (cookieBanner) {
                    cookieBanner.classList.add("hidden");
                }

                this.renderCookieModal();

                setTimeout(() => {
                    if (window.getComputedStyle(this.cookieModal).display == "none") {
                        alert("Cookienotice settings modal is blocked by a browser plugin");
                    } else {
                        this.setSiteContainerInert();
                    }
                }, 500);
            } else if (element.hasAttribute("data-a-cookie-essentials")) {
                event.preventDefault();
                this.setCookie(this.consentCookie, "365", JSON.stringify(this.cookiePreferencesObject));
                this.closeCookieNotice();
                this.triggerEvent("cookienotice-closed");
            } else if (element.hasAttribute("data-a-cookie-accept")) {
                event.preventDefault();
                this.cookiePreferencesObject.analytics = true;
                this.cookiePreferencesObject.advertising = true;
                this.cookiePreferencesObject.personalization = true;
                this.setCookie(this.consentCookie, "365", JSON.stringify(this.cookiePreferencesObject));
                this.closeCookieNotice(this.cookieModal);
                this.triggerEvent("cookienotice-closed");
            } else if (element.hasAttribute("data-a-cookienotice-close")) {
                this.setUserCookiePreferences(event);
            } else if (element.hasAttribute("data-a-cookie-performance")) {
                this.updateCheckbox("performance");
            } else if (element.hasAttribute("data-a-cookie-marketing")) {
                this.updateCheckbox("marketing");
            }
        }
    }

    private closeCookieNotice(cookieModal: HTMLElement | null = null) {
        const cookieBanner = document.getElementById("cookienotice-banner");
        const cookieOverlay = document.getElementById("cookienotice-overlay");

        cookieBanner.classList.add("hidden");
        cookieOverlay.classList.add("hidden");

        if (cookieModal) {
            this.cookieModal.classList.add("hidden");
        }

        this.setSiteContainerInert(false);
        this.triggerEvent("cookienotice-closed");
        location.reload();
    }

    private setUserCookiePreferences(event: Event) {
        event.preventDefault();
        if (this.isCheckboxChecked("performance") === true) {
            this.cookiePreferencesObject.analytics = true;
        } else {
            this.cookiePreferencesObject.analytics = false;
        }
        if (this.isCheckboxChecked("marketing") === true) {
            this.cookiePreferencesObject.advertising = true;
        } else {
            this.cookiePreferencesObject.advertising = false;
        }
        let personalizationCheckbox = document.getElementById("personalization");
        if (personalizationCheckbox) {
            if (this.isCheckboxChecked("personalization")) {
                this.cookiePreferencesObject.personalization = true;
            } else {
                this.cookiePreferencesObject.personalization = false;
            }
        }
        this.setCookie(this.consentCookie, "365", JSON.stringify(this.cookiePreferencesObject));

        this.cookieModal = document.getElementById("cookienotice-modal");
        this.closeCookieNotice(this.cookieModal);
        location.reload();
    }

    private updateCheckbox(label, init = false) {
        const checkboxvar = document.getElementById(label) as HTMLInputElement;

        if (
            (checkboxvar.defaultChecked && !checkboxvar.checked) ||
            !checkboxvar.checked
        ) {
            checkboxvar.checked = false;
            checkboxvar.defaultChecked = false;
            if (!init) {
                this.triggerEvent(`cookie-prop-${label}-disabled`);
            }
        } else {
            checkboxvar.checked = true;
            if (!init) {
                this.triggerEvent(`cookie-prop-${label}-enabled`);
            }
        }
    }

    private getCookie(key) {
        if (!key) {
            return null;
        }
        return (
            decodeURIComponent(
                document.cookie.replace(
                    new RegExp(
                        "(?:(?:^|.*;)\\s*" +
                        encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") +
                        "\\s*\\=\\s*([^;]*).*$)|^.*$"
                    ),
                    "$1"
                )
            ) || null
        );
    }

    private setCookie(key, expireDays, value) {
        const date = new Date();
        if (expireDays) {
            date.setTime(date.getTime() + expireDays * 24 * 60 * 60 * 1000);
        }
        let expires = date.toUTCString();
        document.cookie =
            encodeURIComponent(key) +
            "=" +
            encodeURIComponent(value) +
            (expires ? "; expires=" + expires : "") +
            "; path=/; Secure; SameSite=Strict'";

        if (this.onConsentChange) {
            this.onConsentChange(value);
        }

        if (window.dataLayer) {
            window.dataLayer.push({ event: "cookie_refresh" });
        }

        if (window._mtm) {
            window._mtm.push({ event: 'cookie_refresh' });
        }
    }

    private renderCookieModal() {
        //check if the cookienotice was already opened before
        const cookieBanner = document.getElementById("cookienotice-banner");
        if (cookieBanner) {
            cookieBanner.classList.add("hidden");
        }
        this.cookieModal = document.getElementById("cookienotice-modal");
        if (this.cookieModal) {
            this.cookieModal.classList.remove("hidden");
            this.triggerEvent("cookienotice-modal-opened");
        }

        const cookieOverlay = document.getElementById("cookienotice-overlay");
        cookieOverlay.classList.remove("hidden");

        A11yUtils.keepFocus(this.cookieModal);
        this.cookieModal.focus();

        const cookieGdpr = this.getCookie(this.consentCookie);

        if (!cookieGdpr) return;

        let cookieData = JSON.parse(cookieGdpr);
        if (cookieData.analytics === true) {
            (document.getElementById("performance") as HTMLInputElement).checked =
                true;
            this.updateCheckbox("performance", true);
        }
        if (cookieData.advertising === true) {
            (document.getElementById("marketing") as HTMLInputElement).checked =
                true;
            this.updateCheckbox("marketing", true);
        }
        if (cookieData.personalization === true) {
            (document.getElementById("personalization") as HTMLInputElement).checked = true;
            this.updateCheckbox("personalization", true);
        }
    }

    private isCheckboxChecked(checkboxId) {
        let checkbox = document.getElementById(checkboxId) as HTMLInputElement;
        if (checkbox.checked === true || checkbox.defaultChecked) {
            return true;
        }
        return false;
    }

    private setSiteContainerInert(set = true) {
        if (this.siteContainer && set) {
            this.siteContainer.setAttribute("inert", "");
            document.documentElement.classList.add("overflow-hidden");
        }
        if (this.siteContainer && !set) {
            this.siteContainer.removeAttribute("inert");
            document.documentElement.classList.remove("overflow-hidden");
        }
    }

    private triggerEvent(eventName: string) {
        const event = new Event(eventName);
        window.dispatchEvent(event);
    }
}