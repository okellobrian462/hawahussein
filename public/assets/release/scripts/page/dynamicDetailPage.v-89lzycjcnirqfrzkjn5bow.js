jQuery.fn.InitializeDynamicDetailPage = function (option) {
    var defaults = {
        initialJsonData: null,
        entityID: null
    };

    var option = $.extend({}, defaults, option);

    // Load JSON data from model
    var viewModelJs = JSON.parse(option.initialJsonData);
    var viewModel = ko.mapping.fromJS(viewModelJs)
    console.log(viewModel)
    viewModel.IsSearchRunning = ko.observable(false);

    var pageContent = $(this);

    viewModel.hasNavLinks = ko.observable(true);
    if (!viewModel.hasOwnProperty('NavLinks')) {
        viewModel.hasNavLinks(false);
    }

    viewModel.ActiveNavLinkIdx = ko.observable('0');
    viewModel.UpdateActiveNavLink = function (tabIndex, data) {
        viewModel.ActiveNavLinkIdx(tabIndex)
    };


    if (viewModel.hasOwnProperty("RelatedArticles")) {
        viewModel.ShowSection = ko.observable(true);
        viewModel.ShowSection(viewModel.RelatedArticles.ShowSection());

        viewModel.RelatedArticles.RichTextContent = ko.computed(function () {
            var match = ko.utils.arrayFirst(viewModel.RelatedArticles.SearchFilters.ArticleTypeFilters(), function (item) {
                return item.IsSelected();
            });
            if (!!match) {
                return match.RichTextContent();
            }
            return null;
        }, viewModel);

        viewModel.RelatedArticles.DisplaySearchResultListing = ko.computed(function () {
            var match = ko.utils.arrayFirst(viewModel.RelatedArticles.SearchFilters.ArticleTypeFilters(), function (item) {
                return item.IsSelected();
            });
            if (!!match) {
                return match.DisplaySearchResultListing();
            }
            return true;
        }, viewModel);

        viewModel.RelatedArticles.LoadNextPage = function () {
            viewModel.RelatedArticles.SearchFilters.Skip(viewModel.RelatedArticles.GridData().length);
            viewModel.RelatedArticles.LoadDataFromServer();
        }

        viewModel.RelatedArticles.Search = function () {
            viewModel.RelatedArticles.SearchFilters.Skip(0);
            viewModel.RelatedArticles.ResultCount(0);
            viewModel.RelatedArticles.GridData.removeAll();
            viewModel.RelatedArticles.UpcomingEvents.removeAll();
            viewModel.RelatedArticles.LoadDataFromServer();
        }

        viewModel.RelatedArticles.LoadDataFromServer = function () {
            viewModel.IsSearchRunning(true);
            $.ajax({
                url: option.newsInsightsUrl,
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: ko.mapping.toJSON(viewModel.RelatedArticles.SearchFilters),
                cache: false,
                success: function (data) {

                    var results = ko.observableArray();
                    var resultsUpcoming = ko.observableArray();
                    if (viewModel.RelatedArticles.SearchFilters.Skip() == 0) {
                        viewModel.RelatedArticles.ResultCount(0);
                        viewModel.RelatedArticles.GridData.removeAll();
                        viewModel.RelatedArticles.UpcomingEvents.removeAll();
                    }
                    ko.mapping.fromJS(data.GridData, {}, results);
                    ko.utils.arrayForEach(results(), function (item) {
                        viewModel.RelatedArticles.GridData.push(item);
                    });

                    ko.mapping.fromJS(data.UpcomingEvents, {}, resultsUpcoming);
                    ko.utils.arrayForEach(resultsUpcoming(), function (item) {
                        viewModel.RelatedArticles.UpcomingEvents.push(item);
                    });

                    viewModel.RelatedArticles.ResultCount(data.ResultCount);
                    viewModel.RelatedArticles.HasMoreResults(data.HasMoreResults);

                    viewModel.IsSearchRunning(false);
                },
                error: function (xhr, textStatus, errorThrown) {
                    console.log(xhr.responseText);
                }
            });
        }
    }

    // Animations for new lit items
    viewModel.animateGridInsert = function (elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn(800) }
    viewModel.animateGridDelete = function (elem) { if (elem.nodeType === 1) $(elem).fadeOut(800, function () { $(elem).remove(); }) }

    // Apply Bindings
    ko.applyBindings(viewModel, pageContent.get(0));
};
