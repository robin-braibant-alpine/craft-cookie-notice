import { A11yUtils } from '../utils/a11y.utils';
import 'wicg-inert';

declare global {
  interface Window {
    dataLayer: any;
    _mtm: any;
    cookieNoticeConsentChange: any;
  }
}

export class CookieNoticeComponent {
  private consentCookie = '__cookie_consent';
  private blockedCookie = '__cookie_blocked';
  private siteContainer: HTMLElement;
  private cookieModal: HTMLElement;
  private onConsentChange: Function;

  private cookiePreferencesObject = {
    security_storage: true,
    functionality_storage: true,
    analytics_storage: false,
    ad_storage: false,
    ad_user_data: false,
    personalization_storage: false,
    ad_personlization: false,
  };

  constructor() {
    let shouldRun: boolean;

    if (
      /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(
        navigator.userAgent
      )
    ) {
      shouldRun = false;
    } else {
      shouldRun = !this.getCookie(this.consentCookie);
    }

    window.cookieNoticeConsentChange = (callback: Function) => {
      this.onConsentChange = callback;
    };

    this.siteContainer = document.getElementById('site-container');

    const cookieBanner = document.getElementById('cookienotice-banner');

    if (shouldRun && cookieBanner) {
      cookieBanner.classList.remove('hidden');
      A11yUtils.keepFocus(cookieBanner);
      cookieBanner.focus();

      const cookieOverlay = document.getElementById('cookienotice-overlay');
      cookieOverlay.classList.remove('hidden');

      this.setSiteContainerInert();

      this.triggerEvent('cookienotice-banner-opened');

      this.initializeGoogleConsentMode(true);

      setTimeout(() => {
        if (
          window.getComputedStyle(cookieOverlay).display === 'none' ||
          window.getComputedStyle(cookieBanner).display === 'none'
        ) {
          console.info(
            'The cookie notice cannot be shown because it is blocked by a browser plugin.'
          );
          this.setSiteContainerInert(false);
          this.setCookie(
            this.consentCookie,
            '365',
            JSON.stringify(this.cookiePreferencesObject)
          );
          this.setCookie(this.blockedCookie, '365', true);
          this.triggerEvent('cookienotice-banner-blocked');
          this.triggerEvent('cookienotice-closed');
        }
      }, 500);
    }
    document.body.addEventListener('click', this.clickListener.bind(this));
  }

  private clickListener(event: Event) {
    const element = event.target as HTMLElement;
    if (!element) {
      return;
    }

    if (element.classList) {
      if (element.hasAttribute('data-cookie-settings')) {
        event.preventDefault();
        const cookieBanner = document.getElementById('cookienotice-banner');

        if (cookieBanner) {
          cookieBanner.classList.add('hidden');
        }

        this.renderCookieModal();

        setTimeout(() => {
          if (window.getComputedStyle(this.cookieModal).display == 'none') {
            alert('Cookienotice settings modal is blocked by a browser plugin');
          } else {
            this.setSiteContainerInert();
          }
        }, 500);
      } else if (element.hasAttribute('data-cookie-essentials')) {
        event.preventDefault();
        this.setCookie(
          this.consentCookie,
          '365',
          JSON.stringify(this.cookiePreferencesObject)
        );
        this.updateGoogleConsentMode();
        this.closeCookieNotice();
        this.triggerEvent('cookienotice-closed');
      } else if (element.hasAttribute('data-cookie-accept')) {
        event.preventDefault();
        this.cookiePreferencesObject.analytics_storage = true;
        this.cookiePreferencesObject.ad_storage = true;
        this.cookiePreferencesObject.ad_user_data = true;
        this.cookiePreferencesObject.personalization_storage = true;
        this.cookiePreferencesObject.ad_personlization = true;
        this.setCookie(
          this.consentCookie,
          '365',
          JSON.stringify(this.cookiePreferencesObject)
        );
        this.updateGoogleConsentMode();
        this.closeCookieNotice(this.cookieModal);
        this.triggerEvent('cookienotice-closed');
      } else if (element.hasAttribute('data-cookienotice-close')) {
        this.setUserCookiePreferences(event);
      } else if (element.hasAttribute('data-cookie-performance')) {
        this.updateCheckbox('performance');
        this.updateGoogleConsentMode();
      } else if (element.hasAttribute('data-cookie-marketing')) {
        this.updateCheckbox('marketing');
        this.updateGoogleConsentMode();
      } else if (element.hasAttribute('data-cookie-personalization')) {
        this.updateCheckbox('personalization');
        this.updateGoogleConsentMode();
      }
    }
  }

  private closeCookieNotice(cookieModal: HTMLElement | null = null) {
    const cookieBanner = document.getElementById('cookienotice-banner');
    const cookieOverlay = document.getElementById('cookienotice-overlay');

    cookieBanner.classList.add('hidden');
    cookieOverlay.classList.add('hidden');

    if (cookieModal) {
      this.cookieModal.classList.add('hidden');
    }

    this.setSiteContainerInert(false);
    this.triggerEvent('cookienotice-closed');
    location.reload();
  }

  private setUserCookiePreferences(event: Event) {
    event.preventDefault();
    if (this.isCheckboxChecked('performance') === true) {
      this.cookiePreferencesObject.analytics_storage = true;
    } else {
      this.cookiePreferencesObject.analytics_storage = false;
    }

    if (this.isCheckboxChecked('marketing') === true) {
      this.cookiePreferencesObject.ad_storage = true;
      this.cookiePreferencesObject.ad_user_data = true;
    } else {
      this.cookiePreferencesObject.ad_storage = false;
      this.cookiePreferencesObject.ad_user_data = false;
    }

    let personalizationCheckbox = document.getElementById('personalization');
    if (personalizationCheckbox) {
      if (this.isCheckboxChecked('personalization')) {
        this.cookiePreferencesObject.personalization_storage = true;
        this.cookiePreferencesObject.ad_personlization = true;
      } else {
        this.cookiePreferencesObject.personalization_storage = false;
        this.cookiePreferencesObject.ad_personlization = false;
      }
    }
    this.setCookie(
      this.consentCookie,
      '365',
      JSON.stringify(this.cookiePreferencesObject)
    );
    this.updateGoogleConsentMode();
    this.cookieModal = document.getElementById('cookienotice-modal');
    this.closeCookieNotice(this.cookieModal);
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
            '(?:(?:^|.*;)\\s*' +
              encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') +
              '\\s*\\=\\s*([^;]*).*$)|^.*$'
          ),
          '$1'
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
      '=' +
      encodeURIComponent(value) +
      (expires ? '; expires=' + expires : '') +
      "; path=/; Secure; SameSite=Strict'";

    if (this.onConsentChange) {
      this.onConsentChange(value);
    }

    if (window.dataLayer) {
      window.dataLayer.push({ event: 'cookie_refresh' });
    }

    if (window._mtm) {
      window._mtm.push({ event: 'cookie_refresh' });
    }
  }

  private renderCookieModal() {
    //check if the cookienotice was already opened before
    const cookieBanner = document.getElementById('cookienotice-banner');
    if (cookieBanner) {
      cookieBanner.classList.add('hidden');
    }
    this.cookieModal = document.getElementById('cookienotice-modal');
    if (this.cookieModal) {
      this.cookieModal.classList.remove('hidden');
      this.triggerEvent('cookienotice-modal-opened');
    }

    const cookieOverlay = document.getElementById('cookienotice-overlay');
    cookieOverlay.classList.remove('hidden');

    A11yUtils.keepFocus(this.cookieModal);
    this.cookieModal.focus();

    const cookieGdpr = this.getCookie(this.consentCookie);

    if (!cookieGdpr) return;

    let cookieData = JSON.parse(cookieGdpr);
    if (cookieData.analytics_storage === true) {
      (document.getElementById('performance') as HTMLInputElement).checked =
        true;
      this.updateCheckbox('performance', true);
    }
    if (cookieData.ad_storage === true) {
      (document.getElementById('marketing') as HTMLInputElement).checked = true;
      this.updateCheckbox('marketing', true);
    }
    if (cookieData.personalization_storage === true) {
      (document.getElementById('personalization') as HTMLInputElement).checked =
        true;
      this.updateCheckbox('personalization', true);
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
      this.siteContainer.setAttribute('inert', '');
      document.documentElement.classList.add('overflow-hidden');
    }
    if (this.siteContainer && !set) {
      this.siteContainer.removeAttribute('inert');
      document.documentElement.classList.remove('overflow-hidden');
    }
  }

  private triggerEvent(eventName: string) {
    const event = new Event(eventName);
    window.dispatchEvent(event);
  }

  private updateGoogleConsentMode() {
    let gtag = null;
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).gtag === 'function'
    ) {
      gtag = (window as any).gtag;
    } else {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
      gtag = (window as any).gtag;
    }
    gtag('consent', 'update', {
      security_storage: this.cookiePreferencesObject.security_storage
        ? 'granted'
        : 'denied',
      functionality_storage: this.cookiePreferencesObject.functionality_storage
        ? 'granted'
        : 'denied',
      analytics_storage: this.cookiePreferencesObject.analytics_storage
        ? 'granted'
        : 'denied',
      ad_storage: this.cookiePreferencesObject.ad_storage
        ? 'granted'
        : 'denied',
      ad_user_data: this.cookiePreferencesObject.ad_user_data
        ? 'granted'
        : 'denied',
      personalization_storage: this.cookiePreferencesObject
        .personalization_storage
        ? 'granted'
        : 'denied',
      ad_personalization: this.cookiePreferencesObject.ad_personlization
        ? 'granted'
        : 'denied',
    });
  }

  private initializeGoogleConsentMode(isEEA: boolean = true) {
    (window as any).dataLayer = (window as any).dataLayer || [];

    if (typeof (window as any).gtag !== 'function') {
      (window as any).gtag = function () {
        (window as any).dataLayer.push(arguments);
      };
    }

    const gtag = (window as any).gtag;

    gtag('consent', 'default', {
      security_storage: 'granted', // Essential security always granted
      functionality_storage: isEEA ? 'denied' : 'granted',
      analytics_storage: isEEA ? 'denied' : 'granted',
      ad_storage: isEEA ? 'denied' : 'granted',
      ad_user_data: isEEA ? 'denied' : 'granted',
      personalization_storage: isEEA ? 'denied' : 'granted',
      ad_personalization: isEEA ? 'denied' : 'granted',
      wait_for_update: 500, // Wait for consent interaction
    });

    console.log('Google Consent Mode initialized with EEA defaults:', isEEA);
  }
}
