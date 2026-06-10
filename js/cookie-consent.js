// NEED SOLAR — Cookie Consent v3 (vanilla-cookieconsent)
//
// HOW TO ADD NEW TRACKING SCRIPTS (e.g. Google Analytics):
// 1. Add the script tag with data-category="analytics" attribute to block until consent:
//    <script data-category="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
//    CookieConsent will block it automatically until the user accepts analytics.
// 2. OR load it programmatically inside onConsent() callback below.
// 3. Add the cookie details to the cookieTable in the 'analytics' section.

CookieConsent.run({
    // ── GUI layout ────────────────────────────────────────────
    guiOptions: {
        consentModal: {
            layout: 'box',
            position: 'bottom left',
            equalWeightButtons: false,
            flipButtons: false
        },
        preferencesModal: {
            layout: 'box',
            position: 'right',
            equalWeightButtons: true,
            flipButtons: false
        }
    },

    // ── Callbacks ─────────────────────────────────────────────
    onFirstConsent: ({ cookie }) => {},

    onConsent: ({ cookie }) => {
        // Load analytics only after consent granted
        // Example (uncomment when GA is added):
        // if (CookieConsent.acceptedCategory('analytics')) {
        //     CookieConsent.loadScript('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX', () => {
        //         window.dataLayer = window.dataLayer || [];
        //         function gtag(){dataLayer.push(arguments);}
        //         gtag('js', new Date());
        //         gtag('config', 'G-XXXXXXXX');
        //     });
        // }
    },

    onChange: ({ cookie, changedCategories }) => {
        // Reload page if analytics toggled off so autoClear can remove cookies
        if (changedCategories.includes('analytics') || changedCategories.includes('marketing')) {
            if (!CookieConsent.acceptedCategory('analytics') || !CookieConsent.acceptedCategory('marketing')) {
                window.location.reload();
            }
        }
    },

    // ── Cookie categories ─────────────────────────────────────
    categories: {
        necessary: {
            enabled: true,
            readOnly: true
        },
        analytics: {
            enabled: false,
            autoClear: {
                cookies: [
                    { name: /^(_ga|_gid|_gat|_gac)/ },
                    { name: /^_dc_gtm/ }
                ],
                reloadPage: false
            }
        },
        marketing: {
            enabled: false,
            autoClear: {
                cookies: [
                    { name: /^(_fbp|fr|_tt_|ttcsid)/ }
                ],
                reloadPage: false
            }
        }
    },

    // ── Language / translations ───────────────────────────────
    language: {
        default: 'th',
        translations: {
            th: {
                consentModal: {
                    title: 'เว็บไซต์นี้ใช้คุกกี้',
                    description: 'เราใช้คุกกี้เพื่อให้เว็บไซต์ทำงานได้อย่างถูกต้องและเพื่อพัฒนาประสบการณ์การใช้งาน เราจะไม่เก็บข้อมูลที่ไม่จำเป็นโดยไม่ได้รับความยินยอมจากคุณ อ่านเพิ่มเติมได้ที่ <a href="cookie-policy.html" class="cc__link">นโยบายคุกกี้</a>',
                    acceptAllBtn: 'ยอมรับทั้งหมด',
                    acceptNecessaryBtn: 'ปฏิเสธทั้งหมด',
                    showPreferencesBtn: 'จัดการการตั้งค่า',
                    footer: '<a href="privacy-policy.html">นโยบายความเป็นส่วนตัว</a> · <a href="cookie-policy.html">นโยบายคุกกี้</a>'
                },
                preferencesModal: {
                    title: 'การตั้งค่าคุกกี้',
                    acceptAllBtn: 'ยอมรับทั้งหมด',
                    acceptNecessaryBtn: 'ปฏิเสธทั้งหมด',
                    savePreferencesBtn: 'บันทึกการตั้งค่า',
                    closeIconLabel: 'ปิด',
                    serviceCounterLabel: 'บริการ',
                    sections: [
                        {
                            title: 'การใช้คุกกี้ของเรา',
                            description: 'เราแบ่งคุกกี้ออกเป็นหมวดหมู่ตามวัตถุประสงค์ คุณสามารถเลือกยอมรับหรือปฏิเสธแต่ละหมวดได้ ยกเว้นคุกกี้ที่จำเป็นซึ่งไม่สามารถปิดได้'
                        },
                        {
                            title: 'คุกกี้ที่จำเป็น <span class="pm__badge">จำเป็นต้องมี</span>',
                            description: 'คุกกี้เหล่านี้จำเป็นต่อการทำงานพื้นฐานของเว็บไซต์ ไม่สามารถปิดใช้งานได้',
                            linkedCategory: 'necessary',
                            cookieTable: {
                                headers: {
                                    name: 'ชื่อคุกกี้',
                                    domain: 'โดเมน',
                                    desc: 'คำอธิบาย',
                                    duration: 'ระยะเวลา'
                                },
                                body: [
                                    {
                                        name: 'cc_cookie',
                                        domain: location.hostname,
                                        desc: 'บันทึกการตั้งค่าความยินยอมคุกกี้ของคุณ',
                                        duration: '6 เดือน'
                                    }
                                ]
                            }
                        },
                        {
                            title: 'คุกกี้วิเคราะห์ข้อมูล',
                            description: 'ช่วยให้เราเข้าใจพฤติกรรมการใช้งานเว็บไซต์เพื่อปรับปรุงเนื้อหาและประสบการณ์ให้ดียิ่งขึ้น ข้อมูลที่เก็บเป็นแบบรวม ไม่ระบุตัวตน',
                            linkedCategory: 'analytics',
                            cookieTable: {
                                headers: {
                                    name: 'ชื่อคุกกี้',
                                    domain: 'โดเมน',
                                    desc: 'คำอธิบาย',
                                    duration: 'ระยะเวลา'
                                },
                                body: [
                                    {
                                        name: '_ga, _gid',
                                        domain: 'google.com',
                                        desc: 'Google Analytics — วิเคราะห์การเข้าชม (ยังไม่ได้เปิดใช้งาน)',
                                        duration: '2 ปี / 24 ชั่วโมง'
                                    }
                                ]
                            }
                        },
                        {
                            title: 'คุกกี้การตลาด',
                            description: 'ใช้เพื่อติดตามผู้เข้าชมข้ามเว็บไซต์เพื่อแสดงโฆษณาที่เกี่ยวข้อง ข้อมูลจะถูกแชร์กับผู้ให้บริการโฆษณา',
                            linkedCategory: 'marketing',
                            cookieTable: {
                                headers: {
                                    name: 'ชื่อคุกกี้',
                                    domain: 'โดเมน',
                                    desc: 'คำอธิบาย',
                                    duration: 'ระยะเวลา'
                                },
                                body: [
                                    {
                                        name: '_fbp',
                                        domain: 'facebook.com',
                                        desc: 'Facebook Pixel — ติดตามการแปลงจากโฆษณา (ยังไม่ได้เปิดใช้งาน)',
                                        duration: '3 เดือน'
                                    }
                                ]
                            }
                        },
                        {
                            title: 'ข้อมูลเพิ่มเติม',
                            description: 'หากมีคำถามเกี่ยวกับนโยบายคุกกี้ กรุณา <a class="cc__link" href="contact.html">ติดต่อเรา</a> หรืออ่าน <a class="cc__link" href="privacy-policy.html">นโยบายความเป็นส่วนตัว</a> ฉบับเต็ม'
                        }
                    ]
                }
            },
            en: {
                consentModal: {
                    title: 'We use cookies',
                    description: 'We use cookies to ensure the website functions correctly and to improve your experience. We will not store non-essential data without your consent. Read our <a href="cookie-policy.html" class="cc__link">Cookie Policy</a>.',
                    acceptAllBtn: 'Accept all',
                    acceptNecessaryBtn: 'Reject all',
                    showPreferencesBtn: 'Manage preferences',
                    footer: '<a href="privacy-policy.html">Privacy Policy</a> · <a href="cookie-policy.html">Cookie Policy</a>'
                },
                preferencesModal: {
                    title: 'Cookie Settings',
                    acceptAllBtn: 'Accept all',
                    acceptNecessaryBtn: 'Reject all',
                    savePreferencesBtn: 'Save preferences',
                    closeIconLabel: 'Close',
                    sections: [
                        {
                            title: 'Necessary Cookies <span class="pm__badge">Always Active</span>',
                            description: 'These cookies are required for core website functionality and cannot be disabled.',
                            linkedCategory: 'necessary'
                        },
                        {
                            title: 'Analytics Cookies',
                            description: 'Help us understand how visitors interact with the website. Data collected is aggregated and anonymous.',
                            linkedCategory: 'analytics'
                        },
                        {
                            title: 'Marketing Cookies',
                            description: 'Used to track visitors across websites to show relevant advertisements.',
                            linkedCategory: 'marketing'
                        }
                    ]
                }
            }
        }
    }
});
