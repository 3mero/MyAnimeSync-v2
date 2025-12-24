export interface ApiInfo {
    name: string;
    url: string;
    features: string[];
}

export const animeApis: Record<string, ApiInfo> = {
    jikan: {
        name: "Jikan API",
        url: "https://api.jikan.moe/v4",
        features: [
            "بحث عن الأنمي",
            "صور وبوسترات",
            "معلومات الشخصيات",
            "التصنيفات والGenres",
            "الحلقات والتقييمات"
        ],
    },
    kitsu: {
        name: "Kitsu API",
        url: "https://kitsu.io/api/edge",
        features: [
            "بحث شامل عن الأنمي",
            "صور ووصف مفصل",
            "Trending / Popular Anime",
            "معلومات المانجا أيضاً"
        ],
    },
    anilist: {
        name: "AniList GraphQL API",
        url: "https://graphql.anilist.co",
        features: [
            "بيانات ضخمة للأنمي",
            "شخصيات + مؤدين صوت",
            "صور عالية الجودة",
            "Ratings + Tags",
            "أداء عالي (GraphQL)"
        ],
    },
    malOfficial: {
        name: "MyAnimeList Official API",
        url: "https://myanimelist.net/apiconfig/references/api/v2",
        features: [
            "بيانات رسمية من MAL",
            "بحث الأنمي والشخصيات",
            "صور وتقييمات",
            "يتطلب OAuth"
        ],
    },
    animeChan: {
        name: "AnimeChan API",
        url: "https://animechan.xyz/api",
        features: [
            "اقتباسات الأنمي",
            "بحث حسب الشخصية",
            "بحث حسب الأنمي"
        ],
    },
    consumet: {
        name: "Consumet Multi-Source API",
        url: "https://api.consumet.org",
        features: [
            "جلب الأنمي من عدة مواقع",
            "روابط المشاهدة",
            "بحث + Trending",
            "تجميع مصادر البث"
        ],
    },
    ghibli: {
        name: "Studio Ghibli API",
        url: "https://ghibliapi.vercel.app",
        features: [
            "معلومات أفلام جيبلي",
            "صور ووصف",
            "طاقم العمل",
            "مجاني بالكامل"
        ],
    },
    traceMoe: {
        name: "Trace.moe API",
        url: "https://api.trace.moe",
        features: [
            "البحث عن الأنمي عبر صورة",
            "اكتشاف اللقطة الأصلية",
            "نتائج دقيقة جداً"
        ],
    },
};
