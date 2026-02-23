import { AdMob, BannerAdSize, BannerAdPosition, AdmobConsentStatus } from '@capacitor-community/admob'

// ===== YAPILANDIRMA =====
// ÖNEMLİ: Yayına alırken bunları gerçek AdMob ID'leriyle değiştir!
const AD_CONFIG = {
    // Google'ın resmi test ID'leri (geliştirme sırasında kullanılır)
    ios: {
        banner: 'ca-app-pub-3940256099942544/2934735716',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
    },
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
    },
}

const ADS_REMOVED_KEY = 'wordup_ads_removed'

// ===== REKLAM DURUMU =====
export function isAdsRemoved() {
    try {
        return localStorage.getItem(ADS_REMOVED_KEY) === 'true'
    } catch {
        return false
    }
}

export function setAdsRemoved(removed) {
    localStorage.setItem(ADS_REMOVED_KEY, removed ? 'true' : 'false')
}

// ===== CAPACITOR ORTAM KONTROLÜ =====
function isNativePlatform() {
    return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()
}

export function getPlatform() {
    if (!isNativePlatform()) return null
    return window.Capacitor.getPlatform() // 'ios' | 'android'
}

function getAdId(type) {
    const platform = getPlatform()
    if (!platform || !AD_CONFIG[platform]) return null
    return AD_CONFIG[platform][type]
}

// ===== ADMOB BAŞLATMA =====
let initialized = false

export async function initializeAds() {
    if (!isNativePlatform() || initialized || isAdsRemoved()) return

    try {
        await AdMob.initialize({
            initializeForTesting: true, // Yayına alırken false yap
        })
        initialized = true
        console.log('✅ AdMob başlatıldı')

        // Consent durumunu kontrol et (gerekli olmayabilir ama API uyumu için)
        try {
            const consentInfo = await AdMob.requestConsentInfo()
            if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
                await AdMob.showConsentForm()
            }
        } catch (consentErr) {
            console.warn('Consent kontrolü atlandı:', consentErr)
        }
    } catch (err) {
        console.warn('AdMob başlatılamadı:', err)
    }
}

// ===== BANNER REKLAM =====
export async function showBanner() {
    if (!isNativePlatform() || isAdsRemoved()) return

    // Eğer henüz initialize olmadıysa bekle ve tekrar dene
    if (!initialized) {
        console.log('⏳ AdMob henüz hazır değil, banner için bekleniyor...')
        setTimeout(() => showBanner(), 1000)
        return
    }

    const adId = getAdId('banner')
    if (!adId) return

    try {
        await AdMob.showBanner({
            adId,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: true, // Yayına alırken false yap
        })
        console.log('✅ Banner reklam gösterildi')
    } catch (err) {
        console.warn('Banner gösterilemedi:', err)
    }
}

export async function hideBanner() {
    if (!isNativePlatform()) return
    try {
        await AdMob.hideBanner()
    } catch (err) {
        // Banner zaten gizli olabilir
    }
}

export async function removeBanner() {
    if (!isNativePlatform()) return
    try {
        await AdMob.removeBanner()
    } catch (err) {
        // Banner zaten kaldırılmış olabilir
    }
}

// ===== INTERSTITIAL (TAM EKRAN) REKLAM =====
export async function prepareInterstitial() {
    if (!isNativePlatform() || isAdsRemoved() || !initialized) return

    const adId = getAdId('interstitial')
    if (!adId) return

    try {
        await AdMob.prepareInterstitial({
            adId,
            isTesting: true, // Yayına alırken false yap
        })
        console.log('✅ Interstitial hazırlandı')
    } catch (err) {
        console.warn('Interstitial hazırlanamadı:', err)
    }
}

export async function showInterstitial() {
    if (!isNativePlatform() || isAdsRemoved() || !initialized) return

    try {
        await AdMob.showInterstitial()
        console.log('✅ Interstitial gösterildi')
    } catch (err) {
        console.warn('Interstitial gösterilemedi:', err)
    }
}
