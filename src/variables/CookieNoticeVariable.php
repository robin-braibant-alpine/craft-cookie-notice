<?php

namespace alpinedigital\cookienotice\variables;

use alpinedigital\cookienotice\assetbundles\cookienotice\CookieNoticeAsset;
use Craft;
use craft\elements\Entry;
use craft\web\View;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Error\SyntaxError;
use yii\base\Exception;
use yii\web\View as ViewAlias;

class CookieNoticeVariable
{
    private $banner = [
        'template' => 'cookie-notice/_banner',
        'mode' => View::TEMPLATE_MODE_CP
    ];
    private Entry $cookiePolicy;
    private $modal = [
        'template' => 'cookie-notice/_modal',
        'mode' => View::TEMPLATE_MODE_CP
    ];

    private $overlay = 'cookie-notice/_overlay';

    private $assetBundle = CookieNoticeAsset::class;

    public function render(array $settings = [])
    {
        if ($this->isBot()) {
            return false;
        }

        if (isset($settings['cookiePolicy']) && !empty($settings['cookiePolicy'])) {
            $this->cookiePolicy = $settings['cookiePolicy'];
        } else {
            $this->cookiePolicy = Entry::find()->section('cookiePolicy')->one();
        }

//        try {
        if (isset($settings['modal']) && !empty($settings['modal'])) {
            $this->modal = [
                'template' => $settings['modal'],
                'mode' => View::TEMPLATE_MODE_SITE
            ];
        }
        echo Craft::$app->getView()->renderTemplate(
            $this->modal['template'],
            ['cookiePolicy' => $this->cookiePolicy],
            $this->modal['mode']);

        if (!isset($settings['showCookieBanner']) || $settings['showCookieBanner']) {
            if (isset($settings['banner']) && !empty($settings['banner'])) {
                $this->banner = ['template' => $settings['banner'], 'mode' => View::TEMPLATE_MODE_SITE];
            }
            echo \Craft::$app->getView()->renderTemplate($this->banner['template'], [], $this->banner['mode']);
        }

        if (isset($settings['overlay']) && !empty($settings['overlay'])) {
            echo \Craft::$app->getView()->renderString($settings['overlay'], [], View::TEMPLATE_MODE_SITE);
        } else {
            echo \Craft::$app->getView()->renderTemplate($this->overlay, [], View::TEMPLATE_MODE_CP);
        }

        Craft::$app->getView()->registerAssetBundle($this->assetBundle, View::POS_END);
        return true;
//        } catch (LoaderError|RuntimeError|SyntaxError|Exception $e) {
//            Craft::error($e->getMessage(), "cookie-notice");
//        }
    }

    private function isBot($userAgent = '/bot|crawl|facebook|google|slurp|spider|mediapartners/i'): bool
    {
        try {
            if (isset($_SERVER['HTTP_USER_AGENT'])) {
                return $_SERVER['HTTP_USER_AGENT'] && preg_match($userAgent, $_SERVER['HTTP_USER_AGENT']);
            }
            return false;
        } catch (\Exception $e) {
            Craft::error($e->getMessage(), "cookie-notice");
            return false;
        }
    }
}