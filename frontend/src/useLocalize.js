import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Language } from './Language.js';

import { get, localize } from './localize.js';

const languageMap = {
    'en': Language.ENGLISH,
};

export const useLocalize = () => {
    const params = useParams();
    const language = useMemo(() => languageMap[params?.language] ?? Language.ENGLISH, [params]);

    return {
        localize: (messageKey, replacements) => localize(messageKey, replacements, language),
        get: (messageKey) => get(messageKey, language),
    };
};
