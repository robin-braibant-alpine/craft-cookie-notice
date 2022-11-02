<?php

namespace alpinedigital\cookienotice\assetbundles\cookienotice;

use craft\web\AssetBundle;

class CookieNoticeNoStyleAsset extends AssetBundle
{
    public function init()
    {
        $this->sourcePath = "@alpinedigital/cookienotice/assetbundles/cookienotice/dist";
        $this->js = ['js/cookienotice.js'];

        parent::init();
    }
}