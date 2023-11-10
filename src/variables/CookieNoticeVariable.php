<?php

namespace alpinedigital\cookienotice\variables;

use alpinedigital\cookienotice\assetbundles\cookienotice\CookieNoticeAsset;
use alpinedigital\cookienotice\assetbundles\cookienotice\CookieNoticeNoStyleAsset;
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
    private array $banner = [
        'template' => 'cookie-notice/_banner',
        'mode' => View::TEMPLATE_MODE_CP
    ];
    private Entry $cookiePolicy;
    private array $modal = [
        'template' => 'cookie-notice/_modal',
        'mode' => View::TEMPLATE_MODE_CP
    ];
    private string $overlay = 'cookie-notice/_overlay';
    private string $assetBundle = CookieNoticeAsset::class;
    private string $assetBundleNoStyle = CookieNoticeNoStyleAsset::class;
    private bool $personalization = false;

    public function render(array $settings = []): void
    {
        if ($this->isBot()) {
            echo "";
        }
        try {
            $this->setCookiePolicy($settings);

            $this->setPersonalisation($settings);

            $this->setModal($settings);

            echo Craft::$app->getView()->renderTemplate(
                $this->modal['template'],
                [
                    'cookiePolicy' => $this->cookiePolicy,
                    'personalization' => $this->personalization
                ],
                $this->modal['mode']);

            $this->showCookieBanner($settings);

            $this->setOverlay($settings);

            $this->setAssetBundle($settings);
        } catch (LoaderError|RuntimeError|SyntaxError|Exception $e) {
            Craft::error($e->getMessage(), "cookie-notice");
        }
    }

    public function getCookie()
    {
        if (isset($_COOKIE["__cookie_consent"])) {
            return $_COOKIE["__cookie_consent"];
        }
        return "";
    }

    private function isBot(): bool
    {
        try {
            if (isset($_SERVER['HTTP_USER_AGENT'])) {
                return $_SERVER['HTTP_USER_AGENT'] && preg_match('/bot|crawl|facebook|google|slurp|spider|mediapartners/i', $_SERVER['HTTP_USER_AGENT']);
            }
            return false;
        } catch (\Exception $e) {
            Craft::error($e->getMessage(), "cookie-notice");
            return false;
        }
    }

    private function setAssetBundle($settings): void
    {
        if (isset($settings['style'])) {
            if (!$settings['style']) {
                Craft::$app->getView()->registerAssetBundle($this->assetBundleNoStyle, View::POS_END);
            } else {
                Craft::$app->getView()->registerAssetBundle($this->assetBundle, View::POS_END);
            }
        } else {
            Craft::$app->getView()->registerAssetBundle($this->assetBundle, View::POS_END);
        }
    }

    private function showCookieBanner($settings): void
    {
        if (!isset($settings['showCookieBanner']) || $settings['showCookieBanner']) {
            if (!empty($settings['banner'])) {
                $this->banner = ['template' => $settings['banner'], 'mode' => View::TEMPLATE_MODE_SITE];
            }
            echo \Craft::$app->getView()->renderTemplate($this->banner['template'], [], $this->banner['mode']);
        }
    }

    private function setCookiePolicy($settings): void
    {
        if (!empty($settings['cookiePolicy'])) {
            $this->cookiePolicy = $settings['cookiePolicy'];
        } else {
            $this->cookiePolicy = Entry::find()->section('cookiePolicy')->one();
        }
    }

    private function setModal($settings): void
    {
        if (!empty($settings['modal'])) {
            $this->modal = [
                'template' => $settings['modal'],
                'mode' => View::TEMPLATE_MODE_SITE
            ];
        }
    }

    private function setOverlay($settings): void
    {
        if (!empty($settings['overlay'])) {
            echo \Craft::$app->getView()->renderString($settings['overlay'], [], View::TEMPLATE_MODE_SITE);
        } else {
            echo \Craft::$app->getView()->renderTemplate($this->overlay, [], View::TEMPLATE_MODE_CP);
        }
    }

    private function setPersonalisation($settings): void
    {
        if (!empty($settings["personalization"])) {
            $this->personalization = $settings["personalization"];
        }
    }
}