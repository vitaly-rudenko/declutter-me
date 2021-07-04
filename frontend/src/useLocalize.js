import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Language from './Language';

import { get, localize } from './localize';

const languageMap = {
    'en': Language.ENGLISH,
    'uk': Language.UKRAINIAN,
    'ru': Language.RUSSIAN,
};

export const useLocalize = () => {
    const params = useParams();
    const language = useMemo(() => languageMap[params?.language] ?? Language.ENGLISH, [params]);

    return {
        localize: (messageKey, replacements) => localize(messageKey, replacements, language),
        get: (messageKey) => get(messageKey, language),
    };
};
