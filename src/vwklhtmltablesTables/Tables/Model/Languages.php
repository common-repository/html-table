<?php


class vwklhtmltablesTables_Tables_Model_Languages extends vwklhtmltablesTables_Core_BaseModel
{
    /**
     * Returns an array of the DataTable translations.
     * @return array
     */
    public function getDefaultLanguages()
    {
        return array(
            'default',
            'Afrikaans',
            'Albanian',
            'Arabic',
            'Armenian',
            'Azerbaijan',
            'Bangla',
            'Basque',
            'Belarusian',
            'Bulgarian',
            'Catalan',
            'Chinese-traditional',
            'Chinese',
            'Croatian',
            'Czech',
            'Danish',
            'Dutch',
            'English',
            'Estonian',
            'Filipino',
            'Finnish',
            'French',
            'Galician',
            'Georgian',
            'German',
            'Greek',
            'Gujarati',
            'Hebrew',
            'Hindi',
            'Hungarian',
            'Icelandic',
            'Indonesian-Alternative',
            'Indonesian',
            'Irish',
            'Italian',
            'Japanese',
            'Korean',
            'Kyrgyz',
            'Latvian',
            'Lithuanian',
            'Macedonian',
            'Malay',
            'Mongolian',
            'Nepali',
            'Norwegian',
            'Persian',
            'Polish',
            'Portuguese-Brasil',
            'Portuguese',
            'Romanian',
            'Russian',
            'Serbian',
            'Sinhala',
            'Slovak',
            'Slovenian',
            'Spanish',
            'Swahili',
            'Swedish',
            'Tamil',
            'Thai',
            'Turkish',
            'Ukranian',
            'Urdu',
            'Uzbek',
            'Vietnamese'
        );
    }

    /**
     * Returns an array of the current languages at the official DataTable repo.
     * @return array|null
     */
    public function downloadLanguages()
    {
        $url = 'https://api.github.com/repos/DataTables/Plugins/contents/i18n';
        $languages = array();

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return null;
        }

        if (200 !== wp_remote_retrieve_response_code($response)) {
            return null;
        }

        $files = json_decode($response['body']);

        if (!is_array($files)) {
            return null;
        }

        foreach ($files as $file) {
            $languages[] = str_replace('.lang', '', $file->name);
        }

        return $languages;
    }

    /**
     * Tries to download full list of the languages from the official repo or
     * returns the default languages list of download failed.
     * @return array
     */
    public function getLanguages()
    {
        $languages = $this->downloadLanguages();

        if (null === $languages) {
            $languages = $this->getDefaultLanguages();
        }

        return $languages;
    }
}