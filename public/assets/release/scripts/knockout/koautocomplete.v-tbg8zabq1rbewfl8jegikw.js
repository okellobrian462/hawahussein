ko.bindingHandlers.bindAutoComplete = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var acInput = $(element);
        var observable = valueAccessor();
        var allBindings = allBindingsAccessor();
        var root = bindingContext.$root;

        var autoCompleteSection = allBindings.bindAutoCompleteSection;
        var autoCompleteField = allBindings.bindAutoCompleteField;
        var autoCompleteMaxResults = 7;
        if (!!allBindings && !!allBindings.bindAutoCompleteMaxResults && allBindings.bindAutoCompleteMaxResults != '') {
            autoCompleteMaxResults = allBindings.bindAutoCompleteMaxResults;
        }
        var autoCompleteUrl = allBindings.bindAutoCompleteServiceUrl;
        var autoCompleteAppendTo = allBindings.bindAutoCompleteAppendTo;

        var appendTo = null
        if (!!autoCompleteAppendTo && autoCompleteAppendTo != '') {
            appendTo = $(autoCompleteAppendTo);
        }

        var pattern, formattedResult, termArry;
        // Copied From jquery.autocomplete.js for custom formatting
        var
            utils = (function () {
                return {
                    escapeRegExChars: function (value) {
                        return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                    },
                    createNode: function (containerClass) {
                        var div = document.createElement('div');
                        div.className = containerClass;
                        div.style.position = 'absolute';
                        div.style.display = 'none';
                        return div;
                    }
                };
            }()),

            keys = {
                ESC: 27,
                TAB: 9,
                RETURN: 13,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40
            };

        var ac = acInput.autocomplete({
            maxHeight: '100%',
            appendTo: appendTo,
            serviceUrl: autoCompleteUrl,
            noCache: true,
            minChars: 3,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            triggerSelectOnValidInput: false,
            onSearchStart: function (query) {
                //$(this).autocomplete().options.params.section = ko.isObservable(autoCompleteSection) ? autoCompleteSection() : null;
            },
            params: { section: null, field: autoCompleteField },
            onSelect: function (value) {
                if (value.isLink == true) {
                    window.location.href = value.Url;
                } else {
                    var isValid = true;
                    var selectedFilter;
                    if ($.isFunction(viewModel.GenerateTypeAheadFilter)) {
                        selectedFilter = viewModel.GenerateTypeAheadFilter(value);
                        isValid = (!!selectedFilter);
                    }
                    console.log("selectedFilter", selectedFilter)
                    if (isValid == true) {
                        if (!!selectedFilter) {
                            observable('');
                            selectedFilter.IsSelected(true);
                        } else {
                            if ($.isFunction(viewModel.ClearAllSearchFilters)) {
                                viewModel.ClearAllSearchFilters();
                            }
                        }
                        if ($.isFunction(root.RedirectToUrl)) {
                            root.RedirectToUrl(value);
                        } else if ($.isFunction(root.Search)) {
                            if (root.hasOwnProperty('HasPendingUpdates') && ko.isObservable(root['HasPendingUpdates'])) {
                                root.HasPendingUpdates(true);
                            }
                            root.Search();
                        }
                    }
                }
            },
            transformResult: function (response, originalQuery) {
                var autoCompleteResultCount = 0;
                return {
                    suggestions: $.map(response, function (dataItem) {
                        if (autoCompleteResultCount < autoCompleteMaxResults) {
                            if (dataItem.IsLink == true) {
                                autoCompleteResultCount++;
                                return { data: { category: dataItem.Category, id: dataItem.ID }, value: dataItem.Name, Url: dataItem.Url, isLink: dataItem.IsLink, CssClass: dataItem.CssClass };
                            }
                            var isValid = true;
                            if ($.isFunction(viewModel.HasFilter)) {
                                isValid = viewModel.HasFilter(dataItem);
                            }
                            if (isValid == true) {
                                autoCompleteResultCount++;
                                return { data: { category: dataItem.Category, id: dataItem.ID }, value: dataItem.Name, Url: dataItem.Url, isLink: dataItem.IsLink, CssClass: dataItem.CssClass };
                            }
                        }
                        return [];
                    })
                };
            },
            formatResult: function (suggestion, currentValue) {
                termArry = currentValue.replace('"', '').replace('”', '').replace('“', '').split(' ');
                if (termArry.length > 0) {
                    //sort terms longest to shortest for multiple search terms that may start with same letters (i.e. searching John J)
                    termArry = termArry.sort(function (a, b) {
                        return b.length - a.length;
                    });
                    formattedResult = suggestion.value;
                    pattern = '';
                    for (var i = 0; i < termArry.length; i++) {
                        var keyTerm = termArry[i].trim().replace('"', '').replace('"', '');
                        if (keyTerm.length > 0) {
                            //Matching start of string or matching start of word including all characters or matching start of word surrounded in quotes
                            //Ignores span tag and class if already replaced
                            pattern = '((\\s' + utils.escapeRegExChars(keyTerm) + ')|(^' + utils.escapeRegExChars(keyTerm) + ')|(\\s"' + utils.escapeRegExChars(keyTerm) + '))(?![^<>]*>)';
                            formattedResult = formattedResult.replace(new RegExp(pattern, 'gi'), '<span class="auto-term">$1<\/span>');
                        }
                    }
                }

                return "<span class='label'>" + formattedResult + "</span>";
            }
        });
    }
}