<?php

namespace alpinedigital\cookienotice;

use alpinedigital\cookienotice\variables\CookieNoticeVariable;
use craft\base\Plugin;
use craft\web\twig\variables\CraftVariable;
use yii\base\Event;

class CookieNotice extends Plugin {
    public function init()
    {
        parent::init();
        Event::on(
            CraftVariable::class,
            CraftVariable::EVENT_INIT,
            function(Event $event) {
                /** @var CraftVariable $variable */
                $var = $event->sender;
                $var->set('cookieNotice', CookieNoticeVariable::class);
            }
        );
    }
}