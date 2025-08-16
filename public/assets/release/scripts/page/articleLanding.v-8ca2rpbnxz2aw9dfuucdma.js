jQuery.fn.InitializeSearchPage = function (option) {
    var defaults = {
        initialJsonData: null,
        serviceUrl: null
    };
    var option = $.extend({}, defaults, option);    
 
    // Load JSON data from model
    var viewModelJs = JSON.parse(option.initialJsonData);
    var viewModel = ko.mapping.fromJS(viewModelJs)
    var guidEmpty = '00000000-0000-0000-0000-000000000000'

    var pageContent = $(this);
    var $loadMoreGrid = $('.js-load-more-grid');
    var $button = $('.js-mobile-btn');

    pageContent.find('.btn-advance-search').click(function () {
        $(this)
			// Toggle class to show minus sign on button
			.toggleClass('show-advanced')

			// Find advanced search element and show/hide advanced options
			.closest('.js-binding-container')
			.find('.advance-search')
			.slideToggle();
    });

    var localViewOptions = pageContent.find('.js-local-view-options li');

    var keyWordIDKey = 'KEYWORD';
    var regionIDKey = 'REGION';

    // Extend View Model
    viewModel.SelectedFilters = ko.observableArray();
    viewModel.IsSearchRunning = ko.observable(false);
    viewModel.HasSearchRun = ko.observable(false);
    viewModel.HasPendingUpdates = ko.observable(false);
    viewModel.ScrollPositionUpdate = ko.observable(false);
    viewModel.CurrentViewName = ko.observable('');
    viewModel.layout = ko.observable(true);
    viewModel.AllName = ko.observable('');
    viewModel.DefaultViewId = ko.observable(viewModel.SearchFilters.CurrentViewID());
    viewModel.PodcastPageNumber = ko.observable(1);
    viewModel.VideoPageNumber = ko.observable(1);

    var currentName = viewModel.AllName(); 
    if ($(window).width() > 619 && currentName.length == 0) {
        $button.text(option.allLabel);
        viewModel.AllName(option.allLabel);
    }
    else if(currentName.length == 0) {
        $button.text(option.allLabelMobile);
        viewModel.AllName(option.allLabelMobile);
    }

    $(window).resize(function () {
        currentName = viewModel.AllName(); 
        if ($(window).width() > 619 && currentName == option.allLabelMobile) {
            $button.text(option.allLabel);
            viewModel.AllName(option.allLabel);
        }
        else if(currentName == option.allLabel) {
            $button.text(option.allLabelMobile);
            viewModel.AllName(option.allLabelMobile);
        }
    });

    // Onstate change for history
    window.onstatechange = function () {
        var currentState = History.getState();
        var qs = History.getState().data['qs'];
        var qsParms = !!qs ? parseQueryString(qs) : {};

        var currentSkip = viewModel.GridData().length;
        var newSkip = 0;
        //increment search count
        if (!!qsParms.skip && qsParms.skip > 0) {
            newSkip = parseInt(qsParms.skip);
        }
        var projectedTotal = newSkip + viewModel.SearchFilters.Take();
        if (projectedTotal < currentSkip && newSkip != 0) {
            // This is here for a back button after a page scroll
            viewModel.IsSearchRunning(true);
            viewModel.HasMoreResults(true);
            viewModel.HasSearchRun(true);
            viewModel.SearchFilters.Skip(newSkip);
            while (viewModel.GridData().length > projectedTotal) {
                var popped = viewModel.GridData.pop();
            }
            viewModel.IsSearchRunning(false);
        } else {
            // New filters have been selected so run search
            viewModel.SearchFilters.ClearAllSearchFilters();
            var hasFilters = false;
            var reloadFilters = false;
            if (!!qsParms.reload && qsParms.reload.length > 0) {
                reloadFilters = (qsParms.reload == "true");
            }
            viewModel.SearchFilters.ReloadFilters(reloadFilters);
            if (!!qsParms.keyword && qsParms.keyword.length > 0) {
                viewModel.SearchFilters.KeywordFilter(qsParms.keyword);
                hasFilters = true;
            }
            if (!!qsParms.currentviewid && qsParms.currentviewid.length > 0) {
                viewModel.SearchFilters.CurrentViewID(qsParms.currentviewid);
                hasFilters = true;
            }
            viewModel.SearchFilters.Skip(newSkip);

            if (!!qsParms.services && qsParms.services.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.PracticeFilters(), function (item) {
                    if (qsParms.services.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
                ko.utils.arrayForEach(viewModel.SearchFilters.IndustryFilters(), function (item) {
                    if (qsParms.services.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.topics && qsParms.topics.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.TopicFilters(), function (item) {
                    if (qsParms.topics.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.types && qsParms.types.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.TypeFilters(), function (item) {
                    if (qsParms.types.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
                ko.utils.arrayForEach(viewModel.SearchFilters.EventTypeFilters(), function (item) {
                    if (qsParms.types.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.blogs && qsParms.blogs.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.BlogFilters(), function (item) {
                    if (qsParms.blogs.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.articletypes && qsParms.articletypes.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
                    if (qsParms.articletypes.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                    }
                });
                viewModel.SetSelectedFilters();
            }
            if (!!qsParms.relatedprobono && qsParms.relatedprobono.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.ProBonoFilters(), function (item) {
                    if (qsParms.relatedprobono.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                    }
                });
                viewModel.SetSelectedFilters();
            }
            if (!!qsParms.date && qsParms.date.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.DateFilters(), function (item) {
                    if (qsParms.date.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.datefrom && qsParms.datefrom.length > 0) {
                viewModel.SearchFilters.DateFrom(qsParms.datefrom);
            }
            if (!!qsParms.dateto && qsParms.dateto.length > 0) {
                viewModel.SearchFilters.DateTo(qsParms.dateto);
            }
            if (!viewModel.ScrollPositionUpdate()) {
                viewModel.LoadDataFromServer();
            }
        }
        // Reposition by scoll position
        var scrollPosition = 0;
        if (!!qsParms.scroll && qsParms.scroll.length > 0) {
            scrollPosition = parseInt(qsParms.scroll);
        }
        $("html, body").animate({ scrollTop: scrollPosition }, "slow");
        return;
    }
    viewModel.SelectedArticleType = function () {
        var selectedItem = ko.utils.arrayFirst(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
            return item.IsSelected();
        });
        if (selectedItem != null) {
            return selectedItem.ID();
        }
        return '';
    };
    viewModel.ShowResourceTiles = ko.observable(true);

    viewModel.SetResourceView = function () {
        const isotope = function (grid) {
            var iso = new Isotope(grid,{
                itemSelector: '.article-item',
                percentPosition: true,
                masonry: {
                    columnWidth: '.grid-sizer'
                }
            })
        }
        var grid = document.querySelector('.article-list');
        imagesLoaded(grid, function() {
            isotope(grid);
            viewModel.ShowResourceTiles(true);
        })
    }
    viewModel.IsDifferentViewThanInitial = ko.computed(function() {
        return viewModel.DefaultViewId() != viewModel.SearchFilters.CurrentViewID();
    })

    viewModel.IsMediaView = ko.computed(function() {
        return viewModel.SelectedArticleType() == option.mediaTemplateID;
    }); 
    viewModel.IsResourceView = ko.computed(function() {
        return viewModel.SelectedArticleType() == option.resourceTemplateID;
    })
    viewModel.ShowMediaSearch = ko.computed(function() {
        return viewModel.IsMediaView() == true && ((viewModel.CurrentViewName() == "Global" && viewModel.SelectedFilters().length > 1)
        || viewModel.SelectedFilters().length > 2 || viewModel.IsDifferentViewThanInitial());
    }); 
    if (viewModel.IsResourceView() == true) {
        if ($('.article-image>img[data-cfsrc]').length !== 0) {
            $(window).load(function () {
                viewModel.SetResourceView();
            });
        }
        else {
            viewModel.SetResourceView();
        }
    }
    // Build query string based on filters
    viewModel.QueryString = function () {
        

        var queryString = "";
        if (viewModel.SearchFilters.KeywordFilter() != null && viewModel.SearchFilters.KeywordFilter().length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "keyword=" + encodeURIComponent(viewModel.SearchFilters.KeywordFilter());
        }
        var selectedItems = new Array(); 
        if (viewModel.SelectedArticleType() != option.mediaTemplateID && viewModel.SelectedArticleType() != option.resourceTemplateID) {
            if(pageContent.find('.media-tab-filters').length > 0) {
                pageContent.find('.media-tab-filters').removeClass('media-tab-filters')
            }
            ko.utils.arrayForEach(viewModel.SearchFilters.PracticeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            ko.utils.arrayForEach(viewModel.SearchFilters.IndustryFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "services=" + selectedItems.join();
            }
        }
        if (viewModel.SelectedArticleType() == option.newsUpdateTemplateID) {
            selectedItems = new Array();
            ko.utils.arrayForEach(viewModel.SearchFilters.TypeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "types=" + selectedItems.join();
            }
        }
        if (viewModel.SelectedArticleType() == option.eventTemplateID) {
            selectedItems = new Array();
            ko.utils.arrayForEach(viewModel.SearchFilters.EventTypeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "types=" + selectedItems.join();
            }
        }
        if (viewModel.SelectedArticleType() == option.eventTemplateID) {
            selectedItems = new Array();
            ko.utils.arrayForEach(viewModel.SearchFilters.ProBonoFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "relatedprobono=" + selectedItems.join();
            }
        }
        if (viewModel.SelectedArticleType() == option.mediaTemplateID) {
            pageContent.find('.advance-search').addClass('media-tab-filters')
            selectedItems = new Array();
            ko.utils.arrayForEach(viewModel.SearchFilters.TopicFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "topics=" + selectedItems.join();
            }
        }
        if (viewModel.SelectedArticleType() == option.blogPostTemplateID) {
            selectedItems = new Array();
            ko.utils.arrayForEach(viewModel.SearchFilters.BlogFilters(), function (item) {
                if (item.IsSelected() == true) {
                    selectedItems.push(item.ID());
                }
            });
            if (selectedItems.length > 0) {
                queryString += (queryString != "" ? "&" : "?");
                queryString += "blogs=" + selectedItems.join();
            }
        }
        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
            if (item.IsSelected() == true && item.ID() != guidEmpty) {
                selectedItems.push(item.ID());
            }
        });
        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "articletypes=" + selectedItems.join();
        }   
        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.DateFilters(), function (item) {
            if (item.IsSelected() == true) {
                selectedItems.push(item.ID());
                var dateArray = item.Url().split("|");
                if (!!dateArray && dateArray.length == 2) {
                    viewModel.SearchFilters.DateFrom(dateArray[0])
                    viewModel.SearchFilters.DateTo(dateArray[1])
                }
            }
        });
        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "date=" + selectedItems.join();
        } else {
            viewModel.SearchFilters.DateFrom("")
            viewModel.SearchFilters.DateTo("")
        }
        if (!!viewModel.SearchFilters.DateFrom() && viewModel.SearchFilters.DateFrom().length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "datefrom=" + viewModel.SearchFilters.DateFrom();
        }
        if (!!viewModel.SearchFilters.DateTo() && viewModel.SearchFilters.DateTo().length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "dateto=" + viewModel.SearchFilters.DateTo();
        }
        if (viewModel.SearchFilters.Skip() > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "skip=" + viewModel.SearchFilters.Skip();
        }
        if (viewModel.SearchFilters.CurrentViewID() != '') {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "currentviewid=" + viewModel.SearchFilters.CurrentViewID();
        }
        queryString += (queryString != "" ? "&" : "?");
        queryString += "reload=" + viewModel.SearchFilters.ReloadFilters();
        queryString += (queryString != "" ? "&" : "?");
        queryString += "scroll=" + $(window).scrollTop();        
        return queryString;
    };

    // Run search by pushing new state
    viewModel.Search = function () {
        if (viewModel.HasPendingUpdates() == false) {
            return;
        }
        
        viewModel.SearchFilters.Skip(0);
        var qs = viewModel.QueryString();
        viewModel.ScrollPositionUpdate(false);
        History.pushState({ qs: qs }, History.options.initialTitle, qs);
    }

    viewModel.KeywordSearch = function () {
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
        $('input.text-input').blur();
    }

    // Load next page
    viewModel.LoadNextPage = function () {
        viewModel.SearchFilters.Skip(viewModel.GridData().length);
        var qs = viewModel.QueryString();
        viewModel.ScrollPositionUpdate(false);
        History.pushState({ qs: qs }, History.options.initialTitle, qs);
    }

    viewModel.LoadMorePodcasts = function () {
        viewModel.PodcastPageNumber(viewModel.PodcastPageNumber() + 1);
        var model =  {
            Skip: viewModel.MediaViewModel.Podcasts().length,
            Take: viewModel.MediaViewModel.PodcastPageSize(),
            PinnedItems: viewModel.MediaViewModel.PodcastPinnedItems(),
            CurrentViewID: viewModel.SearchFilters.CurrentViewID()
        }
        $.ajax({
            url: option.podcastUrl,
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: ko.mapping.toJSON(model),
            cache: false,
            success: function (data) {
                var results = ko.observableArray();
                ko.mapping.fromJS(data.GridData, {}, results);
                ko.utils.arrayForEach(results(), function (item) {
                    viewModel.MediaViewModel.Podcasts.push(item);
                });
                viewModel.MediaViewModel.PodcastResultCount(data.ResultCount);

            },
            error: function (xhr, textStatus, errorThrown) {
                console.log(xhr);
                console.log("textStatus : " + textStatus);
                console.log("errorThrown : " + errorThrown);
            }
        });
    }
    viewModel.LoadMoreVideos = function () {
        viewModel.VideoPageNumber(viewModel.VideoPageNumber() + 1);
        var model =  {
            Skip: viewModel.MediaViewModel.Videos().length,
            Take: viewModel.MediaViewModel.VideoPageSize(),
            PinnedItems: viewModel.MediaViewModel.VideoPinnedItems(),
            CurrentViewID: viewModel.SearchFilters.CurrentViewID()
        }
        $.ajax({
            url: option.videoUrl,
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: ko.mapping.toJSON(model),
            cache: false,
            success: function (data) {
                var results = ko.observableArray();
                ko.mapping.fromJS(data.GridData, {}, results);
                ko.utils.arrayForEach(results(), function (item) {
                    viewModel.MediaViewModel.Videos.push(item);
                });
                viewModel.MediaViewModel.VideoResultCount(data.ResultCount);

            },
            error: function (xhr, textStatus, errorThrown) {
                console.log(xhr);
                console.log("textStatus : " + textStatus);
                console.log("errorThrown : " + errorThrown);
            }
        });
    }
    // Load data from server
    viewModel.LoadDataFromServer = function () {
        if(viewModel.IsResourceView() == true) {
            viewModel.SetResourceView();
            return true;
        }
        viewModel.IsSearchRunning(true);
        var viewModelToSend = GetRequestObject(viewModel.SearchFilters);

        $.ajax({
            url: option.serviceUrl,
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: ko.mapping.toJSON(viewModelToSend),
            cache: false,
            success: function (data) {
                var results = ko.observableArray();
                var resultsUpcoming = ko.observableArray();
                if (viewModel.SearchFilters.Skip() == 0) {
                    viewModel.ResultCount(0);
                    viewModel.GridData.removeAll();
                    viewModel.UpcomingEvents.removeAll();
                }
                ko.mapping.fromJS(data.GridData, {}, results);
                ko.utils.arrayForEach(results(), function (item) {
                    viewModel.GridData.push(item);
                });

                ko.mapping.fromJS(data.UpcomingEvents, {}, resultsUpcoming);
                ko.utils.arrayForEach(resultsUpcoming(), function (item) {
                    viewModel.UpcomingEvents.push(item);
                });

                viewModel.ResultCount(data.ResultCount);
                viewModel.HasMoreResults(data.HasMoreResults);
                viewModel.SearchFilters.KeywordFilter(data.SearchFilters.KeywordFilter);
                ko.mapping.fromJS(data.SearchFilters.ArticleTypeFilters, {}, viewModel.SearchFilters.ArticleTypeFilters);
                if (viewModel.SearchFilters.ReloadFilters() == true) {
                    ko.mapping.fromJS(data.SearchFilters.PracticeFilters, {}, viewModel.SearchFilters.PracticeFilters);
                    ko.mapping.fromJS(data.SearchFilters.IndustryFilters, {}, viewModel.SearchFilters.IndustryFilters);
                    ko.mapping.fromJS(data.SearchFilters.OfficeFilters, {}, viewModel.SearchFilters.OfficeFilters);
                    ko.mapping.fromJS(data.SearchFilters.TypeFilters, {}, viewModel.SearchFilters.TypeFilters);
                    ko.mapping.fromJS(data.SearchFilters.EventTypeFilters, {}, viewModel.SearchFilters.EventTypeFilters);
                    ko.mapping.fromJS(data.SearchFilters.BlogFilters, {}, viewModel.SearchFilters.BlogFilters);
                    ko.mapping.fromJS(data.SearchFilters.TopicFilters, {}, viewModel.SearchFilters.TopicFilters);
                    ko.mapping.fromJS(data.SearchFilters.ProBonoFilters, {}, viewModel.SearchFilters.ProBonoFilters);
                }
                viewModel.HasSearchRun(viewModel.HasSelectedFilters());
                if (viewModel.HasSearchRun() == false) {
                    // Call Isotope To Form Reform Grid 
                    $loadMoreGrid.trigger("reload-isotope");
                }
                viewModel.SearchFilters.ReloadFilters(data.SearchFilters.ReloadFilters);

                viewModel.SetSelectedFilters();

                viewModel.HasPendingUpdates(false);

                viewModel.IsSearchRunning(false);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.log(xhr);
                console.log("textStatus : " + textStatus);
                console.log("errorThrown : " + errorThrown);
            }
        });
    }

    // Animations for new lit items
    viewModel.animateGridInsert = function (elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn(800) }
    viewModel.animateGridDelete = function (elem) { if (elem.nodeType === 1) $(elem).fadeOut(800, function () { $(elem).remove(); }) }

    // Clear page and reload filters
    viewModel.ClearPage = function () {
        viewModel.SearchFilters.ReloadFilters(true);
        viewModel.SearchFilters.ClearAllSearchFilters();
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    }

    // Clear all filters and run search
    viewModel.SearchFilters.ClearSelectedFilters = function () {
        viewModel.SearchFilters.ClearAllSearchFilters();
        viewModel.SelectedFilters.removeAll();
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    };

    // Clear all filters
    viewModel.SearchFilters.ClearAllSearchFilters = function (callBack) {
        viewModel.SearchFilters.KeywordFilter('');
        viewModel.SearchFilters.ClearAdvancedSearchFilters(callBack);
    };

    viewModel.SearchFilters.ClearAdvancedSearchFilters = function (callBack) {
        ko.utils.arrayForEach(viewModel.SearchFilters.PracticeFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.IndustryFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.TypeFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.EventTypeFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.ProBonoFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.TopicFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.BlogFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
            item.IsSelected(false);            
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.DateFilters(), function (item) {
            item.IsSelected(false);
        });
        viewModel.SearchFilters.DateFrom('');
        viewModel.SearchFilters.DateTo('');
        if (!!callBack && $.isFunction(callBack)) {
            callBack();
        }
    };

    // Clear Keyword Filter
    viewModel.SearchFilters.KeywordFilter.ClearFilter = function () {
        viewModel.SearchFilters.KeywordFilter('');
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    };

    viewModel.ScrollTo = function(id) {
        document.getElementById(id).scrollIntoView({
            behavior:'smooth'
        })
    }
    // Set selected filters
    viewModel.SetSelectedFilters = function () {
        var practiceCount = 0;
        var officeCount = 0;
        var industryCount = 0;
        viewModel.SelectedFilters.removeAll();
        if (viewModel.CurrentViewName() != 'Global') {
            var newItem = {
                ID: ko.observable(regionIDKey),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: ko.observable(viewModel.CurrentViewName()),
                Label: ko.observable(viewModel.CurrentViewName()),
                Url: ko.observable('#0')
            };
            newItem.ClearFilter = function () {
                viewModel.SearchFilters.CurrentViewID(GetViewIdByName('Global'));
                viewModel.HasPendingUpdates(true);
                viewModel.Search();
            };
            viewModel.SelectedFilters.push(newItem);
        }
        if (viewModel.SearchFilters.KeywordFilter() != null && viewModel.SearchFilters.KeywordFilter().length > 0) {
            var newItem = {
                ID: ko.observable(keyWordIDKey),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: ko.observable(viewModel.SearchFilters.KeywordFilter()),
                Label: ko.observable(option.keyWordLabel),
                Url: ko.observable('#0')
            };
            newItem.ClearFilter = function () {
                viewModel.SearchFilters.KeywordFilter('');
                viewModel.HasPendingUpdates(true);
                viewModel.Search();
            };
            viewModel.SelectedFilters.push(newItem);
        }
        if (viewModel.SelectedArticleType() != option.mediaTemplateID) {
            ko.utils.arrayForEach(viewModel.SearchFilters.PracticeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
            ko.utils.arrayForEach(viewModel.SearchFilters.IndustryFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
        }        
        if (viewModel.SelectedArticleType() == option.mediaTemplateID) {
            ko.utils.arrayForEach(viewModel.SearchFilters.TopicFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
            });
        }
        
        if (viewModel.SelectedArticleType() == option.newsUpdateTemplateID) {
            ko.utils.arrayForEach(viewModel.SearchFilters.TypeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
        }
        if (viewModel.SelectedArticleType() == option.eventTemplateID) {
            ko.utils.arrayForEach(viewModel.SearchFilters.EventTypeFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
            ko.utils.arrayForEach(viewModel.SearchFilters.ProBonoFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
        }
        if (viewModel.SelectedArticleType() == option.blogPostTemplateID) {
            ko.utils.arrayForEach(viewModel.SearchFilters.BlogFilters(), function (item) {
                if (item.IsSelected() == true) {
                    viewModel.SelectedFilters.push(item);
                }
            });
        }
        ko.utils.arrayForEach(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
            if (item.IsSelected() == true && item.ID() != guidEmpty) {
                viewModel.SelectedFilters.push(item);
            }
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.DateFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
        });
    }

    viewModel.SelectKeywordCorrection = function (keywordCorrection) {
        viewModel.SearchFilters.KeywordFilter(keywordCorrection.Keyword());
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    }

    viewModel.SelectedFilters.HasFilters = ko.computed(function () {
        var nonRegionFilter = ko.utils.arrayFirst(viewModel.SelectedFilters(), function (item) {
            return (item.ID() != regionIDKey);
        });
        return nonRegionFilter != null;
    }, viewModel);

    viewModel.HasSelectedFilters = function () {
        if (viewModel.SearchFilters.KeywordFilter() != null && viewModel.SearchFilters.KeywordFilter().length > 0) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.PracticeFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.IndustryFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.TypeFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.EventTypeFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.ProBonoFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.BlogFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.TopicFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.ArticleTypeFilters(), function (item) {
            return (item.IsSelected() == true && item.ID() != guidEmpty);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.DateFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        return false;
    }

    viewModel.SetCurrentViewField = function (currentViewID) {
        viewModel.SearchFilters.CurrentViewID(currentViewID);
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
        return false;
    }

    viewModel.SearchFilters.CurrentViewID.subscribe(function (currentViewID) {
        SetCurrentViewName(currentViewID);
    });

    function SetCurrentViewName(newValue) {
        var selectedOption = localViewOptions.filter('[local-view-id="' + newValue + '"]')
        viewModel.CurrentViewName(selectedOption.text());
    };

    function GetViewIdByName(name) {
        return $(".js-local-view-options li[data-local-view-name='Global']").data('local-view-id');
    }

    // Set Current View Name
    SetCurrentViewName(viewModel.SearchFilters.CurrentViewID());

    // Set filters that might have been included from a back button
    viewModel.SetSelectedFilters();

    // Apply Bindings
    ko.applyBindings(viewModel, pageContent.get(0));

    // Check for scroll in query string
    var qsParms = parseQueryString(window.location.href);
    var scrollPosition = 0;
    if (!!qsParms.scroll && qsParms.scroll.length > 0) {
        scrollPosition = parseInt(qsParms.scroll);
    }
    if (viewModel.SelectedFilters.HasFilters()) {
        viewModel.HasSearchRun(true);
    }
    $("html, body").animate({ scrollTop: scrollPosition }, "slow");

    // Custom binding hor history click
    ko.bindingHandlers.bindHistoryClick = {
        init: function (element, valueAccessor) {
            var anchorTag = $(element);
            var observable = valueAccessor();

            anchorTag.on("click tap", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var qs = viewModel.QueryString();
                viewModel.ScrollPositionUpdate(true);
                History.replaceState({ qs: qs }, History.options.initialTitle, qs);

                if (observable.NavigateLink.Target() == "_blank")
                {
                    window.open(observable.NavigateLink.Url(), '_blank');
                }
                else
                {
                    window.location = observable.NavigateLink.Url();
                }
            });
        }
    }
};