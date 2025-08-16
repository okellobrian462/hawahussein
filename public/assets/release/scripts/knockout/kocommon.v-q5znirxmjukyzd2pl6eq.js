ko.bindingHandlers.executeOnEnter = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var allBindings = allBindingsAccessor();
        var root = bindingContext.$root;

        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                if (root.hasOwnProperty('HasPendingUpdates') && ko.isObservable(root['HasPendingUpdates'])) {
                    root.HasPendingUpdates(true);
                }
                allBindings.executeOnEnter.call(viewModel);
                return false;
            }
            return true;
        });
    }
};
ko.bindingHandlers.enterkey = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var callback = valueAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                callback.call(viewModel);
                return false;
            }
            return true;
        });
    }
};
ko.bindingHandlers.onSelectChanged = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var options = valueAccessor();
        var allBindings = allBindingsAccessor();
        var observable = options.observable;
        var observableEvent = options.event;
        var featuredobservable = options.featuredobservable;
        var featuredcontainer = options.featuredcontainer;

        $(element).change(function (event) {
            var $this = $(this);
            if (!!$this.val()) {

                var selectItem = ko.utils.arrayFilter(observable(), function (item) {
                    return (item.ID().toLowerCase().indexOf($this.val().toLowerCase()) == 0);
                });
                if (selectItem.length > 0) {
                    if (observableEvent != null && $.isFunction(observableEvent)) {
                        observableEvent.call(selectItem[0], observable, event);
                    }
                }
            }
            return false;
        });
    }
};

ko.bindingHandlers.selectedText = {
    init: function (element, valueAccessor) {
        var value = valueAccessor();
        value($("option:selected", element).text());

        $(element).change(function () {
            value($("option:selected", this).text());
        });
    }
};

ko.bindingHandlers.fadeVisible = {
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).hide().fadeIn(800) : $(element).fadeOut(800);
    }
};