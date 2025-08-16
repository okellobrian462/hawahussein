$(document).ready(function () {

    // Email Disclaimer for all pages, this will work with emails in rich text
    window.ModalLayout.Initialize({
        currentLanguageCode: currentLanguageCode,
        modalTrigger: 'span[data-email], a[data-email], span[href^="mailto:"], a[href^="mailto:"]',
        modalWrapper: 'body',
        modalContentServiceUrl: '/{LanguageKey}/modal-windows/email-disclaimer',
        modalContentClass: "email-disclaimer js-email-disclaimer",
        modalContentSelector: ".js-email-disclaimer",
        events: "click.emaildisclaimer tap.emaildisclaimer"
    });

    // Linked In Insider
    window.ModalLayout.Initialize({
        currentLanguageCode: currentLanguageCode,
        modalTrigger: '.js-modal-linked-in',
        modalWrapper: 'body',
        modalContentServiceUrl: '/{LanguageKey}/modal-windows/linkedin-insider',
        modalContentClass: "modal-general js-linkedin-modal-content",
        modalContentSelector: ".js-linkedin-modal-content",
        events: "click.linkedininsider tap.linkedininsider",
        persistModal: true
    });


    //Phone Number Click Binding
    var $phoneNumber = $('[data-phonenumber]');

    if ($phoneNumber.length > 0) {
        $phoneNumber.click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            window.location = 'tel:' + $(this).data('phonenumber');
        });

        return false;
    }

});