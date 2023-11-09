const consentCookie = '__cookie_consent';
const cookieBlocked = '__cookie_blocked';

let shouldRun;

if (/bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex/i.test(navigator.userAgent)) {
    shouldRun = false;
} else {
    shouldRun = getCookie(consentCookie) === null ? false : true ;
}

const mainContentBlock = document.getElementById('mainContentBlock');
const cookieBanner = document.getElementById('cookienotice-banner');
const cookieOverlay = document.getElementById('cookienotice-overlay');
const cookieModal = document.getElementById('cookienotice-modal');
const htmlElement = document.documentElement;

const cookieObject = {
    advertising: false,
    analytics: false,
    personalization: false
}

if (!shouldRun && cookieBanner) {
    cookieBanner.classList.remove('hidden');
    cookieOverlay.classList.remove('hidden');

    setMainContentBlockInert();

    triggerEvent('cookienotice-banner-opened');

    setTimeout(() => {
        if (window.getComputedStyle(cookieOverlay).display === 'none' || window.getComputedStyle(cookieBanner).display === 'none') {
            console.log('The cookie notice cannot be shown because it is blocked by a browser plugin.');
            setMainContentBlockInert(false);
            setCookie(consentCookie, '365', JSON.stringify(cookieObject));
            setCookie(cookieBlocked, '365', true);
            triggerEvent('cookienotice-banner-blocked');
            triggerEvent('cookie-closed');
        }
    }, 500);
} else {
    let cookie = getCookie(consentCookie);
    let cookieData = JSON.parse(cookie);
    let marketingCheckbox = document.getElementById('marketing');
    let performanceCheckbox = document.getElementById('performance');
    let personalizationCheckbox = document.getElementById('personalization');
    if (cookieData.personalization === true && personalizationCheckbox) {
        personalizationCheckbox.checked = true;
    }

    if (cookieData.advertising === true) {
        marketingCheckbox.checked = true;
    }

    if (cookieData.analytics === true) {
        performanceCheckbox.checked = true;
    }
}

document.addEventListener('click', clickListener);

function clickListener(event) {
    const element = event.target;
    if (!element) {
        return;
    }

    if (element.classList) {
        if (element.classList.contains('js-cookie-settings')) {
            event.preventDefault();

            if (cookieBanner) {
                cookieBanner.classList.add('hidden');
            }

            renderCookieModal();

            setTimeout(() => {
                if (window.getComputedStyle(cookieModal).display === 'none') {
                    alert('The cookie notice cannot be shown because it is blocked by a browser plugin.')
                } else {
                    setMainContentBlockInert();
                }
            }, 500);
        } else if (element.classList.contains('js-cookie-essentials')) {
            event.preventDefault();
            setCookie(consentCookie, '365', JSON.stringify(cookieObject));
            closeCookieNotice();
        } else if (element.classList.contains('js-cookie-accept')) {
            event.preventDefault();
            cookieObject.analytics = true;
            cookieObject.advertising = true;
            cookieObject.personalization = true;
            setCookie(consentCookie, '365', JSON.stringify(cookieObject));
            closeCookieNotice();
        } else if (element.classList.contains('js-cookiemodal-close')) {
            event.preventDefault();

            if (isCheckboxChecked("performance") === true) {
                cookieObject.analytics = true;
            } else {
                cookieObject.analytics = false;
            }

            if (isCheckboxChecked("marketing") === true) {
                cookieObject.advertising = true;
            } else {
                cookieObject.advertising = false;
            }

            let personalizationCheckbox = document.getElementById('personalization');
            if (personalizationCheckbox) {
                if (isCheckboxChecked("personalization")) {
                    cookieObject.personalization = true;
                } else {
                    cookieObject.personalization = false;
                }
            }
            setCookie(consentCookie, "365", JSON.stringify(cookieObject));

            cookieModal.classList.toggle('hidden');
            cookieOverlay.classList.add('hidden');
            setMainContentBlockInert(false);
            triggerEvent('cookienotice-closed');
            location.reload();
        } else if (element.classList.contains('js-modal-close-btn')) {
            event.preventDefault();
            cookieModal.classList.toggle('hidden');
            cookieOverlay.classList.add('hidden');
            setMainContentBlockInert(false);
            triggerEvent('cookienotice-closed');
            location.reload();
        } else if (element.classList.contains('js-cookie-performance')) {
            updateCheckbox('performance');
        } else if (element.classList.contains('js-cookie-marketing')) {
            updateCheckbox('marketing');
        }
    }
}

function closeCookieNotice() {
    cookieBanner.classList.add('hidden');
    cookieOverlay.classList.add('hidden');
    cookieModal.classList.add('hidden');
    setMainContentBlockInert(false);
    triggerEvent('cookienotice-closed');
    location.reload();
}

function getCookie(key) {
    if (!key) {
        return null;
    }

    return (decodeURIComponent(document.cookie.replace
        (new RegExp("(?:(?:^|.*;)\\s*" +
                encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") +
                "\\s*\\=\\s*([^;]*).*$)|^.*$"),
            "$1")) || null
    );
}

function isCheckboxChecked(checkboxId) {
    let checkbox = document.getElementById(checkboxId);
    if (checkbox.checked === true || checkbox.defaultChecked) {
        return true;
    }
    return false;
}

function renderCookieModal() {
    if (cookieModal) {
        cookieModal.classList.remove('hidden');
        triggerEvent('cookienotice-modal-opened')
    }

    cookieOverlay.classList.remove('hidden');

    const cookie = getCookie(consentCookie);
    if (cookie) {
        let cookieData = JSON.parse(cookie)

        if (cookieData.analytics === true) {
            (document.getElementById('performance')).checked = true;
            updateCheckbox('performance', true);
        }
        if (cookieData.advertising === true) {
            (document.getElementById('marketing')).checked = true;
            updateCheckbox('marketing', true);
        }
        if (cookieData.personalization === true) {
            (document.getElementById('personalization')).checked = true;
            updateCheckbox('personalization     ', true);
        }
    }
}

function setCookie(key, duration, value) {
    let date = new Date();
    if (duration) {
        date.setTime(date.getTime() + duration * 24 * 60 * 60 * 1000);
    }

    let expires = date.toUTCString();
    console.log(encodeURIComponent(key) + '=' + encodeURIComponent(value) + (expires ? '; expires=' + expires : '') + '; path=/; Secure; SameSite=Strict');
    document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + (expires ? '; expires=' + expires : '') + '; path=/; Secure; SameSite=Strict';
}

function setMainContentBlockInert(set = true) {
    if (mainContentBlock && set) {
        mainContentBlock.setAttribute('inert', '');
        mainContentBlock.classList.add('overflow-hidden');
        htmlElement.classList.add('overflow-hidden');
    }
    if (mainContentBlock && !set) {
        mainContentBlock.removeAttribute('inert');
        mainContentBlock.classList.remove('overflow-hidden');
        htmlElement.classList.remove('overflow-hidden');
    }
}

function triggerEvent(eventName) {
    const event = new Event(eventName);
    window.dispatchEvent(event);
}

function updateCheckbox(label, init = false) {
    let checkbox = document.getElementById(label);
    if ((checkbox.defaultChecked && !checkbox.checked) || !checkbox.checked) {
        checkbox.checked = false;
        checkbox.defaultChecked = false;
        if (!init) {
            triggerEvent(`cookie-prop-${label}-disabled`)
        }
    } else {
        checkbox.checked = true;
        if (!init) {
            triggerEvent(`cookie-prop-${label}-enabled`)
        }
    }
}