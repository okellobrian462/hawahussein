jQuery.fn.InitializeSearchPage = function (option) {
    var defaults = {
        initialJsonData: null,
        serviceUrl: null,
        defaultViewID: null
    };
    var option = $.extend({}, defaults, option);

    // Load JSON data from model
    var viewModelJs = JSON.parse(option.initialJsonData);
    var viewModel = ko.mapping.fromJS(viewModelJs)
    var guidEmpty = '00000000-0000-0000-0000-000000000000'

    var pageContent = $(this);

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
    var firstNameIDKey = 'FIRSTNAME';
    var lastNameIDKey = 'LASTNAME';
    var regionIDKey = 'REGION';

    // Extend View Model
    viewModel.SelectedFilters = ko.observableArray();
    viewModel.IsSearchRunning = ko.observable(false);
    viewModel.HasSearchRun = ko.observable(false);
    viewModel.HasPendingUpdates = ko.observable(false);
    viewModel.ScrollPositionUpdate = ko.observable(false);
    viewModel.SchoolTypeAheadFilter = ko.observable('');
    viewModel.CourtTypeAheadFilter = ko.observable('');
    viewModel.CurrentViewName = ko.observable('');
    viewModel.ActiveID = ko.observable('');

    viewModel.filterone = ko.observable(true);
    viewModel.filtertwo = ko.observable(false);

    // Onstate change for history
    window.onstatechange = function () {
        var currentState = History.getState();
        var qs = History.getState().data['qs'];
        var qsParms = !!qs ? parseQueryString(qs) : {};

        var currentSkip = viewModel.GridData().length;
        var newSkip = 0;
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
            if (!!qsParms.firstname && qsParms.firstname.length > 0) {
                viewModel.SearchFilters.FirstNameFilter(qsParms.firstname);
                hasFilters = true;
            }
            if (!!qsParms.lastname && qsParms.lastname.length > 0) {
                viewModel.SearchFilters.LastNameFilter(qsParms.lastname);
                hasFilters = true;
            }
            if (!!qsParms.letter && qsParms.letter.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.LetterFilters(), function (item) {
                    if (item.Name() == qsParms.letter) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.sort && qsParms.sort.length > 0) {
                viewModel.SearchFilters.SortField(qsParms.sort);
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
            if (!!qsParms.offices && qsParms.offices.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.OfficeFilters(), function (item) {
                    if (qsParms.offices.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.title && qsParms.title.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.TitleFilters(), function (item) {
                    if (qsParms.title.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.schools && qsParms.schools.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.SchoolFilters(), function (item) {
                    if (qsParms.schools.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!!qsParms.courts && qsParms.courts.length > 0) {
                ko.utils.arrayForEach(viewModel.SearchFilters.CourtFilters(), function (item) {
                    if (qsParms.courts.indexOf(item.ID()) >= 0) {
                        item.IsSelected(true);
                        hasFilters = true;
                    }
                });
            }
            if (!viewModel.ScrollPositionUpdate()) {
                viewModel.LoadDataFromServer();
            }

            //Trigger Custom Site Improve
            if (typeof (_szOper) != 'undefined') {
                _szOper.onHistoryChange();
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

    viewModel.SearchFilters.GenerateTypeAheadFilter = function (filter) {
        if (filter.data.category == "schools") {
            var selectedFilter = ko.utils.arrayFirst(viewModel.SearchFilters.SchoolFilters(), function (item) {
                return (item.ID() == filter.data.id);
            });
            ko.utils.arrayForEach(viewModel.SearchFilters.SchoolFilters(), function (item) {
                item.IsSelected(false);
            });
            if (!!selectedFilter) {
                selectedFilter.IsSelected(true);
                return selectedFilter;
            }
            var newItem = {
                ID: ko.observable(filter.data.id),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: filter.value,
                Url: ko.observable('#0')
            };
            viewModel.SearchFilters.SchoolFilters.push(newItem);
            return newItem;
        } else if (filter.data.category == "courts") {
            var selectedFilter = ko.utils.arrayFirst(viewModel.SearchFilters.CourtFilters(), function (item) {
                return (item.ID() == filter.data.id);
            });
            ko.utils.arrayForEach(viewModel.SearchFilters.CourtFilters(), function (item) {
                item.IsSelected(false);
            });
            if (!!selectedFilter) {
                selectedFilter.IsSelected(true);
                return selectedFilter;
            }
            var newItem = {
                ID: ko.observable(filter.data.id),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: filter.value,
                Url: ko.observable('#0')
            };
            viewModel.SearchFilters.CourtFilters.push(newItem);
            return newItem;
        }
        return null;
    }

    viewModel.SearchFilters.HasFilter = function (filter) {        
        if (filter.Category == "schools") {
            var selectedFilter = ko.utils.arrayFirst(viewModel.SearchFilters.SchoolFilters(), function (item) {
                return (item.ID() == filter.ID);
            });
            if (!!selectedFilter) {
                return !selectedFilter.IsSelected();
            }
            return true;
        }
        else if (filter.Category == "courts") {
            var selectedFilter = ko.utils.arrayFirst(viewModel.SearchFilters.CourtFilters(), function (item) {
                return (item.ID() == filter.ID);
            });
            if (!!selectedFilter) {
                return !selectedFilter.IsSelected();
            }
            return true;
        }
        return false;
    }

    // Build query string based on filters
    viewModel.QueryString = function () {
        var queryString = "";
        if (viewModel.SearchFilters.KeywordFilter() != null && viewModel.SearchFilters.KeywordFilter().length > 0) {
            queryString += (queryString != "" ? "&" : "?"); 
            queryString += "keyword=" + encodeURIComponent(viewModel.SearchFilters.KeywordFilter());
        }
        if (viewModel.SearchFilters.FirstNameFilter() != null && viewModel.SearchFilters.FirstNameFilter().length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "firstname=" + encodeURIComponent(viewModel.SearchFilters.FirstNameFilter());
        }
        if (viewModel.SearchFilters.LastNameFilter() != null && viewModel.SearchFilters.LastNameFilter().length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "lastname=" + encodeURIComponent(viewModel.SearchFilters.LastNameFilter());
        }
        var letter = '';
        ko.utils.arrayForEach(viewModel.SearchFilters.LetterFilters(), function (item) {
            if (item.IsSelected() == true) {
                letter = item.Name();
            }
        });
        if (letter.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "letter=" + letter;
        }
        var selectedItems = new Array();
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

        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.TitleFilters(), function (item) {
            if (item.IsSelected() == true) {
                selectedItems.push(item.ID());
            }
        });

        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "title=" + selectedItems.join();
        }

        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.OfficeFilters(), function (item) {
            if (item.IsSelected() == true) {
                selectedItems.push(item.ID());
            }
        });

        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "offices=" + selectedItems.join();
        }
        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.SchoolFilters(), function (item) {
            if (item.IsSelected() == true && item.ID() != guidEmpty) {
                selectedItems.push(item.ID());
            }
        });
        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "schools=" + selectedItems.join();
        }
        selectedItems = new Array();
        ko.utils.arrayForEach(viewModel.SearchFilters.CourtFilters(), function (item) {
            if (item.IsSelected() == true && item.ID() != guidEmpty) {
                selectedItems.push(item.ID());
            }
        });
        if (selectedItems.length > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "courts=" + selectedItems.join();
        }
        if (viewModel.SearchFilters.Skip() > 0) {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "skip=" + viewModel.SearchFilters.Skip();
        }
        if (viewModel.SearchFilters.SortField() != '') {
            queryString += (queryString != "" ? "&" : "?");
            queryString += "sort=" + viewModel.SearchFilters.SortField();
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
    viewModel.Search = function (forceSearch) {
        if (viewModel.HasPendingUpdates() == false) {
            return;
        }
        //viewModel.HasMoreResults(false);
        viewModel.SearchFilters.Skip(0);
        var qs = viewModel.QueryString();
        if (!!forceSearch && forceSearch === true) {
            qs += (qs != "" ? "&" : "?");
            qs += "&forceSearch=true";
        }
        viewModel.ScrollPositionUpdate(false);
        History.pushState({ qs: qs }, History.options.initialTitle, qs);
    }

    viewModel.KeywordSearch = function () {
        viewModel.HasPendingUpdates(true);
        viewModel.Search(true);
        $('input.text-input').blur();
    }

    // Load next page
    viewModel.LoadNextPage = function () {
        viewModel.SearchFilters.Skip(viewModel.GridData().length);
        var qs = viewModel.QueryString();
        viewModel.ScrollPositionUpdate(false);
        History.pushState({ qs: qs }, History.options.initialTitle, qs);
    }

    function htmlUnescape(str) {
        if (str === null)
            return str;
        else
        return str.replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }

    // Load data from server
    viewModel.LoadDataFromServer = function () {
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
                if (viewModel.SearchFilters.Skip() == 0) {
                    viewModel.ResultCount(0);
                    viewModel.GridData.removeAll();
                }
                ko.mapping.fromJS(data.GridData, {}, results);
                ko.utils.arrayForEach(results(), function (item) {
                    viewModel.GridData.push(item);
                });

                
                viewModel.ResultCount(data.ResultCount);
                viewModel.HasMoreResults(data.HasMoreResults);
                if(data.SearchFilters.KeywordFilter != null)
                    viewModel.SearchFilters.KeywordFilter(htmlUnescape(decodeURI(data.SearchFilters.KeywordFilter)));
                if(data.SearchFilters.FirstNameFilter != null)
                    viewModel.SearchFilters.FirstNameFilter(htmlUnescape(decodeURI(data.SearchFilters.FirstNameFilter)));
                if(data.SearchFilters.LastNameFilter != null)
                    viewModel.SearchFilters.LastNameFilter(htmlUnescape(decodeURI(data.SearchFilters.LastNameFilter)));
                if (viewModel.SearchFilters.ReloadFilters() == true) {
                    ko.mapping.fromJS(data.SearchFilters.LetterFilters, {}, viewModel.SearchFilters.LetterFilters);
                    ko.mapping.fromJS(data.SearchFilters.PracticeFilters, {}, viewModel.SearchFilters.PracticeFilters);
                    ko.mapping.fromJS(data.SearchFilters.IndustryFilters, {}, viewModel.SearchFilters.IndustryFilters);
                    ko.mapping.fromJS(data.SearchFilters.OfficeFilters, {}, viewModel.SearchFilters.OfficeFilters);
                    ko.mapping.fromJS(data.SearchFilters.TitleFilters, {}, viewModel.SearchFilters.TitleFilters);
                    ko.mapping.fromJS(data.SearchFilters.SchoolFilters, {}, viewModel.SearchFilters.SchoolFilters);
                    ko.mapping.fromJS(data.SearchFilters.CourtFilters, {}, viewModel.SearchFilters.CourtFilters);                    
                }
                viewModel.HasSearchRun(viewModel.HasSelectedFilters());
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
        viewModel.SearchFilters.FirstNameFilter('');
        viewModel.SearchFilters.LastNameFilter('');
        viewModel.SearchFilters.ClearAdvancedSearchFilters(callBack);
        ko.utils.arrayForEach(viewModel.SearchFilters.LetterFilters(), function (item) {
            item.IsSelected(false);
        });
    };

    viewModel.SearchFilters.ClearAdvancedSearchFilters = function (callBack) {
        viewModel.SearchFilters.KeywordFilter('');
        viewModel.SearchFilters.FirstNameFilter('');
        viewModel.SearchFilters.LastNameFilter('');

        ko.utils.arrayForEach(viewModel.SearchFilters.PracticeFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.IndustryFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.OfficeFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.TitleFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.SchoolFilters(), function (item) {
            item.IsSelected(false);
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.CourtFilters(), function (item) {
            item.IsSelected(false);
        });
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

    viewModel.SearchFilters.FirstNameFilter.ClearFilter = function () {
        viewModel.SearchFilters.FirstNameFilter('');
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    };

    viewModel.SearchFilters.LastNameFilter.ClearFilter = function () {
        viewModel.SearchFilters.LastNameFilter('');
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
    };

    // Set selected filters
    viewModel.SetSelectedFilters = function () {
        viewModel.SelectedFilters.removeAll();
    /*    if (viewModel.SearchFilters.CurrentViewID() != option.defaultViewID) {
            var newItem = {
                ID: ko.observable(regionIDKey),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: ko.observable(viewModel.CurrentViewName()),
                Label: ko.observable(viewModel.CurrentViewName()),
                Url: ko.observable('#0')
            };
            newItem.ClearFilter = function () {
                viewModel.SearchFilters.ReloadFilters(true);
                viewModel.SearchFilters.CurrentViewID(option.defaultViewID);
                viewModel.SearchFilters.KeywordFilter('');
                viewModel.HasPendingUpdates(true);                
                viewModel.Search();
            };
            viewModel.SelectedFilters.push(newItem);
        }*/
        var hasOffice = viewModel.SearchFilters.OfficeFilters().some(function (filter) { return filter.IsSelected() });
        if (viewModel.CurrentViewName() != 'Global' && !hasOffice) {
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
        }
        var hasTitle = viewModel.SearchFilters.TitleFilters().some(function (filter) { return filter.IsSelected() });
        if (viewModel.CurrentViewName() != 'Global' && !hasTitle) {
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
       
        if (viewModel.SearchFilters.FirstNameFilter() != null && viewModel.SearchFilters.FirstNameFilter().length > 0) {
            var newItem = {
                ID: ko.observable(firstNameIDKey),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: ko.observable(viewModel.SearchFilters.FirstNameFilter()),
                Label: ko.observable(option.firstNameLabel),
                Url: ko.observable('#0')
            };
            newItem.ClearFilter = function () {
                viewModel.SearchFilters.FirstNameFilter('');
                viewModel.HasPendingUpdates(true);
                viewModel.Search();
            };
            viewModel.SelectedFilters.push(newItem);
        }
        if (viewModel.SearchFilters.LastNameFilter() != null && viewModel.SearchFilters.LastNameFilter().length > 0) {
            var newItem = {
                ID: ko.observable(lastNameIDKey),
                IsEnabled: ko.observable(true),
                IsSelected: ko.observable(true),
                Name: ko.observable(viewModel.SearchFilters.LastNameFilter()),
                Label: ko.observable(option.lastNameLabel),
                Url: ko.observable('#0')
            };
            newItem.ClearFilter = function () {
                viewModel.SearchFilters.LastNameFilter('');
                viewModel.HasPendingUpdates(true);
                viewModel.Search();
            };
            viewModel.SelectedFilters.push(newItem);
        }
        ko.utils.arrayForEach(viewModel.SearchFilters.LetterFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
        });
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
        ko.utils.arrayForEach(viewModel.SearchFilters.OfficeFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.TitleFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.SchoolFilters(), function (item) {
            if (item.IsSelected() == true) {
                viewModel.SelectedFilters.push(item);
            }
        });
        ko.utils.arrayForEach(viewModel.SearchFilters.CourtFilters(), function (item) {
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
        if (viewModel.SearchFilters.CurrentViewID() != option.defaultViewID) {
            return true;
        }
        if (viewModel.SearchFilters.KeywordFilter() != null && viewModel.SearchFilters.KeywordFilter().length > 0) {
            return true;
        }
        if (viewModel.SearchFilters.FirstNameFilter() != null && viewModel.SearchFilters.FirstNameFilter().length > 0) {
            return true;
        }
        if (viewModel.SearchFilters.LastNameFilter() != null && viewModel.SearchFilters.LastNameFilter().length > 0) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.LetterFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
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
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.OfficeFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.TitleFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.SchoolFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        var hasItem = ko.utils.arrayFirst(viewModel.SearchFilters.CourtFilters(), function (item) {
            return (item.IsSelected() == true);
        });
        if (hasItem != null) {
            return true;
        }
        return false;
    }

    // Click action for sort sort links
    viewModel.SetSortField = function (sortField, event) {       
        if (sortField == 0) {
            viewModel.filterone(true);
            viewModel.filtertwo(false);
        }
        else {
            viewModel.filterone(false);
            viewModel.filtertwo(true);
        }

        $(event.target).siblings().removeClass('active');
        $(event.target).addClass('active');
        viewModel.SearchFilters.SortField(sortField);
        viewModel.HasPendingUpdates(true);
        viewModel.Search();
        return false;
    }

    viewModel.SetCurrentViewField = function (currentViewID) {
        viewModel.SearchFilters.CurrentViewID(currentViewID);
        viewModel.HasPendingUpdates(true);
        viewModel.ClearPage();
        return false;
    }

    viewModel.SearchFilters.CurrentViewID.subscribe(function (currentViewID) {
        SetCurrentViewName(currentViewID);
    });

    function SetCurrentViewName(newValue) {
        var selectedOption = localViewOptions.filter('[local-view-id="' + newValue + '"]');
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

                var qs = viewModel.QueryString();
                viewModel.ScrollPositionUpdate(true);
                History.replaceState({ qs: qs }, History.options.initialTitle, qs);

                window.location = observable.Url();
            });
        }
    }
};
