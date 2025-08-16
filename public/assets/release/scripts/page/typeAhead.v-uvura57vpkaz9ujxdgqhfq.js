jQuery.fn.InitializeTypeAhead = function (option) {
    var defaults = {
        initialModelUrl: null,
        serviceUrl: null,
        siteSearchUrl: null,
        currentViewID: null
    };
    var option = $.extend({}, defaults, option);
    var pageContent = $(this);
    var typeAheadTimer;

    var viewModel = {};
    viewModel.Keyword = ko.observable('');
    viewModel.TypeAheadResult = {};
    viewModel.IsSearchRunning = ko.observable(false);
    viewModel.ShowTypeAhead = ko.observable(false);

    $.ajax({
        url: option.initialModelUrl,
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        async: false,
        success: function (data) {
            ko.mapping.fromJS(data, {}, viewModel.TypeAheadResult);
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log(xhr);
            console.log("textStatus : " + textStatus);
            console.log("errorThrown : " + errorThrown);
        }
    });

    viewModel.Search = function (section) {
        if (!!option.siteSearchUrl) {
            var siteSearchUrl = option.siteSearchUrl + "?qu=" + escape(viewModel.Keyword());
            if (!!section) {
                siteSearchUrl += "&section=" + escape(section);
            }
            window.location.href = siteSearchUrl;
        }
        else {
            viewModel.LoadDataFromServer();
        }
    }

    // Load next page
    viewModel.LoadNextPage = function () {
        viewModel.TypeAheadResult.Skip(viewModel.TypeAheadResult.Results().length);
        viewModel.LoadDataFromServer();
    }

    var baseUrl = option.serviceUrl;
    if (!!option.currentViewID) {
        baseUrl += "?currentViewID=" + escape(option.currentViewID) + "&query=";
    } else {
        baseUrl += "?query=";
    }

    viewModel.LoadDataFromServer = function () {
        var skipUrl = '';
        if (viewModel.TypeAheadResult.Skip() > 0)
        {
            skipUrl = "&skip=" + viewModel.TypeAheadResult.Skip();
        }
        viewModel.IsSearchRunning(true);
        var searchTerm = viewModel.Keyword();
        $.ajax({
            url: baseUrl + escape(viewModel.Keyword()) + skipUrl,
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (data) {
                var results = ko.observableArray();
                if (viewModel.TypeAheadResult.Skip() == 0) {
                    viewModel.TypeAheadResult.ResultCount(0);
                    viewModel.TypeAheadResult.Results.removeAll();
                }
                var cleanFilter = searchTerm.toLowerCase().replace(/[^a-zA-Z0-9 :]/g, "")
                var findArray = cleanFilter.split(/,| /);
                findArray = $.grep(findArray, function (n) { return (n); });

                ko.utils.arrayForEach(data.Results, function (childItem) {
                    childItem.DisplayMatched = childItem.Name;
                    ko.utils.arrayForEach(findArray, function (searchItem) {
                        if (searchItem.length > 1) {
                            var regEx = new RegExp('(' + searchItem + ')', "gi");
                            childItem.DisplayMatched = childItem.DisplayMatched.replace(regEx, "<strong class='keyword'>$1</strong>");
                        }
                    });
                });

                ko.mapping.fromJS(data.Results, {}, results);
                ko.utils.arrayForEach(results(), function (item) {
                    viewModel.TypeAheadResult.Results.push(item);
                });

                viewModel.TypeAheadResult.ResultCount(data.ResultCount);
                viewModel.TypeAheadResult.HasMoreResults(data.HasMoreResults);
                viewModel.ShowTypeAhead(true);

                viewModel.IsSearchRunning(false);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.log(xhr);
                console.log("textStatus : " + textStatus);
                console.log("errorThrown : " + errorThrown);
            }
        });
    }

    ko.bindingHandlers.bindTypeAheadKeyUp = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            $(element).blur(function (event) {
                setTimeout(function () {
                    viewModel.TypeAheadResult.Results.removeAll();
                    viewModel.TypeAheadResult.Skip(0);
                    viewModel.TypeAheadResult.ResultCount(0);
                    viewModel.TypeAheadResult.HasMoreResults(false);
                    viewModel.ShowTypeAhead(false);
                }, 250);
            })
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = valueAccessor();
            var allBindings = allBindingsAccessor();
            var observable = options.observable;

            if (!!options() && options().length >= 3) {
                viewModel.LoadDataFromServer();
            }
            else {
                viewModel.TypeAheadResult.Results.removeAll();
                viewModel.TypeAheadResult.Skip(0);
                viewModel.TypeAheadResult.ResultCount(0);
                viewModel.TypeAheadResult.HasMoreResults(false);
                viewModel.ShowTypeAhead(false);
            }
        }
    };


    // Apply Bindings
    ko.applyBindings(viewModel, pageContent.get(0));
};
