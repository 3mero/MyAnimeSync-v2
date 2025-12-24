import { authTranslations } from './auth';
import { commonTranslations } from './common';
import { featuresTranslations } from './features';
import { genresTranslations, genres_list as all_genres } from './genres';
import { listsTranslations } from './lists';
import { mangaTranslations } from './manga';
import { miscTranslations } from './misc';
import { toastTranslations } from './toasts';
import { logViewerTranslations } from './log-viewer';
import { searchTranslations } from './search';
import { dataManagementTranslations } from './data-management';

// This function merges all translation files into a single object.
const mergeTranslations = (...translationObjects: any[]) => {
    const merged: { [key: string]: { [key: string]: string } } = { ar: {}, en: {} };
    for (const trans of translationObjects) {
        if (trans.ar) {
            Object.assign(merged.ar, trans.ar);
        }
        if (trans.en) {
            Object.assign(merged.en, trans.en);
        }
    }
    return merged;
};

export const translations = mergeTranslations(
    authTranslations,
    commonTranslations,
    featuresTranslations,
    genresTranslations,
    listsTranslations,
    mangaTranslations,
    miscTranslations,
    toastTranslations,
    logViewerTranslations,
    searchTranslations,
    dataManagementTranslations
);

export const genres_list = all_genres;
