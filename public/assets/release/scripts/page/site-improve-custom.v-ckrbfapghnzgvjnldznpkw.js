var _szOper = (function () {
    var _szInitialized = false;
    var _szlastTracked = '';

    function canRun() {

        if (typeof (_sz) == 'undefined') return false;
        if (!_szInitialized) {
            _sz.push(['noonclick', true]);
            _szInitialized;
        }

        return true;

    }

    function pushHash() {
        var href = window.location.href;
        var hashVal = window.location.hash;
        //Replacing # from URL due to Siteimproves default behaviour to strip hashtag from URL
        var newHref = href.replace(hashVal, '');
        if (newHref.indexOf('?') >= 0) {
            newHref += '&hash=' + hashVal.replace('#', '');
        } else {
            newHref += '?hash=' + hashVal.replace('#', '');
        }
        pushHistoryUpdate(newHref);
    }

    function pushCurrent() {
        pushHistoryUpdate(window.location.href);
    }

    function pushHistoryUpdate(href) {
        if (!canRun()) return;

        if (_szlastTracked === href) return;
        _szlastTracked = href;

        // Setting tracked state to false to allow another image.aspx to be generated when we push 'trackpageview'
        _sz.analytics.state.tracked = false;

        //_sz.push updates the page properties that will be sent when push trackpageview

        // The URL that will be displayed in analytics tool
        _sz.push(['ourl', href]);

        // The title of the page to be displayed in analytics tool
        _sz.push(['title', document.title]);

        // A randomly generated ID used to weed out duplicate events
        _sz.push(['luid', _sz.core.uuid()]);

        // Creates an image.aspx request to Siteimprove sending the pagestate information
        _sz.push(['trackpageview']);

        // Updates the referral to be used next time we trackpageview
        _sz.push(['ref', href]);
    }

    function InitialTracking() {
        // If href contains '#!' execute pushHash otherwise use default Siteimprove analytics behaviour
        if (canRun()) {
            if (window.location.href.indexOf('#') > -1) pushHash();
        } else {
            setTimeout(InitialTracking, 0);
        }
    }
    InitialTracking();

    // Event listener for hashchange , executes pushHash function when it fires.
    window.addEventListener("hashchange", pushHash, false);

    return { onChange: pushHistoryUpdate, onHistoryChange: pushCurrent };
})();

$(document).ready(function () {
    $('.js-siteimprove-blur').on('blur', function () {
        if ($(this).val().trim().length > 0) {
            TrackCustomSiteImprove($(this), location.href);
        }
        
    });

    $('*[data-siteimprove-customtrigger]').click(function () {
        TrackCustomSiteImprove($(this), location.href);
    });

    function TrackCustomSiteImprove($trigger, featureUrl) {
        var triggerSiteImpove = true;
        var paramTitle = $trigger.data('siteimprove-title');
        var paramFeature = $trigger.data('siteimprove-feature');
        var paramEvent = $trigger.data('siteimprove-event');

        var dependencySelector = $trigger.data('siteimprove-dependency');
        if (!!dependencySelector && dependencySelector.length > 0) {
            triggerSiteImpove = !!$(dependencySelector) && $(dependencySelector).length > 0;
        }

        if ($trigger.hasClass('js-siteimprove-blur')) {
            paramTitle = $trigger.val();
        }

        if (featureUrl.indexOf('://') < 0) {
            var hostUrl = location.protocol + "//" + location.host;
            featureUrl = hostUrl + featureUrl;
        }

        if (triggerSiteImpove) {
            if (!!paramFeature && paramFeature.length > 0) {
                var paramKey = "feature=";
                if (featureUrl.indexOf("?") < 0) {
                    featureUrl += "?";
                } else {
                    featureUrl += "&";
                }

                featureUrl += paramKey + paramFeature;
            }
            if (!!paramTitle && paramTitle.length > 0) {
                var paramKey = "featuretitle=";
                if (featureUrl.indexOf("?") < 0) {
                    featureUrl += "?";
                } else {
                    featureUrl += "&";
                }

                featureUrl += paramKey + paramTitle;
            }
            if (!!paramEvent && paramEvent.length > 0) {
                var paramKey = "featureevent=";
                if (featureUrl.indexOf("?") < 0) {
                    featureUrl += "?";
                } else {
                    featureUrl += "&";
                }

                featureUrl += paramKey + paramEvent;
            }

            if (featureUrl.indexOf("mailto:") >= 0) {
                var urlSplit = featureUrl.replace('mailto:', '|').split('|');
                if (urlSplit.length > 1) {
                    featureUrl = 'mailto:' + urlSplit[1];
                }
            }
            if (featureUrl.indexOf("tel:") >= 0) {
                var urlSplit = featureUrl.replace('tel:', '|').split('|');
                if (urlSplit.length > 1) {
                    featureUrl = 'tel:' + urlSplit[1];
                }
            }
            _szOper.onChange(featureUrl);
        }
    }
});